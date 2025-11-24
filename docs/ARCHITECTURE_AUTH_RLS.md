# Auth0 + Supabase RLS Architecture

## Overview
This document describes the recommended architecture for using Auth0 authentication with Supabase RLS policies through a Golang API.

## Architecture Decision

**Pattern**: Trusted API with JWT Transformation
- **Frontend**: Auth0 authentication only
- **Golang API**: JWT validation + transformation + database operations
- **Supabase**: RLS policies enforced at database level

## Why This Approach?

### ✅ Advantages
1. **Single Source of Truth**: Golang API controls all data access
2. **RLS Benefits**: Database-level security, defense in depth
3. **Clean Separation**: Auth (Auth0) vs Data (Supabase) vs Logic (Go)
4. **Scalability**: API can scale independently
5. **Security**: No database credentials in frontend
6. **Flexibility**: Easy to swap Auth0 or Supabase later

### ⚠️ Considerations
- Additional complexity: JWT transformation in API
- One extra hop: Frontend → API → Supabase (minimal latency)
- Need to manage Supabase JWT secret in Go API

## Implementation Guide

### 1. Golang API - JWT Transformation

```go
// internal/auth/supabase_jwt.go
package auth

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

// SupabaseJWTClaims represents the claims Supabase expects
type SupabaseJWTClaims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// GenerateSupabaseJWT creates a JWT that Supabase RLS policies can read
func GenerateSupabaseJWT(userID, email string) (string, error) {
    claims := SupabaseJWTClaims{
        UserID: userID,
        Email:  email,
        Role:   "authenticated",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "your-api",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    
    // Sign with Supabase JWT secret
    secret := []byte(os.Getenv("SUPABASE_JWT_SECRET"))
    return token.SignedString(secret)
}
```

### 2. Golang API - Middleware Chain

```go
// internal/middleware/auth.go
package middleware

import (
    "context"
    "strings"
    "github.com/gin-gonic/gin"
    "github.com/auth0/go-jwt-middleware/v2/validator"
    "your-app/internal/auth"
)

// Auth0Middleware validates Auth0 JWT and extracts user claims
func Auth0Middleware() gin.HandlerFunc {
    issuerURL := os.Getenv("AUTH0_ISSUER_URL")
    audience := os.Getenv("AUTH0_AUDIENCE")
    
    jwtValidator, _ := validator.New(
        validator.NewCachingIssuer(ctx, issuerURL),
        audience,
    )
    
    return func(c *gin.Context) {
        // Extract and validate Auth0 token
        tokenString := extractBearerToken(c.Request.Header.Get("Authorization"))
        
        if tokenString == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "Missing authorization"})
            return
        }
        
        token, err := jwtValidator.ValidateToken(context.Background(), tokenString)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
            return
        }
        
        // Extract claims
        claims := token.(*validator.ValidatedClaims)
        userID := claims.RegisteredClaims.Subject
        email := claims.CustomClaims["email"].(string)
        
        // Generate Supabase JWT for RLS
        supabaseJWT, err := auth.GenerateSupabaseJWT(userID, email)
        if err != nil {
            c.AbortWithStatusJSON(500, gin.H{"error": "Failed to generate token"})
            return
        }
        
        // Store in context for use in handlers
        c.Set("user_id", userID)
        c.Set("user_email", email)
        c.Set("supabase_jwt", supabaseJWT)
        
        c.Next()
    }
}

func extractBearerToken(header string) string {
    parts := strings.Split(header, " ")
    if len(parts) == 2 && parts[0] == "Bearer" {
        return parts[1]
    }
    return ""
}
```

### 3. Golang API - Supabase Client with RLS

```go
// internal/database/supabase.go
package database

import (
    "github.com/supabase-community/supabase-go"
)

// GetSupabaseClientWithAuth creates a Supabase client with user-specific JWT
// This allows RLS policies to work correctly
func GetSupabaseClientWithAuth(supabaseJWT string) *supabase.Client {
    url := os.Getenv("SUPABASE_URL")
    anonKey := os.Getenv("SUPABASE_ANON_KEY")
    
    client, _ := supabase.NewClient(url, anonKey, &supabase.ClientOptions{
        Headers: map[string]string{
            "Authorization": "Bearer " + supabaseJWT,
        },
    })
    
    return client
}

// GetSupabaseServiceClient creates admin client that bypasses RLS
// Use ONLY for operations that need to bypass RLS (e.g., user creation)
func GetSupabaseServiceClient() *supabase.Client {
    url := os.Getenv("SUPABASE_URL")
    serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    client, _ := supabase.NewClient(url, serviceKey, nil)
    return client
}
```

### 4. Golang API - Handler Example

```go
// internal/handlers/albums.go
package handlers

import (
    "github.com/gin-gonic/gin"
    "your-app/internal/database"
)

// GetUserAlbums fetches albums for the authenticated user
// RLS policy automatically filters to user's albums
func GetUserAlbums(c *gin.Context) {
    // Get Supabase JWT from middleware
    supabaseJWT, exists := c.Get("supabase_jwt")
    if !exists {
        c.JSON(500, gin.H{"error": "Missing auth context"})
        return
    }
    
    // Create Supabase client with user's JWT (RLS will apply)
    client := database.GetSupabaseClientWithAuth(supabaseJWT.(string))
    
    // Query - RLS automatically filters to this user's albums
    var albums []Album
    err := client.DB.From("albums").
        Select("*").
        Execute(&albums)
    
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch albums"})
        return
    }
    
    c.JSON(200, albums)
}

// CreateAlbum creates a new album for the authenticated user
func CreateAlbum(c *gin.Context) {
    userID, _ := c.Get("user_id")
    supabaseJWT, _ := c.Get("supabase_jwt")
    
    var input struct {
        Name        string `json:"name"`
        Description string `json:"description"`
    }
    
    if err := c.BindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": "Invalid input"})
        return
    }
    
    client := database.GetSupabaseClientWithAuth(supabaseJWT.(string))
    
    album := Album{
        Name:        input.Name,
        Description: input.Description,
        UserID:      userID.(string), // Explicitly set from JWT
    }
    
    var result []Album
    err := client.DB.From("albums").
        Insert(album).
        Execute(&result)
    
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to create album"})
        return
    }
    
    c.JSON(201, result[0])
}
```

### 5. Supabase - RLS Policies

```sql
-- Enable RLS on albums table
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own albums
CREATE POLICY "Users can view own albums" 
ON albums 
FOR SELECT 
USING (
    auth.user_id() = user_id
);

-- Policy: Users can only insert their own albums
CREATE POLICY "Users can create own albums" 
ON albums 
FOR INSERT 
WITH CHECK (
    auth.user_id() = user_id
);

-- Policy: Users can only update their own albums
CREATE POLICY "Users can update own albums" 
ON albums 
FOR UPDATE 
USING (auth.user_id() = user_id)
WITH CHECK (auth.user_id() = user_id);

-- Policy: Users can only delete their own albums
CREATE POLICY "Users can delete own albums" 
ON albums 
FOR DELETE 
USING (auth.user_id() = user_id);

-- PostgreSQL function to extract user_id from JWT
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'user_id',
    ''
  )::text;
$$ LANGUAGE SQL STABLE;
```

### 6. Environment Variables

**Golang API (.env)**
```bash
# Auth0 Configuration
AUTH0_ISSUER_URL=https://your-tenant.region.auth0.com/
AUTH0_AUDIENCE=your-api-identifier

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Configuration
PORT=8080
```

**Next.js Frontend (.env.local)**
```bash
# Auth0 Configuration
AUTH0_SECRET=...
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.region.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Flow Diagram

```
User Action: Fetch Albums
│
├─► 1. Next.js: Get Auth0 token
│       const token = await getAccessToken()
│
├─► 2. Next.js: Call Golang API
│       fetch('/api/albums', {
│         headers: { Authorization: `Bearer ${token}` }
│       })
│
├─► 3. Golang: Validate Auth0 JWT
│       middleware.Auth0Middleware()
│       • Verifies signature
│       • Checks expiry
│       • Extracts user_id
│
├─► 4. Golang: Generate Supabase JWT
│       supabaseJWT = GenerateSupabaseJWT(user_id, email)
│       • Minimal claims: user_id, role
│       • Signed with Supabase secret
│
├─► 5. Golang: Query with Supabase client
│       client := GetSupabaseClientWithAuth(supabaseJWT)
│       client.From("albums").Select("*")
│
├─► 6. Supabase: Apply RLS policy
│       WHERE user_id = auth.user_id()
│       • Reads user_id from JWT claims
│       • Filters rows automatically
│
└─► 7. Return filtered results to frontend
```

## Security Benefits

### Defense in Depth (Multiple Layers)
1. **Layer 1**: Frontend validates Auth0 session
2. **Layer 2**: API validates Auth0 JWT signature
3. **Layer 3**: API checks token expiry and audience
4. **Layer 4**: Supabase RLS enforces data isolation
5. **Layer 5**: Database-level constraints

### Why This Matters
- If API code has a bug (e.g., forgot to filter by user_id), RLS catches it
- If someone bypasses API (impossible but defensive), RLS still protects
- Audit trail: RLS policies are versioned with database schema
- Compliance: Many regulations require database-level security

## Performance Considerations

### JWT Generation Overhead
- ~1-2ms per request (negligible)
- Can cache Supabase JWT for same user (30-60 min TTL)
- Trade-off: Minimal latency for significant security benefit

### Connection Pooling
```go
// Use connection pooling for efficiency
var supabaseClients = make(map[string]*supabase.Client)
var clientMutex sync.RWMutex

func GetCachedSupabaseClient(jwt string) *supabase.Client {
    // Implement client pooling with JWT hash as key
    // Reduces client initialization overhead
}
```

## Scalability

### Horizontal Scaling
- ✅ Golang API: Stateless, scales horizontally
- ✅ Supabase: Managed, auto-scaling
- ✅ Auth0: Managed, global CDN

### Load Distribution
```
┌────────────┐
│  Load LB   │
└─────┬──────┘
      │
   ┌──┴──┬──────┬──────┐
   │     │      │      │
┌──▼──┐ ┌▼───┐ ┌▼───┐ ┌▼───┐
│ API │ │API │ │API │ │API │
│  1  │ │ 2  │ │ 3  │ │ 4  │
└──┬──┘ └┬───┘ └┬───┘ └┬───┘
   │     │      │      │
   └──┬──┴──────┴──────┘
      │
┌─────▼────────┐
│   Supabase   │
│ (Pooled DBs) │
└──────────────┘
```

## Alternative: Direct RLS (No JWT Transform)

If you want even simpler (but less portable):

```go
// Set Supabase settings directly in SQL query
func GetUserAlbums(c *gin.Context) {
    userID, _ := c.Get("user_id")
    
    // Raw SQL with SET LOCAL (session-level setting)
    query := `
        SET LOCAL request.jwt.claims = '{"user_id": "%s"}';
        SELECT * FROM albums;
    `
    
    db.Exec(fmt.Sprintf(query, userID))
}
```

**Trade-off**: Simpler but ties you to PostgreSQL-specific features.

## Testing RLS Policies

```sql
-- Test as specific user
SET LOCAL request.jwt.claims = '{"user_id": "auth0|123"}';

SELECT * FROM albums;
-- Should only return albums for user auth0|123

INSERT INTO albums (name, user_id) VALUES ('Test', 'auth0|456');
-- Should fail: user_id doesn't match JWT
```

## Monitoring & Observability

```go
// Log RLS policy violations
func LogRLSViolation(userID, table, action string) {
    logger.Warn("RLS policy blocked action",
        zap.String("user_id", userID),
        zap.String("table", table),
        zap.String("action", action),
    )
}
```

## Summary

**This approach gives you:**
- ✅ Auth0 for authentication (best-in-class)
- ✅ Supabase RLS for authorization (database-level)
- ✅ Golang API as trusted intermediary
- ✅ Clean separation of concerns
- ✅ Defense in depth security
- ✅ Scalability and flexibility

**Complexity Trade-off:**
- JWT transformation adds ~50 lines of code
- Benefit: Database-level security + audit compliance
- Worth it for production applications handling sensitive data

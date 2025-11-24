# User Record Synchronization Strategy

## Architecture Decision: Lazy User Creation

### Pattern: Just-In-Time (JIT) User Provisioning

**When**: On first authenticated API request after Auth0 login
**Where**: Golang API middleware
**How**: Idempotent upsert operation

## Why This Approach?

### ✅ Advantages

1. **Simplicity**
   - No webhooks to configure
   - No external dependencies
   - Self-contained in your API

2. **Reliability**
   - Automatic retry on failure (user tries again)
   - No webhook delivery failures
   - No missed events

3. **Data Consistency**
   - User created only when they actually use the app
   - Avoids orphaned Auth0 accounts (signed up but never used)
   - Single source of truth: Your API controls creation

4. **Cost Efficiency**
   - Don't store records for users who never return
   - Supabase rows only for active users

5. **Security**
   - User data flows through authenticated channel
   - No public webhook endpoints
   - Validated JWT before creating user

### ⚠️ Trade-offs

- **First Request Latency**: ~50-100ms extra on first API call (one-time)
- **Solution**: Async background job or optimistic UI

## Implementation

### 1. Database Schema

```sql
-- users table in Supabase
CREATE TABLE users (
    -- Primary key: Use Auth0 user_id (sub claim)
    id TEXT PRIMARY KEY,  -- e.g., "auth0|123456789"
    
    -- Core identity fields (synced from Auth0)
    email TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    name TEXT,
    picture TEXT,
    
    -- Application-specific fields
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_key UNIQUE(email)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.user_id() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.user_id() = id)
    WITH CHECK (auth.user_id() = id);

-- Index for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### 2. Golang API - User Service

```go
// internal/services/user_service.go
package services

import (
    "context"
    "time"
    "github.com/supabase-community/supabase-go"
)

type User struct {
    ID            string    `json:"id" db:"id"`
    Email         string    `json:"email" db:"email"`
    EmailVerified bool      `json:"email_verified" db:"email_verified"`
    Name          string    `json:"name" db:"name"`
    Picture       string    `json:"picture" db:"picture"`
    CreatedAt     time.Time `json:"created_at" db:"created_at"`
    UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
    LastLoginAt   time.Time `json:"last_login_at" db:"last_login_at"`
}

type UserService struct {
    supabaseClient *supabase.Client
}

func NewUserService(client *supabase.Client) *UserService {
    return &UserService{
        supabaseClient: client,
    }
}

// EnsureUserExists creates or updates user record (idempotent)
// This is called on every authenticated request
func (s *UserService) EnsureUserExists(ctx context.Context, userID, email, name, picture string) (*User, error) {
    // Try to get existing user first
    var existingUser []User
    err := s.supabaseClient.DB.
        From("users").
        Select("*").
        Eq("id", userID).
        Single().
        Execute(&existingUser)
    
    if err == nil && len(existingUser) > 0 {
        // User exists, update last_login_at
        return s.updateLastLogin(ctx, userID)
    }
    
    // User doesn't exist, create new record
    return s.createUser(ctx, userID, email, name, picture)
}

// createUser creates a new user record
func (s *UserService) createUser(ctx context.Context, userID, email, name, picture string) (*User, error) {
    now := time.Now()
    
    user := User{
        ID:            userID,
        Email:         email,
        EmailVerified: true, // Auth0 handles verification
        Name:          name,
        Picture:       picture,
        CreatedAt:     now,
        UpdatedAt:     now,
        LastLoginAt:   now,
    }
    
    var result []User
    err := s.supabaseClient.DB.
        From("users").
        Insert(user).
        Execute(&result)
    
    if err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }
    
    if len(result) == 0 {
        return nil, fmt.Errorf("no user returned after insert")
    }
    
    return &result[0], nil
}

// updateLastLogin updates the last login timestamp
func (s *UserService) updateLastLogin(ctx context.Context, userID string) (*User, error) {
    update := map[string]interface{}{
        "last_login_at": time.Now(),
    }
    
    var result []User
    err := s.supabaseClient.DB.
        From("users").
        Update(update).
        Eq("id", userID).
        Execute(&result)
    
    if err != nil {
        return nil, fmt.Errorf("failed to update last login: %w", err)
    }
    
    if len(result) == 0 {
        return nil, fmt.Errorf("user not found")
    }
    
    return &result[0], nil
}

// GetUser fetches a user by ID
func (s *UserService) GetUser(ctx context.Context, userID string) (*User, error) {
    var users []User
    err := s.supabaseClient.DB.
        From("users").
        Select("*").
        Eq("id", userID).
        Single().
        Execute(&users)
    
    if err != nil {
        return nil, fmt.Errorf("user not found: %w", err)
    }
    
    if len(users) == 0 {
        return nil, fmt.Errorf("user not found")
    }
    
    return &users[0], nil
}
```

### 3. Golang API - Enhanced Middleware

```go
// internal/middleware/auth_with_user_sync.go
package middleware

import (
    "context"
    "strings"
    "github.com/gin-gonic/gin"
    "github.com/auth0/go-jwt-middleware/v2/validator"
    "your-app/internal/auth"
    "your-app/internal/database"
    "your-app/internal/services"
)

// AuthWithUserSync validates Auth0 JWT and ensures user exists in Supabase
func AuthWithUserSync() gin.HandlerFunc {
    issuerURL := os.Getenv("AUTH0_ISSUER_URL")
    audience := os.Getenv("AUTH0_AUDIENCE")
    
    jwtValidator, _ := validator.New(
        validator.NewCachingIssuer(context.Background(), issuerURL),
        audience,
    )
    
    return func(c *gin.Context) {
        // 1. Extract and validate Auth0 token
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
        
        // 2. Extract claims from Auth0 token
        claims := token.(*validator.ValidatedClaims)
        userID := claims.RegisteredClaims.Subject
        
        // Extract custom claims
        customClaims := claims.CustomClaims.(map[string]interface{})
        email := customClaims["email"].(string)
        name := customClaims["name"].(string)
        picture := customClaims["picture"].(string)
        
        // 3. Generate Supabase JWT for RLS
        supabaseJWT, err := auth.GenerateSupabaseJWT(userID, email)
        if err != nil {
            c.AbortWithStatusJSON(500, gin.H{"error": "Failed to generate token"})
            return
        }
        
        // 4. Ensure user exists in Supabase (JIT provisioning)
        // Use service role client for user creation (bypasses RLS)
        serviceClient := database.GetSupabaseServiceClient()
        userService := services.NewUserService(serviceClient)
        
        user, err := userService.EnsureUserExists(
            context.Background(),
            userID,
            email,
            name,
            picture,
        )
        
        if err != nil {
            // Log error but don't fail request (graceful degradation)
            log.Printf("Failed to sync user: %v", err)
            // Continue - user can still access app, just won't be in DB
        }
        
        // 5. Store in context for use in handlers
        c.Set("user_id", userID)
        c.Set("user_email", email)
        c.Set("user", user) // Full user object
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

### 4. Golang API - Route Setup

```go
// cmd/api/main.go
package main

import (
    "github.com/gin-gonic/gin"
    "your-app/internal/middleware"
    "your-app/internal/handlers"
)

func main() {
    router := gin.Default()
    
    // Public routes (no auth required)
    router.GET("/health", handlers.HealthCheck)
    
    // Protected routes (auth required + user sync)
    protected := router.Group("/api")
    protected.Use(middleware.AuthWithUserSync())
    {
        // User endpoints
        protected.GET("/user/profile", handlers.GetUserProfile)
        protected.PUT("/user/profile", handlers.UpdateUserProfile)
        
        // Album endpoints (RLS will filter by user_id)
        protected.GET("/albums", handlers.GetUserAlbums)
        protected.POST("/albums", handlers.CreateAlbum)
        protected.GET("/albums/:id", handlers.GetAlbum)
        protected.PUT("/albums/:id", handlers.UpdateAlbum)
        protected.DELETE("/albums/:id", handlers.DeleteAlbum)
        
        // Image generation endpoints
        protected.POST("/generate", handlers.GenerateImage)
        protected.GET("/generations", handlers.GetGenerations)
    }
    
    router.Run(":8080")
}
```

### 5. Handler Example - Using Synced User

```go
// internal/handlers/user.go
package handlers

import (
    "github.com/gin-gonic/gin"
    "your-app/internal/services"
)

// GetUserProfile returns the current user's profile
func GetUserProfile(c *gin.Context) {
    // User was already synced by middleware
    user, exists := c.Get("user")
    if !exists {
        c.JSON(500, gin.H{"error": "User not found in context"})
        return
    }
    
    c.JSON(200, user)
}

// UpdateUserProfile updates user profile fields
func UpdateUserProfile(c *gin.Context) {
    userID, _ := c.Get("user_id")
    supabaseJWT, _ := c.Get("supabase_jwt")
    
    var input struct {
        Name string `json:"name"`
    }
    
    if err := c.BindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": "Invalid input"})
        return
    }
    
    // Use user-specific client (RLS applies)
    client := database.GetSupabaseClientWithAuth(supabaseJWT.(string))
    userService := services.NewUserService(client)
    
    update := map[string]interface{}{
        "name": input.Name,
    }
    
    var result []services.User
    err := client.DB.
        From("users").
        Update(update).
        Eq("id", userID).
        Execute(&result)
    
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to update profile"})
        return
    }
    
    c.JSON(200, result[0])
}
```

### 6. Frontend - Next.js API Client

```typescript
// lib/api/client.ts
class APIClient {
    private baseURL: string;
    
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    }
    
    private async getAuthHeaders(): Promise<HeadersInit> {
        const accessToken = await getAccessToken();
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        };
    }
    
    // User operations
    async getUserProfile() {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}/api/user/profile`, {
            headers,
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        
        return response.json();
    }
    
    async updateUserProfile(data: { name: string }) {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}/api/user/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        
        return response.json();
    }
    
    // Album operations
    async getAlbums() {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}/api/albums`, {
            headers,
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch albums');
        }
        
        return response.json();
    }
    
    async createAlbum(data: { name: string; description: string }) {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseURL}/api/albums`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Failed to create album');
        }
        
        return response.json();
    }
}

export const apiClient = new APIClient();
```

### 7. Frontend - React Hook Example

```typescript
// hooks/useUserProfile.ts
import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { apiClient } from '@/lib/api/client';

export function useUserProfile() {
    const { user: auth0User, isLoading: auth0Loading } = useUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!auth0User) {
            setLoading(false);
            return;
        }
        
        // Fetch user profile from your API
        // This triggers user sync on first load
        apiClient.getUserProfile()
            .then(setProfile)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [auth0User]);
    
    return {
        profile,
        loading: auth0Loading || loading,
        error,
    };
}
```

## Performance Optimization

### 1. Caching Strategy

```go
// Cache user lookups to reduce DB queries
var userCache = make(map[string]*services.User)
var cacheMutex sync.RWMutex
var cacheTTL = 5 * time.Minute

func getCachedUser(userID string) (*services.User, bool) {
    cacheMutex.RLock()
    defer cacheMutex.RUnlock()
    
    user, exists := userCache[userID]
    return user, exists
}

func setCachedUser(userID string, user *services.User) {
    cacheMutex.Lock()
    defer cacheMutex.Unlock()
    
    userCache[userID] = user
    
    // Expire cache after TTL
    go func() {
        time.Sleep(cacheTTL)
        cacheMutex.Lock()
        delete(userCache, userID)
        cacheMutex.Unlock()
    }()
}
```

### 2. Async User Sync (Advanced)

```go
// For high-traffic apps, sync user asynchronously
func AuthWithAsyncUserSync() gin.HandlerFunc {
    return func(c *gin.Context) {
        // ... validate JWT ...
        
        // Check cache first
        user, cached := getCachedUser(userID)
        
        if !cached {
            // Sync user in background
            go func() {
                serviceClient := database.GetSupabaseServiceClient()
                userService := services.NewUserService(serviceClient)
                user, _ := userService.EnsureUserExists(
                    context.Background(),
                    userID, email, name, picture,
                )
                setCachedUser(userID, user)
            }()
        }
        
        // Continue request without waiting
        c.Set("user_id", userID)
        c.Next()
    }
}
```

## Monitoring & Observability

```go
// Add metrics for user sync
import "github.com/prometheus/client_golang/prometheus"

var (
    userSyncDuration = prometheus.NewHistogram(
        prometheus.HistogramOpts{
            Name: "user_sync_duration_seconds",
            Help: "Time taken to sync user record",
        },
    )
    
    userSyncErrors = prometheus.NewCounter(
        prometheus.CounterOpts{
            Name: "user_sync_errors_total",
            Help: "Total number of user sync errors",
        },
    )
)

func (s *UserService) EnsureUserExists(ctx context.Context, ...) (*User, error) {
    start := time.Now()
    defer func() {
        userSyncDuration.Observe(time.Since(start).Seconds())
    }()
    
    user, err := s.ensureUserExistsImpl(ctx, ...)
    if err != nil {
        userSyncErrors.Inc()
    }
    
    return user, err
}
```

## Data Minimization

### What to Store in Supabase

**Store:**
- ✅ `id` (Auth0 user_id) - Required for RLS
- ✅ `email` - For notifications, support
- ✅ `name` - Display purposes
- ✅ `picture` - Avatar
- ✅ Application data (subscription, preferences, etc.)
- ✅ Timestamps (created_at, last_login_at)

**Don't Store:**
- ❌ Password (Auth0 handles this)
- ❌ Auth0 tokens (security risk)
- ❌ Sensitive PII (unless required by business logic)
- ❌ Full Auth0 profile (sync only what you need)

### Auth0 is Source of Truth

```
┌─────────────────────────────────────────┐
│           Auth0 (Identity)              │
│  • Email                                │
│  • Password                             │
│  • MFA                                  │
│  • Social connections                   │
│  • Email verification                   │
└────────────┬────────────────────────────┘
             │ Sync minimal fields
             ↓
┌─────────────────────────────────────────┐
│      Supabase (Application Data)        │
│  • User ID (reference)                  │
│  • Email (denormalized for queries)     │
│  • Subscription data                    │
│  • User preferences                     │
│  • Albums, images, etc.                 │
└─────────────────────────────────────────┘
```

## Testing Strategy

```go
// internal/middleware/auth_test.go
func TestAuthWithUserSync(t *testing.T) {
    // Test 1: New user is created on first request
    t.Run("creates user on first login", func(t *testing.T) {
        // ... setup mock Auth0 JWT ...
        // ... make request ...
        // Assert user was created in DB
    })
    
    // Test 2: Existing user updates last_login_at
    t.Run("updates existing user login time", func(t *testing.T) {
        // ... create user in DB ...
        // ... make request ...
        // Assert last_login_at was updated
    })
    
    // Test 3: Handles DB errors gracefully
    t.Run("continues on sync error", func(t *testing.T) {
        // ... setup DB to fail ...
        // ... make request ...
        // Assert request still succeeds (graceful degradation)
    })
}
```

## Summary: Clean & Scalable User Sync

### ✅ Best Practices Implemented

1. **Lazy Creation**: User created on first API use
2. **Idempotent**: Safe to call multiple times
3. **Minimal Data**: Only store what's needed
4. **Auth0 as Source**: Don't duplicate auth logic
5. **Graceful Degradation**: App works even if sync fails
6. **RLS Ready**: User ID stored for policies
7. **Observable**: Metrics and logging built-in
8. **Cacheable**: Reduces DB load
9. **Testable**: Clear separation of concerns

### Performance Characteristics

- **First Request**: ~50-100ms (user creation)
- **Subsequent Requests**: <5ms (cached or simple SELECT)
- **At Scale**: Horizontal scaling of API handles load

### When This Pattern Works Best

- ✅ B2C SaaS applications
- ✅ Apps with Auth0 + database backend
- ✅ Microservices architecture
- ✅ High user growth (don't store unused accounts)
- ✅ Need RLS for security compliance

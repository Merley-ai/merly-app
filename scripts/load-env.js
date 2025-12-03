/**
 * Preload environment variables before New Relic agent starts
 * This ensures NEW_RELIC_ENABLED and other env vars are available
 */
const { config } = require('dotenv')
const path = require('path')

// Load .env.local first (highest priority), then .env
config({ path: path.resolve(process.cwd(), '.env.local') })
config({ path: path.resolve(process.cwd(), '.env') })

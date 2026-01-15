// Set test environment variables before any modules are loaded
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.REDIS_PASSWORD = "test";
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "10";
process.env.ALLOWED_ORIGINS = "http://localhost:3000";

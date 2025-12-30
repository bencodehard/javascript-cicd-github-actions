import dotenv from "dotenv";

dotenv.config();

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),

  // Database
  databaseUrl: required(process.env.DATABASE_URL, "DATABASE_URL"),

  // Redis
  redis: {
    host: required(process.env.REDIS_HOST, "REDIS_HOST"),
    port: parseInt(required(process.env.REDIS_PORT, "REDIS_PORT"), 10),
    username: process.env.REDIS_USERNAME,
    password: required(process.env.REDIS_PASSWORD, "REDIS_PASSWORD"),
    db: parseInt(process.env.REDIS_DB || "0", 10),
  },

  // Auth
  auth: {
    jwtSecret: required(process.env.JWT_SECRET, "JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
  },
  
};
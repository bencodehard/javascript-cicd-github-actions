import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  email: string;
}

export const signToken = (payload: JwtPayload): string => {
  const secret: Secret = env.auth.jwtSecret;

  const options: SignOptions = {
    // cast ผ่าน unknown → ให้ TS หยุดโวยเรื่อง StringValue
    expiresIn: env.auth.jwtExpiresIn as unknown as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  const secret: Secret = env.auth.jwtSecret;
  return jwt.verify(token, secret) as JwtPayload;
};
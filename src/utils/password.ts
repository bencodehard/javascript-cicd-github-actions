import bcrypt from "bcrypt";
import { env } from "../config/env";

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const saltRounds = env.auth.bcryptSaltRounds;
  return bcrypt.hash(plainPassword, saltRounds);
};

export const verifyPassword = async (
  plainPassword: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hash);
};
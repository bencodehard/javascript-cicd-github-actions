import { prisma } from "../config/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import type { User } from "../generated/prisma/client";
import { getUserFromCache, setUserToCache, invalidateUserCache } from "../cache/userCache";

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  // ไม่คืน passwordHash ออกไปข้างนอก
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isMatch = await verifyPassword(input.password, user.passwordHash);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = signToken({ userId: user.id, email: user.email });

  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
};

export const getUserById = async (
  userId: string
): Promise<Omit<User, "passwordHash"> | null> => {
  // 1) check cache
  const cached = await getUserFromCache(userId);
  if (cached) {
    const { passwordHash: _, ...safeUser } = cached;
    return safeUser;
  }

  // 2) find from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  // 3) keep in cache
  await setUserToCache(user);

  const { passwordHash: _pw, ...safeUser } = user;
  return safeUser;
};

export const getUserByIdRaw = async (userId: string): Promise<User | null> => {
  const cached = await getUserFromCache(userId);
  if (cached) {
    return cached;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  await setUserToCache(user);
  return user;
};

export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
}

export const updateCurrentUser = async (
  input: UpdateUserInput
): Promise<Omit<User, "passwordHash">> => {
  const { userId, firstName, lastName } = input;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      // ถ้าจะให้ update field อื่น เพิ่มได้ที่นี่
    },
  });

  // invalidate cache
  await invalidateUserCache(userId);

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};
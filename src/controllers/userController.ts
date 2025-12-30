import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  updateCurrentUser,
} from "../services/userService";
import { AuthRequest } from "../middleware/auth";

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await registerUser({ email, password, firstName, lastName });
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ message: "Email already in use" });
    }
    console.error("registerHandler error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await loginUser({ email, password });
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    console.error("loginHandler error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const meHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("meHandler error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserByIdHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("getUserByIdHandler error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMeHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { firstName, lastName } = req.body;

    if (firstName === undefined && lastName === undefined) {
      return res
        .status(400)
        .json({ message: "At least one of firstName or lastName is required" });
    }

    const updatedUser = await updateCurrentUser({
      userId: req.user.userId,
      firstName,
      lastName,
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error("updateMeHandler error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  meHandler,
  getUserByIdHandler,
  updateMeHandler,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", authMiddleware, meHandler);

router.get("/:id", authMiddleware, getUserByIdHandler);
router.patch("/me", authMiddleware, updateMeHandler);

export { router as userRoutes };
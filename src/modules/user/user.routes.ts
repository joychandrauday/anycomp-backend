import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import {
    getMe,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from "./user.controller";

const router = Router();

// Get current authenticated user
router.get("/me", authMiddleware, getMe);

// Get all users (admin only, you can add role-check middleware later)
router.get("/", authMiddleware, getAllUsers);

// Get single user by ID
router.get("/:id", authMiddleware, getUserById);

// Update user by ID
router.put("/:id", authMiddleware, updateUser);

// Delete user by ID
router.delete("/:id", authMiddleware, deleteUser);

export { router as userRoutes };

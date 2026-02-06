import { Response } from "express";
import { AuthRequest } from "../auth/auth.middleware";
import { UserService } from "./user.service";

const service = new UserService();

// Get current authenticated user
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await service.getUserById(req.user?.id ?? "");
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await service.getAllUser();
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get single user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const user = await service.getUserById(req.params.id);
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(404).json({ success: false, error: error.message });
    }
};

// Update user by ID
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const updatedUser = await service.updateUser(req.params.id, req.body);
        res.json({ success: true, data: updatedUser, message: "User updated successfully" });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Delete user by ID
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        await service.deleteUser(req.params.id);
        res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

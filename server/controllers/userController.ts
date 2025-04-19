// server/controllers/userController.ts

import { Request, Response } from "express";
import { userService } from "../services/userService";
import { AuthenticatedRequest } from "server/middleware/authMiddleware";

export const userController = {
  async getUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await userService.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get user" });
    }
  },

  async getAllUsers (req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  },

  async createUser(req: Request, res: Response) {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json(newUser);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userIdToDelete = parseInt(id);
    const authUser = req.user!;

    if (authUser.role !== "admin" && authUser.id !== userIdToDelete) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own account." });
    }

    try {
      await userService.deleteUser(userIdToDelete);
      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
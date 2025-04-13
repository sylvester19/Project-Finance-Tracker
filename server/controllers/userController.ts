// server/controllers/userController.ts

import { Request, Response } from "express";
import { userService } from "../services/userService";

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

  async getUserByUsername(req: Request, res: Response) {
    try {
      const username = req.params.username;
      const user = await userService.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get user by username" });
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
};
// server/services/userService.ts

import { storage } from "../storage";
import { InsertUser, User } from "@shared/schema";

export const userService = {
  async getUser(id: number): Promise<User | undefined> {
    return storage.getUser(id);
  },

  async createUser(user: InsertUser): Promise<User> {
    // Add any business logic or validation here before creating the user
    return storage.createUser(user);
  },

  async deleteUser (userId: number): Promise<void> {
    return storage.deleteUser(userId);
  } 
};
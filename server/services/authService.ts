import { storage } from "../storage";
import { hashPassword, comparePasswords } from "../../utils/session";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { z } from "zod";
import { userLoginSchema, userRegisterSchema } from "@shared/schema";

const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "7", 10);

type LoginInput = z.infer<typeof userLoginSchema>;
type RegisterInput = z.infer<typeof userRegisterSchema>;

export const authService = {
  async register(data: RegisterInput) {
    const existing = await storage.getUserByUsername(data.username);
    if (existing) throw new Error("Username already exists");

    // const hashed = await hashPassword(data.password);
    return storage.createUser(data);
  },

  async login(data: LoginInput) {
    const user = await storage.getUserByUsername(data.username);
    if (!user || !(await comparePasswords(data.password, user.password))) {
      throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    await storage.saveRefreshToken(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const dbToken = await storage.getRefreshToken(refreshToken);
    if (!dbToken || new Date(dbToken.expiresAt) < new Date()) {
      throw new Error("Refresh token expired or invalid");
    }

    return generateAccessToken({
      id: parseInt(payload.userId),
      role: payload.role,
    });
  },

  async logout(refreshToken: string) {
    await storage.deleteRefreshToken(refreshToken);
  },

  async getSession(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const dbToken = await storage.getRefreshToken(refreshToken);
    if (!dbToken || new Date(dbToken.expiresAt) < new Date()) {
      throw new Error("Invalid or expired token");
    }

    const user = await storage.getUser(parseInt(payload.userId));
    if (!user) throw new Error("User not found");

    const { password, ...userData } = user;
    return userData;
  }
};

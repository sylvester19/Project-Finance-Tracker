import { storage } from "../storage";
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
    // Debugging log to verify username check
    console.log(`🔍 Checking for existing user with username: ${data.username}`);
    
    const existing = await storage.getUserByUsername(data.username);
    if (existing) {
      console.log(`Username ${data.username} already exists`);
      throw new Error("Username already exists");
    }

    console.log(`✅ No duplicate found, creating user: ${data.username}`);
    // Assuming password is hashed before inserting
    // const hashedPassword = await hashPassword(data.password);
    const { confirmPassword, ...sanitized } = data;
    return storage.createUser(sanitized);
  },

  async login(data: LoginInput) {
    const user = await storage.verifyUser(data.username, data.password);

    if (!user) {
      throw new Error("[login-service] Invalid credentials");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    await storage.updateRefreshToken(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    try {
      console.log("[refresh] Incoming token:", refreshToken);
  
      const payload = verifyRefreshToken(refreshToken); // includes id, username, name, role
      console.log("[refresh] Verified payload:", payload);
  
      const dbSession = await storage.getSessionTokenByUserId(payload.id);
      console.log("[refresh] Session token from DB:", dbSession);
  
      if (!dbSession) {
        throw new Error("[DB] No session found for user");
      }
  
      if (dbSession.refreshToken !== refreshToken) {
        throw new Error("[DB] Refresh token mismatch");
      }
  
      if (new Date(dbSession.expiresAt) < new Date()) {
        throw new Error("[DB] Refresh token expired");
      }
  
      // 🔍 Fetch full user details for token generation
      const user = await storage.getUser(payload.id);
      if (!user) {
        throw new Error("[refresh-service] User not found");
      }
  
      const userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
  
      // 🔁 Generate new refresh token and update DB
      const newRefreshToken = generateRefreshToken(userData);
      await storage.updateRefreshToken(user.id, newRefreshToken, new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
      console.log("[refresh] Refresh token updated in DB.");
  
      // 🔐 Generate new access token
      const accessToken = generateAccessToken(userData);
  
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      console.error("[authService] Refresh token error:", error.message);
      throw new Error("[authService] Refresh token error: " + error.message);
    }
  },
  
  
  async logout(refreshToken: string) {
    await storage.deleteRefreshToken(refreshToken);
  },

  
};

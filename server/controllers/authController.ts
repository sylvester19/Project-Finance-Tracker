import { Request, Response } from "express";
import { authService } from "../services/authService";

const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "7", 10);

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);
     
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { accessToken, refreshToken } = await authService.login(req.body);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      res.json({ accessToken });
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { accessToken, refreshToken } = await authService.refresh(req.cookies.refreshToken);

      // Set the new refresh token in an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only set secure in production
        sameSite: "strict", // Or 'lax' depending on your needs
        expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      });

      res.json({ accessToken });
    } catch (err: any) {
      console.error("Refresh token error:", err); // Log the error
      res.status(403).json({ message: err.message || "Invalid refresh token" }); // Provide a more informative error message
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out" });
  },

};

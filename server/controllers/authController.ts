import { Request, Response } from "express";
import { authService } from "../services/authService";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
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
      const newToken = await authService.refresh(req.cookies.refreshToken);
      res.json({ accessToken: newToken });
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out" });
  },

  async session(req: Request, res: Response) {
    try {
      const user = await authService.getSession(req.cookies.refreshToken);
      res.json(user);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  }
};

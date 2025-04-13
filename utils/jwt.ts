// utils/jwt.ts
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export function generateAccessToken(user: { id: number; role: string }) {
  return jwt.sign({ userId: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(user: { id: number }) {
  return jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}

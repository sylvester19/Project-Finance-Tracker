import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRoleType } from "../shared/schema";

dotenv.config();

const JWT_SECRET = process.env.MY_JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.MY_REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "7", 10);

export interface DecodedToken {
  userId: string;
  role: UserRoleType;
}

export function generateAccessToken(user: { id: number; role: string }) {
  return jwt.sign(
    { id: user.id.toString(), role: user.role },  // Use 'id' instead of 'userId'
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
}


export function generateRefreshToken(user: { id: number; role: string }) {
  return jwt.sign(
    { id: user.id.toString(), role: user.role },  // Change 'userId' to 'id'
    REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );
}


export function verifyRefreshToken(token: string): DecodedToken {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedToken;
}

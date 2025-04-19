import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRoleType } from "../shared/schema";

dotenv.config();

const JWT_SECRET = process.env.MY_JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.MY_REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "7", 10);

export interface DecodedToken {
  id: number;
  username: string;
  name: string;
  role: UserRoleType;
  exp: number; // Token expiration timestamp (in seconds since epoch)
  iat: number; // (Optional) Issued at timestamp
}

export function generateAccessToken(user: {
  id: number;
  username: string;
  name: string;
  role: UserRoleType;
}) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    }
  );
}

export function generateRefreshToken(user: {
  id: number;
  username: string;
  name: string;
  role: UserRoleType;
}) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    }
  );
}

export function verifyRefreshToken(token: string): DecodedToken {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedToken;
}

import { Request, Response, NextFunction } from "express";
import { storage } from "../server/storage";
import { UserRoleType } from "../shared/schema";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface DecodedToken {
  userId: string;
  role: UserRoleType;
}


const JWT_SECRET: string = (() => {
  const key = process.env.MY_JWT_SECRET;
  if (!key) throw new Error("Missing MY_JWT_SECRET in environment variables");
  return key;
})();


export async function authenticateViaJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    req.userId = parseInt(decoded.userId);
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired access token" });
  }
}

export function authorizeRole(allowedRoles: UserRoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role, userId } = req; 

    if (!role || !userId || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
}

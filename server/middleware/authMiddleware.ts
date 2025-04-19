import { Request, Response, NextFunction } from "express";
import { UserRoleType } from "../../shared/schema";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { DecodedToken } from "utils/jwt";

dotenv.config();


export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: UserRoleType;
  };
}

const JWT_SECRET: string = (() => {
  const key = process.env.MY_JWT_SECRET;
  if (!key) throw new Error("Missing MY_JWT_SECRET in environment variables");
  return key;
})();

export const authMiddleware = (allowedRoles: UserRoleType[] = []) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const path = req.originalUrl;

    console.log("===========================================");
    console.log(`🔐 [AUTH] Incoming request to ${req.method} ${path}`);
    console.log(`🔐 [AUTH] Authorization header:`, authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(`❌ [AUTH] Missing or malformed Authorization header on ${req.method} ${path}`);
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

      console.log(`✅ [AUTH] Token verified for userId: ${decoded.id}, role: ${decoded.role}`);
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };

      // Authorization check
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        console.warn(`❌ [AUTH] User ${decoded.id} with role ${decoded.role} is not authorized to access ${req.method} ${path}`);
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error(`❌ [AUTH] Token verification failed for ${req.method} ${path}`);
      console.error("   Reason:", err instanceof Error ? err.message : err);
      return res.status(403).json({ message: "Invalid or expired access token" });
    }
  };
};
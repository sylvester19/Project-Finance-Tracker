import { Request, Response, NextFunction } from "express";
import { UserRoleType } from "../../shared/schema";
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
    
    console.log(`✅ [AUTH] Token verified for userId: ${decoded.userId}, role: ${decoded.role}`);
    req.userId = parseInt(decoded.userId);
    req.role = decoded.role;
    next();
  } catch (err) {
    console.error(`❌ [AUTH] Token verification failed for ${req.method} ${path}`);
    console.error("   Reason:", err instanceof Error ? err.message : err);
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

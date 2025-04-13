import { Request, Response, NextFunction } from "express";
import { storage } from "../server/storage";
import { UserRoleType } from "../shared/schema"

export async function authenticateViaSession(req: Request, res: Response, next: NextFunction) {
  const session = req.session;

  // Step 1: Check if session token exists
  if (!session?.sessionToken) {
    return res.redirect("/login"); // 🔁 Redirect if no session
  }

  // Step 2: Validate session token in your DB
  const authSession = await storage.getSessionByToken(session.sessionToken);
  
  // Step 3: If session is missing or expired → delete session & redirect
  if (!authSession || new Date(authSession.expiresAt) < new Date()) {
    if (session.sessionToken) {
      await storage.deleteSession(session.sessionToken);
    }
    req.session.destroy(() => {}); // Clean server-side session
    return res.redirect("/login");
  }

  // Step 4: Check if user exists in DB
  const user = await storage.getUser(authSession.userId);
  if (!user) {
    await storage.deleteSession(session.sessionToken);
    req.session.destroy(() => {}); // Destroy session
    return res.redirect("/register"); // 🧭 Redirect to signup
  }

  // Step 4: Attach useful info to session for downstream access
  session.userId = user.id;
  session.role = user.role;

  next();
}


export function authorizeRole(allowedRoles: UserRoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role, userId } = req.session || {};

    if (!role || !userId || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
}
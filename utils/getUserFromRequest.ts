import { Request } from "express";
import { User } from "../shared/schema";

export function getUserFromRequest(req: Request): User {
    return (req as any).user;
  }
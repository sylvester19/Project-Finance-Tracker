// utils/session.ts
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}


export async function comparePasswords(supplied: string, stored: string) {
  console.log("$$ Stored password in DB:", stored);

  // DEV MODE: Compare plain text directly
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ Dev mode: comparing passwords as plain text");
    return supplied === stored;
  }

  // PROD MODE: Expect "hashed.salt" format  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) throw new Error("Invalid stored password format");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}



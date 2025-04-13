import { Express, Request, Response } from "express";
import session from "express-session";
import { storage } from "./storage";
import { hashPassword, createSessionToken } from "../utils/session";

export function setupAuth(app: Express) {
  // 1. Setup session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "solar-project-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    })
  );
  

  // 2. Register route
  app.post("/api/register", async (req, res) => {
    const { username, password, name, role } = req.body;

    try {
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed, name, role });

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Registration failed", error: err });
    }
  });


  // 3. Login route
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await storage.verifyUser(username, password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Step 1: Generate session token (this will be saved in DB)
    const sessionToken = createSessionToken();

    // Step 2: Save and capture the session from DB
    const userAuthSession = await storage.createSession(user.id, sessionToken);

    // Step 3: Fetch the full user from DB (to get the role)
    const sessionUser = await storage.getUser(userAuthSession.userId);
    if (!sessionUser) return res.status(401).json({ message: "User not found after session creation" });

    // Step 4: Attach session data to cookie-session
    req.session.sessionToken = userAuthSession.sessionToken;
    req.session.userId = sessionUser.id;
    req.session.role = sessionUser.role;

    // Step 4: Send response to the client
    res.json({ message: "Logged in successfully" });
  });


  // 4. Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
}

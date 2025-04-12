import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum values for roles
export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  SALESPERSON: "salesperson",
  EMPLOYEE: "employee",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Enum values for project status
export const ProjectStatus = {
  IN_PROGRESS: "in_progress",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

// Enum values for expense status
export const ExpenseStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ExpenseStatusType = typeof ExpenseStatus[keyof typeof ExpenseStatus];

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").$type<UserRoleType>().notNull(),
});

// Client model
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdById: integer("created_by_id").notNull(),
});

// Project model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").notNull(),
  status: text("status").$type<ProjectStatusType>().notNull().default(ProjectStatus.IN_PROGRESS),
  startDate: timestamp("start_date").notNull(),
  budget: doublePrecision("budget").notNull(),
  createdById: integer("created_by_id").notNull(),
});

// Expense categories
export const ExpenseCategory = {
  EQUIPMENT: "equipment",
  LABOR: "labor",
  TRANSPORT: "transport",
  MAINTENANCE: "maintenance",
  UTILITIES: "utilities",
  PERMITS: "permits",
  OTHER: "other",
} as const;

export type ExpenseCategoryType = typeof ExpenseCategory[keyof typeof ExpenseCategory];

// Expense model
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<ExpenseCategoryType>().notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status").$type<ExpenseStatusType>().notNull().default(ExpenseStatus.PENDING),
  submittedById: integer("submitted_by_id").notNull(),
  reviewedById: integer("reviewed_by_id"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity Log model
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  expenseId: integer("expense_id"),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  contactPerson: true,
  contactEmail: true,
  contactPhone: true,
  createdById: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  clientId: true,
  status: true,
  startDate: true,
  budget: true,
  createdById: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  projectId: true,
  amount: true,
  description: true,
  category: true,
  receiptUrl: true,
  status: true,
  submittedById: true,
  reviewedById: true,
  feedback: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  projectId: true,
  expenseId: true,
  action: true,
  details: true,
});

// Extend schemas with validation
export const userLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userRegisterSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const projectFormSchema = insertProjectSchema.extend({
  budget: z.number().min(1, "Budget must be greater than 0"),
});

export const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(3, "Description must be at least 3 characters"),
});

// Types for database operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type LoginCredentials = z.infer<typeof userLoginSchema>;

// server/routes.ts

import express from 'express';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { clientController } from '../controllers/clientController';
import { projectController } from '../controllers/projectController';
import { expenseController } from '../controllers/expenseController';
import { activityLogController } from '../controllers/activityLogController';
import { analyticsController } from '../controllers/analyticsController';  // Import analytics controller
import { authMiddleware } from '../middleware/authMiddleware';
import { UserRole } from '../../shared/schema';
import { notificationController } from 'server/controllers/notificationController';

const router = express.Router();

// Auth routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// User routes
router.get('/users/:id', authMiddleware(), userController.getUser); // Any authenticated user can get other user info
router.get('/users', authMiddleware(), userController.getAllUsers);
router.post('/users', authMiddleware([UserRole.ADMIN]), userController.createUser); // Only admins can create users
router.delete('/users/:id', authMiddleware(), userController.deleteUser);

// Client routes
router.get('/clients/:id', authMiddleware(), clientController.getClient); // Any authenticated user can get a client by ID
router.get('/clients', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), clientController.getClients); // Only admins and managers can list all clients
router.get('/clients/salesperson/:salesPersonId', authMiddleware([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), clientController.getClientsBySalesperson); // Admins, managers, and salespeople can list clients by salesperson
router.post('/clients/create', authMiddleware([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), clientController.createClient); // Admins, managers, and salespeople can create clients

// Project routes
router.get('/projects/:id', authMiddleware(), projectController.getProject); // Any authenticated user can get a project by ID
router.get('/projects', authMiddleware(), projectController.getProjects); // Any authenticated user can get all projects
router.get('/projects/user/:userId', authMiddleware(), projectController.getProjectsByUser); // Any authenticated user can get projects created by user ID
router.get('/projects/client/:clientId', authMiddleware(), projectController.getProjectsByClient); // Any authenticated user can get projects by client ID
router.post('/projects/create', authMiddleware([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON]), projectController.createProject); // Admins, managers, and salespeople can create projects
router.patch('/projects/:id/status', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), projectController.updateProjectStatus); // Only admins and managers can update project status
router.get('/projects/assigned/:userId', authMiddleware(), projectController.getAssignedProjects);

// Expense routes
router.get('/expenses/:id', authMiddleware(), expenseController.getExpense); // Any authenticated user can get an expense by ID
router.get('/expenses', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), expenseController.getExpenses); // Only admins and managers can get all expenses
router.get('/expenses/project/:projectId', authMiddleware(), expenseController.getExpensesByProject); // Any authenticated user can get expenses by project ID
router.get('/expenses/user/:userId', authMiddleware(), expenseController.getExpensesByUser); // Any authenticated user can get expenses submitted by a specific user
router.get('/expenses/status/:status', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), expenseController.getExpensesByStatus); // Only admins and managers can get expenses by status
router.post('/expenses/create', authMiddleware(), expenseController.createExpense); // Any authenticated user can create an expense
router.patch('/expenses/:id/status', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), expenseController.updateExpenseStatus); // Only admins and managers can update expense status

// Activity Log routes
router.get('/activity-logs/:id', authMiddleware(), activityLogController.getActivityLog); // Any authenticated user can get an activity log by ID
router.get('/activity-logs', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), activityLogController.getActivityLogs); // Only admins and managers can get all activity logs
router.get('/activity-logs/project/:projectId', authMiddleware(), activityLogController.getActivityLogsByProject); // Any authenticated user can get activity logs for a specific project
router.get('/activity-logs/user/:userId', authMiddleware(), activityLogController.getActivityLogsByUser); // Any authenticated user can get activity logs for a specific user
router.post('/activity-logs', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), activityLogController.createActivityLog); // Only admins and managers can create activity logs

// Notification routes
router.get('/notifications', authMiddleware(), notificationController.getUnreadNotifications);

// Analytics routes
router.get('/analytics/total-budget-vs-spent', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), analyticsController.getTotalBudgetVsSpent); // Only admins and managers can access analytics
router.get('/analytics/monthly-spending-trends', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), analyticsController.getMonthlySpendingTrends); // Only admins and managers can access analytics
router.get('/analytics/spending-by-category', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), analyticsController.getSpendingByCategory); // Only admins and managers can access analytics
router.get('/analytics/expense-approval-rates', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), analyticsController.getExpenseApprovalRates); // Only admins and managers can access analytics
router.get('/analytics/spending-by-employee', authMiddleware([UserRole.ADMIN, UserRole.MANAGER]), analyticsController.getSpendingByEmployee); // Only admins and managers can access analytics

export default router;
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

// TODO :: Implement authMiddleware
const router = express.Router();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/session', authController.session);

// User routes
router.get('/users/:id', authMiddleware, userController.getUser);
router.get('/users/username/:username', authMiddleware, userController.getUserByUsername);
router.post('/users', userController.createUser);

// Client routes
router.get('/clients/:id', authMiddleware, clientController.getClient);
router.get('/clients', authMiddleware, clientController.getClients);
router.get('/clients/salesperson/:salesPersonId', authMiddleware, clientController.getClientsBySalesperson);
router.post('/clients', authMiddleware, clientController.createClient);

// Project routes
router.get('/projects/:id', authMiddleware, projectController.getProject);
router.get('/projects', authMiddleware, projectController.getProjects);
router.get('/projects/user/:userId', authMiddleware, projectController.getProjectsByUser);
router.get('/projects/client/:clientId', authMiddleware, projectController.getProjectsByClient);
router.post('/projects', authMiddleware, projectController.createProject);
router.put('/projects/:id/status', authMiddleware, projectController.updateProjectStatus);

// Expense routes
router.get('/expenses/:id', authMiddleware, expenseController.getExpense);
router.get('/expenses', authMiddleware, expenseController.getExpenses);
router.get('/expenses/project/:projectId', authMiddleware, expenseController.getExpensesByProject);
router.get('/expenses/user/:userId', authMiddleware, expenseController.getExpensesByUser);
router.get('/expenses/status/:status', authMiddleware, expenseController.getExpensesByStatus);
router.post('/expenses', authMiddleware, expenseController.createExpense);
router.put('/expenses/:id/status', authMiddleware, expenseController.updateExpenseStatus);

// Activity Log routes
router.get('/activity-logs/:id', authMiddleware, activityLogController.getActivityLog);
router.get('/activity-logs', authMiddleware, activityLogController.getActivityLogs);
router.get('/activity-logs/project/:projectId', authMiddleware, activityLogController.getActivityLogsByProject);
router.get('/activity-logs/user/:userId', authMiddleware, activityLogController.getActivityLogsByUser);
router.post('/activity-logs', authMiddleware, activityLogController.createActivityLog);

// Analytics routes
router.get('/analytics/total-budget-vs-spent', authMiddleware, analyticsController.getTotalBudgetVsSpent); // Get total budget vs spent
router.get('/analytics/monthly-spending-trends', authMiddleware, analyticsController.getMonthlySpendingTrends); // Get monthly spending trends
router.get('/analytics/spending-by-category', authMiddleware, analyticsController.getSpendingByCategory); // Get spending by category
router.get('/analytics/expense-approval-rates', authMiddleware, analyticsController.getExpenseApprovalRates); // Get expense approval rates
router.get('/analytics/spending-by-employee', authMiddleware, analyticsController.getSpendingByEmployee); // Get spending by employee

export default router;
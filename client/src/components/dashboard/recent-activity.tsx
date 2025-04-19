import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertCircle, Clock, PlusCircle, RefreshCcw, UserPlus, UserX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ActivityLog, User, Project, Expense, ActivityAction } from "@shared/schema";

export function RecentActivity() {
  const { authenticatedFetch } = useAuth();

  // Fetch activity logs
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/activity-logs");
      return res.json();
    },
    staleTime: 30000
  });

  // Fetch users for displaying names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/users");
      return res.json();
    },
    staleTime: 300000
  });

  // Fetch expenses for displaying details
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/expenses");
      return res.json();
    },
    staleTime: 300000
  });

  // Fetch projects for displaying names
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/projects");
      return res.json();
    },
    staleTime: 300000
  });

  // Get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Get project name by ID
  const getProjectName = (projectId?: number) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Get expense amount by ID
  const getExpenseAmount = (expenseId?: number) => {
    if (!expenseId) return null;
    const expense = expenses.find(e => e.id === expenseId);
    return expense ? expense.amount : null;
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Get icon based on action type
  const getActionIcon = (action: ActivityAction) => {
    const baseClasses = "h-6 w-6 rounded-full ring-4 ring-white flex items-center justify-center";
  
    switch (action) {
      // Expense-related
      case ActivityAction.EXPENSE_SUBMITTED:
        return (
          <div className={`${baseClasses} bg-blue-500`}>
            <PlusCircle className="h-3 w-3 text-white" />
          </div>
        );
      case ActivityAction.EXPENSE_APPROVED:
        return (
          <div className={`${baseClasses} bg-green-500`}>
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        );
      case ActivityAction.EXPENSE_REJECTED:
        return (
          <div className={`${baseClasses} bg-red-500`}>
            <XCircle className="h-3 w-3 text-white" />
          </div>
        );
      case ActivityAction.EXPENSE_UPDATED:
        return (
          <div className={`${baseClasses} bg-yellow-500`}>
            <RefreshCcw className="h-3 w-3 text-white" />
          </div>
        );
  
      // Project-user related
      case ActivityAction.USER_ASSIGNED:
        return (
          <div className={`${baseClasses} bg-indigo-500`}>
            <UserPlus className="h-3 w-3 text-white" />
          </div>
        );
      case ActivityAction.USER_REMOVED:
        return (
          <div className={`${baseClasses} bg-pink-500`}>
            <UserX className="h-3 w-3 text-white" />
          </div>
        );
  
      // Project-related
      case ActivityAction.PROJECT_CREATED:
        return (
          <div className={`${baseClasses}  bg-blue-500`}>
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
        );
      case ActivityAction.PROJECT_UPDATED:
        return (
          <div className={`${baseClasses} bg-amber-500`}>
            <RefreshCcw className="h-5 w-5 text-white" />
          </div>
        );
  
      // Fallback
      default:
        return (
          <div className={`${baseClasses} bg-gray-400`}>
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
        );
    }
  };

  // Get recent 4 activity logs for dashboard
  const recentLogs = logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
        <Link href="/activity">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
        </Link>
      </div>
      <CardContent className="p-5 pl-8">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No recent activity</div>
        ) : (
          <ul className="relative border-l border-gray-300 space-y-8 pl-6">
            {recentLogs.map((log) => (
              <li key={log.id} className="relative">
                {/* Timeline Icon */}
                <span className="absolute -left-9 top-1 w-6 h-6 bg-gray-200 rounded-full border-2 border-primary-500 flex items-center justify-center">
                  {getActionIcon(log.action)}
                </span>

                {/* Timeline Content */}
                <div className="min-w-0 flex-1 text-sm text-gray-700">
                  <div className="text-sm">
                    <Link href={`/users/${log.userId}`}>
                      <a className="font-medium text-gray-900">{getUserName(log.userId)}</a>
                    </Link>{' '}

                    {log.action === ActivityAction.EXPENSE_APPROVED && 'approved expense of '}
                    {log.action === ActivityAction.EXPENSE_REJECTED && 'rejected expense of '}
                    {log.action === ActivityAction.EXPENSE_SUBMITTED && 'submitted new expense of '}
                    {log.action === ActivityAction.PROJECT_CREATED && 'created new project '}
                    {log.action === ActivityAction.PROJECT_UPDATED && 'updated project status for '}

                    {(log.action === ActivityAction.EXPENSE_REJECTED ||
                      log.action === ActivityAction.EXPENSE_APPROVED ||
                      log.action === ActivityAction.EXPENSE_SUBMITTED) && log.details && (
                      <Link href={`/expenses/${(log.details as Expense).id}`}>
                        <a className="font-medium text-gray-900">Expense #{(log.details as Expense).id}</a>
                      </Link>
                    )}

                    {log.projectId && (
                      <>
                        {' for '}
                        <Link href={`/projects/${log.projectId}`}>
                          <a className="font-medium text-gray-900">{getProjectName(log.projectId)}</a>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="mt-1 text-xs text-gray-500">{formatRelativeTime(String(log.timestamp))}</p>

                  {/* Rejection Reason */}
                  {log.action === ActivityAction.EXPENSE_REJECTED &&
                    log.details !== null &&
                    typeof log.details === 'object' &&
                    'reason' in log.details &&
                    typeof log.details.reason === 'string' && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p>
                          {log.details.reason.includes('with feedback:')
                            ? log.details.reason.split('with feedback:')[1].trim()
                            : log.details.reason}
                        </p>
                      </div>
                  )}

                  {/* Project Update Details */}
                  {log.details && log.action === ActivityAction.PROJECT_UPDATED && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      <p>{'name' in log.details ? log.details.name : '[Unnamed Project]'}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

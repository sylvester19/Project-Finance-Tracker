import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ActivityLog, User, Project, Expense } from "@shared/schema";

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
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved_expense':
        return <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center ring-8 ring-white">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>;
      case 'rejected_expense':
        return <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center ring-8 ring-white">
          <XCircle className="h-5 w-5 text-white" />
        </div>;
      case 'updated_project_status':
        return <div className="h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center ring-8 ring-white">
          <Clock className="h-5 w-5 text-white" />
        </div>;
      default:
        return <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center ring-8 ring-white">
          <AlertCircle className="h-5 w-5 text-white" />
        </div>;
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
      <CardContent className="p-5">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No recent activity</div>
        ) : (
          <ul className="space-y-5">
            {recentLogs.map((log) => (
              <li key={log.id} className="relative pb-5">
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <Link href={`/users/${log.userId}`}>
                          <a className="font-medium text-gray-900">{getUserName(log.userId)}</a>
                        </Link>{' '}
                        {log.action === 'approved_expense' && 'approved expense of '}
                        {log.action === 'rejected_expense' && 'rejected expense of '}
                        {log.action === 'submitted_expense' && 'submitted new expense of '}
                        {log.action === 'created_project' && 'created new project '}
                        {log.action === 'updated_project_status' && 'updated project status for '}
                        
                        {log.expenseId && (
                          <Link href={`/expenses/${log.expenseId}`}>
                            <a className="font-medium text-gray-900">
                              {log.details && log.action === 'rejected_expense' && (
                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                  <p>{log.details.includes('with feedback:') 
                                    ? log.details.split('with feedback:')[1].trim() 
                                    : log.details}
                                  </p>
                                </div>
                              )}
                            </a>
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
                      <p className="mt-0.5 text-sm text-gray-500">{formatRelativeTime(String(log.timestamp))}</p>
                    </div>
                    
                    {log.details && log.action === 'rejected_expense' && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p>{log.details.includes('with feedback:') 
                          ? log.details.split('with feedback:')[1].trim() 
                          : log.details}
                        </p>
                      </div>
                    )}
                    
                    {log.details && log.action === 'updated_project_status' && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p>{log.details}</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

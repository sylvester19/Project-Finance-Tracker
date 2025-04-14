import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; 

interface Expense {
  id: number;
  projectId: number;
  amount: number;
  description: string;
  category: string;
  receiptUrl?: string;
  status: string;
  submittedById: number;
  reviewedById?: number;
  feedback?: string;
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
}

interface Project {
  id: number;
  name: string;
  clientId: number;
  status: string;
  startDate: string;
  budget: number;
  createdById: number;
}

export function PendingExpenses() {
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();

  // Fetch pending expenses
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses?status=pending'],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/expenses?status=pending`);
      return await response.json();
    },
    staleTime: 60000
  });

  // Fetch users for expense submitter names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/users`);
      return await response.json();
    },
    staleTime: 300000
  });

  // Fetch projects for expense project names
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/projects");
      return await response.json();
    },
    staleTime: 300000
  });

  // Handle expense approval/rejection
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, status, feedback }: { id: number; status: string; feedback?: string }) => {
      const response = await authenticatedFetch(`/api/expenses/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, feedback }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses?status=pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
    }
  });

  const handleApproveExpense = (id: number) => {
    updateExpenseMutation.mutate(
      { id, status: 'approved' },
      {
        onSuccess: () => {
          toast({
            title: "Expense approved",
            description: "The expense has been approved successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Could not approve expense. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleRejectExpense = (id: number) => {
    updateExpenseMutation.mutate(
      { id, status: 'rejected', feedback: "Please provide more details" },
      {
        onSuccess: () => {
          toast({
            title: "Expense rejected",
            description: "The expense has been rejected.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Could not reject expense. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  // Get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Get user initials
  const getUserInitials = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'UN';
    
    return user.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Show only top 3 pending expenses for dashboard
  const displayExpenses = expenses.slice(0, 3);

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Expenses</h3>
        <Link href="/expenses?status=pending">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
        </Link>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : displayExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending expenses to review.
          </div>
        ) : (
          displayExpenses.map((expense) => (
            <div className="p-5" key={expense.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{getUserInitials(expense.submittedById)}</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{getUserName(expense.submittedById)}</div>
                    <div className="text-sm text-gray-500">
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} - {getProjectName(expense.projectId)}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectExpense(expense.id)}
                  disabled={updateExpenseMutation.isPending}
                >
                  Reject
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApproveExpense(expense.id)}
                  disabled={updateExpenseMutation.isPending}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

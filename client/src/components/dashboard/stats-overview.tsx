import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { FileText, PanelTop, BarChart3, DollarSign } from "lucide-react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  linkHref: string;
  linkText: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  bgColor,
  linkHref,
  linkText,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`rounded-md p-3 ${bgColor}`}>
                {icon}
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  {isLoading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">{value}</div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={linkHref}>
              <a className="font-medium text-primary-600 hover:text-primary-500">
                {linkText}
                <span className="sr-only"> {title}</span>
              </a>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsOverview() {
  // Fetch active projects count
  const projectsQuery = useQuery({ 
    queryKey: ['/api/projects'],
    staleTime: 60000
  });
  
  // Fetch pending expenses
  const expensesQuery = useQuery({ 
    queryKey: ['/api/expenses?status=pending'],
    staleTime: 60000
  });
  
  // Get budget utilization from analytics
  const budgetQuery = useQuery({ 
    queryKey: ['/api/analytics/budget-vs-spent'],
    staleTime: 60000
  });
  
  // Calculate totals
  const activeProjects = projectsQuery.data?.filter(p => p.status === 'in_progress')?.length || 0;
  
  const pendingExpenses = expensesQuery.data?.length || 0;
  
  const totalBudget = budgetQuery.data?.reduce((sum, p) => sum + p.budget, 0) || 0;
  
  const totalSpent = budgetQuery.data?.reduce((sum, p) => sum + p.spent, 0) || 0;
  
  const budgetUtilization = totalBudget > 0 
    ? Math.round((totalSpent / totalBudget) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Active Projects"
        value={activeProjects}
        icon={<PanelTop className="text-primary-500 h-5 w-5" />}
        bgColor="bg-primary-50"
        linkHref="/projects"
        linkText="View all"
        isLoading={projectsQuery.isLoading}
      />
      
      <StatsCard
        title="Total Budget Allocated"
        value={formatCurrency(totalBudget)}
        icon={<DollarSign className="text-amber-500 h-5 w-5" />}
        bgColor="bg-amber-50"
        linkHref="/projects"
        linkText="Budget details"
        isLoading={budgetQuery.isLoading}
      />
      
      <StatsCard
        title="Pending Expenses"
        value={pendingExpenses}
        icon={<FileText className="text-blue-500 h-5 w-5" />}
        bgColor="bg-blue-50"
        linkHref="/expenses?status=pending"
        linkText="Review now"
        isLoading={expensesQuery.isLoading}
      />
      
      <StatsCard
        title="Budget Utilization"
        value={`${budgetUtilization}%`}
        icon={<BarChart3 className="text-red-500 h-5 w-5" />}
        bgColor="bg-red-50"
        linkHref="/analytics"
        linkText="View report"
        isLoading={budgetQuery.isLoading}
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'wouter';
import { useMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

export default function ExpensesTable() {
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState('all');
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  const pageSize = 3;
  const { authenticatedFetch } = useAuth();

  // Fetch expenses
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      const response = await authenticatedFetch("GET", "/api/expenses");
      return await response.json();
    },
  });

  // Fetch projects for filter
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await authenticatedFetch("GET","/api/projects");      
      return await response.json();
    },
  });

  const goToExpenseDetails = (id: number) => {
    setLocation(`/expenses/${id}`);
  };

  // Get filtered expenses
  const getFilteredExpenses = () => {
    if (!expenses) return [];
    
    if (projectFilter === 'all') {
      return expenses;
    }
    
    return expenses.filter((expense: any) => 
      expense.projectId.toString() === projectFilter
    );
  };

  // Get expenses for current page
  const getCurrentPageExpenses = () => {
    const filtered = getFilteredExpenses();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  };

  const currentExpenses = getCurrentPageExpenses();
  const totalExpenses = getFilteredExpenses().length;
  const totalPages = Math.ceil(totalExpenses / pageSize);

  const renderStatusBadge = (status: string) => {
    return <span className={`status-badge-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center flex-wrap gap-3">
        <CardTitle className="text-lg font-medium">Recent Expenses</CardTitle>
        <div className="flex space-x-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[160px] text-sm">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/expenses">
            <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-800">
              View all expenses
            </Button>
          </Link>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              {!isMobile && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              {!isMobile && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoadingExpenses ? (
              // Loading skeletons
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </td>
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </td>
                </tr>
              ))
            ) : currentExpenses.length > 0 ? (
              currentExpenses.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                    <div className="text-xs text-gray-500">{formatDate(expense.submittedAt)}</div>
                  </td>
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.project?.name}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.category?.name}</div>
                  </td>
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center">
                          {expense.submitter?.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {expense.submitter?.name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {expense.submitter?.role}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(parseFloat(expense.amount))}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="link" 
                      onClick={() => goToExpenseDetails(expense.id)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isMobile ? 5 : 7} className="px-6 py-4 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
        <nav className="flex items-center justify-between" aria-label="Pagination">
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{currentExpenses.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * pageSize, totalExpenses)}
              </span>{' '}
              of <span className="font-medium">{totalExpenses}</span> expenses
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </nav>
      </div>
    </Card>
  );
}

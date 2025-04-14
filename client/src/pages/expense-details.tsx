import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckIcon, XIcon, ReceiptIcon, UserIcon, CalendarIcon, FileTextIcon, InfoIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export default function ExpenseDetails({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('details');
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch expense details
  const { data: expense, isLoading } = useQuery({
    queryKey: [`/api/expenses/${id}`],
  });

  // Check if user can approve/reject expenses
  const canReviewExpense = user && (user.role === 'admin' || user.role === 'manager');

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
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Go back to expenses list
  const handleBack = () => {
    setLocation('/expenses');
  };

  // Go to project details
  const handleViewProject = () => {
    if (expense) {
      setLocation(`/projects/${expense.projectId}`);
    }
  };

  // Approve expense mutation
  const approveExpense = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/expenses/${id}`, {
        status: 'approved',
        notes: reviewNotes
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${id}`] });
      toast({
        title: 'Success',
        description: 'Expense approved successfully',
      });
    },
    onError: (error) => {
      console.error('Error approving expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve expense',
        variant: 'destructive',
      });
    },
  });

  // Reject expense mutation
  const rejectExpense = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/expenses/${id}`, {
        status: 'rejected',
        notes: reviewNotes
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${id}`] });
      toast({
        title: 'Success',
        description: 'Expense rejected successfully',
      });
    },
    onError: (error) => {
      console.error('Error rejecting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject expense',
        variant: 'destructive',
      });
    },
  });

  // Handle approve button click
  const handleApprove = () => {
    if (window.confirm('Are you sure you want to approve this expense?')) {
      approveExpense.mutate();
    }
  };

  // Handle reject button click
  const handleReject = () => {
    if (window.confirm('Are you sure you want to reject this expense?')) {
      rejectExpense.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-gray-700">Expense not found</p>
            <Button className="mt-4" onClick={handleBack}>
              Back to Expenses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Expense Details"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleViewProject}>
              View Project
            </Button>
          </div>
        }
      />

      <div className="mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              {canReviewExpense && expense.status === 'pending' && (
                <TabsTrigger value="review">Review</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center justify-between">
                      <span>{expense.description}</span>
                      <Badge className={`status-badge-${expense.status}`}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Project</h3>
                        <p className="mt-1 text-sm text-gray-900">{expense.project?.name}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Category</h3>
                          <p className="mt-1 text-sm text-gray-900">{expense.category?.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                          <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(parseFloat(expense.amount))}</p>
                        </div>
                      </div>

                      {expense.notes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                          <p className="mt-1 text-sm text-gray-900">{expense.notes}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
                            <p className="mt-1 text-sm text-gray-900">{expense.submitter?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Submitted At</h3>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(expense.submittedAt)}</p>
                          </div>
                        </div>
                      </div>

                      {expense.reviewedAt && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex items-center">
                            <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Reviewed By</h3>
                              <p className="mt-1 text-sm text-gray-900">{expense.reviewer?.name || 'Unknown'}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Reviewed At</h3>
                              <p className="mt-1 text-sm text-gray-900">{formatDate(expense.reviewedAt)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Receipt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expense.receiptUrl ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center">
                          <ReceiptIcon className="h-16 w-16 text-gray-400" />
                        </div>
                        <Button variant="outline" className="w-full">
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <ReceiptIcon className="h-12 w-12 text-gray-300 mb-2" />
                        <p>No receipt attached</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {canReviewExpense && expense.status === 'pending' && (
              <TabsContent value="review">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Review Expense</CardTitle>
                    <CardDescription>
                      Review this expense and either approve or reject it
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <InfoIcon className="h-5 w-5 text-amber-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">Review Information</h3>
                            <div className="mt-2 text-sm text-amber-700">
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Once approved, the expense amount will be deducted from the project budget</li>
                                <li>Approved expenses cannot be modified</li>
                                <li>All decisions are recorded in the activity log</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Review Notes</h3>
                        <Textarea
                          placeholder="Add notes about your decision (optional)"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                          variant="outline" 
                          className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                          onClick={handleReject}
                          disabled={approveExpense.isPending || rejectExpense.isPending}
                        >
                          <XIcon className="h-4 w-4 mr-2" />
                          Reject Expense
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                          disabled={approveExpense.isPending || rejectExpense.isPending}
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Approve Expense
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
}

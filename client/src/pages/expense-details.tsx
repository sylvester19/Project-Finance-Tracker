import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckIcon, XIcon, ReceiptIcon, FileTextIcon, InfoIcon, DollarSign, Tag, Calendar, MessageSquare, Edit, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Expense, Project, User } from '../../../shared/schema';
import { Separator } from '@radix-ui/react-select';
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils';

export default function ExpenseDetails() {
  const { id } = useParams<{ id: string }>();
  const expenseId = parseInt(id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { authenticatedFetch } = useAuth();
      
  
  const [activeTab, setActiveTab] = useState('details');
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch expense details
  const { data: expense, isLoading } = useQuery<Expense>({
    queryKey: [`/api/expenses/${expenseId}`],
    queryFn: async () => { 
      const response = await authenticatedFetch('GET', `/api/expenses/${expenseId}`);
      return await response.json();
    },
    enabled: !!expenseId
  });


  // Wait until expense is loaded
  const submittedById = expense?.submittedById;
  const reviewedById = expense?.reviewedById;
  const projectId = expense?.projectId;

  // Fetch user details who submitted expense
  const { data: submitter } = useQuery<User>({
    queryKey: [`/api/users/${submittedById}`],
    enabled: !!expense?.submittedById,
    queryFn: () => authenticatedFetch('GET', `/api/users/${submittedById}`).then(res => res.json()),
  });
  
  // Fetch user details who reviewed expense
  const { data: reviewer } = useQuery<User>({
    queryKey: [`/api/users/${reviewedById}`],
    enabled: !!expense?.reviewedById,
    queryFn: () => authenticatedFetch('GET', `/api/users/${reviewedById}`).then(res => res.json()),
  });
  
  // Fetch the project details to which corresponding expense is related 
  const { data: project,  isLoading: isProjectLoading  } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!expense?.projectId,
    queryFn: () => authenticatedFetch('GET', `/api/projects/${projectId}`).then(res => res.json()),
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

  // Go back to expenses list
  const handleBack = () => {
    navigate('/expenses');
  };

  // Approve expense mutation
  const approveExpense = useMutation({
    mutationFn: async () => {
     const response = await authenticatedFetch('PATCH', `/api/expenses/${expenseId}/status`, {
        body: JSON.stringify({
          status: 'approved',
          notes: reviewNotes
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${expenseId}`] });
      setActiveTab("details");
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
      const response = await authenticatedFetch('PATCH', `/api/expenses/${expenseId}/status`, {
        body: JSON.stringify({
          status: 'rejected',
          notes: reviewNotes
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${expenseId}`] });
      setActiveTab("details");
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

  const isAdmin = user && (user.role === "admin" || user.role === "manager");
  const isOwner = user && expense && user.id === expense.submittedById;
  const canEdit = (isOwner && expense?.status === "pending") || (isAdmin && expense?.status === "pending");

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
 
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-2"
          onClick={() => navigate("/expenses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Expense Details</h1>
            <p className="text-gray-500">
              Submitted on {formatDate(expense.createdAt)}
            </p>
          </div>
          <div className="flex space-x-3">
            {canEdit && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/expenses/${expenseId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}          
          </div>
        </div>
      </div>
      

      <div className="mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>   
            
          {canReviewExpense && expense.status === 'pending' && (
            <TabsList className="mb-6 grid grid-cols-2 sm:grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              {expense?.status === 'pending' && (
                <TabsTrigger value="review">Review</TabsTrigger>
              )}
            </TabsList>
          )}

            <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                      <p className="text-gray-900">{expense.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                        <div className="flex items-center text-xl font-semibold">
                          <DollarSign className="h-5 w-5 text-gray-500 mr-1" />
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                        <div className="flex items-center">
                          <Tag className="h-5 w-5 text-gray-500 mr-1" />
                          <span className="capitalize">{expense.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                        <Badge className={getStatusColor(expense.status)}>
                          {formatStatus(expense.status)}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Submission Date</h3>
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-500 mr-1" />
                          {formatDate(expense.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {submitter?.name && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h3>
                          <p className="text-gray-900">{submitter.name}</p>
                        </div>
                      )}
                      
                      {reviewer?.name && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Reviewed By</h3>
                          <p className="text-gray-900">{reviewer.name}</p>
                        </div>
                      )}
                    </div>              
                    
                    {expense.feedback && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Feedback</h3>
                        <div className="border rounded-md p-4 bg-gray-50">
                          <div className="flex items-start">
                            <MessageSquare className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                            <p className="text-gray-700">{expense.feedback}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isProjectLoading ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : project ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Project Name</h3>
                          <a 
                            href={`/projects/${project.id}`}
                            className="text-primary-600 hover:text-primary-500 font-medium"
                          >
                            {project.name}
                          </a>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Project Status</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {formatStatus(project.status)}
                          </Badge>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Project Budget</h3>
                          <div className="font-medium">{formatCurrency(project.budget)}</div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                          <div className="text-gray-900">{formatDate(project.startDate)}</div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          View Project
                        </Button>
                      </div>
                    ) : (
                      <div className="text-gray-500">Project information not available</div>
                    )}
                  </CardContent>
                </Card>         
              </div>

              <div>
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
        
    </div>
 
  );
}

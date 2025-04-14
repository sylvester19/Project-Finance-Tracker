import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Edit, Check, X, Calendar, DollarSign, 
  FileText, MessageSquare, Tag
} from "lucide-react";

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const expenseId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = React.useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);

  // Fetch expense details
  const { data: expense, isLoading: isExpenseLoading } = useQuery({
    queryKey: [`/api/expenses/${expenseId}`],
    staleTime: 60000
  });

  // Fetch project details
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: [`/api/projects/${expense?.projectId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${expense?.projectId}`);
      return res.json();
    },
    enabled: !!expense?.projectId,
    staleTime: 60000
  });

  // Update expense status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, feedback }: { status: string; feedback?: string }) => {
      const res = await apiRequest('PATCH', `/api/expenses/${expenseId}/status`, { status, feedback });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${expenseId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${expense?.projectId}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      toast({
        title: "Status updated",
        description: "Expense status has been updated successfully",
      });
      setIsRejectDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update expense status",
      });
    }
  });

  // Handle approval
  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'approved' });
  };

  // Handle rejection with feedback
  const handleReject = () => {
    if (!feedback.trim()) {
      toast({
        variant: "destructive", 
        title: "Feedback required",
        description: "Please provide feedback explaining why this expense is being rejected."
      });
      return;
    }
    
    updateStatusMutation.mutate({ 
      status: 'rejected',
      feedback
    });
  };

  // Check if user can edit or approve/reject
  const isAdmin = user && (user.role === "admin" || user.role === "manager");
  const isOwner = user && expense && user.id === expense.submittedById;
  const canEdit = isOwner && expense?.status === "pending";
  const canApproveReject = isAdmin && expense?.status === "pending";

  // Loading state
  if (isExpenseLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Not found state
  if (!expense) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Expense Not Found</h2>
        <p className="mt-2 text-gray-600">The expense you're looking for doesn't exist or has been removed.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/expenses")}
        >
          Back to Expenses
        </Button>
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
            {canApproveReject && (
              <>
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Expense</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejecting this expense.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium mb-2 block">
                        Feedback
                      </label>
                      <Textarea
                        placeholder="Required feedback for the submitter..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="resize-none"
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsRejectDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? 'Rejecting...' : 'Reject Expense'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="default"
                  onClick={handleApprove}
                  disabled={updateStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {updateStatusMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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

              {expense.receiptUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Receipt</h3>
                  <div className="border rounded-md p-2 bg-gray-50 max-w-md">
                    <img 
                      src={expense.receiptUrl} 
                      alt="Receipt" 
                      className="w-full h-auto rounded" 
                    />
                  </div>
                </div>
              )}
              
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
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Submitter Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h3>
                  <div className="font-medium">
                    {/* In a real app, fetch the user name */}
                    User #{expense.submittedById}
                  </div>
                </div>
                
                {expense.reviewedById && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Reviewed By</h3>
                    <div className="font-medium">
                      {/* In a real app, fetch the reviewer name */}
                      User #{expense.reviewedById}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

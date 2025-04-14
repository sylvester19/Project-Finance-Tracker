import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, getStatusColor, formatStatus, calculatePercentage } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, Plus, Calendar, DollarSign, Users, 
  Clock, BarChart, FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectStatus } from "@shared/schema";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch project details
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}`);
      return res.json();
    },
    staleTime: 60000
  });

  // Fetch project expenses
  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/expenses`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/expenses`);
      return res.json();
    },
    staleTime: 60000
  });

  // Fetch client data
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${project?.clientId}`],
    enabled: !!project?.clientId,
    staleTime: 300000
  });

  // Fetch project activity logs
  const { data: activityLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/activity-logs`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${projectId}/activity-logs`);
      return res.json();
    },
    staleTime: 60000
  });

  // Get budget vs spent data for this project
  const { data: budgetVsSpent = [] } = useQuery({
    queryKey: ['/api/analytics/budget-vs-spent'],
    staleTime: 60000
  });

  // Update project status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest('PATCH', `/api/projects/${projectId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/activity-logs`] });
      toast({
        title: "Status updated",
        description: "Project status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update project status",
      });
    }
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  // Calculate spent amount for this project
  const projectData = budgetVsSpent.find(p => p.project === project?.name);
  const spent = projectData ? projectData.spent : 0;
  const budget = project?.budget || 0;
  const spentPercentage = calculatePercentage(spent, budget);

  // Check if user can edit project
  const canEditProject = user && (user.role === "admin" || user.role === "manager" || 
    (user.role === "salesperson" && project?.createdById === user.id));

  // Check if user can add expenses
  const canAddExpenses = user && (user.role !== "admin");

  // Check if user can change status
  const canChangeStatus = user && (user.role === "admin" || user.role === "manager");

  // Group expenses by status
  const pendingExpenses = expenses.filter(e => e.status === "pending");
  const approvedExpenses = expenses.filter(e => e.status === "approved");
  const rejectedExpenses = expenses.filter(e => e.status === "rejected");

  // Loading state
  if (isProjectLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Project Not Found</h2>
        <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or has been removed.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/projects")}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {formatStatus(project.status)}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">
            Started on {formatDate(project.startDate)}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {canChangeStatus && (
            <Select
              value={project.status}
              onValueChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canEditProject && (
            <Button 
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          )}
          {canAddExpenses && (
            <Button 
              onClick={() => navigate(`/projects/${projectId}/expenses/new`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Spent So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(spent)}</div>
            <div className="text-sm text-gray-500 mt-1">{spentPercentage}% of budget</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budget - spent)}</div>
            <Progress value={spentPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="mt-1 flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <Badge className={getStatusColor(project.status)}>
                      {formatStatus(project.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Start Date</div>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Budget</div>
                  <div className="mt-1 flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{formatCurrency(budget)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Budget Utilization</div>
                  <div className="mt-1">
                    <Progress value={spentPercentage} className="mt-2" />
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(spent)} spent ({spentPercentage}% of total budget)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isClientLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : client ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Client Name</div>
                      <div className="mt-1 flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span>{client.name}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Contact Person</div>
                      <div className="mt-1 flex items-center">
                        <span>{client.contactPerson}</span>
                      </div>
                    </div>
                    {client.contactEmail && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Email</div>
                        <div className="mt-1">
                          <a 
                            href={`mailto:${client.contactEmail}`}
                            className="text-primary-600 hover:text-primary-500"
                          >
                            {client.contactEmail}
                          </a>
                        </div>
                      </div>
                    )}
                    {client.contactPhone && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Phone</div>
                        <div className="mt-1">
                          <a 
                            href={`tel:${client.contactPhone}`}
                            className="text-primary-600 hover:text-primary-500"
                          >
                            {client.contactPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">Client information not available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>Breakdown of expenses by status</CardDescription>
            </CardHeader>
            <CardContent>
              {isExpensesLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No expenses have been submitted for this project yet.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-yellow-600 font-medium">Pending</div>
                      <div className="text-2xl font-bold mt-1">{pendingExpenses.length}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatCurrency(pendingExpenses.reduce((sum, e) => sum + e.amount, 0))}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 font-medium">Approved</div>
                      <div className="text-2xl font-bold mt-1">{approvedExpenses.length}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatCurrency(approvedExpenses.reduce((sum, e) => sum + e.amount, 0))}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-red-600 font-medium">Rejected</div>
                      <div className="text-2xl font-bold mt-1">{rejectedExpenses.length}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatCurrency(rejectedExpenses.reduce((sum, e) => sum + e.amount, 0))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Recent Expenses</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.slice(0, 5).map((expense) => (
                            <TableRow 
                              key={expense.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => navigate(`/expenses/${expense.id}`)}
                            >
                              <TableCell>{expense.description}</TableCell>
                              <TableCell className="capitalize">{expense.category}</TableCell>
                              <TableCell>{formatCurrency(expense.amount)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(expense.status)}>
                                  {formatStatus(expense.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(expense.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {expenses.length > 5 && (
                      <div className="text-center mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => setActiveTab("expenses")}
                        >
                          View All Expenses
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Project Expenses</CardTitle>
                <CardDescription>All expenses submitted for this project</CardDescription>
              </div>
              {canAddExpenses && (
                <Button 
                  onClick={() => navigate(`/projects/${projectId}/expenses/new`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isExpensesLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No expenses have been submitted for this project yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="capitalize">{expense.category}</TableCell>
                          <TableCell>
                            {/* In a real app, fetch the user name */}
                            User #{expense.submittedById}
                          </TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(expense.status)}>
                              {formatStatus(expense.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(expense.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/expenses/${expense.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent activity for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {isLogsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activity recorded for this project yet.
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-5 w-px bg-gray-200"></div>
                  <ul className="space-y-6">
                    {activityLogs.map((log) => (
                      <li key={log.id} className="relative pl-10">
                        <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center">
                          <div className={`h-3 w-3 rounded-full ring-4 ring-white ${
                            log.action.includes('approved') ? 'bg-green-500' :
                            log.action.includes('rejected') ? 'bg-red-500' :
                            log.action.includes('created') ? 'bg-primary-500' :
                            'bg-blue-500'
                          }`}></div>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">
                            {/* In a real app, fetch the user name */}
                            User #{log.userId} 
                          </p>
                          <p className="text-gray-500">{log.details}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(log.timestamp)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

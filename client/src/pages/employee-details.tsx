// client/src/pages/employee-details.tsx

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PanelTop, Search, FileText } from "lucide-react";
import { formatDate, calculatePercentage, formatCurrency, getStatusColor, formatStatus } from "@/lib/utils";
import { Expense, Project, User, Client, ProjectStatusType, ExpenseStatusType, ExpenseCategoryType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProjectAsType = 'created' | 'assigned';

export default function EmployeeDetails(){
  const { id } = useParams<{ id: string }>(); // Get employee ID from route params
  const employeeId = parseInt(id || ""); // Parse employee ID to number

  const [projectStatus, setProjectStatus] = useState<ProjectStatusType | 'all'>('all')
  const [projectAs, setProjectAs] = useState<ProjectAsType>('created')
  const [projectSearch, setProjectSearch] = useState('')

  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatusType | 'all'>('all')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategoryType | 'all'>('all')
  const [expenseSearch, setExpenseSearch] = useState('')

  const { authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [, navigate] = useLocation();

  // Fetch employee details
  const {
    data: employee,
    isLoading: isEmployeeLoading,
    error: employeeError,
  } = useQuery({
    queryKey: ["/api/users", employeeId],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", `/api/users/${employeeId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch employee details");
      }
      return await res.json() as Promise<User>;
    },
    enabled: !!employeeId, // Only fetch if employeeId is valid
  });

  // Fetch projects created by user
  const {
    data: createdProjects,
    isLoading: isCreatedProjectsLoading,
    error: createdProjectsError,
  } = useQuery({
    queryKey: ["/api/projects/user", employeeId, projectAs],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", `/api/projects/user/${employeeId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch created projects");
      }
      return await res.json() as Promise<Project[]>;
    },
    enabled: !!employeeId && projectAs === "created" // Only fetch if employeeId is valid
  });

  // Fetch projects assigned to user
  const {
    data: assignedProjects,
    isLoading: isAssignedProjectsLoading,
    error: assignedProjectsError,
  } = useQuery({
    queryKey: ["/api/projects/assigned", employeeId, projectAs],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", `/api/projects/assigned/${employeeId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch assigned projects");
      }
      return await res.json() as Promise<Project[]>;
    },
    enabled: !!employeeId && projectAs === "assigned", // Only fetch if employeeId is valid
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/clients");
      return res.json();
    },
    staleTime: 300000
  });

  // Get budget vs spent data
  const { data: budgetVsSpent = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/total-budget-vs-spent'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/analytics/total-budget-vs-spent");
      return res.json();
    },
    staleTime: 60000
  });

  // Combine and filter projects based on the selected filter
  const filteredProjects = React.useMemo(() => {
    let allProjects: Project[] = [];
    if (projectAs === "assigned") {
      allProjects = assignedProjects || [];
    } else if (projectAs === "created") {
      allProjects = createdProjects || [];
    } else {
      allProjects = [...(createdProjects || []), ...(assignedProjects || [])];
    }

    return allProjects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(projectSearch.toLowerCase());
      const matchesStatus = projectStatus === "all" || project.status === projectStatus;
      return matchesSearch && matchesStatus;
    });
  }, [createdProjects, assignedProjects, projectSearch, projectStatus]);

  // Get client name by ID
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  // Get client contact by ID
  const getClientContact = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.contactPerson : "";
  };

  // Get spent amount for a project
  const getProjectSpent = (projectName: string) => {
    const data = budgetVsSpent.find(p => p.project === projectName);
    return data ? data.spent : 0;
  };

  const isProjectsLoading = (projectAs === "created" && isCreatedProjectsLoading) || (projectAs === "assigned" && isAssignedProjectsLoading);

  const projectsError = createdProjectsError || assignedProjectsError;

  // Fetch expenses
  const { data: expenses = [], isLoading: isExpensesLoading, error: expensesError } = useQuery<Expense[]>({
    queryKey: ['/api/expenses/user', employeeId],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", `/api/expenses/user/${employeeId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return res.json();
    },
    enabled: !!employeeId,
  });

  // Filter expenses based on search, status, and category
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
      const matchesStatus = expenseStatus === "all" || expense.status === expenseStatus;
      const matchesCategory = expenseCategory === "all" || expense.category === expenseCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [expenses, expenseSearch, expenseStatus, expenseCategory]);

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = filteredProjects.find((p) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  // Get unique categories from expenses for filter
  const categories = [...new Set(expenses.map(e => e.category))];

  if (isEmployeeLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  if (employeeError) {
    return <div>Error: {employeeError.message}</div>;
  }

  if (!employee) {
    return <div>Employee not found.</div>;
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Name: {employee.name}</p>
          <p>Username: {employee.username}</p>
          <p>Role: {employee.role}</p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>   
        <TabsList className="my-4 grid grid-cols-2 sm:grid-cols-2">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>
                View and manage projects.
              </CardDescription>
              <div className="flex flex-col sm:flex-row mt-4 gap-3">
                <div className="relative rounded-md flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search projects"
                    className="pl-10"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={projectStatus}
                  onValueChange={(val) =>setProjectStatus(val as ProjectStatusType | 'all' )}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={projectAs}
                  onValueChange={(val)=>setProjectAs(val as ProjectAsType  )}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isProjectsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : projectsError ? (
                <div>Error: {projectsError.message}</div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {projectSearch || projectStatus!== "all" || projectAs !== "created"
                    ? "No projects match your filters"
                    : "No projects available"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Spent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => {
                        const spent = getProjectSpent(project.name);
                        const percentage = calculatePercentage(spent, project.budget);

                        return (
                          <TableRow
                            key={project.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 flex-shrink-0 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center">
                                  <PanelTop className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{project.name}</div>
                                  {/* <div className="text-sm text-muted-foreground">
                                    Started {formatDate(project.startDate)}
                                  </div> */}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{getClientName(project.clientId)}</div>
                              <div className="text-sm text-muted-foreground">
                                {getClientContact(project.clientId)}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(project.budget)}</TableCell>
                            <TableCell>
                              <div>{formatCurrency(spent)}</div>
                              <div className="text-sm text-muted-foreground">
                                {percentage}% used
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>
                                {formatStatus(project.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Progress value={percentage} className="h-2 w-full max-w-xs" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProjects.length} projects
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>
                View, filter, and manage expenses.
              </CardDescription>
              <div className="flex flex-col sm:flex-row mt-4 gap-3">
                <div className="relative rounded-md flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search expenses"
                    className="pl-10"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={expenseStatus}
                  onValueChange={(val) => setExpenseStatus(val as ExpenseStatusType | 'all')}                
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={expenseCategory}
                  onValueChange={(val) => setExpenseCategory(val as ExpenseCategoryType | 'all')}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isExpensesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : expensesError ? (
                <div>Error: {expensesError.message}</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {expenseSearch || expenseStatus !== "all" || expenseCategory !== "all"
                  ? "No expenses match your filters"
                  : "No expenses available"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 flex-shrink-0 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="truncate max-w-xs">
                                {expense.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getProjectName(expense.projectId)}</TableCell>
                          <TableCell className="capitalize">{expense.category}</TableCell>
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
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </div>
            </CardFooter>
          </Card>          
        </TabsContent>
      </Tabs>
    </div>
  );
};

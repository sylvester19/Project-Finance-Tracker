import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { formatCurrency, formatDate, getStatusColor, formatStatus, calculatePercentage } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Search, PanelTop } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Project {
  id: number;
  name: string;
  clientId: number;
  status: string;
  startDate: string;
  budget: number;
  createdById: number;
}

interface Client {
  id: number;
  name: string;
  contactPerson: string;
}

interface BudgetSpent {
  project: string;
  budget: number;
  spent: number;
}

export default function Projects() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json();
    },
    staleTime: 60000
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    staleTime: 300000
  });

  // Get budget vs spent data
  const { data: budgetVsSpent = [] } = useQuery<BudgetSpent[]>({
    queryKey: ['/api/analytics/budget-vs-spent'],
    staleTime: 60000
  });

  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // Check if user can create a project
  const canCreateProject = user && (user.role === "admin" || user.role === "manager" || user.role === "salesperson");

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <div className="mt-3 sm:mt-0">
          {canCreateProject && (
            <Button 
              onClick={() => navigate("/projects/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            View and manage your solar projects.
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter !== "all" 
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
                              <div className="text-sm text-muted-foreground">
                                Started {formatDate(project.startDate)}
                              </div>
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
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

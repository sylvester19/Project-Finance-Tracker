import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate, getStatusColor, formatStatus, calculatePercentage } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PanelTop, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Client, Project } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

// interface Project {
//   id: number;
//   name: string;
//   clientId: number;
//   status: string;
//   startDate: string;
//   budget: number;
//   createdById: number;
// }

export function ProjectsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { authenticatedFetch } = useAuth();
  const projectsPerPage = 4;

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/projects");
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      return await res.json() as Promise<Project[]>; // Type assertion
    },
    staleTime: 60000
  });

  // Fetch clients for project client names
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/clients");
      if (!res.ok) {
        throw new Error("Failed to fetch clients");
      }
      return await res.json() as Promise<Client[]>; // Type assertion
    },
    staleTime: 60000
  });

  // Calculate expenses per project for progress bars
  const { data: budgetVsSpent = [] } = useQuery({
    queryKey: ['/api/analytics/total-budget-vs-spent'],
    queryFn: async () => {
      const res = await authenticatedFetch("GET", "/api/analytics/total-budget-vs-spent");
      if (!res.ok) {
        throw new Error("Failed to fetch budget vs spent data");
      }
      return await res.json() as Promise<{ project: string; budget: number; spent: number }[]>; // Type assertion
    },
    staleTime: 60000
  });

  // Apply filters
  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Helper function to get client name
  const getClientName = (clientId: number) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Helper function to get client contact
  const getClientContact = (clientId: number) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.contactPerson : '';
  };

  // Helper to get project spent amount
  const getProjectSpent = (projectName: string) => {
    const projectData = budgetVsSpent.find((p: any) => p.project === projectName);
    return projectData ? projectData.spent : 0;
  };

  // Helper to get project progress percentage
  const getProjectProgress = (projectName: string) => {
    const projectData = budgetVsSpent.find((p: any) => p.project === projectName);
    if (!projectData) return 0;
    
    const { budget, spent } = projectData;
    return calculatePercentage(spent, budget);
  };

  return (
    <Card className="mt-6">
      <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Active Projects</h3>
        <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative rounded-md shadow-sm w-full sm:w-auto">
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
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto table-scroll">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    No projects found
                  </TableCell>
                </TableRow>
              ) : (
                currentProjects.map((project: Project) => {
                  const spent = getProjectSpent(project.name);
                  const spentPercentage = calculatePercentage(spent, project.budget);
                  const progressPercentage = getProjectProgress(project.name);
                  
                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-primary-100 text-primary-600 rounded-md flex items-center justify-center">
                            <PanelTop className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                            <div className="text-sm text-gray-500">Started on {formatDate(project.startDate)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">{getClientName(project.clientId)}</div>
                        <div className="text-sm text-gray-500">{getClientContact(project.clientId)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatCurrency(project.budget)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatCurrency(spent)}</div>
                        <div className="text-sm text-gray-500">{spentPercentage}%</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {formatStatus(project.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Progress value={progressPercentage} />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <Link href={`/projects/${project.id}`}>
                          <a className="text-primary-600 hover:text-primary-900 mr-3">View</a>
                        </Link>
                        <Link href={`/projects/${project.id}/edit`}>
                          <a className="text-gray-600 hover:text-gray-900">Edit</a>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstProject + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastProject, filteredProjects.length)}
              </span>{" "}
              of <span className="font-medium">{filteredProjects.length}</span> projects
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button
                variant="outline"
                size="icon"
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? "bg-primary-50 border-primary-500 text-primary-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
        <div className="flex sm:hidden">
          <Button
            variant="outline"
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="ml-3 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

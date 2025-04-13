// server/services/projectService.ts

import { storage } from "../storage";
import { Project, InsertProject, UserRoleType } from "@shared/schema";

export const projectService = {
  async getProject(id: number): Promise<Project | undefined> {
    return storage.getProject(id);
  },

  async getProjects(): Promise<Project[]> {
    return storage.getProjects();
  },

  async getProjectsByUser(userId: number, userRole: UserRoleType): Promise<Project[]> {
    return storage.getProjectsByUser(userId, userRole);
  },

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return storage.getProjectsByClient(clientId);
  },

  async createProject(project: InsertProject): Promise<Project> {
    // Add any business logic or validation here before creating the project
    return storage.createProject(project);
  },

  async updateProjectStatus(id: number, status: string): Promise<Project> {
    return storage.updateProjectStatus(id, status);
  },
};
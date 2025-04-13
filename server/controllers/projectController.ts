// server/controllers/projectController.ts

import { Request, Response } from "express";
import { projectService } from "../services/projectService";
import { UserRoleType } from "@shared/schema";

export const projectController = {
  async getProject(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await projectService.getProject(id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get project" });
    }
  },

  async getProjects(req: Request, res: Response) {
    try {
      const projects = await projectService.getProjects();
      res.json(projects);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get projects" });
    }
  },

  async getProjectsByUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const userRole = req.query.userRole as UserRoleType; // Assuming userRole is passed as a query parameter
      const projects = await projectService.getProjectsByUser(userId, userRole);
      res.json(projects);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get projects by user" });
    }
  },

  async getProjectsByClient(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      const projects = await projectService.getProjectsByClient(clientId);
      res.json(projects);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get projects by client" });
    }
  },

  async createProject(req: Request, res: Response) {
    try {
      const newProject = await projectService.createProject(req.body);
      res.status(201).json(newProject);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },

  async updateProjectStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const status = req.body.status as string; // Assuming status is passed in the request body
      const updatedProject = await projectService.updateProjectStatus(id, status);
      res.json(updatedProject);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },
};
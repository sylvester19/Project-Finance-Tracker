// server/controllers/clientController.ts

import { Request, Response } from "express";
import { clientService } from "../services/clientService";
import { insertClientSchema } from "@shared/schema";

export const clientController = {
  async getClient(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const client = await clientService.getClient(id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get client" });
    }
  },

  async getClients(req: Request, res: Response) {
    try {
      const clients = await clientService.getClients();
      res.json(clients);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get clients" });
    }
  },

  async getClientsBySalesperson(req: Request, res: Response) {
    try {
      const salesPersonId = parseInt(req.params.salesPersonId, 10);
      const clients = await clientService.getClientsBySalesperson(salesPersonId);
      res.json(clients);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to get clients by salesperson" });
    }
  },

  async createClient(req: Request, res: Response) {
    try {
 
      const parsed = insertClientSchema.parse(req.body); 
      const newClient = await clientService.createClient(parsed);
      res.status(201).json(newClient);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  },
};
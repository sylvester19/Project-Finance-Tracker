// server/services/clientService.ts

import { storage } from "../storage";
import { Client, InsertClient } from "@shared/schema";

export const clientService = {
  async getClient(id: number): Promise<Client | undefined> {
    return storage.getClient(id);
  },

  async getClients(): Promise<Client[]> {
    return storage.getClients();
  },

  async getClientsBySalesperson(salesPersonId: number): Promise<Client[]> {
    return storage.getClientsBySalesperson(salesPersonId);
  },

  async createClient(client: InsertClient): Promise<Client> {
    // Add any business logic or validation here before creating the client
    return storage.createClient(client);
  },
};
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { insertClientSchema } from '@shared/schema';

// Extend the client schema with client-side validation
const clientSchema = insertClientSchema.extend({
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientId?: string;
}

export default function ClientForm({ clientId }: ClientFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!clientId;

  // Fetch client if editing
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: isEditing,
  });

  // Define form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      location: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (client && isEditing) {
      form.reset({
        name: client.name,
        location: client.location,
        contactPerson: client.contactPerson || '',
        contactEmail: client.contactEmail || '',
        contactPhone: client.contactPhone || '',
      });
    }
  }, [client, form, isEditing]);

  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: 'Success',
        description: 'Client created successfully',
      });
      setLocation('/clients');
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to create client. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isLoading = isEditing && isLoadingClient;
  const isMutating = createClient.isPending;

  async function onSubmit(values: ClientFormValues) {
    if (isEditing) {
      // In a real application, you would handle the update here
      toast({
        title: 'Info',
        description: 'Client updating is not implemented in this demo',
      });
      setLocation('/clients');
    } else {
      createClient.mutate(values);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} disabled={isLoading || isMutating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client location" {...field} disabled={isLoading || isMutating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact name" {...field} disabled={isLoading || isMutating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact email" {...field} disabled={isLoading || isMutating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact phone" {...field} disabled={isLoading || isMutating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/clients')}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isMutating}>
                {isMutating ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Client' : 'Create Client')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

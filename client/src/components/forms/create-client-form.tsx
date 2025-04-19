// client/src/components/ClientCreateForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertClientSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ClientCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientCreateForm({ open, onOpenChange }: ClientCreateFormProps) {
  const { toast } = useToast();
  const { authenticatedFetch, user } = useAuth();

  const form = useForm<z.infer<typeof insertClientSchema>>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertClientSchema>) => {
      // console.log("📤 Sending data to API:", data);

      if (!user) {
        throw new Error("User not authenticated");
      }

      const res = await authenticatedFetch("POST", "/api/clients/create", {
        body: JSON.stringify({ ...data, createdById: user.id }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();
      // console.log("📥 Response from API:", json);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients/create'] });
      toast({
        title: "Client created",
        description: "The client has been created successfully",
      });
      onOpenChange(false); // Close the dialog
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create client",
      });
    },
  });

  const isSubmitting = createMutation.isPending;

  const handleCreate: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault(); // prevent form submit
  
    const values = form.getValues();
    // console.log("📋 Raw form values:", JSON.stringify(values));
    const raw = form.getValues();
    const parsed = insertClientSchema.safeParse({
      ...raw,
      createdById: user?.id,
    });

    if (!parsed.success) {
      // console.log("❌ Validation errors", JSON.stringify(parsed.error.flatten()));
      const fieldErrors = parsed.error.flatten().fieldErrors;
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        form.setError(field as keyof typeof values, {
          type: "manual",
          message: messages?.[0] || "Invalid",
        });
      });
      return;
    }
  
    console.log("✅ Parsed values", parsed.data);
    createMutation.mutate(parsed.data);
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Add a new client to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter client name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter contact person name"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                  <Input
                    type="email"
                    placeholder="Enter contact email"
                    {...field}
                    value={field.value || ""} 
                    disabled={isSubmitting}
                  />
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
                  <Input
                    type="tel"
                    placeholder="Enter contact phone"
                    {...field}
                    value={field.value || ""} 
                    disabled={isSubmitting}
                  />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Client"}
            </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
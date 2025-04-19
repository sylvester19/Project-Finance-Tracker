// client/src/components/ExpenseCreateForm.tsx
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import debounce from "lodash.debounce";
import { ExpenseCategory, insertExpenseSchema } from "@shared/schema";
import Select from "react-select";
import { useLocation } from "wouter";
  
interface ExpenseCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseCreateForm({ open, onOpenChange }: ExpenseCreateFormProps) {
  const { toast } = useToast();
  const { authenticatedFetch, user } = useAuth();
  const [, navigate] = useLocation();
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: number }[]>([]);

  if (!user?.id) {
    return (
      <div>
        <p>Unable to read user ID. Please log in to submit the form.</p>
      </div>
    );
  }

  const form = useForm<z.infer<typeof insertExpenseSchema>>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
      receiptUrl: null,
      submittedById: user.id,  
      reviewedById: user.id, 
      status: "pending",
      feedback: null,
    },
  });
  

  const fetchProjects = async (query: string) => {
    const res = await authenticatedFetch("GET", `/api/projects?search=${query}`);
    const data = await res.json();
    return data.map((project: any) => ({
      label: project.name,
      value: project.id,
    }));
  };

  const debouncedSearch = debounce(async (inputValue: string, callback: Function) => {
    const projects = await fetchProjects(inputValue);
    setProjectOptions(projects);
    callback(projects);
  }, 300);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertExpenseSchema>) => {
      const payload = {
        ...data,
        submittedById: user.id,
      };

      const res = await authenticatedFetch("POST", "/api/expenses/create", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      const responseData = await res.json();
      // console.log('Response Data:', responseData);  // Debugging: Log the response
      return responseData; // Ensure you return the entire response
    },
    onSuccess: (data) => {
      // console.log('Success Response Data:', JSON.stringify(data));

      toast({
        title: "Expense created",
        description: "The expense has been submitted successfully.",
      });
      onOpenChange(false);
      navigate(`/expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create expense",
      });
    },
  });

  const isSubmitting = createMutation.isPending;

  const handleSubmit = async () => {
    // console.log("🔵 Submitting form...");
    const isValid = await form.trigger();
    // console.log("✅ Form valid?", isValid);
    if (!isValid) {
      console.warn("❌ Form is invalid. Submission aborted.");
      // console.log("🧪 Field errors:", JSON.stringify(form.formState.errors)); // ← Add this
      return;
    }
  
    const rawValues = form.getValues();
    // console.log("📦 Raw form values:", rawValues);
  
    const payload = {
      ...rawValues,
      submittedById: user!.id,
      amount: parseFloat(rawValues.amount.toString()),
    };
  
    // console.log("📤 Final payload to submit:", payload);
    createMutation.mutate(payload);
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Expense</DialogTitle>
          <DialogDescription>Submit an expense for a project.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            {/* Project Select */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <Select
                      onInputChange={(val) => debouncedSearch(val, () => {})}
                      options={projectOptions}
                      onChange={(option) => field.onChange(option?.value)}
                      isClearable
                      isSearchable
                      placeholder="Search and select project..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    disabled={isSubmitting}
                  />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="What was this expense for?" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      options={Object.entries(ExpenseCategory).map(([key, value]) => ({
                        label: key.charAt(0) + key.slice(1).toLowerCase(), // Optional: Capitalize
                        value,
                      }))}
                      onChange={(option) => field.onChange(option?.value)}
                      placeholder="Select category..."
                      isClearable
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt URL (optional) */}
            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL</FormLabel>
                  <FormControl>
                  <Input
                    type="url"
                    placeholder="http://..."
                    {...field}
                    value={field.value ?? ""}
                    disabled={isSubmitting}
                  />

                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Create Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

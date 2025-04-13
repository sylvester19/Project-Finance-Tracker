import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { expenseFormSchema, ExpenseCategory } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Camera, Upload } from "lucide-react";

interface ExpenseFormProps {
  projectId?: number;
  expenseId?: number;
  defaultValues?: any;
}

export function ExpenseForm({ projectId, expenseId, defaultValues }: ExpenseFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isEditMode = !!expenseId;
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch projects for the dropdown if projectId is not provided
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      return res.json();
    },
    staleTime: 60000,
    enabled: !projectId, // Only fetch if projectId is not provided
  });

  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: defaultValues || {
      projectId: projectId || undefined,
      amount: 0,
      description: "",
      category: ExpenseCategory.EQUIPMENT,
      receiptUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseFormSchema>) => {
      // In a real app, you would first upload the image to storage and get a URL
      // For this example, we'll just simulate it
      const finalData = {
        ...data,
        receiptUrl: previewImage ? "https://example.com/receipt.jpg" : undefined,
      };
      
      const res = await apiRequest("POST", "/api/expenses", finalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/expenses`] });
      }
      toast({
        title: "Expense submitted",
        description: "Your expense has been submitted for approval",
      });
      navigate(projectId ? `/projects/${projectId}` : "/expenses");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create expense",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseFormSchema>) => {
      // In a real app, handle image upload here too
      const finalData = {
        ...data,
        receiptUrl: previewImage ? "https://example.com/receipt.jpg" : data.receiptUrl,
      };
      
      const res = await apiRequest("PATCH", `/api/expenses/${expenseId}`, finalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/${expenseId}`] });
      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully",
      });
      navigate(projectId ? `/projects/${projectId}` : "/expenses");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update expense",
      });
    }
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: z.infer<typeof expenseFormSchema>) {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read and preview the file
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!projectId && (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  disabled={isSubmitting || isProjectsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isProjectsLoading ? (
                      <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                    ) : projects.length === 0 ? (
                      <SelectItem value="none" disabled>No projects available</SelectItem>
                    ) : (
                      projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ExpenseCategory.EQUIPMENT}>Equipment</SelectItem>
                  <SelectItem value={ExpenseCategory.LABOR}>Labor</SelectItem>
                  <SelectItem value={ExpenseCategory.TRANSPORT}>Transport</SelectItem>
                  <SelectItem value={ExpenseCategory.MAINTENANCE}>Maintenance</SelectItem>
                  <SelectItem value={ExpenseCategory.UTILITIES}>Utilities</SelectItem>
                  <SelectItem value={ExpenseCategory.PERMITS}>Permits</SelectItem>
                  <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    className="pl-8"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this expense is for"
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Provide a clear description of the expense for approval.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Receipt Image</FormLabel>
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              className="flex items-center space-x-2"
              onClick={handleCaptureClick}
              disabled={isSubmitting}
            >
              <Camera className="h-4 w-4" />
              <span>Capture Receipt</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex items-center space-x-2"
              onClick={handleCaptureClick}
              disabled={isSubmitting}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Image</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </div>
          {previewImage && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Receipt Preview:</p>
              <div className="relative w-full max-w-sm h-40 border rounded-md overflow-hidden">
                <img
                  src={previewImage}
                  alt="Receipt preview"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(projectId ? `/projects/${projectId}` : "/expenses")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⚙️</span>
                {isEditMode ? "Updating..." : "Submitting..."}
              </>
            ) : (
              isEditMode ? "Update Expense" : "Submit Expense"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

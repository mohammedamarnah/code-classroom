import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const classroomSchema = z.object({
  name: z.string().min(1, "Classroom name is required"),
  description: z.string().optional(),
});

interface ClassroomFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClassroomForm({ onSuccess, onCancel }: ClassroomFormProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createClassroomMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/classrooms', data);
      return response.json();
    },
    onSuccess: (classroom) => {
      toast({
        title: "Success",
        description: `Classroom "${classroom.name}" created successfully! Invite code: ${classroom.inviteCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/teacher'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createClassroomMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Classroom</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classroom Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Java Programming 101" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Describe what this classroom is about..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3">
              <Button type="submit" disabled={createClassroomMutation.isPending}>
                {createClassroomMutation.isPending ? "Creating..." : "Create Classroom"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
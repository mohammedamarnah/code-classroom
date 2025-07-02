import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const joinClassroomSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required").length(6, "Invite code must be 6 characters"),
});

interface JoinClassroomProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function JoinClassroom({ onSuccess, onCancel }: JoinClassroomProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(joinClassroomSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const joinClassroomMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/classrooms/join', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully joined the classroom!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classrooms'] });
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
    joinClassroomMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="inviteCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invite Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter 6-character invite code" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-3">
          <Button type="submit" disabled={joinClassroomMutation.isPending}>
            {joinClassroomMutation.isPending ? "Joining..." : "Join Classroom"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
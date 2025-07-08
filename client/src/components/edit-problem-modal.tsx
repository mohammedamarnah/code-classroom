import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Plus, Trash2, Calendar, Clock, Trophy } from "lucide-react";
import { insertProblemSchema } from "@shared/schema";
import { z } from "zod";

const editProblemSchema = insertProblemSchema.extend({
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string().min(1, "Expected output is required")
  })).min(1, "At least one test case is required"),
  scheduledAt: z.string().optional(),
});

type EditProblemData = z.infer<typeof editProblemSchema>;

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface EditProblemModalProps {
  problem: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProblemModal({
  problem,
  isOpen,
  onClose,
}: EditProblemModalProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [showScheduleOption, setShowScheduleOption] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditProblemData>({
    resolver: zodResolver(editProblemSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      points: 10,
      timeLimit: 60,
      classroomId: 0,
      starterCode: "",
      scheduledAt: "",
      testCases: [],
    },
  });

  // Update form when problem data changes
  useEffect(() => {
    if (problem && isOpen) {
      form.reset({
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        points: problem.points,
        timeLimit: problem.timeLimit,
        classroomId: problem.classroomId,
        starterCode: problem.starterCode || "",
        scheduledAt: problem.scheduledAt 
          ? new Date(problem.scheduledAt).toISOString().slice(0, 16)
          : "",
        testCases: problem.testCases || [],
      });
      setTestCases(problem.testCases || []);
      setShowScheduleOption(!!problem.scheduledAt);
    }
  }, [problem, isOpen, form]);

  const updateProblemMutation = useMutation({
    mutationFn: async (data: EditProblemData) => {
      const response = await apiRequest("PUT", `/api/problems/${problem.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Problem updated successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classrooms/${problem.classroomId}/problems`],
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update problem",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProblemData) => {
    const processedData = {
      ...data,
      testCases,
      scheduledAt: showScheduleOption && data.scheduledAt ? data.scheduledAt : undefined,
    };
    updateProblemMutation.mutate(processedData);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "" }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: "input" | "expectedOutput", value: string) => {
    const updated = testCases.map((tc, i) =>
      i === index ? { ...tc, [field]: value } : tc
    );
    setTestCases(updated);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setTestCases([]);
    setShowScheduleOption(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-secondary text-white";
      case "medium":
        return "bg-accent text-white";
      case "hard":
        return "bg-red-500 text-white";
      default:
        return "bg-neutral-500 text-white";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="w-5 h-5 mr-2 text-primary" />
            Edit Problem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Problem Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Problem Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm">
                <Badge className={getDifficultyColor(problem?.difficulty || "")}>
                  {problem?.difficulty}
                </Badge>
                <span className="text-accent font-medium">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  {problem?.points} pts
                </span>
                <span className="text-neutral-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {problem?.timeLimit} seconds
                </span>
                {problem?.scheduledAt && (
                  <span className="text-orange-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Scheduled
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Problem Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Enter problem title"
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={form.watch("difficulty")}
                onValueChange={(value) => form.setValue("difficulty", value as "easy" | "medium" | "hard")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                {...form.register("points", { valueAsNumber: true })}
                placeholder="Points awarded"
              />
              {form.formState.errors.points && (
                <p className="text-red-500 text-sm">{form.formState.errors.points.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
              <Input
                id="timeLimit"
                type="number"
                {...form.register("timeLimit", { valueAsNumber: true })}
                placeholder="Time limit in seconds"
              />
              {form.formState.errors.timeLimit && (
                <p className="text-red-500 text-sm">{form.formState.errors.timeLimit.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Problem Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe the problem in detail..."
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Starter Code */}
          <div className="space-y-2">
            <Label htmlFor="starterCode">Starter Code (Optional)</Label>
            <Textarea
              id="starterCode"
              {...form.register("starterCode")}
              placeholder="public class Solution { ... }"
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Test Cases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Test Cases</Label>
              <Button type="button" onClick={addTestCase} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Test Case
              </Button>
            </div>
            
            {testCases.map((testCase, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Test Case {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTestCase(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Input (Optional)</Label>
                      <Textarea
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, "input", e.target.value)}
                        placeholder="Test input (leave empty if no input needed)"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Output</Label>
                      <Textarea
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                        placeholder="Expected output"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {testCases.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-neutral-500">No test cases added yet. Click "Add Test Case" to create one.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule-problem"
                checked={showScheduleOption}
                onCheckedChange={setShowScheduleOption}
              />
              <Label htmlFor="schedule-problem">Schedule this problem</Label>
            </div>
            
            {showScheduleOption && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Release Date and Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  {...form.register("scheduledAt")}
                />
                <p className="text-sm text-neutral-600">
                  The problem will be hidden from students until this date and time.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProblemMutation.isPending || testCases.length === 0}
            >
              {updateProblemMutation.isPending ? "Updating..." : "Update Problem"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
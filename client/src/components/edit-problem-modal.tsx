import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Plus, Minus, Calendar, Clock, Trophy } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab } from '@codemirror/commands';
import { keymap, EditorView } from '@codemirror/view';
import { z } from "zod";

const editProblemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().min(1, "Points must be greater than 0"),
  timeLimit: z.number().min(1, "Time limit must be greater than 0"),
  classroomId: z.number().min(1, "Please select a classroom"),
  starterCode: z.string().optional(),
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
  const [isScheduled, setIsScheduled] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditProblemData>({
    resolver: zodResolver(editProblemSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      points: 100,
      timeLimit: 30,
      classroomId: 0,
      starterCode: "",
      scheduledAt: "",
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
      });
      setTestCases(problem.testCases || []);
      setIsScheduled(!!problem.scheduledAt);
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
      scheduledAt: isScheduled && data.scheduledAt ? data.scheduledAt : undefined,
    };
    updateProblemMutation.mutate(processedData);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "" }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setTestCases([]);
    setIsScheduled(false);
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
            <div className="border rounded-md overflow-hidden">
              <CodeMirror
                value={form.watch("starterCode") || ""}
                height="200px"
                theme={oneDark}
                extensions={[
                  java(),
                  keymap.of([indentWithTab]),
                  EditorView.theme({
                    "&": {
                      fontSize: "14px",
                    },
                    ".cm-content": {
                      padding: "12px",
                    },
                    ".cm-focused": {
                      outline: "none",
                    },
                  }),
                  EditorView.lineWrapping,
                ]}
                onChange={(value) => form.setValue("starterCode", value)}
                placeholder="public class Solution {
    // Your starter code here
    
}"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: false,
                  allowMultipleSelections: false,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightSelectionMatches: true,
                }}
              />
            </div>
          </div>

          {/* Test Cases */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-neutral-700">Test Cases</label>
              <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                <Plus className="w-4 h-4 mr-1" />
                Add Test Case
              </Button>
            </div>
            
            <div className="space-y-3">
            
            {testCases.map((testCase, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Test Case {index + 1}</span>
                  {testCases.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeTestCase(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Input (Optional)</label>
                    <Textarea
                      rows={2}
                      placeholder="Input for this test case (leave empty if no input needed)"
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Expected Output</label>
                    <Textarea
                      rows={2}
                      placeholder="Expected output"
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Schedule Problem */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-neutral-600" />
                <Label htmlFor="schedule-toggle" className="text-sm font-medium">
                  Schedule this problem for later
                </Label>
              </div>
              <Switch
                id="schedule-toggle"
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
              />
            </div>
            
            {isScheduled && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Release Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  {...form.register("scheduledAt")}
                  min={(() => {
                    // Get current time and add 1 minute
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 1);
                    // Format for datetime-local (which expects local time)
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Time shown is in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button type="submit" disabled={updateProblemMutation.isPending}>
              {updateProblemMutation.isPending ? "Updating..." : "Update Problem"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
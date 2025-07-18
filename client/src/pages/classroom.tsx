import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Users,
  Trash2,
  Edit2,
  Settings,
  Lock,
  Calendar,
  Copy,
  Edit,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { formatDistanceToNow, isPast } from "date-fns";
import Leaderboard from "@/components/leaderboard";
import CopyProblemModal from "@/components/copy-problem-modal";
import EditProblemModal from "@/components/edit-problem-modal";
import ClassroomSubmissions from "@/components/classroom-submissions";

const classroomUpdateSchema = z.object({
  name: z.string().min(1, "Classroom name is required"),
  description: z.string().optional(),
});

type ClassroomUpdateData = z.infer<typeof classroomUpdateSchema>;

export default function Classroom() {
  const { id } = useParams();
  const classroomId = parseInt(id!);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copyProblemModal, setCopyProblemModal] = useState<{
    isOpen: boolean;
    problem: any;
  }>({
    isOpen: false,
    problem: null,
  });
  const [editProblemModal, setEditProblemModal] = useState<{
    isOpen: boolean;
    problem: any;
  }>({
    isOpen: false,
    problem: null,
  });
  const [activeView, setActiveView] = useState<"problems" | "submissions">(
    "problems",
  );

  const { data: classroom, isLoading: classroomLoading } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}`],
  });

  const { data: problems, isLoading: problemsLoading } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}/problems`],
  });

  const { data: leaderboard } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}/leaderboard`],
  });

  const { data: students } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}/students`],
  });

  const form = useForm<ClassroomUpdateData>({
    resolver: zodResolver(classroomUpdateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form values when dialog opens and classroom data is available
  useEffect(() => {
    if (showEditDialog && classroom) {
      form.reset({
        name: classroom.name,
        description: classroom.description || "",
      });
    }
  }, [showEditDialog, classroom, form]);

  const updateClassroomMutation = useMutation({
    mutationFn: async (data: ClassroomUpdateData) => {
      const response = await apiRequest(
        "PATCH",
        `/api/classrooms/${classroomId}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Classroom updated successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classrooms/${classroomId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClassroomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/classrooms/${classroomId}`,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Classroom deleted successfully!",
      });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: async (problemId: number) => {
      const response = await apiRequest("DELETE", `/api/problems/${problemId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Problem deleted successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classrooms/${classroomId}/problems`],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProblem = async (
    problemId: number,
    problemTitle: string,
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${problemTitle}"? This action cannot be undone.`,
      )
    ) {
      deleteProblemMutation.mutate(problemId);
    }
  };

  const handleUpdateClassroom = (data: ClassroomUpdateData) => {
    updateClassroomMutation.mutate(data);
  };

  const handleDeleteClassroom = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${classroom?.name}"? This will permanently delete all problems, submissions, and enrollments. This action cannot be undone.`,
      )
    ) {
      deleteClassroomMutation.mutate();
    }
  };

  // Check if current user is the teacher of this classroom
  const isClassroomTeacher =
    user?.role === "teacher" && user?.id === classroom?.teacherId;

  // State for countdown timers
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if a problem is available
  const isProblemAvailable = (problem: any) => {
    if (!problem.scheduledAt) return true;
    return isPast(new Date(problem.scheduledAt));
  };

  // Get countdown text for scheduled problems
  const getCountdownText = (scheduledAt: string) => {
    const scheduledDate = new Date(scheduledAt);
    return `Available in ${formatDistanceToNow(scheduledDate)}`;
  };

  // Utility function to truncate text
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  if (classroomLoading || problemsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

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

  const handleCopyProblem = (problem: any) => {
    setCopyProblemModal({
      isOpen: true,
      problem,
    });
  };

  const handleCloseCopyModal = () => {
    setCopyProblemModal({
      isOpen: false,
      problem: null,
    });
  };

  const handleEditProblem = (problem: any) => {
    setEditProblemModal({
      isOpen: true,
      problem,
    });
  };

  const handleCloseEditModal = () => {
    setEditProblemModal({
      isOpen: false,
      problem: null,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                {classroom?.name}
              </h1>
              <p className="text-neutral-600">{classroom?.description}</p>
            </div>
          </div>

          {/* Teacher Actions */}
          {isClassroomTeacher && (
            <div className="flex items-center space-x-2">
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Classroom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Classroom</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleUpdateClassroom)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Classroom Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Java Programming 101"
                                {...field}
                              />
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
                        <Button
                          type="submit"
                          disabled={updateClassroomMutation.isPending}
                        >
                          {updateClassroomMutation.isPending
                            ? "Updating..."
                            : "Update Classroom"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClassroom}
                disabled={deleteClassroomMutation.isPending}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteClassroomMutation.isPending
                  ? "Deleting..."
                  : "Delete Classroom"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Section */}
          <div className="lg:col-span-2">
            {isClassroomTeacher ? (
              <div className="w-full">
                {/* View Toggle Buttons */}
                <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
                  <Button
                    variant={activeView === "problems" ? "default" : "ghost"}
                    className={`flex-1 ${activeView === "problems" ? "bg-white shadow-sm text-black" : ""}`}
                    onClick={() => setActiveView("problems")}
                  >
                    Problems
                  </Button>
                  <Button
                    variant={activeView === "submissions" ? "default" : "ghost"}
                    className={`flex-1 ${activeView === "submissions" ? "bg-white shadow-sm text-black" : ""}`}
                    onClick={() => setActiveView("submissions")}
                  >
                    All Submissions
                  </Button>
                </div>

                {/* Problems View */}
                {activeView === "problems" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Problems</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {problems?.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">
                          No problems available yet.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {problems?.map((problem: any) => {
                            const isAvailable = isProblemAvailable(problem);
                            return (
                              <div
                                key={problem.id}
                                className={`border rounded-lg p-4 transition-all ${
                                  isAvailable
                                    ? "border-neutral-200 hover:shadow-md"
                                    : "border-neutral-200 bg-neutral-50"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h4
                                        className={`font-semibold ${
                                          isAvailable
                                            ? "text-neutral-900"
                                            : "text-neutral-500"
                                        }`}
                                      >
                                        {problem.title}
                                      </h4>
                                      <Badge
                                        className={
                                          isAvailable
                                            ? getDifficultyColor(
                                                problem.difficulty,
                                              )
                                            : "bg-neutral-300 text-neutral-600"
                                        }
                                      >
                                        {problem.difficulty}
                                      </Badge>
                                      <span
                                        className={`text-sm font-medium ${
                                          isAvailable
                                            ? "text-accent"
                                            : "text-neutral-500"
                                        }`}
                                      >
                                        {problem.points} pts
                                      </span>
                                      {!isAvailable && (
                                        <Badge
                                          variant="outline"
                                          className="text-orange-600 border-orange-300"
                                        >
                                          <Lock className="w-3 h-3 mr-1" />
                                          Scheduled
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                                      <span>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {problem.timeLimit} seconds
                                      </span>
                                      {!isAvailable && problem.scheduledAt && (
                                        <span className="text-orange-600 font-medium">
                                          <Calendar className="w-3 h-3 inline mr-1" />
                                          {getCountdownText(
                                            problem.scheduledAt,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    {isAvailable ? (
                                      <Link href={`/problem/${problem.id}`}>
                                        <Button>Solve</Button>
                                      </Link>
                                    ) : (
                                      <Button disabled variant="secondary">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Locked
                                      </Button>
                                    )}
                                    {user?.role === "teacher" &&
                                      user?.id === problem.createdBy && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleEditProblem(problem)
                                            }
                                            className="text-green-600 hover:text-green-700"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleCopyProblem(problem)
                                            }
                                            className="text-blue-600 hover:text-blue-700"
                                          >
                                            <Copy className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteProblem(
                                                problem.id,
                                                problem.title,
                                              )
                                            }
                                            disabled={
                                              deleteProblemMutation.isPending
                                            }
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Submissions View */}
                {activeView === "submissions" && (
                  <ClassroomSubmissions classroomId={classroomId} />
                )}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Available Problems</CardTitle>
                </CardHeader>
                <CardContent>
                  {problems?.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      No problems available yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {problems?.map((problem: any) => {
                        const isAvailable = isProblemAvailable(problem);
                        return (
                          <div
                            key={problem.id}
                            className={`border rounded-lg p-4 transition-all ${
                              isAvailable
                                ? "border-neutral-200 hover:shadow-md"
                                : "border-neutral-200 bg-neutral-50"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4
                                    className={`font-semibold ${
                                      isAvailable
                                        ? "text-neutral-900"
                                        : "text-neutral-500"
                                    }`}
                                  >
                                    {problem.title}
                                  </h4>
                                  <Badge
                                    className={
                                      isAvailable
                                        ? getDifficultyColor(problem.difficulty)
                                        : "bg-neutral-300 text-neutral-600"
                                    }
                                  >
                                    {problem.difficulty}
                                  </Badge>
                                  <span
                                    className={`text-sm font-medium ${
                                      isAvailable
                                        ? "text-accent"
                                        : "text-neutral-500"
                                    }`}
                                  >
                                    {problem.points} pts
                                  </span>
                                  {!isAvailable && (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-300"
                                    >
                                      <Lock className="w-3 h-3 mr-1" />
                                      Scheduled
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-neutral-500">
                                  <span>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {problem.timeLimit} seconds
                                  </span>
                                  {!isAvailable && problem.scheduledAt && (
                                    <span className="text-orange-600 font-medium">
                                      <Calendar className="w-3 h-3 inline mr-1" />
                                      {getCountdownText(problem.scheduledAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                {isAvailable ? (
                                  <Link href={`/problem/${problem.id}`}>
                                    <Button>Solve</Button>
                                  </Link>
                                ) : (
                                  <Button disabled variant="secondary">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Locked
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* All Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-accent" />
                  Students ({students?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students?.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500">
                    No students enrolled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students?.map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-neutral-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center text-sm font-bold text-neutral-700">
                          {(student.firstName ||
                            student.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-neutral-900">
                            {student.firstName || student.email}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {student.email}
                          </p>
                        </div>
                        {student.role === "teacher" && (
                          <Badge variant="secondary" className="text-xs">
                            Teacher
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-accent" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard?.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500">
                    No students with points yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard
                      ?.slice(0, 10)
                      .map((student: any, index: number) => (
                        <div
                          key={student.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg ${
                            index === 0
                              ? "bg-gradient-to-r from-accent to-orange-600 text-white"
                              : "bg-neutral-50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? "bg-white bg-opacity-20"
                                : index === 1
                                  ? "bg-neutral-400 text-white"
                                  : index === 2
                                    ? "bg-orange-400 text-white"
                                    : "bg-neutral-300 text-neutral-700"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                index === 0 ? "text-white" : "text-neutral-900"
                              }`}
                            >
                              {student.firstName || student.email}
                            </p>
                            <p
                              className={`text-xs ${
                                index === 0
                                  ? "text-white opacity-75"
                                  : "text-neutral-500"
                              }`}
                            >
                              {student.totalPoints} points
                            </p>
                          </div>
                          {index === 0 && <Trophy className="w-4 h-4" />}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Copy Problem Modal */}
      <CopyProblemModal
        problem={copyProblemModal.problem}
        isOpen={copyProblemModal.isOpen}
        onClose={handleCloseCopyModal}
        currentClassroomId={classroomId}
      />

      {/* Edit Problem Modal */}
      <EditProblemModal
        problem={editProblemModal.problem}
        isOpen={editProblemModal.isOpen}
        onClose={handleCloseEditModal}
      />
    </div>
  );
}

import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Trophy, Users, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Classroom() {
  const { id } = useParams();
  const classroomId = parseInt(id!);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const deleteProblemMutation = useMutation({
    mutationFn: async (problemId: number) => {
      const response = await apiRequest('DELETE', `/api/problems/${problemId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Problem deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/problems`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProblem = async (problemId: number, problemTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${problemTitle}"? This action cannot be undone.`)) {
      deleteProblemMutation.mutate(problemId);
    }
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
      case 'easy': return 'bg-secondary text-white';
      case 'medium': return 'bg-accent text-white';
      case 'hard': return 'bg-red-500 text-white';
      default: return 'bg-neutral-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{classroom?.name}</h1>
            <p className="text-neutral-600">{classroom?.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Problems Section */}
          <div className="lg:col-span-2">
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
                    {problems?.map((problem: any) => (
                      <div key={problem.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-neutral-900">{problem.title}</h4>
                              <Badge className={getDifficultyColor(problem.difficulty)}>
                                {problem.difficulty}
                              </Badge>
                              <span className="text-sm text-accent font-medium">{problem.points} pts</span>
                            </div>
                            <p className="text-sm text-neutral-600 mb-3">{problem.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-neutral-500">
                              <span>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {problem.timeLimit} seconds
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Link href={`/problem/${problem.id}`}>
                              <Button>
                                Solve
                              </Button>
                            </Link>
                            {user?.role === 'teacher' && user?.id === problem.createdBy && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProblem(problem.id, problem.title)}
                                disabled={deleteProblemMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <div key={student.id} className="flex items-center space-x-3 p-3 rounded-lg bg-neutral-50">
                        <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center text-sm font-bold text-neutral-700">
                          {(student.firstName || student.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-neutral-900">
                            {student.firstName || student.email}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {student.email}
                          </p>
                        </div>
                        {student.role === 'teacher' && (
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
                    {leaderboard?.slice(0, 10).map((student: any, index: number) => (
                      <div key={student.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                        index === 0 ? 'bg-gradient-to-r from-accent to-orange-600 text-white' : 'bg-neutral-50'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-white bg-opacity-20' :
                          index === 1 ? 'bg-neutral-400 text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          'bg-neutral-300 text-neutral-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            index === 0 ? 'text-white' : 'text-neutral-900'
                          }`}>
                            {student.firstName || student.email}
                          </p>
                          <p className={`text-xs ${
                            index === 0 ? 'text-white opacity-75' : 'text-neutral-500'
                          }`}>
                            {student.totalPoints} points
                          </p>
                        </div>
                        {index === 0 && (
                          <Trophy className="w-4 h-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

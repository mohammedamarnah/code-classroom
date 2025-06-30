import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Trophy, Play, Send } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProblemSolver() {
  const { id } = useParams();
  const problemId = parseInt(id!);
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const { data: problem, isLoading } = useQuery({
    queryKey: [`/api/problems/${problemId}`],
  });

  const submitMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/submissions', {
        problemId,
        code,
      });
      return response.json();
    },
    onSuccess: (submission) => {
      toast({
        title: submission.status === 'passed' ? "Success!" : "Try Again",
        description: submission.status === 'passed' 
          ? `Great job! You earned ${submission.pointsEarned} points.`
          : submission.error || "Your solution didn't pass all test cases.",
        variant: submission.status === 'passed' ? "default" : "destructive",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classrooms'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading problem...</p>
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

  const handleSubmit = () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write some code before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate(code);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href={`/classroom/${problem?.classroomId}`}>
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classroom
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-neutral-900">{problem?.title}</h1>
                <Badge className={getDifficultyColor(problem?.difficulty)}>
                  {problem?.difficulty}
                </Badge>
                <span className="text-sm text-accent font-medium">{problem?.points} points</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-neutral-500">
                <span>
                  <Clock className="w-4 h-4 inline mr-1" />
                  {problem?.timeLimit} seconds
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem Description */}
          <Card>
            <CardHeader>
              <CardTitle>Problem Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-neutral-600">
                {problem?.description}
              </div>
              
              {problem?.testCases && problem.testCases.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-neutral-900 mb-3">Example:</h4>
                  <div className="bg-neutral-100 p-3 rounded text-sm font-mono">
                    <div><strong>Input:</strong> {(problem.testCases as any[])[0]?.input}</div>
                    <div><strong>Output:</strong> {(problem.testCases as any[])[0]?.expectedOutput}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Editor */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Solution</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={submitMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    Submit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                className="w-full h-96 font-mono text-sm"
                placeholder={problem?.starterCode || `public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

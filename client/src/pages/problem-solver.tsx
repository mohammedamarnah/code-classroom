import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Trophy, Play, Send } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab } from '@codemirror/commands';
import { keymap, EditorView } from '@codemirror/view';

export default function ProblemSolver() {
  const { id } = useParams();
  const problemId = parseInt(id!);
  const [code, setCode] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const { data: problem, isLoading } = useQuery({
    queryKey: [`/api/problems/${problemId}`],
  });

  // Initialize code with starter code when problem data loads
  useEffect(() => {
    if (problem?.starterCode && !code) {
      setCode(problem.starterCode);
    }
  }, [problem, code]);

  const testMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest(`/api/problems/${problemId}/test`, 'POST', { code });
    },
    onSuccess: (result: any) => {
      setTestResult(result);
      toast({
        title: result.status === 'passed' ? "Test Passed!" : "Test Failed",
        description: result.status === 'passed' ? "All test cases passed!" : result.error || "Some test cases failed",
        variant: result.status === 'passed' ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Error",
        description: error.message || "Failed to run test",
        variant: "destructive"
      });
    }
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

  const handleTest = () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write some code before testing.",
        variant: "destructive",
      });
      return;
    }
    testMutation.mutate(code);
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
                    {(problem.testCases as any[])[0]?.input && (
                      <div><strong>Input:</strong> {(problem.testCases as any[])[0]?.input}</div>
                    )}
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
                    onClick={handleTest}
                    disabled={submitMutation.isPending || testMutation.isPending || !code.trim()}
                  >
                    {testMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-600 mr-1" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
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
              <div className="border rounded-md overflow-hidden">
                <CodeMirror
                  value={code}
                  height="400px"
                  theme={oneDark}
                  extensions={[
                    java(),
                    keymap.of([indentWithTab]),
                    EditorView.theme({
                      '&': {
                        fontSize: '14px'
                      },
                      '.cm-content': {
                        padding: '12px'
                      },
                      '.cm-focused': {
                        outline: 'none'
                      }
                    }),
                    EditorView.lineWrapping
                  ]}
                  onChange={(value) => setCode(value)}
                  placeholder={problem?.starterCode || `public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightSelectionMatches: true
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

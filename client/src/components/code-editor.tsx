import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Send, X } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";
import { keymap, EditorView } from "@codemirror/view";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CodeEditorProps {
  problem: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isSubmitting?: boolean;
}

export default function CodeEditor({
  problem,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CodeEditorProps) {
  const [code, setCode] = useState(problem?.starterCode || "");
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testMutation = useMutation({
    mutationFn: async (code: string) => {
      console.log("Testing code for problem:", problem.id);
      return await apiRequest(`/api/problems/${problem.id}/test`, "POST", {
        code,
      });
    },
    onSuccess: (result: any) => {
      console.log("Test result:", result);
      setTestResult(result);
      toast({
        title: result.status === "passed" ? "Test Passed!" : "Test Failed",
        description:
          result.status === "passed"
            ? "All test cases passed!"
            : result.error || "Some test cases failed",
        variant: result.status === "passed" ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      console.error("Test error:", error);
      toast({
        title: "Test Error",
        description: error.message || "Failed to run test",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

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

  const handleSubmit = () => {
    if (!code.trim()) return;
    onSubmit(code);
  };

  const handleTest = () => {
    if (!code.trim()) return;
    testMutation.mutate(code);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {problem.title}
                </h3>
                <Badge className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
                <span className="text-sm text-accent font-medium">
                  {problem.points} points
                </span>
              </div>
              <p className="text-sm text-neutral-600">
                {problem.timeLimit} seconds
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex h-96">
          {/* Problem Description */}
          <div className="w-1/2 p-6 border-r border-neutral-200 overflow-y-auto">
            <h4 className="font-medium text-neutral-900 mb-3">
              Problem Description
            </h4>
            <div className="prose prose-sm text-neutral-600 whitespace-pre-wrap">
              {problem.description}
            </div>

            {problem.testCases && problem.testCases.length > 0 && (
              <div className="mt-6">
                <h5 className="font-medium text-neutral-900 mb-2">Examples:</h5>
                <div className="space-y-3">
                  {problem.testCases.slice(0, 2).map((testCase: any, index: number) => (
                    <div key={index} className="bg-neutral-100 p-3 rounded text-sm font-mono">
                      <div className="font-medium text-neutral-800 mb-2">
                        Example {index + 1}:
                      </div>
                      {testCase?.input && (
                        <div className="mb-1">
                          <strong>Input:</strong> {testCase.input}
                        </div>
                      )}
                      <div>
                        <strong>Output:</strong> {testCase.expectedOutput}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="w-1/2 p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-neutral-900">Your Solution</h4>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Submit
                </Button>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <CodeMirror
                value={code}
                height="300px"
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
                onChange={(value) => setCode(value)}
                placeholder={
                  problem.starterCode ||
                  `public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`
                }
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

            {/* Test Result Display */}
            {testResult && (
              <div className="mt-4 p-4 border rounded-md">
                <h5 className="font-medium mb-2">Test Result</h5>
                <div
                  className={`p-3 rounded-md ${
                    testResult.status === "passed"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="font-medium mb-1">
                    Status:{" "}
                    {testResult.status === "passed" ? "✅ Passed" : "❌ Failed"}
                  </div>
                  {testResult.executionTime && (
                    <div className="text-sm">
                      Execution Time: {testResult.executionTime}ms
                    </div>
                  )}
                  {testResult.output && (
                    <div className="mt-2">
                      <div className="text-sm font-medium">Output:</div>
                      <pre className="text-xs bg-neutral-100 p-2 rounded mt-1 whitespace-pre-wrap">
                        {testResult.output}
                      </pre>
                    </div>
                  )}
                  {testResult.error && (
                    <div className="mt-2">
                      <div className="text-sm font-medium">Error:</div>
                      <pre className="text-xs bg-neutral-100 p-2 rounded mt-1 whitespace-pre-wrap">
                        {testResult.error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

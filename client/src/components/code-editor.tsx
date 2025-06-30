import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Send, X } from "lucide-react";

interface CodeEditorProps {
  problem: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isSubmitting?: boolean;
}

export default function CodeEditor({ problem, isOpen, onClose, onSubmit, isSubmitting }: CodeEditorProps) {
  const [code, setCode] = useState(problem?.starterCode || '');

  if (!isOpen) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-secondary text-white';
      case 'medium': return 'bg-accent text-white';
      case 'hard': return 'bg-red-500 text-white';
      default: return 'bg-neutral-500 text-white';
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) return;
    onSubmit(code);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">{problem.title}</h3>
                <Badge className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
                <span className="text-sm text-accent font-medium">{problem.points} points</span>
              </div>
              <p className="text-sm text-neutral-600">{problem.timeLimit} seconds</p>
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
            <h4 className="font-medium text-neutral-900 mb-3">Problem Description</h4>
            <div className="prose prose-sm text-neutral-600 whitespace-pre-wrap">
              {problem.description}
            </div>

            {problem.testCases && problem.testCases.length > 0 && (
              <div className="mt-6">
                <h5 className="font-medium text-neutral-900 mb-2">Example:</h5>
                <div className="bg-neutral-100 p-3 rounded text-sm font-mono">
                  <div><strong>Input:</strong> {problem.testCases[0]?.input}</div>
                  <div><strong>Output:</strong> {problem.testCases[0]?.expectedOutput}</div>
                </div>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="w-1/2 p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-neutral-900">Your Solution</h4>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled={isSubmitting}>
                  <Play className="w-4 h-4 mr-1" />
                  Test
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !code.trim()}>
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Submit
                </Button>
              </div>
            </div>

            <Textarea
              className="w-full h-64 font-mono text-sm"
              placeholder={problem.starterCode || `public class Solution {
    public static void main(String[] args) {
        // Your code here
        
    }
}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

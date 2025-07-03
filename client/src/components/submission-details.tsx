import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Code, CheckCircle, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface SubmissionDetailsProps {
  submission: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmissionDetails({
  submission,
  isOpen,
  onClose,
}: SubmissionDetailsProps) {
  if (!submission) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(submission.status)}
            Submission Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this code submission including the code, output, and execution results.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                  {submission.problem.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-2">
                  {submission.problem.description}
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {submission.problem.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {submission.problem.points} points
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Submission Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm">
                      {submission.student.firstName || submission.student.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm">
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">
                      {submission.pointsEarned} points earned
                    </span>
                  </div>
                  
                  {submission.executionTime && (
                    <div className="text-sm text-neutral-600">
                      Execution time: {submission.executionTime}ms
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Submitted Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-neutral-50 border rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-neutral-800 font-mono whitespace-pre-wrap">
                  {submission.code}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Output and Error Section */}
          {(submission.output || submission.error) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submission.output && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-green-700">
                      Output
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-xs font-mono text-green-800 whitespace-pre-wrap">
                        {submission.output}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {submission.error && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-700">
                      Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-xs font-mono text-red-800 whitespace-pre-wrap">
                        {submission.error}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
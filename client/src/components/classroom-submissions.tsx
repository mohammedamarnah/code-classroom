import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, X, AlertTriangle, Clock, Eye, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import SubmissionDetails from "./submission-details";

interface ClassroomSubmissionsProps {
  classroomId: number;
}

export default function ClassroomSubmissions({ classroomId }: ClassroomSubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [problemFilter, setProblemFilter] = useState<string>("all");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/classrooms', classroomId, 'submissions'],
    queryFn: async () => {
      const response = await fetch(`/api/classrooms/${classroomId}/submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    },
  });

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

  // Get unique problems for filter
  const uniqueProblems = Array.from(
    new Set(submissions.map((sub: any) => sub.problem.title))
  );

  // Filter submissions based on search and filters
  const filteredSubmissions = submissions.filter((submission: any) => {
    const matchesSearch = 
      submission.student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.problem.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesProblem = problemFilter === "all" || submission.problem.title === problemFilter;

    return matchesSearch && matchesStatus && matchesProblem;
  });

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            All Classroom Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by student name, email, or problem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={problemFilter} onValueChange={setProblemFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by problem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Problems</SelectItem>
                {uniqueProblems.map((problem) => (
                  <SelectItem key={problem} value={problem}>
                    {problem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </div>

          {/* Submissions Table */}
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {submissions.length === 0 ? "No submissions yet." : "No submissions match your filters."}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission: any) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {submission.student.firstName || submission.student.email}
                          </span>
                          <span className="text-sm text-gray-500">
                            {submission.student.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{submission.problem.title}</span>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {submission.problem.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {submission.problem.points}pts
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(submission.status)}
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{submission.pointsEarned}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{format(new Date(submission.submittedAt), 'MMM d, yyyy')}</span>
                          <span className="text-gray-500">
                            {format(new Date(submission.submittedAt), 'h:mm a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubmission(submission)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Modal */}
      <SubmissionDetails
        submission={selectedSubmission}
        isOpen={showSubmissionDetails}
        onClose={() => setShowSubmissionDetails(false)}
      />
    </div>
  );
}
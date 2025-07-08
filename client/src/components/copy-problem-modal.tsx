import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Clock, Trophy, AlertCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CopyProblemModalProps {
  problem: any;
  isOpen: boolean;
  onClose: () => void;
  currentClassroomId: number;
}

export default function CopyProblemModal({
  problem,
  isOpen,
  onClose,
  currentClassroomId,
}: CopyProblemModalProps) {
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [includeSchedule, setIncludeSchedule] = useState(false);
  const { toast } = useToast();

  const { data: classrooms = [] } = useQuery({
    queryKey: ['/api/classrooms'],
    enabled: isOpen,
  });

  // Filter out the current classroom
  const availableClassrooms = classrooms.filter(
    (classroom: any) => classroom.id !== currentClassroomId
  );

  const copyProblemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/problems/${problem.id}/copy`, {
        targetClassroomId: parseInt(selectedClassroomId),
        includeSchedule,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Problem copied successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/classrooms/${selectedClassroomId}/problems`],
      });
      onClose();
      setSelectedClassroomId("");
      setIncludeSchedule(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy problem",
        variant: "destructive",
      });
    },
  });

  const handleCopy = () => {
    if (!selectedClassroomId) {
      toast({
        title: "Error",
        description: "Please select a classroom to copy to",
        variant: "destructive",
      });
      return;
    }
    copyProblemMutation.mutate();
  };

  const handleClose = () => {
    onClose();
    setSelectedClassroomId("");
    setIncludeSchedule(false);
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

  const isScheduled = problem?.scheduledAt;
  const isScheduledFuture = isScheduled && new Date(problem.scheduledAt) > new Date();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Copy className="w-5 h-5 mr-2 text-primary" />
            Copy Problem to Another Classroom
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Problem Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{problem?.title}</CardTitle>
              <CardDescription>{problem?.description}</CardDescription>
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
              </div>
              {isScheduled && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center text-sm text-orange-800">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {isScheduledFuture
                        ? `Scheduled for ${formatDistanceToNow(new Date(problem.scheduledAt))} from now`
                        : `Was scheduled for ${formatDistanceToNow(new Date(problem.scheduledAt))} ago`}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classroom Selection */}
          <div className="space-y-3">
            <Label htmlFor="classroom-select">Select target classroom</Label>
            <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
              <SelectTrigger id="classroom-select">
                <SelectValue placeholder="Choose a classroom..." />
              </SelectTrigger>
              <SelectContent>
                {availableClassrooms.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No other classrooms available</p>
                    <p className="text-xs">Create another classroom to copy problems between them</p>
                  </div>
                ) : (
                  availableClassrooms.map((classroom: any) => (
                    <SelectItem key={classroom.id} value={classroom.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{classroom.name}</span>
                        {classroom.description && (
                          <span className="text-xs text-neutral-500">
                            {classroom.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Option */}
          {isScheduled && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-schedule"
                  checked={includeSchedule}
                  onCheckedChange={setIncludeSchedule}
                />
                <Label htmlFor="include-schedule" className="text-sm">
                  Copy with original schedule
                </Label>
              </div>
              <div className="ml-6 text-xs text-neutral-600">
                {includeSchedule ? (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Problem will be copied with the same scheduled time
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Problem will be available immediately in the target classroom
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!selectedClassroomId || copyProblemMutation.isPending || availableClassrooms.length === 0}
            >
              {copyProblemMutation.isPending ? "Copying..." : "Copy Problem"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
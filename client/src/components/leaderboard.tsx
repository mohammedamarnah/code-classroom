import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Trophy } from "lucide-react";

interface LeaderboardProps {
  classroomId: number;
  currentUserId?: string;
}

export default function Leaderboard({ classroomId, currentUserId }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: [`/api/classrooms/${classroomId}/leaderboard`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-accent" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-neutral-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-accent" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            No students enrolled yet.
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.slice(0, 10).map((student: any, index: number) => (
              <div 
                key={student.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  student.id === currentUserId 
                    ? 'bg-gradient-to-r from-accent to-orange-600 text-white' 
                    : 'bg-neutral-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  student.id === currentUserId ? 'bg-white bg-opacity-20' :
                  index === 0 ? 'bg-accent text-white' :
                  index === 1 ? 'bg-neutral-400 text-white' :
                  index === 2 ? 'bg-orange-400 text-white' :
                  'bg-neutral-300 text-neutral-700'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    student.id === currentUserId ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {student.firstName && student.lastName 
                      ? `${student.firstName} ${student.lastName}` 
                      : student.firstName || student.email
                    } 
                    {student.id === currentUserId && ' (You)'}
                  </p>
                  <div className={`text-xs ${
                    student.id === currentUserId ? 'text-white opacity-75' : 'text-neutral-500'
                  }`}>
                    {student.totalPoints} points • {student.problemsSolved} solved
                  </div>
                </div>
                {index === 0 && (
                  <Crown className="w-4 h-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import JoinClassroom from "./join-classroom";
import { Trophy, CheckCircle, Flame, TrendingUp, Medal, Crown, Clock, Users, Plus } from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null);
  const [showJoinClassroom, setShowJoinClassroom] = useState(false);

  const { data: classrooms } = useQuery({
    queryKey: ['/api/classrooms'],
  });

  const { data: achievements } = useQuery({
    queryKey: [`/api/achievements/${user?.id}`],
  });

  const { data: problems } = useQuery({
    queryKey: selectedClassroom ? [`/api/classrooms/${selectedClassroom}/problems`] : null,
    enabled: !!selectedClassroom,
  });

  const { data: leaderboard } = useQuery({
    queryKey: selectedClassroom ? [`/api/classrooms/${selectedClassroom}/leaderboard`] : null,
    enabled: !!selectedClassroom,
  });

  const selectedClassroomData = classrooms?.find((c: any) => c.id === selectedClassroom);

  // Auto-select first classroom if none selected
  if (!selectedClassroom && classrooms?.length > 0) {
    setSelectedClassroom(classrooms[0].id);
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-secondary text-white';
      case 'medium': return 'bg-accent text-white';
      case 'hard': return 'bg-red-500 text-white';
      default: return 'bg-neutral-500 text-white';
    }
  };

  const userRank = leaderboard?.findIndex((student: any) => student.id === user?.id) + 1 || 0;
  const level = user?.level || 1;
  const currentXP = user?.totalPoints || 0;
  const nextLevelXP = level * 1000;
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section with Gamification */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Student'}!
            </h2>
            <p className="text-neutral-600">Continue your coding journey</p>
          </div>
          
          {/* Student Level Badge */}
          <div className="mt-4 sm:mt-0">
            <div className="bg-gradient-to-r from-accent to-orange-600 text-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Medal className="w-6 h-6" />
                <span className="text-lg font-bold">Level {level}</span>
              </div>
              <div className="text-sm opacity-90">Code Warrior</div>
              <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2">
                <div className="bg-white rounded-full h-2" style={{ width: `${Math.min(progress, 100)}%` }}></div>
              </div>
              <div className="text-xs mt-1 opacity-75">
                {currentXP} / {nextLevelXP} XP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Points</p>
                <p className="text-2xl font-bold text-neutral-900">{user?.totalPoints || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Problems Solved</p>
                <p className="text-2xl font-bold text-neutral-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Flame className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Current Streak</p>
                <p className="text-2xl font-bold text-neutral-900">{user?.currentStreak || 0} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Rank</p>
                <p className="text-2xl font-bold text-neutral-900">#{userRank || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Problems Section */}
        <div className="lg:col-span-2">
          {/* Classroom Selector */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-neutral-700">Select Classroom</label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowJoinClassroom(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Join Class
                </Button>
              </div>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedClassroom || ''}
                onChange={(e) => setSelectedClassroom(parseInt(e.target.value))}
              >
                <option value="">Choose a classroom...</option>
                {(classrooms as any[])?.map((classroom: any) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - {classroom.teacher.firstName || classroom.teacher.email}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
          
          {/* Join Classroom Form */}
          {showJoinClassroom && (
            <div className="mb-6">
              <JoinClassroom 
                onSuccess={() => setShowJoinClassroom(false)}
                onCancel={() => setShowJoinClassroom(false)}
              />
            </div>
          )}
          
          {/* Available Problems */}
          {selectedClassroom && (
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
                          <Link href={`/problem/${problem.id}`}>
                            <Button className="ml-4">
                              Solve
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          {selectedClassroom && (
            <Card>
              <CardHeader>
                <CardTitle>Class Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard?.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500">
                    No students enrolled yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard?.slice(0, 5).map((student: any, index: number) => (
                      <div key={student.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                        student.id === user?.id 
                          ? 'bg-gradient-to-r from-accent to-orange-600 text-white' 
                          : 'bg-neutral-50'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          student.id === user?.id ? 'bg-white bg-opacity-20' :
                          index === 0 ? 'bg-accent text-white' :
                          index === 1 ? 'bg-neutral-400 text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          'bg-neutral-300 text-neutral-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            student.id === user?.id ? 'text-white' : 'text-neutral-900'
                          }`}>
                            {student.firstName || student.email} {student.id === user?.id && '(You)'}
                          </p>
                          <p className={`text-xs ${
                            student.id === user?.id ? 'text-white opacity-75' : 'text-neutral-500'
                          }`}>
                            {student.totalPoints} points
                          </p>
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
          )}
          
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements?.length === 0 ? (
                <div className="text-center py-4 text-neutral-500">
                  No achievements yet. Start solving problems!
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements?.slice(0, 3).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{achievement.title}</p>
                        <p className="text-xs text-neutral-500">{achievement.description}</p>
                      </div>
                      <span className="text-xs text-accent font-medium">+{achievement.points} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import JoinClassroom from "./join-classroom";
import {
  Trophy,
  CheckCircle,
  Flame,
  TrendingUp,
  Medal,
  Crown,
  Clock,
  Users,
  Plus,
} from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const [showJoinClassroom, setShowJoinClassroom] = useState(false);

  // Show loading state while user data is being fetched
  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ["/api/classrooms"],
  });

  const { data: achievements } = useQuery({
    queryKey: [`/api/achievements/${user.id}`],
    enabled: !!user?.id,
  });

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
              Welcome back,{" "}
              {user?.firstName || user?.email?.split("@")[0] || "Student"}!
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
                <div
                  className="bg-white rounded-full h-2"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
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
                <p className="text-sm font-medium text-neutral-600">
                  Total Points
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {user?.totalPoints || 0}
                </p>
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
                <p className="text-sm font-medium text-neutral-600">
                  Problems Solved
                </p>
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
                <p className="text-sm font-medium text-neutral-600">
                  Current Streak
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {user?.currentStreak || 0} days
                </p>
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
                <p className="text-2xl font-bold text-neutral-900">
                  -
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classrooms Section */}
        <div className="lg:col-span-2">
          {/* My Classrooms */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Classrooms</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJoinClassroom(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Join Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {classroomsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading classrooms...</p>
                </div>
              ) : !classrooms || classrooms.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No classrooms joined yet. Join your first classroom to get started!
                </div>
              ) : (
                <div className="space-y-4">
                  {classrooms.map((classroom: any) => (
                    <Link key={classroom.id} href={`/classroom/${classroom.id}`}>
                      <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-neutral-900 mb-1">{classroom.name}</h4>
                            <p className="text-sm text-neutral-600 mb-2">{classroom.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-neutral-500">
                              <span>
                                <Users className="w-4 h-4 inline mr-1" />
                                Teacher: {classroom.teacher?.firstName || classroom.teacher?.email || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-primary font-medium">View Classroom →</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements &&
              Array.isArray(achievements) &&
              achievements.length === 0 ? (
                <div className="text-center py-4 text-neutral-500">
                  No achievements yet. Start solving problems!
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements &&
                    Array.isArray(achievements) &&
                    achievements.slice(0, 3).map((achievement: any) => (
                      <div
                        key={achievement.id}
                        className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">
                            {achievement.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {achievement.description}
                          </p>
                        </div>
                        <span className="text-xs text-accent font-medium">
                          +{achievement.points} XP
                        </span>
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

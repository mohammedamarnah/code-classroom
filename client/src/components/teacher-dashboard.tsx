import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ProblemForm from "./problem-form";
import ClassroomForm from "./classroom-form";
import { useState } from "react";
import { Presentation, Users, ClipboardList, CheckCircle, Plus, Edit, Eye } from "lucide-react";
import { Link } from "wouter";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [showClassroomForm, setShowClassroomForm] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null);

  const { data: classrooms } = useQuery({
    queryKey: ['/api/classrooms'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats/teacher'],
  });

  const { data: recentSubmissions } = useQuery({
    queryKey: ['/api/submissions/recent'],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Teacher Dashboard</h2>
        <p className="text-neutral-600">Manage your classrooms and track student progress</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Presentation className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Classrooms</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalClassrooms || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Students</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalStudents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-8 w-8 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Problems Created</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalProblems || 0}</p>
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
                <p className="text-sm font-medium text-neutral-600">Submissions</p>
                <p className="text-2xl font-bold text-neutral-900">{stats?.totalSubmissions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classrooms Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Classrooms</CardTitle>
                <Button onClick={() => setShowClassroomForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Classroom
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {classrooms?.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No classrooms created yet. Create your first classroom to get started!
                </div>
              ) : (
                <div className="space-y-4">
                  {classrooms?.map((classroom: any) => (
                    <div key={classroom.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-neutral-900 mb-1">{classroom.name}</h4>
                          <p className="text-sm text-neutral-600 mb-2">{classroom.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-neutral-500">
                            <span>
                              <Users className="w-4 h-4 inline mr-1" />
                              Invite Code: {classroom.inviteCode}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Link href={`/classroom/${classroom.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Problem Creation Section */}
          {!showProblemForm ? (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Create New Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Button onClick={() => setShowProblemForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Problem
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-8">
              <ProblemForm 
                classrooms={classrooms || []}
                onSuccess={() => setShowProblemForm(false)}
                onCancel={() => setShowProblemForm(false)}
              />
            </div>
          )}
          
          {/* Classroom Creation Section */}
          {showClassroomForm && (
            <div className="mt-8">
              <ClassroomForm 
                onSuccess={() => setShowClassroomForm(false)}
                onCancel={() => setShowClassroomForm(false)}
              />
            </div>
          )}
        </div>
        
        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubmissions?.length === 0 ? (
                <div className="text-center py-4 text-neutral-500">
                  No submissions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSubmissions?.slice(0, 5).map((submission: any) => (
                    <div key={submission.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        submission.status === 'passed' ? 'bg-secondary' : 'bg-red-500'
                      }`}>
                        {submission.status === 'passed' ? <CheckCircle className="w-4 h-4" /> : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{submission.problem.title}</p>
                        <p className="text-xs text-neutral-500">by {submission.student.firstName || submission.student.email}</p>
                      </div>
                      <span className={`text-xs font-medium ${
                        submission.status === 'passed' ? 'text-secondary' : 'text-red-500'
                      }`}>
                        {submission.pointsEarned}pts
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

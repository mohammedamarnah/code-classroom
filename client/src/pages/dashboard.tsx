import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import TeacherDashboard from "@/components/teacher-dashboard";
import StudentDashboard from "@/components/student-dashboard";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>(user?.role === 'teacher' ? 'teacher' : 'student');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Code className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-bold text-neutral-900">CodeClassroom</h1>
            </div>
            
            {/* Role Toggle - only show if user is teacher */}
            <div className="flex items-center space-x-4">
              {user?.role === 'teacher' && (
                <div className="bg-neutral-100 p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'teacher' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('teacher')}
                  >
                    Teacher
                  </Button>
                  <Button
                    variant={viewMode === 'student' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('student')}
                  >
                    Student
                  </Button>
                </div>
              )}
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.firstName || user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      {viewMode === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
}

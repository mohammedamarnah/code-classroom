import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Users, Trophy, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Code className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-bold text-neutral-900">CodeClassroom</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/signup">
                <Button variant="outline">
                  Sign Up
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Learn Java Programming
            <span className="text-primary block">The Interactive Way</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            A comprehensive Java programming education platform with classroom management, 
            auto-grading, and gamified student progress tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-3"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign in with Replit
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Everything You Need to Master Java</h2>
          <p className="text-lg text-neutral-600">Powerful tools for both teachers and students</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Classroom Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage virtual classrooms. Students can easily join with invite codes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Code className="w-12 h-12 text-secondary mx-auto mb-4" />
              <CardTitle>Auto-Grading</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Submit Java code and get instant feedback with automated test case validation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Trophy className="w-12 h-12 text-accent mx-auto mb-4" />
              <CardTitle>Gamification</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Earn points, unlock achievements, and compete on leaderboards to stay motivated.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your learning journey with detailed statistics and performance insights.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Java Journey?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of students already learning Java on CodeClassroom
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign Up Now
          </Button>
        </div>
      </div>
    </div>
  );
}

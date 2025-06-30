import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertClassroomSchema, insertProblemSchema, insertSubmissionSchema, insertEnrollmentSchema } from "@shared/schema";
import { executeJavaCode } from "./javaExecutor";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Classroom routes
  app.post('/api/classrooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create classrooms" });
      }

      const classroomData = insertClassroomSchema.parse(req.body);
      const classroom = await storage.createClassroom({
        ...classroomData,
        teacherId: userId,
      });
      
      res.json(classroom);
    } catch (error) {
      console.error("Error creating classroom:", error);
      res.status(500).json({ message: "Failed to create classroom" });
    }
  });

  app.get('/api/classrooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let classrooms;
      if (user?.role === 'teacher') {
        classrooms = await storage.getClassroomsByTeacher(userId);
      } else {
        classrooms = await storage.getClassroomsByStudent(userId);
      }
      
      res.json(classrooms);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      res.status(500).json({ message: "Failed to fetch classrooms" });
    }
  });

  app.post('/api/classrooms/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inviteCode } = req.body;
      
      const classroom = await storage.getClassroomByInviteCode(inviteCode);
      if (!classroom) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      const isEnrolled = await storage.isStudentEnrolled(classroom.id, userId);
      if (isEnrolled) {
        return res.status(400).json({ message: "Already enrolled in this classroom" });
      }

      await storage.enrollStudent(classroom.id, userId);
      res.json({ message: "Successfully joined classroom" });
    } catch (error) {
      console.error("Error joining classroom:", error);
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  app.get('/api/classrooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      res.json(classroom);
    } catch (error) {
      console.error("Error fetching classroom:", error);
      res.status(500).json({ message: "Failed to fetch classroom" });
    }
  });

  app.get('/api/classrooms/:id/students', isAuthenticated, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const students = await storage.getClassroomStudents(classroomId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/classrooms/:id/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const leaderboard = await storage.getClassroomLeaderboard(classroomId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Problem routes
  app.post('/api/problems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create problems" });
      }

      const problemData = insertProblemSchema.parse(req.body);
      const problem = await storage.createProblem({
        ...problemData,
        createdBy: userId,
      });
      
      res.json(problem);
    } catch (error) {
      console.error("Error creating problem:", error);
      res.status(500).json({ message: "Failed to create problem" });
    }
  });

  app.get('/api/classrooms/:id/problems', isAuthenticated, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const problems = await storage.getClassroomProblems(classroomId);
      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  app.get('/api/problems/:id', isAuthenticated, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const problem = await storage.getProblem(problemId);
      
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      res.json(problem);
    } catch (error) {
      console.error("Error fetching problem:", error);
      res.status(500).json({ message: "Failed to fetch problem" });
    }
  });

  // Test problem route
  app.post('/api/problems/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const { code } = req.body;
      
      const problem = await storage.getProblem(problemId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Execute the code
      const result = await executeJavaCode(code, problem.testCases as any[]);
      
      res.json({
        status: result.status,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime
      });
    } catch (error) {
      console.error("Error testing code:", error);
      res.status(500).json({ message: "Failed to test code" });
    }
  });

  // Submission routes
  app.post('/api/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const submissionData = insertSubmissionSchema.parse(req.body);
      
      const problem = await storage.getProblem(submissionData.problemId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Execute the code
      const result = await executeJavaCode(submissionData.code, problem.testCases as any[]);
      
      const submission = await storage.createSubmission({
        ...submissionData,
        studentId: userId,
        status: result.status,
        pointsEarned: result.status === 'passed' ? problem.points : 0,
        executionTime: result.executionTime,
        output: result.output,
        error: result.error,
      });

      // Update user points if submission passed
      if (result.status === 'passed') {
        await storage.updateUserPoints(userId, problem.points);
        
        // Check for achievements
        const userSubmissions = await storage.getStudentSubmissions(userId);
        const passedSubmissions = userSubmissions.filter(s => s.status === 'passed');
        
        // Check for problem solving achievements
        if (passedSubmissions.length === 10) {
          await storage.createAchievement(userId, 'problems_solved', 'Problem Solver', 'Solved 10 problems', 100);
        } else if (passedSubmissions.length === 20) {
          await storage.createAchievement(userId, 'problems_solved', 'Code Master', 'Solved 20 problems', 200);
        }
      }

      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get('/api/problems/:id/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const submissions = await storage.getProblemSubmissions(problemId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get('/api/submissions/recent', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const submissions = await storage.getRecentSubmissions(limit);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      res.status(500).json({ message: "Failed to fetch recent submissions" });
    }
  });

  // Stats routes
  app.get('/api/stats/teacher', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can access teacher stats" });
      }

      const stats = await storage.getTeacherStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch teacher stats" });
    }
  });

  app.get('/api/achievements/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'join_classroom') {
          // Join classroom for real-time updates
          ws.classroomId = data.classroomId;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast leaderboard updates
  global.broadcastLeaderboardUpdate = (classroomId: number, leaderboard: any[]) => {
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN && client.classroomId === classroomId) {
        client.send(JSON.stringify({
          type: 'leaderboard_update',
          data: leaderboard
        }));
      }
    });
  };

  return httpServer;
}

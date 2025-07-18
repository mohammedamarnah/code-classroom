import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Combined authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    // Check OAuth authentication
    if (req.isAuthenticated() && req.user.claims?.sub) {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        req.currentUser = user;
        req.currentUserId = userId;
        return next();
      }
    }

    // Check email/password authentication
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.currentUser = user;
        req.currentUserId = req.session.userId;
        return next();
      }
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
import {
  insertClassroomSchema,
  insertProblemSchema,
  insertSubmissionSchema,
  insertEnrollmentSchema,
  emailSignupSchema,
} from "@shared/schema";
import { executeJavaCode } from "./javaExecutor";
import bcrypt from "bcrypt";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (req.isAuthenticated()) {
        // OAuth user
        const userId = req.user.claims?.sub;
        if (userId) {
          const user = await storage.getUser(userId);
          return res.json(user);
        }
      }

      // Email/password user
      if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        return res.json(user);
      }

      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email signup route
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = emailSignupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await storage.createEmailUser(
        userData.email,
        userData.firstName,
        hashedPassword,
      );

      // Set session
      req.session.userId = user.id;

      res.status(201).json(user);
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Email login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || user.authType !== "email" || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;

      res.json(user);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route (works for both OAuth and email auth)
  app.post("/api/auth/logout", (req, res) => {
    if (req.session.userId) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else if (req.isAuthenticated()) {
      req.logout(() => {
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Not logged in" });
    }
  });

  // User routes
  app.patch("/api/users/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.currentUserId;
      
      // Users can only update their own profile
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Can only update your own profile" });
      }

      const { firstName } = req.body;
      
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }

      if (firstName.length > 50) {
        return res.status(400).json({ message: "First name must be less than 50 characters" });
      }

      // Update user in database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        firstName: firstName.trim(),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Classroom routes
  app.post("/api/classrooms", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUserId;
      const user = req.currentUser;

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can create classrooms" });
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

  app.get("/api/classrooms", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUserId;
      const user = req.currentUser;

      let classrooms;
      if (user?.role === "teacher") {
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

  app.post("/api/classrooms/join", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUserId;
      const { inviteCode } = req.body;

      const classroom = await storage.getClassroomByInviteCode(inviteCode);
      if (!classroom) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      const isEnrolled = await storage.isStudentEnrolled(classroom.id, userId);
      if (isEnrolled) {
        return res
          .status(400)
          .json({ message: "Already enrolled in this classroom" });
      }

      await storage.enrollStudent(classroom.id, userId);
      res.json({ message: "Successfully joined classroom" });
    } catch (error) {
      console.error("Error joining classroom:", error);
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  app.get("/api/classrooms/:id", requireAuth, async (req: any, res) => {
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

  app.get(
    "/api/classrooms/:id/students",
    requireAuth,
    async (req: any, res) => {
      try {
        const classroomId = parseInt(req.params.id);
        const students = await storage.getClassroomStudents(classroomId);
        res.json(students);
      } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Failed to fetch students" });
      }
    },
  );

  app.get(
    "/api/classrooms/:id/leaderboard",
    requireAuth,
    async (req: any, res) => {
      try {
        const classroomId = parseInt(req.params.id);
        const leaderboard = await storage.getClassroomLeaderboard(classroomId);
        res.json(leaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
      }
    },
  );

  app.patch("/api/classrooms/:id", requireAuth, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = req.currentUser;

      // Check if classroom exists
      const classroom = await storage.getClassroom(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      // Check if user is the teacher of this classroom
      if (user?.role !== "teacher" || classroom.teacherId !== userId) {
        return res.status(403).json({
          message: "Only the classroom teacher can update this classroom",
        });
      }

      // Validate request body
      const updateData = insertClassroomSchema.partial().parse(req.body);

      const updatedClassroom = await storage.updateClassroom(
        classroomId,
        updateData,
      );
      res.json(updatedClassroom);
    } catch (error) {
      console.error("Error updating classroom:", error);
      res.status(500).json({ message: "Failed to update classroom" });
    }
  });

  app.delete("/api/classrooms/:id", requireAuth, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = req.currentUser;

      // Check if classroom exists
      const classroom = await storage.getClassroom(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      // Check if user is the teacher of this classroom
      if (user?.role !== "teacher" || classroom.teacherId !== userId) {
        return res.status(403).json({
          message: "Only the classroom teacher can delete this classroom",
        });
      }

      await storage.deleteClassroom(classroomId);
      res.json({ message: "Classroom deleted successfully" });
    } catch (error) {
      console.error("Error deleting classroom:", error);
      res.status(500).json({ message: "Failed to delete classroom" });
    }
  });

  // Problem routes
  app.post("/api/problems", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUserId;
      const user = await storage.getUser(userId);

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can create problems" });
      }

      const problemData = insertProblemSchema.parse(req.body);
      const problem = await storage.createProblem({
        ...problemData,
        createdBy: userId,
        scheduledAt: problemData.scheduledAt ? new Date(problemData.scheduledAt) : null,
      });

      res.json(problem);
    } catch (error) {
      console.error("Error creating problem:", error);
      res.status(500).json({ message: "Failed to create problem" });
    }
  });

  app.get(
    "/api/classrooms/:id/problems",
    requireAuth,
    async (req: any, res) => {
      try {
        const classroomId = parseInt(req.params.id);
        const problems = await storage.getClassroomProblems(classroomId);
        res.json(problems);
      } catch (error) {
        console.error("Error fetching problems:", error);
        res.status(500).json({ message: "Failed to fetch problems" });
      }
    },
  );

  app.get("/api/problems/:id", requireAuth, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = await storage.getUser(userId);
      const problem = await storage.getProblem(problemId);

      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Check if the problem is scheduled and not yet available
      if (problem.scheduledAt && new Date(problem.scheduledAt) > new Date()) {
        // Allow teachers who created the problem to view it
        if (user?.role !== "teacher" || problem.createdBy !== userId) {
          return res.status(403).json({ message: "This problem is not yet available" });
        }
      }

      // Check if user has already solved this problem
      const hasSolved = await storage.hasUserEarnedPointsForProblem(
        userId,
        problemId,
      );

      res.json({ ...problem, hasSolved });
    } catch (error) {
      console.error("Error fetching problem:", error);
      res.status(500).json({ message: "Failed to fetch problem" });
    }
  });

  app.delete("/api/problems/:id", requireAuth, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = await storage.getUser(userId);

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can delete problems" });
      }

      const problem = await storage.getProblem(problemId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Check if the teacher created this problem
      if (problem.createdBy !== userId) {
        return res
          .status(403)
          .json({ message: "You can only delete problems you created" });
      }

      await storage.deleteProblem(problemId);
      res.json({ message: "Problem deleted successfully" });
    } catch (error) {
      console.error("Error deleting problem:", error);
      res.status(500).json({ message: "Failed to delete problem" });
    }
  });

  app.post("/api/problems/:id/copy", requireAuth, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = await storage.getUser(userId);
      const { targetClassroomId, includeSchedule } = req.body;

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can copy problems" });
      }

      // Check if the problem exists
      const originalProblem = await storage.getProblem(problemId);
      if (!originalProblem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Check if the teacher created this problem
      if (originalProblem.createdBy !== userId) {
        return res
          .status(403)
          .json({ message: "You can only copy problems you created" });
      }

      // Check if the target classroom exists and belongs to the teacher
      const targetClassroom = await storage.getClassroom(targetClassroomId);
      if (!targetClassroom) {
        return res.status(404).json({ message: "Target classroom not found" });
      }

      if (targetClassroom.teacherId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only copy problems to your own classrooms" });
      }

      // Copy the problem
      const copiedProblem = await storage.copyProblem(
        problemId,
        targetClassroomId,
        userId,
        includeSchedule
      );

      res.json(copiedProblem);
    } catch (error) {
      console.error("Error copying problem:", error);
      res.status(500).json({ message: "Failed to copy problem" });
    }
  });

  app.put("/api/problems/:id", requireAuth, async (req: any, res) => {
    try {
      const problemId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = await storage.getUser(userId);

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can edit problems" });
      }

      // Check if the problem exists
      const originalProblem = await storage.getProblem(problemId);
      if (!originalProblem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Check if the teacher created this problem
      if (originalProblem.createdBy !== userId) {
        return res
          .status(403)
          .json({ message: "You can only edit problems you created" });
      }

      // Validate the request body
      const problemData = insertProblemSchema.parse(req.body);
      
      // Update the problem
      const updatedProblem = await storage.updateProblem(problemId, {
        ...problemData,
        scheduledAt: problemData.scheduledAt ? new Date(problemData.scheduledAt) : null,
      });

      res.json(updatedProblem);
    } catch (error) {
      console.error("Error updating problem:", error);
      res.status(500).json({ message: "Failed to update problem" });
    }
  });

  // Test problem route
  app.post("/api/problems/:id/test", async (req: any, res) => {
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
        executionTime: result.executionTime,
      });
    } catch (error) {
      console.error("Error testing code:", error);
      res.status(500).json({ message: "Failed to test code" });
    }
  });

  // Submission routes
  app.post("/api/submissions", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUserId;
      const submissionData = insertSubmissionSchema.parse(req.body);

      const problem = await storage.getProblem(submissionData.problemId);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      // Execute the code
      const result = await executeJavaCode(
        submissionData.code,
        problem.testCases as any[],
      );

      // Check if user has already earned points for this problem
      const hasEarnedPoints = await storage.hasUserEarnedPointsForProblem(
        userId,
        submissionData.problemId,
      );

      // Only award points if this is their first successful submission
      const pointsToAward =
        result.status === "passed" && !hasEarnedPoints ? problem.points : 0;

      const submission = await storage.createSubmission({
        ...submissionData,
        studentId: userId,
        status: result.status,
        pointsEarned: pointsToAward,
        executionTime: result.executionTime,
        output: result.output,
        error: result.error,
      });

      // Update user points only if this is their first successful submission
      if (result.status === "passed" && !hasEarnedPoints) {
        await storage.updateUserPoints(userId, problem.points);

        // Check for achievements (only check when points are actually awarded)
        const userSubmissions = await storage.getStudentSubmissions(userId);
        const passedSubmissions = userSubmissions.filter(
          (s) => s.status === "passed",
        );

        // Group by problem ID to count unique problems solved
        const uniqueProblemsSolved = new Set(
          passedSubmissions.map((s) => s.problemId),
        ).size;

        // Check for problem solving achievements
        if (uniqueProblemsSolved === 10) {
          await storage.createAchievement(
            userId,
            "problems_solved",
            "Problem Solver",
            "Solved 10 problems",
            100,
          );
        } else if (uniqueProblemsSolved === 20) {
          await storage.createAchievement(
            userId,
            "problems_solved",
            "Code Master",
            "Solved 20 problems",
            200,
          );
        }
      }

      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get(
    "/api/problems/:id/submissions",
    requireAuth,
    async (req: any, res) => {
      try {
        const problemId = parseInt(req.params.id);
        const submissions = await storage.getProblemSubmissions(problemId);
        res.json(submissions);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ message: "Failed to fetch submissions" });
      }
    },
  );

  app.get("/api/submissions/recent", requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const submissions = await storage.getRecentSubmissions(limit);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      res.status(500).json({ message: "Failed to fetch recent submissions" });
    }
  });

  app.get("/api/classrooms/:id/submissions", requireAuth, async (req: any, res) => {
    try {
      const classroomId = parseInt(req.params.id);
      const userId = req.currentUserId;
      const user = req.currentUser;

      // Check if user is a teacher
      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can view classroom submissions" });
      }

      // Check if teacher owns the classroom
      const classroom = await storage.getClassroom(classroomId);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      if (classroom.teacherId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only view submissions for your own classrooms" });
      }

      const submissions = await storage.getClassroomSubmissions(classroomId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching classroom submissions:", error);
      res.status(500).json({ message: "Failed to fetch classroom submissions" });
    }
  });

  // Stats routes
  app.get("/api/stats/teacher", requireAuth, async (req: any, res) => {
    try {
      const userId = req.currentUserId;
      const user = await storage.getUser(userId);

      if (user?.role !== "teacher") {
        return res
          .status(403)
          .json({ message: "Only teachers can access teacher stats" });
      }

      const stats = await storage.getTeacherStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch teacher stats" });
    }
  });

  // User management routes
  app.patch(
    "/api/users/:id/test-status",
    requireAuth,
    async (req: any, res) => {
      try {
        const currentUserId = req.currentUserId;
        const targetUserId = req.params.id;
        const { isTestUser } = req.body;

        const currentUser = await storage.getUser(currentUserId);

        // Only teachers can modify test user status
        if (currentUser?.role !== "teacher") {
          return res
            .status(403)
            .json({ message: "Only teachers can modify test user status" });
        }

        // Validate that isTestUser is a boolean
        if (typeof isTestUser !== "boolean") {
          return res
            .status(400)
            .json({ message: "isTestUser must be a boolean" });
        }

        await storage.updateUserTestStatus(targetUserId, isTestUser);
        res.json({ message: "Test user status updated successfully" });
      } catch (error) {
        console.error("Error updating test user status:", error);
        res.status(500).json({ message: "Failed to update test user status" });
      }
    },
  );

  app.get("/api/achievements/:userId", requireAuth, async (req: any, res) => {
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
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle different message types
        if (data.type === "join_classroom") {
          // Join classroom for real-time updates
          ws.classroomId = data.classroomId;
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  // Broadcast leaderboard updates
  global.broadcastLeaderboardUpdate = (
    classroomId: number,
    leaderboard: any[],
  ) => {
    wss.clients.forEach((client: any) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.classroomId === classroomId
      ) {
        client.send(
          JSON.stringify({
            type: "leaderboard_update",
            data: leaderboard,
          }),
        );
      }
    });
  };

  return httpServer;
}

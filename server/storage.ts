import {
  users,
  classrooms,
  problems,
  submissions,
  classroomEnrollments,
  achievements,
  type User,
  type UpsertUser,
  type Classroom,
  type InsertClassroom,
  type Problem,
  type InsertProblem,
  type Submission,
  type InsertSubmission,
  type InsertEnrollment,
  type Achievement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createEmailUser(email: string, firstName: string, hashedPassword: string): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<void>;
  updateUserLevel(userId: string, level: number): Promise<void>;
  
  // Classroom operations
  createClassroom(classroom: InsertClassroom & { teacherId: string }): Promise<Classroom>;
  getClassroom(id: number): Promise<Classroom | undefined>;
  getClassroomsByTeacher(teacherId: string): Promise<Classroom[]>;
  getClassroomsByStudent(studentId: string): Promise<(Classroom & { teacher: User })[]>;
  getClassroomByInviteCode(inviteCode: string): Promise<Classroom | undefined>;
  
  // Enrollment operations
  enrollStudent(classroomId: number, studentId: string): Promise<void>;
  getClassroomStudents(classroomId: number): Promise<User[]>;
  isStudentEnrolled(classroomId: number, studentId: string): Promise<boolean>;
  
  // Problem operations
  createProblem(problem: InsertProblem & { createdBy: string }): Promise<Problem>;
  getProblem(id: number): Promise<Problem | undefined>;
  getClassroomProblems(classroomId: number): Promise<Problem[]>;
  deleteProblem(id: number): Promise<void>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission & { studentId: string; status: string; pointsEarned: number; executionTime?: number; output?: string; error?: string }): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getStudentSubmissions(studentId: string, problemId?: number): Promise<Submission[]>;
  getProblemSubmissions(problemId: number): Promise<(Submission & { student: User })[]>;
  getRecentSubmissions(limit: number): Promise<(Submission & { student: User; problem: Problem })[]>;
  
  // Leaderboard operations
  getClassroomLeaderboard(classroomId: number): Promise<(User & { problemsSolved: number; rank: number })[]>;
  
  // Achievement operations
  createAchievement(userId: string, type: string, title: string, description: string, points: number): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  
  // Statistics
  getTeacherStats(teacherId: string): Promise<{
    totalClassrooms: number;
    totalStudents: number;
    totalProblems: number;
    totalSubmissions: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createEmailUser(email: string, firstName: string, hashedPassword: string): Promise<User> {
    const userId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email,
        firstName,
        password: hashedPassword,
        authType: 'email',
        role: 'student',
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPoints(userId: string, points: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        totalPoints: sql`${users.totalPoints} + ${points}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserLevel(userId: string, level: number): Promise<void> {
    await db
      .update(users)
      .set({ level, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createClassroom(classroom: InsertClassroom & { teacherId: string }): Promise<Classroom> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [newClassroom] = await db
      .insert(classrooms)
      .values({ ...classroom, inviteCode })
      .returning();
    return newClassroom;
  }

  async getClassroom(id: number): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
    return classroom;
  }

  async getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
    return await db.select().from(classrooms).where(eq(classrooms.teacherId, teacherId));
  }

  async getClassroomsByStudent(studentId: string): Promise<(Classroom & { teacher: User })[]> {
    const result = await db
      .select({
        id: classrooms.id,
        name: classrooms.name,
        description: classrooms.description,
        teacherId: classrooms.teacherId,
        inviteCode: classrooms.inviteCode,
        createdAt: classrooms.createdAt,
        teacher: users,
      })
      .from(classroomEnrollments)
      .innerJoin(classrooms, eq(classroomEnrollments.classroomId, classrooms.id))
      .innerJoin(users, eq(classrooms.teacherId, users.id))
      .where(eq(classroomEnrollments.studentId, studentId));
    
    return result;
  }

  async getClassroomByInviteCode(inviteCode: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.inviteCode, inviteCode));
    return classroom;
  }

  async enrollStudent(classroomId: number, studentId: string): Promise<void> {
    await db.insert(classroomEnrollments).values({ classroomId, studentId });
  }

  async getClassroomStudents(classroomId: number): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(classroomEnrollments)
      .innerJoin(users, eq(classroomEnrollments.studentId, users.id))
      .where(eq(classroomEnrollments.classroomId, classroomId));
    
    return result.map(r => r.user);
  }

  async isStudentEnrolled(classroomId: number, studentId: string): Promise<boolean> {
    const [enrollment] = await db
      .select()
      .from(classroomEnrollments)
      .where(and(
        eq(classroomEnrollments.classroomId, classroomId),
        eq(classroomEnrollments.studentId, studentId)
      ));
    return !!enrollment;
  }

  async createProblem(problem: InsertProblem & { createdBy: string }): Promise<Problem> {
    const [newProblem] = await db.insert(problems).values(problem).returning();
    return newProblem;
  }

  async getProblem(id: number): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id));
    return problem;
  }

  async getClassroomProblems(classroomId: number): Promise<Problem[]> {
    return await db.select().from(problems).where(eq(problems.classroomId, classroomId)).orderBy(desc(problems.createdAt));
  }

  async deleteProblem(id: number): Promise<void> {
    // First delete all submissions related to this problem
    await db.delete(submissions).where(eq(submissions.problemId, id));
    // Then delete the problem itself
    await db.delete(problems).where(eq(problems.id, id));
  }

  async createSubmission(submission: InsertSubmission & { studentId: string; status: string; pointsEarned: number; executionTime?: number; output?: string; error?: string }): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getStudentSubmissions(studentId: string, problemId?: number): Promise<Submission[]> {
    const query = db.select().from(submissions).where(eq(submissions.studentId, studentId));
    
    if (problemId) {
      return await query.where(and(eq(submissions.studentId, studentId), eq(submissions.problemId, problemId)))
        .orderBy(desc(submissions.submittedAt));
    }
    
    return await query.orderBy(desc(submissions.submittedAt));
  }

  async getProblemSubmissions(problemId: number): Promise<(Submission & { student: User })[]> {
    const result = await db
      .select({
        id: submissions.id,
        problemId: submissions.problemId,
        studentId: submissions.studentId,
        code: submissions.code,
        status: submissions.status,
        pointsEarned: submissions.pointsEarned,
        executionTime: submissions.executionTime,
        output: submissions.output,
        error: submissions.error,
        submittedAt: submissions.submittedAt,
        student: users,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(eq(submissions.problemId, problemId))
      .orderBy(desc(submissions.submittedAt));
    
    return result;
  }

  async getRecentSubmissions(limit: number): Promise<(Submission & { student: User; problem: Problem })[]> {
    const result = await db
      .select({
        id: submissions.id,
        problemId: submissions.problemId,
        studentId: submissions.studentId,
        code: submissions.code,
        status: submissions.status,
        pointsEarned: submissions.pointsEarned,
        executionTime: submissions.executionTime,
        output: submissions.output,
        error: submissions.error,
        submittedAt: submissions.submittedAt,
        student: users,
        problem: problems,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .innerJoin(problems, eq(submissions.problemId, problems.id))
      .orderBy(desc(submissions.submittedAt))
      .limit(limit);
    
    return result;
  }

  async getClassroomLeaderboard(classroomId: number): Promise<(User & { problemsSolved: number; rank: number })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        level: users.level,
        totalPoints: users.totalPoints,
        currentStreak: users.currentStreak,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        problemsSolved: count(submissions.id),
      })
      .from(classroomEnrollments)
      .innerJoin(users, eq(classroomEnrollments.studentId, users.id))
      .leftJoin(submissions, and(
        eq(submissions.studentId, users.id),
        eq(submissions.status, 'passed')
      ))
      .where(eq(classroomEnrollments.classroomId, classroomId))
      .groupBy(users.id)
      .orderBy(desc(users.totalPoints));
    
    return result.map((user, index) => ({ ...user, rank: index + 1 }));
  }

  async createAchievement(userId: string, type: string, title: string, description: string, points: number): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values({ userId, type, title, description, points })
      .returning();
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
  }

  async getTeacherStats(teacherId: string): Promise<{
    totalClassrooms: number;
    totalStudents: number;
    totalProblems: number;
    totalSubmissions: number;
  }> {
    const [classroomCount] = await db
      .select({ count: count() })
      .from(classrooms)
      .where(eq(classrooms.teacherId, teacherId));

    const [studentCount] = await db
      .select({ count: count() })
      .from(classroomEnrollments)
      .innerJoin(classrooms, eq(classroomEnrollments.classroomId, classrooms.id))
      .where(eq(classrooms.teacherId, teacherId));

    const [problemCount] = await db
      .select({ count: count() })
      .from(problems)
      .where(eq(problems.createdBy, teacherId));

    const [submissionCount] = await db
      .select({ count: count() })
      .from(submissions)
      .innerJoin(problems, eq(submissions.problemId, problems.id))
      .where(eq(problems.createdBy, teacherId));

    return {
      totalClassrooms: classroomCount.count,
      totalStudents: studentCount.count,
      totalProblems: problemCount.count,
      totalSubmissions: submissionCount.count,
    };
  }
}

export const storage = new DatabaseStorage();

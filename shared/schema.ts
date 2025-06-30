import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("student"), // 'teacher' or 'student'
  level: integer("level").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const classrooms = pgTable("classrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  inviteCode: varchar("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classroomEnrollments = pgTable("classroom_enrollments", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id").notNull().references(() => classrooms.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const problems = pgTable("problems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: varchar("difficulty").notNull(), // 'easy', 'medium', 'hard'
  points: integer("points").notNull(),
  timeLimit: integer("time_limit").notNull(), // in seconds
  classroomId: integer("classroom_id").notNull().references(() => classrooms.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  testCases: jsonb("test_cases").notNull(), // Array of {input: string, expectedOutput: string}
  starterCode: text("starter_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  problemId: integer("problem_id").notNull().references(() => problems.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  status: varchar("status").notNull(), // 'pending', 'passed', 'failed', 'error'
  pointsEarned: integer("points_earned").notNull().default(0),
  executionTime: integer("execution_time"), // in milliseconds
  output: text("output"),
  error: text("error"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'streak', 'problems_solved', 'speed', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teachingClassrooms: many(classrooms),
  enrollments: many(classroomEnrollments),
  submissions: many(submissions),
  achievements: many(achievements),
  createdProblems: many(problems),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classrooms.teacherId],
    references: [users.id],
  }),
  enrollments: many(classroomEnrollments),
  problems: many(problems),
}));

export const classroomEnrollmentsRelations = relations(classroomEnrollments, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomEnrollments.classroomId],
    references: [classrooms.id],
  }),
  student: one(users, {
    fields: [classroomEnrollments.studentId],
    references: [users.id],
  }),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [problems.classroomId],
    references: [classrooms.id],
  }),
  creator: one(users, {
    fields: [problems.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  problem: one(problems, {
    fields: [submissions.problemId],
    references: [problems.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertClassroomSchema = createInsertSchema(classrooms).omit({ id: true, inviteCode: true, createdAt: true, teacherId: true });
export const insertProblemSchema = createInsertSchema(problems).omit({ id: true, createdAt: true, createdBy: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true });
export const insertEnrollmentSchema = createInsertSchema(classroomEnrollments).omit({ id: true, enrolledAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type ClassroomEnrollment = typeof classroomEnrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Achievement = typeof achievements.$inferSelect;

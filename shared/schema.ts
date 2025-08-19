import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizSessions = pgTable("quiz_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  mode: text("mode").notNull(), // "individual" | "team"
  timerDuration: integer("timer_duration").notNull().default(30), // seconds
  totalQuestions: integer("total_questions").notNull(),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  status: text("status").notNull().default("waiting"), // "waiting" | "active" | "paused" | "ended"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  questionText: text("question_text").notNull(),
  type: text("type").notNull(), // "text" | "image" | "audio"
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  options: jsonb("options").notNull(), // { A: string, B: string, C: string, D: string }
  correctAnswer: text("correct_answer").notNull(), // "A" | "B" | "C" | "D"
  order: integer("order").notNull(),
});

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  name: text("name").notNull(),
  score: integer("score").notNull().default(0),
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  questionId: varchar("question_id").notNull(),
  participantId: varchar("participant_id").notNull(),
  answer: text("answer"), // "A" | "B" | "C" | "D" | null (for buzzer only)
  buzzerOrder: integer("buzzer_order"), // 1, 2, 3, etc.
  buzzerTime: integer("buzzer_time"), // milliseconds from question start
  isCorrect: boolean("is_correct"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  respondedAt: timestamp("responded_at").notNull().default(sql`now()`),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  score: true,
  joinedAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  respondedAt: true,
});

export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

export type QuizSession = typeof quizSessions.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Response = typeof responses.$inferSelect;

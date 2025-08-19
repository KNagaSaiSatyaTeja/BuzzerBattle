import { type QuizSession, type Question, type Participant, type Response, 
         type InsertQuizSession, type InsertQuestion, type InsertParticipant, type InsertResponse } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Quiz Sessions
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getQuizSession(id: string): Promise<QuizSession | undefined>;
  getQuizSessionByCode(code: string): Promise<QuizSession | undefined>;
  updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
  
  // Questions
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsBySession(sessionId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  
  // Participants
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipantsBySession(sessionId: string): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | undefined>;
  updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined>;
  
  // Responses
  createResponse(response: InsertResponse): Promise<Response>;
  getResponsesByQuestion(questionId: string): Promise<Response[]>;
  getResponsesBySession(sessionId: string): Promise<Response[]>;
  getResponsesByParticipant(participantId: string): Promise<Response[]>;
}

export class MemStorage implements IStorage {
  private quizSessions: Map<string, QuizSession> = new Map();
  private questions: Map<string, Question> = new Map();
  private participants: Map<string, Participant> = new Map();
  private responses: Map<string, Response> = new Map();

  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const id = randomUUID();
    const session: QuizSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.quizSessions.set(id, session);
    return session;
  }

  async getQuizSession(id: string): Promise<QuizSession | undefined> {
    return this.quizSessions.get(id);
  }

  async getQuizSessionByCode(code: string): Promise<QuizSession | undefined> {
    return Array.from(this.quizSessions.values()).find(session => session.code === code);
  }

  async updateQuizSession(id: string, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const session = this.quizSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.quizSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsBySession(sessionId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.sessionId === sessionId)
      .sort((a, b) => a.order - b.order);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = {
      ...insertParticipant,
      id,
      score: 0,
      joinedAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipantsBySession(sessionId: string): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.sessionId === sessionId)
      .sort((a, b) => b.score - a.score);
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...updates };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = randomUUID();
    const response: Response = {
      ...insertResponse,
      id,
      respondedAt: new Date(),
    };
    this.responses.set(id, response);
    return response;
  }

  async getResponsesByQuestion(questionId: string): Promise<Response[]> {
    return Array.from(this.responses.values())
      .filter(r => r.questionId === questionId)
      .sort((a, b) => (a.buzzerOrder || 999) - (b.buzzerOrder || 999));
  }

  async getResponsesBySession(sessionId: string): Promise<Response[]> {
    return Array.from(this.responses.values())
      .filter(r => r.sessionId === sessionId);
  }

  async getResponsesByParticipant(participantId: string): Promise<Response[]> {
    return Array.from(this.responses.values())
      .filter(r => r.participantId === participantId);
  }
}

export const storage = new MemStorage();

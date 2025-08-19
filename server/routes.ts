import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertQuizSessionSchema, insertQuestionSchema, insertParticipantSchema, insertResponseSchema } from "@shared/schema";
import { z } from "zod";

interface ExtendedWebSocket extends WebSocket {
  sessionId?: string;
  participantId?: string;
  isAdmin?: boolean;
}

const generateSessionCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const sessionClients = new Map<string, Set<ExtendedWebSocket>>();

  // Broadcast to all clients in a session
  const broadcastToSession = (sessionId: string, message: any) => {
    const clients = sessionClients.get(sessionId);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  };

  // WebSocket connection handling
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_session':
            const { sessionId, participantId, isAdmin } = message;
            ws.sessionId = sessionId;
            ws.participantId = participantId;
            ws.isAdmin = isAdmin;
            
            if (!sessionClients.has(sessionId)) {
              sessionClients.set(sessionId, new Set());
            }
            sessionClients.get(sessionId)!.add(ws);
            
            // Send current session state
            const session = await storage.getQuizSession(sessionId);
            if (session) {
              ws.send(JSON.stringify({
                type: 'session_state',
                session,
                participants: await storage.getParticipantsBySession(sessionId)
              }));
            }
            break;

          case 'buzzer_press':
            if (ws.sessionId && ws.participantId) {
              const session = await storage.getQuizSession(ws.sessionId);
              if (session && session.status === 'active') {
                const questions = await storage.getQuestionsBySession(ws.sessionId);
                const currentQuestion = questions[session.currentQuestionIndex];
                
                if (currentQuestion) {
                  // Check if participant already buzzed for this question
                  const existingResponses = await storage.getResponsesByQuestion(currentQuestion.id);
                  const alreadyBuzzed = existingResponses.some(r => r.participantId === ws.participantId);
                  
                  if (!alreadyBuzzed) {
                    const buzzerOrder = existingResponses.length + 1;
                    const buzzerTime = Date.now() - (message.questionStartTime || 0);
                    
                    await storage.createResponse({
                      sessionId: ws.sessionId,
                      questionId: currentQuestion.id,
                      participantId: ws.participantId,
                      answer: null,
                      buzzerOrder,
                      buzzerTime,
                      isCorrect: null,
                      pointsAwarded: 0
                    });

                    // Broadcast buzzer press to all clients
                    const participant = await storage.getParticipant(ws.participantId);
                    broadcastToSession(ws.sessionId, {
                      type: 'buzzer_pressed',
                      participant: participant?.name,
                      participantId: ws.participantId,
                      buzzerOrder,
                      buzzerTime
                    });
                  }
                }
              }
            }
            break;

          case 'submit_answer':
            if (ws.sessionId && ws.participantId) {
              const { answer } = message;
              const session = await storage.getQuizSession(ws.sessionId);
              
              if (session && session.status === 'active') {
                const questions = await storage.getQuestionsBySession(ws.sessionId);
                const currentQuestion = questions[session.currentQuestionIndex];
                
                if (currentQuestion) {
                  const responses = await storage.getResponsesByQuestion(currentQuestion.id);
                  const participantResponse = responses.find(r => r.participantId === ws.participantId);
                  
                  if (participantResponse && !participantResponse.answer) {
                    const isCorrect = answer === currentQuestion.correctAnswer;
                    let pointsAwarded = 0;
                    
                    if (isCorrect) {
                      pointsAwarded = 10;
                    } else if (currentQuestion.type !== 'image') {
                      pointsAwarded = -5;
                    }

                    // Update response
                    await storage.createResponse({
                      ...participantResponse,
                      answer,
                      isCorrect,
                      pointsAwarded
                    });

                    // Update participant score
                    const participant = await storage.getParticipant(ws.participantId);
                    if (participant) {
                      await storage.updateParticipant(ws.participantId, {
                        score: participant.score + pointsAwarded
                      });
                    }

                    // Broadcast answer result
                    broadcastToSession(ws.sessionId, {
                      type: 'answer_submitted',
                      participantId: ws.participantId,
                      answer,
                      isCorrect,
                      pointsAwarded
                    });
                  }
                }
              }
            }
            break;

          case 'start_timer':
            if (ws.isAdmin && ws.sessionId) {
              broadcastToSession(ws.sessionId, {
                type: 'timer_started',
                duration: message.duration,
                startTime: Date.now()
              });
            }
            break;

          case 'reset_buzzers':
            if (ws.isAdmin && ws.sessionId) {
              broadcastToSession(ws.sessionId, {
                type: 'reset_buzzers'
              });
            }
            break;

          case 'next_question':
            if (ws.isAdmin && ws.sessionId) {
              const session = await storage.getQuizSession(ws.sessionId);
              if (session) {
                const questions = await storage.getQuestionsBySession(ws.sessionId);
                const nextIndex = session.currentQuestionIndex + 1;
                
                if (nextIndex < questions.length) {
                  await storage.updateQuizSession(ws.sessionId, {
                    currentQuestionIndex: nextIndex
                  });
                  
                  broadcastToSession(ws.sessionId, {
                    type: 'question_changed',
                    questionIndex: nextIndex,
                    question: questions[nextIndex]
                  });
                } else {
                  await storage.updateQuizSession(ws.sessionId, {
                    status: 'ended'
                  });
                  
                  broadcastToSession(ws.sessionId, {
                    type: 'quiz_ended'
                  });
                }
              }
            }
            break;

          case 'reset_buzzers':
            if (ws.isAdmin && ws.sessionId) {
              // Broadcast reset to all participants
              broadcastToSession(ws.sessionId, {
                type: 'reset_buzzers'
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.sessionId) {
        const clients = sessionClients.get(ws.sessionId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            sessionClients.delete(ws.sessionId);
          }
        }
      }
    });
  });

  // REST API routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertQuizSessionSchema.parse({
        ...req.body,
        code: generateSessionCode()
      });
      
      const session = await storage.createQuizSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      // Try to get by ID first, then by code
      let session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        session = await storage.getQuizSessionByCode(sessionId);
      }
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session", error });
    }
  });

  app.post("/api/sessions/:sessionId/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId
      });
      
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data", error });
    }
  });

  app.get("/api/sessions/:sessionId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestionsBySession(req.params.sessionId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get questions", error });
    }
  });

  app.post("/api/sessions/:sessionId/participants", async (req, res) => {
    try {
      const participantData = insertParticipantSchema.parse({
        ...req.body,
        sessionId: req.params.sessionId
      });
      
      const participant = await storage.createParticipant(participantData);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Invalid participant data", error });
    }
  });

  app.get("/api/sessions/:sessionId/participants", async (req, res) => {
    try {
      const participants = await storage.getParticipantsBySession(req.params.sessionId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants", error });
    }
  });

  app.get("/api/sessions/:sessionId/leaderboard", async (req, res) => {
    try {
      const participants = await storage.getParticipantsBySession(req.params.sessionId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard", error });
    }
  });

  app.get("/api/questions/:questionId/results", async (req, res) => {
    try {
      const responses = await storage.getResponsesByQuestion(req.params.questionId);
      const question = await storage.getQuestion(req.params.questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Calculate poll results
      const pollResults = {
        A: 0, B: 0, C: 0, D: 0
      };
      
      responses.forEach(response => {
        if (response.answer) {
          pollResults[response.answer as keyof typeof pollResults]++;
        }
      });

      res.json({
        question,
        responses,
        pollResults,
        totalResponses: responses.filter(r => r.answer).length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get question results", error });
    }
  });

  app.get("/api/participants/:participantId", async (req, res) => {
    try {
      const participant = await storage.getParticipant(req.params.participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participant", error });
    }
  });

  return httpServer;
}

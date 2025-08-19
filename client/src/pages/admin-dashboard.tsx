import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuizSession, Question, Participant } from "@shared/schema";
import QRCode from "qrcode";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [quizTitle, setQuizTitle] = useState("Science Quiz - Chapter 5");
  const [mode, setMode] = useState("individual");
  const [timerDuration, setTimerDuration] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Sample questions for demo
  const [sampleQuestions] = useState([
    {
      questionText: "What is the chemical symbol for gold?",
      type: "text",
      options: { A: "Au", B: "Ag", C: "Cu", D: "Fe" },
      correctAnswer: "A"
    },
    {
      questionText: "Identify this animal",
      type: "image", 
      imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
      options: { A: "Golden Retriever", B: "Labrador", C: "German Shepherd", D: "Beagle" },
      correctAnswer: "A"
    },
    {
      questionText: "Pronounce this word correctly",
      type: "audio",
      audioUrl: "/audio/pronunciation.mp3",
      options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
      correctAnswer: "B"
    }
  ]);
  
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: (session: QuizSession) => {
      setSessionCode(session.code);
      setSessionId(session.id);
      generateQRCode(session.code);
      toast({
        title: "Quiz session created!",
        description: `Session code: ${session.code}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quiz session",
        variant: "destructive",
      });
    }
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/sessions', sessionId, 'participants'],
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const generateCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(newCode);
  };

  const generateQRCode = async (code: string) => {
    try {
      const joinUrl = `${window.location.origin}/join?code=${code}`;
      const qrDataUrl = await QRCode.toDataURL(joinUrl, {
        width: 128,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleStartQuiz = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question",
        variant: "destructive",
      });
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync({
        title: quizTitle,
        code: sessionCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
        mode,
        timerDuration,
        totalQuestions: selectedQuestions.length,
        status: "waiting"
      });

      // Create questions
      for (let i = 0; i < selectedQuestions.length; i++) {
        const questionIndex = selectedQuestions[i];
        const questionData = sampleQuestions[questionIndex];
        
        await apiRequest("POST", `/api/sessions/${session.id}/questions`, {
          ...questionData,
          order: i
        });
      }

      setLocation(`/quiz-display/${session.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start quiz",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    generateCode();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-quiz-blue rounded-lg flex items-center justify-center">
                <i className="fas fa-bolt text-white text-lg"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">QuizBuzz</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.open("/student", "_blank")}
                className="text-quiz-purple hover:text-purple-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <i className="fas fa-graduation-cap mr-2"></i>Student Portal
              </button>
              <button className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                <i className="fas fa-cog mr-2"></i>Settings
              </button>
              <button className="bg-quiz-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                <i className="fas fa-user mr-2"></i>Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg border border-gray-100">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Create Quiz Section */}
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Quiz Session</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Title
                      </Label>
                      <Input
                        data-testid="input-quiz-title"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="Science Quiz - Chapter 5"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Code
                      </Label>
                      <div className="flex">
                        <Input
                          data-testid="input-session-code"
                          value={sessionCode}
                          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                          className="flex-1 rounded-r-none bg-gray-50"
                        />
                        <Button
                          data-testid="button-generate-code"
                          onClick={generateCode}
                          className="rounded-l-none bg-quiz-blue hover:bg-blue-600"
                        >
                          <i className="fas fa-refresh"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        Mode
                      </Label>
                      <Select value={mode} onValueChange={setMode}>
                        <SelectTrigger data-testid="select-mode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        Timer per Question
                      </Label>
                      <Select value={timerDuration.toString()} onValueChange={(value) => setTimerDuration(parseInt(value))}>
                        <SelectTrigger data-testid="select-timer">
                          <SelectValue placeholder="Select timer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Questions
                      </Label>
                      <Input
                        data-testid="input-total-questions"
                        type="number"
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Question Selection */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-3">
                      Question Bank
                    </Label>
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        {sampleQuestions.map((question, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                data-testid={`checkbox-question-${index}`}
                                checked={selectedQuestions.includes(index)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedQuestions([...selectedQuestions, index]);
                                  } else {
                                    setSelectedQuestions(selectedQuestions.filter(i => i !== index));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {question.questionText}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${question.type === 'text' ? 'bg-blue-100 text-blue-800' : 
                                  question.type === 'image' ? 'bg-green-100 text-green-800' : 
                                  'bg-purple-100 text-purple-800'}`}>
                                {question.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <Button
                      data-testid="button-start-quiz"
                      onClick={handleStartQuiz}
                      disabled={createSessionMutation.isPending}
                      className="flex-1 bg-quiz-green text-white py-4 px-6 font-semibold text-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <i className="fas fa-play mr-3"></i>
                      {createSessionMutation.isPending ? "Starting..." : "Start Quiz Session"}
                    </Button>
                    <Button variant="outline" className="px-6 py-4 font-semibold">
                      Save as Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Session Info & QR Code */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-quiz-blue to-blue-600 text-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Session Info</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="opacity-90">Join Code:</span>
                        <span className="font-bold text-2xl" data-testid="text-session-code">
                          {sessionCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-90">Participants:</span>
                        <span className="font-semibold" data-testid="text-participant-count">
                          {participants.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-90">Status:</span>
                        <span className="font-semibold text-quiz-orange">
                          {sessionId ? "Active" : "Waiting"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code */}
                <Card>
                  <CardContent className="p-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Join</h4>
                    <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center border border-gray-200">
                      {qrCodeUrl ? (
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code for joining quiz" 
                          className="w-full h-full object-contain"
                          data-testid="qr-code-image"
                        />
                      ) : (
                        <i className="fas fa-qrcode text-4xl text-gray-400"></i>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {sessionCode ? `Scan to join with code: ${sessionCode}` : "Students can scan this QR code to join"}
                    </p>
                  </CardContent>
                </Card>

                {/* Live Participants */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Participants</h4>
                    <div className="space-y-2">
                      {participants.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          <i className="fas fa-users text-2xl mb-2 opacity-50"></i>
                          <p className="text-sm">Waiting for participants...</p>
                        </div>
                      ) : (
                        participants.map((participant: Participant) => (
                          <div key={participant.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <span className="font-medium">{participant.name}</span>
                            <span className="text-sm text-gray-500">
                              {participant.score} pts
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

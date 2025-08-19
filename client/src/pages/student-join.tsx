import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function StudentJoin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [joinCode, setJoinCode] = useState("");
  const [studentName, setStudentName] = useState("");

  // Check for QR code URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase());
    }
  }, []);

  const joinQuizMutation = useMutation({
    mutationFn: async ({ code, name }: { code: string; name: string }) => {
      // First, verify the session exists
      const sessionResponse = await apiRequest("GET", `/api/sessions/${code}`);
      const session = await sessionResponse.json();
      
      // Then join as a participant
      const participantResponse = await apiRequest("POST", `/api/sessions/${session.id}/participants`, {
        name
      });
      const participant = await participantResponse.json();
      
      return { session, participant };
    },
    onSuccess: ({ session, participant }) => {
      toast({
        title: "Joined successfully!",
        description: `Welcome to ${session.title}`,
      });
      setLocation(`/student-buzzer/${session.id}/${participant.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join quiz",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    }
  });

  const handleJoinQuiz = () => {
    if (!joinCode.trim() || !studentName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both code and name",
        variant: "destructive",
      });
      return;
    }

    joinQuizMutation.mutate({
      code: joinCode.trim().toUpperCase(),
      name: studentName.trim()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 shadow-lg border border-gray-100">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-quiz-purple rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-graduation-cap text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Quiz</h1>
            <p className="text-gray-600">Enter the code provided by your teacher</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Code
              </Label>
              <Input
                data-testid="input-join-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full text-center text-2xl font-bold tracking-widest uppercase"
                maxLength={6}
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </Label>
              <Input
                data-testid="input-student-name"
                type="text"
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              data-testid="button-join-quiz"
              onClick={handleJoinQuiz}
              disabled={joinQuizMutation.isPending}
              className="w-full bg-quiz-purple text-white py-4 px-6 font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <i className="fas fa-sign-in-alt mr-3"></i>
              {joinQuizMutation.isPending ? "Joining..." : "Join Quiz"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

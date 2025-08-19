import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuizSession, Participant } from "@shared/schema";

export default function StudentPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Load saved student name and check for QR code URL parameter
  useEffect(() => {
    const savedName = localStorage.getItem('studentName');
    if (savedName) {
      setStudentName(savedName);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase());
    }
  }, []);

  // Fetch active quiz sessions (optional feature)
  const { data: activeSessions = [] } = useQuery({
    queryKey: ['/api/sessions'],
    enabled: showStats
  });

  const handleQuickJoin = async () => {
    if (!joinCode.trim() || !studentName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both code and name",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // First, verify the session exists
      const sessionResponse = await apiRequest("GET", `/api/sessions/${joinCode.trim().toUpperCase()}`);
      const session = await sessionResponse.json();
      
      // Then join as a participant
      const participantResponse = await apiRequest("POST", `/api/sessions/${session.id}/participants`, {
        name: studentName.trim()
      });
      const participant = await participantResponse.json();

      // Save student name for future use
      localStorage.setItem('studentName', studentName.trim());
      
      toast({
        title: "Joined successfully!",
        description: `Welcome to ${session.title}`,
      });
      setLocation(`/student-buzzer/${session.id}/${participant.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to join quiz",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinWithCode = () => {
    setLocation("/join");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              <i className="fas fa-cog mr-2"></i>
              Admin Panel
            </Button>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-quiz-purple to-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg">
                <i className="fas fa-graduation-cap text-white text-2xl"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Student Portal</h1>
            </div>
            <div className="w-20"></div> {/* Spacer for center alignment */}
          </div>
          <div className="text-center">
            <p className="text-lg text-gray-600">Join live quizzes and compete with your classmates</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Join Section */}
        <Card className="shadow-xl border border-gray-100 mb-8 bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-quiz-blue rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-bolt text-white text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Join</h2>
              <p className="text-gray-600">Enter your details to join a quiz instantly</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quiz Code
                </label>
                <Input
                  data-testid="input-quick-join-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full text-center text-2xl font-bold tracking-widest uppercase h-14"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <Input
                  data-testid="input-quick-join-name"
                  type="text"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full h-12 text-lg"
                />
              </div>

              <Button
                data-testid="button-quick-join"
                onClick={handleQuickJoin}
                disabled={isJoining}
                className="w-full bg-quiz-blue text-white py-4 px-6 font-bold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg h-14"
              >
                <i className="fas fa-rocket mr-3"></i>
                {isJoining ? "Joining..." : "Join Quiz"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border border-gray-100 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-quiz-red rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-hand-paper text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Buzzer Mode</h3>
                <p className="text-gray-600 mb-4">Race to buzz in first and answer questions</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <i className="fas fa-clock mr-2"></i>Fast-paced
                  </div>
                  <div className="flex items-center justify-center">
                    <i className="fas fa-trophy mr-2"></i>Competitive
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-gray-100 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-quiz-green rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Team Mode</h3>
                <p className="text-gray-600 mb-4">Work together with your teammates</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <i className="fas fa-handshake mr-2"></i>Collaborative
                  </div>
                  <div className="flex items-center justify-center">
                    <i className="fas fa-star mr-2"></i>Strategic
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-gray-100 hover:shadow-xl transition-shadow bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-quiz-purple rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Poll Mode</h3>
                <p className="text-gray-600 mb-4">Share your opinions and see live results</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <i className="fas fa-eye mr-2"></i>Anonymous
                  </div>
                  <div className="flex items-center justify-center">
                    <i className="fas fa-chart-bar mr-2"></i>Real-time
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="shadow-lg border border-gray-100 bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How to Join</h2>
              <p className="text-gray-600">Follow these simple steps to participate</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-quiz-blue rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Get the Code</h3>
                <p className="text-gray-600 text-sm">Your teacher will provide a 6-digit quiz code or QR code to scan</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-quiz-green rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Enter Details</h3>
                <p className="text-gray-600 text-sm">Type in the quiz code and your name to join the session</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-quiz-purple rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Start Playing</h3>
                <p className="text-gray-600 text-sm">Answer questions, use the buzzer, and compete for the top score!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Stats & Profile */}
        {studentName && (
          <Card className="shadow-lg border border-gray-100 mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-quiz-purple rounded-full flex items-center justify-center mr-4">
                    <i className="fas fa-user text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Welcome back, {studentName}!</h3>
                    <p className="text-gray-600">Ready for another quiz?</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowStats(!showStats)}
                  variant="outline"
                  size="sm"
                  className="border-quiz-purple text-quiz-purple hover:bg-quiz-purple hover:text-white"
                >
                  <i className={`fas fa-${showStats ? 'eye-slash' : 'chart-bar'} mr-2`}></i>
                  {showStats ? 'Hide' : 'View'} Stats
                </Button>
              </div>

              {showStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-quiz-blue mb-1">-</div>
                    <div className="text-sm text-gray-600">Quizzes Joined</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-quiz-green mb-1">-</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-quiz-orange mb-1">-</div>
                    <div className="text-sm text-gray-600">Best Rank</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Tips */}
        <Card className="shadow-lg border border-gray-100 mb-8 bg-white">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">💡 Quick Tips</h2>
              <p className="text-gray-600">Make the most of your quiz experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <i className="fas fa-bolt text-quiz-blue text-xl mt-1"></i>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Be Quick!</h4>
                  <p className="text-sm text-gray-600">In buzzer mode, speed matters. Read the question fast and buzz in first!</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <i className="fas fa-lightbulb text-quiz-green text-xl mt-1"></i>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Think Smart!</h4>
                  <p className="text-sm text-gray-600">Take your time to read all options before selecting your answer.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <i className="fas fa-mobile-alt text-quiz-purple text-xl mt-1"></i>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Mobile Friendly!</h4>
                  <p className="text-sm text-gray-600">This works perfectly on your phone. Turn it sideways for a better view!</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                <i className="fas fa-trophy text-quiz-orange text-xl mt-1"></i>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Have Fun!</h4>
                  <p className="text-sm text-gray-600">Remember, it's about learning and having fun with your classmates!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Join Options */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Need help joining?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              data-testid="button-join-with-code"
              onClick={handleJoinWithCode}
              variant="outline"
              className="border-quiz-blue text-quiz-blue hover:bg-quiz-blue hover:text-white"
            >
              <i className="fas fa-keyboard mr-2"></i>
              Join with Code
            </Button>
            <Button
              data-testid="button-scan-qr"
              onClick={() => {
                toast({
                  title: "QR Scanner",
                  description: "Ask your teacher to show the QR code on screen",
                });
              }}
              variant="outline"
              className="border-quiz-green text-quiz-green hover:bg-quiz-green hover:text-white"
            >
              <i className="fas fa-qrcode mr-2"></i>
              Scan QR Code
            </Button>
            <Button
              data-testid="button-clear-name"
              onClick={() => {
                localStorage.removeItem('studentName');
                setStudentName('');
                toast({
                  title: "Name cleared",
                  description: "You can enter a new name next time",
                });
              }}
              variant="outline"
              className="border-gray-400 text-gray-600 hover:bg-gray-400 hover:text-white"
            >
              <i className="fas fa-user-times mr-2"></i>
              Clear Name
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
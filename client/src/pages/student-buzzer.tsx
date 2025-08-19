import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BuzzerButton } from "@/components/buzzer-button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useParams } from "wouter";
import { QuizSession, Question, Participant } from "@shared/schema";

export default function StudentBuzzer() {
  const { sessionId, participantId } = useParams<{ sessionId: string; participantId: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [buzzerOrder, setBuzzerOrder] = useState<Array<{
    participantId: string;
    participant: string;
    buzzerOrder: number;
    buzzerTime: number;
  }>>([]);
  const [canAnswer, setCanAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const { data: session } = useQuery<QuizSession>({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['/api/sessions', sessionId, 'questions'],
    enabled: !!sessionId,
  });

  const { data: participant } = useQuery<Participant>({
    queryKey: ['/api/participants', participantId],
    enabled: !!participantId,
  });

  const { isConnected, lastMessage, sendMessage } = useWebSocket(sessionId, participantId, false);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'timer_started':
          setTimeLeft(lastMessage.duration);
          setBuzzerPressed(false);
          setBuzzerOrder([]);
          setCanAnswer(false);
          setSelectedAnswer(null);
          break;
          
        case 'buzzer_pressed':
          setBuzzerOrder(prev => {
            const newOrder = [...prev, {
              participantId: lastMessage.participantId,
              participant: lastMessage.participant,
              buzzerOrder: lastMessage.buzzerOrder,
              buzzerTime: lastMessage.buzzerTime
            }];
            
            // Check if current participant is first in order
            const firstBuzzer = newOrder.find(b => b.buzzerOrder === 1);
            if (firstBuzzer && firstBuzzer.participantId === participantId) {
              setCanAnswer(true);
            }
            
            return newOrder.sort((a, b) => a.buzzerOrder - b.buzzerOrder);
          });
          
          if (lastMessage.participantId === participantId) {
            setBuzzerPressed(true);
          }
          break;
          
        case 'reset_buzzers':
          setBuzzerPressed(false);
          setBuzzerOrder([]);
          setCanAnswer(false);
          setSelectedAnswer(null);
          break;
          
        case 'question_changed':
          setCurrentQuestionIndex(lastMessage.questionIndex);
          setBuzzerPressed(false);
          setBuzzerOrder([]);
          setCanAnswer(false);
          setSelectedAnswer(null);
          break;
          
        case 'quiz_ended':
          // Handle quiz end
          break;
      }
    }
  }, [lastMessage, participantId]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0 && !buzzerPressed) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, buzzerPressed]);

  const handleBuzzer = () => {
    if (buzzerPressed || timeLeft <= 0) return;
    
    sendMessage({
      type: 'buzzer_press',
      questionStartTime: Date.now() - ((session?.timerDuration || 30) - timeLeft) * 1000
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (!canAnswer) return;
    
    setSelectedAnswer(answer);
    setCanAnswer(false);
    
    sendMessage({
      type: 'submit_answer',
      answer
    });
  };

  const currentQuestion = questions[currentQuestionIndex];
  const myBuzzerPosition = buzzerOrder.find(b => b.participantId === participantId);

  if (!session || !participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4 text-quiz-blue"></i>
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border border-gray-100 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {participant.name}!
              </h1>
              <p className="text-gray-600">{session.title}</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Question Info */}
        <Card className="shadow-lg border border-gray-100 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h3>
                {timeLeft > 0 && (
                  <div className="flex items-center justify-center space-x-2">
                    <i className="fas fa-clock text-quiz-orange"></i>
                    <span className="text-lg font-bold text-quiz-orange" data-testid="text-time-remaining">
                      {timeLeft}
                    </span>
                    <span className="text-gray-600">seconds remaining</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buzzer Section */}
        {timeLeft > 0 && !buzzerPressed && (
          <Card className="shadow-lg border border-gray-100 mb-6">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Press the buzzer to answer!
                  </p>
                  <p className="text-sm text-gray-500">
                    First to buzz gets to answer
                  </p>
                </div>
                <BuzzerButton
                  onBuzz={handleBuzzer}
                  disabled={timeLeft <= 0}
                  buzzed={buzzerPressed}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buzzer Status */}
        {buzzerPressed && myBuzzerPosition && (
          <Card className="shadow-lg border border-gray-100 mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-quiz-blue bg-opacity-10 rounded-xl p-4">
                  <i className="fas fa-check-circle text-quiz-blue text-3xl mb-2"></i>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Buzzed In!</h3>
                  <p className="text-gray-600">
                    You're #{myBuzzerPosition.buzzerOrder} - {(myBuzzerPosition.buzzerTime / 1000).toFixed(2)}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buzzer Order Display */}
        {buzzerOrder.length > 0 && (
          <Card className="shadow-lg border border-gray-100 mb-6">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Buzzer Order
              </h4>
              <div className="space-y-2">
                {buzzerOrder.map((buzz) => (
                  <div
                    key={buzz.participantId}
                    className={`flex items-center justify-between rounded-lg p-3 border ${
                      buzz.participantId === participantId 
                        ? 'bg-quiz-blue bg-opacity-10 border-quiz-blue' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        buzz.buzzerOrder === 1 ? 'bg-quiz-blue text-white' :
                        buzz.buzzerOrder === 2 ? 'bg-quiz-green text-white' :
                        buzz.buzzerOrder === 3 ? 'bg-quiz-orange text-white' :
                        'bg-gray-400 text-white'
                      }`}>
                        {buzz.buzzerOrder}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {buzz.participant}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {(buzz.buzzerTime / 1000).toFixed(2)}s
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Selection */}
        {canAnswer && currentQuestion && (
          <Card className="shadow-lg border border-gray-100 mb-6 animate-pulse-slow border-quiz-blue">
            <CardContent className="p-6">
              <div className="bg-quiz-blue bg-opacity-10 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-star text-quiz-blue text-2xl mr-2"></i>
                  <h4 className="text-xl font-bold text-quiz-blue">Your Turn!</h4>
                  <i className="fas fa-star text-quiz-blue text-2xl ml-2"></i>
                </div>
                <p className="text-center text-gray-700 font-medium">
                  You buzzed first - select your answer:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const options = currentQuestion.options as { A: string; B: string; C: string; D: string };
                  const colorClasses = {
                    A: 'bg-quiz-blue hover:bg-blue-600 shadow-lg',
                    B: 'bg-quiz-green hover:bg-green-600 shadow-lg',
                    C: 'bg-quiz-orange hover:bg-yellow-600 shadow-lg',
                    D: 'bg-quiz-red hover:bg-red-600 shadow-lg'
                  };
                  
                  return (
                    <Button
                      key={option}
                      data-testid={`button-answer-${option.toLowerCase()}`}
                      onClick={() => handleAnswerSelect(option)}
                      className={`${colorClasses[option]} text-white p-4 font-semibold transition-all transform hover:scale-105 text-left`}
                    >
                      <div className="flex items-start">
                        <span className="font-bold text-xl mr-3 mt-1">{option}.</span>
                        <span className="flex-1">{options[option]}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Submitted */}
        {selectedAnswer && (
          <Card className="shadow-lg border border-gray-100 mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-xl p-4">
                  <i className="fas fa-paper-plane text-green-600 text-3xl mb-2"></i>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Answer Submitted!</h3>
                  <p className="text-gray-600">
                    You selected: {selectedAnswer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Display */}
        <Card className="shadow-lg border border-gray-100">
          <CardContent className="p-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Your Score</h4>
              <div className="text-3xl font-bold text-quiz-blue" data-testid="text-participant-score">
                {participant.score} points
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-2 rounded-lg text-sm ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            <i className={`fas ${isConnected ? 'fa-wifi' : 'fa-wifi-slash'} mr-2`}></i>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
    </div>
  );
}

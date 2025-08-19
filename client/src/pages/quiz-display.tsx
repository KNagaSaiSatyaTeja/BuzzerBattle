import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/timer";
import { QuestionDisplay } from "@/components/question-display";
import { useWebSocket } from "@/hooks/use-websocket";
import { useParams } from "wouter";
import { QuizSession, Question, Participant } from "@shared/schema";

export default function QuizDisplay() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [buzzerOrder, setBuzzerOrder] = useState<Array<{ participant: string; time: number }>>([]);

  const { data: session } = useQuery<QuizSession>({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['/api/sessions', sessionId, 'questions'],
    enabled: !!sessionId,
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/sessions', sessionId, 'participants'],
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const { isConnected, lastMessage, sendMessage } = useWebSocket(sessionId, undefined, true);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'buzzer_pressed':
          setBuzzerOrder(prev => [...prev, {
            participant: lastMessage.participant,
            time: lastMessage.buzzerTime
          }]);
          break;
        case 'answer_submitted':
          // Handle answer submission
          break;
      }
    }
  }, [lastMessage]);

  const currentQuestion = questions[currentQuestionIndex];

  const startTimer = () => {
    const startTime = Date.now();
    setTimerStartTime(startTime);
    setTimerActive(true);
    setBuzzerOrder([]);
    
    sendMessage({
      type: 'start_timer',
      duration: session?.timerDuration || 30,
      questionStartTime: startTime
    });
  };

  const handleTimeUp = () => {
    setTimerActive(false);
    // Show results or move to next question
  };

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTimerActive(false);
      setBuzzerOrder([]);
      sendMessage({
        type: 'next_question'
      });
    } else {
      // End quiz
      sendMessage({
        type: 'quiz_ended'
      });
    }
  };

  const endQuiz = () => {
    setTimerActive(false);
    sendMessage({
      type: 'quiz_ended'
    });
  };

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p className="text-xl">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          {session.title}
        </h2>
        
        {/* Quiz Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold opacity-75">Question</span>
            <span className="text-2xl font-bold" data-testid="text-current-question">
              {currentQuestionIndex + 1}
            </span>
            <span className="text-lg opacity-75">of</span>
            <span className="text-xl" data-testid="text-total-questions">
              {questions.length}
            </span>
          </div>
          
          {/* Timer Display */}
          <Timer
            duration={session.timerDuration}
            isActive={timerActive}
            onTimeUp={handleTimeUp}
            startTime={timerStartTime || undefined}
          />
        </div>

        {/* Question Display */}
        <div className="mb-8">
          <QuestionDisplay question={currentQuestion} />
        </div>

        {/* Buzzer Order Display */}
        {buzzerOrder.length > 0 && (
          <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <h4 className="text-lg font-semibold mb-4">Buzzer Order</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {buzzerOrder.map((buzz, index) => (
                <div key={index} className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 bg-quiz-blue text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{buzz.participant}</span>
                    </div>
                    <span className="text-sm opacity-75">
                      {(buzz.time / 1000).toFixed(2)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants Display */}
        <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <h4 className="text-lg font-semibold mb-4">
            Participants ({participants.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {participants.map((participant) => (
              <div key={participant.id} className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm text-center">
                <div className="font-semibold text-sm">{participant.name}</div>
                <div className="text-lg font-bold text-quiz-blue">{participant.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Controls */}
        <div className="flex justify-center space-x-4">
          {!timerActive && (
            <Button
              data-testid="button-start-timer"
              onClick={startTimer}
              className="bg-quiz-green text-white px-6 py-3 font-semibold hover:bg-green-600 transition-colors"
            >
              <i className="fas fa-play mr-2"></i>Start Timer
            </Button>
          )}
          
          {timerActive && (
            <Button
              data-testid="button-pause-timer"
              onClick={pauseTimer}
              className="bg-quiz-orange text-white px-6 py-3 font-semibold hover:bg-yellow-600 transition-colors"
            >
              <i className="fas fa-pause mr-2"></i>Pause Timer
            </Button>
          )}
          
          <Button
            data-testid="button-next-question"
            onClick={nextQuestion}
            className="bg-quiz-blue text-white px-6 py-3 font-semibold hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-forward mr-2"></i>Next Question
          </Button>
          
          <Button
            data-testid="button-end-quiz"
            onClick={endQuiz}
            className="bg-quiz-red text-white px-6 py-3 font-semibold hover:bg-red-600 transition-colors"
          >
            <i className="fas fa-stop mr-2"></i>End Quiz
          </Button>
        </div>

        {/* Connection Status */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-2 rounded-lg text-sm ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <i className={`fas ${isConnected ? 'fa-wifi' : 'fa-wifi-slash'} mr-2`}></i>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
    </div>
  );
}

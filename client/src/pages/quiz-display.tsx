import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [pollResults, setPollResults] = useState<{ A: number; B: number; C: number; D: number }>({ A: 0, B: 0, C: 0, D: 0 });

  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery<QuizSession>({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions = [], isLoading: questionsLoading, error: questionsError } = useQuery<Question[]>({
    queryKey: ['/api/sessions', sessionId, 'questions'],
    enabled: !!sessionId,
  });

  // Add console logging for debugging
  useEffect(() => {
    console.log('Quiz Display Debug:', {
      sessionId,
      session,
      sessionLoading,
      sessionError,
      questions: questions.length,
      questionsLoading,
      questionsError
    });
  }, [sessionId, session, sessionLoading, sessionError, questions, questionsLoading, questionsError]);

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/sessions', sessionId, 'participants'],
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const { isConnected, lastMessage, sendMessage } = useWebSocket(sessionId, undefined, true);

  const currentQuestion = questions[currentQuestionIndex];

  const { data: currentQuestionResults } = useQuery<{
    question: Question;
    responses: any[];
    pollResults: { A: number; B: number; C: number; D: number };
    totalResponses: number;
  }>({
    queryKey: ['/api/questions', currentQuestion?.id, 'results'],
    enabled: !!currentQuestion?.id && showResults,
    refetchInterval: 1000,
  });

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
    setShowResults(true);
  };

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const showPollResults = () => {
    setShowResults(true);
    if (currentQuestionResults?.pollResults) {
      setPollResults(currentQuestionResults.pollResults);
    }
  };

  const showCorrectAnswerHandler = () => {
    setShowCorrectAnswer(true);
  };

  const showLeaderboardHandler = () => {
    if (sessionId) {
      // Navigate to dedicated leaderboard page
      window.location.href = `/leaderboard/${sessionId}`;
    }
  };

  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTimerActive(false);
      setBuzzerOrder([]);
      setShowResults(false);
      setShowLeaderboard(false);
      setShowCorrectAnswer(false);
      setPollResults({ A: 0, B: 0, C: 0, D: 0 });
      sendMessage({
        type: 'next_question'
      });
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    setTimerActive(false);
    setShowLeaderboard(true);
    sendMessage({
      type: 'quiz_ended'
    });
  };

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p className="text-xl">Loading quiz...</p>
          {sessionId && <p className="text-sm mt-2 opacity-75">Session ID: {sessionId}</p>}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl mb-4 text-yellow-500"></i>
          <p className="text-xl">No questions found</p>
          <p className="text-sm mt-2 opacity-75">Please add questions to this quiz session</p>
        </div>
      </div>
    );
  }

  // Show final leaderboard after quiz ends
  if (showLeaderboard && currentQuestionIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quiz-purple to-purple-700 p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">
            🏆 Final Results - {session.title}
          </h2>
          
          {participants.slice(0, 3).length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Podium display */}
              <div className="text-center order-1">
                <div className="bg-gray-300 text-gray-700 w-16 h-20 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <Card className="bg-white text-gray-900">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg">{participants[1]?.name || ""}</h3>
                    <p className="text-2xl font-bold text-quiz-blue">{participants[1]?.score || 0} pts</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center order-2">
                <div className="bg-yellow-400 text-yellow-900 w-16 h-24 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                  <span className="text-3xl font-bold">1</span>
                </div>
                <Card className="bg-white text-gray-900 border-4 border-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-crown text-yellow-500 text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-xl">{participants[0]?.name || ""}</h3>
                    <p className="text-3xl font-bold text-quiz-green">{participants[0]?.score || 0} pts</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center order-3">
                <div className="bg-orange-400 text-orange-900 w-16 h-16 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                  <span className="text-xl font-bold">3</span>
                </div>
                <Card className="bg-white text-gray-900">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg">{participants[2]?.name || ""}</h3>
                    <p className="text-2xl font-bold text-quiz-orange">{participants[2]?.score || 0} pts</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-quiz-blue text-white px-8 py-4 font-semibold text-lg hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-home mr-2"></i>Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show poll results screen
  if (showResults && currentQuestion) {
    const options = currentQuestion.options as { A: string; B: string; C: string; D: string };
    const optionKeys = ['A', 'B', 'C', 'D'] as const;
    const optionColors = {
      A: 'bg-quiz-blue',
      B: 'bg-quiz-green', 
      C: 'bg-quiz-orange',
      D: 'bg-quiz-red'
    };

    const totalResponses = Object.values(pollResults).reduce((sum, count) => sum + count, 0);
    const getPercentage = (votes: number) => totalResponses > 0 ? Math.round((votes / totalResponses) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border border-gray-100">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Poll Results - Question {currentQuestionIndex + 1}
              </h2>
              
              <Card className="bg-gray-50 mb-8">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {currentQuestion.questionText}
                  </h3>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <span><i className="fas fa-users mr-1"></i>{totalResponses} participants</span>
                    {showCorrectAnswer && (
                      <span className="text-quiz-green font-semibold">
                        <i className="fas fa-check-circle mr-1"></i>Correct: {currentQuestion.correctAnswer}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 mb-8">
                {optionKeys.map((key) => {
                  const votes = pollResults[key];
                  const percentage = getPercentage(votes);
                  const isCorrect = key === currentQuestion.correctAnswer;
                  
                  return (
                    <Card key={key} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className={`w-8 h-8 ${optionColors[key]} text-white rounded-full flex items-center justify-center font-bold`}>
                              {key}
                            </span>
                            <span className="font-semibold text-gray-900">{options[key]}</span>
                            {isCorrect && showCorrectAnswer && (
                              <i className="fas fa-check-circle text-quiz-green ml-2"></i>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">{votes} votes</span>
                            <span className="text-sm text-gray-600 ml-2">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`${isCorrect && showCorrectAnswer ? 'bg-quiz-green' : 'bg-gray-400'} h-3 rounded-full transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="text-center space-x-4">
                {!showCorrectAnswer && (
                  <Button
                    onClick={showCorrectAnswerHandler}
                    className="bg-quiz-green text-white px-6 py-3 font-semibold hover:bg-green-600 transition-colors"
                  >
                    <i className="fas fa-eye mr-2"></i>Reveal Answer
                  </Button>
                )}
                <Button
                  onClick={showLeaderboardHandler}
                  className="bg-quiz-purple text-white px-6 py-3 font-semibold hover:bg-purple-600 transition-colors"
                  data-testid="button-show-leaderboard"
                >
                  <i className="fas fa-trophy mr-2"></i>Show Leaderboard
                </Button>
                <Button
                  onClick={nextQuestion}
                  className="bg-quiz-blue text-white px-6 py-3 font-semibold hover:bg-blue-600 transition-colors"
                >
                  <i className="fas fa-arrow-right mr-2"></i>
                  {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'End Quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show leaderboard screen
  if (showLeaderboard && !showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quiz-purple to-purple-700 p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">
            🏆 Current Leaderboard
          </h2>
          
          {participants.slice(0, 3).length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center order-1">
                <div className="bg-gray-300 text-gray-700 w-16 h-20 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <Card className="bg-white text-gray-900">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg">{participants[1]?.name || ""}</h3>
                    <p className="text-2xl font-bold text-quiz-blue">{participants[1]?.score || 0} pts</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center order-2">
                <div className="bg-yellow-400 text-yellow-900 w-16 h-24 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                  <span className="text-3xl font-bold">1</span>
                </div>
                <Card className="bg-white text-gray-900 border-4 border-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex justify-center mb-2">
                      <i className="fas fa-crown text-yellow-500 text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-xl">{participants[0]?.name || ""}</h3>
                    <p className="text-3xl font-bold text-quiz-green">{participants[0]?.score || 0} pts</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center order-3">
                <div className="bg-orange-400 text-orange-900 w-16 h-16 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                  <span className="text-xl font-bold">3</span>
                </div>
                <Card className="bg-white text-gray-900">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg">{participants[2]?.name || ""}</h3>
                    <p className="text-2xl font-bold text-quiz-orange">{participants[2]?.score || 0} pts</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button
              onClick={() => setShowLeaderboard(false)}
              className="bg-quiz-blue text-white px-8 py-4 font-semibold text-lg hover:bg-blue-600 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>Continue Quiz
            </Button>
          </div>
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

        {/* Buzzer Order Display for Admin */}
        {buzzerOrder.length > 0 && timerActive && (
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                <i className="fas fa-hand-paper mr-2"></i>Buzzer Order
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {buzzerOrder.map((buzz) => (
                  <div
                    key={buzz.participantId}
                    className="bg-white bg-opacity-20 rounded-lg p-4 border border-white border-opacity-30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          buzz.buzzerOrder === 1 ? 'bg-quiz-blue text-white' :
                          buzz.buzzerOrder === 2 ? 'bg-quiz-green text-white' :
                          buzz.buzzerOrder === 3 ? 'bg-quiz-orange text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {buzz.buzzerOrder}
                        </span>
                        <span className="font-semibold text-white">
                          {buzz.participant}
                        </span>
                      </div>
                      <span className="text-sm text-white opacity-75">
                        {(buzz.buzzerTime / 1000).toFixed(2)}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Controls */}
        <div className="flex flex-wrap justify-center gap-4">
          {!timerActive && !showResults && (
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

          {buzzerOrder.length > 0 && (
            <Button
              data-testid="button-reset-buzzers"
              onClick={() => {
                setBuzzerOrder([]);
                sendMessage({ type: 'reset_buzzers' });
              }}
              className="bg-red-500 text-white px-6 py-3 font-semibold hover:bg-red-600 transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>Reset Buzzers
            </Button>
          )}

          <Button
            data-testid="button-show-results"
            onClick={showPollResults}
            className="bg-quiz-purple text-white px-6 py-3 font-semibold hover:bg-purple-600 transition-colors"
          >
            <i className="fas fa-chart-bar mr-2"></i>Show Results
          </Button>
          
          <Button
            data-testid="button-show-leaderboard"
            onClick={showLeaderboardHandler}
            className="bg-quiz-blue text-white px-6 py-3 font-semibold hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-trophy mr-2"></i>Leaderboard
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

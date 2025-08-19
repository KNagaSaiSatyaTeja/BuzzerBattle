import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "wouter";
import { Question } from "@shared/schema";

interface PollResultsData {
  question: Question;
  responses: any[];
  pollResults: { A: number; B: number; C: number; D: number };
  totalResponses: number;
}

export default function PollResults() {
  const { questionId } = useParams<{ questionId: string }>();

  const { data: pollData } = useQuery<PollResultsData>({
    queryKey: ['/api/questions', questionId, 'results'],
    enabled: !!questionId,
  });

  if (!pollData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4 text-quiz-blue"></i>
          <p className="text-xl text-gray-700">Loading results...</p>
        </div>
      </div>
    );
  }

  const { question, pollResults, totalResponses } = pollData;
  const options = question.options as { A: string; B: string; C: string; D: string };
  const optionKeys = ['A', 'B', 'C', 'D'] as const;

  const optionColors = {
    A: 'bg-quiz-blue',
    B: 'bg-quiz-green', 
    C: 'bg-quiz-orange',
    D: 'bg-quiz-red'
  };

  const getPercentage = (votes: number) => {
    return totalResponses > 0 ? Math.round((votes / totalResponses) * 100) : 0;
  };

  const correctAnswers = pollResults[question.correctAnswer as keyof typeof pollResults];
  const incorrectAnswers = totalResponses - correctAnswers;
  const avgResponseTime = 2.3; // This would be calculated from actual response times

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border border-gray-100">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Question Results
            </h2>
            
            {/* Question Recap */}
            <Card className="bg-gray-50 mb-8">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid="question-recap">
                  {question.questionText}
                </h3>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <span data-testid="total-participants">
                    <i className="fas fa-users mr-1"></i>
                    {totalResponses} participants
                  </span>
                  <span>
                    <i className="fas fa-clock mr-1"></i>
                    60 seconds
                  </span>
                  <span className="text-quiz-green font-semibold" data-testid="correct-answer">
                    <i className="fas fa-check-circle mr-1"></i>
                    Correct: {question.correctAnswer}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Answer Distribution */}
            <div className="space-y-4 mb-8">
              {optionKeys.map((key) => {
                const votes = pollResults[key];
                const percentage = getPercentage(votes);
                const isCorrect = key === question.correctAnswer;
                
                return (
                  <Card key={key} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`w-8 h-8 ${optionColors[key]} text-white rounded-full flex items-center justify-center font-bold`}>
                            {key}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {options[key]}
                          </span>
                          {isCorrect && (
                            <i className="fas fa-check-circle text-quiz-green ml-2"></i>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900" data-testid={`votes-${key.toLowerCase()}`}>
                            {votes} votes
                          </span>
                          <span className="text-sm text-gray-600 ml-2" data-testid={`percentage-${key.toLowerCase()}`}>
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${isCorrect ? 'bg-quiz-green' : 'bg-gray-400'} h-3 rounded-full transition-all duration-1000`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-quiz-green bg-opacity-10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-quiz-green mb-1" data-testid="correct-count">
                    {correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </CardContent>
              </Card>
              <Card className="bg-quiz-red bg-opacity-10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-quiz-red mb-1" data-testid="incorrect-count">
                    {incorrectAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Incorrect Answers</div>
                </CardContent>
              </Card>
              <Card className="bg-quiz-orange bg-opacity-10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-quiz-orange mb-1" data-testid="avg-response-time">
                    {avgResponseTime}s
                  </div>
                  <div className="text-sm text-gray-600">Avg. Response Time</div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button
                data-testid="button-continue"
                className="bg-quiz-blue text-white px-8 py-3 font-semibold text-lg hover:bg-blue-600 transition-colors"
              >
                <i className="fas fa-arrow-right mr-2"></i>
                Continue to Next Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

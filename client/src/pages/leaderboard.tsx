import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "wouter";
import { Participant } from "@shared/schema";

export default function Leaderboard() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/sessions', sessionId, 'leaderboard'],
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const topThree = participants.slice(0, 3);
  const remaining = participants.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-purple to-purple-700 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-8">
          🏆 Live Leaderboard
        </h2>
        
        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <div className="text-center order-1">
              <div className="bg-gray-300 text-gray-700 w-16 h-20 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                <span className="text-2xl font-bold">2</span>
              </div>
              <Card className="bg-white text-gray-900">
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg" data-testid="text-second-place-name">
                    {topThree[1]?.name || ""}
                  </h3>
                  <p className="text-2xl font-bold text-quiz-blue" data-testid="text-second-place-score">
                    {topThree[1]?.score || 0} pts
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* 1st Place */}
            <div className="text-center order-2">
              <div className="bg-yellow-400 text-yellow-900 w-16 h-24 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                <span className="text-3xl font-bold">1</span>
              </div>
              <Card className="bg-white text-gray-900 border-4 border-yellow-400">
                <CardContent className="p-4">
                  <div className="flex justify-center mb-2">
                    <i className="fas fa-crown text-yellow-500 text-2xl"></i>
                  </div>
                  <h3 className="font-bold text-xl" data-testid="text-first-place-name">
                    {topThree[0]?.name || ""}
                  </h3>
                  <p className="text-3xl font-bold text-quiz-green" data-testid="text-first-place-score">
                    {topThree[0]?.score || 0} pts
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* 3rd Place */}
            <div className="text-center order-3">
              <div className="bg-orange-400 text-orange-900 w-16 h-16 rounded-t-lg mx-auto mb-3 flex items-end justify-center pb-2">
                <span className="text-xl font-bold">3</span>
              </div>
              <Card className="bg-white text-gray-900">
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg" data-testid="text-third-place-name">
                    {topThree[2]?.name || ""}
                  </h3>
                  <p className="text-2xl font-bold text-quiz-orange" data-testid="text-third-place-score">
                    {topThree[2]?.score || 0} pts
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Remaining Rankings */}
        {remaining.length > 0 && (
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                {remaining.map((participant, index) => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm"
                    data-testid={`leaderboard-row-${index + 4}`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center font-bold">
                        {index + 4}
                      </span>
                      <span className="font-semibold text-lg" data-testid={`participant-name-${index + 4}`}>
                        {participant.name}
                      </span>
                    </div>
                    <span className="text-2xl font-bold" data-testid={`participant-score-${index + 4}`}>
                      {participant.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {participants.length === 0 && (
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <i className="fas fa-users text-4xl mb-4 opacity-50"></i>
              <h3 className="text-xl font-semibold mb-2">No participants yet</h3>
              <p className="opacity-75">Waiting for quiz to start...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

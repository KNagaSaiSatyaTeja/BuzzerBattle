import { useEffect, useState } from "react";

interface TimerProps {
  duration: number; // seconds
  isActive: boolean;
  onTimeUp: () => void;
  startTime?: number;
  className?: string;
}

export function Timer({ duration, isActive, onTimeUp, startTime, className = "" }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = startTime ? Math.floor((now - startTime) / 1000) : 0;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        onTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, duration, startTime, onTimeUp]);

  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle 
            cx="32" 
            cy="32" 
            r="28" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="4" 
            fill="none"
          />
          <circle 
            cx="32" 
            cy="32" 
            r="28" 
            stroke={timeLeft <= 10 ? "#EF4444" : "#F59E0B"}
            strokeWidth="4" 
            fill="none" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-quiz-orange'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
      <span className="text-lg opacity-75">seconds</span>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  buzzed?: boolean;
}

export function BuzzerButton({ onBuzz, disabled = false, buzzed = false }: BuzzerButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleBuzz = () => {
    if (disabled || buzzed) return;
    
    setIsPressed(true);
    onBuzz();
    
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <Button
      data-testid="buzzer-button"
      onClick={handleBuzz}
      disabled={disabled || buzzed}
      className={`
        w-64 h-64 rounded-full text-4xl font-bold shadow-2xl transition-all transform
        ${buzzed 
          ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
          : disabled 
            ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-br from-quiz-red to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
        }
        ${isPressed ? 'scale-95' : ''}
        ${!disabled && !buzzed ? 'animate-pulse-slow' : ''}
      `}
    >
      <div className="flex flex-col items-center text-white">
        <i className="fas fa-hand-paper text-6xl mb-2"></i>
        <span>{buzzed ? 'BUZZED!' : 'BUZZ!'}</span>
      </div>
    </Button>
  );
}

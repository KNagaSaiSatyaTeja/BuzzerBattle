import { Question } from "@shared/schema";

interface QuestionDisplayProps {
  question: Question;
  showOptions?: boolean;
  onOptionSelect?: (option: string) => void;
  selectedOption?: string;
}

export function QuestionDisplay({ 
  question, 
  showOptions = true, 
  onOptionSelect, 
  selectedOption 
}: QuestionDisplayProps) {
  const options = question.options as { A: string; B: string; C: string; D: string };
  const optionKeys = ['A', 'B', 'C', 'D'] as const;
  const optionColors = {
    A: 'bg-quiz-blue hover:bg-blue-600',
    B: 'bg-quiz-green hover:bg-green-600', 
    C: 'bg-quiz-orange hover:bg-yellow-600',
    D: 'bg-quiz-red hover:bg-red-600'
  };

  return (
    <div className="bg-white rounded-2xl p-8 text-gray-900">
      <div className="text-center">
        <h3 className="text-3xl font-bold mb-6" data-testid="question-text">
          {question.questionText}
        </h3>
        
        {question.type === 'image' && question.imageUrl && (
          <div className="mb-6">
            <img 
              src={question.imageUrl} 
              alt="Question image" 
              className="rounded-xl shadow-lg mx-auto max-w-md"
              data-testid="question-image"
            />
          </div>
        )}
        
        {question.type === 'audio' && question.audioUrl && (
          <div className="bg-gray-100 rounded-xl p-6 mb-6 max-w-md mx-auto">
            <i className="fas fa-volume-up text-4xl text-quiz-blue mb-4"></i>
            <p className="text-lg font-semibold text-gray-700 mb-3">Listen and answer</p>
            <audio controls className="w-full" data-testid="question-audio">
              <source src={question.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      {showOptions && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          {optionKeys.map((key) => (
            <button
              key={key}
              data-testid={`option-${key.toLowerCase()}`}
              onClick={() => onOptionSelect?.(key)}
              className={`
                ${optionColors[key]} text-white p-6 rounded-xl text-xl font-semibold 
                transition-all transform hover:scale-105 flex items-center space-x-4
                ${selectedOption === key ? 'ring-4 ring-white ring-opacity-50' : ''}
              `}
            >
              <span className="w-10 h-10 bg-white text-current rounded-full flex items-center justify-center font-bold">
                {key}
              </span>
              <span>{options[key]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

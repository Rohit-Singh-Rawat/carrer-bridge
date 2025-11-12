'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MCQQuestionProps {
  question: string;
  options: Array<{ id: string; text: string }>;
  onAnswer: (optionId: string) => void;
  disabled?: boolean;
}

export function MCQQuestion({ question, options, onAnswer, disabled = false }: MCQQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || disabled) return;
    onAnswer(selectedOption);
  };

  return (
    <div className="p-4 bg-card/50 border border-border rounded-lg backdrop-blur-sm">
      <p className="text-sm font-medium text-foreground mb-3 leading-snug">{question}</p>
      
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            disabled={disabled}
            className={cn(
              'w-full text-left px-3 py-2.5 rounded-md border transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2.5 group',
              selectedOption === option.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/50 bg-background/50 hover:border-primary/40 hover:bg-accent/30'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                selectedOption === option.id
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30 group-hover:border-primary/40'
              )}
            >
              {selectedOption === option.id && (
                <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
              )}
            </div>
            
            <span className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded min-w-[20px] text-center flex-shrink-0",
              selectedOption === option.id
                ? "bg-primary/20 text-primary"
                : "bg-muted/60 text-muted-foreground"
            )}>
              {option.id}
            </span>
            
            <span className="text-sm text-foreground/90">{option.text}</span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedOption || disabled}
        className="w-full mt-3 h-9"
        size="sm"
      >
        {selectedOption ? 'Submit' : 'Select an option'}
      </Button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MCQOption } from '@/types/interview';

interface MCQQuestionProps {
	question: string;
	options: MCQOption[];
	onSelect: (optionId: string) => void;
	disabled?: boolean;
}

export function MCQQuestion({ question, options, onSelect, disabled = false }: MCQQuestionProps) {
	const [selectedOption, setSelectedOption] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (disabled || selectedOption) return;

			const key = e.key.toLowerCase();
			if (['1', '2', '3', '4'].includes(key)) {
				const optionIndex = Number.parseInt(key) - 1;
				if (options[optionIndex]) {
					setSelectedOption(options[optionIndex].id);
				}
			} else if (['a', 'b', 'c', 'd'].includes(key)) {
				const option = options.find((opt) => opt.id === key);
				if (option) {
					setSelectedOption(option.id);
				}
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [disabled, selectedOption, options]);

	const handleSubmit = () => {
		if (selectedOption && !disabled) {
			onSelect(selectedOption);
		}
	};

	return (
		<div className='space-y-4 p-6 rounded-xl border bg-card'>
			<h3 className="font-['outfit'] text-lg font-medium">{question}</h3>

			<div className='space-y-2'>
				{options.map((option, index) => (
					<button
						key={option.id}
						type='button'
						onClick={() => !disabled && setSelectedOption(option.id)}
						disabled={disabled}
						className={cn(
							"w-full text-left p-4 rounded-lg border-2 transition-all font-['outfit']",
							'hover:border-ocean-wave hover:bg-ocean-wave/5',
							selectedOption === option.id
								? 'border-ocean-wave bg-ocean-wave/10'
								: 'border-border bg-background',
							disabled && 'opacity-50 cursor-not-allowed'
						)}
					>
						<span className='font-medium'>{option.id.toUpperCase()}.</span> {option.text}
						<span className='text-xs text-muted-foreground ml-2'>(Press {index + 1})</span>
					</button>
				))}
			</div>

			{selectedOption && (
				<Button
					onClick={handleSubmit}
					disabled={disabled}
					className="w-full font-['outfit']"
				>
					Submit Answer
				</Button>
			)}
		</div>
	);
}


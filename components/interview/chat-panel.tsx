'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SentIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { InterviewMessage } from '@/types/interview';

interface ChatPanelProps {
	messages: InterviewMessage[];
	isAITyping: boolean;
	onSendMessage: (text: string) => void;
	disabled?: boolean;
	showTextInput?: boolean;
	interimTranscript?: string;
}

export function ChatPanel({
	messages,
	isAITyping,
	onSendMessage,
	disabled = false,
	showTextInput = false,
	interimTranscript = '',
}: ChatPanelProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, isAITyping]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const message = formData.get('message') as string;

		if (message.trim()) {
			onSendMessage(message.trim());
			e.currentTarget.reset();
		}
	};

	const formatTime = (timestamp: Date | string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<div className='flex flex-col h-full'>
			<div className='flex-1 overflow-y-auto space-y-4 p-6'>
				{messages.map((message) => (
					<div
						key={message.id}
						className={cn(
							'flex',
							message.role === 'user' ? 'justify-end' : 'justify-start'
						)}
					>
						<div
							className={cn(
								'max-w-[80%] rounded-xl p-4 space-y-1',
								message.role === 'user'
									? 'bg-ocean-wave text-white'
									: 'bg-muted text-foreground'
							)}
						>
							<p className="font-['outfit'] whitespace-pre-wrap">{message.content}</p>
							<p
								className={cn(
									"text-xs font-['outfit']",
									message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
								)}
							>
								{formatTime(message.timestamp)}
							</p>
						</div>
					</div>
				))}

				{isAITyping && (
					<div className='flex justify-start'>
						<div className='max-w-[80%] rounded-xl p-4 bg-muted'>
							<div className='flex items-center gap-2'>
								<Skeleton className='h-2 w-2 rounded-full' />
								<Skeleton className='h-2 w-2 rounded-full' />
								<Skeleton className='h-2 w-2 rounded-full' />
							</div>
						</div>
					</div>
				)}

				{interimTranscript && (
					<div className='flex justify-end'>
						<div className='max-w-[80%] rounded-xl p-4 bg-ocean-wave/50 text-white border-2 border-ocean-wave'>
							<p className="font-['outfit'] whitespace-pre-wrap italic">
								{interimTranscript}
							</p>
							<p className="text-xs font-['outfit'] text-white/70">
								Listening...
							</p>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{showTextInput && (
				<div className='border-t p-4'>
					<form
						onSubmit={handleSubmit}
						className='flex gap-2'
					>
						<Input
							ref={inputRef}
							name='message'
							placeholder='Type your response...'
							disabled={disabled}
							className="font-['outfit']"
						/>
						<Button
							type='submit'
							disabled={disabled}
							className="font-['outfit']"
						>
							<HugeiconsIcon
								icon={SentIcon}
								className='size-5'
							/>
						</Button>
					</form>
				</div>
			)}
		</div>
	);
}


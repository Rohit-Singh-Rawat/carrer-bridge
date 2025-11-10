'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Download01Icon, Search01Icon, UserIcon, AiIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { InterviewMessage } from '@/types/interview';

interface TranscriptViewerProps {
	messages: InterviewMessage[];
}

export function TranscriptViewer({ messages }: TranscriptViewerProps) {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredMessages = messages.filter((msg) =>
		msg.content.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const formatTime = (timestamp: Date | string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	};

	const formatPhase = (phase: string | null) => {
		if (!phase) return null;
		return phase
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const handleExport = () => {
		const text = messages
			.map((msg) => {
				const time = formatTime(msg.timestamp);
				const role = msg.role === 'user' ? 'Candidate' : 'AI Interviewer';
				return `[${time}] ${role}: ${msg.content}`;
			})
			.join('\n\n');

		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `interview-transcript-${Date.now()}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className='space-y-4 h-full flex flex-col'>
			<div className='flex items-center gap-4'>
				<div className='relative flex-1'>
					<HugeiconsIcon
						icon={Search01Icon}
						className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground'
					/>
					<Input
						placeholder='Search transcript...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 font-['outfit']"
					/>
				</div>
				<Button
					variant='outline'
					onClick={handleExport}
					className="font-['outfit']"
				>
					<HugeiconsIcon
						icon={Download01Icon}
						className='size-4 mr-2'
					/>
					Export
				</Button>
			</div>

			<div className='flex-1 overflow-y-auto space-y-4 pr-2'>
				{filteredMessages.map((message, index) => (
					<div
						key={message.id}
						className='rounded-xl border bg-card p-4 space-y-3'
					>
						<div className='flex items-start justify-between gap-4'>
							<div className='flex items-center gap-3'>
								<div
									className={cn(
										'size-10 rounded-full flex items-center justify-center',
										message.role === 'user'
											? 'bg-ocean-wave/10 text-ocean-wave'
											: 'bg-purple-50 text-purple-600'
									)}
								>
									<HugeiconsIcon
										icon={message.role === 'user' ? UserIcon : AiIcon}
										className='size-5'
									/>
								</div>
								<div>
									<p className="font-['outfit'] font-medium">
										{message.role === 'user' ? 'Candidate' : 'AI Interviewer'}
									</p>
									<p className="text-xs text-muted-foreground font-['outfit']">
										{formatTime(message.timestamp)}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								{message.phase && (
									<Badge
										variant='outline'
										className="font-['outfit']"
									>
										{formatPhase(message.phase)}
									</Badge>
								)}
								{message.messageType === 'mcq' && (
									<Badge
										variant='outline'
										className='bg-purple-50 text-purple-700 border-purple-200'
									>
										MCQ
									</Badge>
								)}
								{message.questionIndex !== null && (
									<Badge
										variant='outline'
										className="font-['outfit']"
									>
										Q{message.questionIndex}
									</Badge>
								)}
							</div>
						</div>

						<p className="text-sm font-['outfit'] whitespace-pre-wrap">{message.content}</p>

						{message.messageType === 'mcq' && message.mcqOptions && (
							<div className='mt-3 space-y-2 pl-4 border-l-2 border-purple-200'>
								{JSON.parse(message.mcqOptions as string).map((option: any) => (
									<div
										key={option.id}
										className='text-sm'
									>
										<span className='font-medium'>{option.id.toUpperCase()}.</span> {option.text}
									</div>
								))}
							</div>
						)}
					</div>
				))}

				{filteredMessages.length === 0 && (
					<div className='text-center py-12'>
						<p className="text-muted-foreground font-['outfit']">
							{searchQuery ? 'No messages found matching your search' : 'No messages yet'}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}


'use client';

import { Bot, Clock, User, Volume2, VolumeX, Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { MCQQuestion } from './mcq-question';

interface Message {
	id: number;
	type: 'user' | 'ai';
	messageType: 'text' | 'mcq';
	text: string;
	timestamp: Date;
	mcqData?: {
		question: string;
		options: Array<{ id: string; text: string }>;
	};
	isInterim?: boolean;
}

interface TranscriptViewerProps {
	messages: Message[];
	isAITyping?: boolean;
	currentMCQ?: {
		question: string;
		options: Array<{ id: string; text: string }>;
	} | null;
	onMCQAnswer?: (optionId: string) => void;
	onPlayAudio?: (messageId: number, text: string) => void;
	playingMessageId?: number | null;
	audioLoading?: boolean;
}

export function TranscriptViewer({
	messages,
	isAITyping = false,
	currentMCQ,
	onMCQAnswer,
	onPlayAudio,
	playingMessageId,
	audioLoading = false,
}: TranscriptViewerProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isAITyping]);

	const formatTime = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (seconds < 60) {
			return 'Just now';
		} else if (minutes < 60) {
			return `${minutes}m ago`;
		} else if (hours < 24) {
			return `${hours}h ago`;
		} else {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
	};

	return (
		<div className='h-full flex flex-col bg-background border-l border-border overflow-hidden'>
			{/* Header */}
			<div className='p-5 border-b border-border bg-card sticky top-0 z-10'>
				<div className='flex items-center gap-3 mb-2'>
					<div className='p-2 rounded-lg bg-primary'>
						<Clock className='w-5 h-5 text-primary-foreground' />
					</div>
					<h3 className='text-xl font-bold text-foreground'>Live Transcript</h3>
				</div>
				<p className='text-sm text-muted-foreground ml-12'>Real-time conversation transcription</p>
			</div>

			{/* Messages Container */}
			<div className='flex-1 min-h-0 overflow-hidden'>
				<ScrollArea className='h-full'>
					<div className='p-4 space-y-4 pb-8'>
						{messages.length === 0 ? (
							<div className='flex flex-col items-center justify-center h-32 text-center'>
								<div className='p-4 rounded-lg bg-muted mb-4'>
									<Bot className='w-8 h-8 text-muted-foreground' />
								</div>
								<p className='text-sm font-medium text-muted-foreground'>
									Conversation will appear here as you speak
								</p>
							</div>
						) : (
							messages.map((message, index) => {
								const isUser = message.type === 'user';
								const showAvatar = index === 0 || messages[index - 1].type !== message.type;
								const isMCQ = message.messageType === 'mcq' && message.mcqData;

								return (
									<div
										key={message.id}
										className={cn(
											'flex gap-3 group animate-in slide-in-from-bottom-2 duration-300',
											isUser ? 'flex-row-reverse' : 'flex-row'
										)}
									>
										{/* Avatar */}
										<div className={cn('flex-shrink-0', !showAvatar && 'invisible')}>
											<div
												className={cn(
													'w-9 h-9 rounded-lg flex items-center justify-center',
													isUser
														? 'bg-primary text-primary-foreground'
														: 'bg-muted text-foreground border border-border'
												)}
											>
												{isUser ? <User className='w-5 h-5' /> : <Bot className='w-5 h-5' />}
											</div>
										</div>

										{/* Message Content */}
										<div
											className={cn('flex flex-col flex-1', isUser ? 'items-end' : 'items-start')}
										>
											{/* Sender Name and Time */}
											{showAvatar && (
												<div
													className={cn(
														'flex items-center gap-2 mb-1 px-1',
														isUser ? 'flex-row-reverse' : 'flex-row'
													)}
												>
													<span className='text-xs font-medium text-foreground'>
														{isUser ? 'You' : 'AI Interviewer'}
													</span>
													<span className='text-xs text-muted-foreground'>
														{formatTime(message.timestamp)}
													</span>
												</div>
											)}

											{/* MCQ Question */}
											{isMCQ && message.mcqData && !isUser ? (
												<div className='w-full max-w-2xl'>
													<MCQQuestion
														question={message.mcqData.question}
														options={message.mcqData.options}
														onAnswer={onMCQAnswer || (() => {})}
														disabled={currentMCQ === null}
													/>
												</div>
											) : (
												/* Regular Message Bubble */
												<div className='flex items-start gap-2'>
													<div
														className={cn(
															'relative max-w-[85%] px-4 py-3 rounded-2xl transition-all duration-200',
															isUser
																? 'bg-primary text-primary-foreground rounded-br-md'
																: 'bg-muted text-foreground rounded-bl-md border border-border',
															message.isInterim && 'opacity-70 italic border-dashed'
														)}
													>
														<p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
															{message.text}
															{message.isInterim && <span className='ml-1 animate-pulse'>...</span>}
														</p>

														{/* Timestamp for non-avatar messages */}
														{!showAvatar && (
															<div
																className={cn(
																	'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-70 transition-opacity',
																	isUser ? 'justify-end' : 'justify-start'
																)}
															>
																<span
																	className={cn(
																		'text-xs',
																		isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
																	)}
																>
																	{formatTime(message.timestamp)}
																</span>
															</div>
														)}
													</div>

													{/* Audio playback button for AI messages */}
													{!isUser && !message.isInterim && onPlayAudio && (
														<Button
															variant='ghost'
															size='sm'
															onClick={() => onPlayAudio(message.id, message.text)}
															disabled={audioLoading}
															className='h-8 w-8 p-0 flex-shrink-0 hover:bg-muted/50'
															title='Play audio'
														>
															{audioLoading && playingMessageId === message.id ? (
																<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
															) : playingMessageId === message.id ? (
																<Volume2 className='h-4 w-4 text-primary animate-pulse' />
															) : (
																<Volume2 className='h-4 w-4 text-muted-foreground' />
															)}
														</Button>
													)}
												</div>
											)}
										</div>
									</div>
								);
							})
						)}

						{/* Typing Indicator */}
						{isAITyping && (
							<div className='flex gap-3 animate-in slide-in-from-bottom-2 duration-300'>
								<div className='flex-shrink-0'>
									<div className='w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center'>
										<Bot className='w-5 h-5 text-foreground' />
									</div>
								</div>
								<div className='flex flex-col items-start'>
									<div className='flex items-center gap-2 mb-1 px-1'>
										<span className='text-xs font-semibold text-foreground'>AI Interviewer</span>
										<span className='text-xs text-muted-foreground'>typing...</span>
									</div>
									<div className='bg-muted rounded-2xl rounded-bl-md border border-border px-5 py-3'>
										<div className='flex items-center gap-1.5'>
											<div className='w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce' />
											<div
												className='w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce'
												style={{ animationDelay: '0.15s' }}
											/>
											<div
												className='w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce'
												style={{ animationDelay: '0.3s' }}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Auto-scroll anchor */}
						<div
							ref={scrollRef}
							className='h-1'
						/>
					</div>
				</ScrollArea>
			</div>

			{/* Footer with status */}
			{(isAITyping || currentMCQ) && (
				<div className='p-4 border-t border-border bg-card'>
					<div className='flex items-center justify-center gap-2.5 text-sm'>
						<div className='w-2 h-2 bg-primary rounded-full animate-pulse' />
						<span className='text-muted-foreground'>Live transcription active</span>
					</div>
				</div>
			)}
		</div>
	);
}

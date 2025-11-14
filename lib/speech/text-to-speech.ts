export interface TextToSpeechConfig {
	voice?: SpeechSynthesisVoice;
	rate?: number;
	pitch?: number;
	volume?: number;
	lang?: string;
}

export interface TextToSpeechCallbacks {
	onStart?: () => void;
	onEnd?: () => void;
	onError?: (error: Error) => void;
}

export class TextToSpeechManager {
	private synthesis: SpeechSynthesis | null = null;
	private currentUtterance: SpeechSynthesisUtterance | null = null;
	private queue: string[] = [];
	private isPlaying = false;
	private callbacks: TextToSpeechCallbacks = {};

	constructor(
		private config: TextToSpeechConfig = {},
		callbacks: TextToSpeechCallbacks = {}
	) {
		this.callbacks = callbacks;
		this.initialize();
	}

	private initialize(): void {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			this.synthesis = window.speechSynthesis;
			
			// Load voices - some browsers need this
			if (this.synthesis.getVoices().length === 0) {
				this.synthesis.addEventListener('voiceschanged', () => {
					console.log('Voices loaded:', this.synthesis!.getVoices().length);
				});
			}
		} else {
			console.error('Text-to-Speech API not supported in this browser');
		}
	}

	private async waitForVoices(): Promise<void> {
		if (!this.synthesis) {
			return;
		}

		// If voices are already loaded, return immediately
		if (this.synthesis.getVoices().length > 0) {
			return;
		}

		// Wait for voices to load (with timeout)
		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				console.warn('Voice loading timeout - continuing anyway');
				resolve();
			}, 1000);

			this.synthesis!.addEventListener('voiceschanged', () => {
				clearTimeout(timeout);
				resolve();
			}, { once: true });

			// Trigger voice loading
			this.synthesis!.getVoices();
		});
	}

	async speak(text: string): Promise<void> {
		if (!this.synthesis) {
			console.error('Speech Synthesis not initialized');
			return;
		}

		if (this.isPlaying) {
			this.queue.push(text);
			return;
		}

		// Wait for voices to load
		await this.waitForVoices();

		return new Promise((resolve, reject) => {
			const utterance = new SpeechSynthesisUtterance(text);

			if (this.config.voice) {
				utterance.voice = this.config.voice;
			} else {
				const voices = this.synthesis!.getVoices();
				console.log('Available voices:', voices.length);
				
				const preferredVoice = voices.find(
					(voice) =>
						voice.lang.startsWith(this.config.lang || 'en') &&
						(voice.name.includes('Female') ||
							voice.name.includes('Samantha') ||
							voice.name.includes('Google'))
				);
				if (preferredVoice) {
					utterance.voice = preferredVoice;
					console.log('Using voice:', preferredVoice.name);
				} else if (voices.length > 0) {
					// Fallback to first available voice
					utterance.voice = voices[0];
					console.log('Using fallback voice:', voices[0].name);
				}
			}

			utterance.rate = this.config.rate ?? 1.0;
			utterance.pitch = this.config.pitch ?? 1.0;
			utterance.volume = this.config.volume ?? 1.0;
			utterance.lang = this.config.lang ?? 'en-US';

			utterance.onstart = () => {
				this.isPlaying = true;
				this.currentUtterance = utterance;
				console.log('TTS started speaking');
				this.callbacks.onStart?.();
			};

			utterance.onend = () => {
				this.isPlaying = false;
				this.currentUtterance = null;
				this.callbacks.onEnd?.();
				resolve();

				if (this.queue.length > 0) {
					const nextText = this.queue.shift();
					if (nextText) {
						this.speak(nextText);
					}
				}
			};

			utterance.onerror = (event) => {
				this.isPlaying = false;
				this.currentUtterance = null;
				console.error('TTS error:', event.error);
				const error = new Error(`Speech synthesis error: ${event.error}`);
				this.callbacks.onError?.(error);
				reject(error);
			};

			console.log('Speaking text:', text.substring(0, 50) + '...');
			this.synthesis!.speak(utterance);
		});
	}

	stop(): void {
		if (!this.synthesis) {
			return;
		}

		this.synthesis.cancel();
		this.isPlaying = false;
		this.currentUtterance = null;
		this.queue = [];
	}

	pause(): void {
		if (!this.synthesis) {
			return;
		}

		this.synthesis.pause();
	}

	resume(): void {
		if (!this.synthesis) {
			return;
		}

		this.synthesis.resume();
	}

	getVoices(): SpeechSynthesisVoice[] {
		if (!this.synthesis) {
			return [];
		}

		return this.synthesis.getVoices();
	}

	setVoice(voice: SpeechSynthesisVoice): void {
		this.config.voice = voice;
	}

	setRate(rate: number): void {
		this.config.rate = Math.max(0.1, Math.min(10, rate));
	}

	setPitch(pitch: number): void {
		this.config.pitch = Math.max(0, Math.min(2, pitch));
	}

	setVolume(volume: number): void {
		this.config.volume = Math.max(0, Math.min(1, volume));
	}

	updateCallbacks(callbacks: TextToSpeechCallbacks): void {
		this.callbacks = { ...this.callbacks, ...callbacks };
	}

	isSupported(): boolean {
		return typeof window !== 'undefined' && 'speechSynthesis' in window;
	}

	getIsPlaying(): boolean {
		return this.isPlaying;
	}

	clearQueue(): void {
		this.queue = [];
	}
}


interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

interface SpeechRecognitionResultList {
	length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	isFinal: boolean;
	length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	start(): void;
	stop(): void;
	abort(): void;
	onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
	onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
	onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
	interface Window {
		SpeechRecognition?: SpeechRecognitionConstructor;
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	}
}

export interface SpeechRecognitionConfig {
	language?: string;
	continuous?: boolean;
	interimResults?: boolean;
	maxAlternatives?: number;
}

export interface SpeechRecognitionCallbacks {
	onTranscript?: (transcript: string, isFinal: boolean) => void;
	onEnd?: () => void;
	onError?: (error: string) => void;
	onStart?: () => void;
}

export class SpeechRecognitionManager {
	private recognition: SpeechRecognitionInstance | null = null;
	private isActive = false;
	private retryCount = 0;
	private maxRetries = 3;
	private silenceTimeout: NodeJS.Timeout | null = null;
	private callbacks: SpeechRecognitionCallbacks = {};

	constructor(
		private config: SpeechRecognitionConfig = {},
		callbacks: SpeechRecognitionCallbacks = {}
	) {
		this.callbacks = callbacks;
		this.initialize();
	}

	private initialize(): void {
		const SpeechRecognitionAPI =
			typeof window !== 'undefined'
				? window.SpeechRecognition || window.webkitSpeechRecognition
				: null;

		if (!SpeechRecognitionAPI) {
			console.error('Speech Recognition API not supported in this browser');
			return;
		}

		this.recognition = new SpeechRecognitionAPI();
		this.recognition.continuous = this.config.continuous ?? true;
		this.recognition.interimResults = this.config.interimResults ?? true;
		this.recognition.lang = this.config.language ?? 'en-US';
		this.recognition.maxAlternatives = this.config.maxAlternatives ?? 1;

		this.recognition.onstart = () => {
			this.isActive = true;
			this.retryCount = 0;
			this.callbacks.onStart?.();
		};

		this.recognition.onresult = (event: SpeechRecognitionEvent) => {
			const results = event.results;
			const lastResult = results[results.length - 1];

			if (lastResult) {
				const transcript = lastResult[0]?.transcript || '';
				const isFinal = lastResult.isFinal;

				this.callbacks.onTranscript?.(transcript, isFinal);

				if (isFinal) {
					this.resetSilenceTimeout();
				}
			}
		};

		this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			if (event.error === 'no-speech') {
				return;
			}

			if (event.error === 'aborted') {
				return;
			}

			this.callbacks.onError?.(event.error);

			if (this.isActive && this.retryCount < this.maxRetries) {
				this.retryCount++;
				setTimeout(() => this.start(), 1000 * this.retryCount);
			}
		};

		this.recognition.onend = () => {
			if (this.isActive && this.retryCount < this.maxRetries) {
				setTimeout(() => {
					try {
						this.recognition?.start();
					} catch (e) {
						// Already started
					}
				}, 100);
			} else {
				this.isActive = false;
				this.callbacks.onEnd?.();
			}
		};
	}

	private resetSilenceTimeout(): void {
		if (this.silenceTimeout) {
			clearTimeout(this.silenceTimeout);
		}

		this.silenceTimeout = setTimeout(() => {
			// Silence detected - transcript is complete
		}, 2000);
	}

	start(): void {
		if (!this.recognition) {
			console.error('Speech Recognition not initialized');
			return;
		}

		if (this.isActive) {
			return;
		}

		try {
			this.isActive = true;
			this.retryCount = 0;
			this.recognition.start();
		} catch (error) {
			console.error('Error starting speech recognition:', error);
		}
	}

	stop(): void {
		if (!this.recognition) {
			return;
		}

		this.isActive = false;
		if (this.silenceTimeout) {
			clearTimeout(this.silenceTimeout);
		}

		try {
			this.recognition.stop();
		} catch (error) {
			console.error('Error stopping speech recognition:', error);
		}
	}

	abort(): void {
		if (!this.recognition) {
			return;
		}

		this.isActive = false;
		if (this.silenceTimeout) {
			clearTimeout(this.silenceTimeout);
		}

		try {
			this.recognition.abort();
		} catch (error) {
			console.error('Error aborting speech recognition:', error);
		}
	}

	updateCallbacks(callbacks: SpeechRecognitionCallbacks): void {
		this.callbacks = { ...this.callbacks, ...callbacks };
	}

	isSupported(): boolean {
		return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
	}

	getIsActive(): boolean {
		return this.isActive;
	}
}


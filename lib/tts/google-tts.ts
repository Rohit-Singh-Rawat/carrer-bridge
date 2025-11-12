// For now, using browser-based TTS as Google Cloud TTS requires additional setup
// To enable Google Cloud TTS:
// 1. Install: npm install @google-cloud/text-to-speech
// 2. Set up Google Cloud credentials
// 3. Uncomment the code below

export interface TTSOptions {
	text: string;
	languageCode?: string;
	voiceName?: string;
	ssmlGender?: 'NEUTRAL' | 'MALE' | 'FEMALE';
	audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
	speakingRate?: number; // 0.25 to 4.0
	pitch?: number; // -20.0 to 20.0
}

/**
 * Convert text to speech and return as buffer
 * Currently using a placeholder - will use Google Cloud TTS when configured
 */
export async function textToSpeechBuffer(options: TTSOptions): Promise<Buffer> {
	const { text } = options;

	// For now, throw error to fallback to browser TTS
	// When Google Cloud TTS is set up, uncomment the implementation below
	throw new Error(
		'Server-side TTS not configured. Using browser TTS fallback.'
	);

	/* 
	// Uncomment when Google Cloud credentials are set up:
	
	import { TextToSpeechClient } from '@google-cloud/text-to-speech';
	
	const ttsClient = new TextToSpeechClient({
		apiKey: process.env.GOOGLE_GEMINI_API_KEY,
	});

	const {
		text,
		languageCode = 'en-US',
		voiceName = 'en-US-Neural2-F',
		ssmlGender = 'FEMALE',
		audioEncoding = 'MP3',
		speakingRate = 1.0,
		pitch = 0.0,
	} = options;

	try {
		const [response] = await ttsClient.synthesizeSpeech({
			input: { text },
			voice: {
				languageCode,
				name: voiceName,
				ssmlGender,
			},
			audioConfig: {
				audioEncoding,
				speakingRate,
				pitch,
			},
		});

		if (!response.audioContent) {
			throw new Error('No audio content received from TTS');
		}

		return Buffer.from(response.audioContent as Uint8Array);
	} catch (error) {
		console.error('TTS synthesis error:', error);
		throw error;
	}
	*/
}

/**
 * Get available voices for a language
 */
export async function getAvailableVoices(languageCode: string = 'en-US') {
	// Placeholder - implement when Google Cloud TTS is configured
	return [];
}


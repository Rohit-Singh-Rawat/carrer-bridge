import { NextRequest, NextResponse } from 'next/server';
import { textToSpeechBuffer } from '@/lib/tts/google-tts';

/**
 * POST /api/v1/ai-speech
 *
 * Converts text to speech audio
 * Returns base64 encoded audio or error for browser TTS fallback
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { text, audioFormat = 'base64' } = body;

		if (!text) {
			return NextResponse.json({ error: 'Text is required' }, { status: 400 });
		}

		// Try to convert text to speech using server-side TTS
		try {
			const audioBuffer = await textToSpeechBuffer({
				text,
				languageCode: 'en-US',
				voiceName: 'en-US-Neural2-F',
				audioEncoding: 'MP3',
				speakingRate: 1.0,
			});

			// Return audio based on format
			if (audioFormat === 'base64') {
				return NextResponse.json({
					audio: audioBuffer.toString('base64'),
					audioFormat: 'mp3',
				});
			} else {
				// Return audio stream
				return new NextResponse(audioBuffer as unknown as BodyInit, {
					headers: {
						'Content-Type': 'audio/mpeg',
						'Content-Length': audioBuffer.length.toString(),
					},
				});
			}
		} catch (ttsError) {
			// Server-side TTS not configured, signal client to use browser TTS
			console.log('Server TTS not available, client will use browser TTS fallback');
			return NextResponse.json(
				{
					error: 'Server TTS not configured',
					fallbackToBrowser: true,
					text,
				},
				{ status: 503 }
			);
		}
	} catch (error) {
		console.error('AI speech generation error:', error);
		return NextResponse.json(
			{ error: 'Failed to generate speech', fallbackToBrowser: true },
			{ status: 500 }
		);
	}
}

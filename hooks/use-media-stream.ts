'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CameraDevice, MediaStreamError } from '@/types/interview';

export function useMediaStream() {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [devices, setDevices] = useState<CameraDevice[]>([]);
	const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
	const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
	const [error, setError] = useState<MediaStreamError | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const streamRef = useRef<MediaStream | null>(null);

	const enumerateDevices = useCallback(async () => {
		try {
			const deviceList = await navigator.mediaDevices.enumerateDevices();
			const videoDevices: CameraDevice[] = deviceList
				.filter((device) => device.kind === 'videoinput')
				.map((device) => ({
					deviceId: device.deviceId,
					label: device.label || `Camera ${device.deviceId.substring(0, 5)}`,
					kind: 'videoinput',
				}));

			const audioDevices: CameraDevice[] = deviceList
				.filter((device) => device.kind === 'audioinput')
				.map((device) => ({
					deviceId: device.deviceId,
					label: device.label || `Microphone ${device.deviceId.substring(0, 5)}`,
					kind: 'audioinput',
				}));

			setDevices([...videoDevices, ...audioDevices]);

			if (videoDevices.length > 0 && !selectedVideoDevice) {
				setSelectedVideoDevice(videoDevices[0].deviceId);
			}
			if (audioDevices.length > 0 && !selectedAudioDevice) {
				setSelectedAudioDevice(audioDevices[0].deviceId);
			}
		} catch (err) {
			console.error('Error enumerating devices:', err);
		}
	}, [selectedVideoDevice, selectedAudioDevice]);

	const requestStream = useCallback(
		async (videoDeviceId?: string, audioDeviceId?: string) => {
			setIsLoading(true);
			setError(null);

			try {
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop());
				}

				const constraints: MediaStreamConstraints = {
					video: {
						deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
						width: { ideal: 1280 },
						height: { ideal: 720 },
						facingMode: 'user',
					},
					audio: {
						deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
					},
				};

				const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
				streamRef.current = mediaStream;
				setStream(mediaStream);

				await enumerateDevices();
			} catch (err: any) {
				const error: MediaStreamError = {
					name: err.name || 'MediaStreamError',
					message: err.message || 'Failed to access camera/microphone',
					constraint: err.constraint,
				};
				setError(error);
				console.error('Error requesting media stream:', err);
			} finally {
				setIsLoading(false);
			}
		},
		[enumerateDevices]
	);

	const selectVideoDevice = useCallback(
		(deviceId: string) => {
			setSelectedVideoDevice(deviceId);
			requestStream(deviceId, selectedAudioDevice);
		},
		[selectedAudioDevice, requestStream]
	);

	const selectAudioDevice = useCallback(
		(deviceId: string) => {
			setSelectedAudioDevice(deviceId);
			requestStream(selectedVideoDevice, deviceId);
		},
		[selectedVideoDevice, requestStream]
	);

	const stopStream = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
			setStream(null);
		}
	}, []);

	useEffect(() => {
		return () => {
			stopStream();
		};
	}, [stopStream]);

	return {
		stream,
		devices,
		selectedVideoDevice,
		selectedAudioDevice,
		error,
		isLoading,
		requestStream,
		selectVideoDevice,
		selectAudioDevice,
		stopStream,
		enumerateDevices,
	};
}


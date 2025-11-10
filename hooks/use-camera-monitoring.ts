'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { captureVideoFrame, blobToBase64 } from '@/lib/utils/interview';
import { trpc } from '@/lib/trpc/client';

interface UseCameraMonitoringOptions {
	videoRef: React.RefObject<HTMLVideoElement>;
	interviewId: string | null;
	enabled: boolean;
	interval?: number;
}

export function useCameraMonitoring({
	videoRef,
	interviewId,
	enabled,
	interval = 10000,
}: UseCameraMonitoringOptions) {
	const [isMonitoring, setIsMonitoring] = useState(false);
	const [snapshotCount, setSnapshotCount] = useState(0);
	const [lastSnapshotTime, setLastSnapshotTime] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const uploadMutation = trpc.interview.uploadSnapshot.useMutation();

	const captureAndUpload = useCallback(async () => {
		if (!videoRef.current || !interviewId || !enabled) {
			return;
		}

		try {
			const blob = await captureVideoFrame(videoRef.current);
			const base64Data = await blobToBase64(blob);
			const timestamp = Date.now();

			await uploadMutation.mutateAsync({
				interviewId,
				imageData: base64Data,
				timestamp,
			});

			setSnapshotCount((prev) => prev + 1);
			setLastSnapshotTime(new Date(timestamp));
			setError(null);
		} catch (err) {
			console.error('Error capturing/uploading snapshot:', err);
			setError(err instanceof Error ? err.message : 'Failed to capture snapshot');
		}
	}, [videoRef, interviewId, enabled, uploadMutation]);

	const startMonitoring = useCallback(() => {
		if (intervalRef.current) {
			return;
		}

		setIsMonitoring(true);
		captureAndUpload();

		intervalRef.current = setInterval(() => {
			captureAndUpload();
		}, interval);
	}, [interval, captureAndUpload]);

	const stopMonitoring = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsMonitoring(false);
	}, []);

	useEffect(() => {
		if (enabled && interviewId) {
			startMonitoring();
		} else {
			stopMonitoring();
		}

		return () => {
			stopMonitoring();
		};
	}, [enabled, interviewId, startMonitoring, stopMonitoring]);

	return {
		isMonitoring,
		snapshotCount,
		lastSnapshotTime,
		error,
		startMonitoring,
		stopMonitoring,
		captureNow: captureAndUpload,
	};
}


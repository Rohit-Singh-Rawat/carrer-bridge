'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFullscreenLockOptions {
	enabled: boolean;
	onExit?: () => void;
	onWarning?: () => void;
	gracePeriodMs?: number;
}

export function useFullscreenLock({
	enabled,
	onExit,
	onWarning,
	gracePeriodMs = 3000,
}: UseFullscreenLockOptions) {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [exitCount, setExitCount] = useState(0);
	const [showWarning, setShowWarning] = useState(false);
	const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const exitDetectedRef = useRef(false);

	const enterFullscreen = useCallback(async () => {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();
				setIsFullscreen(true);
			}
		} catch (error) {
			console.error('Error entering fullscreen:', error);
		}
	}, []);

	const exitFullscreen = useCallback(async () => {
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
				setIsFullscreen(false);
			}
		} catch (error) {
			console.error('Error exiting fullscreen:', error);
		}
	}, []);

	const handleFullscreenChange = useCallback(() => {
		const isCurrentlyFullscreen = Boolean(document.fullscreenElement);
		setIsFullscreen(isCurrentlyFullscreen);

		if (!isCurrentlyFullscreen && enabled && !exitDetectedRef.current) {
			exitDetectedRef.current = true;
			setExitCount((prev) => prev + 1);
			setShowWarning(true);
			onWarning?.();

			if (warningTimeoutRef.current) {
				clearTimeout(warningTimeoutRef.current);
			}

			warningTimeoutRef.current = setTimeout(() => {
				setShowWarning(false);
				onExit?.();
			}, gracePeriodMs);
		} else if (isCurrentlyFullscreen) {
			exitDetectedRef.current = false;
			setShowWarning(false);
			if (warningTimeoutRef.current) {
				clearTimeout(warningTimeoutRef.current);
				warningTimeoutRef.current = null;
			}
		}
	}, [enabled, onExit, onWarning, gracePeriodMs]);

	const handleVisibilityChange = useCallback(() => {
		if (document.hidden && enabled) {
			console.warn('Tab visibility changed - user may have switched tabs');
		}
	}, [enabled]);

	const cancelWarning = useCallback(() => {
		if (warningTimeoutRef.current) {
			clearTimeout(warningTimeoutRef.current);
			warningTimeoutRef.current = null;
		}
		setShowWarning(false);
		enterFullscreen();
	}, [enterFullscreen]);

	useEffect(() => {
		if (enabled) {
			enterFullscreen();
		}

		return () => {
			if (warningTimeoutRef.current) {
				clearTimeout(warningTimeoutRef.current);
			}
		};
	}, [enabled, enterFullscreen]);

	useEffect(() => {
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [handleFullscreenChange, handleVisibilityChange]);

	return {
		isFullscreen,
		exitCount,
		showWarning,
		enterFullscreen,
		exitFullscreen,
		cancelWarning,
	};
}


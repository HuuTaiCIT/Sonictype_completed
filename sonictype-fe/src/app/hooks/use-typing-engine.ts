import { useState, useEffect, useCallback, useRef } from "react";

export interface TypingStats {
	wpm: number;
	accuracy: number;
	errors: number;
	correctChars: number;
	totalAttempts: number;
	timeElapsed: number;
}

export interface TypingEngineState {
	text: string;
	currentIndex: number;
	isStarted: boolean;
	isFinished: boolean;
	stats: TypingStats;
	hasError: boolean;

	// 👇 NEW
	windowStart: number;
	visibleText: string;
}

const WINDOW_SIZE = 80; // số ký tự hiển thị
const WINDOW_THRESHOLD = 20; // gần cuối thì chuyển đoạn

export function useTypingEngine(initialText: string) {
	const [state, setState] = useState<TypingEngineState>(() => ({
		text: initialText,
		currentIndex: 0,
		isStarted: false,
		isFinished: false,
		windowStart: 0,
		visibleText: initialText.slice(0, WINDOW_SIZE),
		stats: {
			wpm: 0,
			accuracy: 100,
			errors: 0,
			correctChars: 0,
			totalAttempts: 0,
			timeElapsed: 0,
		},
		hasError: false,
	}));

	const startTimeRef = useRef<number | null>(null);
	const timerRef = useRef<number | null>(null);
	const errorTimeoutRef = useRef<number | null>(null);

	// ---------------------------
	// CALCULATIONS
	// ---------------------------
	const calculateWPM = useCallback(
		(correctChars: number, timeInSeconds: number) => {
			if (timeInSeconds === 0) return 0;
			const timeInMinutes = timeInSeconds / 60;
			const words = correctChars / 5;
			return Math.round(words / timeInMinutes);
		},
		[]
	);

	const calculateAccuracy = useCallback((correct: number, total: number) => {
		if (total === 0) return 100;
		return Math.round((correct / total) * 100);
	}, []);

	// ---------------------------
	// TIMER
	// ---------------------------
	useEffect(() => {
		if (state.isStarted && !state.isFinished) {
			timerRef.current = window.setInterval(() => {
				setState((prev) => {
					if (!startTimeRef.current) return prev;

					const timeElapsed =
						(Date.now() - startTimeRef.current) / 1000;
					const wpm = calculateWPM(
						prev.stats.correctChars,
						timeElapsed
					);

					return {
						...prev,
						stats: {
							...prev.stats,
							timeElapsed,
							wpm,
						},
					};
				});
			}, 100);

			return () => {
				if (timerRef.current) clearInterval(timerRef.current);
			};
		}
	}, [state.isStarted, state.isFinished, calculateWPM]);

	// ---------------------------
	// MANUALLY START TIMER
	// ---------------------------
	const start = useCallback(() => {
		setState((prev) => {
			if (!prev.isStarted && !prev.isFinished) {
				startTimeRef.current = Date.now();
				return { ...prev, isStarted: true };
			}
			return prev;
		});
	}, []);

	// ---------------------------
	// HANDLE KEY PRESS
	// ---------------------------
	const handleKeyPress = useCallback(
		(key: string) => {
			setState((prev) => {
				if (prev.isFinished) return prev;

				if (!prev.isStarted) {
					startTimeRef.current = Date.now();
					return { ...prev, isStarted: true };
				}

				const expectedChar = prev.text[prev.currentIndex];
				const newTotalAttempts = prev.stats.totalAttempts + 1;

				if (key === expectedChar) {
					const newCorrectChars = prev.stats.correctChars + 1;
					const newIndex = prev.currentIndex + 1;
					const isFinished = newIndex >= prev.text.length;
					const newAccuracy = calculateAccuracy(
						newCorrectChars,
						newTotalAttempts
					);

					if (errorTimeoutRef.current) {
						clearTimeout(errorTimeoutRef.current);
					}

					// 👇 CHECK MOVE WINDOW
					let newWindowStart = prev.windowStart;
					const relativeIndex = newIndex - prev.windowStart;

					if (
						relativeIndex >= WINDOW_SIZE - WINDOW_THRESHOLD &&
						prev.windowStart + WINDOW_SIZE < prev.text.length
					) {
						newWindowStart += WINDOW_SIZE;
					}

					return {
						...prev,
						currentIndex: newIndex,
						isFinished,
						hasError: false,
						windowStart: newWindowStart,
						visibleText: prev.text.slice(
							newWindowStart,
							newWindowStart + WINDOW_SIZE
						),
						stats: {
							...prev.stats,
							correctChars: newCorrectChars,
							totalAttempts: newTotalAttempts,
							accuracy: newAccuracy,
						},
					};
				} else {
					const newErrors = prev.stats.errors + 1;
					const newAccuracy = calculateAccuracy(
						prev.stats.correctChars,
						newTotalAttempts
					);

					if (errorTimeoutRef.current)
						clearTimeout(errorTimeoutRef.current);

					errorTimeoutRef.current = window.setTimeout(() => {
						setState((s) => ({ ...s, hasError: false }));
					}, 200);

					return {
						...prev,
						hasError: true,
						stats: {
							...prev.stats,
							errors: newErrors,
							totalAttempts: newTotalAttempts,
							accuracy: newAccuracy,
						},
					};
				}
			});
		},
		[calculateAccuracy]
	);

	// ---------------------------
	// RESET
	// ---------------------------
	const reset = useCallback(
		(newText?: string) => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

			const text = newText || initialText;

			startTimeRef.current = null;

			setState({
				text,
				currentIndex: 0,
				isStarted: false,
				isFinished: false,
				windowStart: 0,
				visibleText: text.slice(0, WINDOW_SIZE),
				stats: {
					wpm: 0,
					accuracy: 100,
					errors: 0,
					correctChars: 0,
					totalAttempts: 0,
					timeElapsed: 0,
				},
				hasError: false,
			});
		},
		[initialText]
	);

	// ---------------------------
	// CLEANUP
	// ---------------------------
	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
		};
	}, []);

	return {
		state,
		handleKeyPress,
		reset,
		start,
	};
}

import { motion } from "motion/react";

interface TypingDisplayProps {
	text: string;
	currentIndex: number;
	hasError: boolean;
}

const FOCUS_WINDOW_SIZE = 150;
const LOOK_BEHIND_SIZE = 45;

export function TypingDisplay({
	text,
	currentIndex,
	hasError,
}: TypingDisplayProps) {
	const safeCurrentIndex = Math.min(Math.max(currentIndex, 0), text.length);
	const windowStart = Math.max(0, safeCurrentIndex - LOOK_BEHIND_SIZE);
	const windowEnd = Math.min(text.length, windowStart + FOCUS_WINDOW_SIZE);
	const visibleText = text.slice(windowStart, windowEnd);
	const showLeadingFade = windowStart > 0;
	const showTrailingFade = windowEnd < text.length;
	const progressPercent = text.length
		? Math.round((safeCurrentIndex / text.length) * 100)
		: 0;

	return (
		<motion.div
			className={`
        relative
        bg-[#14141f]
        border-2
        rounded-2xl
        p-6 md:p-10
        overflow-hidden
        transition-all duration-200
        ${
			hasError
				? "border-[#ff1744] shadow-lg shadow-[#ff1744]/50"
				: "border-[#ffd700]/30 shadow-lg shadow-[#ffd700]/10"
		}
      `}
			animate={hasError ? { x: [-6, 6, -4, 4, 0] } : {}}
			transition={{ duration: 0.25 }}
		>
			{hasError && (
				<motion.div
					className="absolute inset-0 bg-[#ff1744]/10 rounded-2xl pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				/>
			)}

			<div className="relative z-10 mb-6 flex items-center justify-between gap-4 text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
				<span>Focused typing window</span>
				<span className="text-[#00d9ff]">{progressPercent}%</span>
			</div>

			<div className="relative z-10 mb-6 h-2 overflow-hidden rounded-full bg-[#0a0a0f] border border-white/10">
				<motion.div
					className="h-full rounded-full bg-gradient-to-r from-[#ffd700] to-[#00d9ff]"
					initial={false}
					animate={{ width: `${progressPercent}%` }}
					transition={{ duration: 0.2, ease: "easeOut" }}
				/>
			</div>

			<div className="relative z-10">
				{showLeadingFade && (
					<div className="pointer-events-none absolute left-0 top-0 z-20 flex h-full w-16 items-center bg-gradient-to-r from-[#14141f] via-[#14141f]/90 to-transparent">
						<span className="text-2xl md:text-4xl font-mono text-gray-600">…</span>
					</div>
				)}

				{showTrailingFade && (
					<div className="pointer-events-none absolute right-0 top-0 z-20 flex h-full w-16 items-center justify-end bg-gradient-to-l from-[#14141f] via-[#14141f]/90 to-transparent">
						<span className="text-2xl md:text-4xl font-mono text-gray-600">…</span>
					</div>
				)}

				<div
					className="
            min-h-[8.5rem]
            max-h-[11rem]
            overflow-hidden
            rounded-xl
            bg-[#0a0a0f]/55
            border border-white/5
            px-5 py-6 md:px-8 md:py-8
            font-mono
            text-2xl md:text-4xl
            leading-relaxed
            select-none
            whitespace-pre-wrap
            break-words
          "
				>
					{visibleText.split("").map((char, visibleIndex) => {
						const absoluteIndex = windowStart + visibleIndex;
						let className = "text-gray-500 transition-colors duration-150";

						if (absoluteIndex < safeCurrentIndex) {
							className = "text-[#00ff00]";
						} else if (absoluteIndex === safeCurrentIndex) {
							className = `
              text-[#0a0a0f]
              bg-[#ffd700]
              px-1
              rounded
              shadow-lg
              shadow-[#ffd700]/30
            `;
						}

						return (
							<motion.span
								key={`${absoluteIndex}-${char}`}
								className={className}
								animate={
									absoluteIndex === safeCurrentIndex
										? { scale: [1, 1.15, 1] }
										: { scale: 1 }
								}
								transition={{ duration: 0.25 }}
							>
								{char === " " ? "\u00A0" : char}
							</motion.span>
						);
					})}
				</div>
			</div>
		</motion.div>
	);
}

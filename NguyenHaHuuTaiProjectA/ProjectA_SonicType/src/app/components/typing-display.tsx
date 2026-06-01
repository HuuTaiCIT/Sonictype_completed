import { motion } from "motion/react";

interface TypingDisplayProps {
	text: string;
	currentIndex: number; // index RELATIVE trong window
	hasError: boolean;
}

export function TypingDisplay({
	text,
	currentIndex,
	hasError,
}: TypingDisplayProps) {
	return (
		<motion.div
			className={`
        relative
        bg-[#14141f]
        border-2
        rounded-2xl
        p-8 md:p-12
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
			{/* Error overlay */}
			{hasError && (
				<motion.div
					className="absolute inset-0 bg-[#ff1744]/10 rounded-2xl pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				/>
			)}

			{/* TEXT */}
			<div
				className="
          font-mono
          text-2xl md:text-4xl
          leading-relaxed
          select-none
          whitespace-pre-wrap
          break-words
        "
			>
				{text.split("").map((char, index) => {
					let className =
						"text-gray-500 transition-colors duration-150";

					if (index < currentIndex) {
						// typed
						className = "text-[#00ff00]";
					} else if (index === currentIndex) {
						// current char
						className = `
              text-[#0a0a0f]
              bg-[#ffd700]
              px-1
              rounded
            `;
					}

					return (
						<motion.span
							key={index}
							className={className}
							animate={
								index === currentIndex
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
		</motion.div>
	);
}

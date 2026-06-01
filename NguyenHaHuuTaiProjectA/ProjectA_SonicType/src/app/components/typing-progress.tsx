import { motion } from "motion/react";
import { Flame } from "lucide-react";

interface TypingProgressProps {
  current: number;
  total: number;
}

export function TypingProgress({ current, total }: TypingProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="relative">
      {/* Label */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400 font-mono">
          Progress: {current} / {total}
        </span>
        <span className="text-sm font-bold text-[#ffd700]">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-4 bg-[#14141f] border border-[#ffd700]/30 rounded-full overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffd700] via-[#ff4500] to-[#ff0000] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </motion.div>

        {/* Racing car icon */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 z-10"
          initial={{ left: 0 }}
          animate={{ left: `${Math.max(0, percentage - 2)}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="relative">
            <Flame className="w-5 h-5 text-white drop-shadow-lg" />
            {/* Speed trail */}
            {percentage > 0 && (
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-gradient-to-l from-[#ffd700] to-transparent"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>

        {/* Finish line */}
        {percentage >= 98 && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-1 bg-white"
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        )}
      </div>

      {/* Speed lines */}
      {percentage > 10 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-[#ffd700]/50"
              style={{
                top: `${Math.random() * 100}%`,
                width: "30px",
              }}
              initial={{ left: "100%" }}
              animate={{ left: "-30px" }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

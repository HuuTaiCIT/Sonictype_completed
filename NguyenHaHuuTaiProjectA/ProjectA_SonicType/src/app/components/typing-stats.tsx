import { motion } from "motion/react";
import { Zap, Target, XCircle, Clock } from "lucide-react";
import { TypingStats } from "@/app/hooks/use-typing-engine";

interface TypingStatsProps {
  stats: TypingStats;
  isFinished: boolean;
}

export function TypingStatsDisplay({ stats, isFinished }: TypingStatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatBox
        icon={<Zap className="w-6 h-6 text-[#ffd700]" />}
        label="WPM"
        value={stats.wpm}
        color="text-[#ffd700]"
        highlight={isFinished}
      />
      <StatBox
        icon={<Target className="w-6 h-6 text-[#00d9ff]" />}
        label="Accuracy"
        value={`${stats.accuracy}%`}
        color="text-[#00d9ff]"
        highlight={isFinished}
      />
      <StatBox
        icon={<XCircle className="w-6 h-6 text-[#ff1744]" />}
        label="Errors"
        value={stats.errors}
        color="text-[#ff1744]"
        highlight={false}
      />
      <StatBox
        icon={<Clock className="w-6 h-6 text-[#ff4500]" />}
        label="Time"
        value={formatTime(stats.timeElapsed)}
        color="text-[#ff4500]"
        highlight={false}
      />
    </div>
  );
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  highlight: boolean;
}

function StatBox({ icon, label, value, color, highlight }: StatBoxProps) {
  return (
    <motion.div
      className={`bg-[#14141f] border rounded-xl p-4 transition-all duration-300 ${
        highlight
          ? "border-[#ffd700] shadow-lg shadow-[#ffd700]/30 scale-105"
          : "border-[#ffd700]/20 hover:border-[#ffd700]/40"
      }`}
      animate={highlight ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className={`text-2xl md:text-3xl font-black ${color}`}>
          {value}
        </span>
      </div>
      <p className="text-xs md:text-sm text-gray-400">{label}</p>
    </motion.div>
  );
}

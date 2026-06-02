import { motion } from "motion/react";
import { Trophy, Zap, Target, XCircle, Clock, RotateCcw, Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { TypingStats } from "@/app/hooks/use-typing-engine";

interface ResultScreenProps {
  stats: TypingStats;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export function ResultScreen({ stats, onRestart, onBackToMenu }: ResultScreenProps) {
  // Determine performance level
  const getPerformanceLevel = (wpm: number) => {
    if (wpm >= 80) return { level: "LEGENDARY", color: "#ffd700", emoji: "🏆" };
    if (wpm >= 60) return { level: "MASTER", color: "#00d9ff", emoji: "⚡" };
    if (wpm >= 40) return { level: "ADVANCED", color: "#ff4500", emoji: "🔥" };
    if (wpm >= 20) return { level: "INTERMEDIATE", color: "#00ff00", emoji: "✨" };
    return { level: "BEGINNER", color: "#888888", emoji: "💪" };
  };

  const performance = getPerformanceLevel(stats.wpm);

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Celebration header */}
      <div className="text-center mb-12">
        <motion.div
          className="text-8xl mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          {performance.emoji}
        </motion.div>
        
        <motion.h2
          className="text-5xl md:text-7xl font-black mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: performance.color }}
        >
          {performance.level}!
        </motion.h2>
        
        <motion.p
          className="text-xl text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          You've completed the race!
        </motion.p>
      </div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ResultStatCard
          icon={<Zap className="w-10 h-10 text-[#ffd700]" />}
          label="Words Per Minute"
          value={stats.wpm}
          highlight
          color="border-[#ffd700] shadow-[#ffd700]/30"
        />
        <ResultStatCard
          icon={<Target className="w-10 h-10 text-[#00d9ff]" />}
          label="Accuracy"
          value={`${stats.accuracy}%`}
          highlight={stats.accuracy >= 95}
          color="border-[#00d9ff] shadow-[#00d9ff]/30"
        />
        <ResultStatCard
          icon={<Clock className="w-10 h-10 text-[#ff4500]" />}
          label="Time Elapsed"
          value={`${stats.timeElapsed.toFixed(1)}s`}
          highlight={false}
          color="border-[#ff4500]/30"
        />
        <ResultStatCard
          icon={<XCircle className="w-10 h-10 text-[#ff1744]" />}
          label="Errors"
          value={stats.errors}
          highlight={stats.errors === 0}
          color={stats.errors === 0 ? "border-[#00ff00] shadow-[#00ff00]/30" : "border-[#ff1744]/30"}
        />
      </motion.div>

      {/* Performance breakdown */}
      <motion.div
        className="bg-[#14141f] border border-[#ffd700]/30 rounded-2xl p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Performance Breakdown</h3>
        
        <div className="space-y-4">
          <PerformanceBar
            label="Speed"
            percentage={Math.min((stats.wpm / 100) * 100, 100)}
            color="from-[#ffd700] to-[#ff4500]"
          />
          <PerformanceBar
            label="Accuracy"
            percentage={stats.accuracy}
            color="from-[#00d9ff] to-[#00ff00]"
          />
          <PerformanceBar
            label="Consistency"
            percentage={Math.max(100 - (stats.errors / stats.totalAttempts) * 100, 0)}
            color="from-[#ff4500] to-[#ff1744]"
          />
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col md:flex-row gap-4 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onRestart}
          className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-[#ffd700] to-[#ff4500] hover:from-[#ffed4e] hover:to-[#ff6347] text-black rounded-xl shadow-lg hover:shadow-[#ffd700]/30 transition-all duration-300 transform hover:scale-105"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Race Again
        </Button>
        <Button
          onClick={onBackToMenu}
          variant="outline"
          className="px-8 py-6 text-lg font-bold border-2 border-[#00d9ff] text-[#00d9ff] hover:bg-[#00d9ff]/10 rounded-xl transition-all duration-300"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Menu
        </Button>
      </motion.div>

      {/* Encouragement message */}
      <motion.div
        className="text-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-gray-500 text-sm">
          {stats.wpm >= 60 
            ? "🔥 Outstanding performance! You're a typing champion!"
            : stats.wpm >= 40
            ? "⚡ Great job! Keep practicing to reach master level!"
            : "💪 Good effort! Practice makes perfect!"}
        </p>
      </motion.div>
    </motion.div>
  );
}

interface ResultStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight: boolean;
  color: string;
}

function ResultStatCard({ icon, label, value, highlight, color }: ResultStatCardProps) {
  return (
    <motion.div
      className={`bg-[#14141f] border-2 rounded-xl p-6 ${highlight ? `shadow-lg ${color}` : `border-[#ffd700]/20 ${color}`}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-4 mb-3">
        {icon}
        <span className="text-4xl font-black text-white">{value}</span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </motion.div>
  );
}

interface PerformanceBarProps {
  label: string;
  percentage: number;
  color: string;
}

function PerformanceBar({ label, percentage, color }: PerformanceBarProps) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-bold text-white">{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 bg-[#1f1f2e] rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

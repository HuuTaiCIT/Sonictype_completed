import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, RotateCcw, Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useTypingEngine } from "@/app/hooks/use-typing-engine";
import { TypingDisplay } from "@/app/components/typing-display";
import { TypingStatsDisplay } from "@/app/components/typing-stats";
import { TypingProgress } from "@/app/components/typing-progress";
import { ResultScreen } from "@/app/components/result-screen";

interface SoloModeProps {
  onBack: () => void;
}

// Sample texts for typing practice
const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog with lightning speed and incredible precision.",
  "Racing through the digital highway, fingers flying across keys like thunder in a storm.",
  "Speed is not just about velocity, it's about precision, accuracy, and unwavering focus.",
  "Every keystroke brings you closer to mastery, every word typed builds your legacy.",
  "Champions are made through practice, dedication, and the relentless pursuit of excellence.",
];

export function SoloMode({ onBack }: SoloModeProps) {
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Lấy văn bản từ backend
  const fetchRandomText = async () => {
    setLoading(true);
    setCountdown(null);
    try {
      const res = await fetch("http://localhost:5000/api/texts/random");
      const data = await res.json();
      setSelectedText(data.text);
    } catch (err) {
      console.error(err);
      setSelectedText(SAMPLE_TEXTS[0]); // Fallback
    } finally {
      setLoading(false);
      setCountdown(5);
    }
  };

  useEffect(() => {
    fetchRandomText();
  }, []);
  
  const { state, handleKeyPress, reset } = useTypingEngine(selectedText);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const timer = setTimeout(() => setCountdown(null), 1000); // Show "GO!" for 1 second
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Khi selectedText thay đổi (sau khi load xong), reset lại engine
  useEffect(() => {
    if (selectedText) {
      reset(selectedText);
    }
  }, [selectedText, reset]);

  // Lưu điểm khi hoàn thành trận đua Solo
  useEffect(() => {
    if (state.isFinished) {
      const userStr = localStorage.getItem("sonictype_user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          fetch("http://localhost:5000/api/matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userObj.id,
              wpm: state.stats.wpm,
              accuracy: state.stats.accuracy,
              mode: "SOLO",
            }),
          }).catch((err) => console.error(err));
        } catch (e) {
          console.error("Lỗi phân tích JSON localStorage:", e);
        }
      }
    }
  }, [state.isFinished, state.stats.wpm, state.stats.accuracy]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (countdown !== null) return; // Block typing during countdown
      if (state.isFinished) return;
      if (e.key.length > 1 && e.key !== "Enter") return;
      if (e.key === " ") e.preventDefault();
      handleKeyPress(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, state.isFinished, countdown]);

  const handleRestart = () => {
    fetchRandomText();
  };

  const handleGiveUp = () => {
    if (window.confirm("Are you sure you want to give up? You will lose this race.")) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffd700] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d9ff] opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Speed lines - more intense when typing */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(state.isStarted ? 25 : 10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 200 + 100}px`,
            }}
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{
              duration: state.isStarted ? Math.random() * 1 + 0.5 : Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[#ffd700]/20 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-400 hover:text-[#ffd700]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Menu
          </Button>

          <h1 className="text-2xl md:text-3xl font-black">
            <span className="bg-gradient-to-r from-[#ffd700] to-[#00d9ff] bg-clip-text text-transparent">
              SOLO
            </span>
            <span className="text-white"> MODE</span>
          </h1>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRestart}
              variant="ghost"
              className="text-gray-400 hover:text-[#ffd700]"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Restart
            </Button>

            {!state.isFinished && countdown === null && (
              <Button
                onClick={handleGiveUp}
                variant="destructive"
                className="font-bold shadow-lg shadow-red-500/20 ml-2"
              >
                Give Up
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 py-8 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading race track...</p>
          </div>
        ) : countdown !== null ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-[#00d9ff]"
            >
              {countdown > 0 ? countdown : "GO!"}
            </motion.div>
            <p className="mt-12 text-2xl text-gray-400 font-bold animate-pulse">Get Ready...</p>
          </div>
        ) : !state.isFinished ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Stats */}
            <TypingStatsDisplay stats={state.stats} isFinished={false} />

            {/* Progress bar */}
            <TypingProgress current={state.currentIndex} total={state.text.length} />

            {/* Typing area */}
            <TypingDisplay
              text={state.text}
              currentIndex={state.currentIndex}
              hasError={state.hasError}
            />

            {/* Instructions */}
            {!state.isStarted && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xl text-gray-400 mb-2">
                  Start typing to begin the race!
                </p>
                <p className="text-sm text-gray-500">
                  ⚡ Type each character correctly to proceed • ❌ Wrong keys are blocked
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          <ResultScreen
            stats={state.stats}
            onRestart={handleRestart}
            onBackToMenu={onBack}
          />
        )}
      </div>
    </div>
  );
}

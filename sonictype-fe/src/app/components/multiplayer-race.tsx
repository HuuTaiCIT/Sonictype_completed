import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useTypingEngine } from "@/app/hooks/use-typing-engine";
import { TypingDisplay } from "@/app/components/typing-display";
import { TypingStatsDisplay } from "@/app/components/typing-stats";
import { TypingProgress } from "@/app/components/typing-progress";
import { ResultScreen } from "@/app/components/result-screen";
import { socket } from "@/app/lib/socket";
import type { RealRoom } from "./room-list";

interface MultiplayerRaceProps {
  room: RealRoom;
  username: string;
  initialText: string;
  onLeave: () => void;
}

export function MultiplayerRace({ room, username, initialText, onLeave }: MultiplayerRaceProps) {
  const { state, handleKeyPress, start } = useTypingEngine(initialText);
  const [countdown, setCountdown] = useState<number | null>(5);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Lắng nghe điểm từ server cho phòng
  useEffect(() => {
    const handleLeaderboard = (data: any[]) => {
      setLeaderboard(data.sort((a, b) => b.wpm - a.wpm));
    };
    socket.on("roomLeaderboard", handleLeaderboard);
    return () => {
      socket.off("roomLeaderboard", handleLeaderboard);
    };
  }, []);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
        start(); // Bắt đầu tính giờ ngay lập tức
      }, 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, start]);

  // Gửi điểm khi hoàn thành (cập nhật global + room)
  useEffect(() => {
    if (state.isFinished) {
      socket.emit("submitScore", {
        roomId: room.id,
        username,
        wpm: state.stats.wpm,
        accuracy: state.stats.accuracy,
      });

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
              mode: "RANKED",
            }),
          }).catch((err) => console.error(err));
        } catch (e) {
          console.error("Lỗi phân tích JSON localStorage:", e);
        }
      }
    }
  }, [state.isFinished, room.id, username, state.stats.wpm, state.stats.accuracy]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (countdown !== null) return;
      if (state.isFinished) return;
      if (e.key.length > 1 && e.key !== "Enter") return;
      if (e.key === " ") e.preventDefault();
      handleKeyPress(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, state.isFinished, countdown]);

  const handleGiveUp = () => {
    if (window.confirm("Are you sure you want to give up? You will leave the room.")) {
      onLeave();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffd700] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d9ff] opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Speed lines */}
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
            onClick={onLeave}
            variant="ghost"
            className="text-gray-400 hover:text-[#ffd700]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Leave Room
          </Button>

          <h1 className="text-2xl md:text-3xl font-black">
            <span className="bg-gradient-to-r from-[#ffd700] to-[#00d9ff] bg-clip-text text-transparent">
              ROOM: {room.name}
            </span>
          </h1>

          <div className="w-24">
            {!state.isFinished && countdown === null && (
              <Button
                onClick={handleGiveUp}
                variant="destructive"
                className="font-bold shadow-lg shadow-red-500/20"
              >
                Give Up
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 py-8 md:py-12">
        {countdown !== null ? (
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
            <TypingStatsDisplay stats={state.stats} isFinished={false} />
            <TypingProgress current={state.currentIndex} total={state.text.length} />
            <TypingDisplay
              text={state.text}
              currentIndex={state.currentIndex}
              hasError={state.hasError}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <ResultScreen
              stats={state.stats}
              onBackToMenu={onLeave}
            />
            {/* Room Leaderboard */}
            <div className="bg-[#14141f] border-2 border-[#ffd700]/30 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-center mb-6 text-white">Room Leaderboard</h2>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                      <span className="font-bold text-lg text-white">#{i+1} {p.username} {p.username === username ? "(You)" : ""}</span>
                      <div className="flex gap-4">
                        <span className="text-[#00d9ff]">{p.wpm} WPM</span>
                        <span className="text-[#00ff00]">{p.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400">Waiting for other players to finish...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

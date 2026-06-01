import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, Crown, Zap, Medal, RefreshCw, AlertCircle } from "lucide-react";

const BACKEND_URL = "http://localhost:5000";

interface LeaderboardProps {
  username: string;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  wpm: number;
  accuracy: number;
  mode: string;
  createdAt: string;
  user: {
    username: string;
  };
}

interface UserStats {
  bestWpm: number;
  accuracy: number;
  globalRank: number | string;
}

export function Leaderboard({ username }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Gọi API lấy top 10 bảng xếp hạng
      const lbRes = await fetch(`${BACKEND_URL}/api/matches/leaderboard`);
      if (!lbRes.ok) throw new Error("Không thể tải bảng xếp hạng.");
      const lbData: LeaderboardEntry[] = await lbRes.json();
      setLeaderboard(lbData);

      // Thử lấy thống kê cá nhân từ localStorage (userId được lưu lúc đăng nhập)
      const storedUser = localStorage.getItem("sonictype_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) {
          const statsRes = await fetch(
            `${BACKEND_URL}/api/users/${parsed.id}/stats`
          );
          if (statsRes.ok) {
            const statsData: UserStats = await statsRes.json();
            setUserStats(statsData);
          }
        }
      }
    } catch (err) {
      setError("Không thể kết nối đến server. Hãy chắc chắn backend đang chạy.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-[#ffd700]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#c0c0c0]" />;
      case 3:
        return <Medal className="w-6 h-6 text-[#cd7f32]" />;
      default:
        return <span className="text-gray-500 text-lg font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-[#ffd700] shadow-lg shadow-[#ffd700]/30 bg-gradient-to-r from-[#ffd700]/10 to-transparent";
      case 2:
        return "border-[#c0c0c0] shadow-lg shadow-[#c0c0c0]/20 bg-gradient-to-r from-[#c0c0c0]/10 to-transparent";
      case 3:
        return "border-[#cd7f32] shadow-lg shadow-[#cd7f32]/20 bg-gradient-to-r from-[#cd7f32]/10 to-transparent";
      default:
        return "border-[#ffd700]/20 hover:border-[#ffd700]/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-[#ffd700]" />
          <h2 className="text-4xl font-black text-white">
            GLOBAL LEADERBOARD
          </h2>
          <Trophy className="w-10 h-10 text-[#ffd700]" />
        </div>
        <p className="text-gray-400">
          Top racers from real database
        </p>
        {/* Nút refresh */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="mt-3 flex items-center gap-2 mx-auto text-xs text-gray-500 hover:text-[#ffd700] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="bg-[#14141f] border-2 border-[#ffd700]/10 rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-6 bg-gray-700 rounded" />
                  <div className="w-32 h-5 bg-gray-700 rounded" />
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-8 bg-gray-700 rounded" />
                  <div className="w-16 h-8 bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard table */}
      {!loading && !error && (
        <>
          {leaderboard.length === 0 ? (
            <motion.div
              className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-2">No data available</p>
              <p className="text-sm text-gray-500">
                Complete a race to get ranked!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const entryUsername = entry.user?.username ?? "Unknown";
                const isCurrentUser =
                  entryUsername.toLowerCase() === username.toLowerCase();

                return (
                  <motion.div
                    key={entry.id}
                    className={`bg-[#14141f] border-2 rounded-xl p-4 transition-all duration-300 ${getRankColor(rank)} ${isCurrentUser ? "ring-2 ring-[#00d9ff]/50" : ""}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      {/* Rank and user info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank icon */}
                        <div className="w-12 flex justify-center">
                          {getRankIcon(rank)}
                        </div>

                        {/* Username */}
                        <div className="flex-1">
                          <p className="text-lg font-bold text-white">
                            {entryUsername}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-[#ffd700] text-black px-2 py-1 rounded">
                                YOU
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {entry.mode ?? "SOLO"}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        {/* WPM */}
                        <div className="text-center">
                          <div className="flex items-center gap-1 mb-1">
                            <Zap className="w-4 h-4 text-[#ffd700]" />
                            <span className="text-2xl font-black text-[#ffd700]">
                              {entry.wpm}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">WPM</p>
                        </div>

                        {/* Accuracy */}
                        <div className="text-center">
                          <span className="text-2xl font-black text-[#00d9ff]">
                            {entry.accuracy}%
                          </span>
                          <p className="text-xs text-gray-500">Accuracy</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* User's rank */}
          <motion.div
            className="bg-[#14141f] border-2 border-[#00d9ff] rounded-xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-center">
              <p className="text-gray-400 mb-2">Your Current Rank</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl font-black text-[#00d9ff]">
                  {userStats ? `#${userStats.globalRank}` : "#--"}
                </span>
                <div className="text-left">
                  <p className="text-xl font-bold text-white">{username}</p>
                  {userStats && userStats.bestWpm > 0 ? (
                    <p className="text-sm text-gray-500">
                      Best: {userStats.bestWpm} WPM • {userStats.accuracy}% accuracy
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Complete a race to get ranked!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Info banner */}
      <motion.div
        className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-sm text-gray-400">
          🏆 Real data from database • 📊 Ranked by highest WPM • 🔄 Click "Refresh" to update
        </p>
      </motion.div>
    </div>
  );
}

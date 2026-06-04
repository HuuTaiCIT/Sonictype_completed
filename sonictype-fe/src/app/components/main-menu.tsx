import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Zap, Trophy, Target, User, LogOut, Crown, Flame, History, X, Calendar, Activity } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface MainMenuProps {
  username: string;
  onSelectMode: (mode: "solo" | "rank") => void;
  onLogout: () => void;
}

export function MainMenu({ username, onSelectMode, onLogout }: MainMenuProps) {
  const [stats, setStats] = useState({
    bestWpm: 0,
    accuracy: 0,
    globalRank: "--" as string | number,
    averageWpm: 0,
    history: [] as any[]
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedUser = localStorage.getItem("sonictype_user");
        if (!storedUser) return;
        const userObj = JSON.parse(storedUser);
        const res = await fetch(`http://localhost:5000/api/users/${userObj.id}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            bestWpm: data.bestWpm || 0,
            accuracy: data.accuracy || 0,
            globalRank: data.globalRank || "--",
            averageWpm: data.averageWpm || 0,
            history: data.history || []
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffd700] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d9ff] opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Speed lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 150}px`,
            }}
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{
              duration: Math.random() * 3 + 2,
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-[#ffd700] to-[#00d9ff] bg-clip-text text-transparent">
                SONIC
              </span>
              <span className="text-white">TYPE</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="flex items-center gap-3 bg-[#14141f] border border-[#ffd700]/30 rounded-lg px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd700] to-[#00d9ff] flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Racer</p>
                <p className="font-bold text-white">{username}</p>
              </div>
            </div>

            {/* Logout button */}
            <Button
              onClick={onLogout}
              variant="ghost"
              className="text-gray-400 hover:text-[#ff1744] hover:bg-[#14141f]"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-black text-white mb-4">
            CHOOSE YOUR MODE
          </h2>
          <p className="text-xl text-gray-400">
            Select a mode to start your racing journey
          </p>
        </motion.div>

        {/* Mode selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Solo Mode */}
          <ModeCard
            icon={<Target className="w-16 h-16 text-[#ffd700]" />}
            title="SOLO MODE"
            subtitle="Practice & Improve"
            description="Perfect your typing skills in a solo environment. Track your WPM, accuracy, and progress without pressure."
            features={[
              "Real-time WPM tracking",
              "Accuracy statistics"
            ]}
            buttonText="START PRACTICE"
            buttonGradient="from-[#ffd700] to-[#ff4500]"
            onClick={() => onSelectMode("solo")}
            delay={0.3}
          />

          {/* Rank Mode */}
          <ModeCard
            icon={<Trophy className="w-16 h-16 text-[#00d9ff]" />}
            title="RANK MODE"
            subtitle="Compete & Climb"
            description="Challenge other racers and climb the global leaderboard. Join rooms or compete for the top spot."
            features={[
              "Global leaderboard",
              "Room-based matches",
              "Live competition"
            ]}
            buttonText="ENTER COMPETITION"
            buttonGradient="from-[#00d9ff] to-[#ffd700]"
            onClick={() => onSelectMode("rank")}
            delay={0.5}
          />
        </div>

        {/* Stats overview */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={<Flame className="w-8 h-8 text-[#ff4500]" />}
              label="Best WPM"
              value={stats.bestWpm.toString()}
              color="text-[#ff4500]"
            />
            <StatCard
              icon={<Activity className="w-8 h-8 text-[#00ff00]" />}
              label="Average WPM"
              value={stats.averageWpm.toString()}
              color="text-[#00ff00]"
            />
            <StatCard
              icon={<Target className="w-8 h-8 text-[#ffd700]" />}
              label="Accuracy"
              value={`${stats.accuracy}%`}
              color="text-[#ffd700]"
            />
            <StatCard
              icon={<Crown className="w-8 h-8 text-[#00d9ff]" />}
              label="Global Rank"
              value={stats.globalRank.toString()}
              color="text-[#00d9ff]"
            />
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => setIsHistoryOpen(true)}
              variant="outline"
              className="border-[#00d9ff]/30 text-[#00d9ff] hover:bg-[#00d9ff]/10 bg-transparent h-12 px-8 font-bold text-lg"
            >
              <History className="w-5 h-5 mr-2" />
              VIEW MATCH HISTORY
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Match History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#14141f] border border-[#00d9ff]/30 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl shadow-[#00d9ff]/20"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <History className="w-6 h-6 text-[#00d9ff]" />
                MATCH HISTORY
              </h2>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {stats.history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No matches played yet. Start racing to build your history!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.history.map((match: any) => (
                    <div 
                      key={match.id} 
                      className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-[#00d9ff]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${match.mode === 'RANKED' ? 'bg-[#ffd700]/10 text-[#ffd700]' : 'bg-[#00d9ff]/10 text-[#00d9ff]'}`}>
                          {match.mode === 'RANKED' ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-bold text-white mb-1 flex items-center gap-2">
                            {match.mode === 'RANKED' ? 'Ranked Match' : 'Solo Practice'}
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400 font-normal">
                              {new Date(match.playedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(match.playedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 w-full sm:w-auto justify-around sm:justify-end">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Speed</p>
                          <p className="text-xl font-black text-white">{match.wpm} <span className="text-xs font-normal text-gray-400">WPM</span></p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Accuracy</p>
                          <p className="text-xl font-bold text-[#ffd700]">{match.accuracy}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonGradient: string;
  onClick: () => void;
  delay: number;
}

function ModeCard({
  icon,
  title,
  subtitle,
  description,
  features,
  buttonText,
  buttonGradient,
  onClick,
  delay
}: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/20 to-[#00d9ff]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative bg-[#14141f] border-2 border-[#ffd700]/30 rounded-2xl p-8 hover:border-[#ffd700]/60 transition-all duration-300 h-full flex flex-col">
        {/* Icon */}
        <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-3xl font-black text-white mb-1">{title}</h3>
          <p className="text-sm text-[#ffd700] font-semibold">{subtitle}</p>
        </div>

        {/* Description */}
        <p className="text-gray-400 mb-6 leading-relaxed">{description}</p>

        {/* Features */}
        <ul className="space-y-2 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-gray-300">
              <Zap className="w-4 h-4 text-[#ffd700] flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Button */}
        <Button
          onClick={onClick}
          className={`w-full h-14 font-bold bg-gradient-to-r ${buttonGradient} hover:shadow-lg hover:shadow-[#ffd700]/30 text-black rounded-lg transition-all duration-300 transform hover:scale-[1.02]`}
        >
          <Zap className="w-5 h-5 mr-2" />
          {buttonText}
        </Button>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-6 hover:border-[#ffd700]/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        {icon}
        <span className={`text-3xl font-black ${color}`}>{value}</span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

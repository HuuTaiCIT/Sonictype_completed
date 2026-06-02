import { motion } from "motion/react";
import { Zap, Flame, Trophy, Target } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffd700] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d9ff] opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#ff4500] opacity-5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Speed lines effect */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
            }}
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          className="text-center max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo / Title */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-7xl md:text-9xl font-black mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#ffd700] via-[#00d9ff] to-[#ff4500] bg-clip-text text-transparent animate-pulse">
                SONIC
              </span>
              <span className="text-white">TYPE</span>
            </h1>
            <div className="flex items-center justify-center gap-3 text-xl md:text-2xl text-[#00d9ff]">
              <Zap className="w-6 h-6 animate-pulse" />
              <span className="font-mono">RACE • TYPE • DOMINATE</span>
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Master your typing speed in the ultimate racing experience. 
            <span className="text-[#ffd700] font-semibold"> Type faster</span>, 
            <span className="text-[#00d9ff] font-semibold"> compete harder</span>, 
            <span className="text-[#ff4500] font-semibold"> become legendary</span>.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-20"
          >
            <Button
              onClick={onGetStarted}
              className="relative group px-12 py-8 text-2xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff4500] hover:from-[#ffed4e] hover:to-[#ff6347] text-black rounded-xl shadow-2xl hover:shadow-[#ffd700]/50 transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-8 h-8" />
                START RACING
                <Flame className="w-8 h-8" />
              </span>
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
            </Button>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Zap className="w-12 h-12 text-[#ffd700]" />}
              title="Lightning Speed"
              description="Track your WPM in real-time with precision timing"
              delay={0.7}
            />
            <FeatureCard
              icon={<Trophy className="w-12 h-12 text-[#00d9ff]" />}
              title="Compete & Rank"
              description="Challenge yourself and climb the global leaderboard"
              delay={0.8}
            />
            <FeatureCard
              icon={<Target className="w-12 h-12 text-[#ff4500]" />}
              title="Perfect Accuracy"
              description="No skipping - every character must be typed correctly"
              delay={0.9}
            />
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent"></div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative group"
    >
      <div className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-6 hover:border-[#ffd700]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#ffd700]/10">
        <div className="mb-4 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
}

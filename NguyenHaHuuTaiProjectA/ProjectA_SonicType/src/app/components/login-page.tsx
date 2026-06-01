import { useState } from "react";
import { motion } from "motion/react";
import { Zap, User, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

const BACKEND_URL = "http://localhost:5000";

interface LoginPageProps {
  onLogin: (username: string) => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignup
        ? `${BACKEND_URL}/api/auth/register`
        : `${BACKEND_URL}/api/auth/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }

      // Lưu thông tin user vào localStorage để các component khác dùng
      if (data.user) {
        localStorage.setItem("sonictype_user", JSON.stringify(data.user));
        localStorage.setItem("sonictype_token", data.token || "");
      } else if (isSignup) {
        // Sau khi đăng ký thành công, tự động đăng nhập
        const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const loginData = await loginRes.json();
        if (loginData.user) {
          localStorage.setItem("sonictype_user", JSON.stringify(loginData.user));
          localStorage.setItem("sonictype_token", loginData.token || "");
        }
      }

      onLogin(username.trim());
    } catch {
      setError("Không thể kết nối server. Hãy chắc chắn backend đang chạy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ffd700] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d9ff] opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Speed lines effect */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 200 + 100}px`,
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

      {/* Back button */}
      <Button
        onClick={onBack}
        variant="ghost"
        className="absolute top-8 left-8 text-gray-400 hover:text-[#ffd700] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </Button>

      {/* Login form */}
      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-6xl font-black mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-[#ffd700] to-[#00d9ff] bg-clip-text text-transparent">
              SONIC
            </span>
            <span className="text-white">TYPE</span>
          </motion.h1>
          <motion.div
            className="flex items-center justify-center gap-2 text-[#00d9ff]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Zap className="w-5 h-5" />
            <span className="font-mono text-sm">ENTER THE RACE</span>
          </motion.div>
        </div>

        {/* Form card */}
        <motion.div
          className="bg-[#14141f] border border-[#ffd700]/30 rounded-2xl p-8 shadow-2xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4 text-[#ffd700]" />
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-[#1f1f2e] border-[#ffd700]/20 focus:border-[#ffd700] text-white placeholder:text-gray-500 h-12 rounded-lg font-mono"
                required
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#00d9ff]" />
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-[#1f1f2e] border-[#00d9ff]/20 focus:border-[#00d9ff] text-white placeholder:text-gray-500 h-12 rounded-lg font-mono"
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#ffd700] to-[#00d9ff] hover:from-[#ffed4e] hover:to-[#4de8ff] text-black rounded-lg shadow-lg hover:shadow-[#ffd700]/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5 mr-2" />
              {loading ? "Processing..." : isSignup ? "CREATE ACCOUNT" : "START RACING"}
            </Button>
          </form>

          {/* Toggle signup/login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(null); }}
              className="text-sm text-gray-400 hover:text-[#ffd700] transition-colors"
            >
              {isSignup ? (
                <>Already have an account? <span className="text-[#ffd700] font-semibold">Login</span></>
              ) : (
                <>Don't have an account? <span className="text-[#00d9ff] font-semibold">Sign up</span></>
              )}
            </button>
          </div>

          {/* Info text */}
          <div className="mt-6 pt-6 border-t border-[#ffd700]/10">
            <p className="text-xs text-gray-500 text-center">
              🔒 Connected directly to real database
            </p>
          </div>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          className="text-center text-gray-500 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Join thousands of racers improving their typing speed
        </motion.p>
      </motion.div>
    </div>
  );
}

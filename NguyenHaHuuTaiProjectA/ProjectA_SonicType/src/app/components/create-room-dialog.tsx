import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Lock, Unlock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { socket } from "@/app/lib/socket";

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export function CreateRoomDialog({
  open,
  onClose,
  username,
}: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  const handleCreate = () => {
    if (!roomName.trim()) return;

    // Đảm bảo socket đã kết nối trước khi tạo phòng
    if (!socket.connected) {
      socket.connect();
    }

    // Emit sự kiện tạo phòng thật đến server
    socket.emit("createRoom", {
      name: roomName.trim(),
      host: username,
      maxPlayers,
      isPrivate,
    });

    // Đóng dialog và reset form
    onClose();
    setRoomName("");
    setMaxPlayers(4);
    setIsPrivate(false);
    setPassword("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            <motion.div
              className="bg-[#14141f] border-2 border-[#ffd700]/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">CREATE ROOM</h2>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Room name */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Room Name</Label>
                  <Input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Enter room name"
                    className="bg-[#1f1f2e] border-[#ffd700]/20 focus:border-[#ffd700] text-white placeholder:text-gray-500 h-12 rounded-lg"
                  />
                </div>

                {/* Max players */}
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00d9ff]" />
                    Max Players
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 6, 8].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMaxPlayers(num)}
                        className={`h-12 rounded-lg font-bold transition-all duration-200 ${
                          maxPlayers === num
                            ? "bg-gradient-to-r from-[#ffd700] to-[#00d9ff] text-black"
                            : "bg-[#1f1f2e] border border-[#ffd700]/20 text-gray-400 hover:border-[#ffd700]/50"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy toggle */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Room Privacy</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsPrivate(false)}
                      className={`h-12 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        !isPrivate
                          ? "bg-gradient-to-r from-[#00d9ff] to-[#00ff00] text-black"
                          : "bg-[#1f1f2e] border border-[#ffd700]/20 text-gray-400 hover:border-[#ffd700]/50"
                      }`}
                    >
                      <Unlock className="w-4 h-4" />
                      Public
                    </button>
                    <button
                      onClick={() => setIsPrivate(true)}
                      className={`h-12 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        isPrivate
                          ? "bg-gradient-to-r from-[#ff4500] to-[#ff1744] text-white"
                          : "bg-[#1f1f2e] border border-[#ffd700]/20 text-gray-400 hover:border-[#ffd700]/50"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Private
                    </button>
                  </div>
                </div>

                {/* Password (only if private) */}
                {isPrivate && (
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#ff1744]" />
                      Room Password
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="bg-[#1f1f2e] border-[#ff1744]/20 focus:border-[#ff1744] text-white placeholder:text-gray-500 h-12 rounded-lg"
                    />
                  </motion.div>
                )}

                {/* Create button */}
                <Button
                  onClick={handleCreate}
                  disabled={
                    !roomName.trim() || (isPrivate && !password.trim())
                  }
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#ffd700] to-[#00d9ff] hover:from-[#ffed4e] hover:to-[#4de8ff] text-black rounded-lg shadow-lg hover:shadow-[#ffd700]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Room
                </Button>
              </div>

              {/* Info */}
              <div className="mt-6 pt-6 border-t border-[#ffd700]/10">
                <p className="text-xs text-gray-500 text-center">
                  Bạn sẽ là host • Bắt đầu đua khi tất cả đã sẵn sàng
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

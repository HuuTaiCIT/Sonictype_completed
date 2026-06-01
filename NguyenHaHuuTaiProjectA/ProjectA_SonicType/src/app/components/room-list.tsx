import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Lock, Unlock, Play, Clock, WifiOff } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { RoomWaitingScreen } from "@/app/components/room-waiting-screen";
import { socket } from "@/app/lib/socket";

interface RoomListProps {
  username: string;
}

// Interface Room khớp với dữ liệu thật từ server (players là mảng string)
export interface RealRoom {
  id: string;
  name: string;
  host: string;
  hostSocketId: string;
  players: string[];         // Mảng username thật
  readyPlayers: string[];
  finishedPlayers: any[];
  maxPlayers: number;
  isPrivate: boolean;
  status: "waiting" | "in-progress" | "finished";
}

export function RoomList({ username }: RoomListProps) {
  const [rooms, setRooms] = useState<RealRoom[]>([]);
  const [joinedRoom, setJoinedRoom] = useState<RealRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Kết nối socket khi vào trang này
    socket.connect();
    setIsConnected(socket.connected);

    // --- Lắng nghe sự kiện từ Server ---
    const handleConnect = () => {
      setIsConnected(true);
      // Hỏi lại danh sách phòng ngay khi kết nối thành công
      socket.emit("requestRooms");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Server phát danh sách phòng (cả khi join và khi có thay đổi)
    const handleUpdateRooms = (updatedRooms: RealRoom[]) => {
      setRooms(updatedRooms);
    };

    // Khi tham gia phòng thành công
    const handleRoomJoined = (room: RealRoom) => {
      setJoinedRoom(room);
    };

    // Khi tạo phòng thành công
    const handleRoomCreated = (room: RealRoom) => {
      setJoinedRoom(room);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("updateRooms", handleUpdateRooms);
    socket.on("roomJoined", handleRoomJoined);
    socket.on("roomCreated", handleRoomCreated);

    // Yêu cầu danh sách phòng ngay
    if (socket.connected) {
      socket.emit("requestRooms");
    }

    return () => {
      // Dọn dẹp event listeners khi thoát trang
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("updateRooms", handleUpdateRooms);
      socket.off("roomJoined", handleRoomJoined);
      socket.off("roomCreated", handleRoomCreated);
    };
  }, []);

  // Cập nhật joinedRoom khi danh sách phòng thay đổi (để data luôn mới nhất)
  useEffect(() => {
    if (joinedRoom) {
      const updatedRoom = rooms.find((r) => r.id === joinedRoom.id);
      if (updatedRoom) {
        setJoinedRoom(updatedRoom);
      } else {
        // Phòng bị giải tán
        setJoinedRoom(null);
      }
    }
  }, [rooms]);

  const handleJoinRoom = (room: RealRoom) => {
    if (
      room.status === "waiting" &&
      room.players.length < room.maxPlayers &&
      !room.players.includes(username)
    ) {
      socket.emit("joinRoom", { roomId: room.id, username });
    }
  };

  const handleLeaveRoom = () => {
    if (joinedRoom) {
      socket.emit("leaveRoom", { roomId: joinedRoom.id, username });
      setJoinedRoom(null);
    }
  };

  if (joinedRoom) {
    return (
      <RoomWaitingScreen
        room={joinedRoom}
        username={username}
        onLeave={handleLeaveRoom}
        allRooms={rooms}
      />
    );
  }

  const getStatusBadge = (status: RealRoom["status"]) => {
    switch (status) {
      case "waiting":
        return (
          <span className="flex items-center gap-1 text-xs bg-[#00ff00]/20 text-[#00ff00] px-2 py-1 rounded">
            <Clock className="w-3 h-3" />
            Waiting
          </span>
        );
      case "in-progress":
        return (
          <span className="flex items-center gap-1 text-xs bg-[#ff4500]/20 text-[#ff4500] px-2 py-1 rounded">
            <Play className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-black text-white mb-2">
          AVAILABLE ROOMS
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-[#00ff00] animate-pulse"
                : "bg-[#ff4500] animate-pulse"
            }`}
          />
          <p className="text-gray-400 text-sm">
            {isConnected
              ? `Real-time connected • ${rooms.length} room(s)`
              : "Connecting to server..."}
          </p>
        </div>
      </motion.div>

      {/* Connection error */}
      {!isConnected && (
        <motion.div
          className="bg-orange-900/20 border border-orange-500/40 rounded-xl p-4 flex items-center gap-3 text-orange-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Cannot connect to server. Make sure the backend is running at{" "}
            <code className="text-orange-300">http://localhost:5000</code>
          </p>
        </motion.div>
      )}

      {/* Room list */}
      <div className="space-y-3">
        {rooms.map((room, index) => {
          const isFull = room.players.length >= room.maxPlayers;
          const isInProgress = room.status === "in-progress";
          const alreadyJoined = room.players.includes(username);
          const canJoin = !isFull && !isInProgress && !alreadyJoined;

          return (
            <motion.div
              key={room.id}
              className="bg-[#14141f] border-2 border-[#ffd700]/20 rounded-xl p-5 hover:border-[#ffd700]/50 transition-all duration-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                {/* Room info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Privacy icon */}
                    {room.isPrivate ? (
                      <Lock className="w-5 h-5 text-[#ff4500]" />
                    ) : (
                      <Unlock className="w-5 h-5 text-[#00d9ff]" />
                    )}

                    {/* Room name */}
                    <h3 className="text-xl font-bold text-white">{room.name}</h3>

                    {/* Status badge */}
                    {getStatusBadge(room.status)}

                    {/* Already joined badge */}
                    {alreadyJoined && (
                      <span className="text-xs bg-[#ffd700]/20 text-[#ffd700] px-2 py-1 rounded">
                        You are here
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>
                      Host:{" "}
                      <span className="text-[#ffd700]">{room.host}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {room.players.length}/{room.maxPlayers} Players
                    </span>
                    {room.readyPlayers.length > 0 && (
                      <span className="text-[#00ff00]">
                        {room.readyPlayers.length} ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Join button */}
                <div>
                  {alreadyJoined ? (
                    <Button
                      onClick={() => setJoinedRoom(room)}
                      className="bg-[#00d9ff]/20 border border-[#00d9ff] text-[#00d9ff] font-bold px-6 hover:bg-[#00d9ff]/30"
                    >
                      Enter Room
                    </Button>
                  ) : canJoin ? (
                    <Button
                      onClick={() => handleJoinRoom(room)}
                      className="bg-gradient-to-r from-[#ffd700] to-[#00d9ff] hover:from-[#ffed4e] hover:to-[#4de8ff] text-black font-bold px-6 shadow-lg hover:shadow-[#ffd700]/30"
                    >
                      Join Room
                    </Button>
                  ) : isInProgress ? (
                    <Button
                      disabled
                      variant="outline"
                      className="border-[#ff4500]/50 text-[#ff4500] cursor-not-allowed"
                    >
                      In Progress
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="border-gray-600 text-gray-600 cursor-not-allowed"
                    >
                      Full
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state if no rooms */}
      {isConnected && rooms.length === 0 && (
        <motion.div
          className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-2">No rooms available</p>
          <p className="text-sm text-gray-500">
            Create a new room to get started!
          </p>
        </motion.div>
      )}

      {/* Info banner */}
      <motion.div
        className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-gray-400">
          🔓 Public rooms • 🔒 Private rooms • ⚡ Real-time updates via Socket.IO
        </p>
      </motion.div>
    </div>
  );
}

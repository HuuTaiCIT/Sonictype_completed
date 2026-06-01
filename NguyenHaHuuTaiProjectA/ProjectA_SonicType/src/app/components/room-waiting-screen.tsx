import { motion } from "motion/react";
import { Users, Crown, ArrowLeft, Play, Copy, Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useState, useEffect } from "react";
import { socket } from "@/app/lib/socket";
import type { RealRoom } from "@/app/components/room-list";
import { MultiplayerRace } from "./multiplayer-race";

interface RoomWaitingScreenProps {
  room: RealRoom;
  username: string;
  onLeave: () => void;
  allRooms: RealRoom[];
}

export function RoomWaitingScreen({
  room,
  username,
  onLeave,
  allRooms,
}: RoomWaitingScreenProps) {
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRacing, setIsRacing] = useState(false);
  const [raceText, setRaceText] = useState("");

  // Tìm room mới nhất từ danh sách allRooms (để data luôn live)
  const liveRoom = allRooms.find((r) => r.id === room.id) ?? room;

  useEffect(() => {
    const handleRaceStarted = (text: string) => {
      setRaceText(text);
      setIsRacing(true);
    };

    socket.on("raceStarted", handleRaceStarted);
    return () => {
      socket.off("raceStarted", handleRaceStarted);
    };
  }, []);

  const readyPlayers = liveRoom.readyPlayers ?? [];

  // Cập nhật trạng thái sẵn sàng khi room thay đổi (ví dụ server override)
  useEffect(() => {
    const serverSaysReady = readyPlayers.includes(username);
    if (serverSaysReady !== isReady) {
      setIsReady(serverSaysReady);
    }
  }, [readyPlayers, username, isReady]);

  if (isRacing) {
    return (
      <MultiplayerRace
        room={liveRoom}
        username={username}
        initialText={raceText}
        onLeave={() => {
          setIsRacing(false);
          onLeave();
        }}
      />
    );
  }

  const isHost = liveRoom.host === username;
  const roomCode = `SONIC-${liveRoom.id.toUpperCase()}`;

  // Tất cả player (trừ host) đã sẵn sàng chưa?
  const nonHostPlayers = liveRoom.players.filter((p) => p !== liveRoom.host);
  const allNonHostReady =
    nonHostPlayers.length > 0 &&
    nonHostPlayers.every((p) => readyPlayers.includes(p));

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    const newReady = !isReady;
    setIsReady(newReady);
    socket.emit("toggleReady", {
      roomId: liveRoom.id,
      username,
      isReady: newReady,
    });
  };

  const handleStartRace = () => {
    socket.emit("startRace", { roomId: liveRoom.id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={onLeave}
          variant="ghost"
          className="text-gray-400 hover:text-[#ff1744]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Leave Room
        </Button>

        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-1">
            {liveRoom.name}
          </h2>
          <p className="text-sm text-gray-400">
            {liveRoom.status === "waiting"
              ? "Waiting for players..."
              : "Race in progress!"}
          </p>
        </div>

        <div className="w-32"></div>
      </div>

      {/* Room code */}
      {liveRoom.isPrivate && (
        <motion.div
          className="bg-[#14141f] border border-[#ffd700]/30 rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-gray-400 mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <code className="text-2xl font-mono font-black text-[#ffd700] bg-[#1f1f2e] px-6 py-2 rounded-lg">
              {roomCode}
            </code>
            <Button
              onClick={handleCopyRoomCode}
              variant="outline"
              size="sm"
              className="border-[#ffd700]/30 hover:border-[#ffd700]"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#00ff00]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Players grid - hiển thị danh sách player THẬT từ server */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveRoom.players.map((playerName, index) => {
          const playerIsHost = playerName === liveRoom.host;
          const playerIsReady =
            playerIsHost || readyPlayers.includes(playerName);
          const isCurrentUser = playerName === username;

          return (
            <motion.div
              key={playerName}
              className={`bg-[#14141f] border-2 rounded-xl p-6 transition-all duration-300 ${
                playerIsReady
                  ? "border-[#00ff00] shadow-lg shadow-[#00ff00]/20"
                  : "border-[#ffd700]/20"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      playerIsReady
                        ? "bg-gradient-to-br from-[#00ff00] to-[#00d9ff]"
                        : "bg-gradient-to-br from-[#ffd700] to-[#ff4500]"
                    }`}
                  >
                    <Users className="w-6 h-6 text-black" />
                  </div>

                  {/* Username */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">
                        {playerName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-[#ffd700] text-black px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </p>
                      {playerIsHost && (
                        <Crown
                          className="w-4 h-4 text-[#ffd700]"
                          title="Host"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {playerIsHost ? "Room Host" : "Player"}
                    </p>
                  </div>
                </div>

                {/* Ready status */}
                <div>
                  {playerIsReady ? (
                    <span className="bg-[#00ff00]/20 text-[#00ff00] text-xs font-bold px-3 py-1 rounded-full">
                      READY
                    </span>
                  ) : (
                    <span className="bg-gray-700/50 text-gray-400 text-xs font-bold px-3 py-1 rounded-full">
                      WAITING
                    </span>
                  )}
                </div>
              </div>

              {/* Ready button cho người chơi hiện tại (không phải host) */}
              {isCurrentUser && !playerIsHost && (
                <Button
                  onClick={handleToggleReady}
                  className={`w-full ${
                    isReady
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gradient-to-r from-[#ffd700] to-[#00d9ff] hover:from-[#ffed4e] hover:to-[#4de8ff] text-black"
                  } font-bold`}
                >
                  {isReady ? "Cancel Ready" : "Ready"}
                </Button>
              )}

              {/* Start button cho host */}
              {isCurrentUser && playerIsHost && (
                <Button
                  onClick={handleStartRace}
                  disabled={!allNonHostReady || nonHostPlayers.length === 0}
                  className={`w-full font-bold ${
                    allNonHostReady && nonHostPlayers.length > 0
                      ? "bg-gradient-to-r from-[#00ff00] to-[#00d9ff] hover:from-[#00ff00] hover:to-[#4de8ff] text-black"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {nonHostPlayers.length === 0
                    ? "Waiting for players..."
                    : allNonHostReady
                      ? "START RACE!"
                      : "Waiting for everyone to be ready..."}
                </Button>
              )}
            </motion.div>
          );
        })}

        {/* Empty slots */}
        {[...Array(liveRoom.maxPlayers - liveRoom.players.length)].map(
          (_, index) => (
            <motion.div
              key={`empty-${index}`}
              className="bg-[#14141f] border-2 border-dashed border-[#ffd700]/20 rounded-xl p-6 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (liveRoom.players.length + index) * 0.1 }}
            >
              <div className="text-center text-gray-600">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Waiting for player...</p>
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* Info banner */}
      <motion.div
        className="bg-[#14141f] border border-[#ffd700]/20 rounded-xl p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ffd700]" />
              {liveRoom.players.length}/{liveRoom.maxPlayers} Players
            </span>
            <span className="flex items-center gap-2">
              {allNonHostReady && nonHostPlayers.length > 0 ? (
                <>
                  <div className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse"></div>
                  Everyone is ready!
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-[#ff4500] rounded-full animate-pulse"></div>
                  Waiting for players to ready up
                </>
              )}
            </span>
          </div>

          {isHost && (
            <p className="text-xs text-gray-500">
              You are the host • Start when everyone is ready
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

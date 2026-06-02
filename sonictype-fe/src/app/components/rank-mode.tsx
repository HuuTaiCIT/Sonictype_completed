import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Users, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Leaderboard } from "@/app/components/leaderboard";
import { RoomList } from "@/app/components/room-list";
import { CreateRoomDialog } from "@/app/components/create-room-dialog";

interface RankModeProps {
  username: string;
  onBack: () => void;
}

export function RankMode({ username, onBack }: RankModeProps) {
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffd700] opacity-10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d9ff] opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Speed lines */}
      <div className="absolute inset-0 opacity-15">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent"
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
              RANK
            </span>
            <span className="text-white"> MODE</span>
          </h1>

          <div className="w-32"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 py-8 md:py-12">
        <Tabs defaultValue="leaderboard" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#14141f] border border-[#ffd700]/30 p-1">
            <TabsTrigger 
              value="leaderboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ffd700] data-[state=active]:to-[#ff4500] data-[state=active]:text-black"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Global Leaderboard
            </TabsTrigger>
            <TabsTrigger 
              value="rooms"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d9ff] data-[state=active]:to-[#ffd700] data-[state=active]:text-black"
            >
              <Users className="w-5 h-5 mr-2" />
              Multiplayer Rooms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Leaderboard username={username} />
          </TabsContent>

          <TabsContent value="rooms">
            <div className="space-y-6">
              {/* Create room button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowCreateRoom(true)}
                  className="bg-gradient-to-r from-[#ffd700] to-[#00d9ff] hover:from-[#ffed4e] hover:to-[#4de8ff] text-black font-bold shadow-lg hover:shadow-[#ffd700]/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
              </div>

              {/* Room list */}
              <RoomList username={username} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create room dialog */}
      <CreateRoomDialog
        open={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        username={username}
      />
    </div>
  );
}

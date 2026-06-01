import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import express from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import pg from "pg";
import { Server } from "socket.io";

// Kho bài báo ngẫu nhiên cho Multiplayer
const NEWS_ARTICLES = [
	"Speed is not just about velocity, it's about precision, accuracy, and unwavering focus. The greatest typists treat their keyboard like a musical instrument.",
	"The rapid development of artificial intelligence is reshaping industries across the globe. Experts predict that AI will create new job opportunities while automating repetitive tasks.",
	"Global markets rallied today following positive economic data. Investors are optimistic about the upcoming quarter, expecting strong earnings reports from tech giants.",
	"Space exploration took a giant leap forward as the new rover successfully landed on Mars. Scientists are eager to analyze the soil samples for signs of ancient life.",
	"The history of the modern computer keyboard begins with the invention of the typewriter. Christopher Latham Sholes patented the QWERTY layout in 1868, a design that was originally created to prevent mechanical jams by separating commonly used letter pairs. Today, despite the absence of mechanical arms, QWERTY remains the global standard for typing.",
	"In a stunning comeback, the underdog team managed to secure a victory in the final minutes of the championship match. Fans erupted in cheers as the winning goal was scored, cementing this game as one of the most memorable in the history of the sport."
];

// 1. Khởi tạo các công cụ
dotenv.config();
const app = express();

// Khởi tạo HTTP Server bọc lấy Express
const httpServer = createServer(app);

// Khởi tạo trạm phát sóng Socket.io
const io = new Server(httpServer, {
	cors: {
		origin: "*", // Cho phép mọi Frontend kết nối vào
		methods: ["GET", "POST"],
	},
});

// --- BỘ NHỚ LƯU TRỮ PHÒNG CHƠI ---
// Tạm thời lưu danh sách phòng trong RAM của Server
let activeRooms: any[] = [];

// Lắng nghe các kết nối Real-time
io.on("connection", (socket) => {
	console.log(`🔌 Một tay đua vừa kết nối WebSockets: ${socket.id}`);

	// 1. Vừa vào sảnh là gửi ngay danh sách phòng hiện có
	socket.emit("updateRooms", activeRooms);

	// 1.5. Nhận yêu cầu "chủ động hỏi lại" danh sách từ Frontend
	socket.on("requestRooms", () => {
		socket.emit("updateRooms", activeRooms);
	});

	// 2. Nhận yêu cầu TẠO PHÒNG từ Frontend
	socket.on("createRoom", (roomData) => {
		const newRoom = {
			id: Math.random().toString(36).substring(2, 9),
			name: roomData.name,
			host: roomData.host,
			hostSocketId: socket.id,
			players: [roomData.host],
			readyPlayers: [],
			finishedPlayers: [],
			maxPlayers: roomData.maxPlayers || 4,
			isPrivate: roomData.isPrivate || false,
			status: "waiting",
		};

		activeRooms.push(newRoom);
		socket.join(newRoom.id);

		console.log(
			`🏠 Phòng mới được tạo: ${newRoom.name} bởi ${newRoom.host}`,
		);

		io.emit("updateRooms", activeRooms);
		socket.emit("roomCreated", newRoom);
	});

	// 3. Nhận yêu cầu THAM GIA PHÒNG từ Frontend
	socket.on("joinRoom", ({ roomId, username }) => {
		const roomIndex = activeRooms.findIndex((r) => r.id === roomId);

		if (roomIndex !== -1) {
			const room = activeRooms[roomIndex];

			if (
				room.players.length < room.maxPlayers &&
				room.status === "waiting" &&
				!room.players.includes(username)
			) {
				room.players.push(username);
				socket.join(roomId);

				console.log(`👤 ${username} đã tham gia phòng: ${room.name}`);

				io.emit("updateRooms", activeRooms);
				socket.emit("roomJoined", room);
			}
		}
	});

	// 3.5. Nhận tín hiệu BẤM SẴN SÀNG từ người chơi
	socket.on("toggleReady", ({ roomId, username, isReady }) => {
		const room = activeRooms.find((r) => r.id === roomId);
		if (room) {
			if (!room.readyPlayers) room.readyPlayers = [];

			if (isReady && !room.readyPlayers.includes(username)) {
				room.readyPlayers.push(username);
			} else if (!isReady) {
				room.readyPlayers = room.readyPlayers.filter(
					(p: string) => p !== username,
				);
			}

			console.log(
				`✅ ${username} đã ${isReady ? "SẴN SÀNG" : "HỦY SẴN SÀNG"} trong phòng ${room.name}`,
			);
			io.emit("updateRooms", activeRooms);
		}
	});

	// 4. RÚT LUI KHỎI PHÒNG (BẤM NÚT LEAVE ROOM)
	socket.on("leaveRoom", ({ roomId, username }) => {
		const roomIndex = activeRooms.findIndex((r) => r.id === roomId);
		if (roomIndex !== -1) {
			const room = activeRooms[roomIndex];

			if (room.host === username) {
				activeRooms = activeRooms.filter((r) => r.id !== roomId);
				console.log(
					`💥 Chủ phòng ${username} đã thoát, giải tán phòng ${room.name}`,
				);
			} else {
				room.players = room.players.filter(
					(p: string) => p !== username,
				);
				if (room.readyPlayers) {
					room.readyPlayers = room.readyPlayers.filter(
						(p: string) => p !== username,
					);
				}
				console.log(`🚪 ${username} đã rời phòng ${room.name}`);
			}

			io.emit("updateRooms", activeRooms);
		}
	});

	// 6. PHÁT LỆNH BẮT ĐẦU VÀ CHỌN BÀI BÁO
	socket.on("startRace", async ({ roomId }) => {
		const roomIndex = activeRooms.findIndex((r) => r.id === roomId);
		if (roomIndex !== -1) {
			activeRooms[roomIndex].status = "in-progress";

			// Bốc ngẫu nhiên 1 bài báo từ DB
			try {
				const texts = await prisma.raceText.findMany();
				const randomTextObj = texts[Math.floor(Math.random() * texts.length)];
				const randomText = randomTextObj ? randomTextObj.content : NEWS_ARTICLES[0];

				console.log(`🚀 Bắt đầu đua phòng ${activeRooms[roomIndex].name}!`);
				io.to(roomId).emit("raceStarted", randomText);
			} catch (error) {
				console.error("Lỗi lấy văn bản từ DB, dùng mặc định:", error);
				const randomText = NEWS_ARTICLES[Math.floor(Math.random() * NEWS_ARTICLES.length)];
				io.to(roomId).emit("raceStarted", randomText);
			}

			io.emit("updateRooms", activeRooms);
		}
	});

	// 7. NHẬN ĐIỂM KHI CÓ NGƯỜI GÕ XONG (Đã thêm chống lưu trùng lặp điểm)
	socket.on("submitScore", ({ roomId, username, wpm, accuracy }) => {
		const room = activeRooms.find((r) => r.id === roomId);
		if (room) {
			if (!room.finishedPlayers) room.finishedPlayers = [];

			// Chỉ thêm nếu người này chưa có trong danh sách
			const hasSubmitted = room.finishedPlayers.find(
				(p: any) => p.username === username,
			);
			if (!hasSubmitted) {
				room.finishedPlayers.push({ username, wpm, accuracy });
			}

			io.to(roomId).emit("roomLeaderboard", room.finishedPlayers);
		}
	});

	// 5. KHI TẮT TRÌNH DUYỆT (DISCONNECT)
	socket.on("disconnect", () => {
		console.log(`❌ Tay đua đã ngắt kết nối: ${socket.id}`);

		const initialRoomsCount = activeRooms.length;
		activeRooms = activeRooms.filter(
			(room) => room.hostSocketId !== socket.id,
		);

		if (activeRooms.length !== initialRoomsCount) {
			console.log("🧹 Đã dọn dẹp phòng của người chơi vừa thoát.");
			io.emit("updateRooms", activeRooms);
		}
	});
});

// 1.5 Cấu hình Đầu chuyển đổi PostgreSQL cho Prisma 7
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Auto-seed Database on Startup
const initDB = async () => {
	try {
		const count = await prisma.raceText.count();
		if (count === 0) {
			console.log("🌱 Bắt đầu seed dữ liệu RaceText...");
			await prisma.raceText.createMany({
				data: NEWS_ARTICLES.map(content => ({ content }))
			});
			console.log("✅ Đã seed dữ liệu RaceText thành công!");
		}

		// Seed Admin Account (Upsert để ép password = admin và role = ADMIN)
		console.log("👑 Cập nhật tài khoản admin/admin...");
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash("admin", saltRounds);
		await prisma.user.upsert({
			where: { username: "admin" },
			update: { passwordHash: hashedPassword, role: "ADMIN" },
			create: { username: "admin", passwordHash: hashedPassword, role: "ADMIN" },
		});
		console.log("✅ Đã tạo/cập nhật tài khoản admin thành công!");
	} catch (error) {
		console.error("Lỗi auto-seed:", error);
	}
};
initDB();

const PORT = process.env.PORT || 5001;

// 2. Cài đặt Middleware
app.use(cors());
app.use(express.json());

// 3. API test
app.get("/", (req: Request, res: Response) => {
	res.send(
		"Welcome to the SonicType Backend! The server is running smoothly 🚀",
	);
});

app.get("/api/users", async (req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany();
		res.json(users);
	} catch (error) {
		res.status(500).json({ error: "Error fetching data from Database" });
	}
});

// 1. API Đăng ký
app.post("/api/auth/register", async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		const existingUser = await prisma.user.findUnique({
			where: { username },
		});

		if (existingUser) {
			res.status(400).json({ error: "Username already exists!" });
			return;
		}

		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const newUser = await prisma.user.create({
			data: { username: username, passwordHash: hashedPassword },
		});

		res.status(201).json({
			message: "Account created successfully! 🎉",
			userId: newUser.id,
		});
	} catch (error) {
		res.status(500).json({ error: "Server error during registration." });
	}
});

// 2. API Đăng nhập
app.post("/api/auth/login", async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		const user = await prisma.user.findUnique({ where: { username } });

		if (!user) {
			res.status(400).json({ error: "Invalid username or password!" });
			return;
		}

		const isPasswordValid = await bcrypt.compare(
			password,
			user.passwordHash,
		);
		if (!isPasswordValid) {
			res.status(400).json({ error: "Invalid username or password!" });
			return;
		}

		const secretKey = process.env.JWT_SECRET || "fallback_secret";
		const token = jwt.sign(
			{ userId: user.id, role: user.role },
			secretKey,
			{ expiresIn: "24h" },
		);

		res.status(200).json({
			message: "Login successful! 🚀",
			token: token,
			user: { id: user.id, username: user.username, role: user.role },
		});
	} catch (error) {
		res.status(500).json({ error: "Server error during login." });
	}
});

// API Lưu điểm
app.post("/api/matches", async (req: Request, res: Response) => {
	try {
		const { userId, wpm, accuracy, mode } = req.body;
		const newMatch = await prisma.matchHistory.create({
			data: {
				userId: userId,
				wpm: wpm,
				accuracy: accuracy,
				mode: mode || "SOLO",
			},
		});

		res.status(201).json({
			message: "Score saved successfully! 🏆",
			match: newMatch,
		});
	} catch (error) {
		res.status(400).json({
			error: "Error saving score. Please check your data!",
		});
	}
});

// API Bảng xếp hạng
app.get("/api/matches/leaderboard", async (req: Request, res: Response) => {
	try {
		const topMatches = await prisma.matchHistory.findMany({
			orderBy: { wpm: "desc" },
			take: 10,
			include: { user: { select: { username: true } } },
		});
		res.status(200).json(topMatches);
	} catch (error) {
		res.status(500).json({ error: "Error fetching Leaderboard." });
	}
});

// API Lấy thống kê cá nhân và Thứ hạng của một User cụ thể
app.get("/api/users/:userId/stats", async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId; // 👈 ĐÃ XÓA parseInt()

		if (!userId) {
			res.status(400).json({ error: "Missing user ID" });
			return;
		}

		// 1. Lấy trận đấu có WPM cao nhất của user này
		const bestMatch = await prisma.matchHistory.findFirst({
			where: { userId: userId },
			orderBy: { wpm: "desc" },
		});

		if (!bestMatch) {
			res.json({ bestWpm: 0, accuracy: 0, globalRank: "--" });
			return;
		}

		// 2. Lấy điểm cao nhất của TẤT CẢ mọi người để xếp hạng
		const allUsersBest = await prisma.matchHistory.groupBy({
			by: ["userId"],
			_max: { wpm: true },
		});

		// Sắp xếp danh sách từ cao xuống thấp
		const sortedRankings = allUsersBest.sort(
			(a, b) => (b._max.wpm || 0) - (a._max.wpm || 0),
		);

		const rankIndex = sortedRankings.findIndex((r) => r.userId === userId);
		const globalRank = rankIndex !== -1 ? rankIndex + 1 : "--";

		res.json({
			bestWpm: bestMatch.wpm,
			accuracy: bestMatch.accuracy,
			globalRank: globalRank,
		});
	} catch (error) {
		console.error(error); // 👈 Báo log cụ thể ở server nếu bị lỗi 500
		res.status(500).json({ error: "Error fetching personal statistics." });
	}
});

// API Lấy văn bản ngẫu nhiên
app.get("/api/texts/random", async (req: Request, res: Response) => {
	try {
		const texts = await prisma.raceText.findMany();
		const randomTextObj = texts[Math.floor(Math.random() * texts.length)];
		const randomText = randomTextObj ? randomTextObj.content : NEWS_ARTICLES[0];
		res.json({ text: randomText });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error fetching random text" });
	}
});

// ==========================================
// 🛡️ KHU VỰC API ĐẶC QUYỀN CỦA ADMIN
// ==========================================

// 1. API Lấy toàn cảnh hệ thống (Tổng User, Số phòng, User mới nhất)
app.get("/api/admin/stats", async (req: Request, res: Response) => {
	try {
		const totalUsers = await prisma.user.count();
		const activeRoomsCount = activeRooms.length;
		const serverLoad = Math.floor(Math.random() * 15 + 5) + "%"; // Giả lập CPU load từ 5% - 20%

		// Lấy danh sách 10 user mới đăng ký nhất
		const recentUsersDb = await prisma.user.findMany({
			take: 10,
			orderBy: { id: "desc" },
		});

		// Đi tìm điểm Best WPM cho từng người và kiểm tra xem họ có đang trong phòng (Online) không
		const recentUsers = await Promise.all(
			recentUsersDb.map(async (u) => {
				const best = await prisma.matchHistory.findFirst({
					where: { userId: u.id },
					orderBy: { wpm: "desc" },
				});

				// Trạng thái Online: Tên người này có đang nằm trong bất kỳ activeRooms nào không?
				const isOnline = activeRooms.some((room: any) =>
					room.players.includes(u.username),
				);

				return {
					username: u.username,
					role: u.role,
					bestWpm: best ? best.wpm : 0,
					status: isOnline ? "ONLINE" : "OFFLINE",
				};
			}),
		);

		res.json({
			totalUsers,
			activeRoomsCount,
			serverLoad,
			recentUsers,
		});
	} catch (error) {
		console.error("Admin Stats Error:", error);
		res.status(500).json({ error: "Admin server error" });
	}
});

// 2. API Xóa tài khoản (Trảm User)
app.delete(
	"/api/admin/users/:username",
	async (req: Request, res: Response) => {
		try {
			const username = req.params.username;
			const user = await prisma.user.findUnique({ where: { username } });

			if (user) {
				// Phải xóa lịch sử đấu của họ trước (chống lỗi Foreign Key), sau đó mới xóa acc
				await prisma.matchHistory.deleteMany({
					where: { userId: user.id },
				});
				await prisma.user.delete({ where: { username } });
			}
			res.json({ message: "User deleted successfully!" });
		} catch (error) {
			console.error("Delete User Error:", error);
			res.status(500).json({ error: "Could not delete this user." });
		}
	},
);

// 3. API Nâng quyền tài khoản lên ADMIN
app.put(
	"/api/admin/users/:username/role",
	async (req: Request, res: Response) => {
		try {
			const username = req.params.username;
			await prisma.user.update({
				where: { username },
				data: { role: "ADMIN" },
			});
			res.json({ message: "User promoted to ADMIN successfully!" });
		} catch (error) {
			console.error("Promote User Error:", error);
			res.status(500).json({ error: "Could not promote this user." });
		}
	},
);

// 5. Bật Server
httpServer.listen(PORT, () => {
	console.log(`✅ Server SonicType đang chạy tại http://localhost:${PORT}`);
	console.log(`⚡ Trạm phát sóng Real-time đã mở!`);
});

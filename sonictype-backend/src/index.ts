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
	"The rapid evolution of artificial intelligence is fundamentally transforming how we interact with technology on a daily basis. From sophisticated natural language processing algorithms to advanced computer vision systems, machine learning models are becoming increasingly integrated into our digital infrastructure. This technological renaissance is not merely about automation; it represents a paradigm shift in human-computer collaboration. As we continue to push the boundaries of what is computationally possible, ethical considerations regarding data privacy and algorithmic bias must remain at the forefront of our developmental discourse. Developers and researchers are working tirelessly to ensure that these powerful tools are accessible, transparent, and beneficial to society as a whole, paving the way for a more connected and intelligent future where technology serves as an empowering extension of human capability.",
	"The exploration of deep space continues to captivate the imagination of scientists and astronomers around the world. Recent advancements in telescope technology have allowed us to observe distant galaxies with unprecedented clarity, revealing breathtaking cosmic phenomena that challenge our understanding of the universe. From massive black holes devouring entire star systems to the delicate dance of binary planets, the cosmos is a testament to the infinite possibilities of nature. As international space agencies collaborate on ambitious missions to establish permanent outposts on the moon and eventually send human explorers to Mars, we are entering a new era of interstellar discovery. This collective endeavor expands our scientific knowledge and unites humanity in a shared quest to uncover the profound mysteries hidden within the vast expanse of the cosmos.",
	"The preservation of ancient historical artifacts is crucial for understanding the complex tapestry of human civilization. Throughout history, diverse cultures have left behind remarkable architectural wonders, intricate tools, and captivating artistic expressions that provide invaluable insights into their daily lives and spiritual beliefs. Archaeologists and historians painstakingly excavate these remnants, employing cutting-edge techniques to analyze and date each discovery with remarkable precision. By studying these ancient relics, we can trace the evolutionary trajectory of societal development and appreciate the ingenuity of our ancestors. Furthermore, the meticulous documentation of cultural heritage serves as a powerful reminder of our shared origins, fostering a sense of global unity and mutual respect among different populations as we navigate the intricate challenges of the modern interconnected world.",
	"Advancements in modern medical science have significantly improved global life expectancy and overall quality of health. Researchers are constantly developing innovative treatments and targeted therapies that combat previously incurable diseases with remarkable efficacy. The integration of biotechnology and personalized medicine allows healthcare professionals to tailor interventions specifically to an individual's unique genetic makeup, maximizing therapeutic outcomes while minimizing adverse side effects. Additionally, the proliferation of wearable health monitoring devices empowers individuals to take proactive control of their well-being by tracking vital signs and physical activity in real-time. As we continue to unravel the complexities of the human body, the collaborative efforts of the global scientific community promise to eradicate pervasive health threats and usher in an unprecedented era of human vitality and longevity.",
	"The philosophical exploration of human consciousness remains one of the most profound and perplexing mysteries in both science and humanities. For centuries, brilliant thinkers have debated the intricate relationship between the physical brain and our subjective experience of reality. While neuroscientists can map complex neural pathways and identify specific brain regions responsible for various cognitive functions, the qualitative essence of feeling and perception continues to elude empirical measurement. This fascinating dichotomy challenges us to reconsider the fundamental nature of existence and our place within the universe. Engaging in mindful introspection allows individuals to cultivate a deeper awareness of their internal landscape, fostering emotional resilience and psychological well-being as they navigate the chaotic demands of contemporary society with grace and clarity."
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
		socket.data.username = roomData.host;
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
		socket.data.username = username;
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
		const username = socket.data.username;

		if (username) {
			let roomUpdated = false;

			activeRooms.forEach((room) => {
				if (room.players.includes(username)) {
					room.players = room.players.filter((p: string) => p !== username);
					if (room.readyPlayers) {
						room.readyPlayers = room.readyPlayers.filter((p: string) => p !== username);
					}

					if (room.players.length === 0) {
						(room as any).toBeDeleted = true;
					} else if (room.host === username) {
						room.host = room.players[0];
					}
					io.to(room.id).emit("playerLeft", username);
					roomUpdated = true;
				}
			});

			if (roomUpdated) {
				const initialCount = activeRooms.length;
				activeRooms = activeRooms.filter((r) => !(r as any).toBeDeleted);
				io.emit("updateRooms", activeRooms);
				console.log(`🧹 Đã dọn dẹp phòng hoặc cập nhật chủ phòng do ${username} thoát.`);
			}
		} else {
			// Fallback cũ nếu không có username
			const initialRoomsCount = activeRooms.length;
			activeRooms = activeRooms.filter(
				(room) => room.hostSocketId !== socket.id,
			);
			if (activeRooms.length !== initialRoomsCount) {
				io.emit("updateRooms", activeRooms);
			}
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
		// Lấy tất cả user kèm theo trận đấu có WPM cao nhất của họ
		const usersWithBestMatch = await prisma.user.findMany({
			include: {
				matchHistory: {
					orderBy: { wpm: "desc" },
					take: 1,
				},
			},
		});

		// Lọc ra những user đã từng chơi, format lại và sắp xếp
		const topMatches = usersWithBestMatch
			.filter((u) => u.matchHistory.length > 0)
			.map((u) => ({
				id: u.matchHistory[0].id,
				userId: u.id,
				wpm: u.matchHistory[0].wpm,
				accuracy: u.matchHistory[0].accuracy,
				mode: u.matchHistory[0].mode,
				createdAt: u.matchHistory[0].playedAt,
				user: { username: u.username },
			}))
			.sort((a, b) => b.wpm - a.wpm)
			.slice(0, 10);

		res.status(200).json(topMatches);
	} catch (error) {
		console.error("Lỗi lấy Leaderboard:", error);
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

// 4. API Lấy danh sách toàn bộ văn bản đua
app.get("/api/admin/texts", async (req: Request, res: Response) => {
	try {
		const texts = await prisma.raceText.findMany();
		res.json(texts);
	} catch (error: any) {
		console.error("Lỗi lấy danh sách văn bản:", error);
		res.status(500).json({ error: "Could not fetch texts.", message: error.message, stack: error.stack });
	}
});

// 5. API Tạo mới văn bản đua
app.post("/api/admin/texts", async (req: Request, res: Response) => {
	try {
		const { content } = req.body;
		if (!content || content.trim().length === 0) {
			res.status(400).json({ error: "Content cannot be empty." });
			return;
		}
		const newText = await prisma.raceText.create({
			data: { content },
		});
		res.status(201).json(newText);
	} catch (error) {
		console.error("Lỗi tạo văn bản:", error);
		res.status(500).json({ error: "Could not create text." });
	}
});

// 6. API Cập nhật văn bản đua
app.put("/api/admin/texts/:id", async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		const { content } = req.body;
		if (!content || content.trim().length === 0) {
			res.status(400).json({ error: "Content cannot be empty." });
			return;
		}
		const updatedText = await prisma.raceText.update({
			where: { id },
			data: { content },
		});
		res.json(updatedText);
	} catch (error) {
		console.error("Lỗi cập nhật văn bản:", error);
		res.status(500).json({ error: "Could not update text." });
	}
});

// 7. API Xoá văn bản đua
app.delete("/api/admin/texts/:id", async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		await prisma.raceText.delete({
			where: { id },
		});
		res.json({ message: "Text deleted successfully!" });
	} catch (error) {
		console.error("Lỗi xoá văn bản:", error);
		res.status(500).json({ error: "Could not delete text." });
	}
});

// 5. Bật Server
httpServer.listen(PORT, () => {
	console.log(`✅ Server SonicType đang chạy tại http://localhost:${PORT}`);
	console.log(`⚡ Trạm phát sóng Real-time đã mở!`);
});

// Trigger nodemon restart

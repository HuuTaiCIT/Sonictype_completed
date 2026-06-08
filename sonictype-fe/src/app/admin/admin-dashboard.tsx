import { Button } from "@/app/components/ui/button";
import {
	Activity,
	Database,
	LogOut,
	ShieldCheck,
	Trash2,
	Users,
	ArrowUpCircle,
	Loader2,
	FileText,
	Edit,
	Plus,
	Save,
	X
} from "lucide-react";
import { useEffect, useState } from "react";

interface AdminStats {
	totalUsers: number;
	activeRoomsCount: number;
	serverLoad: string;
	recentUsers: {
		username: string;
		role: string;
		bestWpm: number;
		status: string;
	}[];
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"overview" | "texts">("overview");

	// State cho Text Management
	const [texts, setTexts] = useState<any[]>([]);
	const [textsLoading, setTextsLoading] = useState(false);
	const [editingTextId, setEditingTextId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState("");
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [newTextContent, setNewTextContent] = useState("");

	const fetchStats = async () => {
		try {
			const token = localStorage.getItem("sonictype_token");
			const res = await fetch("http://localhost:5000/api/admin/stats", {
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			const data = await res.json();
			setStats(data);
		} catch (error) {
			console.error("Lỗi lấy dữ liệu admin:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (activeTab === "overview") {
			fetchStats();
			const interval = setInterval(fetchStats, 10000);
			return () => clearInterval(interval);
		} else if (activeTab === "texts") {
			fetchTexts();
		}
	}, [activeTab]);

	const fetchTexts = async () => {
		setTextsLoading(true);
		try {
			const token = localStorage.getItem("sonictype_token");
			const res = await fetch("http://localhost:5000/api/admin/texts", {
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			const data = await res.json();
			if (Array.isArray(data)) {
				setTexts(data);
			} else {
				console.error("API did not return an array:", data);
				setTexts([]);
			}
		} catch (error) {
			console.error("Lỗi lấy danh sách văn bản:", error);
		} finally {
			setTextsLoading(false);
		}
	};

	const handleAddText = async () => {
		if (!newTextContent.trim()) return;
		try {
			const token = localStorage.getItem("sonictype_token");
			await fetch("http://localhost:5000/api/admin/texts", {
				method: "POST",
				headers: { 
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({ content: newTextContent }),
			});
			setNewTextContent("");
			setIsAddingNew(false);
			fetchTexts();
		} catch (error) {
			console.error("Lỗi thêm văn bản:", error);
		}
	};

	const handleUpdateText = async (id: string) => {
		if (!editContent.trim()) return;
		try {
			const token = localStorage.getItem("sonictype_token");
			await fetch(`http://localhost:5000/api/admin/texts/${id}`, {
				method: "PUT",
				headers: { 
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({ content: editContent }),
			});
			setEditingTextId(null);
			setEditContent("");
			fetchTexts();
		} catch (error) {
			console.error("Lỗi cập nhật văn bản:", error);
		}
	};

	const handleDeleteText = async (id: string) => {
		if (!window.confirm("Bạn có chắc chắn muốn xoá văn bản này?")) return;
		try {
			const token = localStorage.getItem("sonictype_token");
			await fetch(`http://localhost:5000/api/admin/texts/${id}`, {
				method: "DELETE",
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			fetchTexts();
		} catch (error) {
			console.error("Lỗi xoá văn bản:", error);
		}
	};

	const handleDeleteUser = async (username: string) => {
		if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${username} vĩnh viễn không?`)) return;
		try {
			const token = localStorage.getItem("sonictype_token");
			await fetch(`http://localhost:5000/api/admin/users/${username}`, {
				method: "DELETE",
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			fetchStats();
		} catch (error) {
			console.error("Lỗi xóa user:", error);
		}
	};

	const handlePromoteUser = async (username: string) => {
		if (!window.confirm(`Thăng cấp ${username} lên Admin?`)) return;
		try {
			const token = localStorage.getItem("sonictype_token");
			await fetch(`http://localhost:5000/api/admin/users/${username}/role`, {
				method: "PUT",
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			fetchStats();
		} catch (error) {
			console.error("Lỗi thăng cấp user:", error);
		}
	};

	return (
		<div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
			{/* Sidebar giả lập */}
			<nav className="border-b border-[#ff1744]/20 bg-[#14141f]/50 p-4 flex justify-between items-center">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-[#ff1744] rounded flex items-center justify-center">
						<ShieldCheck className="text-black w-5 h-5" />
					</div>
					<span className="font-black italic text-xl">
						SONIC<span className="text-[#ff1744]">CORE</span>
					</span>
				</div>
				<Button
					onClick={onLogout}
					variant="ghost"
					className="text-gray-400 hover:text-[#ff1744]"
				>
					<LogOut className="w-5 h-5 mr-2" /> Exit
				</Button>
			</nav>

			<main className="p-8 max-w-7xl mx-auto">
				<header className="mb-8 flex justify-between items-end">
					<div>
						<h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">
							{activeTab === "overview" ? "System Overview" : "Text Management"}
						</h2>
						<div className="h-1 w-20 bg-[#ff1744]"></div>
					</div>
					
					{/* Tab Navigation */}
					<div className="flex bg-[#14141f] p-1 rounded-lg border border-white/10">
						<button
							onClick={() => setActiveTab("overview")}
							className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
								activeTab === "overview" 
									? "bg-[#ff1744] text-white shadow-lg" 
									: "text-gray-400 hover:text-white"
							}`}
						>
							<Activity className="w-4 h-4" /> Overview
						</button>
						<button
							onClick={() => setActiveTab("texts")}
							className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
								activeTab === "texts" 
									? "bg-[#ff1744] text-white shadow-lg" 
									: "text-gray-400 hover:text-white"
							}`}
						>
							<FileText className="w-4 h-4" /> Racing Texts
						</button>
					</div>
				</header>

				{activeTab === "overview" && (
					loading && !stats ? (
					<div className="flex justify-center items-center h-64">
						<Loader2 className="w-12 h-12 text-[#ff1744] animate-spin" />
					</div>
				) : (
					<>
						{/* Stats Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
							<AdminStatCard
								icon={<Users />}
								label="Total Racers"
								value={stats?.totalUsers || 0}
								color="text-[#00d9ff]"
							/>
							<AdminStatCard
								icon={<Activity />}
								label="Active Rooms"
								value={stats?.activeRoomsCount || 0}
								color="text-[#ffd700]"
							/>
							<AdminStatCard
								icon={<Database />}
								label="Server Load"
								value={stats?.serverLoad || "0%"}
								color="text-[#00ff00]"
							/>
						</div>

						{/* User Management Table */}
						<div className="bg-[#14141f] border border-[#ff1744]/20 rounded-xl overflow-hidden">
							<div className="p-6 border-b border-[#ff1744]/10 bg-[#1f1f2e]/30 flex justify-between items-center">
								<h3 className="font-bold flex items-center gap-2">
									<Users className="w-5 h-5 text-[#ff1744]" /> Recent
									Users
								</h3>
							</div>
							<table className="w-full text-left">
								<thead className="text-xs text-gray-500 uppercase bg-[#0a0a0f]">
									<tr>
										<th className="p-4">Username</th>
										<th className="p-4">Role</th>
										<th className="p-4">Best WPM</th>
										<th className="p-4">Status</th>
										<th className="p-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-white/5">
									{stats?.recentUsers.map((user) => (
										<tr
											key={user.username}
											className="hover:bg-white/5 transition-colors"
										>
											<td className="p-4 font-mono">
												{user.username}
												{user.username === "admin" && (
													<span className="ml-2 px-2 py-0.5 bg-[#ff1744]/20 text-[#ff1744] text-[10px] rounded border border-[#ff1744]/30">ROOT</span>
												)}
											</td>
											<td className="p-4">
												{user.role === "ADMIN" ? (
													<span className="text-[#ff1744] font-bold text-xs flex items-center gap-1">
														<ShieldCheck className="w-3 h-3" /> ADMIN
													</span>
												) : (
													<span className="text-gray-400 text-xs">PLAYER</span>
												)}
											</td>
											<td className="p-4 font-bold text-[#ffd700]">
												{user.bestWpm} WPM
											</td>
											<td className="p-4">
												{user.status === "ONLINE" ? (
													<span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] rounded">
														ONLINE
													</span>
												) : (
													<span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-[10px] rounded">
														OFFLINE
													</span>
												)}
											</td>
											<td className="p-4 text-right">
												<div className="flex justify-end gap-3">
													{user.role !== "ADMIN" && (
														<button 
															onClick={() => handlePromoteUser(user.username)}
															className="text-gray-500 hover:text-[#00d9ff] transition-colors"
															title="Promote to Admin"
														>
															<ArrowUpCircle className="w-5 h-5" />
														</button>
													)}
													{user.username !== "admin" && (
														<button 
															onClick={() => handleDeleteUser(user.username)}
															className="text-gray-500 hover:text-[#ff1744] transition-colors"
															title="Delete User"
														>
															<Trash2 className="w-5 h-5" />
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				)
				)}

				{activeTab === "texts" && (
					<div className="space-y-6">
						<div className="flex justify-end">
							<Button 
								onClick={() => setIsAddingNew(true)}
								className="bg-[#00ff00]/20 hover:bg-[#00ff00]/30 text-[#00ff00] border border-[#00ff00]/50 font-bold"
							>
								<Plus className="w-5 h-5 mr-2" /> Add New Text
							</Button>
						</div>

						{isAddingNew && (
							<div className="bg-[#14141f] border border-[#00ff00]/30 p-6 rounded-xl">
								<h3 className="text-[#00ff00] font-bold mb-4 flex items-center gap-2">
									<Plus className="w-5 h-5" /> Mới
								</h3>
								<textarea
									value={newTextContent}
									onChange={(e) => setNewTextContent(e.target.value)}
									className="w-full h-32 bg-[#0a0a0f] border border-white/10 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-[#00ff00]/50"
									placeholder="Nhập nội dung văn bản đua ở đây..."
								></textarea>
								<div className="flex justify-end gap-3 mt-4">
									<Button onClick={() => setIsAddingNew(false)} variant="ghost" className="text-gray-400">
										Huỷ
									</Button>
									<Button onClick={handleAddText} className="bg-[#00ff00] hover:bg-[#00cc00] text-black font-bold">
										<Save className="w-4 h-4 mr-2" /> Lưu
									</Button>
								</div>
							</div>
						)}

						{textsLoading ? (
							<div className="flex justify-center items-center h-32">
								<Loader2 className="w-8 h-8 text-[#ff1744] animate-spin" />
							</div>
						) : (
							<div className="grid grid-cols-1 gap-4">
								{texts.map((text, index) => (
									<div key={text.id} className="bg-[#14141f] border border-white/5 rounded-xl overflow-hidden hover:border-[#ff1744]/20 transition-colors">
										{editingTextId === text.id ? (
											<div className="p-6">
												<textarea
													value={editContent}
													onChange={(e) => setEditContent(e.target.value)}
													className="w-full h-32 bg-[#0a0a0f] border border-[#00d9ff]/50 rounded-lg p-4 text-white resize-none focus:outline-none"
												></textarea>
												<div className="flex justify-end gap-3 mt-4">
													<Button onClick={() => setEditingTextId(null)} variant="ghost" className="text-gray-400">
														<X className="w-4 h-4 mr-2" /> Huỷ
													</Button>
													<Button onClick={() => handleUpdateText(text.id)} className="bg-[#00d9ff] hover:bg-[#00b3cc] text-black font-bold">
														<Save className="w-4 h-4 mr-2" /> Cập nhật
													</Button>
												</div>
											</div>
										) : (
											<div className="p-6 flex flex-col md:flex-row gap-6 items-start">
												<div className="bg-white/5 px-3 py-1 rounded text-gray-500 font-mono text-sm shrink-0">
													#{index + 1}
												</div>
												<div className="flex-1 text-gray-300 leading-relaxed text-lg">
													{text.content}
												</div>
												<div className="flex flex-row md:flex-col gap-2 shrink-0">
													<button
														onClick={() => {
															setEditingTextId(text.id);
															setEditContent(text.content);
														}}
														className="p-2 bg-white/5 hover:bg-[#00d9ff]/20 text-gray-400 hover:text-[#00d9ff] rounded transition-colors"
														title="Sửa"
													>
														<Edit className="w-5 h-5" />
													</button>
													<button
														onClick={() => handleDeleteText(text.id)}
														className="p-2 bg-white/5 hover:bg-[#ff1744]/20 text-gray-400 hover:text-[#ff1744] rounded transition-colors"
														title="Xoá"
													>
														<Trash2 className="w-5 h-5" />
													</button>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</main>
		</div>
	);
}

function AdminStatCard({ icon, label, value, color }: any) {
	return (
		<div className="bg-[#14141f] border border-white/5 p-6 rounded-2xl hover:border-[#ff1744]/40 transition-all">
			<div className="flex justify-between items-start mb-4">
				<div className={`p-3 bg-white/5 rounded-lg ${color}`}>
					{icon}
				</div>
			</div>
			<p className="text-gray-500 text-sm font-medium">{label}</p>
			<p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
		</div>
	);
}

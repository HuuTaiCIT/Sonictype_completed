import { Button } from "@/app/components/ui/button";
import {
	Activity,
	Database,
	LogOut,
	ShieldCheck,
	Trash2,
	Users,
	ArrowUpCircle,
	Loader2
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

	const fetchStats = async () => {
		try {
			const res = await fetch("http://localhost:5000/api/admin/stats");
			const data = await res.json();
			setStats(data);
		} catch (error) {
			console.error("Lỗi lấy dữ liệu admin:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStats();
		// Refresh mỗi 10 giây
		const interval = setInterval(fetchStats, 10000);
		return () => clearInterval(interval);
	}, []);

	const handleDeleteUser = async (username: string) => {
		if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${username} vĩnh viễn không?`)) return;
		try {
			await fetch(`http://localhost:5000/api/admin/users/${username}`, {
				method: "DELETE",
			});
			fetchStats();
		} catch (error) {
			console.error("Lỗi xóa user:", error);
		}
	};

	const handlePromoteUser = async (username: string) => {
		if (!window.confirm(`Thăng cấp ${username} lên Admin?`)) return;
		try {
			await fetch(`http://localhost:5000/api/admin/users/${username}/role`, {
				method: "PUT",
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
				<header className="mb-12">
					<h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">
						System Overview
					</h2>
					<div className="h-1 w-20 bg-[#ff1744]"></div>
				</header>

				{loading && !stats ? (
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

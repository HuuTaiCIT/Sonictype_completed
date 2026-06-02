import { useState } from "react";
import { LandingPage } from "@/app/components/landing-page";
import { LoginPage } from "@/app/components/login-page";
import { MainMenu } from "@/app/components/main-menu";
import { SoloMode } from "@/app/components/solo-mode";
import { RankMode } from "@/app/components/rank-mode";
// Import các component Admin mới
import { AdminDashboard } from "@/app/admin/admin-dashboard";

// Cập nhật Type để hỗ trợ các màn hình Admin
type AppScreen =
	| "landing"
	| "login"
	| "menu"
	| "solo"
	| "rank"
	| "admin-dashboard";

export default function App() {
	const [currentScreen, setCurrentScreen] = useState<AppScreen>("landing");
	const [username, setUsername] = useState<string>("");

	// --- Logic Điều Hướng Người Chơi ---
	const handleGetStarted = () => {
		setCurrentScreen("login");
	};

	const handleLogin = (user: string) => {
		setUsername(user);

		// Lấy thông tin user từ localStorage để kiểm tra role
		const storedUser = localStorage.getItem("sonictype_user");
		if (storedUser) {
			try {
				const userObj = JSON.parse(storedUser);
				if (userObj.role === "ADMIN") {
					setCurrentScreen("admin-dashboard");
					return;
				}
			} catch (e) {}
		}

		setCurrentScreen("menu");
	};

	const handleBackToLanding = () => {
		setCurrentScreen("landing");
	};

	const handleSelectMode = (mode: "solo" | "rank") => {
		setCurrentScreen(mode);
	};

	const handleLogout = () => {
		setUsername("");
		setCurrentScreen("landing");
	};



	return (
		<div className="size-full">
			{/* MÀN HÌNH NGƯỜI CHƠI */}
			{currentScreen === "landing" && (
				<LandingPage onGetStarted={handleGetStarted} />
			)}

			{currentScreen === "login" && (
				<LoginPage
					onLogin={handleLogin}
					onBack={handleBackToLanding}
				/>
			)}

			{currentScreen === "menu" && (
				<MainMenu
					username={username}
					onSelectMode={handleSelectMode}
					onLogout={handleLogout}
				/>
			)}

			{currentScreen === "solo" && (
				<SoloMode onBack={() => setCurrentScreen("menu")} />
			)}

			{currentScreen === "rank" && (
				<RankMode
					username={username}
					onBack={() => setCurrentScreen("menu")}
				/>
			)}

			{/* MÀN HÌNH QUẢN TRỊ (ADMIN) */}
			{currentScreen === "admin-dashboard" && (
				<AdminDashboard onLogout={handleLogout} />
			)}
		</div>
	);
}

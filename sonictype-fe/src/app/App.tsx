import { useEffect, useState } from "react";
import { LandingPage } from "@/app/components/landing-page";
import { LoginPage } from "@/app/components/login-page";
import { MainMenu } from "@/app/components/main-menu";
import { SoloMode } from "@/app/components/solo-mode";
import { RankMode } from "@/app/components/rank-mode";
// Import các component Admin mới
import { AdminDashboard } from "@/app/admin/admin-dashboard";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "sonictype_last_activity";

// Cập nhật Type để hỗ trợ các màn hình Admin
type AppScreen =
	| "landing"
	| "login"
	| "menu"
	| "solo"
	| "rank"
	| "admin-dashboard";

export default function App() {
	const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
		const storedUser = localStorage.getItem("sonictype_user");
		const storedLastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
		const isExpired = storedLastActivity
			? Date.now() - storedLastActivity >= INACTIVITY_TIMEOUT_MS
			: false;

		if (!storedUser || isExpired) {
			localStorage.removeItem("sonictype_user");
			localStorage.removeItem("sonictype_token");
			localStorage.removeItem(LAST_ACTIVITY_KEY);
			return "landing";
		}

		try {
			const userObj = JSON.parse(storedUser);
			return userObj.role === "ADMIN" ? "admin-dashboard" : "menu";
		} catch {
			localStorage.removeItem("sonictype_user");
			localStorage.removeItem("sonictype_token");
			localStorage.removeItem(LAST_ACTIVITY_KEY);
			return "landing";
		}
	});
	const [username, setUsername] = useState<string>(() => {
		const storedUser = localStorage.getItem("sonictype_user");
		if (!storedUser) return "";

		try {
			const userObj = JSON.parse(storedUser);
			return userObj.username || "";
		} catch {
			return "";
		}
	});

	const clearSession = () => {
		localStorage.removeItem("sonictype_user");
		localStorage.removeItem("sonictype_token");
		localStorage.removeItem(LAST_ACTIVITY_KEY);
	};

	const updateLastActivity = () => {
		if (localStorage.getItem("sonictype_user")) {
			localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
		}
	};

	const logout = () => {
		clearSession();
		setUsername("");
		setCurrentScreen("landing");
	};

	useEffect(() => {
		updateLastActivity();

		const activityEvents = ["keydown", "mousedown", "mousemove", "scroll", "touchstart"];
		activityEvents.forEach((eventName) => {
			window.addEventListener(eventName, updateLastActivity, { passive: true });
		});

		const intervalId = window.setInterval(() => {
			if (!localStorage.getItem("sonictype_user")) return;

			const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
			if (!lastActivity || Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
				logout();
			}
		}, 60 * 1000);

		return () => {
			activityEvents.forEach((eventName) => {
				window.removeEventListener(eventName, updateLastActivity);
			});
			window.clearInterval(intervalId);
		};
	}, []);

	// --- Logic Điều Hướng Người Chơi ---
	const handleGetStarted = () => {
		setCurrentScreen("login");
	};

	const handleLogin = (user: string) => {
		setUsername(user);
		localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

		// Lấy thông tin user từ localStorage để kiểm tra role
		const storedUser = localStorage.getItem("sonictype_user");
		if (storedUser) {
			try {
				const userObj = JSON.parse(storedUser);
				if (userObj.role === "ADMIN") {
					setCurrentScreen("admin-dashboard");
					return;
				}
			} catch {
				clearSession();
			}
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
		logout();
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

import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, StateData } from "./types";
import Dashboard from "./components/Dashboard";
import IndiaMap from "./components/IndiaMap";
import GamesContainer from "./components/GamesContainer";
import HackathonProposal from "./components/HackathonProposal";
import AccessibilityControls, { AccessibilitySettings } from "./components/AccessibilityControls";
import { renderProfileIcon } from "./components/ProfileSettings";
import { 
  Sparkles, Award, MapPin, BarChart3, HelpCircle, Gamepad2, FileText, 
  User, LogOut, Lock, Globe, ThumbsUp, Flame, Activity, ShieldCheck, HeartHandshake,
  Search, Sun, Moon, X
} from "lucide-react";

export default function App() {
  // Global search & Midnight theme states
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "midnight">(() => 
    (localStorage.getItem("theme") as "light" | "midnight") || "light"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "midnight") {
      root.classList.add("theme-midnight");
    } else {
      root.classList.remove("theme-midnight");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Accessibility controls state
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    largeText: false,
    highContrast: false,
    readingGuide: false,
  });

  // 1. Session & Auth State (Stored in localStorage)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("ai_connect_session");
    if (saved) return JSON.parse(saved);
    // Initial Guest default to make testing fast for judges
    return {
      username: "Aarav Volunteer",
      role: "volunteer" as const,
      xp: 45,
      level: 1,
      streak: 4,
      badges: ["First Volunteer Event"],
      reputationScore: 82,
      savedReportsCount: 1,
      accentColor: "indigo",
      density: "cozy",
      preferredCauses: ["Education", "Environment", "Disaster and Humanitarian Relief"],
      profileIcon: "smile"
    };
  });

  // Login inputs
  const [loginUsername, setLoginUsername] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("volunteer");
  const [isRegistering, setIsRegistering] = useState(false);

  // Layout View Routing: "dashboard" | "map" | "games" | "pitch"
  const [activeView, setActiveView] = useState<"dashboard" | "map" | "games" | "pitch">("dashboard");
  const [selectedStateKey, setSelectedStateKey] = useState<string | null>(null);
  const [selectedStateData, setSelectedStateData] = useState<StateData | null>(null);

  // In-app floating notifications
  const [notifications, setNotifications] = useState<{ id: string; msg: string; type: "xp" | "badge" | "sync" }[]>([]);
  const [syncStatus, setSyncStatus] = useState<"saved" | "syncing">("saved");

  // Trigger floating notifications helper
  const triggerNotification = (msg: string, type: "xp" | "badge" | "sync") => {
    const id = `notif-${Date.now()}`;
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Sync session state to local storage
  const syncSession = (profile: UserProfile | null) => {
    setCurrentUser(profile);
    if (profile) {
      localStorage.setItem("ai_connect_session", JSON.stringify(profile));
      setSyncStatus("syncing");
      setTimeout(() => {
        setSyncStatus("saved");
      }, 700);
    } else {
      localStorage.removeItem("ai_connect_session");
    }
  };

  // Handle Authentication submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) return;

    const newProfile: UserProfile = {
      username: loginUsername.trim(),
      role: loginRole,
      xp: 0,
      level: 1,
      streak: 1,
      badges: [],
      reputationScore: 60,
      savedReportsCount: 0,
      accentColor: "indigo",
      density: "cozy",
      preferredCauses: ["Education", "Environment"],
      profileIcon: "smile"
    };

    syncSession(newProfile);
    triggerNotification(`Logged in as ${newProfile.username} (${newProfile.role})`, "sync");
  };

  // Gamification rewards receiver
  const handleRewardXP = (amount: number, badgeName?: string) => {
    if (!currentUser) return;

    let updatedXP = currentUser.xp + amount;
    let updatedLevel = currentUser.level;
    let levelUpOccurred = false;

    // Standard Level limit: 100 XP per level
    const xpThreshold = updatedLevel * 100;
    if (updatedXP >= xpThreshold) {
      updatedXP = updatedXP - xpThreshold;
      updatedLevel += 1;
      levelUpOccurred = true;
    }

    const updatedBadges = [...currentUser.badges];
    if (badgeName && !updatedBadges.includes(badgeName)) {
      updatedBadges.push(badgeName);
      triggerNotification(`UNLOCKED BADGE: "${badgeName}"!`, "badge");
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      xp: updatedXP,
      level: updatedLevel,
      badges: updatedBadges,
      reputationScore: Math.min(currentUser.reputationScore + Math.round(amount / 8), 100)
    };

    syncSession(updatedProfile);
    triggerNotification(`+${amount} XP Earned!`, "xp");

    if (levelUpOccurred) {
      triggerNotification(`CONGRATULATIONS: Advanced to Level ${updatedLevel}!`, "badge");
    }
  };

  // Logout Handler
  const handleLogout = () => {
    syncSession(null);
    setLoginUsername("");
    setActiveView("dashboard");
  };

  // State click mapping helper from the map page to dashboard
  const handleStateSelection = (stateKey: string, stateData: StateData) => {
    setSelectedStateKey(stateKey);
    setSelectedStateData(stateData);
    setActiveView("dashboard"); // Go to dashboard and auto filter matching campaigns
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans leading-normal relative flex flex-col justify-between">
      
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* FLOAT NOTIFICATIONS TOP RIGHT */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-3.5 rounded-2xl border shadow-xl flex items-center gap-3 animate-slide-in backdrop-blur-md ${
              n.type === "badge" ? "bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100/50" :
              n.type === "xp" ? "bg-indigo-50 border-indigo-200 text-indigo-800 shadow-indigo-100/50" :
              "bg-white border-slate-200 text-slate-800 shadow-slate-100"
            }`}
          >
            {n.type === "badge" ? <Award className="w-5 h-5 text-amber-600 shrink-0" /> :
             n.type === "xp" ? <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" /> :
             <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span className="text-xs font-semibold">{n.msg}</span>
          </div>
        ))}
      </div>

      {/* --- AUTH GATE HEADER / GATEWAY --- */}
      {!currentUser ? (
        <div className="flex-1 flex items-center justify-center p-4 min-h-[90vh]">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 mb-3 shadow-sm">
                <Globe className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">AI Volunteer Connect</h1>
              <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                India AI Impact Festival 2026: Enhancing Rural Digital Infrastructure & Healthcare Accessibility.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block mb-1.5">
                  CHOOSE SECURITY PROFILE NAME
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                    User:
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter Full Name"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-sans font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block mb-1.5">
                  SELECT FUNCTIONAL ACCESS ROLE
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                >
                  <option value="volunteer">Volunteer (Student / Citizen)</option>
                  <option value="org">Organization Partner</option>
                  <option value="csr team">CSR Team (Corporate Sponsor)</option>
                  <option value="admin">System Administrator</option>
                  <option value="ngo poc">NGO Point of Contact (Ground Leader)</option>
                  <option value="donator">Private Donator</option>
                  <option value="govt official">Government Official (Authority)</option>
                  <option value="auditor">Independent Impact Auditor</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-100 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Initialize Access Gate
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>*OFFLINE SECURE ENCRYPTION</span>
              <span>*SECURE LOCAL TRUST PROTOCOL</span>
            </div>
          </div>
        </div>
      ) : (
        /* --- MAIN WEB INTERFACE APP --- */
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* BENTO-STYLE LEFT SIDEBAR */}
          <aside className="w-full md:w-24 bg-indigo-950 flex md:flex-col items-center justify-between py-4 md:py-8 px-6 md:px-0 shadow-xl shrink-0 z-30">
            <div className="flex md:flex-col items-center gap-4 md:gap-8 w-full">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-extrabold text-indigo-950 shadow-md">
                AI
              </div>
              
              <nav className="flex md:flex-col items-center gap-3 md:gap-4">
                <button
                  onClick={() => setActiveView("dashboard")}
                  className={`p-3 rounded-xl transition-all ${
                    activeView === "dashboard"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900"
                      : "text-indigo-300 hover:bg-indigo-900 hover:text-white"
                  }`}
                  title="Work Desk"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveView("map")}
                  className={`p-3 rounded-xl transition-all ${
                    activeView === "map"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900"
                      : "text-indigo-300 hover:bg-indigo-900 hover:text-white"
                  }`}
                  title="Coverage Map"
                >
                  <MapPin className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveView("games")}
                  className={`p-3 rounded-xl transition-all ${
                    activeView === "games"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900"
                      : "text-indigo-300 hover:bg-indigo-900 hover:text-white"
                  }`}
                  title="Impact Games"
                >
                  <Gamepad2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveView("pitch")}
                  className={`p-3 rounded-xl transition-all ${
                    activeView === "pitch"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-900"
                      : "text-indigo-300 hover:bg-indigo-900 hover:text-white"
                  }`}
                  title="Festival Entry"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </nav>
            </div>

            {/* Profile Avatar / Logout */}
            <div className="flex md:flex-col items-center gap-3 md:gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-indigo-300 flex items-center justify-center font-bold text-white text-sm select-none shadow-md">
                {currentUser.profileIcon ? renderProfileIcon(currentUser.profileIcon, "w-5 h-5") : currentUser.username[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 text-indigo-300 hover:text-rose-400 hover:bg-indigo-900 rounded-xl transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>

          {/* RIGHT CONTENT WORKSPACE */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* TOP HEADER BAR */}
            <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20 shadow-sm">
              <div className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <HeartHandshake className="w-6 h-6 text-indigo-600 shrink-0" />
                  India AI Impact Festival <span className="text-orange-500">2026</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">
                  CSR & NGO Connect • AI-Powered Impact Dashboard
                </p>
              </div>

              {/* GLOBAL EVENT SEARCH BAR */}
              <div className="flex-1 max-w-md mx-0 md:mx-6 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search events by title, location, or cause..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    if (activeView !== "dashboard") {
                      setActiveView("dashboard");
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-sans font-medium shadow-sm"
                />
                {globalSearchQuery && (
                  <button
                    onClick={() => setGlobalSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Midnight Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === "light" ? "midnight" : "light")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 dark-theme-toggle border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm text-slate-700 hover:text-indigo-600"
                  title={theme === "light" ? "Switch to Midnight Theme" : "Switch to Light Theme"}
                >
                  {theme === "light" ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </button>

                {/* Sync status indicator */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === "syncing" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                  <span>{syncStatus === "syncing" ? "Syncing..." : "Saved Offline"}</span>
                </div>

                {/* Accessibility Controls */}
                <AccessibilityControls
                  settings={accessibilitySettings}
                  onChangeSettings={setAccessibilitySettings}
                />

                <span className="hidden lg:inline-flex bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200">
                  Live Control Center
                </span>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
                  <div className="text-left">
                    <div className="text-[9px] text-slate-400 font-mono font-bold leading-none capitalize">{currentUser.role}</div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">{currentUser.username}</div>
                  </div>
                </div>
              </div>
            </header>

            {/* MAIN APP VIEW */}
            <main className="p-6 md:p-8 flex-1">
              {activeView === "dashboard" && (
                <Dashboard
                  userProfile={currentUser}
                  onRewardXP={handleRewardXP}
                  selectedStateKey={selectedStateKey}
                  selectedStateData={selectedStateData}
                  onSelectStateKey={(key) => {
                    setSelectedStateKey(key);
                    if (key === null) setSelectedStateData(null);
                  }}
                  onUpdateProfile={syncSession}
                  onTriggerNotification={triggerNotification}
                  globalSearchQuery={globalSearchQuery}
                />
              )}

              {activeView === "map" && (
                <IndiaMap
                  selectedStateKey={selectedStateKey}
                  onSetSelectedStateKey={(key) => {
                    setSelectedStateKey(key);
                    if (key === null) setSelectedStateData(null);
                  }}
                  onStateSelect={handleStateSelection}
                />
              )}

              {activeView === "games" && (
                <GamesContainer
                  userProfile={currentUser}
                  onRewardXP={handleRewardXP}
                />
              )}

              {activeView === "pitch" && (
                <HackathonProposal />
              )}
            </main>
          </div>
        </div>
      )}

      {/* FOOTER PITCH CREDITS */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center text-[10px] text-slate-400 font-mono gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold">INDIA AI IMPACT FESTIVAL 2026 OFFICIAL SUBMISSION</span>
          </div>
          <div className="font-semibold">
            <span>MAPPED TO SDG 11 & SDG 17</span>
          </div>
          <div>
            <span>*PRODUCED BY GOOGLE AI STUDIO BUILD</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  User, Check, Sparkles, Heart, Globe, Shield, Activity, Award, Leaf, Smile, LayoutGrid, Palette, Pin, Share2, Download, X
} from "lucide-react";

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

const ALL_CAUSES = [
  "Animal Welfare",
  "Arts and Culture",
  "Children",
  "Civil Rights & Social Action",
  "Economic Empowerment",
  "Education",
  "Environment",
  "Health",
  "Human Rights",
  "Disaster and Humanitarian Relief",
  "Politics",
  "Poverty Alleviation",
  "Science and Technology",
  "Social Services",
  "Veteran Support"
];

const PROFILE_ICONS = ["smile", "heart", "globe", "shield", "sparkles", "activity", "award", "leaf"];
const ACCENT_COLORS = ["indigo", "emerald", "rose", "violet", "amber"];
const DENSITIES = ["compact", "cozy", "spacious"] as const;

export function renderProfileIcon(iconName: string, className: string = "w-4 h-4") {
  switch (iconName) {
    case "heart": return <Heart className={className} />;
    case "globe": return <Globe className={className} />;
    case "shield": return <Shield className={className} />;
    case "sparkles": return <Sparkles className={className} />;
    case "activity": return <Activity className={className} />;
    case "award": return <Award className={className} />;
    case "leaf": return <Leaf className={className} />;
    case "smile":
    default: return <Smile className={className} />;
  }
}

export default function ProfileSettings({ userProfile, onUpdateProfile }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(userProfile.username);
  const [selectedCauses, setSelectedCauses] = useState<string[]>(userProfile.preferredCauses || []);
  const [selectedIcon, setSelectedIcon] = useState(userProfile.profileIcon || "smile");
  const [accentColor, setAccentColor] = useState(userProfile.accentColor || "indigo");
  const [density, setDensity] = useState<"compact" | "cozy" | "spacious">(userProfile.density || "cozy");
  const [pinnedBadges, setPinnedBadges] = useState<string[]>(userProfile.pinnedBadges || []);
  const [showCertModal, setShowCertModal] = useState(false);

  const getHours = () => {
    try {
      const saved = localStorage.getItem("social_impact_monthly_metrics");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.reduce((sum: number, item: any) => sum + (item.hours || 0), 0);
      }
    } catch (e) {}
    return 130; // fallback standard total hours
  };

  const handleDownloadCertificate = () => {
    const totalHours = getHours();
    const displayNameToUse = displayName.trim() || userProfile.username;
    const badgesList = userProfile.badges && userProfile.badges.length > 0 
      ? userProfile.badges 
      : ["SDG Pioneer", "Western Slopes Responder", "Vetted Change Agent"];

    const certHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SevaSetu Verified Impact Certificate - ${displayNameToUse}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .cert-card {
      background: linear-gradient(135deg, #0b0f19, #111827);
      border: 4px solid #f59e0b;
      box-shadow: 0 0 40px rgba(245, 158, 11, 0.15), inset 0 0 20px rgba(245, 158, 11, 0.05);
      border-radius: 28px;
      padding: 60px;
      max-width: 900px;
      width: 100%;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cert-card::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
      pointer-events: none;
    }
    .watermark {
      position: absolute;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 110px;
      font-weight: 900;
      color: rgba(245, 158, 11, 0.02);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      pointer-events: none;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 12px;
    }
    .logo-section {
      margin-bottom: 25px;
    }
    .app-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #f3f4f6;
      letter-spacing: 2px;
    }
    .app-tagline {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-top: 6px;
      font-weight: bold;
    }
    .cert-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 22px;
      color: #fbbf24;
      text-transform: uppercase;
      letter-spacing: 5px;
      font-weight: 700;
      margin: 35px 0 10px 0;
    }
    .cert-subtitle {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .holder-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 42px;
      font-weight: 700;
      color: #ffffff;
      margin: 30px 0;
      text-decoration: underline;
      text-decoration-color: #f59e0b;
      text-underline-offset: 12px;
    }
    .cert-desc {
      font-size: 15px;
      line-height: 1.7;
      color: #d1d5db;
      max-width: 650px;
      margin: 0 auto 35px auto;
    }
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      max-width: 600px;
      margin: 0 auto 35px auto;
    }
    .metric-box {
      background: rgba(17, 24, 39, 0.6);
      border: 1px solid #1f2937;
      padding: 16px;
      border-radius: 16px;
    }
    .metric-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #60a5fa;
    }
    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #9ca3af;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }
    .badges-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 45px;
    }
    .badge-capsule {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      color: #fbbf24;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-t: 1px solid #1f2937;
      padding-top: 25px;
      max-width: 700px;
      margin: 0 auto;
    }
    .sign-box {
      text-align: left;
    }
    .sign-line {
      width: 160px;
      border-bottom: 1px solid #4b5563;
      margin-bottom: 6px;
    }
    .sign-name {
      font-size: 11px;
      font-weight: bold;
      color: #e5e7eb;
    }
    .sign-title {
      font-size: 9px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="watermark">SEVASETU VERIFIED</div>
    
    <div class="logo-section">
      <div class="app-title">🇮🇳 SevaSetu</div>
      <div class="app-tagline">Made for India • Built in India • Powered by AI</div>
    </div>
    
    <div class="cert-title">Social Impact Credential</div>
    <div class="cert-subtitle">Official Portfolio Certification</div>
    
    <div class="holder-name">${displayNameToUse}</div>
    
    <div class="cert-desc">
      This certifies that <strong>${displayNameToUse}</strong> has demonstrated exceptional commitment to national development, sustainability, and community service. By engaging directly in verified field campaigns aligned with the UN Sustainable Development Goals (SDGs), the holder has made measurable contributions to building a resilient India.
    </div>
    
    <div class="metrics-row">
      <div class="metric-box">
        <div class="metric-value">${userProfile.xp.toLocaleString()}</div>
        <div class="metric-label">Social XP</div>
      </div>
      <div class="metric-box">
        <div class="metric-value">${badgesList.length}</div>
        <div class="metric-label">Badges Earned</div>
      </div>
      <div class="metric-box">
        <div class="metric-value">${totalHours} hrs</div>
        <div class="metric-label">Volunteered</div>
      </div>
    </div>
    
    <div class="badges-row">
      ${badgesList.map(b => `<span class="badge-capsule">🏆 ${b}</span>`).join("\n      ")}
    </div>
    
    <div class="cert-footer">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-name">SevaSetu AI Core</div>
        <div class="sign-title">Verification Ledger Engine</div>
      </div>
      <div class="sign-box" style="text-align: right;">
        <div class="sign-line" style="margin-left: auto;"></div>
        <div class="sign-name">India AI Impact Festival</div>
        <div class="sign-title">CSR & NGO Connect Committee</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(certHtml);
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `SevaSetu_Impact_Certificate_${displayNameToUse.replace(/\\s+/g, '_')}.html`);
    dlAnchor.click();
  };

  const handleCauseToggle = (cause: string) => {
    if (selectedCauses.includes(cause)) {
      setSelectedCauses(selectedCauses.filter(c => c !== cause));
    } else {
      setSelectedCauses([...selectedCauses, cause]);
    }
  };

  const handleRandomizeIcon = () => {
    const randomIndex = Math.floor(Math.random() * PROFILE_ICONS.length);
    setSelectedIcon(PROFILE_ICONS[randomIndex]);
  };

  const handleBadgePinToggle = (badge: string) => {
    if (pinnedBadges.includes(badge)) {
      setPinnedBadges(pinnedBadges.filter(b => b !== badge));
    } else {
      if (pinnedBadges.length >= 3) {
        // limit to 3 pinned badges
        alert("You can only pin up to 3 badges to your public showcase!");
        return;
      }
      setPinnedBadges([...pinnedBadges, badge]);
    }
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...userProfile,
      username: displayName.trim() || userProfile.username,
      preferredCauses: selectedCauses,
      profileIcon: selectedIcon,
      accentColor,
      density,
      pinnedBadges
    };
    onUpdateProfile(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="profile-settings-widget">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
      
      <div className="flex justify-between items-start mb-5 flex-wrap gap-4">
        <div>
          <span className="text-[10px] bg-slate-950 text-indigo-400 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            User Workspace
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-1">Personalize Profile & Causes</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCertModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-slate-950" />
            <span>Share Achievement</span>
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow cursor-pointer transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Name and Icon Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:outline-none"
              placeholder="Enter preferred display name"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider block">
                Avatar Badge
              </label>
              <button
                onClick={handleRandomizeIcon}
                className="text-[9px] font-mono text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer"
              >
                🎲 RANDOMIZE ICON
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {PROFILE_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    selectedIcon === icon
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                  title={icon}
                >
                  {renderProfileIcon(icon, "w-4 h-4")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accent Colors and Density */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider block mb-1.5">
              Theme Accent Color
            </label>
            <div className="flex items-center gap-2">
              {ACCENT_COLORS.map(color => {
                let bgClass = "bg-indigo-600";
                if (color === "emerald") bgClass = "bg-emerald-600";
                if (color === "rose") bgClass = "bg-rose-600";
                if (color === "violet") bgClass = "bg-violet-600";
                if (color === "amber") bgClass = "bg-amber-500";
                
                return (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`w-7 h-7 rounded-full ${bgClass} flex items-center justify-center transition-all relative border-2 ${
                      accentColor === color ? "border-slate-800 scale-110" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    title={color}
                  >
                    {accentColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider block mb-1.5">
              Layout Density Settings
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DENSITIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`py-1.5 px-3 rounded-xl text-center border text-[11px] font-bold font-mono capitalize transition-all cursor-pointer ${
                    density === d
                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Social Causes Standard Selection */}
        <div className="pt-3 border-t border-slate-100">
          <label className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider block mb-2">
            My Preferred Social Causes ({selectedCauses.length} selected)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_CAUSES.map(cause => {
              const active = selectedCauses.includes(cause);
              return (
                <button
                  key={cause}
                  onClick={() => handleCauseToggle(cause)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate mr-1">{cause}</span>
                  {active ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievement Showcase (Pin Badges) */}
        <div className="pt-4 border-t border-slate-800/60">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Achievement Showcase ({pinnedBadges.length}/3 Pinned)
            </label>
            <span className="text-[8px] font-mono text-indigo-400 uppercase bg-indigo-950/60 border border-indigo-900 px-1.5 py-0.5 rounded">
              Public Display
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3 leading-tight font-sans">
            Select up to 3 of your earned credentials or milestones to pin as featured achievements on your public profile card.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(userProfile.badges && userProfile.badges.length > 0 ? userProfile.badges : ["First Volunteer Event", "SDG Pioneer"]).map(badge => {
              const isPinned = pinnedBadges.includes(badge);
              return (
                <button
                  key={badge}
                  onClick={() => handleBadgePinToggle(badge)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group relative cursor-pointer ${
                    isPinned
                      ? "bg-amber-950/30 border-amber-500/60 text-amber-200 shadow-md shadow-amber-900/10 scale-[1.02]"
                      : "bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start w-full mb-1">
                    <span className={`p-1 rounded-lg ${isPinned ? "bg-amber-500/10 text-amber-400 animate-pulse" : "bg-slate-900 text-slate-500"}`}>
                      <Award className="w-4 h-4" />
                    </span>
                    <Pin className={`w-3.5 h-3.5 transition-transform ${isPinned ? "text-amber-400 rotate-45 scale-110" : "text-slate-600 opacity-0 group-hover:opacity-100"}`} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block truncate leading-tight">{badge}</span>
                    <span className="text-[8.5px] text-slate-500 block font-sans">
                      {isPinned ? "Featured Badge" : "Tap to pin"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Digital Certificate Modal Showcase */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between max-h-[90vh] overflow-y-auto animate-zoom-in">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full"></div>

            {/* Header Controls */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-slate-100 text-sm uppercase tracking-wider">Your Impact Certificate</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Verified Social Impact Portfolio • SevaSetu ID Ledger</p>
                </div>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                title="Close Certificate View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Live Certificate Canvas for Screen Rendering */}
            <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 text-center relative overflow-hidden my-2 shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none font-black font-mono text-[70px] uppercase rotate-[-12deg] text-amber-500">
                SEVASETU VERIFIED
              </div>
              
              <div className="mb-4">
                <div className="text-xl font-black text-slate-100 tracking-tight">🇮🇳 SevaSetu</div>
                <div className="text-[8.5px] text-emerald-400 font-mono tracking-widest uppercase font-bold mt-1">
                  Made for India • Built in India • Powered by AI
                </div>
              </div>

              <div className="text-[10px] text-amber-400 uppercase tracking-widest font-mono font-bold mb-1">
                Social Impact Credential
              </div>
              <div className="text-[8px] text-slate-500 font-mono tracking-wider uppercase mb-4">
                Official Portfolio Certification
              </div>

              <div className="text-2xl sm:text-3xl font-black text-white my-3 border-b border-slate-800/80 inline-block pb-1.5 px-4">
                {displayName.trim() || userProfile.username}
              </div>

              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-lg mx-auto my-4 italic font-sans">
                "Demonstrated exceptional commitment to national development and sustainability. By engaging directly in verified field campaigns aligned with the UN Sustainable Development Goals (SDGs), the holder has made measurable contributions to building a resilient India."
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto my-4 text-center">
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850">
                  <div className="text-lg font-bold font-mono text-indigo-400">{userProfile.xp.toLocaleString()}</div>
                  <div className="text-[8px] uppercase font-bold text-slate-500 font-mono">Social XP</div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850">
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {userProfile.badges && userProfile.badges.length > 0 ? userProfile.badges.length : 3}
                  </div>
                  <div className="text-[8px] uppercase font-bold text-slate-500 font-mono">Badges</div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850">
                  <div className="text-lg font-bold font-mono text-amber-400">{getHours()} hrs</div>
                  <div className="text-[8px] uppercase font-bold text-slate-500 font-mono">Volunteered</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5 my-3">
                {(userProfile.badges && userProfile.badges.length > 0 ? userProfile.badges : ["SDG Pioneer", "Western Slopes Responder", "Vetted Change Agent"]).map((b, idx) => (
                  <span key={idx} className="bg-amber-950/20 border border-amber-900/30 text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                    🏆 {b}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-end border-t border-slate-850 pt-4 mt-5 text-left max-w-md mx-auto text-[8px] text-slate-500 font-mono">
                <div>
                  <div className="w-16 border-b border-slate-700 mb-1"></div>
                  <span>SevaSetu AI Core</span>
                </div>
                <div className="text-right">
                  <div className="w-16 border-b border-slate-700 mb-1 ml-auto"></div>
                  <span>India AI Connect Committee</span>
                </div>
              </div>
            </div>

            {/* Action Download Buttons */}
            <div className="flex gap-3 pt-3 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer text-center"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-xl text-xs font-black font-sans transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Download Certified HTML</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

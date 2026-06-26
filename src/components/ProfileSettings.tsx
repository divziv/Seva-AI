import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  User, Check, Sparkles, Heart, Globe, Shield, Activity, Award, Leaf, Smile, LayoutGrid, Palette 
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

  const handleSave = () => {
    const updated: UserProfile = {
      ...userProfile,
      username: displayName.trim() || userProfile.username,
      preferredCauses: selectedCauses,
      profileIcon: selectedIcon,
      accentColor,
      density
    };
    onUpdateProfile(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="profile-settings-widget">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
      
      <div className="flex justify-between items-start mb-5">
        <div>
          <span className="text-[10px] bg-slate-950 text-indigo-400 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
            User Workspace
          </span>
          <h3 className="text-lg font-bold text-slate-100 mt-1">Personalize Profile & Causes</h3>
        </div>
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow cursor-pointer transition-all"
        >
          Save Changes
        </button>
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
      </div>
    </div>
  );
}

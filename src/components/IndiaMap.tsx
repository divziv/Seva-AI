import React, { useState } from "react";
import { indiaStatesData } from "../data/mockData";
import { StateData } from "../types";
import { MapPin, Info, Users, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

interface IndiaMapProps {
  onStateSelect?: (stateKey: string, stateData: StateData) => void;
  selectedStateKey: string | null;
  onSetSelectedStateKey: (key: string | null) => void;
  themeColor?: string;
}

export default function IndiaMap({
  onStateSelect,
  selectedStateKey,
  onSetSelectedStateKey,
  themeColor = "indigo"
}: IndiaMapProps) {
  const [heatmapMode, setHeatmapMode] = useState<"volunteers" | "ngos" | "urgency" | "opportunity">("urgency");
  const [hoveredStateKey, setHoveredStateKey] = useState<string | null>(null);

  // Simple SVG paths represent our stylized futuristic India Map
  // Coordinate space: width 400, height 500
  const statesLayout = [
    {
      key: "delhi",
      name: "Delhi",
      points: "185,115 195,115 195,125 185,125",
      center: { x: 190, y: 120 }
    },
    {
      key: "rajasthan",
      name: "Rajasthan",
      points: "95,120 155,115 165,160 140,195 90,175",
      center: { x: 125, y: 150 }
    },
    {
      key: "gujarat",
      name: "Gujarat",
      points: "45,195 95,190 105,225 125,245 80,260 55,230",
      center: { x: 80, y: 220 }
    },
    {
      key: "uttarpradesh",
      name: "Uttar Pradesh",
      points: "170,110 230,105 275,135 255,185 180,165 170,145",
      center: { x: 215, y: 140 }
    },
    {
      key: "bihar",
      name: "Bihar",
      points: "280,135 340,140 335,180 275,175",
      center: { x: 310, y: 160 }
    },
    {
      key: "westbengal",
      name: "West Bengal",
      points: "345,140 375,145 365,195 330,250 330,200",
      center: { x: 350, y: 210 }
    },
    {
      key: "madhyapradesh",
      name: "Madhya Pradesh",
      points: "120,195 180,175 250,190 260,240 185,255 135,240",
      center: { x: 190, y: 215 }
    },
    {
      key: "maharashtra",
      name: "Maharashtra",
      points: "95,260 180,255 215,280 205,335 125,325 105,295",
      center: { x: 155, y: 290 }
    },
    {
      key: "andhrapradesh",
      name: "Andhra Pradesh",
      points: "190,335 235,315 260,360 220,425 185,385",
      center: { x: 225, y: 370 }
    },
    {
      key: "karnataka",
      name: "Karnataka",
      points: "125,330 185,335 180,410 165,445 130,425 120,380",
      center: { x: 155, y: 385 }
    },
    {
      key: "kerala",
      name: "Kerala",
      points: "135,435 155,440 150,490 135,480",
      center: { x: 142, y: 465 }
    },
    {
      key: "tamilnadu",
      name: "Tamil Nadu",
      points: "165,440 185,415 210,460 190,495 165,485",
      center: { x: 185, y: 460 }
    }
  ];

  // Map Color Intensity computation based on Heatmap Mode
  const getStateColor = (stateKey: string, isHovered: boolean, isSelected: boolean) => {
    const data = indiaStatesData[stateKey];
    if (!data) return "fill-slate-800 stroke-slate-700";

    if (isSelected) return "fill-indigo-500/80 stroke-indigo-300 stroke-2 shadow-lg";

    if (heatmapMode === "urgency") {
      if (data.urgencyLevel === "HIGH") {
        return isHovered ? "fill-rose-500/60 stroke-rose-400" : "fill-rose-500/20 stroke-rose-600/40";
      }
      if (data.urgencyLevel === "MEDIUM") {
        return isHovered ? "fill-amber-500/60 stroke-amber-400" : "fill-amber-500/20 stroke-amber-600/40";
      }
      return isHovered ? "fill-emerald-500/60 stroke-emerald-400" : "fill-emerald-500/20 stroke-emerald-600/40";
    }

    if (heatmapMode === "volunteers") {
      const vol = data.volunteers;
      if (vol > 200) return isHovered ? "fill-teal-500/60 stroke-teal-400" : "fill-teal-500/25 stroke-teal-600/35";
      if (vol > 100) return isHovered ? "fill-teal-500/45 stroke-teal-400" : "fill-teal-500/15 stroke-teal-600/25";
      return isHovered ? "fill-teal-500/30 stroke-teal-400" : "fill-teal-500/5 stroke-teal-600/15";
    }

    if (heatmapMode === "ngos") {
      const ngo = data.ngos;
      if (ngo > 25) return isHovered ? "fill-sky-500/60 stroke-sky-400" : "fill-sky-500/25 stroke-sky-600/35";
      if (ngo > 12) return isHovered ? "fill-sky-500/45 stroke-sky-400" : "fill-sky-500/15 stroke-sky-600/25";
      return isHovered ? "fill-sky-500/30 stroke-sky-400" : "fill-sky-500/5 stroke-sky-600/15";
    }

    if (heatmapMode === "opportunity") {
      const idx = data.coverageIndex;
      // Green (>=75) -> Amber (>=50) -> Red (<50)
      if (idx >= 75) {
        return isHovered ? "fill-emerald-500/70 stroke-emerald-400" : "fill-emerald-500/20 stroke-emerald-600/30";
      }
      if (idx >= 50) {
        return isHovered ? "fill-amber-500/70 stroke-amber-400" : "fill-amber-500/20 stroke-amber-600/30";
      }
      return isHovered ? "fill-rose-600/80 stroke-rose-500" : "fill-rose-500/35 stroke-rose-600/40";
    }

    return "fill-slate-800 stroke-slate-700";
  };

  const activeStateData = selectedStateKey ? indiaStatesData[selectedStateKey] : null;

  // AI Volunteer Heat Intelligence calculations
  const getAIRecommendations = () => {
    // Determine the highest priority state
    const highUrgencyStates = Object.entries(indiaStatesData)
      .filter(([_, data]) => data.urgencyLevel === "HIGH")
      .sort((a, b) => a[1].coverageIndex - b[1].coverageIndex);

    if (highUrgencyStates.length > 0) {
      const [key, state] = highUrgencyStates[0];
      return {
        stateName: state.name,
        stateKey: key,
        coverageIndex: state.coverageIndex,
        text: `Critical Gap Detected: ${state.name} is reporting a high emergency volunteer deficit (Coverage Score: ${state.coverageIndex}%). Our recommendation is to deploy 20-30 regional volunteers with Healthcare & Logistics training immediately.`,
        action: `Route emergency personnel to ${state.name} core districts.`
      };
    }

    return {
      stateName: "All Regions",
      stateKey: "",
      coverageIndex: 80,
      text: "Standard Operations: National volunteer distributions are currently balanced. Maintain standard logistics and support current training camps.",
      action: "Review standby regional volunteers rosters."
    };
  };

  const aiRecommendation = getAIRecommendations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="india-map-container">
      {/* MAP VIEWPORT CARD (8 columns on desktop) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
        
        {/* Header and filters */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <MapPin className="text-indigo-400 w-5 h-5" />
              National Volunteer Heat Intelligence Map
            </h3>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-800/50">
              OFFLINE VECTOR ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Interactive heat map of India's volunteering activity. Click on any state below to view live coverage metrics and activate targeted AI dispatch routes.
          </p>
        </div>

        {/* Heatmap Mode Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs self-start">
          <button
            onClick={() => setHeatmapMode("urgency")}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              heatmapMode === "urgency"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Urgency / Deficit Hotspots
          </button>
          <button
            onClick={() => setHeatmapMode("volunteers")}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              heatmapMode === "volunteers"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Volunteer Density
          </button>
          <button
            onClick={() => setHeatmapMode("ngos")}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              heatmapMode === "ngos"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            NGO Activity Focus
          </button>
          <button
            onClick={() => setHeatmapMode("opportunity")}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              heatmapMode === "opportunity"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Opportunity Heatmap Layer
          </button>
        </div>

        {/* Map Display Frame */}
        <div className="flex justify-center items-center bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 h-[440px] relative">
          <svg
            viewBox="0 0 400 500"
            className="w-full h-full max-h-[400px] select-none"
            style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.4))" }}
          >
            {/* Background Map Grids */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Render Styled Polygon States */}
            {statesLayout.map((st) => {
              const isHovered = hoveredStateKey === st.key;
              const isSelected = selectedStateKey === st.key;
              const hasData = !!indiaStatesData[st.key];

              return (
                <g key={st.key}>
                  <polygon
                    points={st.points}
                    className={`transition-all duration-300 cursor-pointer stroke-[1.5px] ${getStateColor(
                      st.key,
                      isHovered,
                      isSelected
                    )}`}
                    onClick={() => {
                      if (hasData) {
                        onSetSelectedStateKey(st.key);
                        if (onStateSelect) {
                          onStateSelect(st.key, indiaStatesData[st.key]);
                        }
                      }
                    }}
                    onMouseEnter={() => setHoveredStateKey(st.key)}
                    onMouseLeave={() => setHoveredStateKey(null)}
                  />
                  {/* State Name Labels */}
                  <text
                    x={st.center.x}
                    y={st.center.y}
                    className="fill-slate-400 text-[10px] font-mono pointer-events-none select-none text-center font-medium opacity-70"
                    textAnchor="middle"
                  >
                    {st.name}
                  </text>
                </g>
              );
            })}

            {/* Radar Sweep Effect on High Urgency zones */}
            {Object.entries(indiaStatesData)
              .filter(([_, data]) => data.urgencyLevel === "HIGH")
              .map(([key]) => {
                const layout = statesLayout.find(l => l.key === key);
                if (!layout) return null;
                return (
                  <circle
                    key={`pulse-${key}`}
                    cx={layout.center.x}
                    cy={layout.center.y}
                    r="8"
                    className="fill-rose-500/20 stroke-rose-500 animate-ping pointer-events-none"
                    strokeWidth="1"
                  />
                );
              })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredStateKey && indiaStatesData[hoveredStateKey] && (
            <div className="absolute top-4 left-4 bg-slate-900/95 border border-slate-800 text-xs text-slate-100 p-3 rounded-xl shadow-xl pointer-events-none z-10 backdrop-blur-md max-w-[280px]">
              <div className="font-bold border-b border-slate-800 pb-1 mb-1.5 text-slate-200 flex justify-between items-center gap-2">
                <span>{indiaStatesData[hoveredStateKey].name}</span>
                <span className="text-[9px] font-mono font-normal text-slate-500">Coverage: {indiaStatesData[hoveredStateKey].coverageIndex}%</span>
              </div>
              <div className="space-y-0.5">
                <div>Volunteers: <span className="font-mono text-indigo-400 font-semibold">{indiaStatesData[hoveredStateKey].volunteers}</span></div>
                <div>NGO Partners: <span className="font-mono text-indigo-400 font-semibold">{indiaStatesData[hoveredStateKey].ngos}</span></div>
                <div>Active Events: <span className="font-mono text-indigo-400 font-semibold">{indiaStatesData[hoveredStateKey].events}</span></div>
                <div className="mb-2">Urgency Index: <span className={`font-mono font-bold ${
                  indiaStatesData[hoveredStateKey].urgencyLevel === "HIGH" ? "text-rose-400" :
                  indiaStatesData[hoveredStateKey].urgencyLevel === "MEDIUM" ? "text-amber-400" : "text-emerald-400"
                }`}>{indiaStatesData[hoveredStateKey].urgencyLevel}</span></div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[9px] text-amber-400 font-bold block mb-0.5 uppercase tracking-wider font-mono">🤖 AI Recommendation:</span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  {indiaStatesData[hoveredStateKey].coverageIndex < 45 
                    ? `Critical volunteer shortage! CSR teams should deploy immediate relief & healthcare sponsorship camps here next.`
                    : indiaStatesData[hoveredStateKey].coverageIndex < 75
                    ? `Moderate volunteer presence. Excellent sector to launch active digital infrastructure classes or waste management workshops.`
                    : `Stable staffing. Good target for specialized NGO expert webinars and online training certifications.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 border-t border-slate-800/60 pt-3">
          {heatmapMode === "opportunity" ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Deficit Hotspots Index:</span>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-900/60">Red (Deficit, &lt;50%)</span>
                <span className="text-slate-600">→</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-900/60">Amber (Moderate, &gt;=50%)</span>
                <span className="text-slate-600">→</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 font-mono">Green (Adequate, &gt;=75%)</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/30 border border-rose-500"></span>
                <span>High Urgency / Shortage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500"></span>
                <span>Moderate Coverage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500"></span>
                <span>Adequate Coverage</span>
              </div>
            </div>
          )}
          <div className="text-[10px] text-indigo-300 font-mono">
            *Offline simulation: Does not require active GPS coordinates.
          </div>
        </div>
      </div>

      {/* METRICS & AI RECOMMENDATION SIDEBAR (5 columns on desktop) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Selected State Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          {activeStateData ? (
            <div>
              <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">SELECTED REGION</span>
                  <h4 className="text-xl font-bold text-slate-100">{activeStateData.name} State</h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  activeStateData.urgencyLevel === "HIGH" ? "bg-rose-950/50 text-rose-300 border border-rose-800" :
                  activeStateData.urgencyLevel === "MEDIUM" ? "bg-amber-950/50 text-amber-300 border border-amber-800" :
                  "bg-emerald-950/50 text-emerald-300 border border-emerald-800"
                }`}>
                  {activeStateData.urgencyLevel} RISK STATUS
                </span>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Registered Volunteers
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">{activeStateData.volunteers}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    Active NGO Partners
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">{activeStateData.ngos}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Campaigns Hosted
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">{activeStateData.events}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Coverage Index
                  </div>
                  <div className="text-lg font-bold text-slate-100 font-mono">{activeStateData.coverageIndex}%</div>
                </div>
              </div>

              {/* Progress Bar of Coverage Score */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Resource Sufficiency</span>
                  <span className="text-indigo-400 font-mono font-bold">{activeStateData.coverageIndex}/100</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500"
                    style={{ width: `${activeStateData.coverageIndex}%` }}
                  ></div>
                </div>
              </div>

              <button 
                onClick={() => {
                  onSetSelectedStateKey(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 border border-slate-800 py-2 rounded-lg hover:bg-slate-800/30 transition-all font-mono"
              >
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Info className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="text-slate-200 font-medium text-sm mb-1">No Active State Selected</h4>
              <p className="text-xs text-slate-500 max-w-[240px]">
                Hover and click on any state polygon in the map to render localized analytics and coverage profiles.
              </p>
            </div>
          )}
        </div>

        {/* AI Volunteer Heat Intelligence Layer Recommendation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-teal-500"></div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-800/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-slate-100 text-sm">AI Heat Intelligence Advisory</h4>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-2 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              PRIORITY DESPATCH ALERT
            </div>
            <h5 className="font-bold text-slate-200 text-sm mb-1">
              Target Zone: {aiRecommendation.stateName}
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {aiRecommendation.text}
            </p>
            <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/60 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Coverage Deficit Rank: <span className="text-rose-400 font-bold font-mono">#{10 - Math.round(aiRecommendation.coverageIndex/10)}</span>
              </div>
              <span className="text-[10px] text-teal-400 bg-teal-950/30 border border-teal-800 px-2 py-0.5 rounded font-mono font-semibold">
                BIAS AUDITED OK
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-800/50 leading-relaxed">
            <span className="font-bold text-slate-400">Why this advice is generated:</span> Our offline dispatch model evaluates the ratio of local registered NGOs against matching volunteer rosters. Bihar and Rajasthan represent high deficit risks due to rapid healthcare campaign scaling in rural zones.
          </div>
        </div>
      </div>
    </div>
  );
}

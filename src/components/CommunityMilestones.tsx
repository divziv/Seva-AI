import React, { useState } from "react";
import { Sparkles, Award, TrendingUp, Users, HeartHandshake, CheckCircle2, Leaf, Heart, Trash2, Clock } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  icon: React.ComponentType<any>;
  color: string;
  badgeName: string;
  badgeDesc: string;
  badgeIcon: React.ComponentType<any>;
}

export default function CommunityMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: "m1",
      title: "Coastal & River Plastic Recovery",
      target: 5000,
      current: 3850,
      unit: "kg",
      icon: Trash2,
      color: "bg-cyan-500",
      badgeName: "Ocean Cleanse Champion",
      badgeDesc: "Awarded to the coalition for recycling over 4,000 kg of marine plastic.",
      badgeIcon: Sparkles
    },
    {
      id: "m2",
      title: "Rural Health & Sanitation Camps",
      target: 100,
      current: 85,
      unit: "Camps",
      icon: Heart,
      color: "bg-rose-500",
      badgeName: "Rural Health Guard",
      badgeDesc: "Awarded to the team for setting up over 80 rural medicine campaigns.",
      badgeIcon: HeartHandshake
    },
    {
      id: "m3",
      title: "Western Ghats Afforestation Drive",
      target: 10000,
      current: 7420,
      unit: "Trees",
      icon: Leaf,
      color: "bg-emerald-500",
      badgeName: "Sustained Canopy Sponsor",
      badgeDesc: "Granted for nurturing over 7,500 saplings in deforested soil zones.",
      badgeIcon: Leaf
    },
    {
      id: "m4",
      title: "Ecosystem Active SDG Hours",
      target: 15000,
      current: 11200,
      unit: "Hours",
      icon: Clock,
      color: "bg-indigo-500",
      badgeName: "Centennial Pillar Force",
      badgeDesc: "Honoring over 12,000 collective volunteer hours on the national grid.",
      badgeIcon: Award
    }
  ]);

  const [simulationLog, setSimulationLog] = useState<string[]>(["Ecosystem tracking initiated for FY 2026."]);

  // Simulate progress contribution
  const handleSimulateContribution = () => {
    setMilestones(prev => 
      prev.map(m => {
        let added = 0;
        if (m.id === "m1") added = 150; // kg
        if (m.id === "m2") added = 3;   // Camps
        if (m.id === "m3") added = 280; // Trees
        if (m.id === "m4") added = 400; // Hours

        const nextCurrent = Math.min(m.current + added, m.target);
        
        // Log milestone completion
        if (nextCurrent >= m.target && m.current < m.target) {
          setSimulationLog(logs => [
            `🎉 GOAL REACHED! "${m.title}" has been 100% completed! UNLOCKED: "${m.badgeName}" Badge!`,
            ...logs
          ]);
        }
        
        return {
          ...m,
          current: nextCurrent
        };
      })
    );

    setSimulationLog(logs => [
      `⚡ CSR Simulated Dispatch: Added +150 kg plastics, +3 health camps, +280 trees, and +400 volunteer hours directly to public ledger records!`,
      ...logs.slice(0, 4)
    ]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="community-milestones-bento">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Ecosystem Goals Tracker
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
              SDG 11 & 17
            </span>
          </div>
          <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="text-indigo-400 w-5 h-5" />
            National Community Milestones
          </h4>
          <p className="text-xs text-slate-400">
            Unified group achievements of volunteers, NGOs, and CSR departments toward annual climate and social health targets.
          </p>
        </div>

        <button
          onClick={handleSimulateContribution}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Simulate Impact Check-in
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Tracker (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          {milestones.map(m => {
            const percent = Math.round((m.current / m.target) * 100);
            const isCompleted = m.current >= m.target;
            const IconComponent = m.icon;

            return (
              <div key={m.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200`}>
                      <IconComponent className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{m.title}</h5>
                      <span className="text-[10px] text-slate-500">
                        {m.current.toLocaleString()} / {m.target.toLocaleString()} {m.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${isCompleted ? "text-emerald-400" : "text-indigo-400"}`}>
                      {percent}%
                    </span>
                    {isCompleted && (
                      <span className="text-[9px] text-emerald-400 font-mono block font-bold leading-none">GOAL COMPLETED</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 relative">
                  <div
                    className={`${m.color} h-full transition-all duration-700 relative rounded-full`}
                    style={{ width: `${percent}%` }}
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-white/40 animate-pulse"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Celebratory Badge Showcase (4 columns) */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-850 relative">
          <div>
            <h5 className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider font-mono text-center">
              Active Award Badge Collection
            </h5>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {milestones.map(m => {
                const percent = (m.current / m.target) * 100;
                const unlocked = percent >= 80; // Unlocks at 80% contribution
                const BadgeIcon = m.badgeIcon;

                return (
                  <div
                    key={`b-${m.id}`}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center transition-all group relative ${
                      unlocked 
                        ? "bg-slate-900 border-indigo-500/40 text-indigo-300" 
                        : "bg-slate-900/40 border-slate-850 text-slate-500 opacity-40 grayscale"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-1.5 ${
                      unlocked ? "bg-indigo-950 text-indigo-400 border border-indigo-800" : "bg-slate-950 text-slate-600"
                    }`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold truncate max-w-full leading-tight">{m.badgeName}</span>
                    <span className="text-[8px] font-mono block text-slate-500 mt-0.5">
                      {unlocked ? "Unlocked" : `${Math.round(percent)}% / 80%`}
                    </span>

                    {/* Tooltip detail */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-slate-950 border border-slate-800 p-2 rounded-lg text-[9px] text-slate-400 leading-tight hidden group-hover:block z-10 shadow-xl pointer-events-none">
                      <span className="font-bold text-indigo-300 block mb-0.5">{m.badgeName}</span>
                      {m.badgeDesc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-500 h-20 overflow-y-auto space-y-1">
            <span className="text-[8px] text-slate-400 font-bold block border-b border-slate-850 pb-0.5 mb-1 uppercase">
              Simulation Ledger Feed
            </span>
            {simulationLog.map((log, idx) => (
              <div key={idx} className="leading-tight break-words">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

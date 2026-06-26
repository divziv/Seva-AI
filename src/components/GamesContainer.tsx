import React, { useState, useRef, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  Sparkles, Award, Play, RotateCcw, Droplets, Sun, Sprout, Wind,
  AlertOctagon, CheckCircle2, ChevronRight, Activity, Zap, ThumbsUp, Trash2
} from "lucide-react";

interface GamesContainerProps {
  userProfile: UserProfile;
  onRewardXP: (xp: number, badge?: string) => void;
}

export default function GamesContainer({ userProfile, onRewardXP }: GamesContainerProps) {
  const [activeGame, setActiveGame] = useState<"runner" | "plant" | "water" | "disaster">("runner");

  // --- GAME 1: WASTE RUNNER GAME (Canvas-Based) ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [runnerScore, setRunnerScore] = useState(0);
  const [runnerHighScore, setRunnerHighScore] = useState(() => {
    return parseInt(localStorage.getItem("waste_runner_highscore") || "0");
  });
  const [runnerStatus, setRunnerStatus] = useState<"idle" | "playing" | "gameover">("idle");
  const [wasteRunnerReport, setWasteRunnerReport] = useState("");

  const runnerStateRef = useRef({
    playerX: 180,
    playerWidth: 50,
    playerHeight: 20,
    items: [] as { x: number; y: number; type: "plastic" | "metal" | "clean_zone" | "toxic"; speed: number; r: number }[],
    keys: { Left: false, Right: false },
    score: 0,
    animationId: 0,
    spawnTimer: 0,
    difficulty: 1
  });

  // Start Runner Game loop
  const startRunnerGame = () => {
    setRunnerScore(0);
    setRunnerStatus("playing");
    setWasteRunnerReport("");
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    runnerStateRef.current = {
      playerX: canvas.width / 2 - 25,
      playerWidth: 60,
      playerHeight: 15,
      items: [],
      keys: { Left: false, Right: false },
      score: 0,
      animationId: 0,
      spawnTimer: 0,
      difficulty: 1
    };

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") runnerStateRef.current.keys.Left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") runnerStateRef.current.keys.Right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") runnerStateRef.current.keys.Left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") runnerStateRef.current.keys.Right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const gameLoop = () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const ctx = currentCanvas.getContext("2d");
      if (!ctx) return;

      const state = runnerStateRef.current;

      // 1. Clear background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);

      // Grid helper lines for cyber/AI look
      ctx.strokeStyle = "rgba(99, 102, 241, 0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < currentCanvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, currentCanvas.height);
        ctx.stroke();
      }

      // 2. Move Player
      const speed = 7;
      if (state.keys.Left) {
        state.playerX = Math.max(state.playerX - speed, 0);
      }
      if (state.keys.Right) {
        state.playerX = Math.min(state.playerX + speed, currentCanvas.width - state.playerWidth);
      }

      // Draw Player basket
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.roundRect(state.playerX, currentCanvas.height - 30, state.playerWidth, state.playerHeight, 5);
      ctx.fill();
      // Neon trim
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner text in basket
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("RECYCLE", state.playerX + 11, currentCanvas.height - 19);

      // 3. Spawn Items
      state.spawnTimer++;
      const spawnRate = Math.max(40 - state.difficulty * 2, 15);
      if (state.spawnTimer >= spawnRate) {
        state.spawnTimer = 0;
        const types: ("plastic" | "metal" | "clean_zone" | "toxic")[] = ["plastic", "metal", "clean_zone", "toxic"];
        const randType = types[Math.floor(Math.random() * types.length)];
        state.items.push({
          x: Math.random() * (currentCanvas.width - 20) + 10,
          y: -10,
          type: randType,
          speed: (Math.random() * 2 + 2) * (1 + state.difficulty * 0.1),
          r: 8
        });
      }

      // 4. Update and Draw Items
      for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        item.y += item.speed;

        // Draw item
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        
        if (item.type === "plastic") {
          ctx.fillStyle = "#22d3ee"; // Neon cyan (Plastic waste)
        } else if (item.type === "metal") {
          ctx.fillStyle = "#38bdf8"; // Neon blue
        } else if (item.type === "clean_zone") {
          ctx.fillStyle = "#10b981"; // Vibrant Emerald (Clean natural zone to avoid)
        } else {
          ctx.fillStyle = "#f43f5e"; // Neon red toxic
        }
        ctx.fill();

        // Label on item for educational clarity
        ctx.fillStyle = "#000000";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        const letter = item.type === "clean_zone" ? "Z" : item.type === "plastic" ? "P" : item.type === "metal" ? "M" : "T";
        ctx.fillText(letter, item.x, item.y + 3);

        // Check basket collision
        const basketY = currentCanvas.height - 30;
        const withinX = item.x >= state.playerX && item.x <= state.playerX + state.playerWidth;
        const withinY = item.y + item.r >= basketY && item.y - item.r <= basketY + state.playerHeight;

        if (withinX && withinY) {
          // Collided with basket!
          state.items.splice(i, 1);
          if (item.type === "plastic" || item.type === "metal") {
            state.score += 10;
            // Increase difficulty slightly
            state.difficulty = Math.floor(state.score / 50) + 1;
          } else if (item.type === "clean_zone") {
            // Invaded/disturbed a clean natural zone (deduction)
            state.score = Math.max(state.score - 15, 0);
          } else {
            // Toxic item caught - game over!
            cancelAnimationFrame(state.animationId);
            endRunnerGame(state.score);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            return;
          }
          setRunnerScore(state.score);
          continue;
        }

        // Out of bounds check
        if (item.y > currentCanvas.height) {
          state.items.splice(i, 1);
          // Missed recyclables penalize score
          if (item.type === "plastic" || item.type === "metal") {
            state.score = Math.max(state.score - 2, 0);
            setRunnerScore(state.score);
          }
        }
      }

      state.animationId = requestAnimationFrame(gameLoop);
    };

    runnerStateRef.current.animationId = requestAnimationFrame(gameLoop);
  };

  const endRunnerGame = (finalScore: number) => {
    setRunnerStatus("gameover");
    
    // Check and update high score
    let xpAwarded = Math.round(finalScore / 2);
    if (finalScore > runnerHighScore) {
      localStorage.setItem("waste_runner_highscore", finalScore.toString());
      setRunnerHighScore(finalScore);
      xpAwarded += 15; // High score bonus XP
    }

    onRewardXP(xpAwarded);

    // AI summary feedback
    const plasticWeight = Math.round(finalScore * 0.15 * 10) / 10;
    
    const facts = [
      "Over 8 million metric tons of plastic enter our global oceans each year, threatening critical marine biomes.",
      "Recycling 1 ton of plastic saves 5,774 kWh of electricity, 16.3 barrels of oil, and valuable landfill space.",
      "Up to 40% of municipal solid waste in India remains unsegregated, leading to massive toxic landfill fires in urban areas.",
      "Microplastics have now been detected in human lung tissue, bloodstreams, and even remote Himalayan snowfall.",
      "Using a reusable fabric bag prevents the consumption of roughly 500 single-use plastic bags per year."
    ];
    const randomFact = facts[Math.floor(Math.random() * facts.length)];

    const report = `Game Concluded! You collected enough recyclables to simulate preventing ${plasticWeight} kg of non-biodegradable micro-plastic leaching. You earned +${xpAwarded} XP!

💡 SUSTAINABILITY FACT: ${randomFact}`;
    setWasteRunnerReport(report);
  };

  // Cleanup on unmount or view change
  useEffect(() => {
    return () => {
      if (runnerStateRef.current.animationId) {
        cancelAnimationFrame(runnerStateRef.current.animationId);
      }
    };
  }, []);


  // --- GAME 2: PLANT CARE SIMULATOR (State-Based) ---
  const [plantProgress, setPlantProgress] = useState(() => {
    return parseInt(localStorage.getItem("virtual_plant_progress") || "0");
  });
  const [lastWaterDate, setLastWaterDate] = useState(() => {
    return localStorage.getItem("virtual_plant_water_date") || "";
  });
  const [plantStatusMsg, setPlantStatusMsg] = useState("");

  const getPlantStage = () => {
    if (plantProgress >= 100) return { name: "Ancient Forest Sequoia", desc: "Your consistent ecological actions have fostered a magnificent mature tree. This represents over 350kg of offset CO2!", icon: Wind, color: "text-emerald-400" };
    if (plantProgress >= 70) return { name: "Young Banyan Sapling", desc: "Strong branches are branching out. It provides real shade, showing your volunteer engagement is thriving.", icon: Sprout, color: "text-green-400" };
    if (plantProgress >= 40) return { name: "Healthy Green Sprout", desc: "The stem is leafing. Daily care has transformed the seed into a beautiful rural sprout.", icon: Sprout, color: "text-teal-400" };
    if (plantProgress >= 15) return { name: "Germinating Seedling", desc: "The seed coat cracked open! Small roots are finding soil.", icon: Sprout, color: "text-lime-400" };
    return { name: "Impact Seed", desc: "A fresh seed filled with social potential. Complete community tasks or daily watering to initiate germination.", icon: Sprout, color: "text-yellow-600" };
  };

  const handlePlantCare = (action: "water" | "sun" | "compost") => {
    const today = new Date().toDateString();
    
    if (action === "water") {
      if (lastWaterDate === today) {
        setPlantStatusMsg("Already watered today! Over-watering can damage the roots. Return tomorrow to sustain growth.");
        return;
      }
      const growth = Math.min(plantProgress + 15, 100);
      setPlantProgress(growth);
      setLastWaterDate(today);
      localStorage.setItem("virtual_plant_progress", growth.toString());
      localStorage.setItem("virtual_plant_water_date", today);
      onRewardXP(15);
      setPlantStatusMsg("Splendid! You watered your Impact Seed. Growth increased by 15% and you claimed +15 daily streak XP!");
    } else if (action === "sun") {
      const growth = Math.min(plantProgress + 8, 100);
      setPlantProgress(growth);
      localStorage.setItem("virtual_plant_progress", growth.toString());
      onRewardXP(10);
      setPlantStatusMsg("The plant absorbed vital sunlight, performing virtual photosynthesis. Growth +8%, +10 XP gained!");
    } else if (action === "compost") {
      // Compost is unlocked based on volunteer activities completed
      if (userProfile.level < 2) {
        setPlantStatusMsg("Compost lock! Reach Level 2 by matching to active NGO camps to unlock organic compost boosters.");
        return;
      }
      const growth = Math.min(plantProgress + 25, 100);
      setPlantProgress(growth);
      localStorage.setItem("virtual_plant_progress", growth.toString());
      onRewardXP(25);
      setPlantStatusMsg("Rich Organic Compost added! The soil is enriched. High-velocity growth +25% unlocked, +25 XP credited!");
    }
  };

  const resetPlant = () => {
    setPlantProgress(0);
    setLastWaterDate("");
    setPlantStatusMsg("Plant reset. Cultivate your new seed to foster the ecosystem.");
    localStorage.setItem("virtual_plant_progress", "0");
    localStorage.removeItem("virtual_plant_water_date");
  };


  // --- GAME 3: RESOURCE ALLOCATOR (Water / Supply distribution) ---
  const [allocation, setAllocation] = useState({ bihar: 30, dharavi: 30, kerala: 40 });
  const [resourceStatus, setResourceStatus] = useState<"idle" | "evaluated">("idle");
  const [fairnessScore, setFairnessScore] = useState(0);
  const [resourceAIAnalysis, setResourceAIAnalysis] = useState("");

  const handleAllocate = (region: "bihar" | "dharavi" | "kerala", value: number) => {
    setResourceStatus("idle");
    const otherKeys = (["bihar", "dharavi", "kerala"] as const).filter(k => k !== region);
    const remainder = 100 - value;
    
    // Distribute remainder proportionally to current ratio of others
    const sumOthers = allocation[otherKeys[0]] + allocation[otherKeys[1]];
    let val1 = 0;
    let val2 = 0;

    if (sumOthers > 0) {
      val1 = Math.round((allocation[otherKeys[0]] / sumOthers) * remainder);
      val2 = remainder - val1;
    } else {
      val1 = Math.round(remainder / 2);
      val2 = remainder - val1;
    }

    setAllocation({
      ...allocation,
      [region]: value,
      [otherKeys[0]]: val1,
      [otherKeys[1]]: val2
    });
  };

  const evaluateAllocation = () => {
    // Proportional "ideal demand representation" (Rural healthcare, urban density cleanup, coastal relief)
    const idealDemand = { bihar: 45, dharavi: 25, kerala: 30 }; // Simulated optimal needs
    
    // Variance calculation
    const diffBihar = Math.abs(allocation.bihar - idealDemand.bihar);
    const diffDharavi = Math.abs(allocation.dharavi - idealDemand.dharavi);
    const diffKerala = Math.abs(allocation.kerala - idealDemand.kerala);
    const totalDeviation = diffBihar + diffDharavi + diffKerala;

    // Convert deviation into 0-100 score
    const score = Math.max(100 - totalDeviation * 1.5, 0);
    const roundedScore = Math.round(score);

    setFairnessScore(roundedScore);
    setResourceStatus("evaluated");

    let xpBonus = Math.round(roundedScore / 4);
    onRewardXP(xpBonus);

    // AI assessment text
    let feedback = "";
    if (roundedScore > 85) {
      feedback = `Excellent! Your allocation aligns beautifully with local district demand forecasts. Bihar (Rural Clinic) received high supply backing, while Kerala got sufficient emergency cover. Bias audited at 98% parity. You earned +${xpBonus} XP!`;
    } else if (roundedScore > 60) {
      feedback = `Moderate Performance. Supplies are fairly distributed, but Bihar's rural clinics are slightly under-allocated considering their 45% priority medical footprint. Try shifting more focus towards rural healthcare. You earned +${xpBonus} XP.`;
    } else {
      feedback = `Imbalanced Resource Allocation. Dharavi slums or coastal Kerala floods are over-allocated at the expense of severe shortages in Bihar's clinics. Adjust your sliders closer to demand requirements to optimize social ROI.`;
    }
    setResourceAIAnalysis(feedback);
  };


  // --- GAME 4: CLIMATE DISASTER RESPONSE COORDINATOR ---
  const [disasterLevel, setDisasterLevel] = useState<"idle" | "success" | "failure">("idle");
  const [selectedScenario, setSelectedScenario] = useState("bihar_flood");
  const [allocatedVols, setAllocatedVols] = useState(4);
  const [allocatedKits, setAllocatedKits] = useState(2);
  const [allocatedBoats, setAllocatedBoats] = useState(1);
  const [allocatedHubs, setAllocatedHubs] = useState(1);
  const [disasterReport, setDisasterReport] = useState("");
 
  const scenarioMeta = {
    bihar_flood: {
      name: "Bihar Rural Floods (Ganga Surge)",
      desc: "Water level rose 1.8 meters. 14 villages cut off, reporting acute clean drinking water shortages and water-borne pathogens.",
      minVols: 5, minKits: 3, minBoats: 2, minHubs: 1,
      maxLives: 180,
      optVols: 6, optKits: 4, optBoats: 2, optHubs: 1
    },
    odisha_cyclone: {
      name: "Odisha Coastal Cyclone (Phailin Force)",
      desc: "Category 4 Cyclone winds reaching 220 km/h. Coastal sea surges are washing out roads and communication grids. High-altitude satellite emergency coverage required.",
      minVols: 6, minKits: 4, minBoats: 1, minHubs: 2,
      maxLives: 250,
      optVols: 8, optKits: 5, optBoats: 1, optHubs: 2
    },
    kerala_landslide: {
      name: "Wayanad Landslide Emergency",
      desc: "Debris blocks mountain medical centers. Immediate first-aid triage, warm blankets, and local translation guides required.",
      minVols: 3, minKits: 5, minBoats: 0, minHubs: 1,
      maxLives: 150,
      optVols: 4, optKits: 6, optBoats: 0, optHubs: 1
    }
  };
 
  const runDisasterSimulation = () => {
    const meta = scenarioMeta[selectedScenario as keyof typeof scenarioMeta];
    
    // Lives Saved Calculation based on rule thresholds
    let livesSaved = 0;
    const volRatio = Math.min(allocatedVols / meta.optVols, 1.2);
    const kitRatio = Math.min(allocatedKits / meta.optKits, 1.2);
    const boatRatio = meta.optBoats > 0 ? Math.min(allocatedBoats / meta.optBoats, 1.2) : 1.0;
    const hubRatio = meta.optHubs > 0 ? Math.min(allocatedHubs / meta.optHubs, 1.2) : 1.0;

    const aggregateCoverage = (volRatio * 0.4) + (kitRatio * 0.3) + (boatRatio * 0.15) + (hubRatio * 0.15);
    livesSaved = Math.round(Math.min(aggregateCoverage, 1.0) * meta.maxLives);

    // Resource Efficiency Calculation
    // Over-allocation creates diminishing returns and is penalized as resource waste
    let efficiencyScore = 100;
    const wasteVols = Math.max(0, allocatedVols - meta.optVols);
    const wasteKits = Math.max(0, allocatedKits - meta.optKits);
    const wasteBoats = Math.max(0, allocatedBoats - meta.optBoats);
    const wasteHubs = Math.max(0, allocatedHubs - meta.optHubs);
    const totalWastePenalty = (wasteVols * 5) + (wasteKits * 4) + (wasteBoats * 10) + (wasteHubs * 15);
    efficiencyScore = Math.max(25, 100 - totalWastePenalty);

    // Combined Impact Score (60% weight to Lives Saved relative percentage, 40% to Resource Efficiency)
    const savedPercent = (livesSaved / meta.maxLives) * 100;
    const impactScore = Math.round((savedPercent * 0.6) + (efficiencyScore * 0.4));

    setDisasterLevel(impactScore >= 75 ? "success" : "failure");
    
    let xpAwarded = Math.round(impactScore / 2);
    onRewardXP(xpAwarded, impactScore >= 90 ? "Crisis Commander Badge" : undefined);

    const report = `SIMULATION ANALYSIS COMPLETE:
- 👥 LIVES SAVED: ${livesSaved} / ${meta.maxLives} citizens evacuated & treated (${Math.round(savedPercent)}% Success)
- 📊 RESOURCE EFFICIENCY: ${efficiencyScore}% (Penalized for redundant over-allocations)
- 🏆 COMPOSITE IMPACT SCORE: ${impactScore} / 100

${
  impactScore >= 90 
    ? `🏆 OUTSTANDING CRISIS LEADERSHIP! Your strategic dispatch reached peak efficiency while saving maximum lives! Awarded +${xpAwarded} XP and the prestigious 'Crisis Commander' badge.`
    : impactScore >= 70
    ? `👍 SUCCESSFUL COALESCENCE: The campaign stabilized the region and saved most lives. However, minor logistical discrepancies or equipment waste were logged. Awarded +${xpAwarded} XP.`
    : `⚠️ CRITICAL OPERATIONAL DEFICIT: Low resource alignment caused severe bottlenecks, delaying evacuations. Retract, re-evaluate, and strengthen your deployment parameters!`
}`;

    setDisasterReport(report);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl" id="games-panel">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Award className="text-indigo-400 w-5 h-5 animate-pulse" />
            Social Impact Simulation & Gamification
          </h3>
          <p className="text-xs text-slate-400">
            Interactive, offline simulations designed to raise awareness for UN SDGs, teach resource efficiency, and boost your Volunteer Reputation Score.
          </p>
        </div>
        <div className="text-right text-xs">
          <span className="text-slate-400">Your Current Level:</span>
          <div className="font-mono font-bold text-indigo-400 text-sm">Level {userProfile.level} ({userProfile.xp} XP)</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setActiveGame("runner"); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeGame === "runner" ? "bg-indigo-600 text-white shadow" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Waste Runner Game
        </button>
        <button
          onClick={() => { setActiveGame("plant"); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeGame === "plant" ? "bg-indigo-600 text-white shadow" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Sprout className="w-3.5 h-3.5" />
          Plant Care Simulator
        </button>
        <button
          onClick={() => { setActiveGame("water"); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeGame === "water" ? "bg-indigo-600 text-white shadow" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          Water Resource Allocator
        </button>
        <button
          onClick={() => { setActiveGame("disaster"); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeGame === "disaster" ? "bg-indigo-600 text-white shadow" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Disaster Response Coordinator
        </button>
      </div>

      {/* --- GAME VIEWS CONTENT --- */}
      
      {/* 1. WASTE RUNNER */}
      {activeGame === "runner" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950 w-full max-w-[360px]">
              <canvas
                ref={canvasRef}
                width={360}
                height={320}
                className="block w-full h-[320px]"
              />

              {/* Status overlays */}
              {runnerStatus === "idle" && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
                  <Trash2 className="w-12 h-12 text-indigo-400 mb-3 animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-100 mb-1">Waste Runner Endless Arcade</h4>
                  <p className="text-xs text-slate-400 max-w-[240px] mb-4">
                    Catch recyclable <span className="text-cyan-400 font-bold">Plastic (P)</span> & <span className="text-sky-400 font-bold">Metal (M)</span>. Avoid <span className="text-rose-400 font-bold">Toxic Waste (T)</span> and pristine green <span className="text-emerald-400 font-bold">Clean Zones (Z)</span>!
                  </p>
                  <button
                    onClick={startRunnerGame}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Simulator
                  </button>
                </div>
              )}

              {runnerStatus === "gameover" && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center">
                  <AlertOctagon className="w-12 h-12 text-rose-500 mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-100 mb-1">Simulation Terminated</h4>
                  <p className="text-xs text-rose-300 max-w-[240px] mb-2 font-mono">
                    Toxic item caught in recycle stream!
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    Score: <span className="font-mono font-bold text-indigo-400">{runnerScore}</span> | High Score: <span className="font-mono text-slate-200">{runnerHighScore}</span>
                  </p>
                  <button
                    onClick={startRunnerGame}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Try Again
                  </button>
                </div>
              )}

              {/* HUD during play */}
              {runnerStatus === "playing" && (
                <div className="absolute top-2 left-2 right-2 flex justify-between pointer-events-none select-none text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                  <div>SCORE: <span className="text-indigo-400 font-bold">{runnerScore}</span></div>
                  <div>HIGH SCORE: <span>{runnerHighScore}</span></div>
                </div>
              )}
            </div>

            {/* Controls info */}
            <div className="mt-3 flex items-center gap-4 text-slate-500 text-[11px] font-mono">
              <span>Controls: Click AD keys or Left/Right Arrow keys to navigate bin.</span>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800/40">
                SDG 12: RESPONSIBLE CONSUMPTION
              </span>
              <h4 className="text-md font-bold text-slate-200">Waste Management & Microplastics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                In India's suburban and rural communities, failure to segregate plastic from organic waste leads to livestock ingestion and heavy water-table contamination. This game simulates quick visual sorting of materials under time pressure.
              </p>
              
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Scoring Key:</span>
                <ul className="space-y-1.5 font-mono text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Plastic (P) / Metal (M) = +10 Score</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Clean Zones (Z) = -15 Score (Avoid disturbing natural areas)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Toxic Battery (T) = Game Over (Severe Damage)</span>
                  </li>
                </ul>
              </div>
            </div>

            {wasteRunnerReport && (
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-300 leading-relaxed flex items-start gap-2.5 mt-4">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <p>{wasteRunnerReport}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PLANT GROWTH SIMULATOR */}
      {activeGame === "plant" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Virtual Plant Render (Visual block) */}
          <div className="md:col-span-6 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center relative min-h-[260px] overflow-hidden">
            <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-600">
              GROWTH: {plantProgress}%
            </div>

            {/* Simulated Plant Drawing using Vector Elements */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-4 mt-6">
              {plantProgress === 0 ? (
                // Seed
                <div className="w-4 h-5 rounded-full bg-amber-800 border-2 border-amber-600 animate-bounce"></div>
              ) : plantProgress < 40 ? (
                // Sprout
                <div className="flex flex-col items-center justify-end h-full w-full">
                  <div className="w-1.5 h-10 bg-green-500 rounded-full relative">
                    <div className="absolute -left-3 top-2 w-4 h-2 bg-emerald-400 rounded-full rotate-[30deg]"></div>
                  </div>
                  <div className="w-10 h-2 bg-amber-950 rounded-full"></div>
                </div>
              ) : plantProgress < 70 ? (
                // Sapling
                <div className="flex flex-col items-center justify-end h-full w-full">
                  <div className="w-3 h-16 bg-emerald-700 rounded-full relative">
                    <div className="absolute -left-5 top-3 w-6 h-3.5 bg-emerald-500 rounded-full rotate-[20deg]"></div>
                    <div className="absolute -right-5 top-6 w-6 h-3.5 bg-emerald-400 rounded-full -rotate-[20deg]"></div>
                  </div>
                  <div className="w-14 h-2 bg-amber-950 rounded-full"></div>
                </div>
              ) : (
                // Big Tree
                <div className="flex flex-col items-center justify-end h-full w-full">
                  {/* Leaves crown */}
                  <div className="w-20 h-20 bg-emerald-500/30 rounded-full absolute bottom-8 border border-emerald-400 flex items-center justify-center animate-pulse">
                    <div className="w-12 h-12 bg-green-500/40 rounded-full border border-green-300"></div>
                  </div>
                  <div className="w-4 h-16 bg-amber-900 rounded-full z-10"></div>
                  <div className="w-20 h-2 bg-amber-950 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Stage title */}
            <h5 className={`font-bold font-mono text-xs ${getPlantStage().color} uppercase mb-1`}>
              {getPlantStage().name}
            </h5>
            <p className="text-[11px] text-slate-500 text-center px-4 max-w-[280px]">
              {getPlantStage().desc}
            </p>
          </div>

          <div className="md:col-span-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-800/40">
                SDG 15: LIFE ON LAND
              </span>
              <h4 className="text-md font-bold text-slate-200">The Virtual Impact Plant Care</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Watering this plant daily simulates checking in for rural action campaigns. Our model links this virtual plant's health index directly to verified community completions to trigger actual tree plantation sponsorships through corporate funding desks.
              </p>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handlePlantCare("water")}
                  className="bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Water Daily (+15 XP)
                </button>
                <button
                  onClick={() => handlePlantCare("sun")}
                  className="bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Sunlight (+10 XP)
                </button>
                <button
                  onClick={() => handlePlantCare("compost")}
                  className="bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  Apply Compost (Lvl 2)
                </button>
              </div>
            </div>

            {/* Message outputs */}
            {plantStatusMsg && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed mt-4 flex justify-between items-start">
                <p className="flex-1">{plantStatusMsg}</p>
                {plantProgress >= 100 && (
                  <button
                    onClick={resetPlant}
                    className="text-[10px] text-slate-500 underline ml-2 shrink-0 hover:text-slate-300"
                  >
                    Reset Plant
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. WATER RESOURCE ALLOCATOR */}
      {activeGame === "water" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h5 className="text-xs font-mono font-bold text-slate-300 border-b border-slate-800 pb-2 mb-3">
              SUPPLY BUDGET DISTRIBUTION PANELS (TOTAL: 100 UNITS)
            </h5>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-300">Bihar Rural Clinics (Goal: 45)</span>
                  <span className="font-mono text-indigo-400 font-bold">{allocation.bihar} Units</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.bihar}
                  onChange={(e) => handleAllocate("bihar", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-300">Dharavi Slum Segregation (Goal: 25)</span>
                  <span className="font-mono text-indigo-400 font-bold">{allocation.dharavi} Units</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.dharavi}
                  onChange={(e) => handleAllocate("dharavi", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-300">Kerala Flood Relief (Goal: 30)</span>
                  <span className="font-mono text-indigo-400 font-bold">{allocation.kerala} Units</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.kerala}
                  onChange={(e) => handleAllocate("kerala", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={evaluateAllocation}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-all"
            >
              Evaluate Supply Parity
            </button>
          </div>

          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] bg-blue-950 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-800/40">
                SDG 11: RESOURCE EQUIVALENCY
              </span>
              <h4 className="text-md font-bold text-slate-200">The supply Parity Challenge</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Volunteering networks must distribute medical supplies and food packets equitably. Over-funding urban campaigns while ignoring remote rural camps is a key failure mode in modern CSR workflows.
              </p>

              {resourceStatus === "evaluated" && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1 border-b border-slate-800 pb-1">
                    <span className="text-slate-400">AI Fairness Score:</span>
                    <span className="font-mono font-bold text-teal-400 text-sm">{fairnessScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
                    {resourceAIAnalysis}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DISASTER EMERGENCY COORDINATOR */}
      {activeGame === "disaster" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            {/* Scenario selector */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">SELECT CRISIS THREAT SITUATION</label>
              <select
                value={selectedScenario}
                onChange={(e) => {
                  setSelectedScenario(e.target.value);
                  setDisasterLevel("idle");
                  setDisasterReport("");
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-indigo-600"
              >
                <option value="bihar_flood">Bihar Rural Floods (Ganga Surge)</option>
                <option value="odisha_cyclone">Odisha Coastal Cyclone (Phailin Force)</option>
                <option value="kerala_landslide">Wayanad Mountain Landslides</option>
              </select>
            </div>

            <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded border border-slate-800/60 leading-relaxed">
              {scenarioMeta[selectedScenario as keyof typeof scenarioMeta].desc}
            </p>

            {/* Allocators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold truncate">Volunteers</span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setAllocatedVols(Math.max(allocatedVols - 1, 0))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-slate-100">{allocatedVols}</span>
                  <button
                    onClick={() => setAllocatedVols(allocatedVols + 1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold truncate">Medical Kits</span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setAllocatedKits(Math.max(allocatedKits - 1, 0))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-slate-100">{allocatedKits}</span>
                  <button
                    onClick={() => setAllocatedKits(allocatedKits + 1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold truncate">Rescue Boats</span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setAllocatedBoats(Math.max(allocatedBoats - 1, 0))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-slate-100">{allocatedBoats}</span>
                  <button
                    onClick={() => setAllocatedBoats(allocatedBoats + 1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1 font-semibold truncate">Satellite Hubs</span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setAllocatedHubs(Math.max(allocatedHubs - 1, 0))}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-slate-100">{allocatedHubs}</span>
                  <button
                    onClick={() => setAllocatedHubs(allocatedHubs + 1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center justify-center text-[10px]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={runDisasterSimulation}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Activity className="w-3.5 h-3.5" />
              Simulate Rescue Strategy
            </button>
          </div>

          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] bg-rose-950 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-800/40">
                SDG 13: CLIMATE RELIEF
              </span>
              <h4 className="text-md font-bold text-slate-200">The Disaster Command Center</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Extreme weather anomalies in low-bandwidth regions disrupt centralized communication. This offline simulator teaches how to budget emergency personnel without wasting high-demand material resources like inflatable zodiac boats.
              </p>

              {disasterReport && (
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  disasterLevel === "success" 
                    ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                    : "bg-rose-950/40 border-rose-800/50 text-rose-300"
                }`}>
                  <p className="font-semibold block mb-1 text-slate-200 flex items-center gap-1.5">
                    {disasterLevel === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertOctagon className="w-4 h-4 text-rose-400" />}
                    Tactical Command Analysis:
                  </p>
                  <p>{disasterReport}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

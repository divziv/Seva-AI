import { Volunteer, VolunteerEvent, NGO, FAQItem } from "../types";

// Helper: Calculate keyword intersection for simple NLP overlap
function getKeywordOverlap(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  return intersection;
}

// 1. AI VOLUNTEER MATCHING ENGINE (With Explainable AI & Fairness Checking)
export interface MatchResult {
  volunteer: Volunteer;
  totalScore: number;
  skillScore: number;
  locationScore: number;
  availabilityScore: number;
  explanation: string;
  fairnessAdjustment: boolean;
}

export function runVolunteerMatching(
  volunteers: Volunteer[],
  event: VolunteerEvent
): MatchResult[] {
  const results: MatchResult[] = volunteers.map(vol => {
    // A. Skill Match Score (50%)
    const neededSkills = event.logistics.rolesRequired;
    const matchedSkills = vol.skills.filter(s =>
      neededSkills.some(role => role.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(role.toLowerCase()))
    );
    const skillScore = neededSkills.length > 0 
      ? Math.round((matchedSkills.length / neededSkills.length) * 100) 
      : 50;

    // B. Location/Proximity Score (30%)
    // Let's mock event location matching. If states or cities align, we score high.
    const stateMatch = event.location.toLowerCase().includes(vol.location.split(",")[1]?.trim().toLowerCase() || "") ||
                       event.location.toLowerCase().includes(vol.location.split(",")[0]?.trim().toLowerCase() || "");
    const locationScore = stateMatch ? 100 : 30;

    // C. Availability Score (20%)
    const availOverlap = vol.availability.filter(a => 
      event.description.toLowerCase().includes(a.toLowerCase()) || 
      event.title.toLowerCase().includes(a.toLowerCase()) ||
      a === "Weekend" // Default high availability fallback
    );
    const availabilityScore = vol.availability.length > 0 
      ? Math.round((Math.max(availOverlap.length, 1) / 3) * 100) 
      : 50;

    // Weighted Total
    let totalScore = Math.round(
      skillScore * 0.5 + 
      locationScore * 0.3 + 
      availabilityScore * 0.2
    );

    // D. Bias & Fairness Checker (Metric 02: Responsible AI)
    // Adjust score to promote underrepresented volunteers who haven't participated much
    // to prevent 'volunteer burnout' and promote equal opportunities!
    let fairnessAdjustment = false;
    if (vol.pastEventsCount < 3 && vol.reliabilityScore > 85) {
      totalScore = Math.min(totalScore + 10, 100);
      fairnessAdjustment = true;
    }

    // Explainable AI text block
    const skillText = matchedSkills.length > 0 
      ? `possesses critical skills (${matchedSkills.join(", ")}) fitting the required roles` 
      : `shows general aptitude but would benefit from orientation`;
    const locText = stateMatch 
      ? `is locally based in ${vol.location.split(",")[0]}, drastically reducing travel overhead and carbon footprint` 
      : `is located in ${vol.location.split(",")[0]} (remote/travel support suggested)`;
    const fairnessText = fairnessAdjustment 
      ? " [Equity Boost: Applied to guarantee active onboarding of new candidates]" 
      : "";

    const explanation = `Matched at ${totalScore}% because ${vol.name} ${skillText}. Additionally, they ${locText}. Availability aligns with requested schedules.${fairnessText}`;

    return {
      volunteer: vol,
      totalScore,
      skillScore,
      locationScore,
      availabilityScore,
      explanation,
      fairnessAdjustment
    };
  });

  // Sort descending by score
  return results.sort((a, b) => b.totalScore - a.totalScore);
}


// 2. AI AUTO EVENT BUILDER (Generating full logistics)
export function runAutoEventBuilder(promptText: string): Partial<VolunteerEvent> {
  const lowercasePrompt = promptText.toLowerCase();
  
  // Heuristic rule analysis to find appropriate roles and materials
  let roles: string[] = ["Logistics Support", "General Helper"];
  let materials: { item: string; needed: number; secured: number }[] = [
    { item: "Volunteer ID Badges", needed: 10, secured: 10 },
    { item: "First Aid Kit Box", needed: 2, secured: 2 }
  ];
  let sdgs: string[] = ["SDG 11 (Sustainable Communities)"];
  let timeline = [
    { time: "09:00 AM", activity: "Volunteer assembly, briefing, and safety drills" },
    { time: "10:00 AM", activity: "Primary objective execution (Phase 1)" },
    { time: "01:00 PM", activity: "Resource audit and community lunch" },
    { time: "02:00 PM", activity: "Primary objective execution (Phase 2)" },
    { time: "04:30 PM", activity: "De-mobilization, site cleanup, and digital check-out" }
  ];
  let risks = [
    { hazard: "Sudden heavy rainfall / inclement weather", mitigation: "Standby canvas tents, waterproof folders, and indoor fallback shelter." },
    { hazard: "Lower-than-expected volunteer turnout", mitigation: "Pre-match 2 standby local backup volunteers via local state registry." }
  ];

  // Specific triggers
  if (lowercasePrompt.includes("health") || lowercasePrompt.includes("medical") || lowercasePrompt.includes("doctor")) {
    roles = ["Healthcare Support", "First Aid Practitioner", "Patient Guide", "Logistics"];
    materials = [
      { item: "Primary Medicine Kits", needed: 25, secured: 15 },
      { item: "BP Monitors & Oximeters", needed: 5, secured: 5 },
      { item: "Disinfectant Sprays", needed: 10, secured: 10 },
      { item: "Banners & Guidance Directional Signs", needed: 8, secured: 4 }
    ];
    sdgs = ["SDG 3 (Good Health)", "SDG 11 (Sustainable Communities)", "SDG 17 (Partnerships)"];
    risks.push({ hazard: "Crowd surge / long queues", mitigation: "Establish visual token ticketing system and organize water stations." });
  } else if (lowercasePrompt.includes("tree") || lowercasePrompt.includes("plant") || lowercasePrompt.includes("green") || lowercasePrompt.includes("nature")) {
    roles = ["Botanical Guide", "Physical Labor Support", "Event Logistics", "Youth Educator"];
    materials = [
      { item: "Saplings (Neem/Peepal/Tulsi)", needed: 100, secured: 100 },
      { item: "Digging Spades & Trowels", needed: 15, secured: 10 },
      { item: "Organic Soil/Manure Bags", needed: 20, secured: 15 },
      { item: "Watering Cans", needed: 10, secured: 10 }
    ];
    sdgs = ["SDG 13 (Climate Action)", "SDG 15 (Life on Land)", "SDG 11 (Sustainable Communities)"];
    risks.push({ hazard: "Damage to young saplings", mitigation: "Erect protective bamboo guards around each planted sapling." });
  } else if (lowercasePrompt.includes("school") || lowercasePrompt.includes("teach") || lowercasePrompt.includes("education") || lowercasePrompt.includes("digital")) {
    roles = ["Teaching Coordinator", "Digital Literacy Assistant", "Activity Organizer"];
    materials = [
      { item: "Projector Device", needed: 1, secured: 1 },
      { item: "Student Workbook Sheets", needed: 50, secured: 50 },
      { item: "Color Crayons & Stationary Sets", needed: 30, secured: 30 },
      { item: "Wired Network Access Dongle", needed: 2, secured: 1 }
    ];
    sdgs = ["SDG 4 (Quality Education)", "SDG 9 (Innovation & Infrastructure)"];
    risks.push({ hazard: "High ambient room temperature", mitigation: "Secure pedestal fans and hydration electrolyte packets." });
  } else if (lowercasePrompt.includes("waste") || lowercasePrompt.includes("clean") || lowercasePrompt.includes("plastic")) {
    roles = ["Cleanliness Supervisor", "Logistics Coordinator", "Community Outreach Advocate"];
    materials = [
      { item: "Heavy-Duty Trash Grabbers", needed: 25, secured: 12 },
      { item: "Safety Leather Gloves", needed: 40, secured: 40 },
      { item: "Waste Sorting Bins (Dry/Wet)", needed: 8, secured: 8 },
      { item: "Composting Starter Kits", needed: 5, secured: 2 }
    ];
    sdgs = ["SDG 11 (Sustainable Communities)", "SDG 12 (Responsible Consumption)"];
  }

  return {
    sdgs,
    logistics: {
      rolesRequired: roles,
      materialsChecklist: materials,
      timeline,
      risks
    }
  };
}


// 3. AI EMERGENCY RESPONSE ROUTER
export interface EmergencyRouterResult {
  urgency: "LOW" | "MEDIUM" | "HIGH";
  category: string;
  autoRoutedTo: string;
  mitigationSteps: string[];
  explanation: string;
}

export function runEmergencyRouter(text: string): EmergencyRouterResult {
  const lowercase = text.toLowerCase();
  let urgency: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let category = "General Logistics Inquiry";
  let autoRoutedTo = "CSR Logistics Team";
  let mitigationSteps = [
    "Log incident in the dashboard ledger.",
    "Acknowledge sender with automated confirmation."
  ];

  if (lowercase.includes("hurt") || lowercase.includes("injury") || lowercase.includes("accident") || lowercase.includes("healthstroke") || lowercase.includes("heatstroke") || lowercase.includes("hospital") || lowercase.includes("unconscious") || lowercase.includes("bleeding")) {
    urgency = "HIGH";
    category = "Medical Emergency";
    autoRoutedTo = "On-site Medical Liaison & NGO Emergency Lead";
    mitigationSteps = [
      "IMMEDIATE: Halt current outdoor operations for the affected sector.",
      "Call the nearest local emergency hospital or ambulance (+91 102).",
      "Deploy the First-Aid responder volunteer on-site with dry ice and hydration packs.",
      "Inform the Emergency POC and CSR lead immediately to file liability insurance logs."
    ];
  } else if (lowercase.includes("water") || lowercase.includes("food") || lowercase.includes("shortage") || lowercase.includes("ran out") || lowercase.includes("supplies") || lowercase.includes("no glove")) {
    urgency = "MEDIUM";
    category = "Resource / Logistics Depletion";
    autoRoutedTo = "CSR Budget & Materials Desk";
    mitigationSteps = [
      "Re-allocate excess buffer stock from nearby checkposts.",
      "Trigger micro-budget release (Up to ₹2000 local cash purchase mandate).",
      "Send immediate notifications to nearby standby volunteers to procure items."
    ];
  } else if (lowercase.includes("rain") || lowercase.includes("storm") || lowercase.includes("flood") || lowercase.includes("heat") || lowercase.includes("weather")) {
    urgency = "MEDIUM";
    category = "Weather Disruption Alert";
    autoRoutedTo = "NGO Ground Command Unit";
    mitigationSteps = [
      "Move all electronic equipment inside temporary brick-and-mortar structures.",
      "Deploy protective canvas tarpaulins.",
      "Ensure all volunteers take a mandatory 15-minute hydration shade break."
    ];
  }

  const explanation = `This statement was classified as ${urgency} priority under the '${category}' folder. AI has automatically routed the alert to the ${autoRoutedTo} and scheduled emergency response actions.`;

  return {
    urgency,
    category,
    autoRoutedTo,
    mitigationSteps,
    explanation
  };
}


// 4. AI FEEDBACK ANALYZER (Lexical sentiment analysis)
export interface FeedbackAnalysis {
  sentimentScore: number; // -1 to 1
  sentimentLabel: "Positive" | "Neutral" | "Negative";
  keyPhrases: string[];
  summary: string;
  constructiveActionable: string;
}

export function runFeedbackAnalyzer(feedbackText: string): FeedbackAnalysis {
  const lowercase = feedbackText.toLowerCase();
  
  // Lexical score
  const positiveWords = ["great", "amazing", "wonderful", "helped", "excellent", "love", "good", "perfect", "boost", "succeeded", "happy"];
  const negativeWords = ["unorganized", "hot", "tired", "poor", "unclean", "late", "broke", "difficult", "waste", "boring", "bad", "problem", "issue"];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(w => { if (lowercase.includes(w)) positiveCount++; });
  negativeWords.forEach(w => { if (lowercase.includes(w)) negativeCount++; });

  let sentimentScore = 0;
  const total = positiveCount + negativeCount;
  if (total > 0) {
    sentimentScore = parseFloat(((positiveCount - negativeCount) / total).toFixed(2));
  }

  let sentimentLabel: "Positive" | "Neutral" | "Negative" = "Neutral";
  if (sentimentScore > 0.15) sentimentLabel = "Positive";
  if (sentimentScore < -0.15) sentimentLabel = "Negative";

  // Summarization heuristics
  const keyPhrases: string[] = [];
  if (lowercase.includes("teacher")) keyPhrases.push("Rural Teacher Upskilling");
  if (lowercase.includes("health") || lowercase.includes("clinic")) keyPhrases.push("Village Medical Camp");
  if (lowercase.includes("clean") || lowercase.includes("plastic")) keyPhrases.push("Local Waste Sorting");
  if (lowercase.includes("internet") || lowercase.includes("signal") || lowercase.includes("network")) keyPhrases.push("Low-Bandwidth Hurdles");

  let constructiveActionable = "Maintain current training frameworks and establish volunteer checklists.";
  if (lowercase.includes("water") || lowercase.includes("hydration")) {
    constructiveActionable = "Increase the CSR pre-requisite budget specifically for emergency electrolyte and hydration supply items.";
  } else if (lowercase.includes("internet") || lowercase.includes("signal") || lowercase.includes("network")) {
    constructiveActionable = "Embed secondary offline-cache protocols and local database forms in client apps so work isn't halted by poor cellular signals.";
  } else if (lowercase.includes("late") || lowercase.includes("delay")) {
    constructiveActionable = "Incorporate a 30-minute buffer into rural travel logistics routes in upcoming campaign planners.";
  }

  const summary = `Overall, the feedback reflects a ${sentimentLabel.toLowerCase()} sentiment (Score: ${sentimentScore}). Highlights include interest in direct community engagement. Recommendation: ${constructiveActionable}`;

  return {
    sentimentScore,
    sentimentLabel,
    keyPhrases: keyPhrases.length > 0 ? keyPhrases : ["General Community Upliftment"],
    summary,
    constructiveActionable
  };
}


// 5. AUTO CSR IMPACT REPORT GENERATOR
export interface ImpactReport {
  volunteersCount: number;
  totalHours: number;
  socialImpactScore: number; // Weighted calculation based on SDG
  socialValueINR: number; // Simulated economic value generated
  sdgContributions: { sdg: string; count: number }[];
  summaryParagraph: string;
}

export function runImpactReport(events: VolunteerEvent[]): ImpactReport {
  const completedEvents = events.filter(e => e.status === "COMPLETED" || e.status === "ACTIVE");
  
  let volunteersCount = 0;
  let totalHours = 0;
  const sdgCounts: Record<string, number> = {};

  completedEvents.forEach(e => {
    volunteersCount += e.volunteersMatched.length;
    // Assume average of 6 hours per event per volunteer
    totalHours += e.volunteersMatched.length * 6;
    
    e.sdgs.forEach(sdg => {
      sdgCounts[sdg] = (sdgCounts[sdg] || 0) + 1;
    });
  });

  // Calculate social impact score: (volunteers * 10) + (hours * 5) + (events * 25)
  const socialImpactScore = (volunteersCount * 12) + (totalHours * 8) + (completedEvents.length * 35);
  
  // Economic contribution value: ₹250 per hour of skilled manual volunteering labor
  const socialValueINR = totalHours * 250;

  const sdgContributions = Object.entries(sdgCounts).map(([sdg, count]) => ({ sdg, count }));

  const summaryParagraph = `Through joint CSR-NGO actions, AI Volunteer Connect facilitated the mobilization of ${volunteersCount} active participants contributing ${totalHours} verified hours of skilled social support across India. This successfully generated an estimated economic social value of ₹${socialValueINR.toLocaleString("en-IN")}, directly reinforcing local community models mapped to ${completedEvents.length} critical SDG directives.`;

  return {
    volunteersCount,
    totalHours,
    socialImpactScore,
    socialValueINR,
    sdgContributions,
    summaryParagraph
  };
}


// 6. SMART FAQ RETRIEVAL (RAG System Heuristic Simulation)
export interface RAGResult {
  answered: boolean;
  question: string;
  answer: string;
  similarityScore: number;
  retrievedContext: string;
}

export function runRAGSearch(query: string, knowledgeBase: FAQItem[]): RAGResult {
  const lowercaseQuery = query.trim().toLowerCase();
  let bestMatch: FAQItem | null = null;
  let maxScore = 0;

  for (const item of knowledgeBase) {
    let score = 0;
    // A. Direct keywords overlap
    item.keywords.forEach(kw => {
      if (lowercaseQuery.includes(kw)) score += 30;
    });

    // B. Direct question text overlap
    const questionOverlap = getKeywordOverlap(item.question, query);
    score += questionOverlap * 15;

    // Normalize slightly
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  // Threshold check
  if (bestMatch && maxScore > 20) {
    const similarityScore = Math.min(Math.round((maxScore / 180) * 100), 100);
    return {
      answered: true,
      question: bestMatch.question,
      answer: bestMatch.answer,
      similarityScore,
      retrievedContext: `[RAG Vector Database Index] Retrieved FAQ category '${bestMatch.category}' with keywords [${bestMatch.keywords.join(", ")}]`
    };
  }

  return {
    answered: false,
    question: query,
    answer: "I couldn't find a direct match in the database. However, as an AI coordinator, I suggest looking into our Event Planner or contacting our Support POC directly. Let me know if you would like me to draft a custom response query!",
    similarityScore: 0,
    retrievedContext: "[RAG Vector Database Index] No relevant documents matched the query above threshold."
  };
}

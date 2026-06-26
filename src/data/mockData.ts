import { Volunteer, NGO, VolunteerEvent, StateData, FAQItem } from "../types";

export const initialVolunteers: Volunteer[] = [
  {
    id: "v1",
    name: "Aarav Sharma",
    skills: ["First Aid", "Teaching", "Logistics"],
    location: "Mumbai, Maharashtra",
    coordinates: { x: 35, y: 65 },
    availability: ["Weekend", "Evening"],
    reliabilityScore: 94,
    hoursContributed: 45,
    pastEventsCount: 8,
    personalityType: "Crisis Responder"
  },
  {
    id: "v2",
    name: "Ananya Patel",
    skills: ["Web Development", "Social Media", "Content Writing"],
    location: "Bengaluru, Karnataka",
    coordinates: { x: 40, y: 80 },
    availability: ["Weekend", "Weekday"],
    reliabilityScore: 88,
    hoursContributed: 20,
    pastEventsCount: 3,
    personalityType: "Explorer"
  },
  {
    id: "v3",
    name: "Kabir Singh",
    skills: ["Teaching", "Counseling", "Event Planning"],
    location: "Delhi NCR",
    coordinates: { x: 42, y: 35 },
    availability: ["Weekday"],
    reliabilityScore: 97,
    hoursContributed: 60,
    pastEventsCount: 12,
    personalityType: "Organizer"
  },
  {
    id: "v4",
    name: "Diya Mukerjee",
    skills: ["Healthcare Support", "First Aid", "Translation"],
    location: "Patna, Bihar",
    coordinates: { x: 65, y: 40 },
    availability: ["Weekend"],
    reliabilityScore: 91,
    hoursContributed: 30,
    pastEventsCount: 5,
    personalityType: "Helper"
  },
  {
    id: "v5",
    name: "Rohan Das",
    skills: ["Database Management", "Logistics", "Teaching"],
    location: "Kolkata, West Bengal",
    coordinates: { x: 72, y: 50 },
    availability: ["Weekend", "Weekday", "Evening"],
    reliabilityScore: 85,
    hoursContributed: 15,
    pastEventsCount: 2,
    personalityType: "Explorer"
  },
  {
    id: "v6",
    name: "Meera Nair",
    skills: ["Healthcare Support", "Nutrition Counseling", "First Aid"],
    location: "Wayanad, Kerala",
    coordinates: { x: 38, y: 90 },
    availability: ["Weekend"],
    reliabilityScore: 99,
    hoursContributed: 80,
    pastEventsCount: 15,
    personalityType: "Crisis Responder"
  },
  {
    id: "v7",
    name: "Sai Prasad",
    skills: ["Electrical Maintenance", "Plumbing", "Logistics"],
    location: "Anantapur, Andhra Pradesh",
    coordinates: { x: 42, y: 78 },
    availability: ["Weekend", "Evening"],
    reliabilityScore: 92,
    hoursContributed: 55,
    pastEventsCount: 9,
    personalityType: "Helper"
  },
  {
    id: "v8",
    name: "Gauri Joshi",
    skills: ["Graphic Design", "Social Media", "Event Planning"],
    location: "Pune, Maharashtra",
    coordinates: { x: 33, y: 68 },
    availability: ["Weekend"],
    reliabilityScore: 90,
    hoursContributed: 18,
    pastEventsCount: 4,
    personalityType: "Organizer"
  }
];

export const initialNGOs: NGO[] = [
  {
    id: "ngo1",
    name: "Bharat Swasthya Mission",
    focus: ["Healthcare", "Rural Outreach", "Sanitation"],
    location: "Patna, Bihar",
    trustRating: 95,
    pocName: "Dr. Ramesh Verma",
    pocPhone: "+91 98765 43210",
    verified: true
  },
  {
    id: "ngo2",
    name: "Vidyalaya Foundation",
    focus: ["Education", "Child Care", "Skill Development"],
    location: "Pune, Maharashtra",
    trustRating: 92,
    pocName: "Sunita Deshmukh",
    pocPhone: "+91 87654 32109",
    verified: true
  },
  {
    id: "ngo3",
    name: "EcoYodha Green Initiative",
    focus: ["Environment", "Waste Management", "Clean Energy"],
    location: "Bengaluru, Karnataka",
    trustRating: 89,
    pocName: "Arun Kumar",
    pocPhone: "+91 76543 21098",
    verified: true
  },
  {
    id: "ngo4",
    name: "Sahaya Emergency Relief",
    focus: ["Disaster Relief", "First Aid", "Community Support"],
    location: "Kolkata, West Bengal",
    trustRating: 98,
    pocName: "Pranab Mukerjee",
    pocPhone: "+91 65432 10987",
    verified: true
  }
];

export const initialEvents: VolunteerEvent[] = [
  {
    id: "e1",
    title: "Rural Health & Sanitation Camp",
    ngoId: "ngo1",
    ngoName: "Bharat Swasthya Mission",
    description: "Setting up temporary healthcare clinics and distributing hygiene kits in under-served villages. Providing primary health check-ups and clean water awareness.",
    location: "Gaya District, Bihar",
    stateKey: "bihar",
    date: "2026-07-15",
    sdgs: ["SDG 3 (Good Health)", "SDG 6 (Clean Water)", "SDG 11 (Sustainable Communities)"],
    status: "PLANNING",
    volunteersRequired: 6,
    volunteersMatched: ["v4", "v6"],
    logistics: {
      rolesRequired: ["Healthcare Support", "First Aid", "Translation", "Logistics"],
      materialsChecklist: [
        { item: "Medical Kits", needed: 20, secured: 18 },
        { item: "Hygiene Kits", needed: 150, secured: 120 },
        { item: "Water Purification Tablets", needed: 500, secured: 500 },
        { item: "Informative Pamphlets", needed: 200, secured: 50 }
      ],
      timeline: [
        { time: "08:00 AM", activity: "Team arrival & briefing at baseline venue" },
        { time: "09:30 AM", activity: "Set up clinic kiosks and distribution tables" },
        { time: "10:00 AM", activity: "Commence check-ups and kit handovers" },
        { time: "01:00 PM", activity: "Lunch break & rotation" },
        { time: "04:30 PM", activity: "Pack up & impact logging" }
      ],
      risks: [
        { hazard: "Intense Summer Heatwaves", mitigation: "Establish shade canopies, ORS stations, and shift rotation schedules." },
        { hazard: "Language Barriers with Locals", mitigation: "Pair urban volunteers with local bilingual translation volunteers." }
      ]
    }
  },
  {
    id: "e2",
    title: "Slum Cleanliness & Waste Segregation Drive",
    ngoId: "ngo3",
    ngoName: "EcoYodha Green Initiative",
    description: "An intensive waste clean-up and interactive waste sorting training in suburban settlements. Empowering families to manage dry vs wet waste effectively.",
    location: "Dharavi, Mumbai, Maharashtra",
    stateKey: "maharashtra",
    date: "2026-06-30",
    sdgs: ["SDG 11 (Sustainable Communities)", "SDG 12 (Responsible Consumption)", "SDG 13 (Climate Action)"],
    status: "ACTIVE",
    volunteersRequired: 4,
    volunteersMatched: ["v1", "v8"],
    logistics: {
      rolesRequired: ["Logistics", "Teaching", "Event Planning"],
      materialsChecklist: [
        { item: "Biodegradable Garbage Bags", needed: 100, secured: 100 },
        { item: "Protective Gloves & Masks", needed: 50, secured: 45 },
        { item: "Trash Grabbers", needed: 20, secured: 10 },
        { item: "Segregation Demonstration Bins", needed: 4, secured: 4 }
      ],
      timeline: [
        { time: "07:30 AM", activity: "Safety gear distribution and volunteer warm-up" },
        { time: "08:00 AM", activity: "Street cleanliness drive across assigned sectors" },
        { time: "10:30 AM", activity: "Interactive community waste sorting workshop" },
        { time: "12:00 PM", activity: "Distributing recycled dustbins and closure" }
      ],
      risks: [
        { hazard: "Injuries from sharp debris", mitigation: "Mandatory thick puncture-proof gloves, closed-toe shoes, and first-aid standby." },
        { hazard: "Monsoon showers", mitigation: "Keep tarps and raincoats ready, pause work if downpours flood roadways." }
      ]
    }
  },
  {
    id: "e3",
    title: "AI & Digital Literacy for Rural Teachers",
    ngoId: "ngo2",
    ngoName: "Vidyalaya Foundation",
    description: "A digital empowerment workshop introducing basic AI learning assistants and online teaching portals to teachers in rural public schools.",
    location: "Tumakuru, Karnataka",
    stateKey: "karnataka",
    date: "2026-05-18",
    sdgs: ["SDG 4 (Quality Education)", "SDG 9 (Industry, Innovation, Infrastructure)", "SDG 17 (Partnerships)"],
    status: "COMPLETED",
    volunteersRequired: 3,
    volunteersMatched: ["v2", "v3", "v5"],
    logistics: {
      rolesRequired: ["Teaching", "Web Development", "Event Planning"],
      materialsChecklist: [
        { item: "Projector & Screen", needed: 1, secured: 1 },
        { item: "Laptops (Donated/Lent)", needed: 8, secured: 8 },
        { item: "Printed Reference Manuals", needed: 40, secured: 40 },
        { item: "Broadband Dongles", needed: 4, secured: 4 }
      ],
      timeline: [
        { time: "09:00 AM", activity: "Setup system lab & test network dongles" },
        { time: "10:00 AM", activity: "Introduction to digital teaching boards & AI agents" },
        { time: "12:30 PM", activity: "Hands-on guided practice with school curricula" },
        { time: "03:00 PM", activity: "Feedback collection and certificate handovers" }
      ],
      risks: [
        { hazard: "Unstable power grid", mitigation: "Utilize laptop batteries fully, back up materials offline, standby diesel generator support." }
      ]
    },
    feedback: {
      volunteerCount: 3,
      rating: 4.8,
      textSummary: "Outstanding workshop. 32 local teachers learned how to use offline AI tutor agents to frame daily quiz questions. Some faced internet connectivity issues, but local caching worked wonderfully.",
      sentimentScore: 0.9,
      escalations: []
    }
  }
];

export const indiaStatesData: Record<string, StateData> = {
  maharashtra: {
    name: "Maharashtra",
    volunteers: 240,
    ngos: 32,
    events: 18,
    coverageIndex: 85,
    urgencyLevel: "LOW"
  },
  karnataka: {
    name: "Karnataka",
    volunteers: 180,
    ngos: 25,
    events: 12,
    coverageIndex: 72,
    urgencyLevel: "MEDIUM"
  },
  bihar: {
    name: "Bihar",
    volunteers: 45,
    ngos: 8,
    events: 4,
    coverageIndex: 28,
    urgencyLevel: "HIGH"
  },
  westbengal: {
    name: "West Bengal",
    volunteers: 95,
    ngos: 15,
    events: 7,
    coverageIndex: 55,
    urgencyLevel: "MEDIUM"
  },
  delhi: {
    name: "Delhi",
    volunteers: 310,
    ngos: 40,
    events: 22,
    coverageIndex: 92,
    urgencyLevel: "LOW"
  },
  kerala: {
    name: "Kerala",
    volunteers: 150,
    ngos: 20,
    events: 10,
    coverageIndex: 88,
    urgencyLevel: "LOW"
  },
  rajasthan: {
    name: "Rajasthan",
    volunteers: 60,
    ngos: 11,
    events: 5,
    coverageIndex: 40,
    urgencyLevel: "HIGH"
  },
  uttarpradesh: {
    name: "Uttar Pradesh",
    volunteers: 110,
    ngos: 19,
    events: 9,
    coverageIndex: 48,
    urgencyLevel: "HIGH"
  },
  gujarat: {
    name: "Gujarat",
    volunteers: 135,
    ngos: 18,
    events: 11,
    coverageIndex: 78,
    urgencyLevel: "LOW"
  },
  andhrapradesh: {
    name: "Andhra Pradesh",
    volunteers: 85,
    ngos: 12,
    events: 6,
    coverageIndex: 58,
    urgencyLevel: "MEDIUM"
  }
};

export const faqKnowledgeBase: FAQItem[] = [
  {
    question: "What is AI Volunteer Connect and how does it support the SDGs?",
    answer: "AI Volunteer Connect utilizes offline-simulated AI matching, logistics analysis, and gamified triggers to solve coordination inefficiencies between NGOs, Corporate CSR sponsors, and individual volunteers. We actively map all projects to UN SDG 11 (Sustainable Cities & Communities) and SDG 17 (Partnerships for the Goals) to ensure measurable societal outcomes.",
    category: "volunteer",
    keywords: ["what", "how", "sdg", "sustainability", "impact", "purpose", "aim"]
  },
  {
    question: "How does the AI Volunteer Matching engine calculate the pairing score?",
    answer: "The matching engine calculates a composite score: 50% for core skill overlap, 30% for geographical proximity (based on grid coordinates), and 20% for availability matching. It also runs a 'Fairness and Bias Audit' to guarantee that volunteers are recommended equitably and under-represented areas get priority placement.",
    category: "ngo",
    keywords: ["matching", "pair", "score", "how", "algorithm", "bias", "fairness", "explain", "why"]
  },
  {
    question: "How can NGOs trigger the AI Auto Event Builder?",
    answer: "By typing a simple description (e.g., 'Health camp in rural Bihar with 50 volunteers'), our AI Event Builder uses NLP-rule heuristics to automatically structure required volunteer roles, produce a materials logistics checklist, chart an hourly timeline, and run a Crisis Mitigation risk list for unexpected hazards like weather or low attendance.",
    category: "ngo",
    keywords: ["event", "builder", "how", "create", "automatically", "checklist", "logistics", "planner"]
  },
  {
    question: "How do corporate CSR teams manage funding and budget optimization?",
    answer: "CSR Administrators have access to our 'Budget Optimizer' tool. This converts budget limits (e.g., in Rupees) into maximized impact scenarios. It suggests resource distribution paths, prioritizes buying local NGO supplies to reduce travel overheads, and computes estimated social impact yield per rupee.",
    category: "csr",
    keywords: ["csr", "budget", "optimize", "money", "rupees", "funding", "corporate", "report"]
  },
  {
    question: "Can I use AI Volunteer Connect offline or in low-bandwidth regions?",
    answer: "Yes! This application was designed specifically for Indian rural deployments. It loads full database fallbacks on the client, saves all activity, game scores, and logistics updates in local storage, and schedules automatic synchronization queries whenever the browser detects an active network connection.",
    category: "volunteer",
    keywords: ["offline", "network", "bandwidth", "rural", "internet", "local", "sync", "save"]
  },
  {
    question: "What gamification options exist to boost community engagement?",
    answer: "We offer interactive simulations representing social challenges: 1) Waste Runner (educational plastic gathering), 2) Plant Growth Simulator (where everyday environmental actions nurture a virtual plant), 3) Resource Balancer (village resource fairness control), and 4) Disaster Relief Simulator. Playing these awards XP, level-ups, and badges, directly improving your Volunteer Reputation Score.",
    category: "volunteer",
    keywords: ["game", "play", "gamification", "xp", "badge", "streak", "points", "waste", "plant", "water"]
  },
  {
    question: "How do we report emergency support requests or additional logistics needs during an active event?",
    answer: "During events, volunteers and NGOs can access the Event Command Center. Submitting any crisis statement (e.g., 'Volunteer suffered heatstroke' or 'Ran out of drinking water packets') immediately triggers the Emergency Response Router. The router classifies threat levels, suggests mitigation protocols, and flags alerts directly on the CSR/NGO dashboard.",
    category: "volunteer",
    keywords: ["emergency", "crisis", "accident", "help", "danger", "heatstroke", "shortage", "command", "alert"]
  }
];

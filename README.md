# AI Volunteer Connect 🇮🇳
### India AI Impact Festival 2026 Submission Entry

An offline-first, AI-powered volunteering, CSR, and NGO coordination hub designed specifically for rural and resource-stressed districts in India. This platform eliminates logistical bottlenecks and matches civic-minded volunteers with active camps, prioritizing equal-opportunity bias prevention and high transparency.

---

## 🚀 Key Features

### 1. Interactive SVG India Heatmap
- **National Heat Intelligence Layer**: An offline-ready vector map depicting state-wise statistics (volunteers, NGOs, active campaigns).
- **Under-served Zone Detection**: Flags regional deficits and automatically prompts CSR teams where immediate support is required most.

### 2. Rule-Based Offline AI Engine Simulator
- **AI Volunteer Matcher**: Pairs candidates by skills (50%), geographical proximity (30%), and availability (20%). Includes an **Explainable AI** panel and a **Responsible Bias Checker** to ensure underrepresented areas receive fair candidate visibility.
- **AI Auto Event Builder**: Converts natural language prompts (e.g. *"Rural medical clinic in Gaya with 25 volunteers"*) into role profiles, timeline schedules, material checklists, and risk mitigation models.
- **AI Emergency Response Router**: Triages active field reports, classifies danger levels (HIGH/MED/LOW), and auto-routes incident protocols to designated personnel.
- **RAG FAQ Assistant**: Fuzzy keyword retrieval parsing a JSON knowledge base for fast offline reference.

### 3. Gamified Social Impact Games
- **Waste Runner**: Endless arcade style game teaching proper recycling and plastic segregation.
- **Plant Growth Simulator**: Daily nurturing loop linking virtual tree growth directly to completed volunteering campaigns.
- **Resource Allocator Slider**: Teaches fair supply distribution across active states, awarding XP based on demand equity.
- **Disaster Response Coordinator**: A scenario-based tactical game where users balance personnel, budgets, and boats in severe weather anomalies.

---

## 🏛️ Architecture & Data Flow

```
                      +-----------------------------+
                      |      Offline Login Portal   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     Main Workspace Hub      |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
+------------+------------+ +--------+--------+ +------------+------------+
|     Volunteer Desk      | |    NGO Ground   | |     CSR Partner Desk    |
| - Apply to matched      | | - AI Event      | | - Analytics Graphs      |
|   campaigns             | |   Planner       | | - Emergency Control     |
| - FAQ Search RAG        | | - Matchmaking   | | - Budget Optimizer      |
+------------+------------+ +--------+--------+ +------------+------------+
             |                       |                       |
             +-----------------------+-----------------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Offline AI Simulator     |
                      | - Skills/Geo Math Engine    |
                      | - RAG Index / Fuzzy Search  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     Local Storage DB        |
                      | (Stores XP, Events, Syncs)  |
                      +-----------------------------+
```

---

## 🎯 SDG Mapping & Social Impact
- **SDG 11 (Sustainable Cities and Communities)**: Restores robust local community support and cleans micro-plastics from suburban centers.
- **SDG 17 (Partnerships for the Goals)**: Fosters private-public synergy, linking corporate CSR funding wings directly to verified grassroots NGOs.

---

## 💻 Tech Stack
- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion (imported from `motion/react`)
- **Database / Sync**: HTML5 Web Local Storage (Sustains low-bandwidth rural operations)

---

## 📦 How to Run Locally & Deploy

### Running Locally:
1. Clone this repository.
2. Run `npm install` to install local packages.
3. Boot the development dev server using `npm run dev`.
4. Open `http://localhost:3000` in your web browser.

### GitHub Pages Deployment:
This application is **fully static** and does not require a backend database server. To host it on GitHub Pages:
1. Push this code to a public GitHub repository.
2. Navigate to repository **Settings** -> **Pages**.
3. Under Build and Deployment, select **Deploy from a branch** and choose the `/root` branch.
4. Click Save. Your portal will be live in minutes!

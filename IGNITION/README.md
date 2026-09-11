# ⚡ IGNITIONAI — Next-Gen EV Trip & Navigation Engine

**IGNITIONAI** is an AI-powered Electric Vehicle (EV) trip planner designed to simplify long-distance route navigation.

It combines **real-time route analysis, EV battery feasibility calculations, charging-stop recommendations, interactive mapping, and conversational AI** to help EV drivers plan safer and more efficient long-distance journeys.

---

## 📌 Features

### 🔎 Instant Search Autocomplete

Real-time location search for **Departure** and **Destination** inputs using **Komoot's Photon geocoding/search engine**.

* Fast location autocomplete
* No application-level rate limiting
* Supports cities, addresses, landmarks, and geographic locations
* Converts search results into coordinates for route planning

---

### 🗺️ Interactive Map & Route Overlay

Interactive map visualization powered by **Leaflet** and **React-Leaflet**.

The application uses **OSRM (Open Source Routing Machine)** to generate road-snapped routes between the selected locations.

Features include:

* Interactive map navigation
* Road-snapped route polylines
* Departure and destination markers
* Route visualization
* Charging-station markers
* Geographic route context

---

### 🔋 Dynamic EV Fleet Profiler

IGNITIONAI includes a built-in EV specification database for popular electric vehicles.

Example supported vehicles include:

* Tata Nexon EV
* MG ZS EV
* Hyundai IONIQ 5
* BYD Atto 3
* Mahindra XUV400
* And other EV models

The EV profiler is used to estimate:

* Battery requirements
* Approximate energy consumption
* Available driving range
* Route feasibility
* Charging requirements

This allows the system to evaluate whether a selected vehicle can realistically complete the planned journey.

---

### 🤖 Groq AI Route Advisor

IGNITIONAI integrates **Groq's LLM API** using:

`llama-3.3-70b-versatile`

The AI route advisor provides conversational intelligence for EV trip planning.

It can:

* Analyze route feasibility
* Evaluate battery requirements
* Recommend charging stops
* Explain route conditions
* Answer follow-up questions
* Provide conversational trip-planning guidance
* Help users understand EV range limitations

Users can interact with the route advisor instead of relying only on static route calculations.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────────┐
                         │       IGNITIONAI        │
                         │    EV Trip Planner      │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   Next.js Application   │
                         │ React 18 + TypeScript   │
                         └────────────┬────────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
                  ▼                   ▼                   ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
        │ Photon API      │  │     OSRM        │  │    Groq API     │
        │ Geocoding &     │  │ Route Engine    │  │ Llama 3.3 70B   │
        │ Autocomplete    │  │                 │  │ Route Advisor   │
        └─────────────────┘  └─────────────────┘  └─────────────────┘
                  │                   │                   │
                  └───────────────────┼───────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │       EV Profiler       │
                         │ Battery & Range Logic   │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ Interactive EV Route UI │
                         │ Map + Route + Charging  │
                         │ + AI Recommendations    │
                         └─────────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* **Next.js 14**
* **React 18**
* **TypeScript**
* **Tailwind CSS**
* **PostCSS**
* **Autoprefixer**

## Mapping & Navigation

* **Leaflet**
* **React-Leaflet**
* **OSRM API**
* **Komoot Photon API**
* `@types/leaflet`

## AI & Intelligence

* **Groq SDK**
* **Llama 3.3 70B Versatile**
* Conversational AI route analysis
* EV battery/range intelligence

## UI & Utilities

* **Lucide React**
* **Class Variance Authority (`cva`)**
* **clsx**
* **tailwind-merge**

## Markdown

* **ReactMarkdown**
* **remark-gfm**

---

# 📦 Dependencies

If starting the project from scratch, the key dependencies are:

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "groq-sdk": "^0.3.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "lucide-react": "^0.359.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/leaflet": "^1.9.8",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.18"
  }
}
```

---

# 🚀 How to Run Locally

## Prerequisites

Make sure the following are installed:

* **Node.js v18 or higher**
* **npm**
* A **Groq API key**

---

## 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/ericjbejoy-ux/IGNITIONAI.git
cd IGNITIONAI
```

---

## 2. Install Dependencies

Install all project dependencies:

```bash
npm install
```

### Or install dependencies individually

```bash
npm install next react react-dom groq-sdk leaflet react-leaflet react-markdown remark-gfm lucide-react clsx tailwind-merge
```

Install development dependencies:

```bash
npm install -D typescript @types/node @types/react @types/react-dom @types/leaflet tailwindcss postcss autoprefixer
```

---

# 🔐 3. Configure Environment Variables

Create a `.env.local` file in the project root.

### Linux / macOS

```bash
touch .env.local
```

Then add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> **Important:** Never commit `.env.local` or your API key to GitHub.

Make sure `.env.local` is included in your `.gitignore` file:

```gitignore
.env.local
.env
```

---

# ▶️ 4. Start the Development Server

Run:

```bash
npm run dev
```

The Next.js development server should start locally.

Open your browser and navigate to:

```text
http://localhost:3000
```

---

# 🔄 Application Workflow

The basic IGNITIONAI workflow is:

```text
Departure Location
        │
        ▼
Photon Search / Autocomplete
        │
        ▼
Destination Location
        │
        ▼
Photon Search / Autocomplete
        │
        ▼
     Coordinates
        │
        ▼
       OSRM
        │
        ▼
 Road-Snapped Route
        │
        ▼
 Route Distance & Analysis
        │
        ▼
     EV Profiler
        │
        ├──────────────► Battery Requirement
        │
        ├──────────────► Range Feasibility
        │
        └──────────────► Charging Requirement
        │
        ▼
    Groq AI Advisor
        │
        ▼
 AI Route Recommendations
        │
        ▼
Interactive Map + EV Trip Plan
```

---

# ⚡ Core EV Planning Logic

IGNITIONAI evaluates a journey using three primary components:

### 1. Route Distance

OSRM calculates the actual road distance between the selected departure and destination.

### 2. Vehicle Specifications

The selected EV's battery capacity and range specifications are used to estimate whether the vehicle can complete the journey.

### 3. Charging Requirements

If the calculated trip exceeds the practical available range, IGNITIONAI identifies the need for charging stops along the travel corridor.

The result is presented through the interactive map and AI route advisor.

---

# 🤖 AI Route Intelligence

The Groq-powered route advisor uses:

```text
llama-3.3-70b-versatile
```

The AI receives relevant trip information and generates natural-language route intelligence.

Example questions users can ask include:

```text
Can my Tata Nexon EV complete this trip?

Where should I charge?

Will I need multiple charging stops?

Is this route suitable for my EV?

What happens if I start with less battery?

Explain the charging plan for this journey.
```

This makes IGNITIONAI more than a traditional route planner by providing an **interactive conversational layer for EV navigation decisions**.

---

# 🌍 External APIs & Services

| Service           | Purpose                          |
| ----------------- | -------------------------------- |
| **Komoot Photon** | Location search and autocomplete |
| **OSRM**          | Road routing and route geometry  |
| **Groq API**      | AI-powered route analysis        |
| **Leaflet**       | Interactive map rendering        |

---

# 📁 Suggested Project Structure

```text
IGNITIONAI/
│
├── app/
│   ├── api/
│   │   └── ...
│   ├── components/
│   │   └── ...
│   ├── page.tsx
│   └── layout.tsx
│
├── components/
│   └── ...
│
├── lib/
│   └── ...
│
├── public/
│   └── ...
│
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

> The exact directory structure may vary depending on the implementation.

---

# 🔒 Security

IGNITIONAI uses environment variables for sensitive API credentials.

Do **not** expose your Groq API key directly in frontend code.

Use:

```env
GROQ_API_KEY=your_groq_api_key_here
```

and keep `.env.local` out of version control.

---

# 📋 Project Summary

| Category                 | Details                                 |
| ------------------------ | --------------------------------------- |
| **Project**              | IGNITIONAI                              |
| **Domain**               | Electric Vehicles / AI / Navigation     |
| **Frontend**             | Next.js 14, React 18, TypeScript        |
| **Styling**              | Tailwind CSS                            |
| **Mapping**              | Leaflet, React-Leaflet                  |
| **Routing**              | OSRM                                    |
| **Geocoding**            | Komoot Photon                           |
| **AI**                   | Groq                                    |
| **LLM**                  | Llama 3.3 70B Versatile                 |
| **Vehicle Intelligence** | EV battery/range profiler               |
| **Deployment Type**      | Local development / Next.js application |

---

# 🚧 Future Enhancements

Potential future improvements include:

* Live charging-station availability
* Real-time charging-station pricing
* Battery percentage input
* Weather-aware range estimation
* Traffic-aware energy consumption
* Elevation-aware battery calculations
* Regenerative braking estimation
* Real-time traffic integration
* More EV models
* User trip history
* Saved routes
* Mobile/PWA support
* Advanced charging optimization

---

# 👨‍💻 Author

**Eric Joseph Bejoy**

GitHub:
https://github.com/ericjbejoy-ux

---

# 📄 License

This project is intended for educational, development, and demonstration purposes.

Add an appropriate open-source license such as **MIT** if you intend to distribute the project publicly.

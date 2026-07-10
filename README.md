# InsideIIM Capital: AI Investment Research Agent

A retro-futuristic, terminal-style web application designed to run automated equity research, quantitative audit validation, and qualitative risk screening on any public enterprise or corporation. Powered by Gemini 2.5 Flash via the Vercel AI SDK, the platform delivers structural investment verdicts, simulated 5-year valuation projections, and offers an interactive lead analyst chatbot for follow-up questions.

---

## 1. Overview — What it Does

InsideIIM Capital acts as an autonomous investment research analyst. Users input a company name or ticker, and the application:
1. **Triggers a Multi-Agent Swarm Simulation**: Simulates the work of quantitative and qualitative agent nodes gathering reports, SEC 10-K filings, and web sentiment.
2. **Generates an Investment Verdict**: Decides on an equity rating (**INVEST** or **PASS**) accompanied by a deep executive rationale.
3. **Formulates Financial Metrics**: Synthesizes crucial performance metrics (e.g., P/E Ratio, YoY Growth, Debt-to-Equity) and labels their status (Healthy, Concern, Neutral).
4. **Highlights Moats & Vulnerabilities**: Identifies key structural strengths (competitive moats) and weaknesses (macro headwinds, structural vulnerabilities).
5. **Calculates a 5-Year Valuation Growth Curve**: Computes a simulated Discounted Cash Flow (DCF) trajectory under variable stress tests, visualized through a dynamic SVG trendline.
6. **Hosts a Follow-up Analyst Chat**: Allows the user to ask the "Lead Analyst" follow-up questions about the report's assumptions, keeping full context of the report.
7. **Dossier Exports**: Supports exporting the entire compiled report into clean Markdown (`.md`) format.

---

## 2. How to Run It (Setup & Execution)

### Prerequisites
* **Node.js** (v18+ recommended)
* **npm** or **yarn** / **pnpm**
* A Google AI Studio API Key (for Gemini access)

### Setup Steps
1. **Clone the repository** and navigate to the project directory:
   ```bash
   cd InsideIIM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory (if not already present) and populate it with your Google API Key:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
   ```

### Execution Steps
1. **Start the development server**:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.
3. Type any company (e.g., *Nvidia*, *Tata Motors*, *Tesla*) and click **Analyze** to watch the agents execute.

---

## 3. How It Works (Approach & Architecture)

The application is built using **Next.js (App Router)**, styled with modern typography and customized CSS classes representing a sleek dark-themed retro terminal.

```
┌──────────────────────────────────────────────────────────┐
│                      Client Browser                      │
└───────────┬──────────────────────────────────▲───────────┘
            │                                  │
   1. Request Analysis (POST)           2. Structured JSON Object
            │                                  │
┌───────────▼──────────────────────────────────┴───────────┐
│                    Next.js API Route                     │
│                  (/api/analyze/route.ts)                 │
└───────────┬──────────────────────────────────▲───────────┘
            │                                  │
   generateObject()                     Gemini API Response
            │                                  │
┌───────────▼──────────────────────────────────┴───────────┐
│              Google Gemini 2.5 Flash Model               │
│               (google("gemini-2.5-flash"))               │
└──────────────────────────────────────────────────────────┘
```

### Technical Blueprint:
* **Structured Research API (`/api/analyze/route.ts`)**: Uses the Vercel AI SDK's `generateObject` with a strict `zod` schema to guarantee that the Gemini 2.5 Flash model returns a predictable JSON payload. The model simulates a multi-agent workflow, generating technical research logs, valuation projections, and core metrics.
* **Context-Aware Follow-up API (`/api/chat/route.ts`)**: Implements `streamText` to power a conversational agent. When a user asks a follow-up question, the current report's context is injected into the system prompt, ensuring the model references only the generated metrics, strengths, and weaknesses.
* **Animated Frontend UI (`src/app/page.tsx`)**: Built using `framer-motion` for transitions, rendering terminal status bars, SVG trendlines, and message bubbles. Local history is kept in `localStorage` to allow quick toggling of previous reports.

---

## 4. Key Decisions & Trade-Offs

### 1. Gemini 2.5 Flash Model Selection
* **Why**: High token speed, ultra-low latency (crucial for responsive terminal animations), and strong JSON generation capabilities.
* **Trade-off**: Slightly less reasoning capability compared to Gemini 2.5 Pro, but this is offset by structuring the prompt clearly and using strict schemas to enforce clean analytical outputs.

### 2. Simulated Agent Logs & Projections
* **Why**: Doing real-time web scraping and live financial API requests on arbitrary input text (e.g., typos, obscure private companies) is prone to rate-limiting, slow execution times, and parsing errors. Instead, we use LLM-based structured inference to simulate these research steps and mathematical DCF trajectories.
* **Trade-off**: The values generated are AI-driven estimations rather than audited SEC database retrievals. To signal this to the user, we clearly label them as "Simulated Agent Audits" and "Simulation Summaries".

### 3. LocalStorage for History
* **Why**: Simple, zero-configuration setup for local evaluation.
* **Trade-off**: Reports are lost when clearing browser cache or switching devices.

---

## 5. Example Runs

### Example 1: Tata Motors (INVEST)
* **Verdict**: INVEST
* **Executive Rationale**: Tata Motors has capitalized heavily on its EV first-mover advantage in India, coupled with strong global recovery in the JLR (Jaguar Land Rover) segment. Cost restructuring has yielded premium margins despite supply chain friction.
* **Key Metrics**:
  * *YoY Revenue Growth*: +18.4% (Healthy)
  * *Operating Margin*: 8.2% (Neutral)
  * *Debt-to-Equity*: 1.2x (Concern)
* **Strengths**: Domestic EV market share domination (>70%), JLR order book backlog.
* **Weaknesses**: High consolidated debt load, vulnerability to global automotive semiconductor constraints.
* **5-Year Projections**: `[100, 115, 128, 142, 160]`

### Example 2: Tesla (PASS)
* **Verdict**: PASS
* **Executive Rationale**: While Tesla maintains industry-leading manufacturing margins and energy-storage growth, its current valuation trades at a massive premium multiplier that discounts severe headwinds in global EV adoption, price competition, and delayed Full Self-Driving (FSD) timelines.
* **Key Metrics**:
  * *P/E Ratio*: 62.4x (Concern)
  * *Delivery Growth*: +3.5% (Neutral)
  * *Free Cash Flow*: $4.8B (Healthy)
* **Strengths**: Global charging network dominance, high-margin software upsells.
* **Weaknesses**: Intense competition from Chinese manufacturers, margin compression from vehicle discounts.
* **5-Year Projections**: `[100, 95, 108, 115, 130]`

---

## 6. What We Would Improve with More Time

1. **Live Data Integration**: Connect the backend to Yahoo Finance (via `yfinance` or a financial API provider) and SEC EDGAR to pull real-time cash flow statements, balancing AI estimations with live data.
2. **Interactive SVG Elements**: Enhance the projection chart with hover tooltips displaying actual numbers and valuation metrics for each year.
3. **Multi-Agent Orchestration**: Implement a real Python-based multi-agent framework (like LangGraph or CrewAI) on the server, streaming real intermediate steps to the client terminal using Server-Sent Events (SSE).
4. **Persistent Database**: Replace LocalStorage with a PostgreSQL database (e.g., Supabase) to allow persistent portfolios, search bookmarks, and collaborative report sharing.

---

## 7. LLM Chat Transcript & Development Logs

During the development of InsideIIM Capital, the model worked collaboratively with the developer to refine the application structure:

### Phase 1: Planning and Component Organization
* Established the project structure using Next.js 16 (App Router).
* Designed a layout centering around a **unified terminal console** containing the Input Form, System Diagnostics, and Swarm Capability explanations.
* Drafted the state transitions: `idle` -> `loading` (query sent to API) -> `logging` (streaming logs to terminal console step-by-step) -> `done` (showing the full tabbed reports, charts, and lead analyst chatbot).

### Phase 2: Schema Enforcement
* Enforced structured output from Gemini using `zod` for the primary `/api/analyze` route to prevent any chance of invalid markdown or empty values breaking client components.
* Adjusted the projection array format to guarantee a consistent length of exactly 5 integers representing years 0 to 4.

### Phase 3: Conversational Context Handover
* Designed the `/api/chat` route to use a custom system prompt injecting the exact snapshot of the generated JSON data.
* Structured the final styling system with TailwindCSS styling (custom classes like `retro-border` and dark colors like `#050507` and `#0f0f11` to simulate a authentic terminal feeling).

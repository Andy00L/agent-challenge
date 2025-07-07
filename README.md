# Nosana Builders Challenge – Agent‑101

![Agent‑101](./assets/NosanaBuildersChallengeAgents.jpg)

## 2nd Edition Entry: **Advanced News Intelligence Agent**

This repository now contains a fully‑featured **News Intelligence Agent** that can:

1. **Fetch and structure breaking news** from multiple sources
2. **Analyse sentiment & emotions** in the coverage
3. **Fact‑check pivotal claims** against reputable outlets
4. **Detect and explain macro trends** around a topic or region
5. **Chain the above into a single _news‑intelligence‑workflow_** that outputs an executive briefing ready for decision‑makers

The agent is built with the [Mastra](https://github.com/mastra-ai/mastra) framework and serves as our official submission for the Nosana Agent‑101 challenge.

---

## Quick‑start

```bash
# 1. Install deps (pnpm is recommended)
pnpm install

# 2. Copy the example environment and add your keys
cp .env.example .env && nano .env

# 3. Launch the dev playground
pnpm run dev  # → http://localhost:8080
```

### Required environment variables

| Key                         | Used by                                                  | Purpose                                                       |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `API_BASE_URL`              | all Mastra agents                                        | Base URL of the LLM endpoint (Ollama or Nosana)               |
| `MODEL_NAME_AT_ENDPOINT`    | all Mastra agents                                        | Model ID served at the endpoint                               |
| `PERPLEXITY_API_KEY`        | **news**, **sentiment**, **fact‑check**, **trend** tools | Authenticates calls to the Perplexity AI Chat/Completions API |
| `NEWS_API_KEY` *(optional)* | (future) alternative news source API                     | Reserved – not presently required but left for expansion      |

A ready‑to‑edit `.env.example` is included.

---

## Code layout

```
src/mastra/agents/news-agent/
├── fact-check-tool.ts       # Verifies claims ⚖️
├── news-tool.ts             # Retrieves & summarises articles 📰
├── sentiment-tool.ts        # Emotion & polarity analysis 💭
├── trend-tool.ts            # Macro trend detection 📈
├── news-workflow.ts         # Chains the above into a single step 🔗
└── index.ts                 # Exports the Agent definition 🤖
```

### Tools in detail

- **`fetch-news`** (news‑tool) – returns a structured multi‑source digest. Uses Perplexity for reasoning fileciteturn1file10.
- **`analyze-sentiment`** (sentiment‑tool) – computes polarity, emotion vectors and key phrases fileciteturn1file13.
- **`fact-check`** (fact‑check‑tool) – cross‑references up to three sources and produces a verdict + evidence fileciteturn1file0.
- **`analyze-trends`** (trend‑tool) – spots rising/declining interest and predicts scenarios fileciteturn1file6.

### Workflow: `news-intelligence-workflow`

The workflow orchestrates the four tools to deliver an **executive briefing** that includes an overview, risks, sentiment metrics, verified/disputed claims, and forward‑looking recommendations fileciteturn1file4.

---

## Example prompts

```
"Give me a deep dive on the implications of the EU AI Act"
"Fact‑check: The iPhone 17 will switch entirely to e‑SIM in 2026"
"What are the current public emotions around Ethereum ETF approval?"
"Trend analysis for 'quantum computing' this quarter in APAC"
```

Mastra’s playground automatically selects the optimal tool or workflow based on these inputs (see decision logic in `index.ts` fileciteturn1file7).

---

## Docker ▶️ Nosana deployment

```bash
# Build & tag
docker build -t <user>/news-agent:latest .

# Local test
docker run -p 8080:8080 --env-file .env <user>/news-agent:latest

# Push
docker push <user>/news-agent:latest
```

Update `nos_job_def/nosana_mastra.json` with the image reference then:

```bash
nosana job post \
  --file nos_job_def/nosana_mastra.json \
  --market nvidia-3060 --timeout 30
```

Monitor your job on the [Nosana Dashboard](https://dashboard.nosana.com/deploy).

---

## Testing checklist

- ✅ `pnpm run dev` renders chat UI and agent responds
- ✅ API keys present and rate‑limits respected
- ✅ All four tools return structured JSON matching their Zod schemas
- ✅ Workflow produces `executiveSummary` and `metadata.confidence` > 0.8 for healthy topics

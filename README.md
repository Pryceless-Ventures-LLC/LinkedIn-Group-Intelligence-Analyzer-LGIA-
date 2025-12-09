# LinkedIn Group Intelligence Analyzer (MVP)

Analyze a LinkedIn group by scraping visible posts, classifying their content with OpenAI, and computing actionable scores and a JOIN/SKIP recommendation.

## Features
- Validates LinkedIn group URLs against a strict allowlist and group-path heuristic.
- Scrapes up to the last **N** visible posts (default 20) without logging in.
- Classifies each post (spam, promotional, educational, investor discussion, deal sourcing, general conversation, irrelevant) via OpenAI.
- Scores spam, engagement, and business relevance with clear thresholds.
- Returns a structured JSON report including a summary and JOIN/SKIP recommendation.

## Prerequisites
- Node.js 18+
- An OpenAI API key

## Configuration
Set environment variables in a `.env` file or your shell:

```
OPENAI_API_KEY=your-key-here   # required
PORT=4000                      # optional, defaults to 4000
NODE_ENV=development           # optional
SCRAPE_TIMEOUT=30000           # optional (ms)
MAX_POSTS=20                   # optional
HEADLESS_MODE=true             # optional ("false" to see the browser)
```

> The server will fail fast at startup if `OPENAI_API_KEY` is missing.

## Installation
```
npm install
```

## Running the server
```
npm run start
```

## API
### POST `/analyze`
Request body:
```json
{ "url": "https://www.linkedin.com/groups/..." }
```

Response:
```json
{
  "url": "https://www.linkedin.com/groups/...",
  "posts": [
    { "text": "...", "category": "educational", "isSpam": false, "engagementLevel": "low" }
  ],
  "report": {
    "totals": { "spam": 0, "promo": 0, "education": 1, "investor": 0, "deals": 0 },
    "scores": {
      "spamScore": 100,
      "engagementScore": 0,
      "relevanceScore": 100,
      "networkingScore": 80,
      "fundraisingScore": 0,
      "dealSourcingScore": 0
    },
    "recommendation": "JOIN",
    "summary": "Analyzed 1 posts..."
  }
}
```

### Example cURL test
Run the server, then execute:
```
curl -X POST http://localhost:4000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.linkedin.com/groups/123456"}'
```

## Notes
- Only URLs whose hostnames are on the allowlist and include a `/groups/<id>`-style path will be processed (e.g., `https://www.linkedin.com/groups/123456/`).
- The scraper uses headless Puppeteer by default and relies solely on publicly visible content.
- Thresholds for spam and relevance can be tuned in `scoring.js`.

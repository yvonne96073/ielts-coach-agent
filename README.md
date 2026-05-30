# IELTS Coach Agent

An MVP IELTS coaching workspace built with Next.js. It gives learners quick feedback on Writing or Speaking responses across the four IELTS-style criteria:

- Task Response
- Coherence and Cohesion
- Lexical Resource
- Grammar Range and Accuracy

The first version uses a local rule-based scoring engine so the app works immediately. The API route is intentionally isolated so it can later be upgraded to call an LLM.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
app/
  api/coach/route.ts   IELTS feedback API
  globals.css          App styling
  layout.tsx           App shell metadata
  page.tsx             Coaching workspace UI
lib/
  ieltsScoring.ts      Rule-based scoring engine
```

## Next Steps

- Add OpenAI-backed feedback generation
- Persist practice attempts
- Add band descriptors by task type
- Add speaking transcript timing and fluency checks

# IELTS Coach Agent

An adaptive IELTS coaching agent that observes learner answers, infers error patterns, generates targeted drills, and helps learners move from roughly Band 6 toward Band 7.5.

The current repository now includes both:

- product design, prompt architecture, sample data, and issue templates
- a working Next.js diagnostic MVP for Reading, Listening, Speaking, Writing, and Vocabulary

## Why This Project Exists

Many IELTS learners practise a lot but do not know why they keep losing marks. A normal chatbot can explain answers, but it usually does not track patterns such as over-inference in Reading, map-tracking failure in Listening, tense drift in Speaking, or spoken-style writing in Task 2.

This agent is built to act more like a coach:

- observe answers and reasoning
- infer the learner's method
- label recurring error patterns
- recommend targeted drills
- save vocabulary mistakes for review
- adapt future practice based on past weaknesses

## Current MVP

The first working version is a Next.js app that gives diagnostic feedback across Reading, Listening, Speaking, Writing, and Vocabulary. It does more than return a score: it identifies likely error patterns, infers the learner's method, points out the strategy issue, and assigns the next drill.

- Task Response or Fluency and Relevance
- Coherence and Cohesion
- Lexical Resource
- Grammar Range and Accuracy
- Likely method and strategy issue
- Next targeted drill
- Local recurring-pattern memory for recent attempts
- Vocabulary review fields for a future Notion sync

The MVP uses a local rule-based scoring engine so the app works immediately. The API route is intentionally isolated so it can later be upgraded to call an LLM.

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

## Core Modules

- **Reading Coach**: paragraph function, TFNG anti-inference, headings, evidence location
- **Listening Coach**: prediction, distractor detection, map re-anchoring, transcript review
- **Vocabulary Coach**: daily quizzes, YouGlish pronunciation links, Notion wrong-word review
- **Speaking Coach**: examiner mode, sentence variety, tense control, natural Band 7 rewrites
- **Writing Coach**: Task 1 structure recall, word-count builder, Task 2 academic conversion
- **Diagnostic Engine**: observes learner answers and recommends the next best drill

## Repository Structure

```text
app/        Next.js app, UI, and API routes
lib/        Rule-based IELTS scoring engine
docs/       Product design, architecture, schemas, and learning loop
prompts/    System prompt and IELTS module prompts
data/       Sample vocabulary and diagnostic data
.github/    Issue templates for iterative feature development
```

## Example Diagnostic Feedback

Learner chooses `True` for a TFNG question.

Correct answer: `Not Given`

Learner explanation: "The programme was designed to reduce pollution, so it should reduce pollution."

Agent feedback:

```text
Correctness: Not correct.
Evidence: The passage says the programme was introduced in an attempt to reduce pollution, but it does not prove pollution decreased.
Likely method: You treated intention as result.
Error pattern: Over-inference.
Better method: For TFNG, intention is not evidence of outcome.
Next drill: 5 intention-vs-result TFNG questions.
```

## Notion Vocabulary Workflow

When the learner misses a vocabulary item, the agent prepares a record with:

- word or phrase
- Chinese meaning
- English meaning
- IELTS-style example sentence
- collocations
- YouGlish UK pronunciation link
- error type
- next review date

The goal is to learn words through meaning, context, pronunciation, and spaced retrieval.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Next Steps

- Add OpenAI-backed feedback generation
- Persist practice attempts
- Add band descriptors by task type
- Add speaking transcript timing and fluency checks
- Add Notion vocabulary sync

# IELTS Coach Agent

An adaptive IELTS coaching agent that observes learner answers, infers error patterns, generates targeted drills, and syncs vocabulary mistakes to Notion for spaced review.

This project is designed around a real learner profile: an IELTS candidate currently around Band 6, aiming for Band 7.5. The agent focuses on diagnosis-driven practice rather than generic IELTS advice.

## Why This Project Exists

Many IELTS learners practise a lot but do not know why they keep losing marks. A normal chatbot can explain answers, but it usually does not track patterns such as over-inference in Reading, map-tracking failure in Listening, tense drift in Speaking, or spoken-style writing in Task 2.

This agent is built to act more like a coach:

- observe answers and reasoning
- infer the learner's method
- label recurring error patterns
- recommend targeted drills
- save vocabulary mistakes for review
- adapt future practice based on past weaknesses

## Core Modules

- **Reading Coach**: paragraph function, TFNG anti-inference, headings, evidence location
- **Listening Coach**: prediction, distractor detection, map re-anchoring, transcript review
- **Vocabulary Coach**: daily quizzes, YouGlish pronunciation links, Notion wrong-word review
- **Speaking Coach**: examiner mode, sentence variety, tense control, natural Band 7 rewrites
- **Writing Coach**: Task 1 structure recall, word-count builder, Task 2 academic conversion
- **Diagnostic Engine**: observes learner answers and recommends the next best drill

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

## Repository Structure

```text
docs/       Product design, architecture, schemas, and learning loop
prompts/    System prompt and IELTS module prompts
data/       Sample vocabulary and diagnostic data
.github/    Issue templates for iterative feature development
```

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Status

This repository is currently in the product design and prompt architecture stage. The next milestone is a working MVP with a text-based agent flow and Notion vocabulary integration.

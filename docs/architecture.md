# Architecture

## Conceptual Modules

- Orchestrator: routes learner requests to the right IELTS module
- Diagnostic Engine: infers method and error pattern from learner answers
- Reading Coach: paragraph function, TFNG, headings, locating
- Listening Coach: prediction, distractors, maps, transcript review
- Vocabulary Coach: daily quizzes, spaced review, YouGlish, Notion import
- Speaking Coach: examiner mode, tense control, sentence variety
- Writing Coach: Task 1 structure, Task 2 academic style, grammar control
- Integrations: Notion and YouGlish links

## Data Objects

- LearnerProfile
- PracticeSession
- AnswerObservation
- DiagnosticResult
- VocabularyRecord
- ReviewSchedule

## MVP Approach

Start with prompt-driven modules and structured markdown documentation. Add code only after the agent behavior is stable enough to formalize.

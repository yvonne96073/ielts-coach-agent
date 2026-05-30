export type PracticeMode = "writing" | "speaking";

export type CriterionFeedback = {
  name: string;
  score: number;
  summary: string;
  suggestions: string[];
};

export type CoachFeedback = {
  mode: PracticeMode;
  estimatedBand: number;
  overview: string;
  strengths: string[];
  priorities: string[];
  criteria: CriterionFeedback[];
};

type ScoreInput = {
  mode: PracticeMode;
  task: string;
  answer: string;
};

const BAND_MIN = 4;
const BAND_MAX = 8;

export function scoreIeltsResponse(input: ScoreInput): CoachFeedback {
  const words = tokenize(input.answer);
  const sentences = splitSentences(input.answer);
  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
  const averageSentenceLength = sentences.length ? words.length / sentences.length : 0;
  const connectorCount = countMatches(input.answer, [
    "however",
    "therefore",
    "moreover",
    "although",
    "because",
    "firstly",
    "secondly",
    "finally",
    "in addition",
    "for example",
    "as a result",
  ]);
  const complexPunctuation = countMatches(input.answer, [";", ":", "(", ")"]);

  const taskScore = clampBand(
    4.5 +
      Math.min(words.length / targetWordCount(input.mode), 1.4) * 1.7 +
      (mentionsTaskTerms(input.task, input.answer) ? 0.6 : 0) +
      (hasExamples(input.answer) ? 0.5 : 0),
  );

  const coherenceScore = clampBand(
    4.5 +
      Math.min(sentences.length / 10, 1) * 0.8 +
      Math.min(connectorCount / 5, 1) * 1.1 +
      (averageSentenceLength >= 10 && averageSentenceLength <= 28 ? 0.7 : 0),
  );

  const lexicalScore = clampBand(
    4.5 +
      Math.min(uniqueWords.size / Math.max(words.length, 1), 0.72) * 2 +
      Math.min(words.filter((word) => word.length >= 8).length / 12, 1) * 0.8,
  );

  const grammarScore = clampBand(
    4.5 +
      (sentences.length >= 4 ? 0.7 : 0) +
      (averageSentenceLength >= 12 ? 0.5 : 0) +
      Math.min(complexPunctuation / 3, 1) * 0.4 +
      (hasRepeatedBasicErrors(input.answer) ? -0.7 : 0),
  );

  const criteria: CriterionFeedback[] = [
    {
      name: input.mode === "writing" ? "Task Response" : "Fluency and Relevance",
      score: taskScore,
      summary: summarizeTask(taskScore, input.mode),
      suggestions: buildTaskSuggestions(input.mode, words.length, input.task, input.answer),
    },
    {
      name: "Coherence and Cohesion",
      score: coherenceScore,
      summary: summarizeCoherence(coherenceScore),
      suggestions: buildCoherenceSuggestions(connectorCount, averageSentenceLength),
    },
    {
      name: "Lexical Resource",
      score: lexicalScore,
      summary: summarizeLexical(lexicalScore),
      suggestions: buildLexicalSuggestions(words.length, uniqueWords.size),
    },
    {
      name: "Grammar Range and Accuracy",
      score: grammarScore,
      summary: summarizeGrammar(grammarScore),
      suggestions: buildGrammarSuggestions(sentences.length, averageSentenceLength),
    },
  ];

  const estimatedBand = roundToHalf(
    criteria.reduce((total, item) => total + item.score, 0) / criteria.length,
  );

  return {
    mode: input.mode,
    estimatedBand,
    overview: buildOverview(estimatedBand, input.mode),
    strengths: buildStrengths(criteria),
    priorities: buildPriorities(criteria),
    criteria,
  };
}

function tokenize(text: string) {
  return text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
}

function splitSentences(text: string) {
  return text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function countMatches(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0);
}

function targetWordCount(mode: PracticeMode) {
  return mode === "writing" ? 250 : 160;
}

function mentionsTaskTerms(task: string, answer: string) {
  const taskTerms = tokenize(task)
    .filter((word) => word.length > 4)
    .map((word) => word.toLowerCase());
  const answerText = answer.toLowerCase();

  return taskTerms.some((term) => answerText.includes(term));
}

function hasExamples(answer: string) {
  return /for example|for instance|such as|in my experience|one example/i.test(answer);
}

function hasRepeatedBasicErrors(answer: string) {
  return /\bi am agree\b|\bhe go\b|\bshe go\b|\bpeople is\b|\bmore better\b/i.test(answer);
}

function clampBand(score: number) {
  return roundToHalf(Math.min(BAND_MAX, Math.max(BAND_MIN, score)));
}

function roundToHalf(score: number) {
  return Math.round(score * 2) / 2;
}

function summarizeTask(score: number, mode: PracticeMode) {
  if (score >= 7) {
    return mode === "writing"
      ? "The response addresses the prompt with enough development for a strong first draft."
      : "The answer stays relevant and gives enough detail to sound purposeful.";
  }

  if (score >= 6) {
    return "The main idea is clear, but parts need more specific support and sharper development.";
  }

  return "The response needs clearer coverage of the prompt and more developed examples.";
}

function summarizeCoherence(score: number) {
  if (score >= 7) {
    return "Ideas are organized clearly, with transitions that help the reader follow the argument.";
  }

  if (score >= 6) {
    return "The structure is understandable, but links between ideas could be smoother.";
  }

  return "The response would benefit from clearer paragraphing and more explicit logical links.";
}

function summarizeLexical(score: number) {
  if (score >= 7) {
    return "Vocabulary range is promising and includes some precise topic language.";
  }

  if (score >= 6) {
    return "Vocabulary is adequate, though some phrases could be more natural and specific.";
  }

  return "Vocabulary is understandable but currently too general for a higher band.";
}

function summarizeGrammar(score: number) {
  if (score >= 7) {
    return "Sentence control is generally strong, with signs of flexible structure.";
  }

  if (score >= 6) {
    return "Grammar communicates the message, but sentence variety and accuracy need tightening.";
  }

  return "Grammar issues may distract from the message, especially in longer sentences.";
}

function buildTaskSuggestions(
  mode: PracticeMode,
  wordCount: number,
  task: string,
  answer: string,
) {
  const suggestions = [
    mode === "writing"
      ? "State your position in the introduction and return to it in the conclusion."
      : "Answer directly first, then extend with a reason, example, or short contrast.",
  ];

  if (wordCount < targetWordCount(mode)) {
    suggestions.push(
      `Develop the response further; this draft has about ${wordCount} words.`,
    );
  }

  if (!mentionsTaskTerms(task, answer)) {
    suggestions.push("Reuse key terms from the task so the response clearly targets the question.");
  }

  if (!hasExamples(answer)) {
    suggestions.push("Add one concrete example to make the main point easier to evaluate.");
  }

  return suggestions;
}

function buildCoherenceSuggestions(connectorCount: number, averageSentenceLength: number) {
  const suggestions = ["Group each main idea into its own paragraph or spoken chunk."];

  if (connectorCount < 3) {
    suggestions.push("Use a few natural linking phrases such as however, for example, or as a result.");
  }

  if (averageSentenceLength > 28) {
    suggestions.push("Split long sentences so the logic is easier to follow.");
  }

  if (averageSentenceLength < 10) {
    suggestions.push("Combine some short sentences to create smoother development.");
  }

  return suggestions;
}

function buildLexicalSuggestions(wordCount: number, uniqueWordCount: number) {
  const variety = uniqueWordCount / Math.max(wordCount, 1);
  const suggestions = ["Replace broad words like good, bad, thing, and many with topic-specific language."];

  if (variety < 0.45) {
    suggestions.push("Reduce repeated vocabulary by using accurate synonyms or paraphrases.");
  }

  suggestions.push("Add one or two collocations that match the topic, but keep them natural.");

  return suggestions;
}

function buildGrammarSuggestions(sentenceCount: number, averageSentenceLength: number) {
  const suggestions = ["Proofread subject-verb agreement, articles, and plural nouns first."];

  if (sentenceCount < 5) {
    suggestions.push("Use more complete sentences so the examiner can see range and control.");
  }

  if (averageSentenceLength < 12) {
    suggestions.push("Try one complex sentence with although, while, or because.");
  }

  suggestions.push("Keep complex structures accurate before making them longer.");

  return suggestions;
}

function buildOverview(estimatedBand: number, mode: PracticeMode) {
  const taskName = mode === "writing" ? "writing draft" : "speaking answer";

  if (estimatedBand >= 7) {
    return `This ${taskName} is already organized and relevant. The next gain is precision: sharper examples, cleaner grammar, and more natural topic vocabulary.`;
  }

  if (estimatedBand >= 6) {
    return `This ${taskName} has a workable foundation. To move up, develop each main idea more fully and make the links between ideas easier to follow.`;
  }

  return `This ${taskName} communicates a basic message, but it needs clearer structure, fuller support, and more accurate sentence control.`;
}

function buildStrengths(criteria: CriterionFeedback[]) {
  return criteria
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((criterion) => `${criterion.name}: ${criterion.summary}`);
}

function buildPriorities(criteria: CriterionFeedback[]) {
  return criteria
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .flatMap((criterion) => criterion.suggestions.slice(0, 1));
}

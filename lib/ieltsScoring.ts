export type PracticeMode = "writing" | "speaking" | "reading" | "listening" | "vocabulary";

export type CriterionFeedback = {
  name: string;
  score: number;
  summary: string;
  suggestions: string[];
};

export type DiagnosticFinding = {
  pattern: string;
  likelyMethod: string;
  strategyIssue: string;
  betterMethod: string;
  nextDrill: string;
};

export type NotionVocabularyRecord = {
  wordOrPhrase: string;
  chineseMeaning: string;
  englishMeaning: string;
  ieltsExample: string;
  collocations: string[];
  pronunciationLink: string;
  soundNote: string;
  errorType: string;
  nextReviewDate: string;
  errorCount: number;
  existingDatabaseMapping: {
    databaseName: string;
    wordProperty: string;
    meaningProperty: string;
    englishProperty: string;
    sentenceProperty: string;
    collocationProperty: string;
    pronunciationProperty: string;
    soundNoteProperty: string;
    nextReviewProperty: string;
    errorTypeProperty: string;
    listeningMistakeProperty: string;
  };
};

export type CoachFeedback = {
  mode: PracticeMode;
  estimatedBand: number;
  overview: string;
  strengths: string[];
  priorities: string[];
  diagnostics: DiagnosticFinding[];
  nextDrills: string[];
  notionVocabularyRecord?: NotionVocabularyRecord;
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
      name: primaryCriterionName(input.mode),
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
  const diagnostics = diagnosePatterns(input, {
    wordCount: words.length,
    sentenceCount: sentences.length,
    averageSentenceLength,
    connectorCount,
  });

  return {
    mode: input.mode,
    estimatedBand,
    overview: buildOverview(estimatedBand, input.mode),
    strengths: buildStrengths(criteria),
    priorities: buildPriorities(criteria, diagnostics),
    diagnostics,
    nextDrills: diagnostics.map((diagnostic) => diagnostic.nextDrill),
    notionVocabularyRecord:
      input.mode === "vocabulary" ? buildNotionVocabularyRecord(input) : undefined,
    criteria,
  };
}

function tokenize(text: string): string[] {
  return Array.from(text.matchAll(/[A-Za-z]+(?:'[A-Za-z]+)?/g), (match) => match[0]);
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
  if (mode === "writing") {
    return 250;
  }

  if (mode === "speaking") {
    return 160;
  }

  return 120;
}

function primaryCriterionName(mode: PracticeMode) {
  const names: Record<PracticeMode, string> = {
    writing: "Task Response",
    speaking: "Fluency and Relevance",
    reading: "Evidence and Question Focus",
    listening: "Prediction and Detail Tracking",
    vocabulary: "Meaning, Use, and Recall",
  };

  return names[mode];
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
    if (mode === "writing") {
      return "The response addresses the prompt with enough development for a strong first draft.";
    }

    if (mode === "speaking") {
      return "The answer stays relevant and gives enough detail to sound purposeful.";
    }

    return "The response shows clear attention to the task and uses enough detail to diagnose the next step.";
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
    primarySuggestion(mode),
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

function primarySuggestion(mode: PracticeMode) {
  const suggestions: Record<PracticeMode, string> = {
    writing: "State your position in the introduction and return to it in the conclusion.",
    speaking: "Answer directly first, then extend with a reason, example, or short contrast.",
    reading: "Quote or paraphrase the exact evidence before choosing the answer.",
    listening: "Write the predicted answer type before checking the transcript or notes.",
    vocabulary: "Record the word with meaning, collocation, pronunciation cue, and one IELTS sentence.",
  };

  return suggestions[mode];
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
  const taskName = modeLabel(mode);

  if (estimatedBand >= 7) {
    return `This ${taskName} is already organized and relevant. The next gain is precision: sharper examples, cleaner grammar, and more natural topic vocabulary.`;
  }

  if (estimatedBand >= 6) {
    return `This ${taskName} has a workable foundation. To move up, develop each main idea more fully and make the links between ideas easier to follow.`;
  }

  return `This ${taskName} communicates a basic message, but it needs clearer structure, fuller support, and more accurate sentence control.`;
}

function modeLabel(mode: PracticeMode) {
  const labels: Record<PracticeMode, string> = {
    writing: "writing draft",
    speaking: "speaking answer",
    reading: "reading explanation",
    listening: "listening review",
    vocabulary: "vocabulary note",
  };

  return labels[mode];
}

function buildStrengths(criteria: CriterionFeedback[]) {
  return criteria
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((criterion) => `${criterion.name}: ${criterion.summary}`);
}

function buildPriorities(criteria: CriterionFeedback[], diagnostics: DiagnosticFinding[]) {
  const criterionPriorities = criteria
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .flatMap((criterion) => criterion.suggestions.slice(0, 1));

  return [
    ...diagnostics.slice(0, 2).map((diagnostic) => diagnostic.betterMethod),
    ...criterionPriorities,
  ].slice(0, 4);
}

function diagnosePatterns(
  input: ScoreInput,
  stats: {
    wordCount: number;
    sentenceCount: number;
    averageSentenceLength: number;
    connectorCount: number;
  },
): DiagnosticFinding[] {
  const text = `${input.task} ${input.answer}`.toLowerCase();
  const findings: DiagnosticFinding[] = [];

  if (input.mode === "reading") {
    if (/(tfng|true|false|not given|should|probably|intention|designed|attempt|result)/i.test(text)) {
      findings.push({
        pattern: "Reading: over-inference",
        likelyMethod: "You may be treating intention, common sense, or a likely result as textual proof.",
        strategyIssue: "The answer is being decided from what sounds reasonable, not from what the passage directly proves.",
        betterMethod: "Separate evidence from inference: underline the exact words that prove the answer before choosing True, False, or Not Given.",
        nextDrill: "5-question intention-vs-result TFNG drill",
      });
    }

    if (/(heading|main idea|paragraph|function|purpose)/i.test(text)) {
      findings.push({
        pattern: "Reading: paragraph function confusion",
        likelyMethod: "You may be matching headings by repeated keywords instead of the paragraph's job.",
        strategyIssue: "Keyword overlap can hide whether the paragraph is defining, contrasting, giving evidence, or showing a result.",
        betterMethod: "Label each paragraph function in 3 to 5 words before looking at heading options.",
        nextDrill: "paragraph function labelling set",
      });
    }

    if (/(locat|line|where|cannot find|evidence)/i.test(text)) {
      findings.push({
        pattern: "Reading: evidence location failure",
        likelyMethod: "You may be scanning for a single word instead of a paraphrased idea.",
        strategyIssue: "The location step breaks when the passage uses synonyms or a different grammatical form.",
        betterMethod: "Predict two paraphrases for the question keywords, then scan for those meanings.",
        nextDrill: "keyword-to-paraphrase locating drill",
      });
    }
  }

  if (input.mode === "listening") {
    if (/(map|left|right|north|south|turn|entrance|opposite|next to)/i.test(text)) {
      findings.push({
        pattern: "Listening: map re-anchor loss",
        likelyMethod: "You may keep following the old location after the speaker changes direction.",
        strategyIssue: "Once the anchor point is lost, the next two or three answers can collapse together.",
        betterMethod: "Mark the current anchor after every direction phrase and reset from that point.",
        nextDrill: "map re-anchor drill with pause points",
      });
    }

    if (/(distractor|but|however|changed|instead|actually|not|rather)/i.test(text)) {
      findings.push({
        pattern: "Listening: distractor trap",
        likelyMethod: "You may write the first plausible answer before the speaker corrects it.",
        strategyIssue: "IELTS often gives an attractive wrong answer before the real answer.",
        betterMethod: "Wait for contrast markers like but, instead, actually, and final confirmation.",
        nextDrill: "distractor detection transcript drill",
      });
    }

    if (/(missed|lost|after that|next question|couldn't follow|could not follow)/i.test(text)) {
      findings.push({
        pattern: "Listening: chain error after one miss",
        likelyMethod: "You may keep thinking about the missed answer while the recording moves on.",
        strategyIssue: "One blank answer is turning into several wrong answers.",
        betterMethod: "Skip immediately after 2 seconds and re-anchor on the next question keyword.",
        nextDrill: "one-miss recovery drill",
      });
    }
  }

  if (input.mode === "speaking") {
    if (stats.averageSentenceLength < 12 || stats.sentenceCount < 5) {
      findings.push({
        pattern: "Speaking: simple sentence repetition",
        likelyMethod: "You may be answering in short safe sentences to avoid grammar mistakes.",
        strategyIssue: "Accuracy is protected, but fluency and grammatical range stay capped.",
        betterMethod: "Use answer plus reason plus example, then add one contrast sentence.",
        nextDrill: "Band 7 extension ladder drill",
      });
    }

    if (/(gonna|wanna|stuff|things|a lot of|kids|you know|like,)/i.test(text)) {
      findings.push({
        pattern: "Speaking: overly casual word choice",
        likelyMethod: "You may be relying on conversational filler when searching for ideas.",
        strategyIssue: "The answer can sound natural but too imprecise for Band 7 lexical resource.",
        betterMethod: "Replace filler with one specific noun phrase and one topic collocation.",
        nextDrill: "casual-to-precise speaking rewrite",
      });
    }

    if (/(yesterday|last year|when i was|in the past|now|currently|will|would)/i.test(text)) {
      findings.push({
        pattern: "Speaking: tense drift",
        likelyMethod: "You may switch time frames while extending the answer.",
        strategyIssue: "The examiner may hear unclear control between past experience, present habit, and future plan.",
        betterMethod: "Label the answer timeline first: past, present, future, then keep each chunk consistent.",
        nextDrill: "past-present-future cue card drill",
      });
    }
  }

  if (input.mode === "writing") {
    if (stats.wordCount < 250) {
      findings.push({
        pattern: "Writing: Task 2 under-development",
        likelyMethod: "You may stop after stating a reason without extending it into explanation and example.",
        strategyIssue: "The essay can be clear but too thin to fully satisfy task response.",
        betterMethod: "Build each body paragraph as point, why, example, consequence.",
        nextDrill: "word-count expansion paragraph drill",
      });
    }

    if (/(i think|you know|a lot of|kids|stuff|things|really good|bad)/i.test(text)) {
      findings.push({
        pattern: "Writing: spoken-style Task 2",
        likelyMethod: "You may be drafting the essay the way you would explain it in conversation.",
        strategyIssue: "The ideas are understandable, but the register sounds too informal for academic writing.",
        betterMethod: "Convert personal or casual phrasing into neutral academic claims.",
        nextDrill: "spoken-to-academic Task 2 rewrite",
      });
    }

    if (stats.averageSentenceLength < 14 || stats.connectorCount < 3) {
      findings.push({
        pattern: "Writing: limited sentence variety",
        likelyMethod: "You may be using repeated simple sentence frames to stay safe.",
        strategyIssue: "The essay may lack the complex structures needed for a higher grammar score.",
        betterMethod: "Add one concession sentence and one cause-result sentence in each essay.",
        nextDrill: "sentence variety control drill",
      });
    }
  }

  if (input.mode === "vocabulary") {
    if (/(chinese|中文|meaning|意思|translate|translation)/i.test(text)) {
      findings.push({
        pattern: "Vocabulary: Chinese-meaning-only memory",
        likelyMethod: "You may be memorising the Chinese translation without usage context.",
        strategyIssue: "Recognition improves, but active use and listening recognition stay weak.",
        betterMethod: "Save English meaning, collocation, pronunciation cue, and one IELTS sentence together.",
        nextDrill: "meaning-to-collocation recall quiz",
      });
    }

    if (/(pronunciation|pronounce|sound|listen|heard|hearing|youglish)/i.test(text)) {
      findings.push({
        pattern: "Vocabulary: pronunciation recognition gap",
        likelyMethod: "You may know the written word but not its connected-speech sound.",
        strategyIssue: "The word is stored visually, so it disappears in Listening.",
        betterMethod: "Review the word through YouGlish, then repeat the sentence aloud twice.",
        nextDrill: "YouGlish shadowing mini-drill",
      });
    }

    if (/(forget|forgot|review|again|remember|spaced|同義|synonym|paraphrase)/i.test(text)) {
      findings.push({
        pattern: "Vocabulary: weak spaced recall or paraphrase",
        likelyMethod: "You may review the word once but not retrieve it across time or paraphrases.",
        strategyIssue: "The word feels familiar but cannot be recalled under IELTS pressure.",
        betterMethod: "Schedule 1-day, 3-day, 7-day reviews and practise one synonym swap.",
        nextDrill: "spaced review plus synonym swap quiz",
      });
    }
  }

  if (findings.length === 0) {
    findings.push(defaultDiagnostic(input.mode));
  }

  return findings.slice(0, 3);
}

function defaultDiagnostic(mode: PracticeMode): DiagnosticFinding {
  const defaults: Record<PracticeMode, DiagnosticFinding> = {
    reading: {
      pattern: "Reading: evidence discipline check",
      likelyMethod: "Your explanation does not reveal a clear recurring pattern yet.",
      strategyIssue: "The next step is to make your evidence trail visible.",
      betterMethod: "Write the exact evidence, then write why it proves or does not prove the option.",
      nextDrill: "evidence-only answer explanation drill",
    },
    listening: {
      pattern: "Listening: prediction routine check",
      likelyMethod: "Your review does not reveal a clear recurring pattern yet.",
      strategyIssue: "Without a prediction, it is harder to notice distractors and answer type.",
      betterMethod: "Predict noun, number, place, date, or adjective before listening.",
      nextDrill: "answer-type prediction drill",
    },
    speaking: {
      pattern: "Speaking: answer development check",
      likelyMethod: "Your answer does not reveal a strong recurring pattern yet.",
      strategyIssue: "The answer may need more visible structure for Band 7 control.",
      betterMethod: "Use direct answer, reason, example, and reflection.",
      nextDrill: "4-step cue card expansion drill",
    },
    writing: {
      pattern: "Writing: academic control check",
      likelyMethod: "Your draft does not reveal a strong recurring pattern yet.",
      strategyIssue: "The next step is to separate idea quality from language control.",
      betterMethod: "Revise once for idea development and once for grammar range.",
      nextDrill: "two-pass Task 2 revision drill",
    },
    vocabulary: {
      pattern: "Vocabulary: record completeness check",
      likelyMethod: "Your note does not reveal a strong recurring pattern yet.",
      strategyIssue: "A word record without context is hard to reuse.",
      betterMethod: "Store meaning, example, collocation, pronunciation, error type, and review date.",
      nextDrill: "complete vocabulary card drill",
    },
  };

  return defaults[mode];
}

function buildNotionVocabularyRecord(input: ScoreInput): NotionVocabularyRecord {
  const candidate = extractVocabularyCandidate(input);
  const encoded = encodeURIComponent(candidate);
  const nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    wordOrPhrase: candidate,
    chineseMeaning: "Add Chinese meaning during review",
    englishMeaning: "Add a learner-friendly English definition",
    ieltsExample: `I will practise using "${candidate}" in one IELTS-style sentence.`,
    collocations: buildCollocations(candidate),
    pronunciationLink: `https://youglish.com/pronounce/${encoded}/english/uk`,
    soundNote: buildSoundNote(candidate),
    errorType: inferVocabularyErrorType(input),
    nextReviewDate,
    errorCount: 1,
    existingDatabaseMapping: {
      databaseName: "IELTS",
      wordProperty: "Word",
      meaningProperty: "中文",
      englishProperty: "English",
      sentenceProperty: "Example",
      collocationProperty: "Collocation",
      pronunciationProperty: "YouGlish",
      soundNoteProperty: "Sound Note",
      nextReviewProperty: "Next Review",
      errorTypeProperty: "Error Type",
      listeningMistakeProperty: "聽成",
    },
  };
}

function extractVocabularyCandidate(input: ScoreInput) {
  const combined = `${input.task} ${input.answer}`;
  const explicitMatch =
    combined.match(/(?:word|phrase|review|for)\s+["']?([A-Za-z][A-Za-z-]{3,})["']?/i) ??
    combined.match(/["']([A-Za-z][A-Za-z-]{3,})["']/);

  if (explicitMatch?.[1]) {
    return explicitMatch[1];
  }

  return (
    tokenize(combined).find(
      (word) =>
        word.length >= 5 &&
        !["vocabulary", "review", "meaning", "chinese", "english"].includes(
          word.toLowerCase(),
        ),
    ) ?? "target phrase"
  );
}

function buildCollocations(word: string) {
  const lower = word.toLowerCase();
  const known: Record<string, string[]> = {
    exacerbate: ["exacerbate a problem", "exacerbate inequality"],
    mitigate: ["mitigate the impact", "mitigate climate change"],
    alleviate: ["alleviate pain", "alleviate traffic congestion"],
  };

  return known[lower] ?? [`use ${word} accurately`, `${word} in context`];
}

function buildSoundNote(word: string) {
  const lower = word.toLowerCase();
  const known: Record<string, string> = {
    exacerbate: "Stress is usually on the second syllable: ex-AC-er-bate.",
    mitigate: "Stress is usually on the first syllable: MIT-i-gate.",
    alleviate: "Stress is usually on the second syllable: al-LE-vi-ate.",
  };

  return known[lower] ?? "Listen for the main stress and one connected-speech example.";
}

function inferVocabularyErrorType(input: ScoreInput) {
  const text = `${input.task} ${input.answer}`.toLowerCase();

  if (/pronunciation|pronounce|sound|listen|heard|hearing/.test(text)) {
    return "pronunciation";
  }

  if (/collocation|搭配/.test(text)) {
    return "collocation";
  }

  if (/paraphrase|synonym|同義/.test(text)) {
    return "paraphrase";
  }

  if (/spell|spelling|拼/.test(text)) {
    return "spelling";
  }

  if (/active|use|造句/.test(text)) {
    return "active use";
  }

  return "meaning";
}

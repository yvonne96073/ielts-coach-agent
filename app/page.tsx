"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CoachFeedback, PracticeMode } from "@/lib/ieltsScoring";

const sampleTasks: Record<PracticeMode, string> = {
  writing:
    "Some people believe that technology makes students less independent. To what extent do you agree or disagree?",
  speaking:
    "Describe a skill you would like to learn in the future. You should say what it is, why you want to learn it, how you would learn it, and how it would help you.",
};

export default function Home() {
  const [mode, setMode] = useState<PracticeMode>("writing");
  const [task, setTask] = useState(sampleTasks.writing);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const wordCount = useMemo(() => {
    return answer.trim().match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
  }, [answer]);

  function changeMode(nextMode: PracticeMode) {
    setMode(nextMode);
    setTask(sampleTasks[nextMode]);
    setFeedback(null);
    setError("");
  }

  async function submitForFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode, task, answer }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate feedback.");
      }

      setFeedback(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not generate feedback.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">IC</div>
            <div>
              <p>IELTS Coach Agent</p>
              <p className="muted">Writing and speaking practice desk</p>
            </div>
          </div>
          <div className="topbar-meta">
            <span className="status-dot" aria-hidden="true" />
            <span>Rule-based MVP</span>
          </div>
        </div>
      </header>

      <div className="workspace">
        <form className="panel practice-panel" onSubmit={submitForFeedback}>
          <div className="section-heading">
            <div>
              <h1>Practice, score, revise.</h1>
              <p className="muted">
                Paste an IELTS answer and get focused band-style feedback in seconds.
              </p>
            </div>
          </div>

          <div className="mode-grid" aria-label="Practice mode">
            <button
              className={`mode-option ${mode === "writing" ? "active" : ""}`}
              type="button"
              onClick={() => changeMode("writing")}
            >
              <strong>Writing</strong>
              <span>Task 2 essay feedback</span>
            </button>
            <button
              className={`mode-option ${mode === "speaking" ? "active" : ""}`}
              type="button"
              onClick={() => changeMode("speaking")}
            >
              <strong>Speaking</strong>
              <span>Part 2 style answer feedback</span>
            </button>
          </div>

          <label className="field-group">
            <span className="field-label">IELTS task</span>
            <textarea
              className="task-input"
              value={task}
              onChange={(event) => setTask(event.target.value)}
            />
          </label>

          <label className="field-group">
            <span className="field-label">Your answer</span>
            <textarea
              className="answer-input"
              placeholder="Type or paste your response here..."
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
          </label>

          {error ? <div className="alert">{error}</div> : null}

          <div className="action-row">
            <span className="word-count">{wordCount} words</span>
            <button className="primary-button" disabled={isLoading} type="submit">
              {isLoading ? "Scoring..." : "Get feedback"}
            </button>
          </div>
        </form>

        <section className="panel result-panel" aria-live="polite">
          {feedback ? (
            <>
              <div className="feedback-header">
                <div>
                  <h2>Coach feedback</h2>
                  <p className="muted">{feedback.overview}</p>
                </div>
                <div className="band-score">
                  <div>
                    <strong>{feedback.estimatedBand.toFixed(1)}</strong>
                    <span>estimated band</span>
                  </div>
                </div>
              </div>

              <div className="feedback-body">
                <section>
                  <h3>Top priorities</h3>
                  <ul className="suggestion-list">
                    {feedback.priorities.map((priority) => (
                      <li key={priority}>{priority}</li>
                    ))}
                  </ul>
                </section>

                <section className="criterion-list">
                  {feedback.criteria.map((criterion) => (
                    <article className="criterion" key={criterion.name}>
                      <div className="criterion-top">
                        <h3>{criterion.name}</h3>
                        <span className="mini-score">{criterion.score.toFixed(1)}</span>
                      </div>
                      <p className="muted">{criterion.summary}</p>
                      <ul className="suggestion-list">
                        {criterion.suggestions.map((suggestion) => (
                          <li key={suggestion}>{suggestion}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </section>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">B</div>
              <h2>No feedback yet</h2>
              <p className="muted">
                Submit a response to see an estimated band, criterion scores, and revision
                priorities.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

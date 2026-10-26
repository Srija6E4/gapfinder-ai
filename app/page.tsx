
"use client";

import { useState } from "react";

type Topic = {
  title: string;
  content: string;
};

type Material = {
  fileName: string;
  characterCount?: number;
  extractedText?: string;
  cleanedText?: string;
  topics?: Topic[];
  message?: string;
};

type Question = {
  topic: string;
  question: string;
  options: string[];
};

type QuizResult = {
  topic: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
};

type TopicScore = {
  topic: string;
  correct: number;
  total: number;
  status: string;
};

type QuizEvaluation = {
  score: number;
  total: number;
  percentage: number;
  results: QuizResult[];
  topicScores: TopicScore[];
};

type GapAnalysis = {
  summary: {
    totalTopics: number;
    strongTopics: number;
    topicsToRevise: number;
  };
  topics: {
    topic: string;
    score: string;
    percentage: number;
    status: string;
    priority: string;
    recommendation: string;
  }[];
  revisionPlan: {
    day: number;
    topic: string;
    priority: string;
    task: string;
  }[];
};

export default function Home() {
  // Welcome and upload
  const [started, setStarted] = useState(false);
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Quiz
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizMessage, setQuizMessage] = useState("");
  const [evaluation, setEvaluation] =
    useState<QuizEvaluation | null>(null);

  // Gap analysis
  const [gapAnalysis, setGapAnalysis] =
    useState<GapAnalysis | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState("");

  // Revision progress
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  async function handleUpload() {
    setMessage("");
    setMaterials([]);

    if (!subject.trim()) {
      setMessage("Please enter your subject.");
      return;
    }

    if (files.length === 0) {
      setMessage("Please select at least one TXT file.");
      return;
    }

    const formData = new FormData();
    formData.append("subject", subject.trim());

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoading(true);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setMaterials(data.materials ?? []);
      setMessage(
        data.message || "Study materials processed successfully!"
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStartQuiz() {
    setQuizMessage("");
    setEvaluation(null);
    setGapAnalysis(null);
    setAnalysisMessage("");
    setCompletedTasks([]);
    setAnswers([]);
    setQuestions([]);

    try {
      setQuizLoading(true);

      const response = await fetch("/api/quiz");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load quiz.");
      }

      const loadedQuestions: Question[] = data.questions ?? [];

      if (loadedQuestions.length === 0) {
        throw new Error("No quiz questions are available.");
      }

      setQuestions(loadedQuestions);
      setAnswers(Array(loadedQuestions.length).fill(-1));
      setQuizMessage("Quiz loaded successfully!");
    } catch (error) {
      setQuizMessage(
        error instanceof Error
          ? error.message
          : "Unable to load quiz."
      );
    } finally {
      setQuizLoading(false);
    }
  }

  async function handleSubmitQuiz() {
    setQuizMessage("");
    setAnalysisMessage("");
    setEvaluation(null);
    setGapAnalysis(null);
    setCompletedTasks([]);

    if (questions.length === 0) {
      setQuizMessage("Please start the quiz first.");
      return;
    }

    if (answers.some((answer) => answer === -1)) {
      setQuizMessage("Please answer every question before submitting.");
      return;
    }

    try {
      setQuizLoading(true);

      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to evaluate quiz.");
      }

      const quizData = data as QuizEvaluation;

      setEvaluation(quizData);
      setQuizMessage("Your quiz has been evaluated!");
      setAnalysisMessage("Generating your gap analysis...");

      try {
        const analysisResponse = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicScores: quizData.topicScores,
          }),
        });

        const analysisData = await analysisResponse.json();

        if (!analysisResponse.ok) {
          throw new Error(
            analysisData.error || "Unable to generate gap analysis."
          );
        }

        setGapAnalysis(analysisData as GapAnalysis);
        setAnalysisMessage("Gap analysis generated successfully!");
      } catch (error) {
        setAnalysisMessage(
          error instanceof Error
            ? error.message
            : "Unable to generate gap analysis."
        );
      }
    } catch (error) {
      setQuizMessage(
        error instanceof Error
          ? error.message
          : "Unable to evaluate quiz."
      );
    } finally {
      setQuizLoading(false);
    }
  }

  function handleRetakeQuiz() {
    setAnswers(Array(questions.length).fill(-1));
    setEvaluation(null);
    setGapAnalysis(null);
    setCompletedTasks([]);
    setAnalysisMessage("");
    setQuizMessage("");
  }

  const totalTasks = gapAnalysis?.revisionPlan.length ?? 0;

  const completedCount = gapAnalysis
    ? gapAnalysis.revisionPlan.filter((task) =>
        completedTasks.includes(task.day)
      ).length
    : 0;

  const progressPercentage =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-3xl">
        {/* 1. Welcome */}
        <header>
          <h1 className="text-3xl font-bold text-blue-700">
            Welcome to GapFinder AI
          </h1>

          <p className="mt-3 text-slate-600">
            Discover your learning gaps and build a personalized
            revision plan.
          </p>

          {!started && (
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </button>
          )}
        </header>

        {/* 2. Upload Study Materials */}
        {started && (
          <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Upload Your Study Materials
            </h2>

            <label
              htmlFor="subject"
              className="mt-5 block font-medium"
            >
              Subject
            </label>

            <input
              id="subject"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Example: Machine Learning"
            />

            <label
              htmlFor="study-files"
              className="mt-5 block font-medium"
            >
              Select TXT files
            </label>

            <input
              id="study-files"
              className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              type="file"
              accept=".txt,text/plain"
              multiple
              onChange={(event) => {
                setFiles(Array.from(event.target.files ?? []));
              }}
            />

            {/* Selected file names */}
            {files.map((file, index) => (
              <p
                key={index}
                className="mt-2 text-sm text-slate-600"
              >
                Selected: {file.name}
              </p>
            ))}

            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Processing..." : "Upload and Analyze"}
            </button>

            {message && (
              <p
                aria-live="polite"
                className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-sm"
              >
                {message}
              </p>
            )}
          </section>
        )}

        {/* 3. Processed Materials and Topics */}
        {materials.map((item, index) => (
          <section
            key={index}
            className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-bold text-blue-700">
              Processed Material: {item.fileName}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Original characters: {item.characterCount ?? 0}
            </p>

            <h3 className="mt-5 font-semibold">Cleaned Text</h3>

            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm">
              {item.cleanedText ||
                item.extractedText ||
                "No text available."}
            </pre>

            <h3 className="mt-6 font-semibold">
              Detected Topics ({item.topics?.length ?? 0})
            </h3>

            {item.topics && item.topics.length > 0 ? (
              <div className="mt-3 space-y-3">
                {item.topics.map((topic, topicIndex) => (
                  <article
                    key={topicIndex}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <h4 className="font-semibold">
                      {topicIndex + 1}. {topic.title}
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {topic.content}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No topics were returned. Check the upload API.
              </p>
            )}
          </section>
        ))}

        {/* 4. Diagnostic Quiz */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-blue-700">
            Diagnostic Quiz
          </h2>

          <p className="mt-2 text-slate-600">
            Answer questions to check your understanding and identify
            topics that need revision.
          </p>

          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={quizLoading}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {quizLoading ? "Loading..." : "Start Diagnostic Quiz"}
          </button>

          {quizMessage && (
            <p
              aria-live="polite"
              className="mt-4 rounded-lg bg-slate-100 p-3 text-sm"
            >
              {quizMessage}
            </p>
          )}

          {questions.length > 0 && !evaluation && (
            <div className="mt-6 space-y-6">
              {questions.map((question, index) => (
                <article
                  key={index}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="text-sm font-medium text-blue-700">
                    Topic: {question.topic}
                  </p>

                  <h3 className="mt-2 font-semibold">
                    {index + 1}. {question.question}
                  </h3>

                  <div className="mt-4 space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={answers[index] === optionIndex}
                          onChange={() => {
                            setAnswers((previous) =>
                              previous.map((answer, answerIndex) =>
                                answerIndex === index
                                  ? optionIndex
                                  : answer
                              )
                            );
                          }}
                          className="mt-1"
                        />

                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}

              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={quizLoading}
                className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {quizLoading ? "Evaluating..." : "Submit Quiz"}
              </button>
            </div>
          )}

          {/* 5. Quiz Results */}
          {evaluation && (
            <div className="mt-6">
              <section className="rounded-xl bg-blue-50 p-5">
                <h3 className="text-xl font-bold text-blue-800">
                  Your Quiz Results
                </h3>

                <p className="mt-3 text-2xl font-bold">
                  {evaluation.score} / {evaluation.total}
                </p>

                <p className="mt-1">
                  Score: {evaluation.percentage}%
                </p>
              </section>

              <h3 className="mt-6 font-semibold">
                Topic-wise Performance
              </h3>

              <div className="mt-3 space-y-3">
                {evaluation.topicScores.map((topic, index) => (
                  <article
                    key={index}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <h4 className="font-semibold">{topic.topic}</h4>

                    <p className="mt-1 text-sm text-slate-600">
                      Correct answers: {topic.correct} / {topic.total}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Result: {topic.status}
                    </p>
                  </article>
                ))}
              </div>

              <h3 className="mt-6 font-semibold">
                Answer Explanations
              </h3>

              <div className="mt-3 space-y-3">
                {evaluation.results.map((result, index) => (
                  <article
                    key={index}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <h4 className="font-semibold">
                      {index + 1}. {result.question}
                    </h4>

                    <p
                      className={`mt-2 text-sm font-medium ${
                        result.correct
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {result.correct ? "Correct" : "Incorrect"}
                    </p>

                    <p className="mt-2 text-sm">
                      Your answer: {result.selectedAnswer}
                    </p>

                    <p className="mt-1 text-sm">
                      Correct answer: {result.correctAnswer}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {result.explanation}
                    </p>
                  </article>
                ))}
              </div>

              {/* 6. Topic-wise Gap Analysis */}
              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-xl font-bold text-blue-700">
                  Topic-wise Gap Analysis
                </h3>

                {analysisMessage && (
                  <p
                    aria-live="polite"
                    className="mt-3 text-sm text-slate-600"
                  >
                    {analysisMessage}
                  </p>
                )}

                {gapAnalysis && (
                  <>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm">Total Topics</p>
                        <p className="text-2xl font-bold">
                          {gapAnalysis.summary.totalTopics}
                        </p>
                      </div>

                      <div className="rounded-lg bg-green-50 p-4">
                        <p className="text-sm">Strong Topics</p>
                        <p className="text-2xl font-bold">
                          {gapAnalysis.summary.strongTopics}
                        </p>
                      </div>

                      <div className="rounded-lg bg-orange-50 p-4">
                        <p className="text-sm">Topics to Revise</p>
                        <p className="text-2xl font-bold">
                          {gapAnalysis.summary.topicsToRevise}
                        </p>
                      </div>
                    </div>

                    <h4 className="mt-6 font-semibold">
                      Learning Gaps
                    </h4>

                    <div className="mt-3 space-y-3">
                      {gapAnalysis.topics.map((topic, index) => (
                        <article
                          key={index}
                          className="rounded-lg border border-slate-200 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h5 className="font-semibold">
                              {topic.topic}
                            </h5>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                              {topic.priority} Priority
                            </span>
                          </div>

                          <p className="mt-2 text-sm">
                            Score: {topic.score} ({topic.percentage}%)
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            Status: {topic.status}
                          </p>

                          <p className="mt-2 text-sm">
                            Recommendation: {topic.recommendation}
                          </p>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* 7. Personalized Revision Plan */}
              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-xl font-bold text-blue-700">
                  Personalized Revision Plan
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Start with the topics that need the most improvement.
                </p>

                {gapAnalysis &&
                gapAnalysis.revisionPlan.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {gapAnalysis.revisionPlan.map((item, index) => (
                      <article
                        key={index}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <p className="font-semibold">
                          Day {item.day}: {item.topic}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Priority: {item.priority}
                        </p>

                        <p className="mt-2 text-sm">{item.task}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Your revision plan will appear after gap analysis
                    is generated.
                  </p>
                )}
              </section>

              {/* 8. Progress Dashboard */}
              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-blue-700">
                  Progress Dashboard
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Track your quiz performance and daily revision progress.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-slate-600">Quiz Score</p>
                    <p className="mt-1 text-2xl font-bold">
                      {evaluation.percentage}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-slate-600">
                      Correct Answers
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {evaluation.score}/{evaluation.total}
                    </p>
                  </div>

                  <div className="rounded-lg bg-orange-50 p-4">
                    <p className="text-sm text-slate-600">
                      Tasks Completed
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {completedCount}/{totalTasks}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold">Revision Progress</h4>

                    <span className="text-sm font-medium text-green-700">
                      {progressPercentage}%
                    </span>
                  </div>

                  <div
                    className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="Revision task completion"
                    aria-valuenow={progressPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-green-600 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {totalTasks > 0 && completedCount === totalTasks
                      ? "Excellent! You have completed all revision tasks."
                      : `${totalTasks - completedCount} revision task(s) remaining.`}
                  </p>
                </div>

                <h4 className="mt-7 font-semibold">
                  Mark Revision Tasks as Completed
                </h4>

                {!gapAnalysis || totalTasks === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Your revision checklist will appear after gap analysis
                    is generated.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {gapAnalysis.revisionPlan.map((task, index) => {
                      const isCompleted = completedTasks.includes(
                        task.day
                      );

                      return (
                        <label
                          key={index}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={(event) => {
                              const checked = event.target.checked;

                              setCompletedTasks((previous) =>
                                checked
                                  ? previous.includes(task.day)
                                    ? previous
                                    : [...previous, task.day]
                                  : previous.filter(
                                      (day) => day !== task.day
                                    )
                              );
                            }}
                            className="mt-1 h-4 w-4 accent-green-600"
                          />

                          <span className="flex-1">
                            <span
                              className={`block font-medium ${
                                isCompleted
                                  ? "text-green-700 line-through"
                                  : "text-slate-900"
                              }`}
                            >
                              Day {task.day}: {task.topic}
                            </span>

                            <span className="mt-1 block text-sm text-slate-600">
                              {task.task}
                            </span>

                            <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs">
                              {task.priority} Priority
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Retake Quiz */}
              <button
                type="button"
                onClick={handleRetakeQuiz}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

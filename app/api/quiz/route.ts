
const questionBank = [
  {
    topic: "Machine Learning",
    question: "What is machine learning?",
    options: [
      "A branch of artificial intelligence",
      "A database management system",
      "A programming language",
      "An operating system",
    ],
    answer: 0,
    explanation:
      "Machine learning is a branch of artificial intelligence that enables systems to learn from data.",
  },
  {
    topic: "Supervised Learning",
    question: "What type of data does supervised learning use?",
    options: [
      "Only images",
      "Unlabeled data",
      "Labeled data",
      "No data",
    ],
    answer: 2,
    explanation:
      "Supervised learning uses labeled data containing inputs and their corresponding outputs.",
  },
  {
    topic: "Classification",
    question: "What does classification predict?",
    options: [
      "Numerical values only",
      "Categories or classes",
      "Database tables",
      "File sizes",
    ],
    answer: 1,
    explanation:
      "Classification predicts categories, such as spam or not spam.",
  },
  {
    topic: "Unsupervised Learning",
    question: "What type of data does unsupervised learning use?",
    options: [
      "Only labeled data",
      "Only numerical outputs",
      "Manually classified data",
      "Unlabeled data",
    ],
    answer: 3,
    explanation:
      "Unsupervised learning discovers patterns in unlabeled data.",
  },
  {
    topic: "Overfitting",
    question: "What is overfitting?",
    options: [
      "A model performs well on all unseen data",
      "A model learns training data too closely and performs poorly on unseen data",
      "A model has no training data",
      "A model always produces the same output",
    ],
    answer: 1,
    explanation:
      "Overfitting happens when a model learns the training data too closely and struggles to generalize.",
  },
];

export async function GET() {
  const questions = questionBank.map(
    ({ answer, explanation, ...question }) => question
  );

  return Response.json({ questions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const answers = body.answers;

    if (!Array.isArray(answers)) {
      return Response.json(
        { error: "Answers must be provided as an array." },
        { status: 400 }
      );
    }

    const results = questionBank.map((question, index) => {
      const selected = answers[index];
      const correct = selected === question.answer;

      return {
        topic: question.topic,
        question: question.question,
        selectedAnswer:
          Number.isInteger(selected) &&
          selected >= 0 &&
          selected < question.options.length
            ? question.options[selected]
            : "Not answered",
        correctAnswer: question.options[question.answer],
        correct,
        explanation: question.explanation,
      };
    });

    const score = results.filter(
      (result) => result.correct
    ).length;

    const topicScores = results.map((result) => ({
      topic: result.topic,
      correct: result.correct ? 1 : 0,
      total: 1,
    }));

    return Response.json({
      score,
      total: questionBank.length,
      percentage: Math.round(
        (score / questionBank.length) * 100
      ),
      results,
      topicScores,
    });
  } catch {
    return Response.json(
      { error: "Unable to evaluate the quiz." },
      { status: 400 }
    );
  }
}

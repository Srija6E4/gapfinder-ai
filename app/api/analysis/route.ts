
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topicScores = body.topicScores;

    if (!Array.isArray(topicScores) || topicScores.length === 0) {
      return Response.json(
        { error: "Please provide topic scores." },
        { status: 400 }
      );
    }

    const topics = topicScores.map(
      (item: {
        topic: string;
        correct: number;
        total: number;
      }) => {
        const correct = Number(item.correct);
        const total = Number(item.total);

        if (
          typeof item.topic !== "string" ||
          !Number.isFinite(correct) ||
          !Number.isFinite(total) ||
          total <= 0 ||
          correct < 0 ||
          correct > total
        ) {
          throw new Error("Invalid topic score.");
        }

        const percentage = Math.round((correct / total) * 100);

        let status: string;
        let priority: string;
        let recommendation: string;

        if (percentage < 50) {
          status = "Needs Improvement";
          priority = "High";
          recommendation =
            "Review the basics and practise five questions.";
        } else if (percentage < 80) {
          status = "Partially Understood";
          priority = "Medium";
          recommendation =
            "Revise your notes and practise five questions.";
        } else {
          status = "Strong";
          priority = "Low";
          recommendation =
            "Revise briefly and try advanced questions.";
        }

        return {
          topic: item.topic,
          score: `${correct}/${total}`,
          percentage,
          status,
          priority,
          recommendation,
        };
      }
    );

    const revisionPlan = [...topics]
      .sort((a, b) => a.percentage - b.percentage)
      .map((topic, index) => ({
        day: index + 1,
        topic: topic.topic,
        priority: topic.priority,
        task:
          topic.percentage < 50
            ? "Study the fundamentals and solve five practice questions."
            : topic.percentage < 80
            ? "Review notes and solve five practice questions."
            : "Do a short revision and attempt three advanced questions.",
      }));

    return Response.json({
      summary: {
        totalTopics: topics.length,
        strongTopics: topics.filter(
          (topic) => topic.status === "Strong"
        ).length,
        topicsToRevise: topics.filter(
          (topic) => topic.status !== "Strong"
        ).length,
      },
      topics,
      revisionPlan,
    });
  } catch {
    return Response.json(
      { error: "Unable to generate the gap analysis." },
      { status: 400 }
    );
  }
}

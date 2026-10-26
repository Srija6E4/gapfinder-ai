
function cleanText(text: string): string {
  return text
    .replace(/-->/g, "\n")
    .replace(/\\\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/^[-*•]+\s*/, ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function findTopics(text: string) {
  const rules = [
    { title: "Emergency Fund", keywords: ["emergency fund"] },
    { title: "Insurance", keywords: ["insurance", "health insurance", "term insurance"] },
    { title: "Equity", keywords: ["equity", "stocks", "shares"] },
    { title: "Debt", keywords: ["debt", "bonds"] },
    { title: "Gold", keywords: ["gold"] },
    { title: "Age-Based Asset Allocation", keywords: ["age", "increasing age"] },
  ];

  const lines = text.split("\n");
  const topics: { title: string; content: string[] }[] = [];
  const otherLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matchingRule = rules.find((rule) =>
      rule.keywords.some((keyword) => lower.includes(keyword))
    );

    if (matchingRule) {
      let topic = topics.find(
        (item) => item.title === matchingRule.title
      );

      if (!topic) {
        topic = { title: matchingRule.title, content: [] };
        topics.push(topic);
      }

      topic.content.push(line);
    } else {
      otherLines.push(line);
    }
  }

  if (otherLines.length > 0) {
    topics.push({
      title: "Other Information",
      content: otherLines,
    });
  }

  return topics.map((topic) => ({
    title: topic.title,
    content: topic.content.join("\n"),
  }));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const subject = formData.get("subject");
    const files = formData.getAll("files");

    if (typeof subject !== "string" || !subject.trim()) {
      return Response.json(
        { error: "Please enter a subject." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return Response.json(
        { error: "Please select a file." },
        { status: 400 }
      );
    }

    const materials = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      if (!file.name.toLowerCase().endsWith(".txt")) {
        return Response.json(
          { error: "TXT upload is enabled for now. PDF support will be added later." },
          { status: 400 }
        );
      }

      const extractedText = await file.text();

      if (!extractedText.trim()) {
        return Response.json(
          { error: `${file.name} is empty.` },
          { status: 400 }
        );
      }

      const cleanedText = cleanText(extractedText);
      const topics = findTopics(cleanedText);

      materials.push({
        fileName: file.name,
        characterCount: extractedText.length,
        extractedText,
        cleanedText,
        topics,
      });
    }

    if (materials.length === 0) {
      return Response.json(
        { error: "No valid TXT files were uploaded." },
        { status: 400 }
      );
    }

    return Response.json({
      message: "Text cleaned and topics identified successfully!",
      subject: subject.trim(),
      materials,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json(
      { error: "Unable to process your file. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

type SyncRequest = {
  wordOrPhrase?: string;
  chineseMeaning?: string;
  ieltsExample?: string;
  collocations?: string[];
  pronunciationLink?: string;
  soundNote?: string;
  errorType?: string;
  nextReviewDate?: string;
};

const NOTION_VERSION = "2022-06-28";

export async function POST(request: Request) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_VOCAB_DATABASE_ID;

  if (!token || !databaseId) {
    return NextResponse.json(
      {
        error:
          "Notion sync is not configured. Add NOTION_TOKEN and NOTION_VOCAB_DATABASE_ID to .env.local.",
      },
      { status: 501 },
    );
  }

  const body = (await request.json()) as SyncRequest;
  const word = body.wordOrPhrase?.trim();

  if (!word) {
    return NextResponse.json({ error: "Missing word or phrase." }, { status: 400 });
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: {
        database_id: databaseId,
      },
      properties: {
        "Word": {
          title: [
            {
              text: {
                content: word,
              },
            },
          ],
        },
        "中文": {
          rich_text: [
            {
              text: {
                content: body.chineseMeaning || "Review Chinese meaning.",
              },
            },
          ],
        },
        "Example": {
          rich_text: [
            {
              text: {
                content:
                  body.ieltsExample ||
                  `I will practise using "${word}" in one IELTS-style sentence.`,
              },
            },
          ],
        },
        "Collocation": {
          rich_text: body.collocations?.length
            ? [
                {
                  text: {
                    content: body.collocations.join(" / "),
                  },
                },
              ]
            : [],
        },
        "YouGlish": {
          url: body.pronunciationLink || null,
        },
        "Sound Note": {
          rich_text: [
            {
              text: {
                content: body.soundNote || "Listen for stress, weak sounds, and connected speech.",
              },
            },
          ],
        },
        "Next Review": {
          date: {
            start: body.nextReviewDate || tomorrowDate(),
          },
        },
        "Error Type": {
          multi_select: inferExistingErrorTags(body.errorType),
        },
        "聽成": {
          rich_text: [
            {
              text: {
                content: body.errorType || "Imported from IELTS Coach Agent",
              },
            },
          ],
        },
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    if (result.code === "object_not_found") {
      return NextResponse.json(
        {
          error:
            "Notion database is not shared with the IELTS Coach Agent integration. Open the IELTS database in Notion, choose Share or Connections, and connect the integration.",
          details: result,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        error: "Notion rejected the vocabulary record.",
        details: result,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    pageId: result.id,
    url: result.url,
  });
}

function inferExistingErrorTags(errorType = "") {
  const lower = errorType.toLowerCase();
  const allowed = [
    "meaning",
    "collocation",
    "paraphrase",
    "spelling",
    "listening recognition",
    "active use",
    "pronunciation",
  ];

  for (const option of allowed) {
    if (lower.includes(option)) {
      return [{ name: option }];
    }
  }

  return [];
}

function tomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

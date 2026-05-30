import { NextResponse } from "next/server";

type SyncRequest = {
  wordOrPhrase?: string;
  chineseMeaning?: string;
  englishMeaning?: string;
  ieltsExample?: string;
  pronunciationLink?: string;
  errorType?: string;
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

  const meaning = [
    body.chineseMeaning,
    body.englishMeaning,
    body.pronunciationLink ? `YouGlish: ${body.pronunciationLink}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

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
        Name: {
          title: [
            {
              text: {
                content: word,
              },
            },
          ],
        },
        "意思": {
          rich_text: [
            {
              text: {
                content: meaning || "Review meaning and usage.",
              },
            },
          ],
        },
        "句子": {
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
        "種類": {
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

  if (lower.includes("pronunciation") || lower.includes("listening")) {
    return [{ name: "發音不熟" }];
  }

  if (lower.includes("spelling")) {
    return [{ name: "拼錯" }];
  }

  return [];
}

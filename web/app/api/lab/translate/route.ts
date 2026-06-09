import { type NextRequest } from "next/server";
import { getTemplate } from "@/lib/lab-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const ANTHROPIC_MODEL = "claude-opus-4-8";

interface Body {
  templateId: string;
  input: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  const template = getTemplate(body.templateId);
  if (!template) return Response.json({ error: "unknown template" }, { status: 400 });
  const input = String(body.input ?? "").trim();
  if (!input) return Response.json({ error: "input required" }, { status: 400 });
  if (input.length > 4000) {
    return Response.json({ error: "input too long (max 4000 chars)" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "server misconfigured" }, { status: 500 });
  }

  const userMessage = `${template.userPromptPrefix}\n\n${input}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: template.maxOutputTokens ?? 400,
        system: template.systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!resp.ok) {
      return Response.json(
        { error: `upstream HTTP ${resp.status}` },
        { status: 502 },
      );
    }
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    if (!text) {
      return Response.json({ error: "empty response" }, { status: 502 });
    }
    return Response.json({
      ok: true,
      output: text.trim(),
      character: template.character,
      templateId: template.id,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "request failed" },
      { status: 502 },
    );
  }
}

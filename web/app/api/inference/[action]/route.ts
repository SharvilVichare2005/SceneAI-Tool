import { NextRequest, NextResponse } from "next/server";

const INTERNAL_BACKEND_URL = process.env.INTERNAL_AI_BACKEND_URL || "http://127.0.0.1:8000";

// Allowlist of secure endpoints permitted to be proxied
const PERMITTED_ACTIONS = new Set([
  "health",
  "classes",
  "model",
  "caption",
  "query",
  "detect",
  "point",
  "segment",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params;

  if (!PERMITTED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Forbidden: Security policy blocked unrecognized action." },
      { status: 403 }
    );
  }

  try {
    const targetUrl = `${INTERNAL_BACKEND_URL}/${action}`;
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Security-Proxy": "SceneAI-BFF-Shield",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "AI Engine Service unavailable." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "AI Inference Engine is currently offline or unreachable.",
        sanitized: true,
      },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const { action } = params;

  if (!PERMITTED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Forbidden: Security policy blocked unrecognized action." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const targetUrl = `${INTERNAL_BACKEND_URL}/${action}`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Security-Proxy": "SceneAI-BFF-Shield",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let friendlyError = "AI inference operation failed.";
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          friendlyError =
            typeof errorJson.detail === "string"
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use friendly fallback
      }
      return NextResponse.json({ error: friendlyError }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to communicate with AI Backend. Verify inference server is active.",
        sanitized: true,
      },
      { status: 503 }
    );
  }
}

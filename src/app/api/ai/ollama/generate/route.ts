import { getAuthUserId } from "@/utils/user.utils";
import { getOllamaBaseUrl } from "@/actions/userSettings.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const baseUrl = await getOllamaBaseUrl();
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying Ollama generate:", error);
    return NextResponse.json(
      { error: "Cannot connect to Ollama service" },
      { status: 502 },
    );
  }
}

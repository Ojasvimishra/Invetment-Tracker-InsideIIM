import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, companyName, companyData } = await req.json();

    if (!companyName || !companyData) {
      return new Response(
        JSON.stringify({ error: "Company name and analysis data are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages,
      system: `You are the Senior Equity Analyst who compiled the investment research report for the company "${companyName}".
The user is asking follow-up questions about your decision.
Here is the report data you generated:
${JSON.stringify(companyData)}

Please answer their questions accurately using the data. Keep your tone professional, authoritative, and slightly retro-futuristic to match the terminal style. Direct them back to specific strengths or weaknesses listed in the report where relevant.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

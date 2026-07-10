import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();

    if (!companyName) {
      return new Response(JSON.stringify({ error: "Company name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        verdict: z.enum(["INVEST", "PASS"]),
        reasoning: z.string().describe("A comprehensive summary of the investment decision rationale."),
        metrics: z.array(
          z.object({
            name: z.string().describe("Metric name (e.g., P/E Ratio, YoY Revenue Growth)"),
            value: z.string().describe("Value of the metric (e.g., 28.5, +12.4%)"),
            status: z.enum(["good", "bad", "neutral"]),
          })
        ),
        strengths: z.array(z.string()).describe("List of key growth drivers or competitive moats."),
        weaknesses: z.array(z.string()).describe("List of key vulnerabilities, risks, or headwinds."),
        logs: z.array(z.string()).describe(
          "A list of 6-8 simulated research/thinking steps written in a technical agent log style (e.g., '[AGENT] Parsing SEC 10-K filing...')"
        ),
        projections: z.array(z.number()).describe(
          "A 5-year simulated value projection starting with base value 100. Must have exactly 5 elements (e.g. [100, 112, 125, 120, 140]) representing years 0 to 4."
        ),
      }),
      prompt: `Analyze the company "${companyName}" from an investment perspective. Provide an expert equity research analysis, determine whether to INVEST or PASS, outline key financial metrics, list strengths and weaknesses, generate a list of technical-sounding agent research log steps that simulate a multi-agent workflow analyzing files, scraping data, and running simulations, and provide a 5-year valuation growth projection.`,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to run investment analysis" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

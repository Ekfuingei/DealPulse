/**
 * Airia API client — required for hackathon AI orchestration.
 * When AIRIA_API_KEY and AIRIA_AGENT_URL (or AIRIA_PIPELINE_ID) are set,
 * agent execution runs through Airia. Falls back to direct Claude when not configured.
 */

const AIRIA_BASE = "https://api.airia.ai";

export type AiriaRunInput = {
  prospectName: string;
  company?: string;
  channel: string;
  research?: string;
  previousMessages?: string[];
};

export async function runAiriaAgent(input: AiriaRunInput): Promise<string> {
  const apiKey = process.env.AIRIA_API_KEY;
  const agentUrl = process.env.AIRIA_AGENT_URL;
  const pipelineId = process.env.AIRIA_PIPELINE_ID;

  const url = agentUrl || (pipelineId ? `${AIRIA_BASE}/v1/agents/${pipelineId}/run` : null);

  if (!apiKey || !url) {
    throw new Error("Airia not configured: set AIRIA_API_KEY and AIRIA_AGENT_URL or AIRIA_PIPELINE_ID");
  }

  const payload = {
    input: JSON.stringify(input),
    variables: {
      prospectName: input.prospectName,
      company: input.company ?? "",
      channel: input.channel,
      research: input.research ?? "",
      previousMessages: input.previousMessages?.join("\n---\n") ?? "",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airia API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { output?: string; result?: string; message?: string };
  return data.output ?? data.result ?? data.message ?? "";
}

export function isAiriaConfigured(): boolean {
  const apiKey = process.env.AIRIA_API_KEY;
  const agentUrl = process.env.AIRIA_AGENT_URL;
  const pipelineId = process.env.AIRIA_PIPELINE_ID;
  return !!(apiKey && (agentUrl || pipelineId));
}

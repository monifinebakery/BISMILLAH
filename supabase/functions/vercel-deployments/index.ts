import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";

const VERCEL_API_URL = "https://api.vercel.com/v6/deployments";
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID");
const VERCEL_API_TOKEN = Deno.env.get("VERCEL_API_TOKEN") ?? Deno.env.get("VERCEL_TOKEN");

interface VercelDeployment {
  uid?: string;
  url?: string;
  state?: string;
  readyState?: string;
  createdAt?: number;
  meta?: {
    githubCommitSha?: string;
    gitlabCommitSha?: string;
    bitbucketCommitSha?: string;
  };
}

interface DeploymentResponse {
  deployments?: VercelDeployment[];
}

const buildErrorResponse = (message: string, status: number, origin?: string) => {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...getCorsHeaders(origin),
        "Content-Type": "application/json",
      },
    },
  );
};

const sanitizeDeployments = (deployments: VercelDeployment[] = []) => {
  return deployments.map((deployment) => {
    const commitSha =
      deployment.meta?.githubCommitSha ||
      deployment.meta?.gitlabCommitSha ||
      deployment.meta?.bitbucketCommitSha ||
      null;

    return {
      uid: deployment.uid,
      url: deployment.url,
      state: deployment.state ?? deployment.readyState,
      readyState: deployment.readyState ?? deployment.state,
      createdAt: deployment.createdAt,
      commitSha,
    };
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  const origin = req.headers.get("origin") ?? undefined;

  if (!VERCEL_PROJECT_ID || !VERCEL_API_TOKEN) {
    console.error("Missing Vercel configuration in vercel-deployments function");
    return buildErrorResponse("Vercel configuration is not set", 500, origin);
  }

  try {
    const url = new URL(req.url);
    const commitSha = url.searchParams.get("commit") || url.searchParams.get("commitSha") || url.searchParams.get("gitCommitSha");
    const limit = url.searchParams.get("limit") ?? "5";

    const searchParams = new URLSearchParams({
      projectId: VERCEL_PROJECT_ID,
      limit,
    });

    if (commitSha) {
      searchParams.set("gitCommitSha", commitSha);
    }

    const vercelResponse = await fetch(`${VERCEL_API_URL}?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    if (!vercelResponse.ok) {
      const text = await vercelResponse.text();
      console.error("Vercel API error", vercelResponse.status, text);
      return buildErrorResponse("Failed to fetch deployment information", vercelResponse.status, origin);
    }

    const data = (await vercelResponse.json()) as DeploymentResponse;
    const deployments = sanitizeDeployments(data.deployments);

    return new Response(
      JSON.stringify({ deployments }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Unexpected error in vercel-deployments function", error);
    return buildErrorResponse("Unexpected error while fetching deployments", 500, origin);
  }
});

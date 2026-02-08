import Link from "next/link";

type ApiMethod = "GET" | "POST" | "DELETE";

interface Endpoint {
  method: ApiMethod;
  path: string;
  href: string;
  description: string;
}

interface Section {
  title: string;
  endpoints: Endpoint[];
}

const sections: Section[] = [
  {
    title: "Ensemble LLMs",
    endpoints: [
      { method: "GET", path: "/ensemble_llms", href: "/docs/api/get/ensemble_llms", description: "List all ObjectiveAI Ensemble LLMs" },
      { method: "GET", path: "/ensemble_llms/{id}", href: "/docs/api/get/ensemble_llms/id", description: "Retrieve an ObjectiveAI Ensemble LLM" },
      { method: "GET", path: "/ensemble_llms/{id}/usage", href: "/docs/api/get/ensemble_llms/id/usage", description: "Retrieve historical usage for an ObjectiveAI Ensemble LLM" },
    ],
  },
  {
    title: "Ensembles",
    endpoints: [
      { method: "GET", path: "/ensembles", href: "/docs/api/get/ensembles", description: "List all ObjectiveAI Ensembles" },
      { method: "GET", path: "/ensembles/{id}", href: "/docs/api/get/ensembles/id", description: "Retrieve an ObjectiveAI Ensemble" },
      { method: "GET", path: "/ensembles/{id}/usage", href: "/docs/api/get/ensembles/id/usage", description: "Retrieve historical usage for an ObjectiveAI Ensemble" },
    ],
  },
  {
    title: "Functions",
    endpoints: [
      { method: "GET", path: "/functions", href: "/docs/api/get/functions", description: "List all remote ObjectiveAI Functions" },
      { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}", href: "/docs/api/get/functions/fowner/frepository/fcommit", description: "Retrieve a remote ObjectiveAI Function" },
      { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/usage", href: "/docs/api/get/functions/fowner/frepository/fcommit/usage", description: "Retrieve historical usage for a remote ObjectiveAI Function" },
      { method: "POST", path: "/functions", href: "/docs/api/post/functions", description: "Execute an inline ObjectiveAI Function with an inline Profile" },
      { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}", href: "/docs/api/post/functions/fowner/frepository/fcommit", description: "Execute a remote ObjectiveAI Function with an inline Profile" },
      { method: "POST", path: "/functions/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/post/functions/profiles/powner/prepository/pcommit", description: "Execute an inline ObjectiveAI Function with a remote Profile" },
      { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/post/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit", description: "Execute a remote ObjectiveAI Function with a remote Profile" },
    ],
  },
  {
    title: "Function Profiles",
    endpoints: [
      { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/compute", href: "/docs/api/post/functions/fowner/frepository/fcommit/profiles/compute", description: "Compute an ObjectiveAI Function Profile from your own Data (remote Function)" },
      { method: "POST", path: "/functions/profiles/compute", href: "/docs/api/post/functions/profiles/compute", description: "Compute an ObjectiveAI Function Profile from your own Data (inline Function)" },
      { method: "GET", path: "/functions/profiles", href: "/docs/api/get/functions/profiles", description: "List all remote ObjectiveAI Function Profiles" },
      { method: "GET", path: "/functions/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/get/functions/profiles/powner/prepository/pcommit", description: "Retrieve a remote ObjectiveAI Function Profile" },
      { method: "GET", path: "/functions/profiles/{powner}/{prepository}/{pcommit}/usage", href: "/docs/api/get/functions/profiles/powner/prepository/pcommit/usage", description: "Retrieve historical usage for a remote ObjectiveAI Function Profile" },
    ],
  },
  {
    title: "Function-Profile Pairs",
    endpoints: [
      { method: "GET", path: "/functions/profiles/pairs", href: "/docs/api/get/functions/profiles/pairs", description: "List all remote ObjectiveAI Function-Profile pairs" },
      { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/get/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit", description: "Retrieve a remote ObjectiveAI Function-Profile pair" },
      { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}/usage", href: "/docs/api/get/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit/usage", description: "Retrieve historical usage for a remote ObjectiveAI Function-Profile pair" },
    ],
  },
  {
    title: "Vector",
    endpoints: [
      { method: "POST", path: "/vector/completions", href: "/docs/api/post/vector/completions", description: "Create a new Vector Completion" },
      { method: "GET", path: "/vector/completions/{id}", href: "/docs/api/get/vector/completions/id", description: "Retrieve votes from a historical Vector Completion" },
      { method: "GET", path: "/vector/completions/cache", href: "/docs/api/get/vector/completions/cache", description: "Request a cached vote from the global ObjectiveAI vote cache" },
    ],
  },
  {
    title: "Chat",
    endpoints: [
      { method: "POST", path: "/chat/completions", href: "/docs/api/post/chat/completions", description: "Create a new Chat Completion" },
    ],
  },
  {
    title: "Auth",
    endpoints: [
      { method: "GET", path: "/auth/credits", href: "/docs/api/get/auth/credits", description: "Retrieve your available credits" },
      { method: "GET", path: "/auth/keys", href: "/docs/api/get/auth/keys", description: "List your API keys" },
      { method: "POST", path: "/auth/keys", href: "/docs/api/post/auth/keys", description: "Create a new API key" },
      { method: "DELETE", path: "/auth/keys", href: "/docs/api/delete/auth/keys", description: "Disable an API key" },
      { method: "GET", path: "/auth/keys/openrouter", href: "/docs/api/get/auth/keys/openrouter", description: "Retrieve your BYOK OpenRouter API key" },
      { method: "POST", path: "/auth/keys/openrouter", href: "/docs/api/post/auth/keys/openrouter", description: "Set your BYOK OpenRouter API key" },
      { method: "DELETE", path: "/auth/keys/openrouter", href: "/docs/api/delete/auth/keys/openrouter", description: "Remove your BYOK OpenRouter API key" },
    ],
  },
];

const methodColors: Record<ApiMethod, string> = {
  GET: "var(--method-get)",
  POST: "var(--method-post)",
  DELETE: "var(--method-delete)",
};

const methodBgColors: Record<ApiMethod, string> = {
  GET: "rgba(16, 185, 129, 0.1)",
  POST: "rgba(59, 130, 246, 0.1)",
  DELETE: "rgba(239, 68, 68, 0.1)",
};

export default function DocsPage() {
  return (
    <div className="docsLandingGrid">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          API Reference
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
          Complete reference for the ObjectiveAI REST API. Base URL: <code style={{ fontFamily: "monospace", background: "var(--card-bg)", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>https://api.objective-ai.io</code>
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="docsLandingSection">
          <h2 className="docsLandingSectionTitle">{section.title}</h2>
          {section.endpoints.map((endpoint) => (
            <Link
              key={endpoint.href}
              href={endpoint.href}
              className="docsLandingEndpoint"
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: 4,
                  flexShrink: 0,
                  lineHeight: 1,
                  color: methodColors[endpoint.method],
                  background: methodBgColors[endpoint.method],
                  marginTop: 2,
                }}
              >
                {endpoint.method}
              </span>
              <div>
                <div className="docsLandingPath">{endpoint.path}</div>
                <div className="docsLandingDesc">{endpoint.description}</div>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

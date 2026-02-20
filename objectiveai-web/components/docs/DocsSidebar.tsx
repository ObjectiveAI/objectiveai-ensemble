"use client";

import Link from "next/link";
import { ReactElement, ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export function DocsSidebar(): ReactElement {
  const isMobile = useIsMobile();
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? !isMobile;

  return (
    <div className="docsSidebarWrapper">
      {/* Desktop sidebar */}
      <aside
        className="docsSidebarDesktop"
        style={{ display: open ? undefined : "none" }}
      >
        <SidebarTable />
      </aside>
      <div className="docsSidebarToggle">
        <button
          className="docsSidebarToggleBtn"
          onClick={() => setManualOpen(!open)}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? "rotate(180deg)" : undefined,
              transition: "transform 0.2s",
            }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Mobile collapsible navigation */}
      <details className="docsSidebarMobile">
        <summary className="docsSidebarMobileSummary">Navigation</summary>
        <div className="docsSidebarMobileContent">
          <SidebarTable />
        </div>
      </details>
    </div>
  );
}

function SidebarTable(): ReactElement {
  return (
    <nav className="docsSidebarNav">
      <SidebarSection title="Overview" />
      <SidebarItem href="/docs" title="All Endpoints" />

      <SidebarSectionSpacer />

      <SidebarSection title="Ensemble LLMs" />
      <SidebarApiItem
        method="GET"
        path="/ensemble_llms"
        href="/docs/api/get/ensemble_llms"
        description="List all ObjectiveAI Ensemble LLMs"
      />
      <SidebarApiItem
        method="GET"
        path="/ensemble_llms/{id}"
        href="/docs/api/get/ensemble_llms/id"
        description="Retrieve an ObjectiveAI Ensemble LLM"
      />
      <SidebarApiItem
        method="GET"
        path="/ensemble_llms/{id}/usage"
        href="/docs/api/get/ensemble_llms/id/usage"
        description="Retrieve historical usage for an ObjectiveAI Ensemble LLM"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Ensembles" />
      <SidebarApiItem
        method="GET"
        path="/ensembles"
        href="/docs/api/get/ensembles"
        description="List all ObjectiveAI Ensembles"
      />
      <SidebarApiItem
        method="GET"
        path="/ensembles/{id}"
        href="/docs/api/get/ensembles/id"
        description="Retrieve an ObjectiveAI Ensemble"
      />
      <SidebarApiItem
        method="GET"
        path="/ensembles/{id}/usage"
        href="/docs/api/get/ensembles/id/usage"
        description="Retrieve historical usage for an ObjectiveAI Ensemble"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Functions" />
      <SidebarApiItem
        method="GET"
        path="/functions"
        href="/docs/api/get/functions"
        description="List all remote ObjectiveAI Functions"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/{fowner}/{frepository}/{fcommit}"
        href="/docs/api/get/functions/fowner/frepository/fcommit"
        description="Retrieve a remote ObjectiveAI Function"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/{fowner}/{frepository}/{fcommit}/usage"
        href="/docs/api/get/functions/fowner/frepository/fcommit/usage"
        description="Retrieve historical usage for a remote ObjectiveAI Function"
      />
      <SidebarApiItem
        method="POST"
        path="/functions"
        href="/docs/api/post/functions"
        description="Execute an inline ObjectiveAI Function with an inline Profile"
      />
      <SidebarApiItem
        method="POST"
        path="/functions/{fowner}/{frepository}/{fcommit}"
        href="/docs/api/post/functions/fowner/frepository/fcommit"
        description="Execute a remote ObjectiveAI Function with an inline Profile"
      />
      <SidebarApiItem
        method="POST"
        path="/functions/profiles/{powner}/{prepository}/{pcommit}"
        href="/docs/api/post/functions/profiles/powner/prepository/pcommit"
        description="Execute an inline ObjectiveAI Function with a remote Profile"
      />
      <SidebarApiItem
        method="POST"
        path="/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}"
        href="/docs/api/post/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit"
        description="Execute a remote ObjectiveAI Function with a remote Profile"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Function Profiles" />
      <SidebarApiItem
        method="POST"
        path="/functions/{fowner}/{frepository}/{fcommit}/profiles/compute"
        href="/docs/api/post/functions/fowner/frepository/fcommit/profiles/compute"
        description="Compute an ObjectiveAI Function Profile from your own Data (remote Function)"
      />
      <SidebarApiItem
        method="POST"
        path="/functions/profiles/compute"
        href="/docs/api/post/functions/profiles/compute"
        description="Compute an ObjectiveAI Function Profile from your own Data (inline Function)"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/profiles"
        href="/docs/api/get/functions/profiles"
        description="List all remote ObjectiveAI Function Profiles"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/profiles/{powner}/{prepository}/{pcommit}"
        href="/docs/api/get/functions/profiles/powner/prepository/pcommit"
        description="Retrieve a remote ObjectiveAI Function Profile"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/profiles/{powner}/{prepository}/{pcommit}/usage"
        href="/docs/api/get/functions/profiles/powner/prepository/pcommit/usage"
        description="Retrieve historical usage for a remote ObjectiveAI Function Profile"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Function-Profile Pairs" />
      <SidebarApiItem
        method="GET"
        path="/functions/profiles/pairs"
        href="/docs/api/get/functions/profiles/pairs"
        description="List all remote ObjectiveAI Function-Profile pairs"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}"
        href="/docs/api/get/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit"
        description="Retrieve a remote ObjectiveAI Function-Profile pair"
      />
      <SidebarApiItem
        method="GET"
        path="/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}/usage"
        href="/docs/api/get/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit/usage"
        description="Retrieve historical usage for a remote ObjectiveAI Function-Profile pair"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Vector" />
      <SidebarApiItem
        method="POST"
        path="/vector/completions"
        href="/docs/api/post/vector/completions"
        description="Create a new Vector Completion"
      />
      <SidebarApiItem
        method="GET"
        path="/vector/completions/{id}"
        href="/docs/api/get/vector/completions/id"
        description="Retrieve votes from a historical Vector Completion"
      />
      <SidebarApiItem
        method="GET"
        path="/vector/completions/cache"
        href="/docs/api/get/vector/completions/cache"
        description="Request a cached vote from the global ObjectiveAI vote cache"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Chat" />
      <SidebarApiItem
        method="POST"
        path="/chat/completions"
        href="/docs/api/post/chat/completions"
        description="Create a new Chat Completion"
      />

      <SidebarSectionSpacer />

      <SidebarSection title="Auth" />
      <SidebarApiItem
        method="GET"
        path="/auth/credits"
        href="/docs/api/get/auth/credits"
        description="Retrieve your available credits"
      />
      <SidebarApiItem
        method="GET"
        path="/auth/keys"
        href="/docs/api/get/auth/keys"
        description="List your API keys"
      />
      <SidebarApiItem
        method="POST"
        path="/auth/keys"
        href="/docs/api/post/auth/keys"
        description="Create a new API key"
      />
      <SidebarApiItem
        method="DELETE"
        path="/auth/keys"
        href="/docs/api/delete/auth/keys"
        description="Disable an API key"
      />
      <SidebarApiItem
        method="GET"
        path="/auth/keys/openrouter"
        href="/docs/api/get/auth/keys/openrouter"
        description="Retrieve your BYOK OpenRouter API key"
      />
      <SidebarApiItem
        method="POST"
        path="/auth/keys/openrouter"
        href="/docs/api/post/auth/keys/openrouter"
        description="Set your BYOK OpenRouter API key"
      />
      <SidebarApiItem
        method="DELETE"
        path="/auth/keys/openrouter"
        href="/docs/api/delete/auth/keys/openrouter"
        description="Remove your BYOK OpenRouter API key"
      />
    </nav>
  );
}

function SidebarSection({ title }: { title: string }): ReactElement {
  return (
    <div className="docsSidebarSection">
      <div className="docsSidebarSectionTitle">{title}</div>
    </div>
  );
}

function SidebarItem({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <Link href={href} className="docsSidebarItem">
      {children}
      <span className="docsSidebarItemTitle">{title}</span>
    </Link>
  );
}

type ApiMethod = "GET" | "POST" | "DELETE";

function SidebarApiItem({
  method,
  path,
  href,
  description,
}: {
  method: ApiMethod;
  path: string;
  href: string;
  description?: string;
}): ReactElement {
  const methodClass =
    method === "GET"
      ? "docsSidebarMethodGet"
      : method === "POST"
        ? "docsSidebarMethodPost"
        : "docsSidebarMethodDelete";

  return (
    <Link href={href} className="docsSidebarApiItem">
      <div className="docsSidebarApiItemHeader">
        <span className={`docsSidebarMethodBadge ${methodClass}`}>
          {method}
        </span>
        <span className="docsSidebarApiPath">{path}</span>
      </div>
      {description && (
        <div className="docsSidebarApiDesc">{description}</div>
      )}
    </Link>
  );
}

function SidebarSectionSpacer(): ReactElement {
  return <div className="docsSidebarSpacer" />;
}

import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { ReactNode } from "react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <div className="docsLayout">
        <DocsSidebar />
        {children}
      </div>
    </div>
  );
}

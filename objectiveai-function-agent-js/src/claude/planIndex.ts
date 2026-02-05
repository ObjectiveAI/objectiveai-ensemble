import { existsSync, readdirSync } from "fs";

// Find the next plan index based on existing plans/<number>.md files
export function getNextPlanIndex(): number {
  const plansDir = "plans";
  let nextPlanIndex = 1;

  if (existsSync(plansDir)) {
    const files = readdirSync(plansDir);
    const planNumbers = files
      .filter((f) => /^\d+\.md$/.test(f))
      .map((f) => parseInt(f.replace(".md", ""), 10))
      .filter((n) => !isNaN(n));

    if (planNumbers.length > 0) {
      nextPlanIndex = Math.max(...planNumbers) + 1;
    }
  }

  return nextPlanIndex;
}

export function getPlanPath(index: number): string {
  return `plans/${index}.md`;
}

export interface DefaultProfile {
  owner: string;
  repository: string;
  commit: null;
  label: string;
  description: string;
}

export const DEFAULT_PROFILES: DefaultProfile[] = [
  {
    owner: "ObjectiveAI",
    repository: "profile-nano",
    commit: null,
    label: "Nano",
    description: "4 non-reasoning LLMs, horizontal scaling",
  },
  {
    owner: "ObjectiveAI",
    repository: "profile-mini",
    commit: null,
    label: "Mini",
    description: "3x nano, stronger consensus",
  },
  {
    owner: "ObjectiveAI",
    repository: "profile-standard",
    commit: null,
    label: "Standard",
    description: "Mini's base + 5 reasoning LLMs",
  },
  {
    owner: "ObjectiveAI",
    repository: "profile-giga",
    commit: null,
    label: "Giga",
    description: "Standard + frontier models",
  },
  {
    owner: "ObjectiveAI",
    repository: "profile-giga-max",
    commit: null,
    label: "Giga Max",
    description: "3x frontier models, lightweight tie-breakers",
  },
];

export const DEFAULT_PROFILE_INDEX = 0; // Nano

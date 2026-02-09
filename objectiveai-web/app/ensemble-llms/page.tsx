import { getEnsembleLlms } from "../../lib/ensemble-llms-data";
import { EnsembleLlmsBrowse } from "../../components/EnsembleLlmsBrowse";

export const metadata = {
  title: "Ensemble LLMs - ObjectiveAI",
  description: "Browse individual LLM configurations with models, prompts, and parameters for ensemble voting.",
};

export default async function EnsembleLlmsPage() {
  const llms = await getEnsembleLlms();
  return <EnsembleLlmsBrowse llms={llms} />;
}

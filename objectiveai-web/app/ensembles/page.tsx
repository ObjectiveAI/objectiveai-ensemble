import { getEnsembles } from "../../lib/ensembles-data";
import { EnsemblesBrowse } from "../../components/EnsemblesBrowse";

export const metadata = {
  title: "Ensembles - ObjectiveAI",
  description: "Browse collections of Ensemble LLMs that vote together for structured scoring and ranking.",
};

export default async function EnsemblesPage() {
  const ensembles = await getEnsembles();
  return <EnsemblesBrowse ensembles={ensembles} />;
}

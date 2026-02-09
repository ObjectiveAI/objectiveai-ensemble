import { fetchFunctionsWithDetails } from "../../lib/functions-data";
import FunctionsBrowse from "../../components/FunctionsBrowse";

// ISR: Revalidate every 2 minutes
export const revalidate = 120;

export default async function FunctionsPage() {
  // Fetch functions server-side with caching (N+1 amortized across all users)
  const functions = await fetchFunctionsWithDetails();

  // Pass pre-fetched data to client component for interactivity
  return <FunctionsBrowse functions={functions} />;
}

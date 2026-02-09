import { Metadata } from "next";
import { getProfiles } from "../../lib/profiles-data";
import ProfilesBrowse from "../../components/ProfilesBrowse";
import { ErrorAlert } from "../../components/ui";

export const metadata: Metadata = {
  title: "Profiles | ObjectiveAI",
  description: "Learned weights for functions, trained to optimize ensemble voting",
};

export default async function ProfilesPage() {
  try {
    const profiles = await getProfiles();
    return <ProfilesBrowse initialProfiles={profiles} />;
  } catch (error) {
    return (
      <div className="page">
        <div className="container">
          <ErrorAlert
            title="Failed to load profiles"
            message={error instanceof Error ? error.message : "Unknown error"}
          />
        </div>
      </div>
    );
  }
}

import { useSearchParams } from "react-router-dom";
import RollerSkatingWaiver from "..";
import usePayload from "../../../../hooks/use-payload";
import { RollerSkatingWaiverContent } from "../../../../types/payload-types";
import { Language } from "../../../../types";
import LoadingPage from "../../../../pages/loading";
import ErrorPage from "../../../../pages/error";

const RollerSkatingWaiverContainer = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const { data, error, loading, fetch } = usePayload<RollerSkatingWaiverContent>(
    "globals",
    {
      slug: "roller-skating-waiver-contents",
      query: `locale=${(searchParams.get("lang") as Language) || "en"}`,
      fetchOnLoad: true,
    },
  );
  if (loading) return <LoadingPage />;
  if (error && !data) return <ErrorPage message={error} />;
  if (data)
    return (
      <RollerSkatingWaiver
        initialContent={{ data, error, loading, fetch }}
        initialLanguage={(searchParams.get("lang") as Language) || "en"}
        isPreview={searchParams.get("preview") === "true"}
      />
    );
  return <></>;
};

export default RollerSkatingWaiverContainer;

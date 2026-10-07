import { useSearchParams } from "react-router-dom";
import SkiWaiver from "..";
import usePayload from "../../../../hooks/use-payload";
import { SkiWaiverContent } from "../../../../types/payload-types";
import { Language } from "../../../../types";
import LoadingPage from "../../../../pages/loading";
import ErrorPage from "../../../../pages/error";

const apiContentsPath = `ski-waiver-contents`;

const SkiWaiverContainer = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const { data, error, loading, fetch } = usePayload<SkiWaiverContent>("globals", {
    slug: apiContentsPath,
    query: `locale=${(searchParams.get("lang") as Language) || "en"}`,
    fetchOnLoad: true,
  });
  if (loading) return <LoadingPage />;
  if (error && !data) return <ErrorPage message={error} />;
  if (data)
    return (
      <SkiWaiver
        initialContent={{ data, error, loading, fetch }}
        initialLanguage={(searchParams.get("lang") as Language) || "en"}
        isPreview={searchParams.get("preview") === "true"}
      />
    );
  return <></>;
};

export default SkiWaiverContainer;

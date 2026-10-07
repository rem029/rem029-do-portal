import { lazy, Suspense } from "react";
import LoadingPage from "./loading";
import usePayload from "../hooks/use-payload";
import { PageContent } from "../types/payload-types";

const LazyFormHealthCheck = lazy(
  () => import("../components/form/health-check/index"),
);

const HealthCheckPage = () => {
  const { data, error, loading } = usePayload<PageContent>("globals", {
    slug: "page-content",
    fetchOnLoad: true,
  });

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    // Optionally, render an error component
    return <div>Error loading content.</div>;
  }

  return (
    <Suspense fallback={<LoadingPage />}>
      <LazyFormHealthCheck content={data} />
    </Suspense>
  );
};

export default HealthCheckPage;

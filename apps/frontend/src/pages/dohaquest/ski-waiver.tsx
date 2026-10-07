import { lazy } from "react";

const LazySkiWaiverPage = lazy(() => import("../../components/form/ski-waiver/container"));

const SkiWaiverPage = () => <LazySkiWaiverPage />;

export default SkiWaiverPage;

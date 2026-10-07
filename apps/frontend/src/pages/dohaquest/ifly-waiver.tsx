import { lazy } from "react";

const LazyIFlyWaiverPage = lazy(() => import("../../components/form/ifly-waiver"));

const IFlyWaiverPage = () => <LazyIFlyWaiverPage />;

export default IFlyWaiverPage;

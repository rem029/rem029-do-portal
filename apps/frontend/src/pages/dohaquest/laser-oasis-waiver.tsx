import { lazy } from "react";

const LazyLaserOasisWaiverPage = lazy(
  () => import("../../components/form/laser-oasis-waiver"),
);

const LaserOasisWaiverPage = () => <LazyLaserOasisWaiverPage />;

export default LaserOasisWaiverPage;

import { lazy } from "react";

const LazyFormDocViews = lazy(
  () => import("../components/form/docs-view"),
);

const DocViewsPage = () => <LazyFormDocViews />;

export default DocViewsPage;

import { lazy } from "react";

const LazyLoadMenu = lazy(() => import("../components/form/menu/container"));

const Menu = () => <LazyLoadMenu />;

export default Menu;

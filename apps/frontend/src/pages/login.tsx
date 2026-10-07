import { lazy } from "react";

const LazyLogin = lazy(() => import("../components/form/login"));

const LoginPage = () => <LazyLogin />;

export default LoginPage;

import { lazy } from "react";

const LazyLoginSuccess = lazy(() => import("../components/form/login-success"));

const LoginSuccessPage = () => <LazyLoginSuccess />;

export default LoginSuccessPage;

import { lazy } from "react";

const LazyChatBase = lazy(() => import("../components/form/chatbase"));

const ChatBasePage = () => <LazyChatBase />;

export default ChatBasePage;

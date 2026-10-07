import { lazy } from "react";

const LazyChat = lazy(() => import("../components/form/chat"));

const ChatPage = () => <LazyChat />;

export default ChatPage;

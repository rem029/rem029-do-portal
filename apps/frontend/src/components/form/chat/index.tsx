import ErrorMessage from "../../common/error-message";
import { IoClose } from "react-icons/io5";
import { IoIosSend } from "react-icons/io";
import { FaRobot } from "react-icons/fa6";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OpenAIResponse, OpenAIResponseData } from "../../../types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clearCitations } from "../../../helpers";
import { useAxios } from "../../../hooks/use-axios";
import { AxiosRequestConfig } from "axios";
import { motion } from "framer-motion";

const Chat = () => {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<OpenAIResponseData[]>([]);
  const [formError, setFormError] = useState("");
  const [contentLoading, setContentLoading] = useState(false);
  const [threadId, setThreadId] = useState("");
  const messageLastRef = useRef<HTMLDivElement | null>(null);

  const [searchParams, setSearchParam] = useSearchParams();
  const axiosConfig: AxiosRequestConfig<any> = useMemo(() => {
    return {
      url: `/api/ai/chat`,
      method: "post",
    };
  }, []);
  const { data, error, loading, refetch } = useAxios<OpenAIResponse>({
    config: axiosConfig,
  });

  useEffect(() => {
    setContentLoading(loading);
    if (data && !loading) {
      const items = data.response.data;
      setThreadId(items[0].thread_id);
      setResponses(items);
    }

    if (error) setFormError(error.message);
  }, [data, error, loading, refetch]);

  useEffect(() => {
    const threadId = searchParams.get("thread");

    if (threadId) {
      setThreadId(threadId);
      fecthMessages(threadId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (threadId) {
      setSearchParam({ thread: threadId });
    }
  }, [threadId, setSearchParam]);

  useEffect(() => {
    setTimeout(() => {
      scrollToLastMessage();
    }, 800);
  }, [responses]);

  const scrollToLastMessage = () =>
    messageLastRef && messageLastRef.current?.scrollIntoView({ behavior: "smooth" });

  const fecthMessages = async (threadId?: string) => {
    await refetch({
      data: {
        content: prompt,
        threadId: threadId ? threadId : undefined,
      },
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<SVGElement, MouseEvent>,
  ) => {
    e.persist();
    e.preventDefault();
    if (!contentLoading) {
      setResponses((prevState) => [
        ...prevState,
        {
          content: [{ text: { value: prompt }, type: "text" }],
          role: "user",
          id: "-1",
          created_at: -1,
          file_ids: [],
          metadata: {},
          object: "null",
          thread_id: threadId,
        },
        {
          content: [{ text: { value: "" }, type: "text" }],
          role: "assistant",
          id: "#loading",
          created_at: -1,
          file_ids: [],
          metadata: {},
          object: "null",
          thread_id: threadId,
        },
      ]);
      scrollToLastMessage();
      await fecthMessages(threadId);
      setPrompt("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col w-full flex-1 px-2 pb-8 gap-2 justify-center items-center overflow-hidden`}
    >
      <ErrorMessage message={formError} onClose={() => setFormError("")} />
      <div
        className={`w-full h-full flex flex-1 flex-col px-1 overflow-y-auto ${
          responses.length > 0 ? "justify-start" : "justify-center"
        }`}
      >
        {!(responses.length > 0) && (
          <motion.div
            animate={{ translateY: [50, 0], opacity: [0, 1] }}
            transition={{ type: "spring", delay: 0.5 }}
            className={`chat chat-end`}
          >
            <div className="chat-image avatar">
              <FaRobot className="text-lg !text-primary" />
            </div>

            <div className={`chat-header !text-primary`}>Chat DO Assistant</div>

            <div className={`chat-bubble chat-bubble-info bg-opacity-25`}>
              {contentLoading ? (
                <span className="loading loading-dots loading-lg !text-primary"></span>
              ) : (
                <>Hello! How may I assist your?</>
              )}
            </div>
          </motion.div>
        )}
        {responses.map((response, index) => {
          const isLast = index === responses.length - 1;
          const isAssistant = response.role === "assistant";
          return (
            <motion.div
              key={response.id}
              animate={{ translateY: [50, 0], opacity: [0, 1] }}
              transition={{ type: "spring", delay: 0.5 }}
              className={`chat ${isAssistant ? "chat-end" : "chat-start"}  `}
            >
              {isAssistant && (
                <div className="chat-image avatar">
                  <FaRobot className="text-lg !text-primary" />
                </div>
              )}

              <div
                className={`chat-header ${
                  isAssistant ? "!text-primary" : "!text-info"
                }`}
              >
                {isAssistant ? "Chat DO Assistant" : "You"}
              </div>

              <div
                className={`chat-bubble ${
                  isAssistant
                    ? "chat-bubble-info bg-opacity-25"
                    : "chat-bubble-info bg-opacity-5"
                } }`}
              >
                {response.id === "#loading" && (
                  <span className="loading loading-dots loading-mdtext-white"></span>
                )}
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  className="flex flex-col gap-2 text-sm text-black text-opacity-70 break-words [&>*]:leading-loose"
                >
                  {clearCitations(response) || ""}
                </Markdown>
              </div>

              {!isLast && <div className="divider"></div>}
              <div
                id={isLast ? "message-last" : ""}
                ref={isLast ? messageLastRef : undefined}
              ></div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col w-full h-full">
        <label className="input input-md input-bordered flex items-center gap-2 w-full max-md:input-sm">
          {prompt && (
            <>
              <IoClose
                className={`text-md cursor-pointer ${
                  contentLoading
                    ? "disabled !text-info text-opacity-50"
                    : "!text-info"
                }`}
                onClick={() => setPrompt("")}
              />
            </>
          )}
          <input
            disabled={contentLoading}
            type="text"
            placeholder="Ask us a question..."
            className="grow"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {contentLoading && (
            <span className="loading loading-spinner loading-sm !text-info"></span>
          )}
          <IoIosSend
            className={`text-2xl max-md:text-xl cursor-pointer ${
              contentLoading ? "disabled !text-info" : "!text-primary"
            }`}
            onClick={handleSubmit}
          />
        </label>
      </div>
    </form>
  );
};

export default Chat;

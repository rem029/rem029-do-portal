import React, { useEffect, useMemo, useState } from "react";
import CustomerSurveyCard from "../../common/card";
import {
  EmployeeQuestion,
  EmployeeQuestionItem,
  EmployeeQuestionsEmailStatus,
  EmployeeResponsesManagement,
} from "../../../types";
import { useSearchParams, useNavigate } from "react-router-dom";
import SuccessMessageForm from "../success-message";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";

const COLLECTION_NAME: Record<
  string,
  { departments: string; post: string; read: string; status: string }
> = {
  default: {
    departments: "department",
    post: "employee-responses-management",
    read: "employee-questions-management",
    status: "employee-questions-management-email-status",
  },
  padel: {
    departments: "department",
    post: "employee-responses-management",
    read: "employee-questions-management",
    status: "employee-questions-management-email-status",
  },
};

const QUESTION_OPTIONS = [{ value: "default", label: "Default" }];

const URL_BASE = "/mgmt";

const EmployeeSurveyManagement = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [feedbackFields, setFeedbackFields] =
    useState<EmployeeResponsesManagement>(defaultFields);
  const [step, setStep] = useState<
    "enter-employee-id" | "enter-employee-info" | "enter-employee-done"
  >("enter-employee-id");
  const [formError, setFormError] = useState("");
  const [language, setLanguage] = useState("en");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formType, setFormType] = useState<string | null>(
    searchParams.get("type") ? searchParams.get("type") : "default",
  );

  const [employeeQuestions, setEmployeeQuestions] = useState<
    EmployeeQuestion[] | undefined
  >();

  const filteredEmployeeQuestions = useMemo<EmployeeQuestionItem[]>(() => {
    if (!employeeQuestions || employeeQuestions.length === 0) return [];

    return employeeQuestions.map((_eq) => {
      const fallbackContent: EmployeeQuestionItem = {
        id: _eq.id,
        language: "en",
        type: "text",
        title: _eq.default_title,
        subtitle: _eq.default_subtitle,
      };

      const matchingContent: EmployeeQuestionItem | undefined = _eq.item.find(
        (eq) => eq.language === language,
      );
      const finalContent: EmployeeQuestionItem = matchingContent
        ? { ...matchingContent, id: _eq.id }
        : fallbackContent;

      return finalContent;
    });
  }, [employeeQuestions, language]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setEmployeeQuestions(undefined);

        const type = searchParams.get("type");
        const collectionName = COLLECTION_NAME[type as string]
          ? COLLECTION_NAME[type as string].read
          : COLLECTION_NAME["default"].read;
        const response = await axiosPayloadClient.get(
          `/api/${collectionName}?sort=id&limit=100000&where[type][equals]=${type}`,
        );

        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching questions. Please contact IT.");
        }
        const docs = response.data.docs;

        setEmployeeQuestions(docs);
      } catch (error) {
        setFormError(
          (error as Error)?.message || "Unknown error. Please contact IT.",
        );
      }
    };

    if (step === "enter-employee-info") {
      setContentLoading(true);
      Promise.all([fetchQuestions()]).finally(() => {
        setContentLoading(false);
      });
    }

    if (searchParams.get("id")) checkAnonymousId();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (!searchParams.get("id")) setStep("enter-employee-id");
    else {
      setFeedbackFields((prevState) => ({
        ...prevState,
        anonymousId: searchParams.get("id") || "",
      }));
      setStep("enter-employee-info");
      checkAnonymousId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("id"), searchParams]);

  useEffect(() => {
    if (language === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [language]);

  useEffect(() => {
    setFeedbackFields((prevState) => ({ ...prevState, department_sub: "" }));
  }, [feedbackFields.department]);

  const getDocStatusByAnonymousId = async (
    anonymous_id: string,
  ): Promise<"error" | "responded" | "not-responded"> => {
    const type = searchParams.get("type");

    const collectionName = COLLECTION_NAME[type as string]
      ? COLLECTION_NAME[type as string].status
      : COLLECTION_NAME["default"].status;

    const response = await axiosPayloadClient.get(
      `/api/${collectionName}?limit=10000&where[anonymous_id][equals]=${anonymous_id}`,
    );

    if (response.status !== 200) {
      setFormError("Error validating survey ID. Please contact IT.");
    }

    const { docs } = response.data;
    const docStatus: EmployeeQuestionsEmailStatus | undefined =
      docs !== undefined && docs.length > 0
        ? (docs as EmployeeQuestionsEmailStatus[])[0]
        : undefined;

    if (!docStatus || docStatus === undefined) {
      setStep("enter-employee-id");
      setFormError(
        "Error fetching survey data. Please check ID is correct or contact IT.",
      );
      return "error";
    }

    if (!type) {
      setStep("enter-employee-id");
      return "error";
    }

    setStep("enter-employee-info");
    if (docStatus.status === "responded") {
      return "responded";
    } else {
      return "not-responded";
    }
  };

  const checkAnonymousId = async () => {
    try {
      setFormError("");
      setContentLoading(true);
      const status = await getDocStatusByAnonymousId(searchParams.get("id") || "");

      if (status === "error") {
        setStep("enter-employee-id");
        setFormType("");
        setFormError(
          "Error fetching data. Please check ID is correct or contact IT.",
        );
      }

      if (status === "responded") {
        setShowSuccess(true);
      } else {
        setShowSuccess(false);
      }
    } catch (error) {
      setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
    } finally {
      setContentLoading(false);
    }
  };

  const handleChangeValue = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    let { value, name } = e.target;
    if (name.includes("employee_question")) {
      const valueSplit = name.split(":");
      name = valueSplit[1];

      const matchedQuestionIndex = feedbackFields.questions.findIndex(
        (q) => q.question === name,
      );

      setFeedbackFields((prevState) => {
        if (matchedQuestionIndex === -1) {
          return {
            ...prevState,
            questions: [...prevState.questions, { question: name, response: value }],
          };
        }
        prevState.questions[matchedQuestionIndex].question = name;
        prevState.questions[matchedQuestionIndex].response = value;
        return {
          ...prevState,
        };
      });
    }

    setFeedbackFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleProceedSurvey = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (!feedbackFields.anonymousId) return;

    navigate(
      `${URL_BASE}?id=${feedbackFields.anonymousId.toString()}&type=${formType}`,
    );
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      setFormError("");
      setSubmitLoading(true);
      const convertRatingValue = (value: string) =>
        value.replaceAll(" ", "-").toLowerCase();

      const status = await getDocStatusByAnonymousId(searchParams.get("id") || "");

      if (feedbackFields.questions.length !== filteredEmployeeQuestions.length) {
        setFormError("All question(s) are mandatory.");
        return;
      }

      if (!feedbackFields.anonymousId) {
        setFormError("Survey ID is required.");
        return;
      }

      if (status === "error" || status === "responded") {
        setFormError(
          "Something went wrong while submitting your form. Please check ID or contact IT.",
        );
        return;
      }

      const collectionName = COLLECTION_NAME[formType as string]
        ? COLLECTION_NAME[formType as string].post
        : COLLECTION_NAME["default"].post;

      const response = await axiosPayloadClient.post(`/api/${collectionName}`, {
        anonymous_id: feedbackFields.anonymousId.toString(),
        department: feedbackFields.department,
        department_sub: feedbackFields.department_sub,
        questions: feedbackFields.questions.map((q) => ({
          question: Number(q.question),
          response: convertRatingValue(q.response),
        })),
        employee_comments: feedbackFields.employee_comments,
      });

      if (response.status !== 201) {
        throw Error(
          "Something went wrong while submitting your form. Please contact admin.",
        );
      }

      setLanguage("en");
      setShowSuccess(true);
    } catch (error) {
      setFormError((error as Error)?.message || "Unknown error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-4 px-12 max-md:py-4 p-8 flex flex-col flex-1 items-center relative">
      {step === "enter-employee-id" && (
        <div className="w-screen h-screen overflow-x-hidden overflow-y-auto  max-md:px-4 px-12 max-md:py-4 p-8 flex flex-col flex-1 items-start relative">
          <div className="card flex flex-col w-full gap-4 items-center justify-center py-4 px-4">
            <label className="form-control w-full max-w-lg">
              <div className="label">
                <span className="label-text !text-primary font-bold">
                  Please enter assigned survey ID?
                </span>
              </div>
              <input
                type="text"
                name="anonymousId"
                placeholder="Survey ID"
                value={feedbackFields.anonymousId || ""}
                onChange={handleChangeValue}
                className="input input-ghost input-md input-primary w-full"
                disabled={submitLoading}
              />
              {!searchParams.get("type") && (
                <div className="flex flex-col gap-1 py-4">
                  <span className="label-text !text-primary font-bold">
                    Please select options
                  </span>
                  {QUESTION_OPTIONS.map((option) => {
                    return (
                      <div className="form-control">
                        <label className="label cursor-pointer">
                          <span
                            className={`label-text ${
                              formType === option.value ? "" : "!text-info"
                            } `}
                          >
                            {option.label}
                          </span>
                          <input
                            type="radio"
                            name="radio-10"
                            className="radio checked:bg-primary"
                            checked={formType === option.value}
                            onClick={() => setFormType(option.value)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </label>
            {formError && (
              <div>
                <p className="text-red-400 text-sm">{formError}</p>
              </div>
            )}
            <button
              className="btn btn-primary text-white w-full max-w-lg"
              disabled={!feedbackFields.anonymousId && !formType}
              onClick={handleProceedSurvey}
            >
              Proceed to survey
            </button>
          </div>
        </div>
      )}
      {step === "enter-employee-info" && (
        <>
          {showSuccess && <SuccessMessageForm />}
          {!showSuccess && (
            <>
              {contentLoading && (
                <div className="flex flex-col w-screen h-screen items-center justify-center">
                  <h6 className="w-full text-center !text-primary text-md max-sm:text-md mb-2">
                    Loading contents...
                  </h6>
                  <span className="loading loading-dots loading-lg !text-primary"></span>
                </div>
              )}
              {!contentLoading && (
                <div className="w-full max-w-2xl">
                  <ErrorMessage
                    message={formError}
                    onClose={() => setFormError("")}
                  />

                  <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-4 max-md:gap-6"
                  >
                    <div className="flex flex-col items-start justify-center flex-1">
                      <div className="join">
                        {["en", "ar"].map((lang) => {
                          return (
                            <button
                              className={`btn btn-xs join-item ${
                                language === lang
                                  ? "btn-primary"
                                  : "btn-info btn-outline"
                              }`}
                              onClick={() => setLanguage(lang)}
                            >
                              {lang.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <h1
                      className={`w-full !text-info text-xs text-md max-sm:text-md mb-2 opacity-50 ${
                        language === "ar" ? "text-right" : "text-left"
                      }`}
                    >
                      Anonymous ID: {feedbackFields.anonymousId}
                    </h1>

                    {filteredEmployeeQuestions.map((questions, index) => {
                      const field = feedbackFields.questions.find((q) => {
                        return q.question.toString() === questions.id.toString();
                      });

                      return (
                        <CustomerSurveyCard key={index} animate elevate>
                          <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-2">
                              <h6 className="text-md leading-loose whitespace-normal text-secondary inline-flex gap-2 items-center max-md:text-sm">
                                {/* {questions.id}.&nbsp;{questions.title} */}
                                {questions.title}
                              </h6>
                              <div className="h-[2px] w-full bg-primary" />
                            </div>
                            <textarea
                              required
                              className="textarea w-full h-32"
                              name={`employee_question:${questions.id}`}
                              value={field?.response || ""}
                              onChange={handleChangeValue}
                              disabled={submitLoading}
                            />
                          </div>
                        </CustomerSurveyCard>
                      );
                    })}

                    <CustomerSurveyCard animate elevate>
                      {/* Comments*/}
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <h6 className="text-md leading-loose text-secondary inline-flex gap-2 items-center max-md:text-sm">
                            Additional comments or feedback?
                          </h6>
                          <div className="h-[2px] w-full bg-primary" />
                        </div>
                        <textarea
                          placeholder="Please type here..."
                          name="employee_comments"
                          value={feedbackFields?.employee_comments || ""}
                          onChange={handleChangeValue}
                          className="textarea textarea-bordered w-full h-48"
                          disabled={submitLoading}
                        />
                      </div>
                    </CustomerSurveyCard>

                    <button
                      type="submit"
                      className="btn btn-primary w-full text-white shadow-lg"
                      disabled={submitLoading}
                    >
                      Submit&nbsp;{}
                      <span
                        className={`loading loading-spinner loading-md ${
                          !submitLoading ? "hidden" : ""
                        }`}
                      />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeSurveyManagement;

const defaultFields: EmployeeResponsesManagement = {
  anonymousId: undefined,
  department: "",
  department_sub: "",
  questions: [],
  employee_comments: "",
};

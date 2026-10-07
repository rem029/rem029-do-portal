import React, { useEffect, useMemo, useState } from "react";
import CustomerSurveyCard from "../../common/card";
import {
  EmployeeRatingOptions,
  ContentHeader,
  ContentInfo,
  EmployeeResponse,
  Departments,
  EmployeeQuestionsEmailStatus,
  Language,
  LanguageLabel,
} from "../../../types";
import Rating from "../../common/rating";
import { serializeRichText } from "../../../helpers";
import { CiGlobe } from "react-icons/ci";
import { FaInfoCircle } from "react-icons/fa";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import SuccessMessageForm from "../success-message";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";
import { t } from "../../../utils/contents";
import { EmployeeQuestionsGroup, EmployeeQuestionsNew as EmployeeQuestion } from "../../../types/payload-types";
import RadioGroup from "../../common/radio-group";
import { addAnalytics } from "../../../helpers/analytics";

const defaultQuestionGroup: EmployeeQuestionsGroup = {
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  id: -1,
  name: "No group (Default)",
};

export interface EmployeeQuestionPartial extends Pick<
  EmployeeQuestion,
  "default_title" | "default_subtitle" | "question_type" | "rating_labels" | "select_options" | "max_scale" | "required"
> {
  id: string;
}

// id: string;
// title: string;
// subTitle: string;
// type: EmployeeQuestion["question_type"];
// ratings?: EmployeeQuestion["rating_labels"];
// select_options?: EmployeeQuestion["select_options"];

const EmployeeSurvey = (): JSX.Element => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [feedbackFields, setFeedbackFields] = useState<EmployeeResponse>(defaultFields);
  const [step, setStep] = useState<"enter-employee-id" | "enter-employee-info" | "enter-employee-done">(
    "enter-employee-id",
  );
  const [departments, setDepartments] = useState<Departments[] | undefined>(undefined);
  const [formError, setFormError] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [questionGroupId, setQuestionGroupId] = useState<number>(Number(searchParams.get("group") || -1));
  const [questionGroups, setQuestionGroups] = useState<EmployeeQuestionsGroup[]>([defaultQuestionGroup]);

  const [content, setContent] = useState<
    | {
        header: ContentHeader[];
        info: ContentInfo[];
      }
    | undefined
  >();
  const [employeeQuestions, setEmployeeQuestions] = useState<EmployeeQuestion[] | undefined>();

  const headerName = useMemo(() => {
    if (!content || !content?.header || content?.header.length === 0) return "";
    const matchingContent = content?.header.find((c) => c.language === language)?.content;
    const fallbackContent = content?.header[0]?.content || [];
    const finalContent = matchingContent || fallbackContent;

    return finalContent;
  }, [content, language]);

  const questionGroupContent = useMemo(() => {
    if (questionGroupId === -1) return defaultQuestionGroup;
    const questionGroup = questionGroups.find((qg) => qg.id === questionGroupId);

    return questionGroup;
  }, [questionGroupId, questionGroups]);

  const infoText = useMemo(() => {
    if (
      questionGroupContent?.information &&
      typeof questionGroupContent.information === "object" &&
      questionGroupContent.information[language] &&
      Array.isArray(questionGroupContent.information[language])
    ) {
      const info = questionGroupContent?.information[language];
      if (info) return info.map((item) => serializeRichText(item as any));
    }

    if (!content || !content.info || content.info.length === 0) return [];

    const matchingContent = content.info.find((c) => c.language === language)?.content;

    const fallbackContent = content.info[0]?.content || [];
    const finalContent = matchingContent || fallbackContent;
    return finalContent.map((item) => serializeRichText(item));
  }, [content, language, questionGroupContent]);

  const subDepartment = useMemo(() => {
    if (!departments && !feedbackFields.department) return [];

    return departments?.find((d) => d.name === feedbackFields.department)?.department_subs;
  }, [departments, feedbackFields.department]);

  const filteredEmployeeQuestions = useMemo<Record<string, EmployeeQuestionPartial[]>>(() => {
    if (!employeeQuestions || employeeQuestions.length === 0) return {};
    let empQuestionsGrouped: Record<string, EmployeeQuestionPartial[]> = {};

    for (const empQuestion of employeeQuestions) {
      const label = empQuestion?.group_label || "";
      let defaultQuestion: EmployeeQuestionPartial = {
        id: empQuestion.id.toString(),
        default_title: empQuestion.default_title || "",
        question_type: empQuestion?.question_type || "rating",
        default_subtitle: empQuestion.default_subtitle || "",
        rating_labels: empQuestion?.rating_labels,
        select_options: empQuestion?.select_options,
        max_scale: empQuestion?.max_scale,
        required: empQuestion?.required || false,
      };

      const questionItem = empQuestion?.item?.find((eq) => eq.language === language);

      if (questionItem) {
        defaultQuestion = {
          ...defaultQuestion,
          default_title: questionItem.title || "",
          default_subtitle: questionItem?.subtitle || "",
        };
      }

      const empQuestionsGroupedItem = empQuestionsGrouped[label]
        ? [...empQuestionsGrouped[label], defaultQuestion]
        : [defaultQuestion];

      empQuestionsGrouped = {
        ...empQuestionsGrouped,
        [label]: empQuestionsGroupedItem,
      };
    }

    return empQuestionsGrouped;
  }, [employeeQuestions, language]);

  // const filteredEmployeeQuestionsLength = useMemo(() => {
  //   let length = 0;
  //   for (const key of Object.keys(filteredEmployeeQuestions)) {
  //     length = length + filteredEmployeeQuestions[key].length;
  //   }
  //   return length;
  // }, [filteredEmployeeQuestions]);

  useEffect(() => {
    addAnalytics("page_view", pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setContent(undefined);
        const response = await axiosPayloadClient.get(`/api/contents?limit=100000`);

        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching contents. Please contact IT.");
        }
        const docs = response.data.docs[0];
        const docsHeaders = docs["header"];
        const docsInfo = docs["info"];

        setContent({
          header: docsHeaders as ContentHeader[],
          info: docsInfo as ContentInfo[],
        });
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      }
    };

    const fetchQuestions = async () => {
      try {
        setEmployeeQuestions(undefined);
        const group = Number(searchParams.get("group") || -1);

        const response = await axiosPayloadClient.get(
          `/api/employee-questions-new?sort=order&limit=0${`&where[question_group][equals]=${
            group !== -1 ? group : "null"
          }`}`,
        );

        if (response.status !== 200 || !response.data.docs || !(response.data.docs.length > 0)) {
          setFormError("Error fetching questions. Please contact IT.");
        }
        const docs = response.data.docs;

        setEmployeeQuestions(docs);
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      }
    };

    const fetchGroupQuestions = async () => {
      setContentLoading(true);
      try {
        setQuestionGroups([defaultQuestionGroup]);

        const response = await axiosPayloadClient.get(`/api/employee-questions-group?sort=id&limit=100000`);

        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching questions. Please contact IT.");
        }
        const docs = response.data.docs;

        setQuestionGroups([defaultQuestionGroup, ...docs]);
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      } finally {
        setContentLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        setDepartments(undefined);
        const response = await axiosPayloadClient.get(`/api/department?limit=100000&sort=name`);

        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching department list. Please contact IT.");
        }
        const docs = response.data.docs;
        setDepartments(docs);
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      }
    };

    if (step === "enter-employee-info") {
      setContentLoading(true);
      Promise.all([fetchContents(), fetchQuestions(), fetchDepartments()]).finally(() => {
        setContentLoading(false);
      });
    }

    fetchGroupQuestions();

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

  const getDocStatusByAnonymousId = async (anonymous_id: string): Promise<"error" | "responded" | "not-responded"> => {
    const group = searchParams.get("group");
    const response = await axiosPayloadClient.get(
      `/api/employee-questions-email-status?limit=10000&where[anonymous_id][equals]=${anonymous_id}`,
    );

    if (response.status !== 200) {
      setFormError("Error validating survey ID. Please contact IT.");
    }

    const { docs } = response.data;
    const docStatus: EmployeeQuestionsEmailStatus | undefined =
      docs !== undefined && docs.length > 0 ? (docs as EmployeeQuestionsEmailStatus[])[0] : undefined;

    if (!docStatus || docStatus === undefined) {
      setStep("enter-employee-id");
      setFormError("@getDocStatusByAnonymousIdError fetching survey data. Please check ID is correct or contact IT.");
      return "error";
    }

    if (!group) {
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
        setFormError("Error fetching survey data. Please check ID is correct or contact IT.");
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
    questionType?: EmployeeQuestion["question_type"],
    ratingLabels?: EmployeeQuestion["rating_labels"],
  ) => {
    let { value, name } = e.target;
    questionType = questionType ? questionType : "rating";

    if (name.includes("employee_question")) {
      const valueSplit = name.split(":");
      name = valueSplit[1];

      if (questionType === "rating") {
        value = getKeyByValue(Number(valueSplit[2])) || "";
      }

      if (questionType === "rating_custom") {
        value = ratingLabels ? ratingLabels[Number(valueSplit[2]) - 1]?.label || "" : "";
      }

      if (questionType === "select") {
        value = valueSplit[3] || "";
      }

      const matchedQuestionIndex = feedbackFields.questions.findIndex((q) => q.question === name);

      setFeedbackFields((prevState) => {
        const isRating = questionType === "rating";
        if (matchedQuestionIndex === -1) {
          const existingQuestions = [...prevState.questions];
          return {
            ...prevState,
            questions: [
              ...existingQuestions,
              {
                question_type: questionType as string,
                question: name,
                ...(isRating ? { response: value } : { response: "", response_text: value }),
              },
            ],
          };
        }
        const updatedQuestions = [...prevState.questions];
        const updatedQuestion = { ...updatedQuestions[matchedQuestionIndex] };

        updatedQuestion.question = name;
        updatedQuestion.question_type = questionType as string;

        if (questionType === "rating") {
          updatedQuestion.response = value as string;
        } else if (questionType === "rating_custom") {
          updatedQuestion.response = "";
          updatedQuestion.response_text = value as string;
        } else {
          updatedQuestion.response_text = value as string;
        }
        updatedQuestions[matchedQuestionIndex] = updatedQuestion;
        return {
          ...prevState,
          questions: updatedQuestions,
        };
      });
    }

    setFeedbackFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleProceedSurvey = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!feedbackFields.anonymousId) return;

    navigate(`/employee?id=${feedbackFields.anonymousId.toString()}&group=${questionGroupId}`);
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setFormError("");
      setSubmitLoading(true);
      const convertRatingValue = (value: string) => value.replaceAll(" ", "-").toLowerCase();

      const anonymousId = feedbackFields?.anonymousId || "".toString();
      const [, group] = anonymousId.split("_");

      if (Number(group) !== Number(searchParams.get("group") || -1)) {
        setFormError("Invalid group id. Please use the URL sent from your mail.");
        return;
      }

      const requiredQuestionIds = (employeeQuestions?.filter((eq) => eq?.required === true) || []).map((eq) =>
        eq.id.toString(),
      );

      const status = await getDocStatusByAnonymousId(anonymousId);

      const answeredQuestionIds = feedbackFields.questions.map((q) => q.question.toString());
      const missingRequiredQuestions = requiredQuestionIds.filter((reqId) => !answeredQuestionIds.includes(reqId));

      if (missingRequiredQuestions.length > 0) {
        setFormError(
          `Please answer all required questions. ${missingRequiredQuestions.length} required question(s) remaining.`,
        );
        return;
      }

      if (!feedbackFields.anonymousId) {
        setFormError("Survey ID is required.");
        return;
      }

      if (!feedbackFields.department) {
        setFormError("Department is required.");
        return;
      }

      if (status === "error" || status === "responded") {
        setFormError("Something went wrong while submitting your form. Please check ID or contact IT.");
        return;
      }

      const response = await axiosPayloadClient.post(`/api/employee-responses`, {
        anonymous_id: feedbackFields.anonymousId.toString(),
        department: feedbackFields.department,
        department_sub: feedbackFields.department_sub,
        questions: feedbackFields.questions.map((q) => ({
          question: Number(q.question),
          question_type: q?.question_type || "rating",
          response: q.response ? convertRatingValue(q.response) : undefined,
          response_text: q?.response_text || "",
        })),
        employee_comments: feedbackFields.employee_comments,
      });

      if (response.status !== 201) {
        throw Error("Something went wrong while submitting your form. Please contact admin.");
      }

      setLanguage("en");
      setShowSuccess(true);
      await addAnalytics("form_submission", pathname);
    } catch (error) {
      setFormError((error as Error)?.message || "Unknown error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRatingNumberValue = (value: string | undefined) => {
    if (!value) return 0;
    return EmployeeRatingOptions[value] ? EmployeeRatingOptions[value] : 0;
  };

  const getKeyByValue = (value: number): string | undefined => {
    for (const [key, val] of Object.entries(EmployeeRatingOptions)) {
      if (val === value) return key;
    }

    return undefined;
  };

  return (
    <>
      {step === "enter-employee-id" && (
        <div className="w-screen h-screen overflow-x-hidden overflow-y-auto  max-md:px-4 px-12 max-md:py-4 p-8 flex flex-col flex-1 items-start relative">
          <div className="card flex flex-col w-full gap-4 items-center justify-center py-4 px-4">
            <label className="form-control w-full max-w-lg">
              <div className="label">
                <span className="label-text !text-primary font-bold">Please enter assigned survey ID?</span>
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
              {!searchParams.get("group") && (
                <div className="flex flex-col gap-1 py-4">
                  <span className="label-text !text-primary font-bold">Please select question group</span>
                  {questionGroups.map((qg, idx) => {
                    return (
                      <div className="form-control">
                        <label className="label cursor-pointer">
                          <span className={`label-text ${questionGroupId === qg.id ? "" : "!text-info"} `}>
                            {qg.name}
                          </span>
                          <input
                            type="radio"
                            name="radio-10"
                            className="radio checked:bg-primary"
                            checked={questionGroupId === qg.id}
                            onClick={() => setQuestionGroupId(qg.id)}
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
              disabled={!feedbackFields.anonymousId && !questionGroupId}
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
                  <h6 className="w-full text-center !text-primary text-md max-sm:text-md mb-2">Loading contents...</h6>
                  <span className="loading loading-dots loading-lg !text-primary"></span>
                </div>
              )}
              {!contentLoading && (
                <div className="w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-4 px-12 max-md:py-4 p-8 flex flex-col flex-1 items-center relative">
                  <ErrorMessage message={formError} onClose={() => setFormError("")} />

                  <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4 max-md:gap-6">
                    <h1
                      className={`font-Noah-Regular w-full text-gray-700 text-xl max-sm:text-md mb-2 ${
                        language === "ar" ? "text-right" : "text-left"
                      } `}
                    >
                      {questionGroupContent?.title?.[language] ? questionGroupContent?.title?.[language] : headerName}
                    </h1>
                    <h1
                      className={`font-Poppins font-extralight w-full  !text-info text-sm max-sm:text-xs mb-2 ${
                        language === "ar" ? "text-right" : "text-left"
                      }`}
                    >
                      Anonymous ID: {feedbackFields.anonymousId}
                    </h1>

                    <div className="flex flex-col items-start justify-center flex-1">
                      <label className="form-control w-full max-w-xs">
                        {questionGroupContent?.langs && questionGroupContent?.langs?.length > 0 && (
                          <>
                            <div className="label">
                              <span className="font-Poppins font-extralight label-text !text-info">
                                <CiGlobe className="inline-block text-lg" />
                                Pick your language
                              </span>
                            </div>
                            <select
                              className="select select-ghost w-full max-w-xs"
                              value={language}
                              onChange={(e) => setLanguage(e.target.value as Language)}
                            >
                              {questionGroupId !== -1 &&
                                questionGroupContent?.langs.map((lang) => (
                                  <option key={`lang_${lang}`} value={lang}>
                                    {LanguageLabel[lang]}
                                  </option>
                                ))}

                              {questionGroupId === -1 && <option value="fr">French</option>}
                            </select>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="flex flex-col items-start justify-center flex-1">
                      <label className="form-control w-full max-w-xs">
                        <div className="label">
                          <span className="label-text !text-info font-Poppins font-extralight">Department</span>
                        </div>
                        <select
                          required
                          className="select select-ghost w-full max-w-xs"
                          value={departments?.find((d) => d.name === feedbackFields?.department || "")?.id || -1}
                          name="department"
                          onChange={(e) =>
                            setFeedbackFields((prevState) => ({
                              ...prevState,
                              department:
                                departments?.find((d) => d.id.toString() === e.target.value.toString())?.name || "",
                            }))
                          }
                        >
                          <option key={`department_${-1}`} value={-1} disabled>
                            Select a department
                          </option>
                          {questionGroupContent?.departments && questionGroupContent.departments.length > 0
                            ? questionGroupContent?.departments.map((d) => {
                                const item = d as unknown as Departments;
                                return (
                                  <option key={`department_${item.id}`} value={item.id}>
                                    {item.name}
                                  </option>
                                );
                              })
                            : departments?.map((d) => (
                                <option key={`department_${d.id}`} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                        </select>
                      </label>
                    </div>
                    {questionGroupContent?.show_sub_department && (
                      <>
                        {feedbackFields?.department && subDepartment && subDepartment.length > 0 && (
                          <div className="flex flex-col items-start justify-center flex-1">
                            <label className="form-control w-full max-w-xs">
                              <div className="label">
                                <span className="label-text !text-info">Sub-department</span>
                              </div>
                              <select
                                className="select select-ghost w-full max-w-xs"
                                value={
                                  subDepartment?.find((d) => d.name === feedbackFields?.department_sub || "")?.id || -1
                                }
                                name="department_sub"
                                onChange={(e) =>
                                  setFeedbackFields((prevState) => ({
                                    ...prevState,
                                    department_sub:
                                      subDepartment?.find((d) => d.id.toString() === e.target.value.toString())?.name ||
                                      "",
                                  }))
                                }
                              >
                                <option key={`department_sub${-1}`} value={-1} disabled>
                                  Select a Sub-department
                                </option>
                                {subDepartment &&
                                  subDepartment.map((d) => (
                                    <option key={`department_sub_${d.id}`} value={d.id}>
                                      {d.name}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          </div>
                        )}
                      </>
                    )}
                    {questionGroupContent?.show_information && (
                      <div className="card bg-gray-100 px-3 py-3 min-w-full">
                        <div className="flex flex-col gap-2">
                          <h6 className="font-Noah-Regular text-sm font-bold text-bold text-gray-400 inline-flex gap-2 items-center">
                            <FaInfoCircle className="inline-block" />
                            Information
                          </h6>
                          <div className="h-[1px] w-full bg-gray-400" />
                          <p
                            dangerouslySetInnerHTML={{
                              __html: infoText.join("<br/>"),
                            }}
                            className={`font-Poppins font-extralight text-gray-500 text-sm leading-6`}
                          ></p>
                        </div>
                      </div>
                    )}

                    {Object.keys(filteredEmployeeQuestions).map((questionGroupedKey, edKey, index) => {
                      const label = questionGroupedKey;
                      const items = filteredEmployeeQuestions[questionGroupedKey];

                      return (
                        <div className="w-full flex flex-col gap-2 py-4" key={`${label}_${index}`}>
                          <h6 className="font-Noah-Regular text-md font-bold text-secondary inline-flex gap-2 items-center">
                            {label}
                          </h6>

                          {items.map((questions, index) => {
                            const field = feedbackFields.questions.find((q) => {
                              return q.question.toString() === questions.id.toString();
                            });

                            switch (questions.question_type) {
                              case "rating": {
                                return (
                                  <CustomerSurveyCard key={index} animate>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-2">
                                        <h6 className="font-Noah-Regular text-md font-bold text-bold !text-primary inline-flex gap-2 items-start">
                                          {questions?.required && <span className="text-red-500 text-sm">*</span>}
                                          {index + 1}.&nbsp;
                                          {questions.default_title}
                                        </h6>
                                        <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                                      </div>
                                      <Rating
                                        className="font-Noah-Regular [*&>]text-secondary"
                                        name={`employee_question:${questions.id}`}
                                        count={5}
                                        value={getRatingNumberValue(field?.response)}
                                        valueLabel={field?.response}
                                        onChange={(e) => handleChangeValue(e, questions.question_type || "rating")}
                                        disabled={submitLoading}
                                        variant="bg-secondary"
                                      />
                                      {questions?.required && !field?.response && (
                                        <div className="flex flex-col gap-2 bg-red-50 p-2 rounded-sm">
                                          <p className="font-Noah-Regular text-xs font-bold text-bold text-red-400 inline-flex gap-2 items-start">
                                            This question is required.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CustomerSurveyCard>
                                );
                              }
                              case "rating_custom": {
                                const labels = questions?.rating_labels || [];
                                const foundIndex = labels?.findIndex((l) => l.label === field?.response_text) ?? -1;
                                const currentValue = foundIndex >= 0 ? foundIndex + 1 : 0;

                                return (
                                  <CustomerSurveyCard key={index} animate>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-2">
                                        <h6 className="font-Noah-Regular text-md font-bold text-bold !text-primary inline-flex gap-2 items-start">
                                          {questions?.required && <span className="text-red-500 text-sm">*</span>}
                                          {index + 1}.&nbsp;
                                          {questions.default_title}
                                        </h6>
                                        <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                                      </div>
                                      {labels.length === 0 && (
                                        <p className="text-sm text-secondary">
                                          No custom labels defined for this question.
                                        </p>
                                      )}
                                      <Rating
                                        className="font-Noah-Regular [*&>]text-secondary"
                                        name={`employee_question:${questions.id}`}
                                        count={labels.length}
                                        value={currentValue}
                                        valueLabel={field?.response_text}
                                        onChange={(e) => handleChangeValue(e, "rating_custom", labels)}
                                        disabled={submitLoading}
                                        variant="bg-secondary"
                                      />
                                      {questions?.required && !field?.response_text && (
                                        <div className="flex flex-col gap-2 bg-red-50 p-2 rounded-sm">
                                          <p className="font-Noah-Regular text-xs font-bold text-bold text-red-400 inline-flex gap-2 items-start">
                                            This question is required.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CustomerSurveyCard>
                                );
                              }
                              case "select": {
                                const options = questions?.select_options || [];
                                return (
                                  <CustomerSurveyCard key={index} animate>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-2">
                                        <h6 className="font-Noah-Regular text-md font-bold text-bold !text-primary inline-flex gap-2 items-start">
                                          {questions?.required && <span className="text-red-500 text-sm">*</span>}
                                          {index + 1}.&nbsp;
                                          {questions.default_title}
                                        </h6>
                                        <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                                      </div>
                                      <RadioGroup
                                        label=""
                                        fullWidth
                                        direction="flex-col"
                                        name={`employee_question:${questions.id}`}
                                        value={field?.response_text}
                                        onChange={(e) => handleChangeValue(e, "select")}
                                        items={
                                          options.map((s) => ({
                                            label: s?.label || "",
                                            value: s?.label || "",
                                          })) || []
                                        }
                                        disabled={submitLoading}
                                        unChecked={{ className: "!border-[.5px]" }}
                                      />
                                      {questions?.required && !field?.response_text && (
                                        <div className="flex flex-col gap-2 bg-red-50 p-2 rounded-sm">
                                          <p className="font-Noah-Regular text-xs font-bold text-bold text-red-400 inline-flex gap-2 items-start">
                                            This question is required.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CustomerSurveyCard>
                                );
                              }
                              case "textarea": {
                                return (
                                  <CustomerSurveyCard key={index} animate>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-2">
                                        <h6 className="font-Noah-Regular text-md font-bold text-bold !text-primary inline-flex gap-2 items-start">
                                          {questions?.required && <span className="text-red-500 text-sm">*</span>}
                                          {index + 1}.&nbsp;
                                          {questions.default_title}
                                        </h6>
                                        <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                                      </div>
                                      <textarea
                                        className="textarea-bordered textarea-primary border-[1px] border-accent rounded-sm"
                                        name={`employee_question:${questions.id}`}
                                        rows={5}
                                        value={field?.response_text || ""}
                                        onChange={(e) => handleChangeValue(e, questions.question_type || "textarea")}
                                        disabled={submitLoading}
                                      ></textarea>
                                      {questions?.required && !field?.response_text && (
                                        <div className="flex flex-col gap-2 bg-red-50 p-2 rounded-sm">
                                          <p className="font-Noah-Regular text-xs font-bold text-bold text-red-400 inline-flex gap-2 items-start">
                                            This question is required.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CustomerSurveyCard>
                                );
                              }
                              case "text": {
                                return (
                                  <CustomerSurveyCard key={index} animate>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-2">
                                        <h6 className="font-Noah-Regular text-md font-bold text-bold !text-primary inline-flex gap-2 items-start">
                                          {questions?.required && <span className="text-red-500 text-sm">*</span>}
                                          {index + 1}.&nbsp;
                                          {questions.default_title}
                                        </h6>
                                        <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                                      </div>
                                      <input
                                        type="text"
                                        className="input-bordered input-primary border-[1px] border-accent rounded-sm"
                                        name={`employee_question:${questions.id}`}
                                        value={field?.response_text || ""}
                                        onChange={(e) => handleChangeValue(e, questions.question_type || "text")}
                                        disabled={submitLoading}
                                      ></input>
                                      {questions?.required && !field?.response_text && (
                                        <div className="flex flex-col gap-2 bg-red-50 p-2 rounded-sm">
                                          <p className="font-Noah-Regular text-xs font-bold text-bold text-red-400 inline-flex gap-2 items-start">
                                            This question is required.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CustomerSurveyCard>
                                );
                              }
                              case "scale": {
                                const maxScale = questions?.max_scale || 10;
                                const currentValue = Number(field?.response_text) || 0;
                                const isHalfway = currentValue >= maxScale / 2;

                                return (
                                  <CustomerSurveyCard key={index} animate>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-2">
                                        <h6 className="font-Noah-Regular text-md font-bold text-bold !text-primary inline-flex gap-2 items-start">
                                          {questions?.required && <span className="text-red-500 text-sm">*</span>}
                                          {index + 1}.&nbsp;
                                          {questions.default_title}
                                        </h6>
                                        <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                                      </div>
                                      <input
                                        type="range"
                                        style={{
                                          transform: (language === "ar" && "rotate(180deg)") || undefined,
                                          direction: "ltr",
                                        }}
                                        min={0}
                                        max={maxScale}
                                        name={`employee_question:${questions.id}`}
                                        value={currentValue}
                                        onChange={(e) => handleChangeValue(e, questions.question_type || "text")}
                                        className={[
                                          `range range-sm !bg-transparent transition-all duration-100 ease-in-out`,
                                          isHalfway ? "range-primary" : "range-secondary",
                                        ].join(" ")}
                                      />

                                      <div className="flex w-full justify-between px-2 text-xs">
                                        <span
                                          className={[
                                            currentValue === 0 ? "text-primary text-sm" : "text-info text-xs",
                                          ].join(" ")}
                                          key={`range_0`}
                                        >
                                          0
                                        </span>
                                        {[...Array(maxScale)].map((_, i) => (
                                          <span
                                            className={[
                                              currentValue === i + 1 ? "text-primary text-sm" : "text-info text-xs",
                                            ].join(" ")}
                                            key={`range_${i}`}
                                          >
                                            {i + 1}
                                          </span>
                                        ))}
                                      </div>

                                      {questions?.required && !field?.response_text && (
                                        <div className="flex flex-col gap-2 bg-red-50 p-2 rounded-sm">
                                          <p className="font-Noah-Regular text-xs font-bold text-bold text-red-400 inline-flex gap-2 items-start">
                                            This question is required.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CustomerSurveyCard>
                                );
                              }
                              default:
                                return <></>;
                            }
                          })}
                        </div>
                      );
                    })}

                    {questionGroupContent?.show_additional_comments && (
                      <CustomerSurveyCard animate>
                        {/* Comments*/}
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <h6 className="font-Noah-Regular text-xl !text-primary">
                              {t("Any comments or feedback?", language)}
                            </h6>
                            <div className="h-[2px] w-full bg-primary bg-opacity-25" />
                          </div>
                          <textarea
                            placeholder="Please type here..."
                            name="employee_comments"
                            value={feedbackFields.employee_comments}
                            onChange={handleChangeValue}
                            className="textarea textarea-bordered w-full h-48"
                            disabled={submitLoading}
                          />
                        </div>
                      </CustomerSurveyCard>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary w-full text-white shadow-lg"
                      disabled={submitLoading}
                    >
                      Submit&nbsp;{}
                      <span className={`loading loading-spinner loading-md ${!submitLoading ? "hidden" : ""}`} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default EmployeeSurvey;

const defaultFields: EmployeeResponse = {
  anonymousId: undefined,
  department: "",
  department_sub: "",
  questions: [],
  employee_comments: "",
};

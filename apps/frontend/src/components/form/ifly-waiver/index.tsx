import {
  IoMdAdd,
  IoMdCloseCircleOutline,
  IoMdPerson,
  IoMdRemoveCircleOutline,
} from "react-icons/io";
import { FaCheck, FaChild, FaRegIdCard, FaSignature } from "react-icons/fa";
import Signature from "signature_pad";
import { FaPerson, FaPhone } from "react-icons/fa6";
import { LuDot } from "react-icons/lu";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useAxios } from "../../../hooks/use-axios";
import { RxReset } from "react-icons/rx";
import {
  IflyWaiverForm,
  IflyWaiverFormDependent,
  Item,
  Language,
} from "../../../types";
import { axiosPayloadClient } from "../../../utils/config";
import { AxiosError } from "axios";
import ErrorMessage from "../../common/error-message";
import SuccessMessageForm from "../success-message";
import SignaturePad from "signature_pad";
import { addClassToSvgString } from "../../../helpers";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { t } from "../../../utils/contents";
import WaiverFormContainer from "../../common/waiver-form-container";
import WaiverHeader from "../../common/waiver-header";
import WaiverListContainer from "../../common/waiver-list-container";
import moment from "moment";
import { PiKeyReturnFill } from "react-icons/pi";
import { addAnalytics } from "../../../helpers/analytics";

const defaultDependent: IflyWaiverFormDependent = { name: "", qid: "", phone: "" };

const defaultFields: IflyWaiverForm = {
  name: "",
  date: moment(new Date()).format("yyyy-MM-DD"),
  phone: "",
  qid: "",
  dependents: [],
  signature_svg: "",
};

const urlBaseItem = "/api/items?limit=10000&where[name][equals]";

const IFlyWaiver = (): JSX.Element => {
  const { pathname } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [fields, setFields] = useState<IflyWaiverForm>(defaultFields);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [formError, setFormError] = useState("");
  const [formResponse, setFormResponse] = useState("");
  const [formResponseDoc, setFormResponseDoc] = useState<IflyWaiverForm>();
  const [searchParams] = useSearchParams();
  const [signaturePad, setSignaturePad] = useState<SignaturePad>();
  const navigate = useNavigate();
  const [showMoreDependentOptions, setShowMoreDependentOptions] = useState(false);
  const [currentDependentName, setCurrentDependentName] = useState("");

  const {
    data: dataNote,
    error: errorNote,
    loading: loadingNote,
  } = useAxios<any>({
    config: {
      method: "get",
      url: `${urlBaseItem}=dohaquest-ifly-waiver-note`,
    },
    fetchOnLoad: true,
  });

  const {
    data: dataChecklist,
    error: errorChecklist,
    loading: loadingChecklist,
  } = useAxios<any>({
    config: {
      method: "get",
      url: `${urlBaseItem}=dohaquest-ifly-waiver-checklist`,
    },
    fetchOnLoad: true,
  });

  const {
    data: dataTerms,
    error: errorTerms,
    loading: loadingTerms,
  } = useAxios<any>({
    config: {
      method: "get",
      url: `${urlBaseItem}=dohaquest-ifly-waiver-terms`,
    },
    fetchOnLoad: true,
  });

  const notes: Item | undefined = useMemo(() => {
    if (!dataNote && !dataNote?.docs) return undefined;
    return dataNote.docs[0] as Item;
  }, [dataNote]);

  const checklist: Item | undefined = useMemo(() => {
    if (!dataChecklist && !dataChecklist?.docs) return undefined;
    return dataChecklist.docs[0] as Item;
  }, [dataChecklist]);

  const terms: Item | undefined = useMemo(() => {
    if (!dataTerms && !dataTerms?.docs) return undefined;
    return dataTerms.docs[0] as Item;
  }, [dataTerms]);

  useEffect(() => {
    if (errorNote) {
      setFormError(errorNote.message);
    }

    if (errorChecklist) {
      setFormError(errorChecklist.message);
    }

    if (errorTerms) {
      setFormError(errorTerms.message);
    }
  }, [errorNote, errorChecklist, errorTerms]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]);

  useEffect(() => {
    addAnalytics("page_view", pathname);
    readyPad();
    if (searchParams.get("id")) {
      fetchIflyWaiverForm();
    }

    return () => {
      if (signaturePad) {
        signaturePad.off();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (language === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [language]);

  useEffect(() => {
    if (signaturePad) {
      signaturePad.addEventListener("endStroke", handleSignatureEndStroke);
      window.addEventListener("resize", resizeCanvas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signaturePad]);

  const readyPad = () => {
    if (canvasRef.current) {
      // canvasRef.current.getContext("2d")?.scale(1, 1);

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
      canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
      canvasRef?.current?.getContext("2d")?.scale(ratio, ratio);

      const newSignaturePad = new Signature(canvasRef.current, {
        backgroundColor: "rgba(255, 255, 255, 0)",
        penColor: "black",
      });

      setSignaturePad(newSignaturePad);

      // resizeCanvas();
    }
  };

  const fetchIflyWaiverForm = async () => {
    setLoadingSubmit(true);
    const id = searchParams.get("id");
    if (!id) return;

    try {
      const response = await axiosPayloadClient.get(`/api/ifly-waiver-forms/${id}`);

      if (response.status !== 200 && response.status !== 201) {
        throw new AxiosError(
          "Something went wrong while submitting. Please contact administrator.",
        );
      }

      setFormResponse("iFly Waiver form has been submitted");
      setFormResponseDoc(response.data || undefined);
      setStep("success");
    } catch (error) {
      setFormError((error as AxiosError).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const resizeCanvas = () => {
    if (signaturePad) {
      signaturePad.clear();
    }
    // if (canvasRef.current) {
    //   const ratio = Math.max(window.devicePixelRatio || 1, 1);
    //   canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
    //   canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
    //   canvasRef?.current?.getContext("2d")?.scale(ratio, ratio);
    // }
  };

  const handleSignatureEndStroke = () => {
    const svg = signaturePad?.toSVG({ includeBackgroundColor: false }) || "";
    setFields((prevState) => ({ ...prevState, signature_svg: svg }));
  };

  const handleClickAddDependent = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setFields((prevState) => ({
      ...prevState,
      dependents: [...(prevState.dependents || []), defaultDependent],
    }));
  };

  const handleClickRemoveDependent = (
    e: React.FormEvent<HTMLButtonElement>,
    index: number,
  ) => {
    e.preventDefault();
    setFields((prevState) => ({
      ...prevState,
      dependents: prevState?.dependents?.filter((_, dIndex) => dIndex !== index),
    }));
  };

  const handleCurrentNewDependent = () => {
    if (!currentDependentName) return;
    setFields((prev) => {
      return {
        ...prev,
        dependents: [
          ...(prev?.dependents || []),
          {
            name: currentDependentName,
            phone: "",
            qid: "",
          },
        ],
      };
    });
    setCurrentDependentName("");
  };

  const handleChangeDependentFields = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    let { name, value } = e.target;
    name = name.replaceAll("dependent_", "");

    const updatedDependent = fields.dependents?.map((dependent, dIndex) => {
      if (dIndex === index) {
        return {
          ...dependent,
          [name as keyof IflyWaiverFormDependent]: value,
        } as IflyWaiverFormDependent;
      }

      return dependent;
    });

    setFields((prevState) => ({
      ...prevState,
      dependents: updatedDependent,
    }));
  };

  const handleChangeParentFields = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleClickResetSvg = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      if (signaturePad?.isEmpty() || !fields.signature_svg) {
        setFormError("Signature is empty");
        return;
      }

      const hasDependents =
        fields.dependents?.length === 1 &&
        !fields.dependents[0].name &&
        !fields.dependents[0].phone &&
        !fields.dependents[0].qid;

      if (hasDependents) {
        setFields((prevState) => ({ ...prevState, dependents: undefined }));
      }

      const response = await axiosPayloadClient.post(
        "/api/ifly-waiver-forms",
        hasDependents ? { ...fields, dependents: undefined } : fields,
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new AxiosError(
          "Something went wrong while submitting. Please contact administrator.",
        );
      }
      setFormResponse(response.data?.message || "");
      setFormResponseDoc(response.data?.doc || undefined);
      await addAnalytics("form_submission", pathname);
      handleNavigateToFormExisting(response.data?.doc?.id);
    } catch (error) {
      setFormError((error as AxiosError).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleNavigateToFormNew = () => {
    navigate("/dohaquest/ifly-waiver");
    window.location.reload();
  };

  const handleNavigateToFormExisting = (id: string) => {
    navigate("/dohaquest/ifly-waiver?id=" + id);
    window.location.reload();
  };

  const waiverListContainerChecklist = () => {
    return (
      <WaiverListContainer>
        <p className="text-gray-900  text-md font-semibold">
          {t("Checklist", language)}
        </p>
        <ul className="w-full flex flex-col gap-4">
          {loadingChecklist && (
            <span className="loading loading-dots loading-lg !text-primary"></span>
          )}
          {!loadingChecklist &&
            checklist?.items &&
            checklist.items.map((item) => {
              const label = item?.values
                ? item.values.find((i) => i.key === language)?.value
                : "";
              return (
                <li key={item.id} className="w-full flex flex-row gap-2 items-start">
                  <FaCheck className="text-sm text-secondary" />
                  <p className="text-gray-700 w-full text-sm">{label}</p>
                </li>
              );
            })}
        </ul>
      </WaiverListContainer>
    );
  };

  const waiverListContainerNotes = () => {
    return (
      <WaiverListContainer>
        <p className="text-gray-400 w-full text-sm">{t("Notes", language)}</p>
        <ul className="w-full flex flex-col gap-4">
          {loadingNote && (
            <span className="loading loading-dots loading-lg !text-primary"></span>
          )}
          {!loadingNote &&
            notes?.items &&
            notes.items.map((item) => {
              const label = item?.values
                ? item.values.find((i) => i.key === language)?.value
                : "";
              return (
                <li key={item.id} className="w-full flex flex-row gap-2 items-start">
                  <p className="text-gray-700 w-full text-sm leading-loose">
                    {label}
                  </p>
                </li>
              );
            })}
        </ul>
      </WaiverListContainer>
    );
  };

  const waiverListContainerTerms = () => {
    return (
      <WaiverListContainer>
        <p className="text-gray-900 w-full text-md font-semibold">
          {t("Terms and conditions", language)}
        </p>
        <ul className="w-full flex flex-col gap-4">
          {loadingTerms && (
            <span className="loading loading-dots loading-lg !text-primary"></span>
          )}
          {!loadingTerms &&
            terms?.items &&
            terms.items.map((item) => {
              const label = item?.values
                ? item.values.find((i) => i.key === language)?.value
                : "";
              return (
                <li key={item.id} className="w-full flex flex-row gap-1 items-start">
                  <LuDot className="text-4xl text-secondary" />
                  <p className="text-gray-700 w-full text-sm leading-loose">
                    {label}
                  </p>
                </li>
              );
            })}
        </ul>
      </WaiverListContainer>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center gap-4 p-0 px-1 pb-8 max-md:px-4">
      <div className="w-full max-w-3xl p-0 gap-8">
        <WaiverHeader
          questlogoFileName="quest-logo-header.png"
          rideLogoFileName="ifly-logo-header.png"
        />
        <ErrorMessage message={formError} onClose={() => setFormError("")} />
        <div className="join">
          <button
            className={`btn btn-xs join-item ${
              language === "en" ? "btn-primary" : "btn-info btn-outline"
            }`}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>

          <button
            className={`btn btn-xs join-item ${
              language === "ar" ? "btn-primary" : "btn-info btn-outline"
            }`}
            onClick={() => setLanguage("ar")}
          >
            AR
          </button>
        </div>
        {step === "success" && (
          <div className="w-full flex flex-col items-center p-0 overflow-y-auto gap-10 py-4">
            <SuccessMessageForm
              title={t(formResponse, language)}
              subtitle={`${t("Thank you! Your Form ID is:", language)} ${
                formResponseDoc?.id
              }`}
            />

            <button
              className="btn btn-info btn-xs btn-outline uppercase w-full max-w-lg"
              type="submit"
              disabled={loadingSubmit}
              onClick={() => handleNavigateToFormNew()}
            >
              <IoMdAdd className="text-lg" />
              {t("Submit new waiver form", language)}
            </button>

            {waiverListContainerChecklist()}
            {waiverListContainerNotes()}
            {waiverListContainerTerms()}

            <WaiverFormContainer>
              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-4 items-center">
                  <IoMdPerson className="text-gray-300 text-md" />
                  <p className="text-sm text-gray-400">{t("Date", language)}</p>
                </div>
                <p className="text-sm text-gray-800">
                  {moment(formResponseDoc?.date).format("ddd YYYY-MM-DD")}
                </p>
              </div>

              <div className="w-full flex flex-row gap-4 items-center">
                <FaPerson className="text-gray-300 text-md" />
                <p className="text-md font-bold uppercase text-gray-500">
                  {t("YOUR INFORMATION", language)}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-4 items-center">
                  <IoMdPerson className="text-gray-300 text-md" />
                  <p className="text-sm text-gray-400">{t("Name", language)}</p>
                </div>
                <p className="text-sm text-gray-800">{formResponseDoc?.name}</p>
              </div>

              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-4 items-center">
                  <FaRegIdCard className="text-gray-300 text-md" />
                  <p className="text-sm text-gray-400">
                    {t("QID/Passport#", language)}
                  </p>
                </div>
                <p className="text-sm text-gray-800">{formResponseDoc?.qid}</p>
              </div>

              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-4 items-center">
                  <FaPhone className="text-gray-300 text-md" />
                  <p className="text-sm text-gray-400">{t("Phone", language)}</p>
                </div>
                <p className="text-sm text-gray-800">{formResponseDoc?.phone}</p>
              </div>
            </WaiverFormContainer>

            {formResponseDoc?.dependents &&
              formResponseDoc.dependents.length > 0 && (
                <>
                  <div className="divider"></div>
                  <WaiverFormContainer>
                    <div className="w-full flex flex-row gap-4 items-center">
                      <FaChild className="text-gray-300 text-md" />
                      <p className="text-md font-bold uppercase text-gray-500">
                        {t("DEPENDENTS / CHILDREN", language)}
                      </p>
                    </div>

                    <div className="w-full flex flex-col gap-4 items-center">
                      {formResponseDoc.dependents.map((dependent, index) => {
                        return (
                          <>
                            {index > 0 && <div className="divider"></div>}
                            <div className="w-full flex flex-col gap-2">
                              <div className="w-full flex flex-row gap-4 items-center">
                                <IoMdPerson className="text-gray-300 text-md" />
                                <p className="text-sm text-gray-400">
                                  {t("Child's Name", language)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-800">
                                {dependent.name}
                              </p>
                            </div>

                            <div className="w-full flex flex-col gap-2">
                              <div className="w-full flex flex-row gap-4 items-center">
                                <FaPhone className="text-gray-300 text-md" />
                                <p className="text-sm text-gray-400">
                                  {t("Phone", language)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-800">
                                {dependent.phone}
                              </p>
                            </div>
                          </>
                        );
                      })}
                    </div>
                  </WaiverFormContainer>
                </>
              )}

            <div className="divider"></div>

            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex flex-row gap-4 items-center">
                <FaSignature className="text-sm text-gray-400" />
                <p className="text-sm text-gray-400">{t("Signature", language)}</p>
              </div>
              <div
                className="aspect-video w-full h-40 border-2 rounded-md"
                dangerouslySetInnerHTML={{
                  __html: addClassToSvgString(
                    formResponseDoc?.signature_svg || "",
                    "w-full",
                  ),
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
      {step === "form" && (
        <div className="w-full h-full p-0 flex flex-col items-center overflow-y-auto">
          <div className="w-full max-w-2xl h-full flex flex-col p-0 gap-8">
            <h6 className="w-full !text-primary text-md uppercase font-bold min-w-fit">
              {t("ifly waiver of liability", language)}
            </h6>

            {waiverListContainerChecklist()}
            {waiverListContainerNotes()}
            {waiverListContainerTerms()}

            <div className="divider"></div>
            <form
              className="w-full py-2 px-1 flex flex-col gap-16"
              onSubmit={handleSubmit}
            >
              <WaiverFormContainer>
                <label className="form-control w-full">
                  <label className="input flex items-center gap-2">
                    <input
                      type="date"
                      required
                      className="grow"
                      placeholder={t("Date", language)}
                      name="date"
                      value={fields?.date || ""}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">
                      {t("Visit Date", language)}
                    </span>
                  </div>
                </label>

                <div className="w-full flex flex-row gap-4 items-center">
                  <FaPerson className="text-gray-300 text-md" />
                  <p className="text-md font-bold uppercase text-gray-500">
                    {t("YOUR INFORMATION", language)}
                  </p>
                </div>

                <label className="form-control w-full">
                  <label className="input flex items-center gap-2">
                    <input
                      type="text"
                      required
                      className="grow"
                      placeholder={t("Name", language)}
                      name="name"
                      value={fields.name}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                    <IoMdPerson className="text-gray-400" />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">
                      {t("Participant of parent/guardian", language)}
                    </span>
                  </div>
                </label>

                <label className="form-control w-full">
                  <label className="input flex items-center gap-2">
                    <input
                      type="tel"
                      required
                      className="grow rtl:text-right"
                      placeholder={t("QID/Passport#", language)}
                      name="qid"
                      minLength={8}
                      maxLength={13 * 2}
                      value={fields.qid}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                    <FaRegIdCard className="text-gray-400" />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">
                      {t("Your residence permit ID or passport number.", language)}
                    </span>
                  </div>
                </label>

                <label className="form-control w-full">
                  <label className="input  flex items-center gap-2">
                    <input
                      type="tel"
                      pattern="\d*"
                      required
                      className="grow rtl:text-right"
                      placeholder={t("Phone", language)}
                      name="phone"
                      value={fields.phone}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                    <FaPhone className="text-gray-400" />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">
                      {t("ex. 0097411222211, 97411222211 or 11223344", language)}
                    </span>
                  </div>
                </label>
              </WaiverFormContainer>

              <WaiverFormContainer>
                <div className="w-full flex flex-row gap-4 items-center">
                  <FaChild className="text-gray-300 text-md" />
                  <p className="text-md font-bold uppercase text-gray-500">
                    {t("DEPENDENTS / CHILDREN", language)}
                  </p>
                </div>

                <div className="form-control w-fit">
                  <label className="label cursor-pointer">
                    <span className="label-text text-xs mr-1 text-gray-400">
                      Show more options
                    </span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={showMoreDependentOptions}
                      onChange={() => setShowMoreDependentOptions((prev) => !prev)}
                    />
                  </label>
                </div>

                <div className="w-full flex flex-col flex-wrap gap-2 items-start justify-start">
                  <label
                    className={[`form-control`, `min-w-[140px] w-auto`].join(" ")}
                  >
                    <label className="input flex items-center gap-2">
                      <input
                        type="text"
                        className={[`grow rtl:text-right`].join(" ")}
                        placeholder={t("Children name", language)}
                        name="dependent_name_input"
                        disabled={loadingSubmit}
                        value={currentDependentName}
                        onChange={(e) =>
                          setCurrentDependentName(e.currentTarget.value)
                        }
                        onKeyDown={(e) => {
                          const { code } = e;
                          if (code === "Enter") {
                            e.preventDefault();
                            handleCurrentNewDependent();
                          }
                        }}
                      />
                      <PiKeyReturnFill
                        className={[
                          "text-lg transition-all duration-300 ease-in-out",
                          currentDependentName?.length > 0
                            ? "text-primary"
                            : "text-gray-400 pointer-events-none",
                        ].join(" ")}
                        onClick={() => handleCurrentNewDependent()}
                      />
                    </label>

                    <div className="label">
                      <span className="label-text-alt  "></span>
                      <span className="label-text-alt  text-gray-400 text-xs">
                        {t("Press Enter to add", language)}
                      </span>
                    </div>
                  </label>

                  <div className="flex flex-row flex-wrap gap-2">
                    {fields?.dependents &&
                      fields?.dependents?.map((dependent, index) => {
                        return (
                          <div className="badge badge-lg badge-primary gap-2">
                            <p className="text-xs">{dependent?.name || ""}</p>
                            <button
                              className="btn btn-ghost btn-xs btn-circle"
                              onClick={(e) => handleClickRemoveDependent(e, index)}
                            >
                              <IoMdCloseCircleOutline className="text-sm" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <>
                  {showMoreDependentOptions && (
                    <>
                      {fields?.dependents &&
                        fields?.dependents?.map((dependent, index) => {
                          return (
                            <Fragment key={"dependent_" + index}>
                              {index > 0 && (
                                <>
                                  <div className="divider"></div>
                                  <div className="w-full flex flex-row justify-end">
                                    <button
                                      className="btn btn-info btn-outline btn-xs max-w-xs"
                                      onClick={(e) =>
                                        handleClickRemoveDependent(e, index)
                                      }
                                      disabled={loadingSubmit}
                                    >
                                      <IoMdRemoveCircleOutline />
                                      {t("Remove Dependents / Child", language)}
                                    </button>
                                  </div>
                                </>
                              )}

                              <label className="form-control w-full">
                                <label className="input input-sm flex items-center gap-2">
                                  <input
                                    type="text"
                                    className="grow"
                                    placeholder={t("Name", language)}
                                    name="dependent_name"
                                    value={dependent.name}
                                    disabled={loadingSubmit}
                                    onChange={(e) =>
                                      handleChangeDependentFields(e, index)
                                    }
                                  />
                                  <IoMdPerson className="text-gray-400" />
                                </label>

                                <div className="label">
                                  <span className="label-text-alt uppercase text-gray-400">
                                    {t("Child's Name", language)}
                                  </span>
                                </div>
                              </label>

                              <label className="form-control w-full">
                                <label className="input input-sm flex items-center gap-2">
                                  <input
                                    type="tel"
                                    pattern="\d*"
                                    className="grow rtl:text-right"
                                    placeholder={t("Phone", language)}
                                    name="dependent_phone"
                                    value={dependent?.phone || ""}
                                    disabled={loadingSubmit}
                                    onChange={(e) =>
                                      handleChangeDependentFields(e, index)
                                    }
                                  />
                                  <FaPhone className="text-gray-400" />
                                </label>

                                <div className="label">
                                  <span className="label-text-alt uppercase text-gray-400">
                                    {t(
                                      "ex. 0097411222211, 97411222211 or 11223344",
                                      language,
                                    )}
                                  </span>
                                </div>
                              </label>
                            </Fragment>
                          );
                        })}

                      <div className="divider"></div>

                      <button
                        className="btn btn-info btn-outline btn-xs"
                        onClick={handleClickAddDependent}
                        disabled={loadingSubmit}
                      >
                        <IoMdAdd />
                        {t("Add Dependents / Child", language)}
                      </button>
                    </>
                  )}
                </>
              </WaiverFormContainer>

              <WaiverFormContainer>
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="divider py-1">
                    <FaSignature className="text-gray-400 text-6xl" />
                    <p className="label-text-alt uppercase text-gray-400">
                      {t("Signature", language)}
                    </p>
                  </div>

                  <canvas
                    ref={canvasRef}
                    className={`aspect-video w-full h-40 border-2 rounded-md ${
                      loadingSubmit ? "pointer-events-none" : "pointer-events-auto"
                    }`}
                  ></canvas>

                  <button
                    className="btn btn-info btn-xs btn-outline max-w-lg"
                    onClick={handleClickResetSvg}
                    disabled={loadingSubmit}
                  >
                    {t("Clear Signature", language)}
                    <RxReset />
                  </button>
                </div>
              </WaiverFormContainer>

              <p className="text-xs text-center text-gray-400">
                {t(
                  "By submitting this form means you comply and understand above listed checklist, terms and conditions",
                  language,
                )}
              </p>

              <button
                className="btn btn-primary btn-md"
                type="submit"
                disabled={loadingSubmit}
              >
                {loadingSubmit
                  ? t("Submitting...", language)
                  : t("Submit", language)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IFlyWaiver;

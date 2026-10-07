import { IoMdAdd, IoMdPerson, IoMdRemoveCircleOutline } from "react-icons/io";
import { FaChild, FaPlus, FaRegIdCard, FaSignature } from "react-icons/fa";
import Signature from "signature_pad";
import { FaPerson, FaPhone } from "react-icons/fa6";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { RxReset } from "react-icons/rx";
import { Language } from "../../../types";
import { axiosPayloadClient } from "../../../utils/config";
import { AxiosError } from "axios";
import ErrorMessage from "../../common/error-message";
import SignaturePad from "signature_pad";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { t } from "../../../utils/contents";
import WaiverFormContainer from "../../common/waiver-form-container";
import WaiverListContainer from "../../common/waiver-list-container";
import moment from "moment";
import { Media, SkiWaiverContent, SkiWaiverForm, SkiWaiverFormDependent } from "../../../types/payload-types";
import { serializeSlate } from "../../../utils/serialize-slate";
import { BACKEND_URL } from "../../../utils/constants";
import { useLivePreview } from "@payloadcms/live-preview-react";
import SkiWaiverView from "./view";
import { addAnalytics } from "../../../helpers/analytics";

type SkiWaiverFormWithOutId = Omit<SkiWaiverForm, "id" | "createdAt" | "updatedAt" | "birth_date">;

const frontEndPath = `ski-waiver`;
const apiFormsPath = `ski-waiver-forms`;

const defaultDependent: SkiWaiverFormDependent = [
  {
    name: "",
    qid: "",
    age: 0,
  },
];

const defaultFields: SkiWaiverFormWithOutId = {
  name: "",
  date: moment(new Date()).format("yyyy-MM-DD"),
  phone: "",
  qid: "",
  dependents: [],
  signature_svg: "",
  age: 0,
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

interface SkiWaiverProps {
  initialContent: {
    data: SkiWaiverContent;
    error?: string | null;
    loading: boolean;
    fetch: (q?: string | undefined) => Promise<SkiWaiverContent | undefined>;
  };
  initialLanguage: Language;
  isPreview: boolean;
}

const SkiWaiver = ({ initialContent, initialLanguage, isPreview }: SkiWaiverProps): JSX.Element => {
  const { pathname } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [language, setLanguage] = useState<Language>(initialLanguage);

  const [fields, setFields] = useState<SkiWaiverFormWithOutId>(defaultFields);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [formError, setFormError] = useState("");
  const [formResponse, setFormResponse] = useState("");
  const [formResponseDoc, setFormResponseDoc] = useState<SkiWaiverForm>();
  const [searchParams] = useSearchParams();
  const [signaturePad, setSignaturePad] = useState<SignaturePad>();
  const navigate = useNavigate();

  const {
    data: _contentsData,
    // error: contentsError,
    loading: contentsLoading,
  } = initialContent;

  const language = initialLanguage;

  const { data: contentsData, isLoading } = useLivePreview({
    initialData: _contentsData as SkiWaiverContent,
    serverURL: BACKEND_URL,
    apiRoute: "/payload/api",
    depth: 2,
  });

  useEffect(() => {
    addAnalytics("page_view", pathname);
    readyPad();
    if (searchParams.get("id")) {
      fetchForm();
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

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
  }, [fields]);

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

  const fetchForm = async () => {
    setLoadingSubmit(true);
    const id = searchParams.get("id");
    if (!id) return;

    try {
      const response = await axiosPayloadClient.get(`/api/${apiFormsPath}/${id}`);

      if (response.status !== 200 && response.status !== 201) {
        throw new AxiosError("Something went wrong while submitting. Please contact administrator.");
      }

      setFormResponse("Ski Waiver form has been submitted");
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
      dependents: [...(prevState.dependents || []), ...defaultDependent],
    }));
  };

  const handleClickRemoveDependent = (e: React.FormEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    setFields((prevState) => ({
      ...prevState,
      dependents: prevState?.dependents?.filter((_, dIndex) => dIndex !== index),
    }));
  };

  const handleChangeDependentFields = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let { name, value } = e.target;
    name = name.replaceAll("dependent_", "");

    const updatedDependent: SkiWaiverFormDependent | undefined = fields.dependents?.map((dependent, dIndex) => {
      if (dIndex === index) {
        return {
          ...dependent,
          [name as keyof SkiWaiverFormDependent]: value,
        };
      }

      return dependent;
    });

    setFields((prevState) => ({
      ...prevState,
      dependents: updatedDependent,
    }));
  };

  const handleChangeParentFields = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
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

      // if (!fields?.packages || !fields?.consent_media_appearance) {
      //   setFormError("Please select packages and consent media appearance.");
      //   return;
      // }

      const hasDependents = fields.dependents?.length === 1 && !fields.dependents[0].name && !fields.dependents[0].qid;

      if (hasDependents) {
        setFields((prevState) => ({ ...prevState, dependents: undefined }));
      }

      const response = await axiosPayloadClient.post(
        `/api/${apiFormsPath}`,
        hasDependents ? { ...fields, dependents: undefined } : fields,
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new AxiosError("Something went wrong while submitting. Please contact administrator.");
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

  const handleNavigateToFormExisting = (id: string) => {
    navigate(`/dohaquest/${frontEndPath}?id=${id}`);
    window.location.reload();
  };

  const primaryImg = contentsData?.primary_logo as Media;
  const secondaryImg = contentsData?.secondary_logo as Media;
  const contentReady = contentsLoading || isLoading;

  return (
    <div
      className="w-screen h-screen flex flex-col items-center gap-4 p-0 px-1 pb-8 max-md:px-4"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-3xl p-0 gap-8">
        <header className="w-full py-4 flex flex-row items-center justify-between max-md:py-1">
          {primaryImg && (
            <img
              src={primaryImg?.url || ""}
              alt={primaryImg?.filename || "Primary Logo"}
              className="w-24 h-auto object-contain flex max-md:w-16"
            />
          )}
          {secondaryImg && (
            <img
              src={secondaryImg?.url || ""}
              alt={secondaryImg?.filename || "Secondary Logo"}
              className="w-24 h-auto object-contain flex max-md:w-16"
            />
          )}
        </header>
        <ErrorMessage message={formError} onClose={() => setFormError("")} />
        <div className="join">
          <a
            className={`btn btn-xs join-item ${language === "en" ? "btn-primary" : "btn-info btn-outline"}`}
            href={`/dohaquest/${frontEndPath}?lang=en`}
          >
            EN
          </a>

          <a
            className={`btn btn-xs join-item ${language === "ar" ? "btn-primary" : "btn-info btn-outline"}`}
            href={`/dohaquest/${frontEndPath}?lang=ar`}
          >
            AR
          </a>
        </div>
        {step === "success" && (
          <SkiWaiverView
            formResponseDoc={formResponseDoc}
            language={language}
            formResponse={formResponse}
            submitLoading={loadingSubmit}
            contentsData={contentsData}
            contentsLoading={contentsLoading}
          />
        )}
      </div>
      {step === "form" && (
        <div className="w-full h-full p-0 flex flex-col items-center overflow-y-auto">
          <div className="w-full max-w-3xl h-full flex flex-col p-0 gap-8">
            <h6 className="w-full !text-primary text-md uppercase font-bold min-w-fit">
              {contentsData?.title || t("Waiver Form", language)}
            </h6>

            {contentReady && <span className="loading loading-dots loading-lg !text-primary"></span>}
            {!contentReady &&
              contentsData?.details?.map((d, idx) => (
                <>
                  <WaiverListContainer key={"details_" + idx}>
                    <h6 className="text-gray-900  text-md font-semibold">{d?.title}</h6>
                    <div className="text-gray-500 leading-loose text-sm max-md:text-xs [&_div]:h-2">
                      {serializeSlate(d?.description)?.map((s, idx) => (
                        <Fragment key={"description_" + idx}>{s}</Fragment>
                      ))}
                    </div>
                  </WaiverListContainer>
                </>
              ))}

            <div className="divider"></div>
            <form
              className={`w-full py-2 px-1 flex flex-col gap-16 ${
                loadingSubmit ? "pointer-events-none opacity-50" : ""
              }`}
              onSubmit={handleSubmit}
            >
              <WaiverFormContainer>
                <h6 className="text-gray-900  text-md font-semibold mb-6">
                  {t("Fill Out the Details Below:", language)}
                </h6>

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
                    <span className="label-text-alt uppercase text-gray-400">{t("Visit Date", language)}</span>
                  </div>
                </label>

                <div className="w-full flex flex-row gap-4 items-center">
                  <FaPerson className="text-gray-300 text-md" />
                  <p className="text-md font-bold uppercase text-gray-500">
                    {t("YOURS / GUARDIAN or PARENT INFORMATION", language)}
                  </p>
                </div>

                <label className="form-control w-full">
                  <label className="input flex items-center gap-2">
                    <input
                      type="number"
                      required
                      className="grow"
                      placeholder={t("Age", language)}
                      name="age"
                      value={fields?.age || ""}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">{t("Age", language)}</span>
                  </div>
                </label>

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

                <div className="divider"></div>

                <label className="form-control w-full">
                  <label className="input flex items-center gap-2">
                    <input
                      type="text"
                      required
                      className="grow"
                      placeholder={t("Emergency Contact's Name", language)}
                      name="emergency_contact_name"
                      value={fields.emergency_contact_name}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                    <IoMdPerson className="text-gray-400" />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">
                      {t("ex. John Doe, Jane Doe, NA if None", language)}
                    </span>
                  </div>
                </label>

                <label className="form-control w-full">
                  <label className="input flex items-center gap-2">
                    <input
                      type="text"
                      required
                      className="grow"
                      placeholder={t("Emergency Contact's Phone", language)}
                      name="emergency_contact_phone"
                      value={fields.emergency_contact_phone}
                      onChange={handleChangeParentFields}
                      disabled={loadingSubmit}
                    />
                    <FaPhone className="text-gray-400" />
                  </label>

                  <div className="label">
                    <span className="label-text-alt uppercase text-gray-400">
                      {t("ex. 0097411222211, 97411222211 or 11223344, NA if None", language)}
                    </span>
                  </div>
                </label>
              </WaiverFormContainer>

              <WaiverFormContainer>
                <div className="w-full flex flex-row gap-4 items-center">
                  <FaChild className="text-gray-300 text-md" />
                  <p className="text-md font-bold uppercase text-gray-500">{t("DEPENDENTS / CHILDREN", language)}</p>
                </div>
                <p className="text-xs font-bold text-gray-400">
                  {t("Ages under 18 are considered as Dependents/Children", language)}
                </p>

                <>
                  {fields?.dependents &&
                    fields?.dependents?.map((dependent, index) => {
                      return (
                        <Fragment key={"dependent_" + index}>
                          {fields?.dependents && fields?.dependents?.length > 0 && (
                            <>
                              <div className="divider"></div>
                              <div className="w-full flex flex-row justify-end">
                                <button
                                  className="btn btn-info btn-outline btn-xs max-w-xs"
                                  onClick={(e) => handleClickRemoveDependent(e, index)}
                                  disabled={loadingSubmit}
                                >
                                  <IoMdRemoveCircleOutline />
                                  {t("Remove Dependents / Child", language)}
                                </button>
                              </div>
                            </>
                          )}

                          <label className="form-control w-full">
                            <label className="input  flex items-center gap-2">
                              <input
                                type="text"
                                className="grow"
                                required
                                placeholder={t("Name", language)}
                                name="dependent_name"
                                value={dependent.name}
                                disabled={loadingSubmit}
                                onChange={(e) => handleChangeDependentFields(e, index)}
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
                            <label className="input flex items-center gap-2">
                              <input
                                type="number"
                                required
                                className="grow"
                                placeholder={t("Age", language)}
                                name="age"
                                value={dependent?.age || ""}
                                onChange={(e) => handleChangeDependentFields(e, index)}
                                disabled={loadingSubmit}
                              />
                            </label>

                            <div className="label">
                              <span className="label-text-alt uppercase text-gray-400">{t("Age", language)}</span>
                            </div>
                          </label>

                          <label className="form-control w-full">
                            <label className="input  flex items-center gap-2">
                              <input
                                type="text"
                                className="grow rtl:text-right"
                                placeholder={t("Medical Conditions", language)}
                                name="medical_conditions"
                                value={dependent?.medical_conditions || ""}
                                disabled={loadingSubmit}
                                onChange={(e) => handleChangeDependentFields(e, index)}
                              />
                              <FaPlus className="text-gray-400" />
                            </label>

                            <div className="label">
                              <span className="label-text-alt uppercase text-gray-400">
                                {t("ex. Asthma, Diabetes or Allergies (e.g., peanut allergy)", language)}
                              </span>
                            </div>
                          </label>
                        </Fragment>
                      );
                    })}
                </>

                <button
                  className="btn btn-info btn-outline btn-sm"
                  onClick={handleClickAddDependent}
                  disabled={loadingSubmit}
                >
                  <IoMdAdd />
                  {t("Add Dependents / Child", language)}
                </button>
              </WaiverFormContainer>

              {/* <WaiverFormContainer>
                <div className="divider"></div>
                <RadioGroup
                  direction="flex-col"
                  fullWidth
                  value={fields?.packages || ""}
                  label={
                    <label className="text-sm text-gray-500 font-bold">{t("Please select a package", language)}</label>
                  }
                  name="packages"
                  unChecked={{ className: "border-gray-500" }}
                  onChangeV2={(value) =>
                    setFields((p) => ({
                      ...p,
                      packages: value as keyof RollerSkatingWaiverForm["packages"],
                    }))
                  }
                  items={ROLLER_SKATING_PACKAGES_ITEMS(language)}
                />

                <RadioGroup
                  direction="flex-row"
                  fullWidth
                  value={fields?.consent_media_appearance || ""}
                  label={
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-500 font-bold">{t("Photo/Video Permission", language)}</label>
                      <p className="text-xs text-gray-400 leading-loose">
                        {t(
                          "If “No” is selected, Quest will make reasonable efforts to avoid directed recording; however, incidental appearance in background/crowd imagery may still occur.",
                          language,
                        )}
                      </p>
                    </div>
                  }
                  name="consent_media_appearance"
                  unChecked={{ className: "border-gray-500 border" }}
                  onChangeV2={(value) =>
                    setFields((p) => ({
                      ...p,
                      consent_media_appearance: value as keyof RollerSkatingWaiverForm["consent_media_appearance"],
                    }))
                  }
                  items={ROLLER_SKATING_CONSENT_MEDIA_APPEARANCE_ITEMS(language)}
                />
              </WaiverFormContainer> */}

              <WaiverFormContainer>
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="divider py-1">
                    <FaSignature className="text-gray-400 text-6xl" />
                    <p className="label-text-alt uppercase text-gray-400">{t("Signature", language)}</p>
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

              <button className="btn btn-primary btn-md" type="submit" disabled={loadingSubmit || isPreview}>
                {loadingSubmit ? t("Submitting...", language) : t("Submit", language)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkiWaiver;

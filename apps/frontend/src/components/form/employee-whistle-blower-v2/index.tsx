import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Departments,
  EmployeeWhistleBlowerV2WithoutId,
  FileWithPayloadID,
  MediaInternal,
  Operator,
} from "../../../types";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";
import SuccessMessageForm from "../success-message";
import { GiWhistle } from "react-icons/gi";
import Captcha from "../../common/captcha";
import useCaptcha from "../../../hooks/use-captcha";

import { validateFields } from "../../../helpers/validation";
import { useAxios } from "../../../hooks/use-axios";
import { fileSizeToString } from "../../../helpers";
import { addAnalytics } from "../../../helpers/analytics";

const defaultFields: EmployeeWhistleBlowerV2WithoutId = {};

const EmployeeWhistleBlowerFormV2 = () => {
  const { pathname } = useLocation();
  const [step, setStep] = useState<"customer" | "success">("customer");
  const [feedbackFields, setFeedbackFields] =
    useState<EmployeeWhistleBlowerV2WithoutId>(defaultFields);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [captchaUser, setCaptchaUser] = useState("");

  const {
    data: departmentData,
    loading: departmentLoading,
    refetch: departmentRefetch,
  } = useAxios<any>({
    config: {
      url: `/api/department`,
      method: "get",
    },
    fetchOnLoad: true,
  });

  const {
    data: operatorData,
    loading: operatorLoading,
    refetch: operatorRefetch,
  } = useAxios<any>({
    config: {
      url: `/api/operators-new?limit=0&sort=name`,
      method: "get",
    },
    fetchOnLoad: true,
  });

  const [files, setFiles] = useState<FileWithPayloadID[]>([]);

  const { captcha, generateCaptcha } = useCaptcha();

  const departments: Departments[] = useMemo(() => {
    if (departmentData && !departmentLoading) {
      return departmentData.docs as Departments[];
    }
    return [];
  }, [departmentData, departmentLoading]);

  const operators: Operator[] = useMemo(() => {
    if (operatorData && !operatorLoading) {
      return operatorData.docs as Operator[];
    }
    return [];
  }, [operatorData, operatorLoading]);

  useEffect(() => {
    addAnalytics("page_view", pathname);
    generateCaptcha();
    departmentRefetch();
    operatorRefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      const maxSize = 3 * 1024 * 1024; // 2MB in bytes

      const validFiles = selectedFiles.filter((file) => file.size <= maxSize);

      if (validFiles.length !== selectedFiles.length) {
        setFormError("Some files exceed the 2MB limit and will not be uploaded.");
      }

      setFiles(validFiles);
    }
  };

  const handleChangeValue = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) => {
    let { value, name } = e.target;

    if (name.includes(":")) {
      const parentName = name.split(
        ":",
      )[0] as keyof EmployeeWhistleBlowerV2WithoutId;
      const childName = name.split(":")[1];

      if (name.includes("department") && !name.includes("department_text")) {
        value =
          departments.find((d) => {
            return String(d.id) === value || "";
          })?.id || "";
      }

      if (name.includes("operator")) {
        value =
          operators.find((d) => {
            return String(d.id) === value || "";
          })?.id || "";
      }

      setFeedbackFields((prevState) => {
        const parentValue = prevState[parentName];
        return {
          ...prevState,
          [parentName]: {
            ...(typeof parentValue === "object" && parentValue !== null
              ? parentValue
              : {}),
            [childName]: value,
          },
        };
      });
    } else {
      setFeedbackFields((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const form = e.target as HTMLFormElement;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const validateResponse = validateFields(
      "employee-whistle-blower-v2",
      feedbackFields,
    );

    if (Object.keys(validateResponse).length > 0) {
      setFormError("Some required fields are not filled. Please check.");
    }

    try {
      if (captchaUser !== captcha) {
        generateCaptcha();
        throw new Error("Invalid captcha.");
      }
      const responseUpload = await uploadSelectedFiles();
      setSubmitLoading(true);

      const response = await axiosPayloadClient.post(
        `/api/employee-whistle-blower-v2`,
        {
          ...feedbackFields,
          details: {
            ...feedbackFields.details,
          },
          supporting_docs: responseUpload.map((f) => ({
            media_internal: f?.id,
          })),
        },
      );

      if (response.status !== 201) {
        throw Error(
          "Something went wrong while submitting your form. Please contact admin.",
        );
      }
      setStep("success");
      await addAnalytics("form_submission", pathname);
      resetForm();
    } catch (error) {
      setFormError((error as Error)?.message || "Unknown error");
      setStep("customer");
    } finally {
      setSubmitLoading(false);
    }
  };

  const uploadSelectedFiles = async (): Promise<(MediaInternal | undefined)[]> => {
    const response = await Promise.all(
      files.map(async (f) => {
        const formData = new FormData();
        formData.append("file", f);
        const response = await axiosPayloadClient({
          method: "POST",
          data: formData,
          url: "/api/media-internal",
        });

        const mediaResponse: MediaInternal | undefined = response.data?.doc
          ? (response.data.doc as MediaInternal)
          : undefined;

        return mediaResponse;
      }),
    );

    return response;
  };

  const resetForm = () => {
    setFeedbackFields(defaultFields);
    generateCaptcha();
    setCaptchaUser("");
  };

  return (
    <>
      <div className="w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-4 px-12 max-md:py-4 p-8 flex flex-col flex-1 items-center relative">
        <ErrorMessage message={formError} onClose={() => setFormError("")} />
        {step === "success" && <SuccessMessageForm />}
        {step !== "success" && (
          <form
            className="w-full max-w-6xl flex flex-col gap-4 max-md:gap-8"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h6 className="font-Noah-Regular text-2xl !text-primary inline-flex gap-2 items-center">
                  Report a concern
                </h6>

                <p className="font-Poppins font-extralight text-sm !text-gray-400 inline-flex gap-2 items-center leading-loose">
                  At Doha Oasis, we value integrity and transparency. If you see or
                  experience any unethical or improper behavior, we encourage you to
                  report it through this portal.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h6 className="font-Noah-Regular text-md !text-primary inline-flex gap-2 items-center">
                  How to report?
                </h6>
                <p className="font-Poppins font-extralight text-sm !text-gray-400 inline-flex gap-2 items-center leading-loose">
                  Fill the information below. Then click on Submit.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h6 className="font-Noah-Regular text-md !text-primary inline-flex gap-2 items-center">
                  Anonymity and Confidentiality
                </h6>
                <p className="font-Poppins font-extralight text-sm !text-gray-400 inline-flex gap-2 items-center leading-loose">
                  All reports are confidential and will be handled discreetly.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="collapse collapse-arrow rounded-sm">
                <input type="checkbox" defaultChecked />

                <h6 className="font-Noah-Regular collapse-title text-lg !text-primary inline-flex gap-2 items-center border-0 border-b-[1px] border-solid border-gray-100">
                  Contact Information
                </h6>

                <div className="font-Poppins font-extralight collapse-content w-full grid grid-cols-2 max-md:grid-cols-1 gap-4 py-4 max-md:px-0 place-items-center">
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="contact_info:name"
                      className="grow"
                      placeholder="Name"
                      value={feedbackFields.contact_info?.name || ""}
                      onChange={handleChangeValue}
                    />
                  </label>
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="contact_info:designation"
                      className="grow"
                      placeholder="Designation"
                      value={feedbackFields.contact_info?.designation || ""}
                      onChange={handleChangeValue}
                    />
                  </label>

                  <label className="form-control w-full max-w-lg">
                    {/* InsertIcon */}

                    <input
                      type="text"
                      name="contact_info:department_text"
                      className="input input-md max-md:input-md input-primary input-bordered rounded-full flex items-center gap-2"
                      placeholder="Department"
                      value={feedbackFields.contact_info?.department_text || ""}
                      onChange={handleChangeValue}
                    />
                    <div className="label">
                      <span className="label-text-alt text-gray-500">
                        eg. Human Resource, Information Technology, Finance, etc...
                      </span>
                    </div>
                  </label>

                  {/* <select
                    className="select select-md max-md:select-md select-primary select-bordered rounded-full w-full max-w-lg"
                    name="contact_info:department"
                    onChange={handleChangeValue}
                    defaultValue={-1}
                  >
                    <option value={-1} disabled>
                      Select Department
                    </option>
                    {departments.length > 0 ? (
                      departments.map((d, index) => (
                        <option
                          value={d.id}
                          key={"contact_info:department" + index + 1}
                        >
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <></>
                    )}
                  </select> */}

                  <label className="form-control w-full max-w-lg">
                    <select
                      className="select select-md max-md:select-md select-primary select-bordered rounded-full w-full"
                      name="contact_info:operator"
                      onChange={handleChangeValue}
                      defaultValue={-1}
                    >
                      <option value={-1} disabled>
                        Select Operator
                      </option>
                      {operators.length > 0 ? (
                        operators.map((o, index) => (
                          <option
                            value={o.id}
                            key={"contact_info:operator" + index + 1}
                          >
                            {o.name}
                          </option>
                        ))
                      ) : (
                        <></>
                      )}
                    </select>
                    <div className="label">
                      <span className="label-text-alt">&nbsp;</span>
                    </div>
                  </label>

                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="contact_info:phone"
                      className="grow"
                      placeholder="Phone"
                      value={feedbackFields.contact_info?.phone || ""}
                      onChange={handleChangeValue}
                    />
                  </label>
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="contact_info:email"
                      className="grow"
                      placeholder="Email"
                      value={feedbackFields.contact_info?.email || ""}
                      onChange={handleChangeValue}
                    />
                  </label>
                </div>
              </div>
              {/* Subject */}
              {/* <div className="collapse collapse-arrow rounded-sm">
                <input type="checkbox" defaultChecked />
                <h6 className="font-Noah-Regular collapse-title text-lg !text-primary inline-flex gap-2 items-center border-0 border-b-[1px] border-solid border-gray-100">
                  Subject Info<span className="text-red-600">*</span>
                </h6>
                <div className="font-Poppins font-extralight collapse-content w-full grid grid-cols-2 max-md:grid-cols-1 gap-4 py-4 max-md:px-0 place-items-center">
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    
                    <input
                      type="text"
                      className="grow"
                      placeholder="Name"
                      name="subject_info:name"
                      value={feedbackFields.subject_info?.name || ""}
                      required
                      onChange={handleChangeValue}
                    />
                  </label>
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    
                    <input
                      type="text"
                      className="grow"
                      name="subject_info:designation"
                      placeholder="Designation"
                      value={feedbackFields.subject_info?.designation || ""}
                      required
                      onChange={handleChangeValue}
                    />
                  </label>
                  <select
                    className="select select-md max-md:select-md select-primary select-bordered rounded-full w-full max-w-lg"
                    name="subject_info:department"
                    onChange={handleChangeValue}
                    defaultValue={-1}
                  >
                    <option value={-1} disabled>
                      Select Department
                    </option>
                    {departments.length > 0 ? (
                      departments.map((d, index) => (
                        <option
                          value={d.id}
                          key={"subject_info:department" + index + 1}
                        >
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <></>
                    )}
                  </select>
                  <select
                    className="select select-md max-md:select-md select-primary select-bordered rounded-full w-full max-w-lg"
                    name="subject_info:operator"
                    onChange={handleChangeValue}
                    defaultValue={-1}
                  >
                    <option value={-1} disabled>
                      Select Operator
                    </option>
                    {operators.length > 0 ? (
                      operators.map((o, index) => (
                        <option
                          value={o.id}
                          key={"subject_info:operator" + index + 1}
                        >
                          {o.name}
                        </option>
                      ))
                    ) : (
                      <></>
                    )}
                  </select>
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    
                    <input
                      type="text"
                      className="grow"
                      placeholder="Phone"
                      name="subject_info:phone"
                      value={feedbackFields.subject_info?.phone || ""}
                      required
                      onChange={handleChangeValue}
                    />
                  </label>
                  <label className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-lg flex items-center gap-2">
                    
                    <input
                      type="text"
                      className="grow"
                      placeholder="Email"
                      name="subject_info:email"
                      value={feedbackFields.subject_info?.email || ""}
                      required
                      onChange={handleChangeValue}
                    />
                  </label>
                </div>
              </div> */}
              <div className="collapse collapse-arrow rounded-sm">
                <input type="checkbox" defaultChecked />
                <h6 className="font-Noah-Regular collapse-title text-lg !text-primary inline-flex gap-2 items-center border-0 border-b-[1px] border-solid border-gray-100">
                  Details
                </h6>

                <div className="font-Poppins font-extralight collapse-content w-full grid grid-cols-1 max-md:grid-cols-1 gap-4 py-4 max-md:px-0 place-items-center">
                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Report a concern or incident?
                        <span className="text-red-500">*</span>
                      </span>
                    </div>
                    <textarea
                      required
                      className="textarea textarea-primary textarea-bordered h-48"
                      placeholder="Please describe..."
                      name="details:incident_or_concern"
                      value={feedbackFields.details?.incident_or_concern || ""}
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <div className="flex flex-col w-full gap-4">
                    <label className="form-control w-full max-w-lg">
                      <div className="label">
                        <span className="label-text text-info text-sm">
                          Supporting documents{" "}
                          <span className="text-xs">(3mb max per file.)</span>
                        </span>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="file-input file-input-bordered w-full"
                        onChange={handleFileChange}
                        name="supporting_docs"
                      />
                    </label>

                    {files && files.length > 0 && (
                      <>
                        <p className="text-sm text-info">Files</p>
                        <div className="flex flex-col gap-1">
                          {files.map((f, index) => {
                            return (
                              <p
                                key={"files-" + index}
                                className="text-sm text-info"
                              >
                                {f.name} -{" "}
                                <span className="text-xs italic">
                                  {fileSizeToString(f.size)}
                                </span>
                              </p>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-row flex-wrap gap-4 items-center justify-center">
                <input
                  type="text"
                  className="input input-md max-md:input-md input-primary input-bordered rounded-full w-full max-w-sm"
                  placeholder="Enter Captcha"
                  name="captcha"
                  value={captchaUser}
                  onChange={(e) => setCaptchaUser(e.target.value)}
                />
                <Captcha captcha={captcha} generateCaptcha={generateCaptcha} />

                <div className="form-control">
                  <label className="label cursor-pointer gap-4">
                    <input
                      type="checkbox"
                      checked={feedbackFields?.acknowledgement || false}
                      name="acknowledgement"
                      className="checkbox checkbox-primary"
                      onChange={(e) =>
                        setFeedbackFields((prevState) => ({
                          ...prevState,
                          acknowledgement: e.target.checked,
                        }))
                      }
                    />
                    <span className="label-text font-Poppins font-extralight">
                      I confirm that the information provided above is accurate to
                      the best of my knowledge.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="font-Noah-Regular btn btn-primary w-full text-white shadow-lg"
                  disabled={submitLoading || !feedbackFields?.acknowledgement}
                >
                  <GiWhistle className="text-2xl" />
                  Submit&nbsp;{}
                  <span
                    className={`loading loading-spinner loading-md ${
                      !submitLoading ? "hidden" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default EmployeeWhistleBlowerFormV2;

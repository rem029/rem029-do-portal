import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Departments,
  EmployeeWhistleBlower,
  FileWithPayloadID,
  MediaInternal,
} from "../../../types";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";
import SuccessMessageForm from "../success-message";
import { GiWhistle } from "react-icons/gi";
import Captcha from "../../common/captcha";
import useCaptcha from "../../../hooks/use-captcha";
import { fileSizeToString } from "../../../helpers";
import { validateFields } from "../../../helpers/validation";
import { useAxios } from "../../../hooks/use-axios";
import { addAnalytics } from "../../../helpers/analytics";

const defaultFields: EmployeeWhistleBlower = {};

const EmployeeWhistleBlowerForm = () => {
  const { pathname } = useLocation();
  const [step, setStep] = useState<"customer" | "success">("customer");
  const [feedbackFields, setFeedbackFields] =
    useState<EmployeeWhistleBlower>(defaultFields);
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

  const [files, setFiles] = useState<FileWithPayloadID[]>([]);

  const { captcha, generateCaptcha } = useCaptcha();

  const departments: Departments[] = useMemo(() => {
    if (departmentData && !departmentLoading) {
      return departmentData.docs as Departments[];
    }
    return [];
  }, [departmentData, departmentLoading]);

  useEffect(() => {
    addAnalytics("page_view", pathname);
    generateCaptcha();
    departmentRefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(Array.from(event.target.files));
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
      const parentName = name.split(":")[0] as keyof EmployeeWhistleBlower;
      const childName = name.split(":")[1];

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
      "employee-whistle-blower",
      feedbackFields as any,
    );

    if (Object.keys(validateResponse).length > 0) {
      setFormError("Some required fields are not filled. Please check.");
    }

    try {
      if (captchaUser !== captcha) {
        throw new Error("Invalid captcha.");
      }
      const responseUpload = await uploadSelectedFiles();
      setSubmitLoading(true);

      const response = await axiosPayloadClient.post(
        `/api/employee-whistle-blower`,
        {
          ...feedbackFields,
          details: {
            ...feedbackFields.details,
            supporting_docs: responseUpload.map((f) => ({
              media_internal: f?.id,
            })),
          },
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
            className="w-full max-w-7xl flex flex-col gap-4 max-md:gap-8"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h6 className="text-2xl font-bold !text-primary inline-flex gap-2 items-center">
                  Report a concern
                </h6>

                <p className="text-sm !text-gray-400 inline-flex gap-2 items-center leading-loose">
                  At Doha Oasis, we value integrity and transparency. If you see or
                  experience any unethical or improper behavior, we encourage you to
                  report it through this portal.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h6 className="text-md !text-primary inline-flex gap-2 items-center">
                  How to report?
                </h6>
                <p className="text-sm !text-gray-400 inline-flex gap-2 items-center leading-loose">
                  Fill the information below. Then click on Submit.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h6 className="text-md !text-primary inline-flex gap-2 items-center">
                  Anonymity and Confidentiality
                </h6>
                <p className="text-sm !text-gray-400 inline-flex gap-2 items-center leading-loose">
                  All reports are confidential and will be handled discreetly.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="collapse collapse-arrow rounded-none ">
                <input type="checkbox" defaultChecked />

                <h6 className="collapse-title text-md !text-primary inline-flex gap-2 items-center">
                  Contact Information
                </h6>

                <div className="collapse-content flex flex-row flex-wrap gap-4 justify-between max-w-6xl">
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
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
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
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
                  <select
                    className="select select-bordered w-full max-w-lg"
                    value={
                      feedbackFields.contact_info?.department || "Select Department"
                    }
                    name="contact_info:department"
                    onChange={handleChangeValue}
                  >
                    <option disabled>Select Department</option>
                    {departments.length > 0 ? (
                      departments.map((d, index) => (
                        <option key={"contact_info:department" + index + 1}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <></>
                    )}
                  </select>
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
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
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
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

                <div className="divider opacity-50"></div>
              </div>

              <div className="collapse collapse-arrow">
                <input type="checkbox" defaultChecked />
                <h6 className="collapse-title text-md !text-primary inline-flex gap-2 items-center">
                  Subject Info<span className="text-red-600">*</span>
                </h6>
                <div className="collapse-content flex flex-row flex-wrap gap-4 justify-between max-w-6xl">
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
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
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
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
                    className="select select-bordered w-full max-w-lg"
                    value={
                      feedbackFields.subject_info?.department || "Select Department"
                    }
                    name="subject_info:department"
                    onChange={handleChangeValue}
                  >
                    <option disabled>Select Department</option>
                    {departments.length > 0 ? (
                      departments.map((d, index) => (
                        <option key={"subject_info:department" + index + 1}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <></>
                    )}
                  </select>
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
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
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
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

                <div className="divider opacity-50"></div>
              </div>

              <div className="collapse collapse-arrow">
                <input type="checkbox" defaultChecked />
                <h6 className="collapse-title text-md !text-primary inline-flex gap-2 items-center">
                  Witness Info
                </h6>
                <div className="collapse-content flex flex-row flex-wrap gap-4 justify-between max-w-6xl">
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="witness_info:name"
                      value={feedbackFields.witness_info?.name || ""}
                      className="grow"
                      placeholder="Name"
                      onChange={handleChangeValue}
                    />
                  </label>
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="witness_info:designation"
                      value={feedbackFields.witness_info?.designation || ""}
                      className="grow"
                      placeholder="Designation"
                      onChange={handleChangeValue}
                    />
                  </label>
                  <select
                    className="select select-bordered w-full max-w-lg"
                    value={
                      feedbackFields.witness_info?.department || "Select Department"
                    }
                    name="witness_info:department"
                    onChange={handleChangeValue}
                  >
                    <option disabled>Select Department</option>
                    {departments.length > 0 ? (
                      departments.map((d, index) => (
                        <option key={"witness_info:department" + index + 1}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <></>
                    )}
                  </select>
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="witness_info:phone"
                      value={feedbackFields.witness_info?.phone || ""}
                      className="grow"
                      placeholder="Phone"
                      onChange={handleChangeValue}
                    />
                  </label>
                  <label className="input input-bordered w-full max-w-lg flex items-center gap-2">
                    {/* InsertIcon */}
                    <input
                      type="text"
                      name="witness_info:email"
                      value={feedbackFields.witness_info?.email || ""}
                      className="grow"
                      placeholder="Email"
                      onChange={handleChangeValue}
                    />
                  </label>
                </div>

                <div className="divider opacity-50"></div>
              </div>

              <div className="collapse collapse-arrow">
                <input type="checkbox" defaultChecked />
                <h6 className="collapse-title text-md !text-primary inline-flex gap-2 items-center">
                  Details
                </h6>
                <div className="collapse-content flex flex-row flex-wrap gap-4 justify-between max-w-6xl">
                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        What alleged misconduct occurred?
                        <span className="text-red-500">*</span>
                      </span>
                    </div>
                    <textarea
                      required
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:description"
                      value={feedbackFields.details?.description || ""}
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <label className="w-full max-w-lg">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        When did it happen and when did you become aware of it?
                      </span>
                    </div>
                    <input
                      type="datetime-local"
                      className="input input-bordered w-full"
                      placeholder="When"
                      name="details:when"
                      value={feedbackFields.details?.when || ""}
                      onChange={handleChangeValue}
                    />
                  </label>

                  <label className="w-full max-w-lg">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Where did it happen?
                      </span>
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Where?"
                      name="details:where"
                      value={feedbackFields.details?.where || ""}
                      onChange={handleChangeValue}
                    />
                  </label>

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        How did it happen?
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:how"
                      value={feedbackFields.details?.how || ""}
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Are there any other parties involved in the alleged
                        misconduct?
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:other_parties_involved"
                      value={feedbackFields.details?.other_parties_involved || ""}
                      onChange={handleChangeValue}
                    ></textarea>
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        If yes. Please list their names and designations.
                      </span>
                    </div>
                  </label>

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Are you concerned that you or any other person may suffer (or
                        has already suffered) consequences arising from this matter?
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:concerned_about_consequences"
                      value={
                        feedbackFields.details?.concerned_about_consequences || ""
                      }
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Have you reported the activity to your employer?
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:reported_to_employer"
                      value={feedbackFields.details?.reported_to_employer || ""}
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Is there any individual who is conflicted by the misconduct
                        and who should not be assisting in reviewing or assessing the
                        alleged misconduct?<span className="text-red-500">*</span>
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:conflicted_individuals"
                      value={feedbackFields.details?.conflicted_individuals || ""}
                      required
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Were any internal controls to prevent the alleged misconduct
                        circumvented? If yes, what controls were circumvented and how
                        were they circumvented?
                        <span className="text-red-500">*</span>
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      name="details:circumvented_controls"
                      value={feedbackFields.details?.circumvented_controls || ""}
                      required
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>

                  <div className="flex flex-col w-full gap-4">
                    <label className="form-control w-full max-w-lg">
                      <div className="label">
                        <span className="label-text text-info text-sm">
                          Supporting documents
                        </span>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="file-input file-input-bordered w-full"
                        onChange={handleFileChange}
                        name="details:supporting_docs"
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

                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text text-info text-sm">
                        Any other detail that you think could assist in the
                        investigation.
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="Please describe..."
                      value={feedbackFields.details?.other_details || ""}
                      name="details:other_details"
                      onChange={handleChangeValue}
                    ></textarea>
                  </label>
                </div>

                <div className="divider opacity-50"></div>
              </div>

              <div className="flex flex-row flex-wrap gap-4 items-center justify-center">
                <input
                  type="text"
                  className="input input-bordered w-full max-w-sm"
                  placeholder="Enter Captcha"
                  name="captcha"
                  value={captchaUser}
                  onChange={(e) => setCaptchaUser(e.target.value)}
                />
                <Captcha captcha={captcha} generateCaptcha={generateCaptcha} />

                <button
                  type="submit"
                  className="btn btn-primary w-full text-white shadow-lg"
                  disabled={submitLoading}
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

export default EmployeeWhistleBlowerForm;

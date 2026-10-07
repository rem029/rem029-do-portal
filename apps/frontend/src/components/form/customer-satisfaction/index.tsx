import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { FaInstagram } from "react-icons/fa";
import { CustomerRatingSatisfactionOptions, Language, CustomerSurveySatisfactionsContent, Media } from "../../../types";
import { SurveyCustomerSatisfaction } from "../../../types/payload-types";
import { API_SURVEY_URL } from "../../../utils/constants";
import RadioGroup, { RadioGroupProp } from "../../common/radio-group";
import Rating from "../../common/rating";
import { CountryOption, countryOptionsWithUniquePhone, initDefaultLanguage } from "../../../helpers";
import SuccessMessageForm from "../success-message";
import { t } from "../../../utils/contents";
import CustomerSurveyCard from "../../common/card";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CountryCodeControlOption,
  CountryCodeSingleValue,
  CountryCodeCustomOption,
} from "../../common/country-code-select";
import { addAnalytics } from "../../../helpers/analytics";
import Select from "react-select";
import { TbWorld } from "react-icons/tb";
import { CaptchTurnstile } from "../../common/captcha-turnstile";
import validateCustomerSatisfaction, {
  ReturnTypeValidateCustomerSatisfaction,
} from "../../../helpers/validation/ customer-satisfaction";
import { validateFields } from "../../../helpers/validation";

type SurveyCustomerSatisfactionWithoutID = Omit<SurveyCustomerSatisfaction, "id" | "createdAt" | "updatedAt">;

const initializeDefaults = (): SurveyCustomerSatisfactionWithoutID => {
  return {
    telephone_number_country: "974",
    marketing_consent: false,
  };
};

const CTA_Links = [
  {
    link: "https://doha.printemps.com/",
    label: "doha.printemps.com",
    icon: <TbWorld className="text-xl" />,
  },
  {
    link: "https://doha.printemps.com/",
    label: "/printempsdoha",
    icon: <FaInstagram className="text-xl" />,
  },
];

const isProd = process.env.NODE_ENV === "production";

export const CustomerSurvey = () => {
  const params = useParams();
  const [sParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [feedbackFields, setFeedbackFields] = useState(initializeDefaults());
  const [content, setContent] = useState<CustomerSurveySatisfactionsContent>();
  const [validation, setValidation] = useState<ReturnTypeValidateCustomerSatisfaction<SurveyCustomerSatisfaction>>();
  const [formError, setFormError] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [captchaVerifySuccess, setCaptchaVerifySuccess] = useState(false);

  const lang: Language = useMemo(() => {
    return initDefaultLanguage(sParams?.get("lang") || "");
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    addAnalytics("page_view", pathname, {
      additionalData: {
        restaurantName: params.restaurantName,
      },
    });

    const fetchContent = async () => {
      try {
        setSubmitLoading(true);
        const response = await axiosPayloadClient.get(
          `${API_SURVEY_URL}/api/globals/customer-survey-satisfactions-content`,
        );

        if (response.status !== 200) {
          throw Error("Something went wrong while fetching content.");
        }

        setContent(response.data);
      } catch (err: any) {
        setContent(undefined);
        const message = err?.response?.data?.message || err?.message || "Something went wrong while fetching content.";
        setFormError(message);
      } finally {
        setSubmitLoading(false);
      }
    };

    fetchContent();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lang === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
  }, [lang]);

  useEffect(() => {
    if (validation && Object.keys(validation).length > 0) {
      const validationResult = validateCustomerSatisfaction(feedbackFields as SurveyCustomerSatisfaction);
      setValidation(validationResult);
    } // eslint-disable-next-line
  }, [feedbackFields]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitLoading(true);

      const validation = validateFields("customer-satisfaction", feedbackFields as SurveyCustomerSatisfaction);

      if (Object.keys(validation).length > 0) {
        setValidation(validation);
        setFormError("All fields with (*) are required.");
        return;
      }

      const _convertRatingValue = (value: string) => value.replaceAll(" ", "-").toLowerCase();

      const _getRatingValue = (key: keyof SurveyCustomerSatisfactionWithoutID) => ({
        ...(feedbackFields[key] && {
          [key]: _convertRatingValue((feedbackFields[key] as string) || ""),
        }),
      });

      const body = {
        ...feedbackFields,
        ..._getRatingValue("rating_customer_service"),
        ..._getRatingValue("rating_loyalty_program_satis"),
        ..._getRatingValue("rating_overall_experience"),
      };

      const response = await axiosPayloadClient.post(`${API_SURVEY_URL}/api/survey-customer-satisfactions`, body);

      if (response.status !== 201) {
        await addAnalytics("error", pathname, {
          additionalData: { ...body, error: response },
        });

        throw Error("Something went wrong while submitting your form. Please contact admin.");
      }

      await addAnalytics("form_submission", pathname, { additionalData: body });

      setShowSuccess(true);
      resetForm();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Unknown error";
      setFormError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    let { value, name } = e.target;

    // Checkbox change
    if (name.includes("marketing_consent")) {
      handleCheckBoxChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    if (name.includes("radio_group")) {
      const [, newName, , newValue] = name.split(":");
      name = newName;
      value = newValue;
    }

    if (name.includes("rating_")) {
      const [newName, newValue] = name.split(":");
      name = newName;
      value = getKeyByValue(Number(newValue)) || "";
    }

    setFeedbackFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleCheckBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { checked, name } = e.target;
    setFeedbackFields((prevState) => ({ ...prevState, [name]: checked }));
  };

  const resetForm = () => {
    setFeedbackFields(initializeDefaults());
  };

  const getRatingNumberValue = (value: string | undefined) => {
    if (!value) return 0;
    return CustomerRatingSatisfactionOptions[value] ? CustomerRatingSatisfactionOptions[value] : 0;
  };

  const getKeyByValue = (value: number): string | undefined => {
    for (const [key, val] of Object.entries(CustomerRatingSatisfactionOptions)) {
      if (val === value) return key;
    }

    return undefined;
  };

  const handleClickCTALinks = async (link?: string, btnLabel?: string) => {
    await addAnalytics("click", pathname, { additionalData: { link, btnLabel } });
  };

  const handleClickLanguage = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, lang?: Language) => {
    e.preventDefault();
    const url = `${pathname}?lang=${lang as string}`;
    navigate(url);
    window.location.reload();
  };

  const RequiredFieldIndicator = () => <span className="text-md text-red-500">*</span>;

  const CustomSurveyTitle = (label: string, isRequired?: boolean) => (
    <h6 className="font-Urbanist text-xl !text-gray-600  font-bold inline-flex gap-2 items-center max-md:text-lg">
      {tl(label)}
      {isRequired && <RequiredFieldIndicator />}
    </h6>
  );

  const CustomSurveySubTitle = (label: string) => (
    <p className="font-Urbanist text-sm !text-info inline-flex gap-2 items-center max-md:text-sm">{tl(label)}</p>
  );

  const CustomSurveyError = (key: keyof SurveyCustomerSatisfactionWithoutID, message?: string) => (
    <>
      {validation && validation[key] && (
        <div className="bg-red-100 text-red-400 text-xs font-extralight font-Poppins py-1 px-2 rounded-lg">
          {message ? message : validation[key]}
        </div>
      )}
    </>
  );

  const CustomerSurveyRatings = (
    content: { title?: string; subTitle?: string; isRequired?: boolean },
    key: keyof SurveyCustomerSatisfactionWithoutID,
  ) => (
    <div className="flex flex-col gap-1">
      {content?.title && <>{CustomSurveyTitle(content.title, content?.isRequired)}</>}
      {content?.subTitle && <>{CustomSurveySubTitle(content.subTitle)}</>}

      <Rating
        name={key}
        count={5}
        value={getRatingNumberValue((feedbackFields[key] as string) || "")}
        placholderText={tl("Select rating")}
        valueLabel={tl((feedbackFields[key] as string) || "")}
        onChange={handleChangeValue}
        disabled={submitLoading}
      />

      <p className="font-Urbanist text-[12px] italic !text-info inline-flex gap-2 items-center max-md:text-[8px]">
        {tl("1 - Very Dissatisfied to 5 - Very Satisfied")}
      </p>

      {CustomSurveyError(key)}
    </div>
  );

  const CustomerSurveyRadioGroup = (
    content: {
      title?: string;
      subTitle?: string;
      showDivider?: boolean;
      isRequired?: boolean;
    },
    key: keyof SurveyCustomerSatisfactionWithoutID,
    items: RadioGroupProp["items"],
  ) => {
    const showDivider = content?.showDivider ?? true;
    return (
      <div className="flex flex-col gap-1">
        <RadioGroup
          label={
            <div className="flex flex-col gap-1">
              {content?.title && <>{CustomSurveyTitle(content.title, content?.isRequired)}</>}
              {showDivider && <div className="h-[2px] w-full bg-primary" />}
              {content?.subTitle && <>{CustomSurveySubTitle(content.subTitle)}</>}
            </div>
          }
          fullWidth
          direction="flex-row"
          name={`radio_group:${key}`}
          value={feedbackFields[key] ? (feedbackFields[key] as string) : ""}
          onChange={handleChangeValue}
          items={items}
          disabled={submitLoading}
        />
        {CustomSurveyError(key)}
      </div>
    );
  };

  const tl = (label: string) => t(label, lang);

  return (
    <>
      {showSuccess && (
        <SuccessMessageForm
          title={tl("We Appreciate Your Input!")}
          subtitle={tl("Thanks for taking the time to share your thoughts with us.")}
          className="font-Urbanist"
        >
          <div className="flex flex-col gap-2 justify-center">
            <h6 className="text-md font-Urbanist text-secondary text-center">{tl("Stay connected with us")}</h6>
            <p className="text-sm text-gray-400 text-center px-1">
              {tl("Follow us on social media or visit our website for updates and offers.")}
            </p>
            <div className="flex flex-col max-md:flex-row gap-4 max-md:gap-3 justify-center">
              {CTA_Links.map((cta, idx) => {
                return (
                  <a
                    key={`survey-fnb-success-${idx}`}
                    onClick={() => handleClickCTALinks(cta.link, cta.label)}
                    href={cta.link}
                    target="_blank"
                    rel="noreferrer"
                    className="gap-1 w-full max-md:w-fit text-center font-Urbanist link text-sm max-md:text-xs link-primary flex flex-row items-center justify-center"
                  >
                    {cta.icon}
                    {cta.label}
                  </a>
                );
              })}
            </div>
          </div>
        </SuccessMessageForm>
      )}
      {!showSuccess && (
        <div className="font-Poppins w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-1 px-12  flex flex-col flex-1 items-center relative">
          <ErrorMessage message={formError} onClose={() => setFormError("")} />

          <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-8 max-md:gap-4 mb-8">
            {content && (
              <div className="relative w-full p-0 m-0">
                {content?.header_image && (
                  <img
                    className="aspect-video w-full h-auto object-cover"
                    src={(content.header_image as Media)?.url || ""}
                    alt={(content.header_image as Media)?.filename || ""}
                  />
                )}

                {content?.header_logo && (
                  <div className="overflow-hidden absolute bottom-0 right-1/2 translate-x-[50%] translate-y-[80px] aspect-square border-white border-2 border-solid bg-gray-300 w-[160px] h-auto rounded-full align-middle text-center">
                    <img
                      className="w-full h-full"
                      src={(content.header_logo as Media)?.url || ""}
                      alt={(content.header_logo as Media)?.filename || ""}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-20">
              <h6 className="flex-1 text-center font-Urbanist text-xl font-bold !text-primary gap-2 items-center">
                {tl("Your Voice, Our Improvement")}
              </h6>
              <p className="flex-1 text-center font-Poppins text-sm !text-info gap-2 items-center">
                {tl("Share your shopping experience to help us serve you better!")}
              </p>
            </div>

            <div className="join">
              <button
                className={`btn btn-xs w-[50%] join-item ${
                  lang === "en" ? "btn-primary text-white" : "btn-info btn-outline"
                }`}
                onClick={(e) => handleClickLanguage(e, "en")}
              >
                English
              </button>

              <button
                className={`btn btn-xs w-[50%] join-item ${
                  lang === "ar" ? "btn-primary text-white" : "btn-info btn-outline"
                }`}
                onClick={(e) => handleClickLanguage(e, "ar")}
              >
                عربي
              </button>
            </div>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRadioGroup(
                  {
                    title: tl("Store Ambience & Cleanliness"),
                    subTitle: tl("How would you rate the store ambience and cleanliness?"),
                    showDivider: false,
                    isRequired: true,
                  },
                  "store_ambience_cleanliness_rating",
                  [
                    {
                      label: tl("Excellent"),
                      value: "Excellent",
                    },
                    {
                      label: tl("Good"),
                      value: "Good",
                    },
                    {
                      label: tl("Average"),
                      value: "Average",
                    },
                    {
                      label: tl("Poor"),
                      value: "Poor",
                    },
                  ],
                )}

                {CustomerSurveyRadioGroup(
                  {
                    subTitle: tl("How will you rate the visual presentation/look of the store?"),
                    showDivider: false,
                    isRequired: true,
                  },
                  "store_ambience_visual_presentation_rating",
                  [
                    {
                      label: tl("Excellent"),
                      value: "Excellent",
                    },
                    {
                      label: tl("Good"),
                      value: "Good",
                    },
                    {
                      label: tl("Average"),
                      value: "Average",
                    },
                    {
                      label: tl("Poor"),
                      value: "Poor",
                    },
                  ],
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRadioGroup(
                  {
                    title: tl("Product Availability & Variety"),
                    subTitle: tl("Did you find what you were looking for?"),
                    showDivider: false,
                    isRequired: true,
                  },
                  "is_product_availability_variety",
                  [
                    {
                      label: tl("Yes"),
                      value: "Yes",
                    },
                    {
                      label: tl("No"),
                      value: "No",
                    },
                  ],
                )}

                {CustomerSurveyRadioGroup(
                  {
                    subTitle: tl("How would you rate the variety of brands and products available?"),
                    showDivider: false,
                  },
                  "product_availability_variety_rating",
                  [
                    {
                      label: tl("Excellent"),
                      value: "Excellent",
                    },
                    {
                      label: tl("Good"),
                      value: "Good",
                    },
                    {
                      label: tl("Average"),
                      value: "Average",
                    },
                    {
                      label: tl("Poor"),
                      value: "Poor",
                    },
                  ],
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRatings(
                  {
                    title: tl("Customer Service"),
                    subTitle: tl("How satisfied are you with the assitance provided by our staff?"),
                    isRequired: true,
                  },
                  "rating_customer_service",
                )}

                {CustomerSurveyRadioGroup(
                  {
                    subTitle: tl("Were our staff members helpful and knowledgeable?"),
                    showDivider: false,
                  },
                  "is_customer_service_helpful",
                  [
                    {
                      label: tl("Yes"),
                      value: "Yes",
                    },
                    {
                      label: tl("No"),
                      value: "No",
                    },
                  ],
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRadioGroup(
                  {
                    title: tl("Checkout & Payment Process"),
                    subTitle: tl("How smooth was the checkout process?"),
                    showDivider: false,
                    isRequired: true,
                  },
                  "checkout_payment_process",
                  [
                    {
                      label: tl("Excellent"),
                      value: "Excellent",
                    },
                    {
                      label: tl("Good"),
                      value: "Good",
                    },
                    {
                      label: tl("Average"),
                      value: "Average",
                    },
                    {
                      label: tl("Poor"),
                      value: "Poor",
                    },
                  ],
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRadioGroup(
                  {
                    title: tl("Loyalty Program"),
                    subTitle: tl("Are you a member of Club Printemps?"),
                    showDivider: false,
                    isRequired: true,
                  },
                  "loyalty_program",
                  [
                    {
                      label: tl("Yes"),
                      value: "Yes",
                    },
                    {
                      label: tl("No"),
                      value: "No",
                    },
                  ],
                )}

                {CustomerSurveyRatings(
                  {
                    subTitle: tl("If yes, how satisfied are you with the loyalty benefits?"),
                  },
                  "rating_loyalty_program_satis",
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRadioGroup(
                  {
                    title: tl("Communication & Promotions"),
                    subTitle: tl("How do you prefer to receive updates about promotions and events?"),
                    showDivider: false,
                    isRequired: true,
                  },
                  "communication_promotions",
                  [
                    {
                      label: tl("SMS"),
                      value: "SMS",
                    },
                    {
                      label: tl("Email"),
                      value: "Email",
                    },
                    {
                      label: tl("Whatsapp"),
                      value: "Whatsapp",
                    },
                    {
                      label: tl("Social Media"),
                      value: "Social Media",
                    },
                  ],
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                {CustomerSurveyRatings(
                  {
                    title: tl("Overall Experience"),
                    subTitle: tl("How satisfied are you with your experience at Printemps Doha"),
                    isRequired: true,
                  },
                  "rating_overall_experience",
                )}
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                <div className="flex flex-col gap-1">
                  {CustomSurveyTitle("Areas for Improvement")}
                  <textarea
                    className="textarea textarea-sm textarea-bordered textarea-primary bg-white"
                    placeholder={tl("What would you like us to improve?")}
                    name="area_for_improvement"
                    value={feedbackFields?.area_for_improvement || ""}
                    onChange={handleChangeValue}
                  />
                </div>
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate bgClassName="bg-gray-50">
              <div className="flex flex-1 flex-col py-2 px-1 gap-8">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 flex flex-col gap-2">{CustomSurveyTitle("Customer information")}</div>

                  <label className="col-span-3 form-control w-full max-w-lg">
                    <div className="label">
                      <span className="label-text !text-info">
                        {tl("Full name")}
                        <RequiredFieldIndicator />
                      </span>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={feedbackFields?.name || ""}
                      onChange={handleChangeValue}
                      placeholder={tl("Enter here")}
                      className="font-Urbanist input input-bordered input-sm input-primary w-full max-md:input-sm bg-white"
                      disabled={submitLoading}
                    />
                    {validation?.name && <div className="label">{CustomSurveyError("name")}</div>}
                  </label>

                  <label className="col-span-1 max-md:col-span-2 form-control w-full max-w-md">
                    <div className="label h-full">
                      <span className="label-text text-xs !text-info">
                        {tl("Country code")}
                        <RequiredFieldIndicator />
                      </span>
                    </div>

                    <Select<CountryOption>
                      options={countryOptionsWithUniquePhone}
                      name="telephone_number_country"
                      components={{
                        Option: CountryCodeCustomOption,
                        SingleValue: CountryCodeSingleValue,
                        Control: CountryCodeControlOption,
                      }}
                      menuPortalTarget={document.body}
                      value={countryOptionsWithUniquePhone.find((c) =>
                        c.phone.includes(Number(feedbackFields?.telephone_number_country)),
                      )}
                      onChange={(e, action) => {
                        setFeedbackFields((prevState) => ({
                          ...prevState,
                          [action?.name as string]: `${e?.phone.join(",")}`,
                        }));
                      }}
                    />
                  </label>

                  <label className="col-span-1  form-control w-full max-w-lg">
                    <div className="label h-full">
                      <span className="label-text text-xs !text-info">
                        {tl("Phone number")}
                        <RequiredFieldIndicator />
                      </span>
                    </div>

                    <input
                      type="tel"
                      name="telephone_number"
                      value={feedbackFields?.telephone_number || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          // Allow only numeric values
                          handleChangeValue(e);
                        }
                      }}
                      placeholder={tl("12341234")}
                      className="font-Urbanist input input-sm input-ghost border-b-2 border-b-primary rounded-none w-full max-md:input-sm bg-white"
                      disabled={submitLoading}
                    />
                  </label>

                  <div className="col-span-2 label hidden max-md:block">
                    {CustomSurveyError("telephone_number_country")}
                  </div>

                  <div className="col-span-1 label hidden max-md:block">{CustomSurveyError("telephone_number")}</div>

                  <label className="col-span-1 max-md:col-span-3 flex-1 form-control w-full">
                    <div className="label">
                      <span className="label-text text-xs !text-info">{tl("Birth date")}</span>
                    </div>
                    <input
                      type="date"
                      max={tl("9999-12-13")}
                      name="birth_date"
                      value={
                        feedbackFields?.birth_date || "" ? moment(feedbackFields?.birth_date).format("yyyy-MM-DD") : ""
                      }
                      onChange={handleChangeValue}
                      placeholder={tl("Enter here...")}
                      className="font-Urbanist input input-sm input-ghost border-b-2 border-b-primary rounded-none w-full max-md:input-sm bg-white"
                      disabled={submitLoading}
                    />
                  </label>

                  <div className="col-span-1 label max-md:hidden">{CustomSurveyError("telephone_number_country")}</div>

                  <div className="col-span-1 label max-md:hidden">{CustomSurveyError("telephone_number")}</div>

                  <label className="col-span-3 form-control w-full max-w-lg">
                    <div className="label">
                      <span className="label-text !text-info">
                        {tl("Email address")}
                        <RequiredFieldIndicator />
                      </span>
                    </div>
                    <input
                      type="email"
                      name="email_address"
                      value={feedbackFields?.email_address || ""}
                      onChange={handleChangeValue}
                      placeholder={tl("customer@email.com")}
                      className="font-Urbanist input input-sm input-bordered input-primary w-full max-md:input-sm bg-white"
                      disabled={submitLoading}
                    />
                    <div className="label">{CustomSurveyError("email_address")}</div>
                  </label>
                </div>
              </div>
            </CustomerSurveyCard>

            <div className="flex flex-col gap-2 items-center justify-center w-full">
              <label className="form-control w-full max-w-full flex-row items-center gap-2">
                <input
                  type="checkbox"
                  name={`marketing_consent`}
                  className="checkbox checkbox-primary"
                  checked={feedbackFields.marketing_consent || false}
                  onChange={handleChangeValue}
                />
                <div className="label">
                  <span className="label-text !text-info text-sm max-md:text-xs">
                    {tl(
                      "Would you allow us to contact you for any future promotions, events and informations about our restaurants?",
                    )}
                  </span>
                </div>
              </label>

              <div className="w-full text-center items-center flex flex-col gap-2 p-0 m-0 mt-2">
                <span className={`font-Urbanist label-text text-info max-md:text-sm`}>
                  {tl("Let us know your human")}
                </span>
                <CaptchTurnstile
                  onSuccess={() => setCaptchaVerifySuccess(true)}
                  onExpire={(msg) => {
                    setCaptchaVerifySuccess(false);
                    setFormError(msg || "");
                  }}
                  onError={(msg) => {
                    setCaptchaVerifySuccess(false);
                    setFormError(msg || "");
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full text-white shadow-lg"
                disabled={isProd ? submitLoading || !captchaVerifySuccess : submitLoading}
              >
                {tl("Submit")}&nbsp;{}
                <span className={`loading loading-spinner loading-md ${!submitLoading ? "hidden" : ""}`} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default CustomerSurvey;

import { Fragment, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import moment from "moment";
import { FaCalendar, FaInstagram, FaStar, FaUtensils } from "react-icons/fa";
import { AiFillLike } from "react-icons/ai";
import { MdFoodBank } from "react-icons/md";
import { IoPerson } from "react-icons/io5";
import {
  CustomerRatingOptions,
  NetPromoterFeedback,
  CustomerInfo,
  SurveyWithNetPromoterFeedback,
  Restaurant,
  Media,
  Language,
} from "../../../types";
import { API_SURVEY_URL, API_VERIFY_URL } from "../../../utils/constants";
import RadioGroup from "../../common/radio-group";
import Rating from "../../common/rating";
import {
  CountryOption,
  countryOptionsWithUniquePhone,
  initDefaultLanguage,
  updateCurrentDate,
  updateCurrentTime,
} from "../../../helpers";
import SuccessMessageForm from "../success-message";
import { t } from "../../../utils/contents";
import CustomerSurveyCard from "../../common/card";
import CustomerSurveyCashier from "./cashier";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  CountryCodeControlOption,
  CountryCodeSingleValue,
  CountryCodeCustomOption,
} from "../../common/country-code-select";
import { addAnalytics } from "../../../helpers/analytics";
import Select from "react-select";
import { TbWorld } from "react-icons/tb";
import {
  SurveyCustomerFeedback,
  SurveyNetPromoter,
} from "../../../types/payload-types";

const initializeDefaults = (
  restaurantName?: string,
): SurveyWithNetPromoterFeedback => {
  return {
    visit_date: moment().toISOString(true),
    customer_comments: "",
    customer_feedback_number: 0,
    receipt_id: "",
    employee_id: "",
    transaction_type: "Retail",
    discovery_method: "Please choose",
    telephone_number_country: "974",
    visited_restaurant: restaurantName ? restaurantName : "Please choose",
    favorite_restaurant: "Please choose",
    marketing_consent: true,
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

export const CustomerSurvey = ({ type }: CustomerSurveyProps) => {
  const params = useParams();
  const [sParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState<"cashier" | "customer">("cashier");

  const [feedbackFields, setFeedbackFields] =
    useState<SurveyWithNetPromoterFeedback>(
      initializeDefaults(params.restaurantName || undefined),
    );
  const [restaurantInfo, setRestaurantInfo] = useState<Restaurant>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [formError, setFormError] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isValidReceiptID, setIsValidReceiptID] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | undefined>();

  const lang: Language = useMemo(() => {
    return initDefaultLanguage(sParams?.get("lang") || "");
    // eslint-disable-next-line
  }, []);

  const isRetailTransaction = useMemo(() => {
    return feedbackFields.transaction_type.toLowerCase() === "retail";
  }, [feedbackFields]);

  const defaultTransactionType = useMemo(() => {
    const transactionType = type;

    if (transactionType === "fnb") return "Food and Beverage";
    if (transactionType === "retail") return "Retail";

    return undefined;
  }, [type]);

  useEffect(() => {
    addAnalytics("page_view", pathname, {
      additionalData: { restaurantName: params.restaurantName },
    });

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
    if (defaultTransactionType) {
      setFeedbackFields((prevState) => ({
        ...prevState,
        transaction_type: defaultTransactionType,
      }));
    }
  }, [defaultTransactionType]);

  useEffect(() => {
    if (type === "retail") setStep("cashier");
    if (type === "fnb") setStep("customer");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axiosPayloadClient.get(
          `/api/restaurants?[where][options.include_survey_customer][equals]=true`,
        );

        const { data } = response;
        setRestaurants(data.docs || []);
      } catch (error) {
        console.error(`Error fetching, ${(error as Error)?.message}`);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    // const fetchRestaurantInfo = async () => {
    //   try {
    //     const response = await axiosPayloadClient.get(
    //       `/api/restaurants?[where][slug][equals]=${restaurant
    //         ?.toLowerCase()
    //         .replaceAll(" ", "-")}`,
    //     );
    //     const { data } = response;
    //     if (!data.docs || data.docs?.length === 0) return;

    //     setRestaurantInfo(data.docs[0]);
    //   } catch (error) {
    //     console.error(`Error fetching, ${(error as Error)?.message}`);
    //   }
    // };

    //     const restaurant = params?.restaurantName || "";
    // if (restaurant || restaurant !== "Please choose") {
    //   fetchRestaurantInfo();
    // }

    if (restaurants && restaurants.length > 0) {
      const restaurantName = params?.restaurantName || "";
      const restaurant = restaurants.find(
        (r) => r.slug?.toLowerCase() === restaurantName.toLowerCase(),
      );
      if (restaurant) {
        setRestaurantInfo(restaurant);
        return;
      }
    }
  }, [params, restaurants]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      feedbackFields?.visited_restaurant === "Please choose" &&
      !isRetailTransaction
    ) {
      setFormError(t("Please select a restaurant", lang));
      return;
    }

    try {
      setSubmitLoading(true);
      const convertRatingValue = (value: string) =>
        value.replaceAll(" ", "-").toLowerCase();

      const body = {
        ...feedbackFields,
        ...(feedbackFields?.rating_beverage && {
          rating_beverage: convertRatingValue(feedbackFields?.rating_beverage || ""),
        }),
        ...(feedbackFields?.rating_cleanliness && {
          rating_cleanliness: convertRatingValue(
            feedbackFields?.rating_cleanliness || "",
          ),
        }),
        ...(feedbackFields?.rating_food && {
          rating_food: convertRatingValue(feedbackFields?.rating_food || ""),
        }),
        ...(feedbackFields?.rating_greeting && {
          rating_greeting: convertRatingValue(feedbackFields?.rating_greeting || ""),
        }),
        ...(feedbackFields?.rating_service && {
          rating_service: convertRatingValue(feedbackFields?.rating_service || ""),
        }),
        ...(feedbackFields?.rating_value_for_money && {
          rating_value_for_money: convertRatingValue(
            feedbackFields?.rating_value_for_money || "",
          ),
        }),
        ...(feedbackFields?.visit_frequency && {
          visit_frequency: convertRatingValue(feedbackFields?.visit_frequency || ""),
        }),
        discovery_text:
          feedbackFields.discovery_method === "Other"
            ? feedbackFields.discovery_text
            : "",
        favorite_restaurant:
          feedbackFields.favorite_restaurant?.toLowerCase() === "please choose"
            ? ""
            : feedbackFields.favorite_restaurant,
        visited_restaurant:
          feedbackFields.visited_restaurant?.toLowerCase() === "please choose"
            ? ""
            : restaurantInfo
            ? restaurantInfo.name
            : feedbackFields.visited_restaurant,
      };

      const sendNetPromoter = async (survey_customer_feedbacks_id?: number) => {
        const response = await axiosPayloadClient.post(`/api/survey-net-promoter`, {
          ...body,
          ...(survey_customer_feedbacks_id && {
            survey_customer_feedbacks_id,
          }),
        });

        if (response.status !== 201) {
          throw Error(
            "Something went wrong while submitting your form. Please contact admin.",
          );
        }

        return response.data.doc as SurveyNetPromoter;
      };

      const sendCustomerFeedback = async () => {
        const response = await axiosPayloadClient.post(
          `${API_SURVEY_URL}/api/survey-customer-feedbacks`,
          body,
        );

        if (response.status !== 201) {
          throw Error(
            "Something went wrong while submitting your form. Please contact admin.",
          );
        }

        return response.data.doc as SurveyCustomerFeedback;
      };

      await addAnalytics("form_submission", pathname, { additionalData: body });

      if (isRetailTransaction) {
        await sendNetPromoter();
      } else {
        const survey = await sendCustomerFeedback();
        await sendNetPromoter(survey.id);
      }

      setShowSuccess(true);
      resetForm();
    } catch (error) {
      setFormError((error as Error)?.message || "Unknown error");
      resetCaptcha();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChangeValue = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    let { value, name } = e.target;

    // Checkbox change
    if (name.includes("marketing_consent")) {
      handleCheckBoxChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    if (name.includes("visit_date")) {
      value = name.includes(".date")
        ? updateCurrentDate(feedbackFields.visit_date, value)
        : updateCurrentTime(feedbackFields.visit_date, value);
      value = moment(value).toISOString(true);
      name = "visit_date";
    }

    if (name.includes("radio_group")) {
      const [, newName, , newValue] = name.split(":");
      name = newName;
      value = newValue;
    }

    if (
      (name.includes("customer_feedback") &&
        !name.includes("customer_feedback_number")) ||
      name.includes("transaction_type")
    ) {
      const [newName, newValue] = name.split(":");
      name = newName;
      value = newValue;
    }

    if (name.includes("rating_")) {
      const [newName, newValue] = name.split(":");
      name = newName;
      value = getKeyByValue(Number(newValue)) || "";
    }

    if (name.includes("customer_feedback_number")) {
      const feedbackValue = Number(value);
      let customerFeedback = "neutral";

      if (feedbackValue <= 4) {
        customerFeedback = "detractor";
      }
      if (feedbackValue > 4 && feedbackValue < 8) {
        customerFeedback = "neutral";
      }
      if (feedbackValue >= 8) {
        customerFeedback = "promoter";
      }

      setFeedbackFields((prevState) => ({
        ...prevState,
        customer_feedback: customerFeedback,
      }));
    }

    setFeedbackFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleCheckBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { checked, name } = e.target;
    setFeedbackFields((prevState) => ({ ...prevState, [name]: checked }));
  };

  const resetForm = () => {
    setFeedbackFields(initializeDefaults(params.restaurantName || undefined));
    resetCaptcha();
  };

  const resetCaptcha = () => {
    // generateCaptcha();
    // setCaptchaInput("");
  };

  const getRatingNumberValue = (value: string | undefined) => {
    if (!value) return 0;
    return CustomerRatingOptions[value] ? CustomerRatingOptions[value] : 0;
  };

  const getKeyByValue = (value: number): string | undefined => {
    for (const [key, val] of Object.entries(CustomerRatingOptions)) {
      if (val === value) return key;
    }

    return undefined;
  };

  const handleValidateReceiptID = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!feedbackFields.receipt_id) return;

    setCustomerInfo(undefined);
    axiosPayloadClient
      .get(`${API_VERIFY_URL}/receipt-id/${feedbackFields.receipt_id}/customer`)
      .then((response) => {
        if (response.data.response) {
          setFormError("");
          setCustomerInfo({
            customerName: response.data.response[0].CustomerName,
            date: response.data.response[0].Date,
          });
          setIsValidReceiptID(true);
        }
      })
      .catch((error: AxiosError) => {
        setCustomerInfo(undefined);
        setFormError(
          error.status === 404
            ? error.message
            : (error.response?.data as any)?.message || "",
        );
        setIsValidReceiptID(false);
      });
  };

  const handleClickCTALinks = async (link?: string, btnLabel?: string) => {
    await addAnalytics("click", pathname, { additionalData: { link, btnLabel } });
  };

  const shouldShowRestaurantSelect =
    !params.restaurantName || params.restaurantName === "Please choose";

  const handleClickLanguage = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    lang?: Language,
  ) => {
    e.preventDefault();
    const url = `${pathname}?lang=${lang as string}`;
    navigate(url);
    window.location.reload();
  };

  return (
    <>
      {showSuccess && (
        <SuccessMessageForm
          title={t("We Appreciate Your Input!", lang)}
          subtitle={t(
            "Thanks for taking the time to share your thoughts with us.",
            lang,
          )}
          className="font-Urbanist"
        >
          <div className="flex flex-col gap-2 justify-center">
            <h6 className="text-md font-Urbanist text-secondary text-center">
              {t("Stay connected with us", lang)}
            </h6>
            <p className="text-sm text-gray-400 text-center px-1">
              {t(
                "Follow us on social media or visit our website for updates and offers.",
                lang,
              )}
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
        <>
          {step === "cashier" && (
            <CustomerSurveyCashier
              customerInfo={customerInfo}
              feedbackFields={feedbackFields}
              handleChangeValue={handleChangeValue}
              handleValidateReceiptID={handleValidateReceiptID}
              isValidReceiptID={isValidReceiptID}
              setFeedbackFields={
                setFeedbackFields as React.Dispatch<
                  React.SetStateAction<NetPromoterFeedback>
                >
              }
              setFormError={setFormError}
              setStep={setStep}
              submitLoading={submitLoading}
              hideTransactionType={
                defaultTransactionType !== undefined ? true : false
              }
            />
          )}
          {step === "customer" && (
            <div className="font-Poppins w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-1 px-12  flex flex-col flex-1 items-center relative">
              <ErrorMessage message={formError} onClose={() => setFormError("")} />

              <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg flex flex-col gap-8 max-md:gap-4 mb-8 "
              >
                {/* Header */}
                {restaurantInfo && (
                  <div className="relative w-full p-0 m-0">
                    <img
                      className="aspect-video w-full h-auto object-cover"
                      src={(restaurantInfo.featured_image as Media)?.url || ""}
                      alt={(restaurantInfo.featured_image as Media)?.alt || ""}
                    />
                    <div className="overflow-hidden absolute bottom-0 right-1/2 translate-x-[50%] translate-y-[80px] aspect-square border-white border-2 border-solid bg-gray-300 w-[160px] h-auto rounded-full align-middle text-center">
                      <img
                        className="w-full h-full"
                        src={(restaurantInfo.logo as Media)?.url || ""}
                        alt={(restaurantInfo.logo as Media)?.alt || ""}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-20">
                  <h6 className="flex-1 text-center font-Urbanist text-xl font-bold !text-primary gap-2 items-center">
                    {t("Your Voice, Our Improvement", lang)}
                  </h6>
                  <p className="flex-1 text-center font-Poppins text-sm !text-gray-600 gap-2 items-center">
                    {t(
                      "Share your dining experience to help us serve you better!",
                      lang,
                    )}
                  </p>
                </div>
                {isRetailTransaction && (
                  <div className="flex flex-col gap-2 font-Urbanist">
                    <p className="font-Poppins text-xs text-opacity-50 !text-gray-600 inline-flex gap-2 items-center">
                      Receipt ID: {feedbackFields.receipt_id}
                    </p>
                    <p className="font-Poppins text-xs text-opacity-50 !text-gray-600 inline-flex gap-2 items-center">
                      Employee ID: {feedbackFields.employee_id}
                    </p>
                  </div>
                )}
                {!isRetailTransaction && (
                  <>
                    {/* <CustomerSurveyCard bgClassName="bg-gray-50">
                      <div className=" flex flex-col gap-2 ">
                        <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                          <BsInfoSquareFill className="opacity-50 text-sm" />
                          Your Visit Details
                        </h6>
                        <div className="h-[2px] w-full bg-primary" />
                      </div>
                      <div className="font-Urbanist flex flex-col gap-4 flex-wrap">
                        <div className="flex flex-col gap-1">
                          <span className="!text-gray-600 opacity-50 font-bold text-sm max-md:text-xs">
                            Date and time
                          </span>
                          <span className="!text-gray-600 text-sm max-md:text-xs">
                            {moment(feedbackFields.visit_date).format(
                              "ddd, yyyy MMM DD",
                            ) +
                              " at " +
                              moment(feedbackFields.visit_date).format("HH:mm A")}
                          </span>
                        </div>
                      </div>
                    </CustomerSurveyCard> */}

                    {shouldShowRestaurantSelect && (
                      <CustomerSurveyCard animate bgClassName="bg-gray-50">
                        <div className="flex flex-col gap-2">
                          <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                            <MdFoodBank className="opacity-50 text-md" />
                            {t("Which of our restaurants did you visit?", lang)}{" "}
                            <span className="text-lg text-red-500">*</span>
                          </h6>
                          <div className="h-[2px] w-full bg-primary" />
                        </div>
                        <label className="form-control w-full max-w-lg">
                          <select
                            name="visited_restaurant"
                            value={feedbackFields.visited_restaurant}
                            onChange={(e) =>
                              setFeedbackFields((prevState) => ({
                                ...prevState,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            className="select select-bordered select-md input-primary w-full bg-white"
                            disabled={submitLoading}
                          >
                            {[
                              "Please choose",
                              ...restaurants.map((r) => r.name),
                            ].map((c, index) => {
                              return (
                                <option
                                  key={"visited_restaurant_" + index}
                                  disabled={index === 0}
                                  value={c}
                                >
                                  {c}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      </CustomerSurveyCard>
                    )}

                    {params.restaurantName && (
                      <div className="join">
                        <button
                          className={`btn btn-xs w-[50%] join-item ${
                            lang === "en"
                              ? "btn-primary text-white"
                              : "btn-info btn-outline"
                          }`}
                          onClick={(e) => handleClickLanguage(e, "en")}
                        >
                          English
                        </button>

                        <button
                          className={`btn btn-xs w-[50%] join-item ${
                            lang === "ar"
                              ? "btn-primary text-white"
                              : "btn-info btn-outline"
                          }`}
                          onClick={(e) => handleClickLanguage(e, "ar")}
                        >
                          عربي
                        </button>
                      </div>
                    )}

                    <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <RadioGroup
                        label={
                          <div className="flex flex-col gap-2">
                            <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                              <FaUtensils className="opacity-50 text-sm" />
                              {t("Meal Period", lang)}
                            </h6>
                            <div className="h-[2px] w-full bg-primary" />
                          </div>
                        }
                        fullWidth
                        direction="flex-row"
                        name="radio_group:meal_period"
                        value={feedbackFields.meal_period || ""}
                        onChange={handleChangeValue}
                        items={[
                          {
                            label: t("Breakfast", lang),
                            icon: "🍳",
                            value: "Breakfast",
                          },
                          {
                            label: t("Lunch", lang),
                            icon: "🥗",
                            value: "Lunch",
                          },
                          {
                            label: t("Dinner", lang),
                            icon: "🍽️",
                            value: "Dinner",
                          },
                        ]}
                        disabled={submitLoading}
                      />
                    </CustomerSurveyCard>

                    <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <RadioGroup
                        label={
                          <div className="flex flex-col gap-2">
                            <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                              <FaCalendar className="opacity-50 text-sm" />
                              {t("How often do you visit our restaurant?", lang)}
                            </h6>
                            <div className="h-[2px] w-full bg-primary" />
                          </div>
                        }
                        fullWidth
                        direction="flex-row"
                        name="radio_group:visit_frequency"
                        value={feedbackFields.visit_frequency || ""}
                        onChange={handleChangeValue}
                        items={[
                          { label: t("Daily", lang), value: "Daily" },
                          { label: t("Weekly", lang), value: "Weekly" },
                          { label: t("Monthly", lang), value: "Monthly" },
                          { label: t("First time", lang), value: "First time" },
                        ]}
                        disabled={submitLoading}
                      />
                    </CustomerSurveyCard>

                    <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                            <FaStar className="opacity-50 text-sm" />
                            {t("How would you rate your dining experience?", lang)}
                          </h6>
                          <div className="h-[2px] w-full bg-primary" />
                        </div>
                        <Rating
                          label={t("Greeting", lang)}
                          name="rating_greeting"
                          count={5}
                          value={getRatingNumberValue(
                            feedbackFields.rating_greeting,
                          )}
                          placholderText={t("Select rating", lang)}
                          valueLabel={t(feedbackFields?.rating_greeting || "", lang)}
                          onChange={handleChangeValue}
                          disabled={submitLoading}
                        />
                        <Rating
                          label={t("Service", lang)}
                          name="rating_service"
                          count={5}
                          value={getRatingNumberValue(
                            feedbackFields.rating_service || "",
                          )}
                          placholderText={t("Select rating", lang)}
                          valueLabel={t(feedbackFields?.rating_service || "", lang)}
                          onChange={handleChangeValue}
                          disabled={submitLoading}
                        />
                        <Rating
                          label={t("Food", lang)}
                          name="rating_food"
                          count={5}
                          value={getRatingNumberValue(
                            feedbackFields.rating_food || "",
                          )}
                          placholderText={t("Select rating", lang)}
                          valueLabel={t(feedbackFields?.rating_food || "", lang)}
                          onChange={handleChangeValue}
                          disabled={submitLoading}
                        />
                        <Rating
                          label={t("Beverage", lang)}
                          name="rating_beverage"
                          count={5}
                          value={getRatingNumberValue(
                            feedbackFields.rating_beverage || "",
                          )}
                          placholderText={t("Select rating", lang)}
                          valueLabel={t(feedbackFields?.rating_beverage || "", lang)}
                          onChange={handleChangeValue}
                          disabled={submitLoading}
                        />
                        <Rating
                          label={t("Value for money", lang)}
                          name="rating_value_for_money"
                          count={5}
                          value={getRatingNumberValue(
                            feedbackFields.rating_value_for_money || "",
                          )}
                          placholderText={t("Select rating", lang)}
                          valueLabel={t(
                            feedbackFields?.rating_value_for_money || "",
                            lang,
                          )}
                          onChange={handleChangeValue}
                          disabled={submitLoading}
                        />
                        <Rating
                          label={t("Cleanliness", lang)}
                          name="rating_cleanliness"
                          count={5}
                          value={getRatingNumberValue(
                            feedbackFields.rating_cleanliness || "",
                          )}
                          placholderText={t("Select rating", lang)}
                          valueLabel={t(
                            feedbackFields?.rating_cleanliness || "",
                            lang,
                          )}
                          onChange={handleChangeValue}
                          disabled={submitLoading}
                        />
                      </div>
                    </CustomerSurveyCard>

                    <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <div className="flex flex-col gap-2">
                        <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                          <MdFoodBank className="opacity-50" />
                          {t("How did you come to know about us?", lang)}
                        </h6>
                        <div className="h-[2px] w-full bg-primary" />
                      </div>

                      <select
                        name="discovery_method"
                        value={feedbackFields.discovery_method}
                        onChange={(e) =>
                          setFeedbackFields((prevState) => ({
                            ...prevState,
                            [e.target.name]: e.target.value,
                          }))
                        }
                        className="select select-bordered select-primary select-md max-md:select-sm w-full bg-white"
                        disabled={submitLoading}
                      >
                        {[
                          {
                            label: t("Please choose", lang),
                            value: "Please choose",
                          },
                          {
                            label: t("Social Media", lang),
                            icon: "📱",
                            value: "Social Media",
                          },
                          {
                            label: t("Influencer Recommendation", lang),
                            icon: "🌟",
                            value: "Influencer Recommendation",
                          },
                          {
                            label: t(
                              "Search Engines like Google, Bing, etc...",
                              lang,
                            ),
                            icon: "🔍",
                            value: "Search Engines like Google, Bing, etc...",
                          },
                          {
                            label: t("Word of mouth", lang),
                            icon: "🗣️",
                            value: "Word of mouth",
                          },
                          {
                            label: t("Website", lang),
                            icon: "💻",
                            value: "Website",
                          },
                          {
                            label: t("Advertisement", lang),
                            icon: "📢",
                            value: "Advertisement",
                          },
                          { label: t("SMS", lang), icon: "📩", value: "SMS" },
                          { label: t("Other", lang), icon: "❓", value: "Other" },
                        ].map((c, index) => {
                          return (
                            <option
                              key={"discovery_method" + index}
                              disabled={index === 0}
                              value={c.value}
                            >
                              <p className="font-Poppins text-sm">
                                {c.label} {c.icon}
                              </p>
                            </option>
                          );
                        })}
                      </select>

                      {feedbackFields?.discovery_method === "Other" ? (
                        <label className="form-control w-full max-w-lg">
                          <div className="label">
                            <span className="label-text !text-gray-600"></span>
                          </div>
                          <input
                            type="text"
                            name="discovery_text"
                            value={feedbackFields.discovery_text}
                            onChange={handleChangeValue}
                            placeholder={t("Please state...", lang)}
                            className="input input-bordered input-primary w-full bg-white"
                            disabled={submitLoading}
                          />
                        </label>
                      ) : (
                        <></>
                      )}
                    </CustomerSurveyCard>

                    {/* <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <>
                        <RadioGroup
                          label={
                            <div className="flex flex-col gap-2">
                              <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                                <FaLightbulb className="opacity-50 text-sm" />
                                How did you come to know about us?
                              </h6>
                              <div className="h-[2px] w-full bg-primary" />
                            </div>
                          }
                          fullWidth
                          direction="flex-row"
                          name="radio_group:discovery_method"
                          value={feedbackFields.discovery_method || ""}
                          onChange={handleChangeValue}
                          items={[
                            { label: "Social Media 📱" },
                            { label: "Influencer Recommendations 🌟" },
                            { label: "Search Engines like Google, Bing, etc... 🔍" },
                            { label: "Word of mouth 🗣️" },
                            { label: "Website 💻" },
                            { label: "Advertisement 💻" },
                            { label: "SMS 📩" },
                            { label: "Other ❓" },
                          ]}
                          disabled={submitLoading}
                        />

                        {feedbackFields?.discovery_method === "Other" && (
                          <label className="form-control w-full max-w-lg">
                            <div className="label">
                              <span className="label-text !text-gray-600"></span>
                            </div>
                            <input
                              type="text"
                              name="discovery_text"
                              value={feedbackFields.discovery_text}
                              onChange={handleChangeValue}
                              placeholder="Please state..."
                              className="input input-bordered input-primary w-full"
                              disabled={submitLoading}
                            />
                          </label>
                        )}
                      </>
                    </CustomerSurveyCard> */}

                    <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <div className="flex flex-col gap-2">
                        <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                          <AiFillLike className="opacity-50 text-sm" />
                          {t("Dining satisfaction survey", lang)}
                        </h6>
                        <div className="h-[2px] w-full bg-primary" />
                      </div>
                      <RadioGroup
                        fullWidth
                        label={t("Would you visit this restaurant again?", lang)}
                        name="radio_group:will_visit_again"
                        value={feedbackFields.will_visit_again || ""}
                        onChange={handleChangeValue}
                        direction="flex-row"
                        items={[
                          { label: t("Yes", lang), icon: "✅", value: "Yes" },
                          { label: t("No", lang), icon: "❌", value: "No" },
                        ]}
                        disabled={submitLoading}
                      />

                      <RadioGroup
                        fullWidth
                        label={t(
                          "Did the manager/supervisor visit your table?",
                          lang,
                        )}
                        name="radio_group:manager_visit"
                        value={feedbackFields.manager_visit || ""}
                        onChange={handleChangeValue}
                        direction="flex-row"
                        items={[
                          { label: t("Yes", lang), icon: "✅", value: "Yes" },
                          { label: t("No", lang), icon: "❌", value: "No" },
                        ]}
                        disabled={submitLoading}
                      />
                    </CustomerSurveyCard>

                    {/* <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      <div className="flex flex-col gap-2">
                        <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                          <MdFoodBank className="opacity-50" />
                          Favorite restaurant?
                        </h6>
                        <div className="h-[2px] w-full bg-primary" />
                      </div>

                      <select
                        name="favorite_restaurant"
                        value={feedbackFields.favorite_restaurant}
                        onChange={(e) =>
                          setFeedbackFields((prevState) => ({
                            ...prevState,
                            [e.target.name]: e.target.value,
                          }))
                        }
                        className="select select-bordered select-primary select-md max-md:select-sm w-full"
                        disabled={submitLoading}
                      >
                        {["Please choose", ...content.en.restaurants].map(
                          (c, index) => {
                            return (
                              <option
                                key={"favorite_restaurant_" + index}
                                disabled={index === 0}
                                value={c}
                              >
                                {c}
                              </option>
                            );
                          },
                        )}
                      </select>
                    </CustomerSurveyCard> */}

                    <CustomerSurveyCard animate bgClassName="bg-gray-50">
                      {/* Customer info pt.1*/}
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                            <IoPerson className="opacity-50" />
                            {t("Customer information", lang)}
                          </h6>
                          <div className="h-[2px] w-full bg-primary" />
                        </div>
                        <label className="form-control w-full max-w-lg">
                          <div className="label">
                            <span className="label-text !text-gray-600">
                              {t("Full name", lang)}
                            </span>
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={feedbackFields.name}
                            onChange={handleChangeValue}
                            placeholder={t("Enter here", lang)}
                            className="font-Urbanist input input-bordered input-sm input-primary w-full max-md:input-sm bg-white"
                            disabled={submitLoading}
                          />
                        </label>

                        <div className="flex flex-row gap-4 max-md:flex-col">
                          <div className="flex-2  flex w-full flex-row items-center gap-1 justify-center h-full">
                            <label className="form-control w-full max-w-md">
                              <div className="label">
                                <span className="label-text text-xs !text-gray-600">
                                  {t("Country code", lang)}
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
                                  c.phone.includes(
                                    Number(feedbackFields?.telephone_number_country),
                                  ),
                                )}
                                onChange={(e, action) => {
                                  setFeedbackFields((prevState) => ({
                                    ...prevState,
                                    [action?.name as string]: `${e?.phone.join(
                                      ",",
                                    )}`,
                                  }));
                                }}
                              />
                            </label>

                            <label className="form-control w-full max-w-lg">
                              <div className="label">
                                <span className="label-text text-xs !text-gray-600">
                                  {t("Phone number", lang)}
                                </span>
                              </div>

                              <input
                                type="text"
                                name="telephone_number"
                                value={feedbackFields.telephone_number}
                                onChange={handleChangeValue}
                                placeholder={t("1234 1234", lang)}
                                className="font-Urbanist input input-sm input-ghost border-b-2 border-b-primary rounded-none w-full max-md:input-sm bg-white"
                                disabled={submitLoading}
                              />
                            </label>
                          </div>

                          <label className="flex-1 form-control w-full">
                            <div className="label">
                              <span className="label-text text-xs !text-gray-600">
                                {t("Birth date", lang)}
                              </span>
                            </div>
                            <input
                              type="date"
                              max={t("9999-12-13", lang)}
                              name="birth_date"
                              value={
                                feedbackFields?.birth_date || ""
                                  ? moment(feedbackFields?.birth_date).format(
                                      "yyyy-MM-DD",
                                    )
                                  : ""
                              }
                              onChange={handleChangeValue}
                              placeholder={t("Enter here...", lang)}
                              className="font-Urbanist input input-sm input-ghost border-b-2 border-b-primary rounded-none w-full max-md:input-sm bg-white"
                              disabled={submitLoading}
                            />
                          </label>
                        </div>

                        <label className="form-control w-full max-w-lg">
                          <div className="label">
                            <span className="label-text !text-gray-600">
                              {t("Email address", lang)}
                            </span>
                          </div>
                          <input
                            type="email"
                            name="email_address"
                            value={feedbackFields?.email_address || ""}
                            onChange={handleChangeValue}
                            placeholder={t("customer@email.com", lang)}
                            className="font-Urbanist input input-sm input-bordered input-primary w-full max-md:input-sm bg-white"
                            disabled={submitLoading}
                          />
                        </label>
                      </div>
                    </CustomerSurveyCard>
                  </>
                )}
                {/* When did you visit? */}
                <CustomerSurveyCard animate bgClassName="bg-gray-50">
                  <div className="flex flex-col gap-6">
                    <h6 className="font-Urbanist text-lg !text-gray-600 font-bold inline-flex gap-2 items-center max-md:text-sm">
                      😊&nbsp;{t("How Did We Do Today?", lang)}
                    </h6>
                    <div className="h-[4px] w-full bg-primary rounded-lg" />
                  </div>

                  <div className="flex flex-col justify-center items-start gap-4 bg-gray-50 py-4 px-2 rounded-md box-content">
                    <span className="!text-gray-600 text-md">
                      {t("Please rate us.", lang)}
                    </span>
                    <input
                      type="range"
                      style={{
                        transform: (lang === "ar" && "rotate(180deg)") || undefined,
                        direction: "ltr",
                      }}
                      min={0}
                      max="10"
                      name="customer_feedback_number"
                      value={feedbackFields.customer_feedback_number || 0}
                      onChange={handleChangeValue}
                      className={`range !bg-transparent ${
                        feedbackFields.customer_feedback === "detractor"
                          ? "range-error"
                          : ""
                      }
                      ${
                        feedbackFields.customer_feedback === "neutral"
                          ? "range-warning"
                          : ""
                      }
                      ${
                        feedbackFields.customer_feedback === "promoter"
                          ? "range-primary"
                          : ""
                      }
                      transition-all ease-in-out `}
                    />
                  </div>

                  <div className="flex flex-col justify-center items-center gap-2  py-2 px-2 rounded-sm box-content">
                    {[
                      {
                        icon: "😔",
                        label: t("Sad", lang),
                        value: "detractor",
                      },
                      {
                        icon: "😐",
                        label: t("Neutral", lang),
                        value: "neutral",
                      },
                      {
                        icon: "😊",
                        label: t("Happy", lang),
                        value: "promoter",
                      },
                    ]
                      .filter(
                        (rating) =>
                          rating.value === feedbackFields.customer_feedback,
                      )
                      .map((d, index) => {
                        return (
                          <Fragment key={"nps_" + index}>
                            <span
                              className={`${
                                feedbackFields.customer_feedback === d.value
                                  ? "text-6xl max-md:text-4xl"
                                  : "text-4xl max-md:text-2xl"
                              }`}
                            >
                              {d.icon}
                            </span>
                            <span
                              className={`text-md max-md:text-sm ${
                                feedbackFields.customer_feedback === d.value
                                  ? "font-bold"
                                  : "font-normal"
                              }`}
                            >
                              {d.label}
                            </span>
                          </Fragment>
                        );
                      })}
                  </div>

                  <textarea
                    className="textarea textarea-lg textarea-bordered textarea-primary"
                    placeholder={t("Your comments?", lang)}
                    name="customer_comments"
                    value={feedbackFields.customer_comments || ""}
                    onChange={handleChangeValue}
                  />
                </CustomerSurveyCard>
                <div className="flex flex-col gap-2 items-center justify-center w-full">
                  {!isRetailTransaction && (
                    <label className="form-control w-full max-w-full flex-row items-center gap-2">
                      <input
                        type="checkbox"
                        name={`marketing_consent`}
                        className="checkbox checkbox-primary "
                        checked={feedbackFields.marketing_consent || false}
                        onChange={handleChangeValue}
                      />
                      <div className="label">
                        <span className="label-text !text-gray-600 text-sm max-md:text-xs">
                          {t(
                            "Would you allow us to contact you for any future promotions, events and informations about our restaurants?",
                            lang,
                          )}
                        </span>
                      </div>
                    </label>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-full text-white shadow-lg"
                    disabled={submitLoading}
                  >
                    {t("Submit", lang)}&nbsp;{}
                    <span
                      className={`loading loading-spinner loading-md ${
                        !submitLoading ? "hidden" : ""
                      }`}
                    />
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </>
  );
};

interface CustomerSurveyProps {
  type: "fnb" | "retail";
}

export default CustomerSurvey;

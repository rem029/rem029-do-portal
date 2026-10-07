import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SurveyCustomerFeedbacksPadel } from "../../../types";
import CustomerSurveyCard, { CardTitle } from "../../common/card";
import RadioGroup from "../../common/radio-group";
import RatingScale from "../../common/rating-scale";
import ErrorMessage from "../../common/error-message";
import { axiosPayloadClient } from "../../../utils/config";
import SuccessMessageForm from "../success-message";
import { addAnalytics } from "../../../helpers/analytics";

const defaultFields: SurveyCustomerFeedbacksPadel = {};

const CustomerSurveyPadel = () => {
  const { pathname } = useLocation();
  const [step, setStep] = useState<"customer" | "success">("customer");
  const [feedbackFields, setFeedbackFields] =
    useState<SurveyCustomerFeedbacksPadel>(defaultFields);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    addAnalytics("page_view", pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeValue = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    let { value, name } = e.target;

    if (name.includes("radio_group")) {
      const [, newName, newValue] = name.split(":");
      name = newName;
      value = newValue;
    }

    setFeedbackFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleRatingScaleChange = (value: number, name?: string) => {
    name = name ? name : "";
    setFeedbackFields((prevState) => ({ ...prevState, [name as string]: value }));
  };

  const convertRatingScaleValue = (value?: string) =>
    value ? value.replaceAll(" ", "_").toLowerCase() : undefined;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);

      const response = await axiosPayloadClient.post(
        `/api/survey-customer-feedbacks-padel`,
        {
          ...feedbackFields,
          court_fees_reasonable: convertRatingScaleValue(
            feedbackFields.court_fees_reasonable || "",
          ),
          discovery_method: convertRatingScaleValue(
            feedbackFields.discovery_method || "",
          ),
          recommend_to_others: convertRatingScaleValue(
            feedbackFields.recommend_to_others || "",
          ),
          visit_frequency: convertRatingScaleValue(
            feedbackFields.visit_frequency || "",
          ),
          why_choose_us: convertRatingScaleValue(feedbackFields.why_choose_us || ""),
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

  const resetForm = () => {
    setFeedbackFields(defaultFields);
  };

  return (
    <>
      <div className="w-screen h-screen overflow-x-hidden overflow-y-auto max-md:px-4 px-12 max-md:py-4 p-8 flex flex-col flex-1 items-center relative">
        <ErrorMessage message={formError} onClose={() => setFormError("")} />
        {step === "success" && <SuccessMessageForm />}
        {step !== "success" && (
          <form
            className="w-full max-w-lg flex flex-col gap-16 max-md:gap-10"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <h6 className="text-2xl font-bold !text-primary inline-flex gap-2 items-center">
                Your Voice, Our Improvement
              </h6>
            </div>
            <CustomerSurveyCard animate elevate>
              <RadioGroup
                label={
                  <CardTitle title="How often do you play Padel at Doha Oasis?" />
                }
                fullWidth
                direction="flex-col"
                name="radio_group:visit_frequency"
                value={feedbackFields.visit_frequency || ""}
                onChange={handleChangeValue}
                items={[
                  { label: "Daily", value: "Daily" },
                  { label: "Weekly", value: "Weekly" },
                  { label: "Monthly", value: "Monthly" },
                  { label: "Often", value: "Often" },
                ]}
                disabled={submitLoading}
              />
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <RadioGroup
                label={
                  <CardTitle title="What motivated you to choose Doha Oasis for your Padel experience?" />
                }
                fullWidth
                direction="flex-col"
                name="radio_group:why_choose_us"
                value={feedbackFields.why_choose_us || ""}
                onChange={handleChangeValue}
                items={[
                  { label: "Facilities", value: "Facilities" },
                  { label: "Location", value: "Location" },
                  { label: "Pricing", value: "Pricing" },
                  { label: "Loyalty Program", value: "Loyalty Program" },
                  { label: "All above", value: "All above" },
                ]}
                disabled={submitLoading}
              />
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <>
                <RadioGroup
                  label={
                    <CardTitle title="How did you first hear about Doha Oasis Padel?" />
                  }
                  fullWidth
                  direction="flex-col"
                  name="radio_group:discovery_method"
                  value={feedbackFields.discovery_method || ""}
                  onChange={handleChangeValue}
                  items={[
                    { label: "Social Media", value: "Social Media" },
                    { label: "Friends", value: "Friends" },
                    { label: "Others", value: "Others" },
                  ]}
                  disabled={submitLoading}
                />

                {convertRatingScaleValue(feedbackFields?.discovery_method || "") ===
                  "others" && (
                  <label className="form-control w-full max-w-lg">
                    <div className="label">
                      <span className="label-text !text-info"></span>
                    </div>
                    <input
                      type="text"
                      name="discovery_method_others"
                      value={feedbackFields.discovery_method_others || ""}
                      onChange={handleChangeValue}
                      placeholder="Please state..."
                      className="input input-bordered input-primary w-full"
                      disabled={submitLoading}
                    />
                  </label>
                )}
              </>
            </CustomerSurveyCard>

            {/* <CustomerSurveyCard animate elevate>
              <RadioGroup
                label={
                  <CardTitle
                    title="How likely are you to recommend Doha Oasis Padel to a friend or
            colleague?"
                  />
                }
                fullWidth
                direction="flex-col"
                name="radio_group:recommend_to_others"
                value={feedbackFields.recommend_to_others || ""}
                onChange={handleChangeValue}
                items={[{ label: "Yes" }, { label: "No" }]}
                disabled={submitLoading}
              />
            </CustomerSurveyCard> */}

            <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="How likely are you to recommend Doha Oasis Padel to a friend or
                  colleague?"
                />

                <RatingScale
                  name="recommend_to_others_rating"
                  length={10}
                  onChange={handleRatingScaleChange}
                />
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="How satisfied are you with the booking process
                for Padel courts at Doha Oasis?"
                />

                <RatingScale
                  name="satifaction_booking_process"
                  length={10}
                  onChange={handleRatingScaleChange}
                />
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="How easy is it for you to find available time slots for Padel court
            bookings at Doha Oasis?"
                />

                <RatingScale
                  name="satifaction_booking_process_time_slots"
                  length={10}
                  onChange={handleRatingScaleChange}
                />
              </div>
            </CustomerSurveyCard>

            {/* <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="How would you rate the overall quality of the Padel courts at Doha
            Oasis (surface condition, lighting)?"
                />

                <RatingScale
                  name="satifaction_overall_quality"
                  length={10}
                  onChange={handleRatingScaleChange}
                />
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="How would you rate the customer service provided by the staff at Doha
            Oasis Padel?"
                />

                <RatingScale
                  name="satifaction_customer_service"
                  length={10}
                  onChange={handleRatingScaleChange}
                />
              </div>
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <RadioGroup
                label={
                  <CardTitle
                    title="Do you find the court fees at Doha Oasis reasonable for the
            services provided?"
                  />
                }
                fullWidth
                direction="flex-col"
                name="radio_group:court_fees_reasonable"
                value={feedbackFields.court_fees_reasonable || ""}
                onChange={handleChangeValue}
                items={[{ label: "Yes" }, { label: "No" }]}
                disabled={submitLoading}
              />
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <RadioGroup
                label={
                  <CardTitle
                    title="How likely are you to recommend Doha Oasis Padel to a friend or
            colleague?"
                  />
                }
                fullWidth
                direction="flex-col"
                name="radio_group:recommend_to_others"
                value={feedbackFields.recommend_to_others || ""}
                onChange={handleChangeValue}
                items={[{ label: "Yes" }, { label: "No" }]}
                disabled={submitLoading}
              />
            </CustomerSurveyCard>

            <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="What additional amenities or services would you like to see offered at
              Doha Oasis Padel?"
                />

                <textarea
                  placeholder="Your comment"
                  name="additional_amenities_wish"
                  value={feedbackFields.additional_amenities_wish || ""}
                  onChange={handleChangeValue}
                  className="textarea textarea-bordered w-full h-48"
                  disabled={submitLoading}
                />
              </div>
            </CustomerSurveyCard> */}

            <CustomerSurveyCard animate elevate>
              <div className="flex flex-col gap-2 pb-2">
                <CardTitle
                  title="Is there anything else you would like to share about your experiences
            using the Padel courts at Doha Oasis?"
                />

                <textarea
                  placeholder="Your comment"
                  name="share_experience"
                  value={feedbackFields.share_experience || ""}
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
        )}
      </div>
    </>
  );
};

export default CustomerSurveyPadel;

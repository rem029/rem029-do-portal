import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { axiosPayloadClient } from "../../../utils/config";
import SuccessMessageForm from "../success-message";
import ErrorMessage from "../../common/error-message";
import Select from "react-select";
import {
  FileWithPayloadID,
  PrintempsLoyaltyRegistration,
  PrintempsLoyaltyRegistrationStore,
} from "../../../types";
import { t } from "../../../utils/contents";
import { motion } from "framer-motion";
import {
  CountryCodeControlOption,
  CountryCodeCustomOption,
  CountryCodeSingleValue,
} from "../../common/country-code-select";
import moment from "moment";
import { CaptchTurnstile } from "../../common/captcha-turnstile";
import {
  CountryOption,
  countryOptionsWithUniquePhone,
  uploadSelectedFile,
} from "../../../helpers";
import {
  CountrySelectOption,
  CountrySingleValue,
  CountryControl,
} from "../../common/country-select";
import RadioGroup from "../../common/radio-group";
import { IoPerson } from "react-icons/io5";
import { FaCalendar, FaEnvelope, FaPhone } from "react-icons/fa";
import { addAnalytics } from "../../../helpers/analytics";

type FormData = Omit<
  PrintempsLoyaltyRegistration,
  "id" | "createdAt" | "updatedAt" | "store" | "gender"
> & {
  store: number; // we'll only submit the store id
  gender?: "male" | "female";
};

const initialFormData: FormData = {
  visit_date: moment().format("YYYY-MM-DD"),
  store: 0,
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  birth_date: "",
  nationality: "",
};

const FILE_MAX_SIZE = 5; //  In MB

const PrintempsLoyaltyRegistrationForm = (): JSX.Element => {
  const { pathname } = useLocation();
  const [captchaVerifySuccess, setCaptchaVerifySuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [countryCode, setCountryCode] = useState<CountryOption>();
  const [storeOptions, setStoreOptions] = useState<
    PrintempsLoyaltyRegistrationStore[]
  >([]);
  const [storeName, setStoreName] = useState("");
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [file, setFile] = useState<FileWithPayloadID>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    addAnalytics("page_view", pathname);
    const fetchStores = async () => {
      try {
        setSubmitLoading(true);
        const response = await axiosPayloadClient.get(
          "/api/printemps-loyalty-registration-store?limit=1000",
        );
        if (response.status === 200 && response.data.docs) {
          setStoreOptions(response.data.docs);
        }
      } catch (err) {
        console.error("Error fetching stores", err);
      } finally {
        setSubmitLoading(false);
      }
    };

    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const storeQuery = searchParams.get("store");
    if (storeQuery && storeOptions.length > 0) {
      const matchingStore = storeOptions.find(
        (store) => store.slug.toLowerCase() === storeQuery.toLowerCase(),
      );
      if (matchingStore) {
        setFormData((prev) => ({ ...prev, store: matchingStore.id }));
        setStoreName(matchingStore.name);
      }
    }
  }, [searchParams, storeOptions]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // if the field is "store", we want its numeric id
      [name]: name === "store" ? Number(value) : value,
    }));
  };

  const handleChangeRadio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const [controlName, , value] = name.split(":");

    setFormData((prev) => ({ ...prev, [controlName]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);
    try {
      let responseUpload: number | undefined = 0;

      if (file) {
        responseUpload = await uploadSelectedFile(
          file,
          "printemps-loyalty-registration-media",
        );
      }

      const data = {
        ...formData,
        phone: `${countryCode?.phone || ""}${formData.phone}`,
        receipt: responseUpload,
      };

      const response = await axiosPayloadClient.post(
        "/api/printemps-loyalty-registration",
        data,
      );

      if (response.status === 201) {
        setSuccess(true);
        await addAnalytics("form_submission", pathname);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error(err.message || "Unknown error occurred.");
      setError(
        "Registration failed. Your phone number might be registered already.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      const maxSize = FILE_MAX_SIZE * 1024 * 1024; // 2MB in bytes

      if (selectedFile.size > maxSize) {
        setError(
          `Some files exceed the ${FILE_MAX_SIZE}MB limit and will not be uploaded.`,
        );
        setFile(undefined);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        return;
      }

      setFile(selectedFile);
    }
  };

  if (success) return <SuccessMessageForm />;

  return (
    <div className="w-full max-w-xl h-full max-md:items-start p-4 max-md:py-12 max-md:mb-12 box-border flex flex-col">
      <div className="flex-1 w-full min-h-24 max-md:min-h-12"></div>
      {error && <ErrorMessage message={error} onClose={() => setError("")} />}
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-center gap-10 max-md:gap-8"
      >
        <motion.div
          animate={{ rotate: [0, 90, 180, 270, 360] }}
          transition={{
            duration: 50,
            ease: "linear",
            repeat: Infinity,
          }}
          className="w-max h-auto object-contain flex"
        >
          <img
            src="/assets/printemps-club-logo.png"
            alt="printemps-club-logo"
            className="w-24 h-auto object-contain flex"
          />
        </motion.div>

        <span className={`font-Urbanist label-text text-info max-md:text-sm`}>
          {storeName}
        </span>

        {/* <div className="grids grid-cols-2">
          <label className="hidden form-control w-full max-w-md">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Visit Date", "en")}
              </span>
            </div>

            <input
              type="date"
              name="visit_date"
              value={formData.visit_date}
              onChange={handleChange}
              className="font-Urbanist input input-sm  border-b-2 border-b-primary rounded-none w-full max-md:input-sm"
              disabled={submitLoading}
            />
          </label>

          <label className="hidden form-control w-full max-w-md">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Store", "en")}
              </span>
            </div>

            <select
              name="store"
              value={formData.store || ""}
              onChange={handleChange}
              required
              className="font-Urbanist select select-sm select-ghost border-b-2 border-b-primary rounded-none w-full max-md:select-sm"
            >
              <option value="" disabled>
                Select a store
              </option>
              {storeOptions.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
        </div> */}

        <div className="grid grid-cols-2 w-full gap-4 max-md:gap-2 py-1">
          <label className="form-control w-full max-w-md">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("First Name", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <label className="font-Urbanist input input-ghost input-sm border-b-2 border-b-primary rounded-none w-full max-md:input-sm flex items-center gap-2">
              <IoPerson />
              <input
                className="grow w-full"
                required
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </label>
          </label>

          <label className="form-control w-full max-w-md">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Last Name", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <label className="font-Urbanist input input-ghost input-sm border-b-2 border-b-primary rounded-none w-full max-md:input-sm flex items-center gap-2">
              <IoPerson />
              <input
                className="grow w-full"
                required
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </label>
          </label>
        </div>

        <div className="grid grid-cols-4 max-md:grid-cols-2 w-full gap-4 max-md:gap-2 py-1">
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Country code", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <Select<CountryOption>
              required
              options={countryOptionsWithUniquePhone}
              name="country_code"
              components={{
                Option: CountryCodeCustomOption,
                SingleValue: CountryCodeSingleValue,
                Control: CountryCodeControlOption,
              }}
              menuPortalTarget={document.body}
              onChange={(e) => {
                setCountryCode(e as CountryOption);
              }}
            />
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Phone", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <label className="font-Urbanist input input-ghost input-sm border-b-2 border-b-primary rounded-none flex items-center gap-2">
              <FaPhone />
              <input
                className="grow w-full"
                required
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={submitLoading}
                placeholder={t("1234 1234", "en")}
              />
            </label>
          </label>

          <label className="form-control w-full col-span-2">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Email", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <label className="font-Urbanist input input-ghost input-sm border-b-2 border-b-primary rounded-none w-full flex items-center gap-2 ">
              <FaEnvelope />
              <input
                className="grow w-full"
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={submitLoading}
                placeholder={t("your@email.com", "en")}
              />
            </label>
          </label>
        </div>

        <div className="grid grid-cols-2 max-md:grid-cols-1 w-full gap-4 max-md:gap-2 py-1">
          <label className="form-control w-full ">
            <div className="label mb-2">
              <span className="label-text text-xs !text-info">
                {t("Nationality", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <Select<CountryOption>
              required
              options={countryOptionsWithUniquePhone}
              name="nationality"
              components={{
                Option: CountrySelectOption,
                SingleValue: CountrySingleValue,
                Control: CountryControl,
              }}
              menuPortalTarget={document.body}
              onChange={(e, action) => {
                const { name } = action;
                setFormData((f) => ({
                  ...f,
                  [name || ""]: (e as CountryOption)?.label,
                }));
              }}
            />
          </label>

          <RadioGroup
            label={
              <div className="label">
                <span className="label-text text-xs !text-info">
                  {t("Gender", "en")}
                  <span className="text-xs text-red-500">*</span>
                </span>
              </div>
            }
            spacing="dense"
            fullWidth
            direction="flex-row"
            name="gender"
            value={formData?.gender || ""}
            onChange={handleChangeRadio}
            items={[
              {
                label: t("Male", "en"),
                icon: "♂️",
                value: "male",
              },
              {
                label: t("Female", "en"),
                icon: "♀️",
                value: "female",
              },
            ]}
            disabled={submitLoading}
          />
        </div>

        <div className="grid grid-cols-2 max-md:grid-cols-1 w-full gap-4 max-md:gap-2 py-1">
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Birth Date", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <label className="font-Urbanist input input-ghost input-sm border-b-2 border-b-primary rounded-none w-full flex items-center gap-2 ">
              <FaCalendar />
              <input
                className="grow w-full"
                required
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </label>
          </label>

          <label className="form-control w-full ">
            <div className="label">
              <span className="label-text text-xs !text-info">
                {t("Receipt", "en")}
                <span className="text-xs text-red-500">*</span>
              </span>
            </div>

            <input
              required
              ref={fileInputRef}
              type="file"
              name="receipt"
              onChange={handleFileChange}
              className="font-Urbanist file-input file-input-ghost file-input-sm border-0 border-b-2 border-b-primary rounded-none w-full max-md:input-sm"
              disabled={submitLoading}
            />

            <div className="label">
              <span className="label-text text-xs !text-gray-300">
                <span className="text-xs">{`Max size: ${FILE_MAX_SIZE}mb`}</span>
              </span>
            </div>
          </label>
        </div>

        <div className="w-full text-center items-center flex flex-col gap-2 p-0 m-0 mt-2">
          <span className={`font-Urbanist label-text text-info max-md:text-sm`}>
            Let us know your human
          </span>
          <CaptchTurnstile
            onSuccess={() => setCaptchaVerifySuccess(true)}
            onExpire={(msg) => {
              setCaptchaVerifySuccess(false);
              setError(msg || "");
            }}
            onError={(msg) => {
              setCaptchaVerifySuccess(false);
              setError(msg || "");
            }}
          />
        </div>

        <button
          type="submit"
          disabled={submitLoading || !captchaVerifySuccess}
          className="btn btn-primary text-white w-full font-Urbanist"
        >
          {submitLoading ? "Submitting..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default PrintempsLoyaltyRegistrationForm;

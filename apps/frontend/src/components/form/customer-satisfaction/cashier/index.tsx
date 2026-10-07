import { motion } from "framer-motion";
import moment from "moment";
import { BsInfoSquareFill } from "react-icons/bs";
import { CiBarcode } from "react-icons/ci";
import { IoPersonSharp } from "react-icons/io5";
import { MdDateRange } from "react-icons/md";
import { RiArrowRightFill } from "react-icons/ri";
import BarcodeScannerQuagga, {
  BarcodeScannerQuaggaRef,
} from "../../../common/barcode-quagga";
import OCRComponent from "../../../common/ocr-image-upload";
import RadioGroup from "../../../common/radio-group";

import { useRef, useState } from "react";
import { NetPromoterFeedback } from "../../../../types";
import CustomerSurveyCard from "../../../common/card";

interface CustomerSurveyCashierProps {
  setStep: React.Dispatch<React.SetStateAction<"customer" | "cashier">>;
  handleValidateReceiptID: (e: React.FormEvent<HTMLButtonElement>) => void;
  submitLoading: boolean;
  feedbackFields: NetPromoterFeedback;
  setFeedbackFields: React.Dispatch<React.SetStateAction<NetPromoterFeedback>>;
  setFormError: React.Dispatch<React.SetStateAction<string>>;
  isValidReceiptID: boolean;
  handleChangeValue: (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  customerInfo:
    | {
        date: string;
        customerName: string;
      }
    | undefined;
  hideTransactionType?: boolean;
  showOptions?: boolean;
}

const CustomerSurveyCashier = ({
  setStep,
  feedbackFields,
  setFeedbackFields,
  handleValidateReceiptID,
  submitLoading,
  setFormError,
  isValidReceiptID,
  handleChangeValue,
  customerInfo,
  hideTransactionType = false,
  showOptions = true,
}: CustomerSurveyCashierProps): JSX.Element => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const scannerRef = useRef<BarcodeScannerQuaggaRef>(null);

  const [selectedOCRFile, setSelectedOCRFile] = useState<File | null>(null);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");

  const handleOCRFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedOCRFile(event.target.files[0]);
    }
  };

  return (
    <form
      onSubmit={() => setStep("customer")}
      className="min-w-full flex flex-col gap-20ya max-md:gap-10"
    >
      <CustomerSurveyCard animate>
        <>
          {showOptions && (
            <div className="flex flex-col gap-6">
              <h6 className="text-xl font-bold text-bold text-gray-700 inline-flex gap-4 items-center">
                <BsInfoSquareFill className="opacity-50" />
                Enter Receipt Details
              </h6>
              <div className="h-[4px] w-full bg-primary rounded-lg" />
            </div>
          )}

          <div className="flex flex-col gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="!text-info">
                {moment(feedbackFields.visit_date).format("ddd, yyyy MMM DD") +
                  " at " +
                  moment(feedbackFields.visit_date).format("HH:mm A")}
              </span>
            </div>

            <div className="flex flex-col gap-2 flex-wrap justify-center">
              <button
                type="button"
                className={`btn btn-sm btn-outline btn-info flex-1`}
                onClick={() => {
                  !scannerStarted
                    ? scannerRef.current?.start()
                    : scannerRef.current?.stop();
                }}
              >
                {!scannerStarted && (
                  <>
                    Scan Receipt Barcode&nbsp;
                    <CiBarcode className="text-lg" />
                  </>
                )}
                {scannerStarted && <>Close</>}
              </button>
              <div className="divider">Or</div>
              <label className="form-control flex-1">
                <input
                  type="file"
                  onChange={handleOCRFileChange}
                  // accept="image/*"
                  className="file-input file-input-sm file-input-info  w-full"
                  // capture="environment"
                />
                <div className="label">
                  <span className="label-text-alt !text-info">
                    {isOCRLoading
                      ? "Processing"
                      : "Upload a screenshot of the receipt."}
                  </span>
                </div>
              </label>

              {selectedOCRFile && (
                <OCRComponent
                  imageFile={selectedOCRFile}
                  onTextRecognized={setRecognizedText}
                  onError={(error) => setFormError(error.message)}
                  onLoading={setIsOCRLoading}
                />
              )}
            </div>

            {selectedOCRFile && (
              <img
                src={URL.createObjectURL(selectedOCRFile)}
                alt="ocr-preview"
                className="w-full h-48 object-contain"
              />
            )}
            {recognizedText && (
              <textarea
                className="textarea textarea-lg"
                value={recognizedText}
                readOnly
              />
            )}

            <BarcodeScannerQuagga
              ref={scannerRef}
              containerId="do-bc-scanner"
              onDetected={(code) => {
                setFeedbackFields((prevState) => ({
                  ...prevState,
                  receipt_id: code,
                }));

                if (scannerRef.current) scannerRef.current.stop();
              }}
              onError={(err) => {
                const msg = err?.message || "";
                setFormError(msg);
              }}
              startOnInit
              onStart={() => {
                setScannerStarted(true);
              }}
              onStop={() => {
                setScannerStarted(false);
              }}
            />
            <div className="divider"></div>
            <div className="flex flex-col gap-1">
              <motion.label
                className="form-control w-full"
                animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
                transition={{ ease: "easeOut", duration: 0.5, delay: 0.2 }}
              >
                <div className="label"></div>
                <input
                  type="text"
                  name="employee_id"
                  value={feedbackFields.employee_id}
                  required
                  onChange={handleChangeValue}
                  placeholder="Employee ID here..."
                  className="input input-ghost input-md input-primary w-full"
                  disabled={submitLoading || isValidReceiptID}
                />
              </motion.label>
              <motion.label
                className="form-control w-full"
                animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
                transition={{ ease: "easeOut", duration: 0.5, delay: 0.2 }}
              >
                <div className="label"></div>
                <input
                  type="text"
                  name="receipt_id"
                  value={feedbackFields.receipt_id}
                  required
                  onChange={handleChangeValue}
                  placeholder="Receipt ID here..."
                  className="input input-ghost input-md input-primary w-full"
                  disabled={submitLoading || isValidReceiptID}
                />
              </motion.label>
            </div>

            {/* <motion.div
            className="flex flex-row gap-4"
            animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
            transition={{
              ease: "easeOut",
              duration: 0.5,
              delay: 0.3,
            }}
          >
            {feedbackFields.transaction_type === "Retail" && (
              <button
                type="button"
                className="btn btn-xs btn-outline btn-primary text-white  text-left max-w-fit"
                onClick={handleValidateReceiptID}
                disabled={!feedbackFields.receipt_id}
              >
                {isValidReceiptID ? "Revalidate" : "Validate receipt ID"}
                {isValidReceiptID ? <FiRefreshCcw /> : <CiSearch />}
              </button>
            )}
          </motion.div> */}

            {customerInfo && (
              <div className="flex flex-col gap-2">
                <span className="text-md font-bold text-bold text-gray-400 inline-flex gap-4 items-center">
                  Customer Information
                </span>
                <div className="h-[1px] w-full bg-gray-200 rounded-lg" />
                <span className="!text-info flex flex-row gap-2 items-center">
                  <IoPersonSharp />
                  {customerInfo.customerName}
                </span>
                <span className="!text-info flex flex-row gap-2 items-center">
                  <MdDateRange />
                  {customerInfo.date}
                </span>
              </div>
            )}
            {!hideTransactionType && (
              <RadioGroup
                fullWidth
                direction="flex-row"
                items={[
                  { label: "Retail", value: "Retail" },
                  { label: "Food and Beverage", value: "Food and Beverage" },
                ]}
                label={"Transaction type"}
                name="transaction_type"
                value={feedbackFields.transaction_type}
                onChange={handleChangeValue}
              />
            )}
          </div>

          <motion.div
            className="flex flex-col gap-2 items-center justify-center w-full"
            animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
            transition={{ ease: "easeOut", duration: 0.5, delay: 0.4 }}
          ></motion.div>

          {showOptions && (
            <motion.div
              className="flex flex-col gap-2 items-center justify-center w-full"
              animate={{ opacity: [0, 0.2, 1], y: [200, 0] }}
              transition={{ ease: "easeOut", duration: 0.5, delay: 0.5 }}
            >
              <button
                type="submit"
                className="btn btn-primary w-full text-white shadow-lg"
                disabled={
                  submitLoading ||
                  !(
                    feedbackFields.receipt_id.length > 0 &&
                    feedbackFields.employee_id.length > 0
                  )
                }
              >
                Proceed to survey&nbsp;{}
                <RiArrowRightFill className="text-lg" />
                <span
                  className={`loading loading-spinner loading-md ${
                    !submitLoading ? "hidden" : ""
                  }`}
                />
              </button>
            </motion.div>
          )}
        </>
      </CustomerSurveyCard>
    </form>
  );
};

export default CustomerSurveyCashier;

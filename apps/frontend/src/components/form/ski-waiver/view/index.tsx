import moment from "moment";
import { FaRegIdCard, FaPhone, FaChild, FaPlus, FaSignature } from "react-icons/fa";
import { FaPerson } from "react-icons/fa6";
import { IoMdAdd, IoMdCalendar, IoMdPerson } from "react-icons/io";
import { Fragment } from "react/jsx-runtime";
import { addClassToSvgString } from "../../../../helpers";
import { Language } from "../../../../types";
import { SkiWaiverContent, SkiWaiverForm } from "../../../../types/payload-types";
import { t } from "../../../../utils/contents";
import { serializeSlate } from "../../../../utils/serialize-slate";
import WaiverFormContainer from "../../../common/waiver-form-container";
import WaiverListContainer from "../../../common/waiver-list-container";
import SuccessMessageForm from "../../success-message";
import { useNavigate } from "react-router-dom";

interface SkiWaiverViewProps {
  formResponseDoc?: SkiWaiverForm;
  contentsData: SkiWaiverContent;
  contentsLoading: boolean;
  language: Language;
  formResponse: string;
  submitLoading: boolean;
}
const SkiWaiverView = ({
  formResponseDoc,
  language,
  formResponse,
  submitLoading,
  contentsData,
  contentsLoading,
}: SkiWaiverViewProps) => {
  const navigate = useNavigate();

  const handleNavigateToFormNew = () => {
    navigate("/dohaquest/ski-waiver");
    window.location.reload();
  };

  return (
    <div className="w-full flex flex-col items-center p-0 overflow-y-auto gap-10 py-4">
      <SuccessMessageForm
        title={t(formResponse, language)}
        subtitle={`${t("Thank you! Your Form ID is:", language)} ${formResponseDoc?.id}`}
      />

      <button
        className="btn btn-info btn-xs btn-outline uppercase w-full max-w-lg"
        type="submit"
        disabled={submitLoading}
        onClick={() => handleNavigateToFormNew()}
      >
        <IoMdAdd className="text-lg" />
        {t("Submit new waiver form", language)}
      </button>
      {contentsLoading && <span className="loading loading-dots loading-lg !text-primary"></span>}
      {!contentsLoading &&
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

      <WaiverFormContainer>
        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <IoMdPerson className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("Visit Date", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{moment(formResponseDoc?.date).format("ddd YYYY-MM-DD")}</p>
        </div>

        <div className="w-full flex flex-row gap-4 items-center">
          <FaPerson className="text-gray-300 text-md" />
          <p className="text-md font-bold uppercase text-gray-500">
            {t("YOURS / GUARDIAN or PARENT INFORMATION", language)}
          </p>
        </div>

        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <IoMdCalendar className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("Age", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{formResponseDoc?.age}</p>
        </div>

        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <IoMdPerson className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("Name", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{formResponseDoc?.name}</p>
        </div>

        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <FaRegIdCard className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("QID/Passport#", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{formResponseDoc?.qid}</p>
        </div>

        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <FaPhone className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("Phone", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{formResponseDoc?.phone}</p>
        </div>

        <div className="divider"></div>

        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <IoMdPerson className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("Emergency Contact Name", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{formResponseDoc?.emergency_contact_name}</p>
        </div>

        <div className="w-full flex flex-row gap-2">
          <div className="flex-1 w-full flex flex-row gap-4 items-center">
            <FaPhone className="text-gray-300 text-md" />
            <p className="text-sm text-gray-400">{t("Emergency Contact Phone", language)}</p>
          </div>
          <p className="flex-1 text-sm text-gray-800">{formResponseDoc?.emergency_contact_phone}</p>
        </div>
      </WaiverFormContainer>

      {formResponseDoc?.dependents && formResponseDoc.dependents.length > 0 && (
        <>
          <div className="divider"></div>
          <WaiverFormContainer>
            <div className="w-full flex flex-row gap-4 items-center">
              <FaChild className="text-gray-300 text-md" />
              <p className="text-md font-bold uppercase text-gray-500">
                {t("DEPENDENTS / CHILDREN", language)}
                {formResponseDoc.dependents.length > 0 && (
                  <span className="font-normal text-sm text-gray-400">({formResponseDoc.dependents.length})</span>
                )}
              </p>
            </div>

            <div className="w-full flex flex-col gap-4 items-center">
              {formResponseDoc.dependents.map((dependent, index) => {
                return (
                  <Fragment key={"dependents_" + index}>
                    {index > 0 && <div className="divider"></div>}
                    <div className="w-full flex flex-row gap-2">
                      <div className="flex-1 w-full flex flex-row gap-4 items-center">
                        <IoMdPerson className="text-gray-300 text-md" />
                        <p className="text-sm text-gray-400">{t("Child's Name", language)}</p>
                      </div>
                      <p className="flex-1 text-sm text-gray-800">{dependent.name}</p>
                    </div>

                    <div className="w-full flex flex-row gap-2">
                      <div className="flex-1 w-full flex flex-row gap-4 items-center">
                        <IoMdPerson className="text-gray-300 text-md" />
                        <p className="text-sm text-gray-400">{t("Age", language)}</p>
                      </div>
                      <p className="flex-1 text-sm text-gray-800">{dependent.age}</p>
                    </div>

                    <div className="w-full flex flex-row gap-2">
                      <div className="flex-1 w-full flex flex-row gap-4 items-center">
                        <FaPlus className="text-gray-300 text-md" />
                        <p className="text-sm text-gray-400">{t("Medical Conditions", language)}</p>
                      </div>
                      <p className="flex-1 text-sm text-gray-800">{dependent.medical_conditions || "NA"}</p>
                    </div>
                  </Fragment>
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
            __html: addClassToSvgString(formResponseDoc?.signature_svg || "", "w-full"),
          }}
        ></div>
      </div>
    </div>
  );
};

export default SkiWaiverView;

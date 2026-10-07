import { useState, useRef, useEffect } from "react";
import { serializeRichText } from "../../../../helpers";
import { BenefitContent } from "../../../../types";
import ErrorMessage from "../../../common/error-message";
import Loading from "../../../common/loading";
import { useSearchParams } from "react-router-dom";
import { axiosPayloadClient } from "../../../../utils/config";
import { FaCircle } from "react-icons/fa";
import { CiImageOn } from "react-icons/ci";

const EmployeeBenefitsModal = ({
  itemId,
  contentLoading,
  setContentLoading,
}: EmployeeBenefitsModalProp) => {
  const [content, setContent] = useState<BenefitContent | undefined>();
  const [formError, setFormError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [searchParam, setSearchParam] = useSearchParams();
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setContentLoading(true);
        const response = await axiosPayloadClient.get(
          `/api/employee-benefits/${itemId}`,
        );

        if (response.status !== 200 || !response.data) {
          setFormError("Error fetching content. Please contact IT.");
        }

        setContent(response.data);
        showModal();
      } catch (error) {
        setFormError(
          (error as Error)?.message || "Unknown error. Please contact IT.",
        );
      } finally {
        setContentLoading(false);
      }
    };

    if (itemId) fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.onclose = () => {
        onCloseModal();
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogRef]);

  useEffect(() => {
    if (!isShown) {
      const tabActiveId = searchParam.get("tab");

      setSearchParam({
        tab: tabActiveId || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShown]);

  const showModal = () => {
    setIsShown(true);
    dialogRef.current?.showModal();
  };

  const onCloseModal = () => {
    setIsShown(false);
  };

  return (
    <>
      <ErrorMessage message={formError} onClose={() => setFormError("")} />
      <dialog id="content_modal" className="modal" ref={dialogRef}>
        <div className="modal-box">
          <form
            method="dialog"
            className={`w-full ${contentLoading ? "min-h-48" : "h-full"}`}
          >
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          {contentLoading && <Loading />}
          {!contentLoading && (
            <div className="flex flex-col gap-4 w-full">
              {content?.general_info.media && (
                <img
                  src={`${content?.general_info.media.url}`}
                  alt="logo"
                  className="h-36 max-w-36 object-contain max-md:max-w-24 max-md:max-h-24 rounded-md overflow-hidden"
                />
              )}

              {!content?.general_info.media && (
                <div className="h-36 min-w-36 object-contain max-md:min-w-24 max-md:min-h-24 items-center justify-center flex rounded-md overflow-hidden">
                  <CiImageOn className="w-full max-w-16 h-full object-contain !text-info" />
                </div>
              )}

              <h3 className="font-bold text-lg pb-8">{content?.name}</h3>

              <div className="flex flex-col w-full gap-1">
                <p className={`text-base-content font-bold text-sm max-md:text-xs`}>
                  Benefits
                </p>
                <ul className="flex flex-col gap-2 list-disc list-inside">
                  {content?.benefits.map((b, index) => {
                    return (
                      <li
                        key={"benefits_card__title" + index}
                        className="flex flex-col w-full gap-2 m-0 p-0"
                      >
                        <p className="text-sm text-base-content">
                          <FaCircle className="inline-block text-[8px] !text-primary opacity-50" />{" "}
                          {b.title}
                        </p>
                        <p className="text-sm text-base-content">{b.description}</p>

                        <div className="flex flex-row w-full max-h-fit max-sm:flex-col max-sm:gap-2">
                          {b.printemps && (
                            <div className="flex flex-col w-full max-sm:flex-row">
                              <p className="text-base-content/60 text-sm max-md:text-xs flex-1">
                                Printemps
                              </p>
                              <p className="!text-primary text-sm max-md:text-xs flex-1">
                                {b.printemps}
                              </p>
                            </div>
                          )}

                          {b.dohaoasis && (
                            <div className="flex flex-col w-full max-sm:flex-row">
                              <p className="text-base-content/60 text-sm max-md:text-xs flex-1">
                                Doha Oasis
                              </p>
                              <p className="!text-primary text-sm max-md:text-xs flex-1">
                                {b.dohaoasis}
                              </p>
                            </div>
                          )}

                          {b.banyantree && (
                            <div className="flex flex-col w-full max-sm:flex-row">
                              <p className="text-base-content/60 text-sm max-md:text-xs flex-1">
                                Banyan Tree
                              </p>
                              <p className="!text-primary text-sm max-md:text-xs flex-1">
                                {b.banyantree}
                              </p>
                            </div>
                          )}
                        </div>

                        {content.benefits.length > 1 && (
                          <div className="divider !text-info m-0 opacity-[.3]"></div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {content && content.terms_and_condition && (
                <div className="flex flex-col w-full gap-1">
                  <p className={`text-base-content font-bold text-sm max-md:text-xs`}>
                    Terms and condition
                  </p>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: content.terms_and_condition
                        .map((item) => serializeRichText(item))
                        .join("<br/>"),
                    }}
                    className={`text-base-content text-sm leading-6 max-md:text-xs`}
                  ></p>
                </div>
              )}

              {content?.attachments && content?.attachments.length > 0 && (
                <div className="flex flex-col w-full gap-1">
                  <p className={`text-base-content font-bold text-sm max-md:text-xs`}>
                    Attachment(s)
                  </p>
                  {content.attachments.map((attachment) => {
                    return (
                      <a
                        href={attachment.media.url}
                        className="link link-primary text-sm max-md:text-xs"
                        rel="noreferrer"
                        target="_blank"
                      >
                        {attachment.media.filename}
                      </a>
                    );
                  })}
                </div>
              )}

              {content?.external_link && (
                <a
                  href={content?.external_link}
                  className="link link-primary text-sm max-md:text-xs"
                  rel="noreferrer"
                  target="_blank"
                >
                  Link
                </a>
              )}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
};

interface EmployeeBenefitsModalProp {
  itemId: string;
  contentLoading: boolean;
  setContentLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default EmployeeBenefitsModal;

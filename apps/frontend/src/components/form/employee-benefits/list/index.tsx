import { useState, useEffect } from "react";
import { BenefitContent, EmployeeBenefitsTab } from "../../../../types";
import ErrorMessage from "../../../common/error-message";
import Loading from "../../../common/loading";
import { useSearchParams } from "react-router-dom";
import { CiImageOn } from "react-icons/ci";
import { axiosPayloadClient } from "../../../../utils/config";

const EmployeeBenefitsTabList = ({
  activeTab,
  contentLoading,
  setContentLoading,
}: EmployeeBenefitsTabContentProps) => {
  const [contents, setContents] = useState<BenefitContent[] | undefined>(undefined);
  // const [contentLoading, setContentLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [, setSearchParam] = useSearchParams();

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setContents(undefined);
        setContentLoading(true);

        const url =
          activeTab.id !== -1
            ? `/api/employee-benefits/category/${activeTab.id}?limit=100000&sort=name`
            : `/api/employee-benefits?limit=100000&sort=name`;

        const response = await axiosPayloadClient.get(url);

        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching contents. Please contact IT.");
        }

        setContents(response.data.docs);
      } catch (error) {
        setFormError(
          (error as Error)?.message || "Unknown error. Please contact IT.",
        );
      } finally {
        setContentLoading(false);
      }
    };

    fetchBenefits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleOnClickViewInfo = (
    content: BenefitContent,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();

    setSearchParam({
      tab: activeTab.id.toString(),
      ...(content.id && { item: content.id }),
    });
  };

  return (
    <>
      <ErrorMessage message={formError} onClose={() => setFormError("")} />
      {contentLoading && !contents && (
        <Loading className="w-full h-screen flex flex-col items-center justify-center" />
      )}
      {contents && (
        <>
          <div className="flex flex-col gap-4 w-full h-full overflow-x-hidden overflow-y-auto">
            {contents
              ?.filter((c) => c._status === "published")
              .map((c, index) => {
                return (
                  <div
                    key={"benefits_card" + index}
                    className="card rounded-xl flex flex-col gap-4 w-full py-4 px-4 border-gray-100 border-2 shadow-gray-100 shadow-md max-md:max-h-[268px]"
                  >
                    <div className="flex flex-row w-full items-center justify-center max-[375px]:items-start max-[375px]:flex-col gap-2">
                      {c.general_info.media && (
                        <img
                          src={c.general_info.media.url}
                          alt="logo"
                          className="h-48 max-w-48 object-contain max-md:max-w-24 max-md:max-h-24"
                        />
                      )}

                      {!c.general_info.media && (
                        <div className="h-48 max-w-48 object-contain max-md:max-w-24 max-md:max-h-16 items-center justify-center flex">
                          <CiImageOn className="w-full min-w-48 max-h-24 object-contain !text-info text-6xl" />
                        </div>
                      )}

                      <div className="flex flex-col gap-4 w-full max-sm:gap-2">
                        <h6 className="text-lg">{c.name}</h6>
                        <div className="flex  flex-col gap-2 w-full max-sm:gap-1">
                          <p className="!text-info text-sm max-md:text-xs">
                            {c.contact_info.phone}
                          </p>
                          <p className="!text-info text-sm max-md:text-xs">
                            {c.contact_info.address}
                          </p>
                          <p className="!text-info text-sm max-md:text-xs">
                            {c.contact_info.email}
                          </p>
                          <p className="!text-info text-sm max-md:text-xs">
                            {c.contact_info.point_of_contact}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary text-white btn-sm max-md:btn-xs"
                      onClick={(e) => handleOnClickViewInfo(c, e)}
                      disabled={contentLoading}
                    >
                      View Info
                      {contentLoading && (
                        <span className="loading loading-spinner"></span>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </>
  );
};

interface EmployeeBenefitsTabContentProps {
  activeTab: EmployeeBenefitsTab;
  contentLoading: boolean;
  setContentLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default EmployeeBenefitsTabList;

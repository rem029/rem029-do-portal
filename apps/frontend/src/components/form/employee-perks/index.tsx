import { useEffect, useMemo, useState } from "react";
import { PageContent } from "../../../types";
import LoadingPage from "../../../pages/loading";
import "./styles.css";
import ErrorMessage from "../../common/error-message";
import Loading from "../../common/loading";
import usePayload from "../../../hooks/use-payload";
import { useLocation, useSearchParams } from "react-router-dom";
import { EmployeePerksUser, Restaurant, Media } from "../../../types/payload-types";

import ModalHowTo from "./components/modal-howto";
import ModalRedeem from "./components/modal-redeem";
import { addAnalytics } from "../../../helpers/analytics";
import { setStorage } from "../../../helpers/localStorage";
import { useAxios } from "../../../hooks/use-axios";
import PromptUserCode from "./components/prompt-user-code";

const EmployeePerks = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const userCode = searchParams.get("user") || "";

  const [showModalHowtoUse, setShowModalHowtoUse] = useState(false);
  const [showModalRedeem, setShowModalRedeem] = useState(false);

  const [formError, setFormError] = useState("");

  const {
    error: restaurantError,
    loading: restaurantLoading,
    data: restaurantList,
  } = usePayload<Restaurant[]>("collections", {
    slug: "restaurants",
    query:
      "limit=0&where[options.include_employee_perks][equals]=true&sort=-options.order",
  });

  const {
    error: userError,
    loading: userLoading,
    data: userData,
    refetch: userInfosFetch,
  } = useAxios<EmployeePerksUser>({
    config: { url: `/api/employee-perks-users/${userCode}/info`, method: "get" },
    fetchOnLoad: false,
  });

  const {
    error: pageContentError,
    loading: pageContentLoading,
    data: pageContent,
  } = usePayload<PageContent>("globals", {
    slug: "page-content",
  });

  const {
    error: redeemWeeklyStatusError,
    loading: redeemWeeklyStatusLoading,
    data: redeemWeeklyStatus,
    refetch: redeemWeeklyStatusRefetch,
  } = useAxios<string>({
    config: { url: `/api/employee-perks-redeem-weekly/status`, method: "get" },
    fetchOnLoad: false,
  });

  const userInfo = useMemo(() => {
    const user = userData ? userData : undefined;

    if (user) {
      setStorage("analytics", JSON.stringify({ email: user?.email || "" }));
    }

    return user;
  }, [userData]);

  useEffect(() => {
    if (userCode) {
      userInfosFetch({ url: `/api/employee-perks-users/${userCode}/info` });
    }

    addAnalytics("page_view", pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userCode) {
      redeemWeeklyStatusRefetch({
        url: `/api/employee-perks-redeem-weekly/status/${userCode}`,
        method: "get",
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCode]);

  useEffect(() => {
    if (pageContentError) setFormError(pageContentError);
    if (restaurantError) setFormError(restaurantError);
    if (userError) setFormError(userError?.message || "Unknown Error");
    if (redeemWeeklyStatusError)
      setFormError(redeemWeeklyStatusError?.message || "Unknown error");
  }, [pageContentError, restaurantError, userError, redeemWeeklyStatusError]);

  const handleOpenModal = (
    modal: "howto-use" | "redeem" | "user-code" | undefined,
  ) => {
    addAnalytics("click", pathname, { elementId: "modal_" + modal + "_open" });

    if (modal === "howto-use") setShowModalHowtoUse(true);
    if (modal === "redeem") setShowModalRedeem(true);
  };

  const handleCloseModal = (
    modal: "howto-use" | "redeem" | "user-code" | undefined,
  ) => {
    addAnalytics("click", pathname, { elementId: "modal_" + modal + "_close" });

    if (modal === "howto-use") setShowModalHowtoUse(false);
    if (modal === "redeem") {
      setShowModalRedeem(false);
      redeemWeeklyStatusRefetch({
        url: `/api/employee-perks-redeem-weekly/status/${userCode}`,
        method: "get",
      });
    }
  };

  const doPrimaryLogo =
    (pageContent?.dohaoasis?.logo_primary as unknown as Media)?.url || "";
  const isUserDisabled = userInfo?.disabled || false;

  return (
    <div className="employee-perks">
      <ErrorMessage message={formError} onClose={() => setFormError("")} />
      {pageContentLoading && <LoadingPage />}

      {!userCode ? (
        <PromptUserCode logoUrl={doPrimaryLogo} />
      ) : (
        <>
          <ModalHowTo
            isOpen={showModalHowtoUse}
            onClose={() => handleCloseModal("howto-use")}
          />

          <ModalRedeem
            isOpen={showModalRedeem}
            onClose={() => handleCloseModal("redeem")}
            currentUser={userInfo}
          />

          {!pageContentLoading && (
            <>
              <header className="employee-perks__header">
                <h1>Employee Perks</h1>
                <img
                  className="employee-perks__logo"
                  src={doPrimaryLogo}
                  alt="dohaoasis-logo"
                />
              </header>

              <div className="employee-perks__container">
                <section className="employee-perks__section">
                  <div className="w-full flex gap-1 flex-col ">
                    <h6>Your Info</h6>
                    {userLoading ? (
                      <Loading className="w-1 [&>span]:loading-xs [&>span]:bg-secondary " />
                    ) : (
                      <p>{userInfo?.email || "Unknown user"}</p>
                    )}
                  </div>

                  <div className="w-full flex gap-1 flex-col ">
                    <h6>Status</h6>
                    {redeemWeeklyStatusLoading ? (
                      <Loading className="w-1 [&>span]:loading-xs [&>span]:bg-secondary " />
                    ) : (
                      <p
                        className={`text-xs ${
                          redeemWeeklyStatus === "used" ? "text-red-500" : ""
                        }`}
                      >
                        {redeemWeeklyStatus === "used"
                          ? "Redeemed this week"
                          : "Not yet redeemed this week"}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenModal("howto-use")}
                    className="employee-perks__link w-full text-[18px] text-left"
                  >
                    How to use this offer?
                  </button>
                </section>

                <section className="employee-perks__section min-h-60">
                  {isUserDisabled ? (
                    <>
                      <p className="text-xs !font-bold text-red-500">
                        User has been disabled.
                      </p>
                      <p className="text-xs">Please contact IT.</p>
                    </>
                  ) : (
                    <button
                      disabled={
                        redeemWeeklyStatusLoading ||
                        !redeemWeeklyStatus ||
                        redeemWeeklyStatus === "used" ||
                        isUserDisabled
                      }
                      className="employee-perks__button-primary"
                      onClick={() => handleOpenModal("redeem")}
                    >
                      Redeem now
                    </button>
                  )}
                </section>

                <section className="employee-perks__section">
                  <div className="w-full flex gap-1 flex-col ">
                    <h6>Eligible for weekly perks</h6>
                    <p>Valid once per week per restaurant</p>
                  </div>
                  <div className="employee-perks-restaurants__container">
                    {restaurantLoading && <Loading />}
                    {!restaurantLoading && restaurantList && (
                      <>
                        {restaurantList?.map((restaurant, idx) => {
                          const logo = restaurant?.logo as unknown as Media;
                          return (
                            <div
                              key={idx}
                              className="employee-perks-restaurants-item__container"
                            >
                              <img src={logo?.url || ""} alt={restaurant.name} />
                              <p>{restaurant.name}</p>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </section>
              </div>

              <footer className="employee-perks__footer">
                <p>
                  Issues? email us at{" "}
                  <a href="mailto:servicedesk@dohaoasis.com">
                    servicedesk@dohaoasis.com
                  </a>
                </p>
                <p>Powered by Doha Oasis IT Department</p>
              </footer>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeePerks;

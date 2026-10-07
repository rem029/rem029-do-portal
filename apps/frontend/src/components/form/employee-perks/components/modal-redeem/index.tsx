import { useMemo, useEffect, useState } from "react";
import usePayload from "../../../../../hooks/use-payload";
import { Restaurant, Media } from "../../../../../types";
import {
  EmployeePerksRedeemWeekly,
  EmployeePerksRestaurantPin,
  EmployeePerksUser,
} from "../../../../../types/payload-types";
import Loading from "../../../../common/loading";
import Modal, { ModalProps } from "../modal";
import { useAxios } from "../../../../../hooks/use-axios";

export interface ModalRedeemProps extends Omit<ModalProps, "children"> {
  currentUser?: EmployeePerksUser;
}

const ModalRedeem = ({ isOpen, onClose, currentUser }: ModalRedeemProps) => {
  const [restaurantPin, setRestaurantPin] = useState("");
  const [restaurantFound, setResturantFound] = useState<
    EmployeePerksRestaurantPin | undefined
  >();
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    error: restaurantPinError,
    loading: restaurantPinLoading,
    data: restaurantPinResult,
    refetch: fetchRestaurantPin,
  } = useAxios<EmployeePerksRestaurantPin>({
    config: {
      method: "get",
      url: `/api/employee-perks-restaurant-pin/${restaurantPin}/info`,
    },
    fetchOnLoad: false,
  });

  const {
    error: errorRedeemWeekly,
    loading: loadingRedeemWeekly,
    post: postRedeemWeekly,
  } = usePayload<EmployeePerksRedeemWeekly>("collections", {
    slug: "employee-perks-redeem-weekly",
    fetchOnLoad: false,
  });

  const disableRedeemButton = useMemo(() => {
    return Boolean(
      restaurantPin.length !== 4 ||
        restaurantPinLoading ||
        restaurantPinError ||
        !currentUser,
    );
  }, [restaurantPinLoading, restaurantPinError, restaurantPin, currentUser]);

  const messageError = useMemo(() => {
    const msg = formError && formError.length > 0 ? formError : errorRedeemWeekly;
    return msg ? "Redeem Failed. Please try again." : undefined;
  }, [formError, errorRedeemWeekly]);

  const messageSuccess = useMemo(() => {
    const msg =
      success && !errorRedeemWeekly
        ? "Successfully redeemed!"
        : loadingRedeemWeekly
        ? "Redeeming..."
        : undefined;

    return msg;
  }, [success, errorRedeemWeekly, loadingRedeemWeekly]);

  useEffect(() => {
    if (restaurantPin.length === 4) {
      fetchRestaurantPin({
        url: `/api/employee-perks-restaurant-pin/${restaurantPin}/info`,
      });
    }

    // eslint-disable-next-line
  }, [restaurantPin]);

  useEffect(() => {
    if (!isOpen) {
      setRestaurantPin("");
      setResturantFound(undefined);
      setFormError("");
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (restaurantPinResult && !restaurantPinError) {
      setResturantFound(restaurantPinResult);
      return;
    }
    setResturantFound(undefined);
  }, [restaurantPinResult, restaurantPinError]);

  const handleSubmit = async () => {
    try {
      if (restaurantFound && currentUser) {
        const data: Omit<
          EmployeePerksRedeemWeekly,
          "weekKey" | "id" | "createdAt" | "updatedAt"
        > = { restaurant: restaurantFound.id, user: currentUser.id };

        await postRedeemWeekly(data as EmployeePerksRedeemWeekly);
        setSuccess(true);
      } else {
        setFormError("Redeeming Failed. Please try again.");
      }
    } catch (error) {
      const msg = (error as Error)?.message || "Unknown Error";
      console.error(msg);
      setFormError("Redeeming Failed. Please try again.");
    }
  };
  const isUserDisabled = currentUser?.disabled || false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Redeem">
      <div className="px-2 py-6 flex flex-col gap-6 justify-center items-center">
        <p className="w-full text-center">
          Restaurant staff must enter the PIN to use this offer.
        </p>

        <input
          disabled={restaurantPinLoading || isUserDisabled || success}
          className="input input-bordered w-full max-w-xs text-center"
          type="text"
          value={restaurantPin}
          name="pin"
          onChange={(e) => setRestaurantPin(e.target.value)}
          maxLength={4}
          placeholder="Enter 4 digit PIN"
        />

        {restaurantPinLoading && (
          <Loading className="w-1 [&>span]:loading-xs [&>span]:bg-secondary " />
        )}

        {!restaurantPinLoading && restaurantFound && (
          <div className="employee-perks-restaurants-item__container">
            <img
              src={
                ((restaurantFound.restaurant as Restaurant)?.logo as Media)?.url ||
                ""
              }
              alt={(restaurantFound.restaurant as Restaurant).name}
            />
            <p>{(restaurantFound.restaurant as Restaurant).name}</p>
          </div>
        )}

        {!restaurantPinLoading && !restaurantFound && restaurantPin.length === 4 && (
          <p className="w-full text-center text-red-500">
            Invalid PIN. Please try again.
          </p>
        )}

        <button
          disabled={disableRedeemButton || isUserDisabled || success}
          onClick={handleSubmit}
          className="employee-perks__button-primary"
        >
          Submit
        </button>

        {messageError && (
          <p className="w-full text-center text-red-500">{messageError}</p>
        )}

        {messageSuccess && (
          <p className="w-full text-center text-green-500">{messageSuccess}</p>
        )}
      </div>
    </Modal>
  );
};

export default ModalRedeem;

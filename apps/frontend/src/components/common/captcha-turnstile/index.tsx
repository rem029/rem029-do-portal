import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { CF_SITE_KEY } from "../../../utils/constants";
import { useRef } from "react";
import { axiosPayloadClient } from "../../../utils/config";

interface CaptchTurnstileProps {
  onExpire?: (msg?: string) => void;
  onError?: (msg?: string) => void;
  onSuccess?: () => void;
}

export const CaptchTurnstile = ({
  onExpire = (_) => {},
  onError = (_) => {},
  onSuccess = () => {},
}: CaptchTurnstileProps) => {
  const captchaRef = useRef<TurnstileInstance>();

  const onCaptchaSuccess = async (token: string) => {
    const result = await verifyCaptcha(token);

    if (result) {
      onSuccess();
    }
  };

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const response = await axiosPayloadClient.post("/api/verify-captcha", {
        token,
      });

      if (response.status === 200) {
        return true;
      } else {
        onError("Captcha verification failed. Please reload page.");
        return false;
      }
    } catch (error) {
      const msg = (error as Error).message || "Unknown Error";
      onError(msg);
      return false;
    }
  };

  return (
    <Turnstile
      ref={captchaRef}
      siteKey={CF_SITE_KEY}
      onSuccess={onCaptchaSuccess}
      onError={() => {
        onError();
      }}
      onReset={() => {
        onError();
      }}
      onExpire={() => {
        onExpire("CAPTCHA expired. Please complete it again.");
        captchaRef.current?.reset();
      }}
      options={{
        refreshTimeout: "manual",
        refreshExpired: "manual",
        action: "submit_form_loyalty_registration",
        size: "normal",
        appearance: "execute",
      }}
    />
  );
};

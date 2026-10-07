import { useMemo } from "react";

interface CaptchaProps {
  captcha: string;
  generateCaptcha: () => void;
  disabled?: boolean;
}

const getRandomBoolean = () => Math.random() >= 0.5;

const Captcha = (props: CaptchaProps) => {
  const captchStyle = useMemo(() => {
    const isStriketrough = getRandomBoolean();
    const isBold = getRandomBoolean();
    const isItalic = getRandomBoolean();

    return `text-lg font-bold ${isStriketrough ? "line-through" : ""} ${
      isBold ? "font-bold" : "font-normal"
    } ${isItalic ? "italic" : ""}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.captcha]);

  return (
    <div className="flex flex-col p-4 justify-center items-center w-full">
      <div className="bg-neutral text-center p-2 mb-4 w-full max-w-xs relative border-2">
        <div className="absolute top-0 left-0 bg-transparent w-full h-full" />
        <span
          className={`${captchStyle} text-info`}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {props.captcha}
        </span>
      </div>
      <button
        type="button"
        className="link link-primary text-center"
        onClick={props.generateCaptcha}
        disabled={props.disabled}
      >
        Refresh Captcha
      </button>
    </div>
  );
};

export default Captcha;

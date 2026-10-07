import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { t } from "../../../utils/contents";
import { Language } from "../../../types";
import { IoMdRefresh } from "react-icons/io";

interface CaptchaV2Props {
  onVerify?: (isValid: boolean) => void;
  language: Language;
}

export interface CaptchaV2Ref {
  validate: (value: string) => boolean;
  refresh: () => void;
}

const CaptchaV2 = forwardRef<CaptchaV2Ref, CaptchaV2Props>(({ onVerify, language }, ref) => {
  const [captcha, setCaptcha] = useState("");
  const [userInput, setUserInput] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
    setUserInput("");
    if (onVerify) onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (captcha && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // High DPI scaling
        const ratio = window.devicePixelRatio || 1;
        canvas.width = 200 * ratio;
        canvas.height = 60 * ratio;
        canvas.style.width = "200px";
        canvas.style.height = "60px";
        ctx.scale(ratio, ratio);

        // Background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 200, 60);
        gradient.addColorStop(0, "#f8fafc");
        gradient.addColorStop(1, "#f1f5f9");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 60);

        // Noise lines
        for (let i = 0; i < 8; i++) {
          ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(
            Math.random() * 200,
          )}, ${Math.floor(Math.random() * 200)}, 0.2)`;
          ctx.lineWidth = Math.random() * 2;
          ctx.beginPath();
          ctx.moveTo(Math.random() * 200, Math.random() * 60);
          ctx.lineTo(Math.random() * 200, Math.random() * 60);
          ctx.stroke();
        }

        // Text
        const fontSize = 28;
        ctx.textBaseline = "middle";

        for (let i = 0; i < captcha.length; i++) {
          const char = captcha[i];
          const x = 25 + i * 28;
          const y = 30 + (Math.random() - 0.5) * 12;
          const angle = (Math.random() - 0.5) * 0.4;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Random font styling
          const fonts = ["serif", "sans-serif", "monospace"];
          ctx.font = `bold ${fontSize}px ${fonts[Math.floor(Math.random() * fonts.length)]}`;

          // Premium color palette (Quest colors)
          const colors = ["#1e293b", "#334155", "#475569", "#0F172A"];
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

          ctx.fillText(char, 0, 0);
          ctx.restore();
        }

        // Noise dots
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(15, 23, 42, ${Math.random() * 0.15})`;
          ctx.beginPath();
          ctx.arc(Math.random() * 200, Math.random() * 60, Math.random() * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [captcha]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setUserInput(val);
    if (onVerify) {
      onVerify(val === captcha);
    }
  };

  useImperativeHandle(ref, () => ({
    validate: (value: string) => value.toUpperCase() === captcha,
    refresh: generateCaptcha,
  }));

  return (
    <div className="flex flex-col gap-3 w-full max-w-[280px]">
      <div className="flex items-center gap-3">
        <div className="relative group">
          <canvas
            ref={canvasRef}
            className="border-2 border-slate-200 rounded-lg shadow-inner bg-white cursor-help"
            title={t("Click refresh if unreadable", language)}
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors rounded-lg pointer-events-none" />
        </div>
        <button
          type="button"
          onClick={generateCaptcha}
          className="btn btn-circle btn-sm btn-ghost hover:btn-primary hover:text-white transition-all transform hover:rotate-180 duration-500"
          title={t("Refresh", language)}
        >
          <IoMdRefresh size={20} />
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder={t("Enter code", language)}
          value={userInput}
          onChange={handleInputChange}
          className={`input input-bordered w-full h-10 text-center tracking-[0.5em] font-mono font-bold uppercase transition-all
            ${
              userInput.length === 6
                ? userInput === captcha
                  ? "border-success focus:border-success ring-success/20"
                  : "border-error focus:border-error ring-error/20"
                : "focus:border-primary"
            }`}
          maxLength={6}
          autoComplete="off"
          spellCheck="false"
        />
        {userInput.length === 6 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {userInput === captcha ? (
              <span className="text-success text-lg opacity-80">✓</span>
            ) : (
              <span className="text-error text-lg opacity-80">✗</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

CaptchaV2.displayName = "CaptchaV2";

export default CaptchaV2;

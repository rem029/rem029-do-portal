import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ErrorMessage from "../../common/error-message";
import Loading from "../../common/loading";
import { EmployeeBanner, EmployeeBenefit, EmployeeBenefitsCategory } from "../../../types/payload-types";
import { axiosPayloadClient } from "../../../utils/config";
import { addAnalytics } from "../../../helpers/analytics";

// New Prototype Components
import { MotionCarousel } from "./MotionCarousel";
import { OffersSection } from "./OffersSection";

// --- split text utility component ---
const SplitText = ({ text, className = "", wordSpace = "mr-4 md:mr-10", py = "py-4", hiddenClass = "" }: any) => {
  const words = text.split(" ");
  return (
    <div className={`flex flex-wrap justify-center ${className}`}>
      {words.map((word: string, wordIndex: number) => (
        <span key={wordIndex} className={`whitespace-nowrap overflow-hidden flex ${py} ${wordIndex !== words.length - 1 ? wordSpace : ''}`}>
          {Array.from(word).map((letter, letterIndex) => (
            <span
              key={letterIndex}
              className={`split-char inline-block transform-gpu ${hiddenClass}`}
              style={{ backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
            >
              {letter}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
};

const EmployeeBenefits = () => {
  const { pathname } = useLocation();
  const [categories, setCategories] = useState<EmployeeBenefitsCategory[] | undefined>();
  const [banners, setBanners] = useState<EmployeeBanner[] | undefined>();
  const [offers, setOffers] = useState<EmployeeBenefit[] | undefined>();
  const [contentLoading, setContentLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const appRef = useRef(null);

  useEffect(() => {
    addAnalytics("page_view", pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosPayloadClient.get(
          `/api/employee-benefits-category?limit=100000&sort=name`,
        );
        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching categories. Please contact IT.");
        }
        setCategories(response.data.docs);
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      }
    };

    const fetchBanners = async () => {
      try {
        const response = await axiosPayloadClient.get(
          `/api/employee-banner?limit=100000&sort=name`,
        );
        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching banners. Please contact IT.");
        }
        setBanners(response.data.docs);
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      }
    };

    const fetchOffers = async () => {
      try {
        const response = await axiosPayloadClient.get(
          `/api/employee-benefits?limit=100000&sort=name`,
        );
        if (response.status !== 200 || !response.data.docs) {
          setFormError("Error fetching offers. Please contact IT.");
        }
        setOffers(response.data.docs.filter((offer: EmployeeBenefit) => offer._status === "published"));
      } catch (error) {
        setFormError((error as Error)?.message || "Unknown error. Please contact IT.");
      }
    };

    setContentLoading(true);

    Promise.all([fetchCategories(), fetchBanners(), fetchOffers()]).finally(() => {
      setContentLoading(false);
    });
  }, []);

  // --- gsap master animations ---
  useGSAP(() => {
    if (contentLoading || !categories || !offers || !banners) return;

    // initial states for entrance animations
    gsap.set('.header-fade-text .split-char', { opacity: 0, y: 40, scale: 0.5, rotationX: 90 });
    gsap.set('.header-logo', { opacity: 0, y: -20 });
    gsap.set('.carousel-container', { scale: 1.05, y: 80, boxShadow: "0 30px 60px -15px rgba(0,0,0,0)", clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" });

    // nav bar initial state
    gsap.set('.nav-bar-container', { y: -30, opacity: 0, width: "52px", overflow: "hidden" });
    gsap.set('.search-input-wrapper', { opacity: 0 });
    gsap.set('.categories-container', { opacity: 0 });
    gsap.set('.divider', { opacity: 0 });

    const tl = gsap.timeline();

    // fade in carousel container immediately
    tl.to('.carousel-container', {
      scale: 1,
      y: 0,
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      duration: 1.2,
      ease: "power3.out",
      clearProps: "transform,clipPath"
    }, 0);

    tl.to('.carousel-container', {
      boxShadow: "0 30px 60px -15px rgba(0,0,0,0.3)",
      duration: 2.5,
      ease: "sine.inOut"
    }, 0.5);

    // nav bar and inner elements expand simultaneously
    tl.to('.nav-bar-container', {
      y: 0,
      opacity: 1,
      width: "auto",
      duration: 1.2,
      ease: "expo.out",
      clearProps: "width,overflow"
    }, 0);

    tl.to('.search-input-wrapper', { opacity: 1, duration: 1.2, ease: "power2.out" }, 0);
    tl.to('.divider', { opacity: 1, duration: 1.2 }, 0);
    tl.to('.categories-container', { opacity: 1, duration: 1.2, clearProps: "all" }, 0);

    // header text reveal
    tl.to('.header-fade-text .split-char', {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      stagger: 0.04,
      ease: "back.out(2)",
      duration: 1.2
    }, 0);

    tl.to('.header-logo', {
      opacity: 1,
      y: 0,
      ease: "back.out(2)",
      duration: 1.2
    }, 0);
  }, { dependencies: [contentLoading, categories, offers, banners], scope: appRef });

  if (contentLoading && (!categories || !offers || !banners)) {
    return <Loading className="w-full h-screen flex flex-col items-center justify-center" />;
  }

  return (
    <div ref={appRef} className="app-container relative min-h-screen overflow-x-hidden w-full bg-white font-Noah-Regular text-primary tracking-normal">
      <div className="w-full">
        <ErrorMessage message={formError} onClose={() => setFormError("")} />

        {/* --- absolute editorial header --- */}
        <header className="absolute top-0 left-0 right-0 pt-6 md:pt-10 flex items-center justify-center z-40 pointer-events-none">
          <div className="w-full max-w-full md:max-w-[1000px] mx-auto flex items-center justify-between px-6 md:px-0">
            {/* left side: title text */}
            <div className="header-fade-text text-primary font-medium font-Baskerville text-lg md:text-2xl tracking-tight uppercase pointer-events-auto flex items-center origin-left" style={{ perspective: "1000px" }}>
              <SplitText text="Employee Benefits" className="!justify-start" wordSpace="mr-3" py="py-0" hiddenClass="" />
            </div>

            {/* right side: anchored branding logo */}
            <div className="header-logo pointer-events-auto flex items-center shrink-0 -mr-2 md:-mr-9">
              <img src="/assets/logo.png" alt="Doha Oasis" className="h-12 md:h-16 w-auto object-contain mix-blend-multiply" />
            </div>
          </div>
        </header>

        {/* --- main content --- */}
        <div className="main-app-content w-full relative z-0 pt-28 md:pt-36 opacity-100">

          <div className="carousel-container w-full max-w-full md:max-w-[1000px] mx-auto aspect-video mb-8 md:mb-16 relative z-10 rounded-none md:rounded-[2rem] overflow-hidden border-y md:border border-slate-200">
            {banners && banners.length > 0 && (
              <MotionCarousel
                banners={banners}
                isReady={!contentLoading}
                options={{ loop: true, align: 'start' }}
              />
            )}
          </div>

          {offers && categories && (
            <OffersSection
              offers={offers}
              categories={categories}
              splashDone={!contentLoading}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default EmployeeBenefits;

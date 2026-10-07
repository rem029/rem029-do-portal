import { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { EmployeeBanner, Media } from "../../../types/payload-types";

// --- icon components ---
const ChevronLeft = () => (
  <svg
    className="w-6 h-6 text-primary"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
  </svg>
);

const ChevronRight = () => (
  <svg
    className="w-6 h-6 text-primary"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
  </svg>
);

interface MotionCarouselProps {
  options?: any;
  isReady?: boolean;
  banners: EmployeeBanner[];
}

export const MotionCarousel = ({ options, isReady = true, banners }: MotionCarouselProps) => {
  // --- state & refs ---
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  // --- embla navigation logic ---
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // --- embla event listeners ---
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // --- gsap entry & slide animations ---
  useGSAP(
    () => {
      // staggered text reveal whenever the slide changes
      const slides = gsap.utils.toArray(".carousel-slide");
      if (!slides.length) return;

      // reset all texts to hidden initially
      gsap.set(".slide-text", { opacity: 0, y: 60, scale: 0.8, filter: "blur(12px)", letterSpacing: "12px" });

      // wait until the splash screen is fully done opening
      if (!isReady) return;

      // animate only the active slide's text
      const activeSlide = slides[selectedIndex] as HTMLElement;
      if (activeSlide) {
        gsap.to(activeSlide.querySelectorAll(".slide-text"), {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          letterSpacing: "normal",
          duration: 0.8,
          stagger: 0.08,
          ease: "expo.out",
          overwrite: "auto",
        });

        // ensure images are perfectly static
        const allImgs = document.querySelectorAll(".slide-bg");
        gsap.set(allImgs, { scale: 1 });
      }

      // pagination bubbles animation
      const dots = gsap.utils.toArray(".pagination-dot");
      dots.forEach((dot: any, i) => {
        const isActive = i === selectedIndex;
        gsap.to(dot, {
          scale: isActive ? 1.5 : 1,
          y: isActive ? -5 : 0,
          opacity: isActive ? 1 : 0.4,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    },
    { scope: containerRef, dependencies: [selectedIndex, isReady, banners] },
  );

  // --- gsap hover interaction handlers ---
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleArrowEnter = contextSafe((e: React.MouseEvent<HTMLButtonElement>, direction: "left" | "right") => {
    const icon = e.currentTarget.querySelector("svg");
    gsap.to(e.currentTarget, { scale: 1.15, y: -5, duration: 0.4, ease: "power3.out", overwrite: "auto" });
    if (icon)
      gsap.to(icon, {
        rotation: direction === "left" ? -360 : 360,
        duration: 0.8,
        ease: "back.out(1.5)",
        overwrite: "auto",
      });
  });

  const handleArrowLeave = contextSafe((e: React.MouseEvent<HTMLButtonElement>) => {
    const icon = e.currentTarget.querySelector("svg");
    gsap.to(e.currentTarget, { scale: 1, y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
    if (icon) gsap.to(icon, { rotation: 0, duration: 0.6, ease: "power2.out", overwrite: "auto" });
  });

  const handleArrowDown = contextSafe((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 0.95, duration: 0.2, ease: "power2.out", overwrite: "auto" });
  });

  const handleArrowUp = contextSafe((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1.15, duration: 0.4, ease: "power3.out", overwrite: "auto" });
  });

  if (!banners || banners.length === 0) return null;

  // --- render jsx ---
  return (
    <div ref={containerRef} className="relative w-full h-full bg-black rounded-none overflow-hidden shadow-2xl">
      <div className="overflow-hidden h-full rounded-none" ref={emblaRef}>
        <div className="flex touch-pan-y h-full">
          {banners.map((banner) => (
            <div key={banner.id} className="carousel-slide relative flex-[0_0_100%] min-w-0 h-full overflow-hidden">
              <>
                {/* bg image */}
                {banner.link ? (
                  <a href={banner.link} className="absolute inset-0 w-full h-full block z-0">
                    <img
                      src={(banner.media as Media)?.url || undefined}
                      alt={banner.name || `Slide ${banner.id}`}
                      className="slide-bg absolute inset-0 w-full h-full object-contain"
                    />
                  </a>
                ) : (
                  <img
                    src={(banner.media as Media)?.url || undefined}
                    alt={banner.name || `Slide ${banner.id}`}
                    className="slide-bg absolute inset-0 w-full h-full object-contain z-0"
                  />
                )}

                {/* <div className="absolute bottom-8 md:bottom-24 left-0 px-6 md:px-32 lg:px-40 w-full z-10 pointer-events-none">
                  <h2 className="slide-text text-3xl md:text-6xl lg:text-7xl font-Baskerville italic font-normal text-white leading-tight mb-1 md:mb-2 line-clamp-2">
                    {banner.name}
                  </h2>
                  <p className="slide-text text-lg md:text-2xl text-white/90 font-Baskerville font-normal max-w-3xl">
                    
                  </p>
                </div> */}
              </>
            </div>
          ))}
        </div>
      </div>

      {/* floating nav buttons - only show if more than 1 banner */}
      {banners.length > 1 && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-20">
            <button
              onClick={scrollPrev}
              onMouseEnter={(e) => handleArrowEnter(e, "left")}
              onMouseLeave={handleArrowLeave}
              onMouseDown={handleArrowDown}
              onMouseUp={(e) => handleArrowUp(e)}
              className="w-14 h-14 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 will-change-transform cursor-pointer"
            >
              <ChevronLeft />
            </button>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-20">
            <button
              onClick={scrollNext}
              onMouseEnter={(e) => handleArrowEnter(e, "right")}
              onMouseLeave={handleArrowLeave}
              onMouseDown={handleArrowDown}
              onMouseUp={(e) => handleArrowUp(e)}
              className="w-14 h-14 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 will-change-transform cursor-pointer"
            >
              <ChevronRight />
            </button>
          </div>
        </>
      )}

      {/* bubbles at the bottom on image carousel - only show if more than 1 banner */}
      {banners.length > 1 && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-3 z-20 pointer-events-auto">
          {banners.map((_, index) => (
            <div
              key={index}
              className={`pagination-dot w-2 h-2 md:w-3 md:h-3 rounded-full bg-white shadow-lg cursor-pointer border border-white/50 will-change-transform ${
                index === selectedIndex ? "opacity-100 scale-125" : "opacity-50"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, { y: -6, scale: 1.5, duration: 0.4, ease: "back.out(2)", overwrite: "auto" });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  y: 0,
                  scale: index === selectedIndex ? 1.25 : 1,
                  duration: 0.4,
                  ease: "power2.out",
                  overwrite: "auto",
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

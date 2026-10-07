import { useEffect, useState, useRef, Fragment } from "react";
import ErrorMessage from "../../common/error-message";
import usePayload from "../../../hooks/use-payload";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { Doc, DocsMedia } from "../../../types/payload-types";

import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { addAnalytics } from "../../../helpers/analytics";
import "./index.css";
import { serializeSlate } from "../../../utils/serialize-slate";

// Import worker locally to avoid CDN fetch issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DocsView = () => {
  const { slug } = useParams();
  const { pathname, search } = useLocation();
  const [formError, setFormError] = useState("");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const flipBookRef = useRef<any>(null);
  const [searchParams] = useSearchParams();

  const {
    error: docError,
    loading: docLoading,
    data: docs,
  } = usePayload<Doc[]>("collections", {
    slug: "docs",
    query: `limit=1&depth=1&where[slug][equals]=${slug}`,
  });

  useEffect(() => {
    const email = (searchParams.get("email") as string) || undefined;
    const data = email
      ? {
          additionalData: { email },
        }
      : undefined;
    addAnalytics("page_view", pathname + search, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (docError) setFormError(docError);
  }, [docError]);

  useEffect(() => {
    if (docs && docs.length > 0) {
      setDoc(docs[0]);
    }
  }, [docs]);

  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(window.innerWidth * 0.7, 1000); // 80% of window width, max 1000px
      const height = Math.min(window.innerHeight * 0.7, 1536); // 80% of window height, max 1536px
      setDimensions({ width, height });
    };

    handleResize(); // Set initial dimensions
    window.addEventListener("resize", handleResize); // Listen for resize events

    return () => {
      window.removeEventListener("resize", handleResize); // Cleanup listener
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const nextPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current?.getPageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current?.getPageFlip().flipPrev();
    }
  };

  const onVideoStart = () => {
    const email = (searchParams.get("email") as string) || undefined;
    const data = email
      ? {
          additionalData: { email },
        }
      : undefined;

    addAnalytics("video_started", pathname + search, data);
  };

  const onVideoEnd = () => {
    const email = (searchParams.get("email") as string) || undefined;
    const data = email
      ? {
          additionalData: { email },
        }
      : undefined;

    addAnalytics("video_ended", pathname + search, data);
  };

  return (
    <div
      className={[
        "w-full h-dvh flex items-center justify-center flex-col p-2 m-0",
        doc?.type === "pdf" ? "bg-gray-600" : "bg-white",
      ].join(" ")}
    >
      <ErrorMessage message={formError} onClose={() => setFormError("")} />

      {docLoading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-lg">Loading document...</p>
        </div>
      )}

      {doc && doc?.type === "pdf" && (
        <div className="h-screen flex items-center justify-center relative w-dvw">
          <HTMLFlipBook
            ref={(el) => (flipBookRef.current = el)}
            width={dimensions.width}
            height={dimensions.height}
            size="stretch"
            minWidth={240}
            maxWidth={1024}
            minHeight={400}
            maxHeight={1024}
            drawShadow={false}
            flippingTime={500}
            useMouseEvents
            showCover
            mobileScrollSupport
            className="flipbook"
            autoSize
            startPage={1}
            usePortrait
            style={{}} // Add a default empty style object or your specific styles
            startZIndex={0} // Default value, adjust as needed
            maxShadowOpacity={1} // Default value, adjust as needed
            swipeDistance={30} // Default value, adjust as needed
            showPageCorners
            disableFlipByClick={false} // Default value, adjust as needed
            clickEventForward
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`}>
                <Document
                  className={`w-[${dimensions.width / 2}px] pdf-page__container`}
                  file={(doc.file as DocsMedia)?.url || ""}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => {
                    console.error("Error loading PDF:", error);
                    setFormError("Failed to load PDF document.");
                  }}
                  loading="Loading PDF..."
                  renderMode="canvas"
                >
                  <Page
                    className={"pdf-page"}
                    width={dimensions.width}
                    height={dimensions.height}
                    pageNumber={index + 1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            ))}
          </HTMLFlipBook>

          {/* Navigation buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={prevPage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={nextPage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {doc && doc?.type === "video" && (
        <div className="h-screen flex flex-col items-center justify-center relative w-dvw max-w-4xl">
          <h1 className="text-left w-full font-Noah-Regular text-primary text-2xl font-bold">
            {doc?.title}
          </h1>
          {doc?.description && doc.description.length > 0}
          <div className="w-full text-gray-500 leading-loose text-sm max-md:text-xs [&_div]:h-2">
            {serializeSlate(doc?.description)?.map((s, idx) => (
              <Fragment key={"description_" + idx}>{s}</Fragment>
            ))}
          </div>
          {doc?.file && (
            <>
              <video
                controls
                itemType="video/mp4"
                preload="metadata"
                src={(doc.file as DocsMedia)?.url || ""}
                className="aspect-video w-full h-auto mt-4"
                onPlay={onVideoStart}
                onEnded={onVideoEnd}
                onError={() => setFormError("Failed to load video.")}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DocsView;

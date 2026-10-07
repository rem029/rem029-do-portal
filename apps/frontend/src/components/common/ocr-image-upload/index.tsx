import { useEffect } from "react";

interface OCRComponentProps {
  imageFile: File | null;
  onTextRecognized: (text: string) => void;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
}

const OCRComponent = ({
  imageFile,
  onTextRecognized,
  onError,
  onLoading,
}: OCRComponentProps): JSX.Element => {
  useEffect(() => {
    if (imageFile) {
      performOCR(imageFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  const performOCR = async (file: File) => {
    try {
      onLoading?.(true);
      const Tesseract = (await import("tesseract.js")).default;
      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log(m),
      });
      onTextRecognized(text);
    } catch (error) {
      console.error("OCR Error:", error);
      onError?.(error as Error);
    } finally {
      onLoading?.(false);
    }
  };

  return <></>;
};

export default OCRComponent;

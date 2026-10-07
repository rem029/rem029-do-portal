import {
  Html5QrcodeCameraScanConfig,
  Html5QrcodeScanner,
  QrcodeErrorCallback,
  QrcodeSuccessCallback,
} from "html5-qrcode";
import { useEffect, useState } from "react";

const qrcodeRegionId = "html5qr-code-full-region";

// Creates the configuration object for Html5QrcodeScanner.
const createConfig = (props: Html5QrcodeCameraScanConfig) => {
  let config: Html5QrcodeCameraScanConfig = {} as Html5QrcodeCameraScanConfig;
  if (props.fps) {
    config.fps = props.fps;
  }
  if (props.qrbox) {
    config.qrbox = props.qrbox;
  }
  if (props.aspectRatio) {
    config.aspectRatio = props.aspectRatio;
  }
  if (props.disableFlip !== undefined) {
    config.disableFlip = props.disableFlip;
  }
  return config;
};

interface Html5QrcodePluginProps {
  fps: number;
  qrbox: number;
  disableFlip: boolean;
  qrCodeSuccessCallback: QrcodeSuccessCallback;
  qrCodeErrorCallback: QrcodeErrorCallback;
  verbose?: boolean;
}

const Html5QrcodePlugin = (props: Html5QrcodePluginProps) => {
  const [isQrCodeRendered, toggleIsQrCodeRendered] = useState<boolean>(false);

  useEffect(() => {
    if (isQrCodeRendered) return;
    // when component mounts
    const config = createConfig(props);
    const verbose = props.verbose === true;
    // Suceess callback is required.
    const html5QrcodeScanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      config,
      verbose
    );
    html5QrcodeScanner.render(
      props.qrCodeSuccessCallback,
      props.qrCodeErrorCallback
    );
    toggleIsQrCodeRendered(true);
    // cleanup function when component will unmount
    return () => {
      html5QrcodeScanner
        .clear()
        .then(() => {
          toggleIsQrCodeRendered(false);
        })
        .catch((error) => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={qrcodeRegionId} className="w-full" />;
};

export default Html5QrcodePlugin;

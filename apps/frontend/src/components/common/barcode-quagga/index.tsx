import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import Quagga from "@ericblade/quagga2";

export interface BarcodeScannerQuaggaProps {
  onDetected: (code: string) => void;
  onError?: (err: any) => void;
  onStart?: () => void;
  onStop?: () => void;
  startOnInit?: boolean;
  containerId?: string;
  deviceId?: string;
}

export interface BarcodeScannerQuaggaRef {
  start: () => void;
  stop: () => void;
}

const BarcodeScannerQuagga = forwardRef<
  BarcodeScannerQuaggaRef,
  BarcodeScannerQuaggaProps
>(
  (
    {
      onDetected,
      onError = (_) => {},
      onStart = () => {},
      onStop = () => {},
      containerId = "scanner-container",
      deviceId = "",
    }: BarcodeScannerQuaggaProps,
    ref
  ) => {
    const [scanning, setScanning] = useState(false);

    const startScanner = () => {
      Quagga.init(
        {
          inputStream: {
            name: "Barcode Scanner",
            type: "LiveStream",
            constraints: {
              width: { min: 640 },
              height: { min: 480 },
              facingMode: deviceId ? undefined : "environment",
              aspectRatio: { min: 1, max: 2 },
              deviceId: deviceId ? { exact: deviceId } : undefined,
            },
            target: document.querySelector(`#${containerId}`) as Element,
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: 4,
          frequency: 10,
          decoder: {
            readers: ["code_128_reader"],
          },
          locate: true,
        },
        (err: any) => {
          if (err) {
            console.error(err);
            onError(err);
            return;
          }
          setScanning(true);
          Quagga.start();
          onStart();
        }
      );
    };

    const stopScanner = () => {
      setScanning(false);
      Quagga.stop();
      onStop();
    };

    useEffect(() => {
      Quagga.onDetected((data: any) => {
        onDetected(data.codeResult.code);
      });

      return () => {
        Quagga.offDetected();
        stopScanner();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      start: () => {
        startScanner();
      },
      stop: () => {
        stopScanner();
      },
    }));

    return (
      <div
        id={containerId}
        className={`w-full h-auto relative ${scanning ? "block" : "hidden"}`}
      >
        <canvas className="drawingBuffer w-full h-full absolute" />
      </div>
    );
  }
);

export default BarcodeScannerQuagga;

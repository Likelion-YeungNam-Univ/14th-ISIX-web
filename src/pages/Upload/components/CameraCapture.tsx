import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const CameraCapture = ({
  onCapture,
  onCancel,
}: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 이전 비동기 카메라 요청을 구분하기 위한 번호
  const requestIdRef = useRef(0);

  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = useCallback(() => {
    // 현재 진행 중인 이전 요청을 무효화
    requestIdRef.current += 1;

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();

    const requestId = ++requestIdRef.current;

    setIsStarting(true);
    setCameraError('');

    let newStream: MediaStream | null = null;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED');
      }

      newStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment',
            },
          },
          audio: false,
        });

      // StrictMode cleanup 등으로 이미 이전 요청이 된 경우
      // 방금 얻은 스트림은 사용하지 않고 종료
      if (requestId !== requestIdRef.current) {
        newStream.getTracks().forEach((track) => {
          track.stop();
        });

        return;
      }

      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;

        await videoRef.current.play();
      }
    } catch (error) {
      // 이미 무효화된 요청의 오류는 화면에 표시하지 않음
      if (requestId !== requestIdRef.current) {
        newStream?.getTracks().forEach((track) => {
          track.stop();
        });

        return;
      }

      console.error('카메라 실행 실패:', error);

      newStream?.getTracks().forEach((track) => {
        track.stop();
      });

      if (
        error instanceof DOMException &&
        error.name === 'NotAllowedError'
      ) {
        setCameraError(
          '카메라 권한이 허용되지 않았습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.',
        );
      } else if (
        error instanceof DOMException &&
        error.name === 'NotFoundError'
      ) {
        setCameraError(
          '사용 가능한 카메라를 찾을 수 없습니다.',
        );
      } else if (
        error instanceof DOMException &&
        error.name === 'NotReadableError'
      ) {
        setCameraError(
          '카메라를 사용할 수 없습니다. 다른 프로그램에서 카메라를 사용 중인지 확인해 주세요.',
        );
      } else {
        setCameraError(
          '카메라를 실행할 수 없습니다. 카메라 연결 상태와 브라우저 권한을 확인해 주세요.',
        );
      }
    } finally {
      // 현재 유효한 요청만 상태 변경
      if (requestId === requestIdRef.current) {
        setIsStarting(false);
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;

    if (
      !video ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setCameraError(
        '카메라 화면을 불러오는 중입니다. 잠시 후 다시 촬영해 주세요.',
      );
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('사진을 처리하지 못했습니다.');
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('사진을 저장하지 못했습니다.');
          return;
        }

        const file = new File(
          [blob],
          `closr-camera-${Date.now()}.jpg`,
          {
            type: 'image/jpeg',
          },
        );

        stopCamera();
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-bg">
      <div className="relative flex min-h-[420px] items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-h-[620px] w-full object-contain"
        />

        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-sm text-white">
              카메라를 준비하고 있습니다...
            </p>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="border-t border-border px-4 py-3">
          <p
            role="alert"
            className="text-sm text-red-400"
          >
            {cameraError}
          </p>

          <button
            type="button"
            onClick={() => void startCamera()}
            className="mt-3 rounded-lg border border-border px-4 py-2 text-sm text-text"
          >
            다시 시도
          </button>
        </div>
      )}

      <div className="flex gap-3 border-t border-border p-4">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text"
        >
          취소
        </button>

        <button
          type="button"
          onClick={handleCapture}
          disabled={isStarting || Boolean(cameraError)}
          className="flex-1 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          촬영
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
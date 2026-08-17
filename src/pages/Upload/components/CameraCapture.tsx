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
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(
      null,
    );

  const requestIdRef =
    useRef(0);

  const [
    isStarting,
    setIsStarting,
  ] = useState(true);

  const [
    cameraError,
    setCameraError,
  ] = useState('');

  /* ================================================ */
  /* CAMERA CONTROL                                   */
  /* ================================================ */

  const stopCamera =
    useCallback(() => {
      requestIdRef.current += 1;

      streamRef.current
        ?.getTracks()
        .forEach(
          (track) => {
            track.stop();
          },
        );

      streamRef.current =
        null;

      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          null;
      }
    }, []);

  const startCamera =
    useCallback(async () => {
      stopCamera();

      const requestId =
        ++requestIdRef.current;

      setIsStarting(true);
      setCameraError('');

      let newStream:
        | MediaStream
        | null = null;

      try {
        if (
          !navigator
            .mediaDevices
            ?.getUserMedia
        ) {
          throw new Error(
            'CAMERA_NOT_SUPPORTED',
          );
        }

        newStream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: {
                  ideal:
                    'environment',
                },
              },
              audio: false,
            },
          );

        if (
          requestId !==
          requestIdRef.current
        ) {
          newStream
            .getTracks()
            .forEach(
              (track) => {
                track.stop();
              },
            );

          return;
        }

        streamRef.current =
          newStream;

        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            newStream;

          await videoRef.current.play();
        }
      } catch (error) {
        if (
          requestId !==
          requestIdRef.current
        ) {
          newStream
            ?.getTracks()
            .forEach(
              (track) => {
                track.stop();
              },
            );

          return;
        }

        console.error(
          '카메라 실행 실패:',
          error,
        );

        newStream
          ?.getTracks()
          .forEach(
            (track) => {
              track.stop();
            },
          );

        if (
          error instanceof
            DOMException &&
          error.name ===
            'NotAllowedError'
        ) {
          setCameraError(
            '카메라 권한이 허용되지 않았습니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.',
          );
        } else if (
          error instanceof
            DOMException &&
          error.name ===
            'NotFoundError'
        ) {
          setCameraError(
            '사용 가능한 카메라를 찾을 수 없습니다.',
          );
        } else if (
          error instanceof
            DOMException &&
          error.name ===
            'NotReadableError'
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
        if (
          requestId ===
          requestIdRef.current
        ) {
          setIsStarting(
            false,
          );
        }
      }
    }, [stopCamera]);

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [
    startCamera,
    stopCamera,
  ]);

  /* ================================================ */
  /* CAPTURE                                          */
  /* ================================================ */

  const handleCapture =
    () => {
      const video =
        videoRef.current;

      if (
        !video ||
        video.videoWidth ===
          0 ||
        video.videoHeight ===
          0
      ) {
        setCameraError(
          '카메라 화면을 불러오는 중입니다. 잠시 후 다시 촬영해 주세요.',
        );

        return;
      }

      const canvas =
        document.createElement(
          'canvas',
        );

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      const context =
        canvas.getContext(
          '2d',
        );

      if (!context) {
        setCameraError(
          '사진을 처리하지 못했습니다.',
        );

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
            setCameraError(
              '사진을 저장하지 못했습니다.',
            );

            return;
          }

          const file =
            new File(
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

  const handleCancel =
    () => {
      stopCamera();
      onCancel();
    };

  return (
    <section className="flex min-h-[calc(100dvh-40px)] flex-col bg-[#080808] text-[#F0EBE2]">
      {/* ============================================ */}
      {/* HEADER                                       */}
      {/* ============================================ */}

      <header className="flex h-[52px] items-center border-b border-white/[0.07]">
        <button
          type="button"
          onClick={
            handleCancel
          }
          aria-label="촬영 취소"
          className="flex h-[36px] w-[36px] items-center justify-start text-[#F0EBE2]"
        >
          <BackIcon className="h-[20px] w-[20px]" />
        </button>

        <span
          className="text-[14px] font-medium leading-[21px] text-[#F0EBE2]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          전신 사진 촬영
        </span>
      </header>

      {/* ============================================ */}
      {/* DESCRIPTION                                  */}
      {/* ============================================ */}

      <div className="pb-[15px] pt-[18px] text-center">
        <h1
          className="text-[17px] font-medium leading-[25px] text-[#F0EBE2]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          전신이 모두 나오도록
          촬영해주세요
        </h1>

        <p
          className="mt-[6px] text-[10px] leading-[15px] text-[#9A9490]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          머리부터 발끝까지 화면
          안에 들어오도록 맞춰주세요.
        </p>
      </div>

      {/* ============================================ */}
      {/* CAMERA VIEW                                  */}
      {/* ============================================ */}

      <div className="relative flex min-h-[500px] flex-1 items-center justify-center overflow-hidden rounded-[12px] border border-white/[0.07] bg-[#141414]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full min-h-[500px] w-full object-cover"
        />

        {/* GUIDE BORDER */}

        {!cameraError && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[18px] rounded-[10px] border border-white/25"
          >
            <span className="absolute left-[-1px] top-[-1px] h-[32px] w-[32px] rounded-tl-[10px] border-l-2 border-t-2 border-[#C9A96E]" />

            <span className="absolute right-[-1px] top-[-1px] h-[32px] w-[32px] rounded-tr-[10px] border-r-2 border-t-2 border-[#C9A96E]" />

            <span className="absolute bottom-[-1px] left-[-1px] h-[32px] w-[32px] rounded-bl-[10px] border-b-2 border-l-2 border-[#C9A96E]" />

            <span className="absolute bottom-[-1px] right-[-1px] h-[32px] w-[32px] rounded-br-[10px] border-b-2 border-r-2 border-[#C9A96E]" />
          </div>
        )}

        {/* STARTING */}

        {isStarting &&
          !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75">
              <div className="h-[24px] w-[24px] animate-spin rounded-full border-2 border-white/20 border-t-[#C9A96E]" />

              <p
                className="mt-[12px] text-[11px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                카메라를 준비하고
                있습니다.
              </p>
            </div>
          )}

        {/* ERROR */}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141414] px-[24px] text-center">
            <CameraIcon className="h-[34px] w-[34px] text-[#77716E]" />

            <p
              role="alert"
              className="mt-[15px] text-[11px] leading-[18px] text-[#9A9490]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {cameraError}
            </p>

            <button
              type="button"
              onClick={() =>
                void startCamera()
              }
              className="mt-[20px] h-[40px] rounded-[6px] border border-[#C9A96E]/50 px-[18px] text-[11px] font-medium text-[#C9A96E]"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BOTTOM CONTROL                               */}
      {/* ============================================ */}

      <div className="pb-[12px] pt-[20px]">
        <p
          className="mb-[13px] text-center text-[9px] leading-[14px] text-[#77716E]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          밝은 곳에서 정면을 바라보고
          촬영해주세요.
        </p>

        <div className="grid grid-cols-[88px_1fr] gap-[10px]">
          <button
            type="button"
            onClick={
              handleCancel
            }
            className="h-[52px] rounded-[8px] border border-white/[0.09] bg-[#141414] text-[12px] font-medium text-[#9A9490]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            취소
          </button>

          <button
            type="button"
            onClick={
              handleCapture
            }
            disabled={
              isStarting ||
              Boolean(
                cameraError,
              )
            }
            className="flex h-[52px] items-center justify-center gap-[8px] rounded-[8px] bg-[#C9A96E] text-[13px] font-semibold text-[#13100A] disabled:cursor-not-allowed disabled:bg-[#191919] disabled:text-[#44413F]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            <CameraIcon className="h-[18px] w-[18px]" />
            촬영하기
          </button>
        </div>
      </div>
    </section>
  );
};

export default CameraCapture;

/* ================================================== */
/* ICON                                               */
/* ================================================== */

function BackIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M26.8307 22.1645C26.8307 22.7833 26.5849 23.3767 26.1473 23.8143C25.7098 24.2518 25.1164 24.4976 24.4976 24.4976H3.49961C2.88083 24.4976 2.2874 24.2518 1.84986 23.8143C1.41231 23.3767 1.1665 22.7833 1.1665 22.1645V9.3324C1.1665 8.71363 1.41231 8.12019 1.84986 7.68265C2.2874 7.24511 2.88083 6.9993 3.49961 6.9993H8.16583L10.4989 3.49963H17.4983L19.8314 6.9993H24.4976C25.1164 6.9993 25.7098 7.24511 26.1473 7.68265C26.5849 8.12019 26.8307 8.71363 26.8307 9.3324V22.1645Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />

      <path
        d="M13.9987 19.8314C16.5758 19.8314 18.665 17.7423 18.665 15.1652C18.665 12.5881 16.5758 10.499 13.9987 10.499C11.4217 10.499 9.33252 12.5881 9.33252 15.1652C9.33252 17.7423 11.4217 19.8314 13.9987 19.8314Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}
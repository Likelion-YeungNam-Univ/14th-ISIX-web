import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import CameraCapture from './CameraCapture';

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
];

interface PhotoUploaderProps {
  photo: File | null;
  onPhotoChange: (
    photo: File | null,
  ) => void;
}

const PHOTO_GUIDE = [
  '머리끝부터 발끝까지 모두 나오게 촬영해주세요.',
  '정면을 보고 똑바로 서주세요.',
  '양팔을 몸에서 30~45도 벌려주세요.',
  '몸의 실루엣이 드러나는 옷을 입어주세요.',
  '머리는 낮게 묶어주세요.',
  '맨발로 촬영해주세요.',
  '배경이 단순한 곳에서 2~3m 떨어져 촬영해주세요.',
];

const PhotoUploader = ({
  photo,
  onPhotoChange,
}: PhotoUploaderProps) => {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(
    null,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isAlbumSheetOpen,
    setIsAlbumSheetOpen,
  ] = useState(false);

  const [
    isCameraGuideOpen,
    setIsCameraGuideOpen,
  ] = useState(false);

  const [
    isCameraOpen,
    setIsCameraOpen,
  ] = useState(false);

  /* ================================================ */
  /* PREVIEW                                          */
  /* ================================================ */

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl =
      URL.createObjectURL(photo);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(
        objectUrl,
      );
    };
  }, [photo]);

  /* ================================================ */
  /* FILE VALIDATION                                  */
  /* ================================================ */

  const validatePhoto = (
    file: File,
  ) => {
    if (
      !ACCEPTED_FILE_TYPES.includes(
        file.type,
      )
    ) {
      setErrorMessage(
        'JPEG 또는 PNG 형식의 사진만 사용할 수 있습니다.',
      );

      return false;
    }

    if (
      file.size > MAX_FILE_SIZE
    ) {
      setErrorMessage(
        '사진 용량은 10MB 이하여야 합니다.',
      );

      return false;
    }

    setErrorMessage('');

    return true;
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      !validatePhoto(
        selectedFile,
      )
    ) {
      onPhotoChange(null);

      event.target.value = '';

      return;
    }

    onPhotoChange(
      selectedFile,
    );

    setIsAlbumSheetOpen(
      false,
    );

    event.target.value = '';
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  /* ================================================ */
  /* CAMERA                                           */
  /* ================================================ */

  const handleCameraCapture = (
    file: File,
  ) => {
    if (!validatePhoto(file)) {
      onPhotoChange(null);
      return;
    }

    onPhotoChange(file);
    setIsCameraOpen(false);
  };

  /* ================================================ */
  /* PHOTO ACTION                                     */
  /* ================================================ */

  const handleRemovePhoto =
    () => {
      onPhotoChange(null);
      setErrorMessage('');
    };

  return (
    <>
      <section>
        {/* ========================================== */}
        {/* SECTION TITLE                              */}
        {/* ========================================== */}

        <div className="flex items-center gap-[10px]">
          <span
            className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-[#C9A96E]/50 bg-[#C9A96E]/10 text-[10px] text-[#C9A96E]"
            style={{
              fontFamily:
                '"DM Mono", monospace',
            }}
          >
            2
          </span>

          <h2
            className="text-[12px] font-medium leading-[18px] tracking-[0.2px] text-[#9A9490]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            전신 사진 등록
          </h2>
        </div>

        {/* ========================================== */}
        {/* PHOTO AREA                                 */}
        {/* ========================================== */}

        <div className="mt-[12px] overflow-hidden rounded-[12px] border border-white/[0.07] bg-[#141414]">
          {!previewUrl ? (
            <div className="px-[25px] pb-[32px] pt-[34px]">
              {/* CAMERA ICON */}

              <div className="flex flex-col items-center">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] border border-white/[0.07] bg-[#202020]">
                  <CameraIcon className="h-[28px] w-[28px] text-[#9A9490]" />
                </div>

                <p
                  className="mt-[13px] text-[13px] font-normal leading-[19.5px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  사진 등록하기
                </p>
              </div>

              {/* BUTTONS */}

              <div className="mt-[27px] grid grid-cols-2 gap-[19px]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(
                      '',
                    );

                    setIsAlbumSheetOpen(
                      true,
                    );
                  }}
                  className="flex h-[47px] items-center justify-center gap-[8px] rounded-[8px] border border-white/[0.07] bg-[#1E1E1E] text-[#D7D2CA]"
                >
                  <AlbumIcon className="h-[16px] w-[16px] text-[#9A9490]" />

                  <span
                    className="text-[12px] font-medium"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    앨범에서 선택
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(
                      '',
                    );

                    setIsCameraGuideOpen(
                      true,
                    );
                  }}
                  className="flex h-[47px] items-center justify-center gap-[8px] rounded-[8px] border border-white/[0.07] bg-[#1E1E1E] text-[#D7D2CA]"
                >
                  <SmallCameraIcon className="h-[16px] w-[16px] text-[#9A9490]" />

                  <span
                    className="text-[12px] font-medium"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    직접 촬영하기
                  </span>
                </button>
              </div>

              {/* GUIDE */}

              <div className="mt-[20px] rounded-[8px] border border-white/[0.07] bg-[#202020] px-[15px] py-[13px]">
                <p
                  className="text-[10px] font-normal leading-[17px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  <span className="mr-[6px] text-[#C9A96E]">
                    *
                  </span>
                  머리부터 발끝까지 나온
                  정면 사진 1장을
                  등록해주세요.
                  <br />
                  <span className="ml-[12px]">
                    밝은 배경에서 몸
                    전체가 보이도록
                    촬영하면 정확도가
                    높아집니다.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            /* ====================================== */
            /* SELECTED PHOTO                         */
            /* ====================================== */

            <div>
              <div className="relative flex h-[338px] items-center justify-center overflow-hidden bg-[#1B1B1B]">
                <img
                  src={previewUrl}
                  alt="등록한 전신 사진 미리보기"
                  className="h-full w-full object-contain"
                />

                <button
                  type="button"
                  onClick={
                    handleRemovePhoto
                  }
                  aria-label="사진 삭제"
                  className="absolute right-[12px] top-[12px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <CloseIcon className="h-[13px] w-[13px]" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-[10px] border-t border-white/[0.07] px-[14px] py-[12px]">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[11px] font-medium text-[#F0EBE2]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    {photo?.name}
                  </p>

                  <p
                    className="mt-[2px] text-[9px] text-[#77716E]"
                    style={{
                      fontFamily:
                        '"DM Mono", monospace',
                    }}
                  >
                    {photo
                      ? `${(
                          photo.size /
                          1024 /
                          1024
                        ).toFixed(
                          1,
                        )}MB`
                      : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsAlbumSheetOpen(
                      true,
                    )
                  }
                  className="h-[31px] shrink-0 rounded-[5px] border border-[#C9A96E]/40 px-[12px] text-[10px] text-[#C9A96E]"
                >
                  다시 선택
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* ERROR                                      */}
        {/* ========================================== */}

        {errorMessage && (
          <p
            role="alert"
            className="mt-[8px] text-[10px] leading-[15px] text-red-400"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            {errorMessage}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={
            handleFileChange
          }
          className="sr-only"
        />
      </section>

      {/* ============================================ */}
      {/* ALBUM BOTTOM SHEET                           */}
      {/* ============================================ */}

      {isAlbumSheetOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-end bg-black/70"
            onClick={() =>
              setIsAlbumSheetOpen(
                false,
              )
            }
          >
            <section
              className="mx-auto w-full max-w-[402px] rounded-t-[26px] border-t border-white/[0.07] bg-[#141414] px-[20px] pb-[45px] pt-[11px]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* HANDLE */}

              <div className="mx-auto h-[5px] w-[38px] rounded-full bg-white/[0.10]" />

              {/* ICON */}

              <div className="mt-[23px] flex justify-center">
                <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[18px] border border-[#C9A96E]/50">
                  <AlbumLargeIcon className="h-[36px] w-[36px] text-[#9A9490]" />
                </div>
              </div>

              <h3
                className="mt-[14px] text-center text-[17px] font-medium leading-[25.5px] text-[#F0EBE2]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                앨범에서 사진 선택
              </h3>

              <p
                className="mt-[8px] text-center text-[11px] leading-[16.5px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                전신이 나온 정면 사진을
                선택해주세요.
              </p>

              {/* UPLOAD BOX */}

              <button
                type="button"
                onClick={
                  openFilePicker
                }
                className="mt-[28px] flex h-[245px] w-full flex-col items-center justify-center rounded-[6px] border border-dashed border-white/[0.08] bg-[#1B1B1B]"
              >
                <FolderIcon className="h-[35px] w-[35px] text-white/50" />

                <span
                  className="mt-[14px] text-[12px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  사진 업로드하기
                </span>

                <span
                  className="mt-[6px] text-[9px] text-[#5E5A57]"
                  style={{
                    fontFamily:
                      '"DM Mono", monospace',
                  }}
                >
                  JPEG · PNG / 최대
                  10MB
                </span>
              </button>

              <button
                type="button"
                onClick={
                  openFilePicker
                }
                className="mt-[20px] h-[55px] w-full rounded-[8px] bg-[#C9A96E] text-[14px] font-semibold text-[#13100A]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                앨범에서 선택
              </button>
            </section>
          </div>,
          document.body,
        )}

      {/* ============================================ */}
      {/* CAMERA GUIDE BOTTOM SHEET                    */}
      {/* ============================================ */}

      {isCameraGuideOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-end bg-black/70"
            onClick={() =>
              setIsCameraGuideOpen(
                false,
              )
            }
          >
            <section
              className="mx-auto w-full max-w-[402px] rounded-t-[26px] border-t border-white/[0.07] bg-[#141414] px-[20px] pb-[27px] pt-[11px]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="mx-auto h-[5px] w-[38px] rounded-full bg-white/[0.10]" />

              <div className="mt-[23px] flex justify-center">
                <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[18px] border border-[#C9A96E]/50">
                  <CameraIcon className="h-[32px] w-[32px] text-[#9A9490]" />
                </div>
              </div>

              <h3
                className="mt-[14px] text-center text-[17px] font-medium leading-[25.5px] text-[#F0EBE2]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                전신 사진 촬영하기
              </h3>

              <p
                className="mt-[8px] text-center text-[11px] leading-[16.5px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                아래 가이드에 맞춰
                전신 사진을
                촬영해주세요.
              </p>

              <div className="mt-[23px] rounded-[8px] border border-white/[0.07] bg-[#202020] px-[10px] py-[13px]">
                <ol
                  className="text-[10px] leading-[16px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  {PHOTO_GUIDE.map(
                    (
                      guide,
                      index,
                    ) => (
                      <li
                        key={guide}
                      >
                        {index +
                          1}
                        . {guide}
                      </li>
                    ),
                  )}
                </ol>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCameraGuideOpen(
                    false,
                  );

                  setIsCameraOpen(
                    true,
                  );
                }}
                className="mt-[26px] h-[55px] w-full rounded-[8px] bg-[#C9A96E] text-[14px] font-semibold text-[#13100A]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                촬영하기
              </button>
            </section>
          </div>,
          document.body,
        )}

      {/* ============================================ */}
      {/* CAMERA                                       */}
      {/* ============================================ */}

      {isCameraOpen &&
        createPortal(
          <div className="fixed inset-0 z-[130] overflow-y-auto bg-black">
            <div className="mx-auto min-h-[100dvh] w-full max-w-[402px] bg-[#080808] px-[14px] py-[20px]">
              <CameraCapture
                onCapture={
                  handleCameraCapture
                }
                onCancel={() =>
                  setIsCameraOpen(
                    false,
                  )
                }
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default PhotoUploader;

/* ================================================== */
/* ICONS                                              */
/* ================================================== */

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

function SmallCameraIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <CameraIcon
      className={
        className
      }
    />
  );
}

function AlbumIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.6605 1.999H3.3317C2.5957 1.999 1.999 2.5957 1.999 3.3317V12.6605C1.999 13.3965 2.5957 13.9932 3.3317 13.9932H12.6605C13.3965 13.9932 13.9932 13.3965 13.9932 12.6605V3.3317C13.9932 2.5957 13.3965 1.999 12.6605 1.999Z"
        stroke="currentColor"
        strokeWidth="1.33"
      />

      <path
        d="M5.6638 6.6634C6.2158 6.6634 6.6633 6.2159 6.6633 5.6639C6.6633 5.1119 6.2158 4.6644 5.6638 4.6644C5.1118 4.6644 4.6643 5.1119 4.6643 5.6639C4.6643 6.2159 5.1118 6.6634 5.6638 6.6634Z"
        stroke="currentColor"
        strokeWidth="1.33"
      />

      <path
        d="M13.9933 9.9951L10.6615 6.6634L3.3318 13.9931"
        stroke="currentColor"
        strokeWidth="1.33"
      />
    </svg>
  );
}

function AlbumLargeIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="6"
        width="30"
        height="28"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="14"
        cy="14"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M6 30L17 19L23 25L27 21L35 29"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 35 35"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M33.2719 15.2865C33.0944 15.0405 32.8611 14.8402 32.5911 14.7021C32.321 14.564 32.022 14.4921 31.7188 14.4922H29.2578V12.0312C29.2578 11.5236 29.0562 11.0368 28.6972 10.6778C28.3382 10.3188 27.8514 10.1172 27.3438 10.1172H17.7734L13.9098 7.21875C13.5782 6.97079 13.1754 6.83653 12.7613 6.83594H5.46875C4.96111 6.83594 4.47426 7.0376 4.1153 7.39655C3.75635 7.75551 3.55469 8.24236 3.55469 8.75V28.4375C3.55469 28.6551 3.64111 28.8637 3.79495 29.0175C3.94879 29.1714 4.15744 29.2578 4.375 29.2578H28.8613C29.0334 29.2578 29.2011 29.2036 29.3407 29.103C29.4803 29.0024 29.5848 28.8605 29.6393 28.6973L33.5344 17.0119C33.6305 16.7241 33.6569 16.4176 33.6112 16.1176C33.5656 15.8176 33.4493 15.5327 33.2719 15.2865Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 3L13 13M13 3L3 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
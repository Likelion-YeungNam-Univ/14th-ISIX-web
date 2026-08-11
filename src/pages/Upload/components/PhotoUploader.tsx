import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import CameraCapture from './CameraCapture';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
];

type PhotoInputMode = 'camera' | 'upload';

type PhotoInputStep =
  | 'method'
  | 'guide'
  | 'camera'
  | 'preview';

interface PhotoUploaderProps {
  photo: File | null;
  onPhotoChange: (photo: File | null) => void;
}

const PHOTO_GUIDE = [
  '머리끝부터 발끝까지 모두 나오게 촬영해주세요.',
  '정면을 보고 똑바로 서주세요.',
  '양팔을 몸에서 30~45도 벌려주세요.',
  '몸의 실루엣이 드러나는 옷을 입어주세요.',
  '머리는 낮게 묶어주세요.',
  '맨발로 촬영해주세요.',
  '배경이 단순한 곳에서, 2~3m 떨어져 촬영해주세요.',
];

const PhotoUploader = ({
  photo,
  onPhotoChange,
}: PhotoUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] =
    useState<PhotoInputMode | null>(null);

  const [step, setStep] =
    useState<PhotoInputStep>('method');

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photo);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);

  const validatePhoto = (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setErrorMessage(
        'JPEG 또는 PNG 형식의 사진만 사용할 수 있습니다.',
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        '사진 용량은 10MB 이하여야 합니다.',
      );
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleSelectMode = (
    selectedMode: PhotoInputMode,
  ) => {
    onPhotoChange(null);

    setMode(selectedMode);
    setStep('guide');
    setErrorMessage('');
  };

  const handleGuideContinue = () => {
    if (mode === 'camera') {
      setStep('camera');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!validatePhoto(selectedFile)) {
      onPhotoChange(null);
      event.target.value = '';
      return;
    }

    onPhotoChange(selectedFile);
    setStep('preview');

    event.target.value = '';
  };

  const handleCameraCapture = (file: File) => {
    if (!validatePhoto(file)) {
      onPhotoChange(null);
      return;
    }

    onPhotoChange(file);
    setStep('preview');
  };

  const handleRetryPhoto = () => {
    onPhotoChange(null);
    setErrorMessage('');

    if (mode === 'camera') {
      setStep('camera');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
    setErrorMessage('');
    setStep('guide');
  };

  const handleChangeMethod = () => {
    onPhotoChange(null);

    setMode(null);
    setStep('method');
    setErrorMessage('');
  };

  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-text">
          전신 사진
        </h2>

        <p className="mt-1 text-sm text-text-sub">
          아바타 생성을 위한 전신 사진을 등록해 주세요.
        </p>
      </div>

      {step === 'method' && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              handleSelectMode('camera')
            }
            className="rounded-xl border border-border bg-bg p-6 text-left transition-colors hover:border-gold"
          >
            <p className="font-semibold text-text">
              사진 촬영
            </p>

            <p className="mt-2 text-sm leading-6 text-text-sub">
              카메라를 이용해 새로운 전신 사진을
              촬영합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleSelectMode('upload')
            }
            className="rounded-xl border border-border bg-bg p-6 text-left transition-colors hover:border-gold"
          >
            <p className="font-semibold text-text">
              사진 업로드
            </p>

            <p className="mt-2 text-sm leading-6 text-text-sub">
              기기에 저장된 기존 전신 사진을
              선택합니다.
            </p>
          </button>
        </div>
      )}

      {step === 'guide' && mode && (
        <div className="mt-5 rounded-xl border border-border bg-bg p-5 sm:p-6">
          <p className="text-sm font-semibold text-gold">
            촬영 전 확인
          </p>

          <h3 className="mt-2 text-xl font-semibold text-text">
            사진 업로드 가이드
          </h3>

          <p className="mt-2 text-sm leading-6 text-text-sub">
            정확한 체형 분석을 위해 아래 조건을
            확인해 주세요.
          </p>

          <ol className="mt-6 space-y-3">
            {PHOTO_GUIDE.map(
              (guide, index) => (
                <li
                  key={guide}
                  className="flex gap-3 text-sm leading-6 text-text"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-gold">
                    {index + 1}
                  </span>

                  <span>{guide}</span>
                </li>
              ),
            )}
          </ol>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleChangeMethod}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text"
            >
              이전
            </button>

            <button
              type="button"
              onClick={handleGuideContinue}
              className="flex-1 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-bg"
            >
              {mode === 'camera'
                ? '카메라 열기'
                : '사진 선택'}
            </button>
          </div>
        </div>
      )}

      {step === 'camera' &&
        mode === 'camera' && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={() =>
              setStep('guide')
            }
          />
        )}

      {step === 'preview' &&
        previewUrl && (
          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-bg">
            <div className="flex min-h-80 items-center justify-center p-4">
              <img
                src={previewUrl}
                alt="등록한 전신 사진 미리보기"
                className="max-h-[420px] w-full object-contain"
              />
            </div>

            <div className="border-t border-border px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {photo?.name}
                </p>

                <p className="mt-1 text-xs text-text-sub">
                  {photo
                    ? `${(
                        photo.size /
                        1024 /
                        1024
                      ).toFixed(1)}MB`
                    : ''}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRetryPhoto}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text transition-colors hover:border-gold hover:text-gold"
                >
                  {mode === 'camera'
                    ? '다시 촬영'
                    : '다시 선택'}
                </button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text transition-colors hover:border-gold hover:text-gold"
                >
                  사진 삭제
                </button>

                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-sub transition-colors hover:text-text"
                >
                  입력 방식 변경
                </button>
              </div>
            </div>
          </div>
        )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-400"
        >
          {errorMessage}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="sr-only"
      />

      <p className="mt-3 text-xs text-text-sub">
        JPEG · PNG / 최대 10MB
      </p>
    </section>
  );
};

export default PhotoUploader;
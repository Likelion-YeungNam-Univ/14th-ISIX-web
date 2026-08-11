import { ChangeEvent, useEffect, useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png'];

interface PhotoUploaderProps {
  photo: File | null;
  onPhotoChange: (photo: File | null) => void;
}

const PhotoUploader = ({
  photo,
  onPhotoChange,
}: PhotoUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setErrorMessage('JPEG 또는 PNG 형식의 사진만 업로드할 수 있습니다.');
      onPhotoChange(null);
      event.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage('사진 용량은 10MB 이하여야 합니다.');
      onPhotoChange(null);
      event.target.value = '';
      return;
    }

    setErrorMessage('');
    onPhotoChange(selectedFile);
  };

  const handleRemovePhoto = () => {
    setErrorMessage('');
    onPhotoChange(null);
  };

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">전신 사진</h2>
          <p className="mt-1 text-sm text-text-sub">
            정면을 바라보고 전신이 모두 보이는 사진을 선택해 주세요.
          </p>
        </div>

        <span className="shrink-0 text-xs text-text-sub">
          JPEG · PNG / 최대 10MB
        </span>
      </div>

      <div className="mt-4">
        {previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-border bg-bg">
            <div className="flex min-h-80 items-center justify-center p-4">
              <img
                src={previewUrl}
                alt="선택한 전신 사진 미리보기"
                className="max-h-[420px] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {photo?.name}
                </p>
                <p className="mt-1 text-xs text-text-sub">
                  {photo
                    ? `${(photo.size / 1024 / 1024).toFixed(1)}MB`
                    : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemovePhoto}
                className="shrink-0 rounded-lg border border-border px-4 py-2 text-sm text-text transition-colors hover:border-gold hover:text-gold"
              >
                사진 삭제
              </button>
            </div>
          </div>
        ) : (
          <label className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg px-6 text-center transition-colors hover:border-gold">
            <span className="text-lg font-medium text-text">
              사진을 선택해 주세요
            </span>

            <span className="mt-2 text-sm leading-6 text-text-sub">
              사진은 분석에만 사용하며
              <br />
              JPEG 또는 PNG 파일을 지원합니다.
            </span>

            <span className="mt-6 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-bg">
              사진 선택
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-fit-tight">
          {errorMessage}
        </p>
      )}
    </section>
  );
};

export default PhotoUploader;
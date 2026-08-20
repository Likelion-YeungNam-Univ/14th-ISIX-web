import {
  type FormEvent,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { createAvatar } from '@/api/avatar';
import { ensureGuestSession } from '@/api/session';

import BodyInfoForm, {
  type BodyInfo,
} from './components/BodyInfoForm';
import PhotoUploader from './components/PhotoUploader';
import HomeLogo from '@/components/common/HomeLogo';

interface UploadPageState {
  garmentId?: number;
}

const Upload = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pageState =
    location.state as UploadPageState | null;

  const [photo, setPhoto] =
    useState<File | null>(null);

  const [bodyInfo, setBodyInfo] =
    useState<BodyInfo>({
      height: '',
      weight: '',
    });

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState('');

  const height =
    Number(bodyInfo.height);

  const weight =
    Number(bodyInfo.weight);

  const isHeightValid =
    bodyInfo.height !== '' &&
    height >= 130 &&
    height <= 200;

  const isWeightValid =
    bodyInfo.weight !== '' &&
    weight >= 30 &&
    weight <= 150;

  const isFormValid =
    photo !== null &&
    isHeightValid &&
    isWeightValid;

  const helperMessage =
    !photo
      ? '전신 사진을 등록해주세요'
      : !isHeightValid ||
          !isWeightValid
        ? '신체 정보를 확인해주세요'
        : '';

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !isFormValid ||
      !photo ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await ensureGuestSession();

      const { jobId } =
        await createAvatar(
          photo,
          height,
          weight,
        );

      navigate('/processing', {
        state: {
          jobId,
          height,
          weight,
          garmentId:
            pageState?.garmentId,
        },
      });
    } catch (error) {
      console.error(
        '아바타 생성 요청 실패:',
        error,
      );

      setSubmitError(
        '아바타 생성 요청에 실패했습니다. 서버 연결 상태를 확인한 뒤 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#F0EBE2]">
      <div className="mx-auto min-h-screen w-[402px] max-w-full overflow-hidden bg-[#080808]">
        {/* Header */}
        <header className="flex h-[46px] items-center border-b border-white/10 bg-[#080808] px-[14px]">
          <HomeLogo className="text-[20px] font-normal leading-[30px] tracking-[1.2px] text-[#F0EBE2]" />
        </header>

        <form
          onSubmit={handleSubmit}
          className="px-[20px] pt-[18px]"
        >
          {/* Intro */}
          <header>
            <h1
              className="text-[22px] font-normal leading-[30px] tracking-[-0.3px] text-[#F0EBE2]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              나만의 3D 아바타 만들기
            </h1>

            <p
              className="mt-[4px] text-[10px] leading-[16px] text-[#8F8985]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              정확한 핏 연산을 위해 신체
              정보와 사진을 등록해주세요.
            </p>
          </header>

          {/* Step 1 */}
          <div className="mt-[31px]">
            <BodyInfoForm
              bodyInfo={bodyInfo}
              onBodyInfoChange={
                setBodyInfo
              }
            />
          </div>

          {/* Step 2 */}
          <div className="mt-[25px]">
            <PhotoUploader
              photo={photo}
              onPhotoChange={
                setPhoto
              }
            />
          </div>

          {/* API error */}
          {submitError && (
            <div className="mt-[10px] rounded-[7px] border border-red-400/20 bg-red-400/[0.06] px-[12px] py-[9px]">
              <p
                role="alert"
                className="text-[10px] leading-[15px] text-red-400"
              >
                {submitError}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={
              !isFormValid ||
              isSubmitting
            }
            className={[
              'mt-[13px] flex h-[54px] w-full items-center justify-center rounded-[11px]',
              'text-[14px] font-semibold transition-colors',
              isFormValid &&
              !isSubmitting
                ? 'bg-[#E4B662] text-[#13100A]'
                : 'cursor-not-allowed border border-white/[0.06] bg-[#141414] text-[#44413F]',
            ].join(' ')}
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            {isSubmitting
              ? '아바타 생성 중...'
              : '3D 아바타 생성하기'}
          </button>

          {helperMessage && (
            <p
              className="mt-[8px] text-center text-[10px] leading-[15px] text-[#4F4B48]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {helperMessage}
            </p>
          )}
        </form>
      </div>
    </main>
  );
};

export default Upload;
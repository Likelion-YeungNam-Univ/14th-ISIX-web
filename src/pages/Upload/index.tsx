import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAvatar } from '../../api/avatar';
import { ensureGuestSession } from '@/api/session';

import BodyInfoForm, {
  type BodyInfo,
} from './components/BodyInfoForm';
import PhotoUploader from './components/PhotoUploader';

const Upload = () => {
  const navigate = useNavigate();

  const [photo, setPhoto] = useState<File | null>(null);
  const [bodyInfo, setBodyInfo] = useState<BodyInfo>({
    height: '',
    weight: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const height = Number(bodyInfo.height);
  const weight = Number(bodyInfo.weight);

  const isHeightValid =
    bodyInfo.height !== '' && height >= 130 && height <= 200;

  const isWeightValid =
    bodyInfo.weight !== '' && weight >= 30 && weight <= 150;

  const isFormValid = photo !== null && isHeightValid && isWeightValid;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || !photo || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await ensureGuestSession();

      const { jobId } = await createAvatar(
        photo,
        Number(bodyInfo.height),
        Number(bodyInfo.weight),
      );

      navigate('/processing', {
        state: {
          jobId,
          height: Number(bodyInfo.height),
          weight: Number(bodyInfo.weight),
        },
      });
    } catch (error) {
      console.error('아바타 생성 요청 실패:', error);
      setSubmitError(
        '아바타 생성 요청에 실패했습니다. 서버 연결 상태를 확인한 뒤 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <p className="text-sm font-semibold text-gold">STEP 1</p>

          <h1 className="mt-3 text-3xl font-semibold text-text sm:text-4xl">
            나만의 3D 아바타 만들기
          </h1>

          <p className="mt-4 leading-7 text-text-sub">
            전신 사진과 신체 정보를 입력하면 가상 피팅에 사용할 아바타를
            생성합니다.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
          <PhotoUploader
            photo={photo}
            onPhotoChange={setPhoto}
          />

          {photo && (
            <>
              <div className="border-t border-border" />

              <BodyInfoForm
                bodyInfo={bodyInfo}
                onBodyInfoChange={setBodyInfo}
              />

              {submitError && (
                <p className="mt-4 text-sm text-red-400">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full rounded-xl bg-gold px-5 py-4 font-semibold text-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting
                  ? '요청 중...'
                  : '아바타 생성하기'}
              </button>

              {!isFormValid && (
                <p className="text-center text-sm text-text-sub">
                  올바른 신체 정보를 입력해 주세요.
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </main>
  );
};

export default Upload;
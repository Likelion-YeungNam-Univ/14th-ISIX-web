import { ChangeEvent } from 'react';

export interface BodyInfo {
  height: string;
  weight: string;
}

interface BodyInfoFormProps {
  bodyInfo: BodyInfo;
  onBodyInfoChange: (bodyInfo: BodyInfo) => void;
}

const BodyInfoForm = ({
  bodyInfo,
  onBodyInfoChange,
}: BodyInfoFormProps) => {
  const handleChange =
    (field: keyof BodyInfo) => (event: ChangeEvent<HTMLInputElement>) => {
      onBodyInfoChange({
        ...bodyInfo,
        [field]: event.target.value,
      });
    };

  const height = Number(bodyInfo.height);
  const weight = Number(bodyInfo.weight);

  const heightError =
    bodyInfo.height !== '' && (height < 130 || height > 200);

  const weightError =
    bodyInfo.weight !== '' && (weight < 30 || weight > 150);

  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-text">신체 정보</h2>
        <p className="mt-1 text-sm text-text-sub">
          정확한 아바타 생성을 위해 현재 신체 정보를 입력해 주세요.
        </p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-text">키</span>

          <div className="relative mt-2">
            <input
              type="number"
              min={130}
              max={200}
              value={bodyInfo.height}
              onChange={handleChange('height')}
              placeholder="165"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 pr-12 text-text outline-none transition-colors placeholder:text-text-sub focus:border-gold"
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-sub">
              cm
            </span>
          </div>

          {heightError && (
            <p role="alert" className="mt-2 text-sm text-fit-tight">
              키는 130cm 이상 200cm 이하로 입력해 주세요.
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text">몸무게</span>

          <div className="relative mt-2">
            <input
              type="number"
              min={30}
              max={150}
              value={bodyInfo.weight}
              onChange={handleChange('weight')}
              placeholder="55"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 pr-12 text-text outline-none transition-colors placeholder:text-text-sub focus:border-gold"
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-sub">
              kg
            </span>
          </div>

          {weightError && (
            <p role="alert" className="mt-2 text-sm text-fit-tight">
              몸무게는 30kg 이상 150kg 이하로 입력해 주세요.
            </p>
          )}
        </label>
      </div>
    </section>
  );
};

export default BodyInfoForm;
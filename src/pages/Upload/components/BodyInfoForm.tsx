import {
  type ChangeEvent,
} from 'react';

export interface BodyInfo {
  height: string;
  weight: string;
}

interface BodyInfoFormProps {
  bodyInfo: BodyInfo;
  onBodyInfoChange: (
    bodyInfo: BodyInfo,
  ) => void;
}

const BodyInfoForm = ({
  bodyInfo,
  onBodyInfoChange,
}: BodyInfoFormProps) => {
  const handleChange =
    (field: keyof BodyInfo) =>
    (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      onBodyInfoChange({
        ...bodyInfo,
        [field]: event.target.value,
      });
    };

  const height =
    Number(bodyInfo.height);
  const weight =
    Number(bodyInfo.weight);

  const heightError =
    bodyInfo.height !== '' &&
    (height < 130 || height > 200);

  const weightError =
    bodyInfo.weight !== '' &&
    (weight < 30 || weight > 150);

  return (
    <section>
      {/* ============================================ */}
      {/* SECTION TITLE                                */}
      {/* ============================================ */}

      <div className="flex items-center gap-[10px]">
        <span
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-[#C9A96E]/50 bg-[#C9A96E]/10 text-[10px] text-[#C9A96E]"
          style={{
            fontFamily:
              '"DM Mono", monospace',
          }}
        >
          1
        </span>

        <h2
          className="text-[12px] font-medium leading-[18px] tracking-[0.2px] text-[#9A9490]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          신체 정보 입력
        </h2>
      </div>

      {/* ============================================ */}
      {/* BODY INPUT                                   */}
      {/* ============================================ */}

      <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
        {/* HEIGHT */}
        <label className="min-w-0">
          <span
            className="block text-[10px] font-normal leading-[15px] text-[#9A9490]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            키 (cm)
          </span>

          <input
            type="number"
            inputMode="decimal"
            min={130}
            max={200}
            value={bodyInfo.height}
            onChange={handleChange(
              'height',
            )}
            placeholder="166"
            aria-invalid={heightError}
            className={[
              'mt-[7px] h-[52px] w-full rounded-[6px] bg-[#141414] px-[14px]',
              'text-[16px] font-normal text-[#F0EBE2] outline-none',
              'placeholder:text-[#5F5B58]',
              'transition-colors',
              heightError
                ? 'border border-red-400/70'
                : 'border border-[#C9A96E]/40 focus:border-[#C9A96E]',
              '[appearance:textfield]',
              '[&::-webkit-inner-spin-button]:appearance-none',
              '[&::-webkit-outer-spin-button]:appearance-none',
            ].join(' ')}
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          />

          {heightError && (
            <p
              role="alert"
              className="mt-[6px] text-[9px] leading-[13px] text-red-400"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              130~200cm 사이로
              입력해주세요.
            </p>
          )}
        </label>

        {/* WEIGHT */}
        <label className="min-w-0">
          <span
            className="block text-[10px] font-normal leading-[15px] text-[#9A9490]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            몸무게 (kg)
          </span>

          <input
            type="number"
            inputMode="decimal"
            min={30}
            max={150}
            value={bodyInfo.weight}
            onChange={handleChange(
              'weight',
            )}
            placeholder="57"
            aria-invalid={weightError}
            className={[
              'mt-[7px] h-[52px] w-full rounded-[6px] bg-[#141414] px-[14px]',
              'text-[16px] font-normal text-[#F0EBE2] outline-none',
              'placeholder:text-[#5F5B58]',
              'transition-colors',
              weightError
                ? 'border border-red-400/70'
                : 'border border-[#C9A96E]/40 focus:border-[#C9A96E]',
              '[appearance:textfield]',
              '[&::-webkit-inner-spin-button]:appearance-none',
              '[&::-webkit-outer-spin-button]:appearance-none',
            ].join(' ')}
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          />

          {weightError && (
            <p
              role="alert"
              className="mt-[6px] text-[9px] leading-[13px] text-red-400"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              30~150kg 사이로
              입력해주세요.
            </p>
          )}
        </label>
      </div>
    </section>
  );
};

export default BodyInfoForm;
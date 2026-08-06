const Upload = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium text-gold">STEP 1</p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          사진과 신체 정보를 입력해 주세요
        </h1>

        <p className="mt-4 text-text-sub">
          전신 사진과 키, 몸무게, 성별 정보를 바탕으로 3D 아바타를
          생성합니다.
        </p>
      </section>
    </main>
  );
};

export default Upload;
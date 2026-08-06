const Processing = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium text-gold">ANALYZING</p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          신체 정보를 분석하고 있습니다
        </h1>

        <p className="mt-4 text-text-sub">
          사진을 분석해 3D 아바타와 신체 치수를 생성하는 중입니다.
        </p>
      </section>
    </main>
  );
};

export default Processing;
const Report = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <section className="w-full max-w-3xl rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium text-gold">FIT REPORT</p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          피팅 분석 결과
        </h1>

        <p className="mt-4 text-text-sub">
          신체 치수, 부위별 핏 상태와 추천 사이즈가 표시될 예정
        </p>
      </section>
    </main>
  );
};

export default Report;
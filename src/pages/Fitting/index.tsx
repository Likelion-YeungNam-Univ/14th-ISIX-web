const Fitting = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <section className="w-full max-w-4xl rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium text-gold">3D FITTING ROOM</p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          가상 피팅룸
        </h1>

        <p className="mt-4 text-text-sub">
          의류와 사이즈를 선택하고 3D 피팅 결과를 확인하는 화면입니다.
        </p>

        <div className="mt-8 flex min-h-80 items-center justify-center rounded-xl border border-dashed border-border bg-bg">
          <p className="text-text-sub">3D Viewer 연결 예정</p>
        </div>
      </section>
    </main>
  );
};

export default Fitting;
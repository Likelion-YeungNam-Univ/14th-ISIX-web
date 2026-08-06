import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-7xl font-semibold text-gold">404</p>

        <h1 className="mt-6 text-3xl font-semibold text-text">
          페이지를 찾을 수 없습니다
        </h1>

        <p className="mt-4 text-text-sub">
          요청한 주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-lg bg-gold px-6 py-3 font-medium text-bg transition-opacity hover:opacity-80"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
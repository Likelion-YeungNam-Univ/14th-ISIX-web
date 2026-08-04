import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* TODO
          /upload      사진 입력
          /avatar      아바타 · 치수
          /fitting     피팅룸
          /report      핏 리포트
          /mypage      마이페이지 (보호 라우트)
          /auth/callback  소셜 로그인 콜백
      */}
    </Routes>
  );
};

export default App;

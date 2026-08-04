import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Upload from '@/pages/Upload';
import Processing from '@/pages/Processing';
import Fitting from '@/pages/Fitting';
import Report from '@/pages/Report';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/processing" element={<Processing />} />
      <Route path="/fitting" element={<Fitting />} />
      <Route path="/report" element={<Report />} />

      <Route path="*" element={<NotFound />} />
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

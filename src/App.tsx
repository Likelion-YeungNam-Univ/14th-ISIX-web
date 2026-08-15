import { Route, Routes } from 'react-router-dom';

import MainLayout from '@/layouts/MainLayout';

import Splash from '@/pages/Splash';
import Home from '@/pages/Home';
import Collections from '@/pages/Home/Collections';
import Avatar from '@/pages/Avatar';
import Upload from '@/pages/Upload';
import Processing from '@/pages/Processing';
import Fitting from '@/pages/Fitting';
import Report from '@/pages/Report';
import My from '@/pages/My';
import NotFound from '@/pages/NotFound';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />

      <Route element={<MainLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/home/collections" element={<Collections />} />
        <Route path="/avatar" element={<Avatar />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/fitting" element={<Fitting />} />
        <Route path="/my" element={<My />} />
      </Route>

      <Route path="/processing" element={<Processing />} />
      <Route path="/report" element={<Report />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
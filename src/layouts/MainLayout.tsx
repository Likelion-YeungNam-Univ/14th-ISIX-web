import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/navigation/BottomNav';

const MainLayout = () => {
  return (
    <div className="min-h-screen pb-16">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default MainLayout;
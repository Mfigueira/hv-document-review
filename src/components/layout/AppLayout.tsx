import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { DevPanel } from '../dev/DevPanel';
import { useReviewStore } from '../../store/useReviewStore';

const SHOW_DEV_PANEL = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEV_PANEL === 'true';

export function AppLayout() {
  const review = useReviewStore((s) => s.review);

  return (
    <div className="flex h-dvh min-h-[750px] flex-col">
      <Header review={review} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      <Footer />

      {/* Floating dev panel — only mounted when SHOW_DEV_PANEL is true */}
      {SHOW_DEV_PANEL && <DevPanel />}
    </div>
  );
}

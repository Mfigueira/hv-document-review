import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { DevPanel } from '../dev/DevPanel';
import { useReviewStore } from '../../store/useReviewStore';

export function AppLayout() {
  const review = useReviewStore((s) => s.review);

  return (
    <div className="flex h-dvh min-h-[750px] flex-col">
      <Header review={review} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      <Footer />

      {/* Floating dev panel — fixed position, rendered outside the normal flow */}
      <DevPanel />
    </div>
  );
}

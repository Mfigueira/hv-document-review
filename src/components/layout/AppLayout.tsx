import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { DevPanel } from '../dev/DevPanel';
import { useReviewStore } from '../../store/useReviewStore';

export function AppLayout() {
  const review = useReviewStore((s) => s.review);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header review={review} />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Floating dev panel — fixed position, rendered outside the normal flow */}
      <DevPanel />
    </div>
  );
}

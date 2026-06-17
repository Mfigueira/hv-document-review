import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useReviewStore } from '../../store/useReviewStore';

export function AppLayout() {
  const review = useReviewStore((s) => s.review);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header review={review} />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* DevPanel placeholder — wired in Stage 4 */}
      <div id="dev-panel-slot" />

      <Footer />
    </div>
  );
}

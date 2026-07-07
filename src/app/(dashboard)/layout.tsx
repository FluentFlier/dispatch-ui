import Sidebar from '@/components/nav/Sidebar';
import BottomBar from '@/components/nav/BottomBar';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import DashboardShell from '@/components/layout/DashboardShell';

export const dynamic = 'force-dynamic';

/** UI kit layout — no auth, billing gates, or session refresh. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardShell>
        <Sidebar />
        <main className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 pb-24 md:ml-[264px] md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-[1100px]">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
        <BottomBar />
      </DashboardShell>
    </ToastProvider>
  );
}

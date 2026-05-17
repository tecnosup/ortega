export const dynamic = "force-dynamic";

import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import AdminNav from "@/components/admin/AdminNav";
import { AdminNotificacoesProvider } from "@/components/admin/AdminNotificacoesProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminNotificacoesProvider>
        <div className="min-h-screen bg-[#0A0A0A] flex">
          <AdminNav />
          <main className="flex-1 min-w-0 admin-main-mobile md:pt-8 md:pb-8 md:ml-56 text-[#F5E6C8]">
            <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 h-full">
              {children}
            </div>
          </main>
        </div>
      </AdminNotificacoesProvider>
    </AdminAuthGuard>
  );
}

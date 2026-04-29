export const dynamic = "force-dynamic";

import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <AdminNav />
        <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 text-[#F5E6C8] min-w-0">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}

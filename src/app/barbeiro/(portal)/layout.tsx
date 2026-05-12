export const dynamic = "force-dynamic";

import BarbeiroAuthGuard from "@/components/barbeiro/BarbeiroAuthGuard";
import BarbeiroNav from "@/components/barbeiro/BarbeiroNav";

export default function BarbeiroLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarbeiroAuthGuard>
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <BarbeiroNav />
        <main className="flex-1 min-w-0 pt-20 md:pt-8 pb-28 md:pb-8 text-[#F5E6C8]">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </BarbeiroAuthGuard>
  );
}

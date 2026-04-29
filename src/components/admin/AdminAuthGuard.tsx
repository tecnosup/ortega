"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    // Verifica sessão via cookie — sem depender do Firebase client
    fetch("/api/admin/session", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setStatus("ok");
        } else {
          router.replace("/admin/login");
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#b8944a] text-sm tracking-widest uppercase animate-pulse">
          Verificando acesso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

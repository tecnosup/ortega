"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BarbeiroAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok">("loading");

  useEffect(() => {
    fetch("/api/barbeiro/session", { credentials: "include" })
      .then((res) => {
        if (res.ok) setStatus("ok");
        else router.replace("/barbeiro/login");
      })
      .catch(() => router.replace("/barbeiro/login"));
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

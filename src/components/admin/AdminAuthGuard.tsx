"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
      } else {
        setVerified(true);
      }
    });
    return unsub;
  }, [router]);

  if (!verified) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}

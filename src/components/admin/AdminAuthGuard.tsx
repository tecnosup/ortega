"use client";

// DEMO MODE: autenticação desativada para apresentação ao cliente
export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

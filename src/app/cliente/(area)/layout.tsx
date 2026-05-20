import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verificarSessionToken, CLIENTE_COOKIE } from "@/lib/cliente-auth";
import ClienteNavbar from "./ClienteNavbar";

export const dynamic = "force-dynamic";

export default async function ClienteAreaLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get(CLIENTE_COOKIE)?.value;
  const session = token ? verificarSessionToken(token) : null;

  if (!session) {
    redirect("/cliente/login?msg=sessao-expirada");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <ClienteNavbar nome={session.nome} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {children}
      </main>
    </div>
  );
}

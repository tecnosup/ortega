import { redirect } from "next/navigation";

// Redireciona a raiz para o grupo (public) onde o layout de Navbar+Footer está configurado
export default function RootPage() {
  redirect("/");
}

export const dynamic = "force-dynamic";

import { getLandingSettings } from "@/lib/admin-settings";
import ConfiguracoesForm from "@/components/admin/ConfiguracoesForm";

export default async function ConfiguracoesPage() {
  const settings = await getLandingSettings();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações da landing</h1>
      <ConfiguracoesForm settings={settings} />
    </div>
  );
}

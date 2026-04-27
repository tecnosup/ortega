export const dynamic = "force-dynamic";

const kpis = [
  { label: "Métrica 1", value: "—" },
  { label: "Métrica 2", value: "—" },
  { label: "Métrica 3", value: "—" },
  { label: "Métrica 4", value: "—" },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded p-6">
            <p className="text-sm text-gray-500 mb-1">{k.label}</p>
            <p className="text-3xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>
      {/* TODO: adicionar KPIs reais baseados no tipo de negócio do cliente */}
    </div>
  );
}

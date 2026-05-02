"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="text-center flex flex-col gap-4 max-w-sm">
        <span className="text-[#b8944a] text-4xl">!</span>
        <h2 className="text-lg font-bold text-[#F5E6C8]">Algo deu errado</h2>
        <p className="text-sm text-gray-500">{error.message || "Erro interno. Tente novamente."}</p>
        <button
          onClick={reset}
          className="mt-2 px-6 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-sm font-bold rounded hover:bg-[#c9a84c] transition"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

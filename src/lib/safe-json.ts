// Utilitários de fetch resiliente.
// Evitam o crash "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
// quando uma API responde vazio/erro (ex.: 500 por cota do Firestore esgotada,
// redirect de sessão, ou falha de rede). Em vez de quebrar a página, devolvem um fallback.

/** fetch que nunca lança — retorna Response ou null se a rede falhar. */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}

/** Faz res.json() com segurança; se a resposta não for ok ou não for JSON válido, devolve o fallback. */
export async function jsonOr<T>(res: Response | null | undefined, fallback: T): Promise<T> {
  if (!res || !res.ok) return fallback;
  try {
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

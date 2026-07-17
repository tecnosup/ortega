"use client";

import { IconLoader2, IconPhoto } from "@tabler/icons-react";

/**
 * Botão de escolher imagem.
 *
 * Existe por um motivo específico: o <input type="file"> nativo desenha o
 * próprio texto ("Choose File" / "No file chosen") e esse texto segue o idioma
 * do BROWSER, não o da página. Não há atributo, CSS nem prop que o traduza —
 * as classes `file:` do Tailwind mudam só a aparência do botão, nunca o rótulo.
 * A única saída é esconder o input e desenhar o controle por cima, que é o que
 * este componente faz: o <label> envolve o input e o dispara ao ser clicado.
 *
 * O input fica `sr-only` (e não `hidden`) pra continuar focável no teclado.
 */
export default function InputImagem({
  onChange,
  uploading = false,
  temImagem = false,
  inputRef,
  className = "",
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  /** Já existe imagem: troca o rótulo de "Escolher" para "Trocar". */
  temImagem?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}) {
  return (
    <label
      className={`self-start flex items-center gap-2 px-4 py-2 text-sm rounded border transition ${
        uploading
          ? "border-[#2d2d2d] text-gray-600 cursor-wait"
          : "border-[#2d2d2d] text-gray-400 cursor-pointer hover:border-[#b8944a] hover:text-[#b8944a]"
      } ${className}`}
    >
      {uploading ? (
        <><IconLoader2 size={14} className="animate-spin" /> Enviando...</>
      ) : (
        <><IconPhoto size={14} /> {temImagem ? "Trocar imagem" : "Escolher imagem"}</>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        disabled={uploading}
        className="sr-only"
      />
    </label>
  );
}

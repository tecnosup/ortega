"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useState } from "react";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone obrigatório"),
  mensagem: z.string().min(10, "Mensagem muito curta"),
});

type FormData = z.infer<typeof schema>;

export default function ContatoPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.whatsappUrl) window.open(json.whatsappUrl, "_blank");
    setSent(true);
  }

  return (
    <section className="min-h-screen pt-24 pb-16 bg-[#0A0A0A]">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5E6C8] mb-2">Contato</h1>
        <p className="text-[#F5E6C8]/50 mb-8 text-sm sm:text-base">
          Preencha o formulário e entraremos em contato pelo WhatsApp.
        </p>

        {sent ? (
          <div className="bg-[#b8944a]/10 border border-[#b8944a]/30 rounded-lg px-5 py-6 text-center">
            <p className="text-[#b8944a] font-semibold text-lg mb-1">Mensagem enviada!</p>
            <p className="text-[#F5E6C8]/60 text-sm">Em breve entraremos em contato pelo WhatsApp.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-5">
            <Input label="Nome" placeholder="Seu nome" {...register("nome")} error={errors.nome?.message} />
            <Input label="E-mail" type="email" placeholder="seu@email.com" {...register("email")} error={errors.email?.message} />
            <Input label="Telefone" placeholder="(11) 99999-9999" {...register("telefone")} error={errors.telefone?.message} />
            <Textarea label="Mensagem" placeholder="Como podemos ajudar?" {...register("mensagem")} error={errors.mensagem?.message} />
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

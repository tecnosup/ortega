"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CtaMobileFloat({ whatsappNumber }: { whatsappNumber?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de agendar um horário na Ortega.")}`
    : "#";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex gap-0 border-t border-[#C9A84C]/20"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <a
            href="/agendamento"
            className="flex-1 py-4 bg-[#C9A84C] text-[#0A0A0A] text-xs font-black tracking-widest uppercase text-center active:scale-[0.97] transition-transform"
          >
            Agendar
          </a>
          {whatsappNumber && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-[#0A0A0A] border-l border-[#C9A84C]/30 text-[#C9A84C] text-xs font-bold tracking-widest uppercase text-center active:scale-[0.97] transition-transform"
            >
              WhatsApp
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Image from "next/image";
import { Share2 } from "lucide-react";

export default function InvitationPage() {
  const { eventId, guestId } = useParams();

  const [event, setEvent] = useState<any>(null);
  const [guest, setGuest] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !guestId) return;

    async function load() {
      const eventSnap = await getDoc(doc(db, "events", String(eventId)));
      const guestSnap = await getDoc(
        doc(db, "events", String(eventId), "guests", String(guestId))
      );
      const configSnap = await getDoc(
        doc(db, "events", String(eventId), "inviteTemplate", "config")
      );

      if (eventSnap.exists()) setEvent(eventSnap.data());
      if (guestSnap.exists()) setGuest(guestSnap.data());
      if (configSnap.exists()) setConfig(configSnap.data());

      setLoading(false);
    }

    load();
  }, [eventId, guestId]);

  if (loading) {
    return (
      <p className="text-slate-400 p-6 text-center">Carregando convite...</p>
    );
  }

  if (!event || !guest) {
    return (
      <p className="text-slate-400 p-6 text-center">Convite não encontrado.</p>
    );
  }

  async function handleShare() {
    const publicUrl = `${window.location.origin}/invite/${guestId}`;

    try {
      await navigator.share({
        title: `Convite: ${event.name}`,
        text: `Você foi convidado para ${event.name}!`,
        url: publicUrl,
      });
    } catch {
      await navigator.clipboard.writeText(publicUrl);
      alert("Link copiado para a área de transferência!");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 text-white px-4">
      <h1 className="text-xl mb-6">Convite do Convidado 🎉</h1>

      <div
        id="invite-card"
        className="w-full max-w-md shadow-xl text-center relative overflow-hidden p-6 min-h-[700px] flex items-center justify-center"
        style={{
          backgroundColor: config?.baseColor ?? "#ffffff",
          backgroundImage: config?.backgroundImage
            ? `url(${config.backgroundImage})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: config?.borderStyle === "rounded" ? "32px" : "4px",
          fontFamily:
            config?.font === "handwritten"
              ? "Caveat"
              : config?.font === "fun"
              ? "Fredoka"
              : config?.font === "elegant"
              ? "Playfair Display"
              : "inherit",
        }}
      >
        {config?.decorations?.balloons && (
          <Image
            src="/decorations/balloons.png"
            alt="balões"
            width={700}
            height={200}
            className="absolute top-0 left-0 opacity-80 pointer-events-none z-0"
          />
        )}

        {config?.decorations?.confetti && (
          <Image
            src="/decorations/confetti.png"
            alt="confete"
            width={700}
            height={300}
            className="absolute top-0 right-0 opacity-70 pointer-events-none z-0"
          />
        )}

        {config?.decorations?.stars && (
          <Image
            src="/decorations/stars.png"
            alt="estrelas"
            width={700}
            height={200}
            className="absolute bottom-0 right-0 opacity-70 pointer-events-none z-0"
          />
        )}

        {/* TEXTO EM CIMA DAS DECS */}
        <div className="relative z-20 flex flex-col items-center">
          <p style={{ color: config?.textColor }}>Você foi convidado para</p>

          <h2
            className="text-3xl font-bold mt-2"
            style={{ color: config?.titleColor }}
          >
            {event.name}
          </h2>

          <p className="mt-4 text-xl" style={{ color: config?.nameColor }}>
            🎈 Convidado: {guest.name}
          </p>

          <p className="text-sm mt-1" style={{ color: config?.textColor }}>
            {event.date}
          </p>

          {event.local && (
            <p className="text-sm mt-1" style={{ color: config?.textColor }}>
              📍 Local: {event.local}
            </p>
          )}

          <p className="mt-6 text-sm" style={{ color: config?.textColor }}>
            Estamos ansiosos para celebrar com você! 🎉✨
          </p>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="mt-6 bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
      >
        <Share2 size={18} />
        Compartilhar Convite Público
      </button>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import html2canvas from "html2canvas";
import Image from "next/image";

export default function InvitePage() {
  const { guestId } = useParams();

  const [guest, setGuest] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestId) return;

    async function loadInvite() {
      try {
        const eventsSnap = await getDocs(collection(db, "events"));

        let foundGuest = null;
        let eventIdFound = null;

        for (const ev of eventsSnap.docs) {
          const eventId = ev.id;

          const guestsSnap = await getDocs(
            collection(db, "events", eventId, "guests")
          );

          const g = guestsSnap.docs.find((d) => d.id === guestId);

          if (g) {
            foundGuest = g.data();
            eventIdFound = eventId;
            break;
          }
        }

        if (!foundGuest || !eventIdFound) {
          setLoading(false);
          return;
        }

        setGuest(foundGuest);

        const evSnap = await getDoc(doc(db, "events", eventIdFound));
        if (evSnap.exists()) setEventData(evSnap.data());

        const cfgSnap = await getDoc(
          doc(db, "events", eventIdFound, "inviteTemplate", "config")
        );

        if (cfgSnap.exists()) setConfig(cfgSnap.data());

        setLoading(false);
      } catch (e) {
        console.error("ERRO AO CARREGAR CONVITE:", e);
        setLoading(false);
      }
    }

    loadInvite();
  }, [guestId]);

  async function handleDownload() {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    const link = document.createElement("a");
    link.download = `convite-${guest?.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Carregando convite...
      </div>
    );
  }

  if (!guest || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6 text-slate-300">
        <p>Convite não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center px-4 py-8">
      <h1 className="text-xl mb-6 text-center">Seu convite 🎉</h1>

      <div
        ref={cardRef}
        className="w-full max-w-md rounded-3xl p-6 shadow-xl text-center relative overflow-hidden flex flex-col min-h-[600px] items-center justify-center"
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

        <div className="relative z-20 flex flex-col items-center">
          <p className="text-sm" style={{ color: config?.textColor }}>
            Você foi convidado para
          </p>

          <h2
            className="text-3xl font-bold mt-2"
            style={{ color: config?.titleColor }}
          >
            {eventData.name}
          </h2>

          <p className="mt-4 text-xl" style={{ color: config?.nameColor }}>
            🎈 Convidado: {guest.name}
          </p>

          <p className="text-sm mt-1" style={{ color: config?.textColor }}>
            {eventData.date
              ? new Date(eventData.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Data a definir"}
          </p>

          {eventData.local && (
            <p className="text-sm mt-1" style={{ color: config?.textColor }}>
              📍 Local: {eventData.local}
            </p>
          )}

          <p className="mt-6 text-sm" style={{ color: config?.textColor }}>
            Estamos ansiosos para celebrar com você! 🎉✨
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-xl text-sm font-medium transition"
      >
        Baixar convite
      </button>

      {eventData.local && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            eventData.local
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-xl text-sm font-medium transition w-full max-w-md text-center"
        >
          📍 Abrir local no mapa
        </a>
      )}
    </div>
  );
}

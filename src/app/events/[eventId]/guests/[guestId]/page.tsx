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

  function applyVariables(text: string, event: any, guest: any) {
    return text
      .replace(/{{guestName}}/g, guest.name)
      .replace(/{{eventName}}/g, event.name)
      .replace(/{{eventDate}}/g, event.date)
      .replace(/{{eventLocal}}/g, event.local ?? "")
      .replace(/{{guestId}}/g, guest.id ?? "");
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
        className="relative shadow-xl rounded-3xl overflow-hidden border border-slate-800"
        style={{
          width: config.canvasWidth,
          height: config.canvasHeight,
          backgroundColor: config.baseColor,
          backgroundImage: config.backgroundImage
            ? `url(${config.backgroundImage})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {config.elements
          ?.slice()
          .sort((a: any, b: any) => a.zIndex - b.zIndex)
          .map((el: any) => (
            <div
              key={el.id}
              style={{
                position: "absolute",
                top: el.y,
                left: el.x,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
                pointerEvents: "none",
              }}
            >
              {el.type === "text" ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      el.align === "left"
                        ? "flex-start"
                        : el.align === "right"
                        ? "flex-end"
                        : "center",
                    textAlign: el.align,
                    fontSize: el.fontSize,
                    color: el.color,
                    whiteSpace: "pre-wrap",
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle,
                  }}
                >
                  {applyVariables(el.text, event, guest)}
                </div>
              ) : (
                <Image
                  src={el.url}
                  alt=""
                  width={el.width}
                  height={el.height}
                  className="object-contain"
                  style={{ opacity: el.opacity }}
                />
              )}
            </div>
          ))}
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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import * as htmlToImage from "html-to-image";
import Image from "next/image";
import { formatDate } from "@/lib/format-date";

export default function InvitePage() {
  const { guestId } = useParams();

  const [guest, setGuest] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  function applyVariables(text: string) {
    if (!guest || !event) return text;

    return text
      .replace(/{{guestName}}/g, guest.name)
      .replace(/{{eventName}}/g, event.name)
      .replace(/{{eventDate}}/g, formatDate(event.date))
      .replace(/{{eventLocal}}/g, event.local ?? "")
      .replace(/{{guestId}}/g, guestId as string);
  }

  useEffect(() => {
    if (!guestId) return;

    async function loadInvite() {
      setLoading(true);

      try {
        const eventsSnap = await getDocs(collection(db, "events"));

        let foundGuest = null;
        let foundEventId = null;

        for (const eventDoc of eventsSnap.docs) {
          const eventId = eventDoc.id;

          const guestsSnap = await getDocs(
            collection(db, "events", eventId, "guests")
          );

          const match = guestsSnap.docs.find((d) => d.id === guestId);
          if (match) {
            foundGuest = match.data();
            foundEventId = eventId;
            break;
          }
        }

        if (!foundGuest || !foundEventId) {
          setLoading(false);
          return;
        }

        setGuest({ id: guestId, ...foundGuest });

        const eventSnap = await getDoc(doc(db, "events", foundEventId));
        if (eventSnap.exists()) setEvent(eventSnap.data());

        const configSnap = await getDoc(
          doc(db, "events", foundEventId, "inviteTemplate", "config")
        );
        if (configSnap.exists()) setConfig(configSnap.data());

        setLoading(false);
      } catch (e) {
        console.error("ERRO AO CARREGAR CONVITE:", e);
        setLoading(false);
      }
    }

    loadInvite();
  }, [guestId]);

  async function handleDownload() {
    if (!canvasRef.current) return;

    const originalTransform = canvasRef.current.style.transform;

    canvasRef.current.style.transform = "scale(1)";

    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      link.download = `convite-${guest.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao exportar convite", err);
      alert("Erro ao exportar convite.");
    }

    canvasRef.current.style.transform = originalTransform;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Carregando convite...
      </div>
    );
  }

  if (!guest || !event || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6 text-slate-300">
        Convite não encontrado.
      </div>
    );
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 480;
  const scale = isMobile ? window.innerWidth / config.canvasWidth : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center px-4 py-10">
      <h1 className="text-xl mb-6">Seu convite 🎉</h1>

      <div
        className="w-full flex justify-center overflow-auto md:overflow-visible"
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <div
          ref={canvasRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: config.canvasWidth,
            height: config.canvasHeight,
            backgroundColor: config.baseColor,
            backgroundImage: config.backgroundImage
              ? `url(${config.backgroundImage})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          className="relative shadow-xl rounded-3xl overflow-hidden border border-slate-800"
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
                    {applyVariables(el.text)}
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
      </div>

      <button
        onClick={handleDownload}
        className="mt-6 bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-xl text-sm font-medium transition"
      >
        Baixar convite
      </button>

      {event.local && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            event.local
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

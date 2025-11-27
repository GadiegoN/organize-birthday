/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import UploadButton from "@/components/upload-button";
import Image from "next/image";

export default function InviteCustomizationPage() {
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<any>({
    backgroundImage: "",
    baseColor: "#ffffff",
    titleColor: "#1e293b",
    textColor: "#475569",
    nameColor: "#0f172a",
    borderStyle: "rounded",
    font: "default",
    decorations: {
      balloons: true,
      confetti: false,
      stars: false,
    },
  });

  useEffect(() => {
    if (!eventId) return;

    async function load() {
      const ref = doc(
        db,
        "events",
        String(eventId),
        "inviteTemplate",
        "config"
      );
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setConfig(snap.data());
      }

      setLoading(false);
    }

    load();
  }, [eventId]);

  async function saveConfig() {
    setSaving(true);

    const ref = doc(db, "events", String(eventId), "inviteTemplate", "config");

    await setDoc(ref, {
      ...config,
      updatedAt: Date.now(),
    });

    setSaving(false);
    alert("Configuração salva!");
  }

  function update(field: string, value: any) {
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 pb-32">
      <h1 className="text-2xl font-bold">Customizar Convite 🎨</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-semibold">Aparência</h2>

            <div className="space-y-2">
              <label className="text-sm">Imagem de fundo</label>
              <UploadButton
                onUpload={(url: string) => update("backgroundImage", url)}
              />

              {config.backgroundImage && (
                <button
                  onClick={() => update("backgroundImage", "")}
                  className="text-xs text-red-400 underline mt-1"
                >
                  Remover imagem
                </button>
              )}
            </div>

            <div className="space-y-4">
              {[
                ["baseColor", "Cor do cartão"],
                ["titleColor", "Cor do título"],
                ["textColor", "Cor do texto"],
                ["nameColor", "Cor do nome do convidado"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-sm">{label}</label>
                  <input
                    type="color"
                    value={(config as any)[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className="w-16 h-10 ml-2"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm">Fonte</label>
              <select
                value={config.font}
                onChange={(e) => update("font", e.target.value)}
                className="block w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 mt-1"
              >
                <option value="default">Padrão</option>
                <option value="handwritten">Manuscrita</option>
                <option value="fun">Divertida</option>
                <option value="elegant">Elegante</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Decorações</label>

              <div className="space-y-1 text-sm">
                {[
                  ["balloons", "Balões"],
                  ["confetti", "Confete"],
                  ["stars", "Estrelas"],
                ].map(([key, label]) => (
                  <label className="flex items-center gap-2" key={key}>
                    <input
                      type="checkbox"
                      checked={config.decorations[key]}
                      onChange={(e) =>
                        update("decorations", {
                          ...config.decorations,
                          [key]: e.target.checked,
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full bg-sky-600 hover:bg-sky-500 py-2 rounded-xl mt-6"
            >
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>

          <div className="flex justify-center relative">
            <div
              className="w-full max-w-md rounded-3xl shadow-xl text-center relative overflow-hidden"
              style={{
                backgroundColor: config.baseColor,
                backgroundImage: config.backgroundImage
                  ? `url(${config.backgroundImage})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: config.borderStyle === "rounded" ? "32px" : "4px",
                fontFamily:
                  config.font === "handwritten"
                    ? "Caveat"
                    : config.font === "fun"
                    ? "Fredoka"
                    : config.font === "elegant"
                    ? "Playfair Display"
                    : "inherit",
              }}
            >
              {config.decorations.balloons && (
                <Image
                  src="/decorations/balloons.png"
                  alt="balões"
                  width={700}
                  height={200}
                  className="absolute top-0 left-0 opacity-80 pointer-events-none z-0"
                />
              )}

              {config.decorations.confetti && (
                <Image
                  src="/decorations/confetti.png"
                  alt="confete"
                  width={700}
                  height={300}
                  className="absolute top-2/12 right-0 opacity-70 pointer-events-none z-0"
                />
              )}

              {config.decorations.stars && (
                <Image
                  src="/decorations/stars.png"
                  alt="estrelas"
                  width={700}
                  height={200}
                  className="absolute bottom-0 right-0 opacity-70 pointer-events-none z-0"
                />
              )}

              <div className="relative z-20 flex flex-col items-center text-center justify-center min-h-[500px] h-full">
                <p className="" style={{ color: config.textColor }}>
                  Você foi convidado para
                </p>

                <h2
                  className="text-3xl font-bold mt-2"
                  style={{ color: config.titleColor }}
                >
                  Nome do Evento
                </h2>

                <p className="mt-4 text-xl" style={{ color: config.nameColor }}>
                  🎈 Convidado: João da Silva
                </p>

                <p className="text-sm mt-1" style={{ color: config.textColor }}>
                  20 de Março de 2025
                </p>

                <p className="text-sm mt-1" style={{ color: config.textColor }}>
                  📍 Local: Salão Encantado
                </p>

                <p className="mt-6 text-sm" style={{ color: config.textColor }}>
                  Estamos ansiosos para celebrar com você! 🎉✨
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import UploadButton from "@/components/upload-button";
import Image from "next/image";
import { Rnd } from "react-rnd";
import * as htmlToImage from "html-to-image";

type ElementType = "text" | "image";

type BaseElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

type TextElement = BaseElement & {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  align: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
};

type ImageElement = BaseElement & {
  type: "image";
  url: string;
  opacity: number;
};

type InviteElement = TextElement | ImageElement;

type InviteConfig = {
  backgroundImage: string;
  baseColor: string;
  canvasWidth: number;
  canvasHeight: number;
  elements: InviteElement[];
  updatedAt?: number;
};

const DEFAULT_CONFIG: InviteConfig = {
  backgroundImage: "",
  baseColor: "#ffffff",
  canvasWidth: 600,
  canvasHeight: 800,
  elements: [
    {
      id: "title",
      type: "text",
      text: "Nome do Evento",
      x: 80,
      y: 80,
      width: 440,
      height: 80,
      fontSize: 32,
      color: "#1e293b",
      fontFamily: "Playfair Display",
      align: "center",
      fontWeight: "bold",
      fontStyle: "normal",
      zIndex: 3,
    },
    {
      id: "subtitle",
      type: "text",
      text: "Você foi convidado para uma grande celebração! 🎉",
      x: 70,
      y: 170,
      width: 460,
      height: 80,
      fontSize: 18,
      color: "#475569",
      fontFamily: "inherit",
      align: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      zIndex: 3,
    },
    {
      id: "guestName",
      type: "text",
      text: "Convidado: João da Silva",
      x: 80,
      y: 260,
      width: 440,
      height: 60,
      fontSize: 22,
      color: "#0f172a",
      fontFamily: "Caveat",
      align: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      zIndex: 3,
    },
    {
      id: "details",
      type: "text",
      text: "📍 Salão Encantado\n🗓 20 de Março de 2025\n⏰ 18h",
      x: 80,
      y: 340,
      width: 440,
      height: 120,
      fontSize: 18,
      color: "#475569",
      fontFamily: "inherit",
      align: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      zIndex: 3,
    },
    {
      id: "message",
      type: "text",
      text: "Estamos ansiosos para celebrar com você! ✨",
      x: 80,
      y: 500,
      width: 440,
      height: 80,
      fontSize: 16,
      color: "#1e293b",
      fontFamily: "Fredoka",
      align: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      zIndex: 3,
    },
  ],
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export default function InviteCustomizationPage() {
  const { eventId } = useParams();

  const [config, setConfig] = useState<InviteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const scale = isMobile ? window.innerWidth / config.canvasWidth : 1;

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
        const data = snap.data() as InviteConfig;
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          elements: data.elements || DEFAULT_CONFIG.elements,
        });
      } else {
        setConfig(DEFAULT_CONFIG);
      }

      setLoading(false);
    }

    load();
  }, [eventId]);

  async function saveConfig() {
    if (!eventId) return;
    setSaving(true);

    const ref = doc(db, "events", String(eventId), "inviteTemplate", "config");

    await setDoc(ref, {
      ...config,
      updatedAt: Date.now(),
    });

    setSaving(false);
    alert("Configuração salva!");
  }

  function updateConfigField<K extends keyof InviteConfig>(
    field: K,
    value: InviteConfig[K]
  ) {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateElement(id: string, partial: Partial<InviteElement>) {
    setConfig((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? ({ ...el, ...partial } as InviteElement) : el
      ),
    }));
  }

  function deleteElement(id: string) {
    setConfig((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  }

  function addTextElement() {
    const id = createId();
    const el: TextElement = {
      id,
      type: "text",
      text: "Novo texto",
      x: 80,
      y: 80,
      width: 250,
      height: 60,
      fontSize: 18,
      color: "#111827",
      fontFamily: "inherit",
      align: "left",
      fontWeight: "normal",
      fontStyle: "normal",
      zIndex: getMaxZIndex(config.elements) + 1,
    };

    setConfig((prev) => ({
      ...prev,
      elements: [...prev.elements, el],
    }));
    setSelectedId(id);
  }

  function addImageElement(url: string) {
    const id = createId();
    const el: ImageElement = {
      id,
      type: "image",
      url,
      x: 50,
      y: 50,
      width: 200,
      height: 120,
      opacity: 0.9,
      zIndex: getMaxZIndex(config.elements) + 1,
    };

    setConfig((prev) => ({
      ...prev,
      elements: [...prev.elements, el],
    }));
    setSelectedId(id);
  }

  function bringToFront(id: string) {
    setConfig((prev) => {
      const max = getMaxZIndex(prev.elements);
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, zIndex: max + 1 } : el
        ),
      };
    });
  }

  function sendToBack(id: string) {
    setConfig((prev) => {
      const min = getMinZIndex(prev.elements);
      return {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, zIndex: min - 1 } : el
        ),
      };
    });
  }

  function applyTemplate(template: "kids" | "elegant" | "minimal") {
    if (template === "kids") {
      setConfig((prev) => ({
        ...prev,
        baseColor: "#fee2e2",
        backgroundImage: "",
        elements: [
          {
            id: "title",
            type: "text",
            text: "Festa de Aniversário! 🎈",
            x: 60,
            y: 60,
            width: 480,
            height: 80,
            fontSize: 30,
            color: "#b91c1c",
            fontFamily: "Fredoka",
            align: "center",
            fontWeight: "bold",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "guest",
            type: "text",
            text: "Convidado: João da Silva",
            x: 80,
            y: 150,
            width: 440,
            height: 60,
            fontSize: 22,
            color: "#111827",
            fontFamily: "Caveat",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "details",
            type: "text",
            text: "📍 Salão Encantado\n🗓 20 de Março de 2025\n⏰ 18h",
            x: 80,
            y: 230,
            width: 440,
            height: 120,
            fontSize: 18,
            color: "#374151",
            fontFamily: "inherit",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "msg",
            type: "text",
            text: "Venha se divertir com a gente! ✨",
            x: 80,
            y: 380,
            width: 440,
            height: 80,
            fontSize: 18,
            color: "#b91c1c",
            fontFamily: "Fredoka",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
        ],
      }));
      setSelectedId(null);
      return;
    }

    if (template === "elegant") {
      setConfig((prev) => ({
        ...prev,
        baseColor: "#0f172a",
        backgroundImage: "",
        elements: [
          {
            id: "title",
            type: "text",
            text: "Jantar Especial",
            x: 60,
            y: 80,
            width: 480,
            height: 80,
            fontSize: 34,
            color: "#e5e7eb",
            fontFamily: "Playfair Display",
            align: "center",
            fontWeight: "bold",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "guest",
            type: "text",
            text: "Convidado: João da Silva",
            x: 80,
            y: 170,
            width: 440,
            height: 60,
            fontSize: 20,
            color: "#facc15",
            fontFamily: "Caveat",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "details",
            type: "text",
            text: "📍 Espaço Gourmet\n🗓 20 de Março de 2025\n⏰ 20h",
            x: 80,
            y: 250,
            width: 440,
            height: 120,
            fontSize: 18,
            color: "#e5e7eb",
            fontFamily: "inherit",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "msg",
            type: "text",
            text: "Sua presença tornará a noite ainda mais especial.",
            x: 80,
            y: 400,
            width: 440,
            height: 80,
            fontSize: 16,
            color: "#9ca3af",
            fontFamily: "Playfair Display",
            align: "center",
            fontWeight: "normal",
            fontStyle: "italic",
            zIndex: 3,
          },
        ],
      }));
      setSelectedId(null);
      return;
    }

    if (template === "minimal") {
      setConfig((prev) => ({
        ...prev,
        baseColor: "#f9fafb",
        backgroundImage: "",
        elements: [
          {
            id: "title",
            type: "text",
            text: "Convite",
            x: 60,
            y: 80,
            width: 480,
            height: 80,
            fontSize: 30,
            color: "#111827",
            fontFamily: "inherit",
            align: "center",
            fontWeight: "bold",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "guest",
            type: "text",
            text: "Convidado: João da Silva",
            x: 80,
            y: 170,
            width: 440,
            height: 60,
            fontSize: 20,
            color: "#111827",
            fontFamily: "inherit",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
          {
            id: "details",
            type: "text",
            text: "📍 Local\n🗓 Data\n⏰ Horário",
            x: 80,
            y: 250,
            width: 440,
            height: 120,
            fontSize: 18,
            color: "#4b5563",
            fontFamily: "inherit",
            align: "center",
            fontWeight: "normal",
            fontStyle: "normal",
            zIndex: 3,
          },
        ],
      }));
      setSelectedId(null);
      return;
    }
  }

  async function exportAsPng() {
    if (!canvasRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        cacheBust: true,
        quality: 1,
      });

      const link = document.createElement("a");
      link.download = "convite.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar imagem.");
    }
  }

  const selectedElement = config.elements.find((el) => el.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 pb-32">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Customizar Convite 🎨</h1>

        <div className="flex gap-3">
          <button
            onClick={exportAsPng}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-sm"
          >
            Baixar PNG
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 rounded-xl text-sm"
          >
            {saving ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-8">
        <div className="space-y-6 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Aparência geral</h2>

            <div className="space-x-2 flex items-center">
              <label className="text-sm">Cor de fundo do cartão</label>
              <input
                type="color"
                value={config.baseColor}
                onChange={(e) => updateConfigField("baseColor", e.target.value)}
                className="w-16 h-10"
              />
            </div>

            <div className="space-y-2 flex flex-col gap-2">
              <label className="text-sm">Imagem de fundo (opcional)</label>
              <UploadButton
                onUpload={(url: string) =>
                  updateConfigField("backgroundImage", url)
                }
              />
              {config.backgroundImage && (
                <button
                  onClick={() => updateConfigField("backgroundImage", "")}
                  className="text-xs text-red-400 underline mt-1"
                >
                  Remover imagem
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Templates rápidos</h2>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => applyTemplate("kids")}
                className="bg-pink-500/20 border border-pink-500/40 rounded-lg px-2 py-2 hover:bg-pink-500/30"
              >
                Infantil 🎈
              </button>
              <button
                onClick={() => applyTemplate("elegant")}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 hover:bg-slate-700"
              >
                Elegante ✨
              </button>
              <button
                onClick={() => applyTemplate("minimal")}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 hover:bg-slate-700"
              >
                Minimal 🧼
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Elementos</h2>
              <div className="flex gap-2">
                <button
                  onClick={addTextElement}
                  className="text-xs bg-slate-800 px-2 py-1 rounded-lg hover:bg-slate-700"
                >
                  + Texto
                </button>

                <UploadButton
                  onUpload={(url: string) => addImageElement(url)}
                  label="+ Imagem"
                  className="text-xs bg-slate-800 px-2 py-1 rounded-lg hover:bg-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-auto pr-1">
              {config.elements.length === 0 && (
                <p className="text-xs text-slate-500">
                  Nenhum elemento ainda. Adicione um texto ou imagem.
                </p>
              )}

              {config.elements
                .slice()
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((el) => (
                  <div
                    key={el.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer border ${
                      selectedId === el.id
                        ? "bg-sky-500/20 border-sky-500"
                        : "bg-slate-800 border-slate-700"
                    }`}
                    onClick={() => setSelectedId(el.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="truncate">
                        {el.type === "text"
                          ? `Texto: "${(el as TextElement).text.slice(0, 15)}${
                              (el as TextElement).text.length > 15 ? "..." : ""
                            }"`
                          : "Imagem"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          bringToFront(el.id);
                        }}
                        className="px-1 text-[10px] rounded bg-slate-700 hover:bg-slate-600"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendToBack(el.id);
                        }}
                        className="px-1 text-[10px] rounded bg-slate-700 hover:bg-slate-600"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(el.id);
                        }}
                        className="px-1 text-[10px] rounded bg-red-700 hover:bg-red-600"
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Propriedades</h2>

            {!selectedElement && (
              <p className="text-xs text-slate-500">
                Selecione um elemento na lista para editar.
              </p>
            )}

            {selectedElement && selectedElement.type === "text" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1">Texto</label>
                  <textarea
                    value={(selectedElement as TextElement).text}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        text: e.target.value,
                      } as Partial<TextElement>)
                    }
                    className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label>Tamanho</label>
                  <input
                    type="range"
                    min={10}
                    max={48}
                    value={(selectedElement as TextElement).fontSize}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        fontSize: Number(e.target.value),
                      } as Partial<TextElement>)
                    }
                  />
                  <span className="w-8 text-right">
                    {(selectedElement as TextElement).fontSize}
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  <label>Cor</label>
                  <input
                    type="color"
                    value={(selectedElement as TextElement).color}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        color: e.target.value,
                      } as Partial<TextElement>)
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1">Fonte</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
                    value={(selectedElement as TextElement).fontFamily}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        fontFamily: e.target.value,
                      } as Partial<TextElement>)
                    }
                  >
                    <option value="inherit">Padrão</option>
                    <option value="Caveat">Manuscrita</option>
                    <option value="Fredoka">Divertida</option>
                    <option value="Playfair Display">Elegante</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Alinhamento</label>
                  <div className="flex gap-1">
                    {["left", "center", "right"].map((align) => (
                      <button
                        key={align}
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            align: align as "left" | "center" | "right",
                          } as Partial<TextElement>)
                        }
                        className={`flex-1 py-1 rounded-lg border text-[11px] ${
                          (selectedElement as TextElement).align === align
                            ? "bg-sky-500/20 border-sky-500"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      >
                        {align === "left"
                          ? "Esq"
                          : align === "center"
                          ? "Centro"
                          : "Dir"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontWeight:
                          (selectedElement as TextElement).fontWeight === "bold"
                            ? "normal"
                            : "bold",
                      } as Partial<TextElement>)
                    }
                    className={`flex-1 py-1 rounded-lg border text-[11px] ${
                      (selectedElement as TextElement).fontWeight === "bold"
                        ? "bg-sky-500/20 border-sky-500"
                        : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    Negrito
                  </button>
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontStyle:
                          (selectedElement as TextElement).fontStyle ===
                          "italic"
                            ? "normal"
                            : "italic",
                      } as Partial<TextElement>)
                    }
                    className={`flex-1 py-1 rounded-lg border text-[11px] ${
                      (selectedElement as TextElement).fontStyle === "italic"
                        ? "bg-sky-500/20 border-sky-500"
                        : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    Itálico
                  </button>
                </div>
              </div>
            )}

            {selectedElement && selectedElement.type === "image" && (
              <div className="space-y-3 text-xs">
                <div className="flex gap-2 items-center">
                  <label>Opacidade</label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={(selectedElement as ImageElement).opacity * 100}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        opacity: Number(e.target.value) / 100,
                      } as Partial<ImageElement>)
                    }
                  />
                  <span className="w-10 text-right">
                    {Math.round(
                      (selectedElement as ImageElement).opacity * 100
                    )}
                    %
                  </span>
                </div>

                <div>
                  <label className="block mb-1">Trocar imagem</label>
                  <UploadButton
                    onUpload={(url: string) =>
                      updateElement(selectedElement.id, {
                        url,
                      } as Partial<ImageElement>)
                    }
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <div
          className="w-full min-w-[600px] mr-10 flex justify-center overflow-auto md:overflow-visible"
          style={{ touchAction: "pan-y pinch-zoom" }}
        >
          <div
            ref={canvasRef}
            className="relative shadow-2xl rounded-3xl overflow-hidden border border-slate-800"
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
          >
            {config.elements
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                <Rnd
                  key={el.id}
                  bounds="parent"
                  size={{ width: el.width, height: el.height }}
                  position={{ x: el.x, y: el.y }}
                  onDragStop={(e, d) =>
                    updateElement(el.id, { x: d.x, y: d.y })
                  }
                  onResizeStop={(e, dir, ref, delta, pos) =>
                    updateElement(el.id, {
                      width: parseFloat(ref.style.width),
                      height: parseFloat(ref.style.height),
                      x: pos.x,
                      y: pos.y,
                    })
                  }
                  style={{
                    zIndex: el.zIndex,
                    border:
                      selectedId === el.id
                        ? "1px dashed #38bdf8"
                        : "1px solid transparent",
                    cursor: "move",
                  }}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
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
                          (el as TextElement).align === "left"
                            ? "flex-start"
                            : (el as TextElement).align === "right"
                            ? "flex-end"
                            : "center",
                        padding: "4px",
                        textAlign: (el as TextElement).align,
                        whiteSpace: "pre-wrap",
                        fontSize: (el as TextElement).fontSize,
                        color: (el as TextElement).color,
                        fontFamily: (el as TextElement).fontFamily,
                        fontWeight: (el as TextElement).fontWeight,
                        fontStyle: (el as TextElement).fontStyle,
                      }}
                    >
                      {(el as TextElement).text}
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <Image
                        src={(el as ImageElement).url}
                        alt=""
                        fill
                        className="object-contain"
                        style={{
                          opacity: (el as ImageElement).opacity,
                        }}
                      />
                    </div>
                  )}
                </Rnd>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMaxZIndex(elements: InviteElement[]) {
  if (elements.length === 0) return 1;
  return Math.max(...elements.map((e) => e.zIndex ?? 1));
}

function getMinZIndex(elements: InviteElement[]) {
  if (elements.length === 0) return 1;
  return Math.min(...elements.map((e) => e.zIndex ?? 1));
}

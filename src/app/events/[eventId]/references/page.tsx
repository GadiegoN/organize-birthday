/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Image from "next/image";
import UploadButton from "@/components/upload-button";

type Inspiration = {
  id: string;
  imageUrl: string;
  createdAt: number;
};

export default function InspirationsPage() {
  const { eventId } = useParams();
  const [photos, setPhotos] = useState<Inspiration[]>([]);
  const [uploading, setUploading] = useState(false);

  // estados do lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const q = query(
      collection(db, "events", String(eventId), "inspirations"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPhotos(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
      );
    });

    return () => unsub();
  }, [eventId]);

  // ➕ Adiciona imagem ao Firestore após upload
  async function addInspiration(url: string) {
    setUploading(true);
    try {
      await addDoc(collection(db, "events", String(eventId), "inspirations"), {
        imageUrl: url,
        createdAt: Date.now(),
      });
    } finally {
      setUploading(false);
    }
  }

  // ❌ Remover imagem
  async function removePhoto(id: string) {
    const ok = confirm("Excluir esta inspiração?");
    if (!ok) return;

    await deleteDoc(doc(db, "events", String(eventId), "inspirations", id));
  }

  // 👉 abrir lightbox
  function openLightbox(index: number) {
    setCurrentIndex(index);
    setZoom(1);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setZoom(1);
  }

  function nextPhoto() {
    setZoom(1);
    setCurrentIndex((prev) =>
      photos.length === 0 ? 0 : (prev + 1) % photos.length
    );
  }

  function prevPhoto() {
    setZoom(1);
    setCurrentIndex((prev) =>
      photos.length === 0 ? 0 : (prev - 1 + photos.length) % photos.length
    );
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom((z) => {
      const next = z + delta;
      if (next < 1) return 1;
      if (next > 3) return 3;
      return next;
    });
  }

  function handleDoubleClick() {
    setZoom((z) => (z === 1 ? 2.5 : 1));
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX;

    // swipe simples: > 50 px
    if (diff > 50) {
      // swipe direita -> foto anterior
      prevPhoto();
    } else if (diff < -50) {
      // swipe esquerda -> próxima foto
      nextPhoto();
    }

    setTouchStartX(null);
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Inspirações</h1>
        <p className="text-slate-400 text-sm">
          Salve inspirações do tema, decoração, bolo, lembrancinhas e mais.
        </p>
      </header>

      {/* Botão de Upload */}
      <div>
        <UploadButton onUpload={addInspiration} />

        {uploading && (
          <p className="text-sm text-slate-400 mt-2">Salvando no banco...</p>
        )}
      </div>

      {/* GRID DE FOTOS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((p, index) => (
          <div key={p.id} className="relative group">
            <button
              type="button"
              onClick={() => openLightbox(index)}
              className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-800 block"
            >
              <Image
                src={p.imageUrl}
                alt="inspiration"
                fill
                sizes="200px"
                className="object-cover"
              />
            </button>

            {/* Botão deletar */}
            <button
              onClick={() => removePhoto(p.id)}
              className="absolute top-2 right-2 bg-red-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
            >
              X
            </button>
          </div>
        ))}

        {photos.length === 0 && (
          <p className="text-slate-400 text-sm mt-3 col-span-full">
            Nenhuma inspiração ainda. Faça upload de algumas imagens! ✨
          </p>
        )}
      </section>

      {/* LIGHTBOX */}
      {lightboxOpen && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={closeLightbox}
        >
          {/* topo com fechar + posição */}
          <div className="flex items-center justify-between px-4 py-3 text-slate-100">
            <span className="text-sm">
              {currentIndex + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              className="text-sm px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700"
            >
              Fechar ✕
            </button>
          </div>

          {/* área da imagem */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden px-2"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="relative w-full h-full max-w-3xl max-h-[80vh]"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
            >
              <Image
                src={currentPhoto.imageUrl}
                alt="Inspiration big"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>

          {/* controles embaixo */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-black/70 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prevPhoto}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-sm"
              >
                ◀ Anterior
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Próxima ▶
              </button>
            </div>

            <div className="flex gap-2 items-center text-xs">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => (z <= 1 ? 1 : +(z - 0.5).toFixed(1)))
                }
                className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700"
              >
                -
              </button>
              <span>{zoom.toFixed(1)}x</span>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => (z >= 3 ? 3 : +(z + 0.5).toFixed(1)))
                }
                className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

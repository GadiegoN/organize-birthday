/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";

export default function UploadButton({ onUpload }: any) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setUploading(false);

    console.log("🔥 RESULTADO DA API:", data);

    if (data.secure_url) {
      onUpload(data.secure_url);
    }
  }

  return (
    <label className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm cursor-pointer">
      {uploading ? "Enviando..." : "Enviar imagem"}
      <input type="file" className="hidden" onChange={handleFile} />
    </label>
  );
}

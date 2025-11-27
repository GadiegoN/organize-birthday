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
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type Guest = {
  id: string;
  name: string;
  type: "adult" | "child";
  createdAt: number;
};

export default function GuestsPage() {
  const { eventId } = useParams();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"adult" | "child">("adult");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState<"adult" | "child">("adult");

  useEffect(() => {
    if (!eventId) return;

    const q = query(
      collection(db, "events", String(eventId), "guests"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Guest[] = snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          createdAt: data.createdAt,
        };
      });

      setGuests(list);
    });

    return () => unsub();
  }, [eventId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "events", String(eventId), "guests"), {
        name,
        type,
        createdAt: Date.now(),
        eventId: String(eventId),
      });

      setName("");
      setType("adult");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar convidado");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id);
    setEditingName(guest.name);
    setEditingType(guest.type);
  }

  async function handleEditSave() {
    if (!editingId) return;

    const ref = doc(db, "events", String(eventId), "guests", editingId);

    try {
      await updateDoc(ref, {
        name: editingName,
        type: editingType,
      });

      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao editar convidado");
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm("Tem certeza que deseja remover este convidado?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "events", String(eventId), "guests", id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir convidado");
    }
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Convidados</h1>
        <p className="text-slate-400 text-sm">
          Gerencie todos os convidados deste evento.
        </p>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Adicionar convidado</h2>

        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block mb-1 text-sm">Nome</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 outline-none"
              placeholder="Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "adult" | "child")}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 outline-none"
            >
              <option value="adult">Adulto</option>
              <option value="child">Criança</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="sm:col-span-3 bg-sky-600 hover:bg-sky-500 py-2 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Lista de convidados ({guests.length})
        </h2>

        {guests.length === 0 && (
          <p className="text-slate-500 text-sm">
            Nenhum convidado cadastrado ainda.
          </p>
        )}

        <div className="grid gap-3">
          {guests.map((guest) => {
            const isEditing = editingId === guest.id;

            return (
              <div
                key={guest.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center"
              >
                {!isEditing ? (
                  <>
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-xs text-slate-400">
                        {guest.type === "adult" ? "Adulto" : "Criança"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/events/${eventId}/guests/${guest.id}`}
                        className="px-3 py-1 text-xs bg-sky-700 rounded-lg hover:bg-sky-600"
                      >
                        Convite
                      </a>

                      <button
                        onClick={() => startEdit(guest)}
                        className="px-3 py-1 text-xs bg-slate-800 rounded-lg hover:bg-slate-700"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="px-3 py-1 text-xs bg-red-700 rounded-lg hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 space-y-2">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-sky-500"
                      />

                      <select
                        value={editingType}
                        onChange={(e) =>
                          setEditingType(e.target.value as "adult" | "child")
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 outline-none text-sm"
                      >
                        <option value="adult">Adulto</option>
                        <option value="child">Criança</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2 ml-3">
                      <button
                        onClick={handleEditSave}
                        className="px-3 py-1 text-xs bg-sky-600 rounded-lg hover:bg-sky-500"
                      >
                        Salvar
                      </button>

                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs bg-slate-700 rounded-lg hover:bg-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { BirthdayEvent } from "@/types/events";
import { db, auth } from "@/lib/firebase/client";
import Link from "next/link";

export default function EventsPage() {
  const [events, setEvents] = useState<BirthdayEvent[]>([]);
  const [name, setName] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState<number | "">("");
  const [local, setLocal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    async function loadEvents() {
      const ownerQ = query(
        collection(db, "events"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );

      const ownerSnap = await getDocs(ownerQ);
      const ownerEvents = ownerSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const allEventsSnap = await getDocs(collection(db, "events"));

      const allowedEvents: any[] = [];

      for (const evDoc of allEventsSnap.docs) {
        const eventId = evDoc.id;

        const allowedRef = doc(db, "events", eventId, "allowedUsers", uid);

        const allowedSnap = await getDoc(allowedRef);

        if (allowedSnap.exists()) {
          allowedEvents.push({
            id: eventId,
            ...evDoc.data(),
          });
        }
      }

      const finalList = [
        ...ownerEvents,
        ...allowedEvents.filter(
          (ev) => !ownerEvents.some((o) => o.id === ev.id)
        ),
      ];

      setEvents(finalList);
    }

    loadEvents();
  }, []);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !year || !date) return;

    try {
      setLoading(true);

      await addDoc(collection(db, "events"), {
        userId: auth.currentUser?.uid,
        name,
        year: Number(year),
        date,
        local,
        budget: budget ? Number(budget) : null,
        createdAt: Date.now(),
      });

      setName("");
      setYear("");
      setDate("");
      setBudget("");
      setLocal("");
    } catch (err) {
      console.error("Erro ao criar evento:", err);
      alert("Erro ao criar evento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">Meus Eventos</h1>
          <p className="text-slate-400 text-sm">
            Gerencie aqui todos os eventos que você criou ou tem permissão para
            editar.
          </p>
        </header>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-semibold">Criar novo evento</h2>

          <form
            onSubmit={handleCreateEvent}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Nome do Evento</label>
              <input
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="1º aniversário da Ana"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Ano</label>
              <input
                type="number"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="2025"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Data</label>
              <input
                type="date"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-sky-500 outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Local do Evento</label>
              <input
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="Ex: Buffet Encantado"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Orçamento (R$)</label>
              <input
                type="number"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="500"
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value ? Number(e.target.value) : "")
                }
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-sm font-medium transition"
              >
                {loading ? "Criando..." : "Criar evento"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Seus eventos</h2>

          {events.length === 0 && (
            <p className="text-slate-500 text-sm">Nenhum evento encontrado.</p>
          )}

          <div className="grid gap-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-900/70 transition"
              >
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">
                    {event.year}
                  </p>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-slate-500">
                    Data: {event.date || "Não definida"}
                  </p>
                  {event.budget != null && (
                    <p className="text-xs text-slate-400">
                      Orçamento: R$ {event.budget.toFixed(2)}
                    </p>
                  )}
                </div>

                <Link
                  href={`/events/${event.id}`}
                  className="text-xs rounded-xl border border-slate-600 px-3 py-1 hover:bg-slate-800 transition"
                >
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

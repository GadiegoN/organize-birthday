/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { LogOut } from "lucide-react";

export default function EventDashboard() {
  const { eventId } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [inspirations, setInspirations] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;

    const ref = doc(db, "events", String(eventId));
    getDoc(ref).then((snap) => setEvent({ id: snap.id, ...snap.data() }));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const q = query(
      collection(db, "events", String(eventId), "expenses"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => unsub();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const unsub = onSnapshot(
      collection(db, "events", String(eventId), "tasks"),
      (snap) =>
        setTasks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );

    return () => unsub();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const unsub = onSnapshot(
      collection(db, "events", String(eventId), "guests"),
      (snap) =>
        setGuests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );

    return () => unsub();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const unsub = onSnapshot(
      collection(db, "events", String(eventId), "inspirations"),
      (snap) =>
        setInspirations(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        )
    );

    return () => unsub();
  }, [eventId]);

  if (!event) {
    return <p className="text-slate-400">Carregando...</p>;
  }

  async function logout() {
    await auth.signOut();
    router.push("/login");
  }

  const totalSpent = expenses.reduce((acc, e) => acc + e.value, 0);
  const budget = event.budget || 0;
  const spentPercent = budget ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const completedTasks = tasks.filter((t) => t.done).length;
  const tasksPercent =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const byCategory = expenses.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + e.value;
    return acc;
  }, {});

  const pieData = Object.keys(byCategory).map((key) => ({
    name: key,
    value: byCategory[key],
  }));

  const COLORS = ["#38bdf8", "#f472b6", "#a78bfa", "#fb923c", "#34d399"];

  const byDay = expenses.reduce((acc: any, e: any) => {
    if (!acc[e.date]) acc[e.date] = 0;
    acc[e.date] += e.value;
    return acc;
  }, {});

  const lineData = Object.keys(byDay).map((day) => ({
    date: day,
    total: byDay[day],
  }));

  return (
    <div className="p-6 space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-sm text-slate-400">
            Evento • {event.date} • {event.year}
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-xl text-sm font-medium transition"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p>Total gasto</p>
          <h2 className="text-2xl font-bold text-green-400">
            R$ {totalSpent.toFixed(2)}
          </h2>
          {budget > 0 && (
            <p className="text-sm text-slate-400">
              {spentPercent.toFixed(0)}% do orçamento usado
            </p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p>Convidados</p>
          <h2 className="text-2xl font-bold">{guests.length}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p>Tarefas concluídas</p>
          <h2 className="text-2xl font-bold">
            {completedTasks} / {tasks.length}
          </h2>
          <div className="w-full h-2 bg-slate-800 rounded mt-2">
            <div
              className="h-full bg-sky-500 rounded"
              style={{ width: `${tasksPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p>Inspirações</p>
          <h2 className="text-2xl font-bold">{inspirations.length}</h2>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Gastos por categoria</h2>

        <div className="w-full h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Gastos por dia</h2>

        <div className="w-full h-72">
          <ResponsiveContainer>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#38bdf8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-20">
        <Link
          href={`/events/${event.id}/guests`}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center hover:bg-slate-800"
        >
          Convidados
        </Link>

        <Link
          href={`/events/${event.id}/tasks`}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center hover:bg-slate-800"
        >
          Tarefas
        </Link>

        <Link
          href={`/events/${event.id}/expenses`}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center hover:bg-slate-800"
        >
          Gastos
        </Link>

        <Link
          href={`/events/${event.id}/inspirations`}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center hover:bg-slate-800"
        >
          Inspirações
        </Link>
      </section>
    </div>
  );
}

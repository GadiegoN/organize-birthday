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

type Task = {
  id: string;
  name: string;
  category: string;
  status: "pending" | "doing" | "done";
  dueDate: string | null;
  createdAt: number;
};

export default function TasksPage() {
  const { eventId } = useParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("geral");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingStatus, setEditingStatus] = useState<
    "pending" | "doing" | "done"
  >("pending");
  const [editingCategory, setEditingCategory] = useState("geral");
  const [editingDueDate, setEditingDueDate] = useState("");

  const [loading, setLoading] = useState(false);

  // 🔥 Carrega tarefas em tempo real
  useEffect(() => {
    if (!eventId) return;

    const q = query(
      collection(db, "events", String(eventId), "tasks"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Task[] = snap.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          name: d.name,
          category: d.category,
          status: d.status,
          dueDate: d.dueDate,
          createdAt: d.createdAt,
        };
      });

      setTasks(list);
    });

    return () => unsub();
  }, [eventId]);

  // ➕ Criar tarefa
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "events", String(eventId), "tasks"), {
        name,
        category,
        status: "pending",
        dueDate: dueDate || null,
        createdAt: Date.now(),
      });

      setName("");
      setCategory("geral");
      setDueDate("");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar tarefa");
    } finally {
      setLoading(false);
    }
  }

  // 📝 Editar tarefa
  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditingName(task.name);
    setEditingCategory(task.category);
    setEditingStatus(task.status);
    setEditingDueDate(task.dueDate || "");
  }

  async function handleSaveEdit() {
    if (!editingId) return;

    const ref = doc(db, "events", String(eventId), "tasks", editingId);

    try {
      await updateDoc(ref, {
        name: editingName,
        status: editingStatus,
        category: editingCategory,
        dueDate: editingDueDate || null,
      });

      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao editar tarefa");
    }
  }

  // ❌ Excluir tarefa
  async function handleDelete(id: string) {
    const ok = confirm("Tem certeza que deseja excluir esta tarefa?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "events", String(eventId), "tasks", id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir tarefa");
    }
  }

  // 📊 Cálculo de progresso
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-slate-400 text-sm">
          Organize e acompanhe tudo o que precisa ser feito.
        </p>
      </header>

      {/* PROGRESSO */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <p className="text-sm text-slate-300 mb-2">
          Progresso: {done}/{total} tarefas concluídas
        </p>

        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </section>

      {/* FORM CRIAR */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Adicionar tarefa</h2>

        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block mb-1 text-sm">Nome</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 outline-none"
              placeholder="Comprar balões"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
            >
              <option value="geral">Geral</option>
              <option value="decoração">Decoração</option>
              <option value="comida">Comida</option>
              <option value="brinquedos">Brinquedos</option>
              <option value="lembrancinhas">Lembrancinhas</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1 text-sm">Data limite (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
            />
          </div>

          <button
            className="sm:col-span-3 bg-sky-600 hover:bg-sky-500 py-2 rounded-xl transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </form>
      </section>

      {/* LISTA */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Todas as tarefas</h2>

        {tasks.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhuma tarefa criada ainda.</p>
        )}

        <div className="grid gap-3">
          {tasks.map((task) => {
            const isEditing = editingId === task.id;

            return (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                {!isEditing ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-xs text-slate-400">
                        {task.category} •{" "}
                        {task.status === "pending"
                          ? "Pendente"
                          : task.status === "doing"
                          ? "Em andamento"
                          : "Concluída"}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          Prazo: {task.dueDate}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* BOTÃO STATUS */}
                      <select
                        value={task.status}
                        onChange={async (e) =>
                          await updateDoc(
                            doc(
                              db,
                              "events",
                              String(eventId),
                              "tasks",
                              task.id
                            ),
                            { status: e.target.value }
                          )
                        }
                        className="text-xs bg-slate-800 px-2 py-1 rounded-lg"
                      >
                        <option value="pending">Pendente</option>
                        <option value="doing">Em andamento</option>
                        <option value="done">Concluída</option>
                      </select>

                      <button
                        onClick={() => startEdit(task)}
                        className="text-xs bg-slate-800 px-3 py-1 rounded-lg hover:bg-slate-700"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-xs bg-red-700 px-3 py-1 rounded-lg hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* EDIÇÃO */}
                    <div className="space-y-3">
                      <input
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />

                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                      >
                        <option value="geral">Geral</option>
                        <option value="decoração">Decoração</option>
                        <option value="comida">Comida</option>
                        <option value="brinquedos">Brinquedos</option>
                        <option value="lembrancinhas">Lembrancinhas</option>
                      </select>

                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                        value={editingStatus}
                        onChange={(e) =>
                          setEditingStatus(e.target.value as any)
                        }
                      >
                        <option value="pending">Pendente</option>
                        <option value="doing">Em andamento</option>
                        <option value="done">Concluída</option>
                      </select>

                      <input
                        type="date"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                      />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveEdit}
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

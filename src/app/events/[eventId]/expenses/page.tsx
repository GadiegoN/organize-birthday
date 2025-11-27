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
import Image from "next/image";
import UploadButton from "@/components/upload-button";

type Expense = {
  id: string;
  item: string;
  category: string;
  value: number;
  date: string;
  imageUrl: string | null;
  createdAt: number;
};

export default function ExpensesPage() {
  const { eventId } = useParams();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("geral");
  const [value, setValue] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState("");
  const [editingCategory, setEditingCategory] = useState("geral");
  const [editingValue, setEditingValue] = useState<number | "">("");
  const [editingDate, setEditingDate] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");

  const [loading, setLoading] = useState(false);

  // 🔥 Carregar soma total por categoria
  const total = expenses.reduce((acc, e) => acc + e.value, 0);

  const totalByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.value;
    return acc;
  }, {} as Record<string, number>);

  // 🔥 Carrega gastos em tempo real
  useEffect(() => {
    if (!eventId) return;

    const q = query(
      collection(db, "events", String(eventId), "expenses"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Expense[] = snap.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          item: d.item,
          category: d.category,
          value: d.value,
          date: d.date,
          imageUrl: d.imageUrl,
          createdAt: d.createdAt,
        };
      });

      setExpenses(list);
    });

    return () => unsub();
  }, [eventId]);

  // ➕ Criar gasto
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !value || !date) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "events", String(eventId), "expenses"), {
        item,
        category,
        value: Number(value),
        date,
        imageUrl: imageUrl || null,
        createdAt: Date.now(),
      });

      setItem("");
      setCategory("geral");
      setValue("");
      setDate("");
      setImageUrl("");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar gasto");
    } finally {
      setLoading(false);
    }
  }

  // 📝 Editar
  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditingItem(expense.item);
    setEditingCategory(expense.category);
    setEditingValue(expense.value);
    setEditingDate(expense.date);
    setEditingImageUrl(expense.imageUrl || "");
  }

  async function handleSaveEdit() {
    if (!editingId) return;

    try {
      await updateDoc(
        doc(db, "events", String(eventId), "expenses", editingId),
        {
          item: editingItem,
          category: editingCategory,
          value: Number(editingValue),
          date: editingDate,
          imageUrl: editingImageUrl || null,
        }
      );

      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao editar gasto");
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm("Deseja excluir este gasto?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "events", String(eventId), "expenses", id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir gasto");
    }
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <header>
        <h1 className="text-2xl font-bold">Gastos</h1>
        <p className="text-slate-400 text-sm">
          Gerencie os gastos deste evento.
        </p>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-2">Total do evento</h2>
        <p className="text-2xl font-bold text-green-400">
          R$ {total.toFixed(2)}
        </p>

        <div className="mt-4 space-y-1">
          {Object.entries(totalByCategory).map(([cat, val]) => (
            <p key={cat} className="text-slate-400 text-sm">
              {cat}: <span className="text-slate-200">R$ {val.toFixed(2)}</span>
            </p>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Adicionar gasto</h2>

        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-sm mb-1 block">Item</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
              placeholder="Bolo, salgados..."
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Valor (R$)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
              value={value}
              onChange={(e) =>
                setValue(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
            >
              <option value="geral">Geral</option>
              <option value="comida">Comida</option>
              <option value="decoração">Decoração</option>
              <option value="brinquedos">Brinquedos</option>
              <option value="lembrancinhas">Lembrancinhas</option>
            </select>
          </div>

          <div>
            <label className="text-sm mb-1 block">Data</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-sm mb-1 block">Imagem (opcional)</label>

            <div className="flex items-center gap-2">
              <UploadButton onUpload={(url: any) => setImageUrl(url)} />

              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt="preview"
                  width={60}
                  height={60}
                  className="rounded-lg border border-slate-700 object-cover"
                />
              )}
            </div>
          </div>

          <button
            disabled={loading}
            className="sm:col-span-3 bg-sky-600 hover:bg-sky-500 py-2 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Todos os gastos</h2>

        {expenses.length === 0 && (
          <p className="text-slate-500 text-sm">
            Nenhum gasto registrado ainda.
          </p>
        )}

        <div className="grid gap-3">
          {expenses.map((e) => {
            const isEditing = editingId === e.id;

            return (
              <div
                key={e.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                {!isEditing ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{e.item}</p>
                      <p className="text-sm text-slate-400">
                        R$ {e.value.toFixed(2)} • {e.category}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{e.date}</p>
                      {e.imageUrl && (
                        <div className="relative mt-2 w-28 h-28">
                          <Image
                            src={e.imageUrl}
                            alt={`Imagem do item ${e.item}`}
                            fill
                            sizes="112px"
                            className="object-cover rounded-lg border border-slate-700"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => startEdit(e)}
                        className="text-xs bg-slate-800 px-3 py-1 rounded-lg hover:bg-slate-700"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs bg-red-700 px-3 py-1 rounded-lg hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <input
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                        value={editingItem}
                        onChange={(e) => setEditingItem(e.target.value)}
                      />

                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                        value={editingValue}
                        onChange={(e) =>
                          setEditingValue(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      />

                      <select
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                      >
                        <option value="geral">Geral</option>
                        <option value="comida">Comida</option>
                        <option value="decoração">Decoração</option>
                        <option value="brinquedos">Brinquedos</option>
                        <option value="lembrancinhas">Lembrancinhas</option>
                      </select>

                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                        value={editingDate}
                        onChange={(e) => setEditingDate(e.target.value)}
                      />

                      <div className="space-y-2">
                        <label className="text-sm mb-1 block">
                          Imagem do item
                        </label>

                        {editingImageUrl ? (
                          <div className="flex items-center gap-3">
                            <div className="relative w-24 h-24">
                              <Image
                                src={editingImageUrl}
                                alt="Imagem atual"
                                fill
                                className="object-cover rounded-lg border border-slate-700"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => setEditingImageUrl("")}
                              className="px-3 py-1 text-xs bg-red-700 rounded-lg hover:bg-red-600"
                            >
                              Remover imagem
                            </button>
                          </div>
                        ) : (
                          <UploadButton
                            onUpload={(url: string) => setEditingImageUrl(url)}
                          />
                        )}
                      </div>
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

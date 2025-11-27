/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  doc,
  where,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";

export default function EventAccessPage() {
  const { eventId } = useParams();

  const [allowedUsers, setAllowedUsers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const checkOwnership = useCallback(async () => {
    if (!eventId || !auth.currentUser) return;

    const evRef = doc(db, "events", String(eventId));
    const evSnap = await getDoc(evRef);

    if (!evSnap.exists()) return;

    const data = evSnap.data();
    setIsOwner(data.userId === auth.currentUser.uid);
  }, [eventId]);

  const loadUsers = useCallback(async () => {
    if (!eventId) return;

    const q = query(collection(db, "events", String(eventId), "allowedUsers"));
    const snap = await getDocs(q);

    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAllowedUsers(list);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    async function run() {
      await checkOwnership();
      await loadUsers();
    }

    run();
  }, [eventId, checkOwnership, loadUsers]);

  async function addUser() {
    if (!email) return;
    if (!isOwner) {
      alert("Apenas o dono do evento pode adicionar usuários.");
      return;
    }

    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Nenhum usuário encontrado com esse e-mail.");
      return;
    }

    const user = snap.docs[0];

    await setDoc(doc(db, "events", String(eventId), "allowedUsers", user.id), {
      uid: user.id,
      email: user.data().email,
      name: user.data().name || user.data().displayName || "",
      addedAt: Date.now(),
    });

    setEmail("");
    loadUsers();
  }

  async function removeUser(uid: string) {
    if (!isOwner) {
      alert("Apenas o dono do evento pode remover usuários.");
      return;
    }

    const ok = confirm("Remover este usuário do evento?");
    if (!ok) return;

    await deleteDoc(doc(db, "events", String(eventId), "allowedUsers", uid));

    loadUsers();
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Controle de Acesso</h1>

      {isOwner && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 max-w-lg">
          <h2 className="font-semibold text-lg">Adicionar usuário</h2>

          <input
            type="email"
            className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl outline-none"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={addUser}
            className="w-full bg-sky-600 hover:bg-sky-500 p-2 rounded-xl"
          >
            Adicionar
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-2">Usuários autorizados</h2>

      <div className="space-y-2 max-w-lg">
        {allowedUsers.map((u) => (
          <div
            key={u.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{u.name || u.email}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>

            {isOwner && (
              <button
                onClick={() => removeUser(u.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                remover
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Digite seu nome.");
      return;
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(cred.user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        name: name,
        displayName: name,
        createdAt: Date.now(),
      });

      router.push("/events");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Criar conta</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-1 text-slate-300 text-sm">Nome</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-sky-500 text-slate-100"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-slate-300 text-sm">Email</label>
            <input
              required
              type="email"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-sky-500 text-slate-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-slate-300 text-sm">Senha</label>
            <input
              required
              type="password"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 outline-none focus:border-sky-500 text-slate-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 transition rounded-xl py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <p className="text-slate-400 text-sm text-center">
            Já tem conta?{" "}
            <Link href="/login" className="text-sky-400 hover:underline">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

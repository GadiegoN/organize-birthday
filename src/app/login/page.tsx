/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/events");
    } catch (error: any) {
      setErrorMsg("Email ou senha inválidos.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-slate-400 text-sm text-center">
            Não tem conta?{" "}
            <Link href="/register" className="text-sky-400 hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import VardaanLogo from "@/components/VardaanLogo";

type GateState = "idle" | "submitting" | "error";

export default function AdminAccessGate() {
  const [state, setState] = useState<GateState>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setError("");

    const formData = new FormData(event.currentTarget);
    const token = String(formData.get("token") ?? "").trim();

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Access denied");
      }

      window.location.reload();
    } catch (submitError) {
      setState("error");
      setError(submitError instanceof Error ? submitError.message : "Access denied");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <VardaanLogo />
          <h1 className="mt-8 font-serif text-3xl text-slate-900 sm:text-4xl">Admin Access Required</h1>
          <p className="mt-3 text-slate-600">
            Enter your admin token to access the Architectural Marvels dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <input
              required
              name="token"
              type="password"
              placeholder="Enter admin token"
              className="rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-500 transition focus:ring"
            />

            <button
              type="submit"
              disabled={state === "submitting"}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state === "submitting" ? "Verifying..." : "Unlock Admin"}
            </button>

            {state === "error" && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                {error || "Access denied"}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

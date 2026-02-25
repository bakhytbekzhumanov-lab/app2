"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { LogIn, Mail, Lock, Chrome } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">Life RPG</h1>
          <p className="text-text-dim mt-2">Level up your life</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">{t.auth.signIn}</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-text-mid mb-1.5 block">{t.auth.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-text-mid mb-1.5 block">{t.auth.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-elevated border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-bg font-medium py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "..." : t.auth.signIn}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-dim">{t.auth.orContinueWith}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-bg-elevated border border-border rounded-lg py-2.5 text-sm hover:bg-bg-card-hover transition-colors flex items-center justify-center gap-2"
          >
            <Chrome className="w-4 h-4" />
            {t.auth.signInWithGoogle}
          </button>

          <p className="text-center text-sm text-text-dim mt-6">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="text-accent hover:underline">
              {t.auth.signUp}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

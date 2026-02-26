"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent">Life RPG</h1>
          <p className="text-text-dim mt-2">Level up your life</p>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-accent" />
          </div>

          <h2 className="text-xl font-semibold mb-3">Проверьте свою почту</h2>
          <p className="text-text-dim text-sm leading-relaxed mb-6">
            Мы отправили ссылку для подтверждения на вашу почту.
            Перейдите по ссылке, чтобы завершить регистрацию.
          </p>
          <p className="text-text-dim text-xs mb-6">
            Ссылка действительна 24 часа. Проверьте папку &quot;Спам&quot;, если не нашли письмо.
          </p>

          <Link
            href="/signin"
            className="inline-block bg-accent text-bg font-medium px-6 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Перейти ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}

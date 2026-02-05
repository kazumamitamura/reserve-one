"use client";

import { useActionState } from "react";
import type { login, register, AuthState } from "@/app/actions/auth";

type AuthFormProps = {
  action: typeof login | typeof register;
  type: "login" | "register";
};

export function AuthForm({ action, type }: AuthFormProps) {
  const [state, formAction] = useActionState(action, null as AuthState);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {type === "register" && (
        <p className="text-xs text-slate-500">登録後、メール確認が必要な場合があります。</p>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={type === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
      >
        {type === "login" ? "ログイン" : "登録する"}
      </button>
    </form>
  );
}

import Link from "next/link";
import { Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ページが見つかりません</h1>
          <p className="text-slate-600 mt-1">404 - Not Found</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md hover:bg-blue-700 transition"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}

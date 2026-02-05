# Reserve-One

B2B予約管理システム MVP（SelectType風デザイン）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.local.example` をコピーして `.env.local` を作成し、Supabase の値を設定してください。

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名キー

### 3. データベース

Supabase ダッシュボードの SQL Editor で以下を実行してください。

1. `supabase/schema.sql` を実行
2. **`supabase/migrations/remove_signup_triggers.sql` を実行**  
   （新規登録のエラーを防ぐため、トリガーを削除してアプリ側でプロファイル作成します）

### 4. 環境変数（新規登録に必須）

`.env.local` に **SUPABASE_SERVICE_ROLE_KEY** を追加してください。

- Supabase ダッシュボード → Settings → API → `service_role` キーをコピー
- このキーは **絶対に公開しないでください**（サーバーサイド専用）

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

管理者にしたいメールアドレスは、`src/app/actions/auth.ts` の `admin@example.com` を変更してください。

### 5. 開発サーバー

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 機能

- **ログイン / 新規登録**: `/login`, `/register`
- **管理者**: `/admin` - 枠作成・予約一覧
- **顧客**: `/dashboard` - 予約枠の表示・予約・キャンセル

## GitHub へのプッシュ

新規リポジトリとしてプッシュするには `GITHUB_PUSH.ps1` を実行してください。  
（PowerShell で `.\GITHUB_PUSH.ps1`）

## テクノロジー

- Next.js (App Router), TypeScript
- Tailwind CSS
- Supabase (Auth, PostgreSQL, RLS)
- Lucide React, date-fns

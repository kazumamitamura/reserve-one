# 新規登録エラー「Database error saving new user」の対処

## 原因

`auth.users` に登録時に実行される Reserve-One 用トリガー（`reserve_one_*`）が、RLS などで失敗しています。  
アプリは Service Role でプロファイルを作成するため、トリガーは不要です。

## 解決手順

### 1. Supabase で Reserve-One のトリガーを削除する

1. [Supabase ダッシュボード](https://supabase.com/dashboard) を開く
2. 対象プロジェクトを選択
3. 左メニューから **「SQL Editor」** をクリック
4. **「New query」** で新規クエリを作成
5. `supabase/migrations/remove_signup_triggers.sql` の内容をコピーして貼り付け
6. **「Run」**（または Ctrl+Enter）をクリック
7. `Success. No rows returned` と表示されれば成功

### 2. .env.local の確認

以下が設定されていることを確認してください。

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...（Supabase > Settings > API の service_role キー）
```

### 3. 開発サーバーの再起動

```bash
# Ctrl+C で停止後
npm run dev
```

### 4. 新規登録を再試行

`/register` で再度登録を試してください。

---

## それでもエラーになる場合

Supabase の **Logs** で詳細を確認できます。

1. ダッシュボード → **Logs** → **Postgres**
2. エラーログから具体的な原因を確認

また、**Authentication** → **Providers** で「Confirm email」が有効な場合、  
確認メール送信まで行われるため、その影響も考えられます。

# Vercel NOT_FOUND エラーの対処

[Vercel NOT_FOUND](https://vercel.com/docs/errors/NOT_FOUND) が表示される場合、以下を確認してください。

## 1. 環境変数の設定

Vercel ダッシュボード → プロジェクト → **Settings** → **Environment Variables** で以下を設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（新規登録に必要）

設定後、**Redeploy** で再デプロイしてください。

## 2. デプロイの確認

- **Deployments** タブで最新のデプロイが **Ready** になっているか確認
- ビルドが失敗している場合は **Build Logs** でエラー内容を確認

## 3. URL の確認

- デプロイ後の URL（例: `reserve-one-xxx.vercel.app`）を正確に入力しているか確認
- パスにタイポがないか確認（`/admin` など）

## 4. 動作確認用エンドポイント

デプロイが成功しているか確認するため、以下にアクセス：

- `https://あなたのドメイン.vercel.app/api/health`  
  → `{"status":"ok",...}` が返ればデプロイは成功

- `https://あなたのドメイン.vercel.app/`  
  → ログイン／新規登録画面が表示されれば正常

## 5. それでも解決しない場合

- [Vercel サポート](https://vercel.com/help) に問い合わせ
- デプロイログを確認してエラーメッセージを特定

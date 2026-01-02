# 環境構築手順

## 1. 前提条件

- Node.js 18.x 以上
- npm または yarn
- Supabase アカウント
- Vercel アカウント（デプロイ時）
- Google Cloud Console アカウント（OAuth設定用）

---

## 2. ローカル開発環境

### 2.1 リポジトリセットアップ

```bash
# 依存関係のインストール
npm install

# 必要なパッケージを追加
npm install @supabase/supabase-js @supabase/ssr zod
```

### 2.2 環境変数の設定

`.env.local` ファイルを作成：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 3. Supabase セットアップ

### 3.1 プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New Project」をクリック
3. プロジェクト名とパスワードを設定
4. リージョンは「Northeast Asia (Tokyo)」を選択

### 3.2 API キーの取得

1. Project Settings > API を開く
2. 以下の値を `.env.local` に設定：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.3 Google OAuth 設定

#### Google Cloud Console 側

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存を選択）
3. 「APIとサービス」>「認証情報」を開く
4. 「認証情報を作成」>「OAuth クライアント ID」を選択
5. アプリケーションの種類：「ウェブ アプリケーション」
6. 承認済みリダイレクト URI に以下を追加：
   - `https://<your-project>.supabase.co/auth/v1/callback`
7. クライアント ID とクライアントシークレットをメモ

#### Supabase 側

1. Authentication > Providers を開く
2. Google を有効化
3. Client ID と Client Secret を入力
4. 保存

### 3.4 データベーステーブル作成

Supabase の SQL Editor で以下を実行：

```sql
-- 詳細は docs/database.md を参照
```

---

## 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能

---

## 5. Vercel デプロイ

### 5.1 Vercel プロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「Add New」>「Project」をクリック
3. GitHub リポジトリを選択
4. 環境変数を設定（.env.local と同じ値）
5. デプロイ

### 5.2 本番用 OAuth 設定

1. Vercel のデプロイ URL を確認
2. Google Cloud Console で本番用リダイレクト URI を追加：
   - `https://your-domain.vercel.app/api/auth/callback`
3. Supabase で Site URL を更新：
   - Authentication > URL Configuration
   - Site URL: `https://your-domain.vercel.app`

---

## 6. トラブルシューティング

### OAuth エラー

- リダイレクト URI が正しく設定されているか確認
- Supabase の Site URL が正しいか確認

### DB接続エラー

- 環境変数が正しく設定されているか確認
- Supabase プロジェクトが起動しているか確認

### ビルドエラー

- Node.js バージョンを確認（18.x 以上）
- `node_modules` を削除して再インストール

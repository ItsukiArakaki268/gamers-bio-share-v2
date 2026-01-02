# 技術設計書

## 1. システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Next.js (App Router)                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │    │
│  │  │  Pages   │  │   API    │  │  Server  │      │    │
│  │  │ (React)  │  │  Routes  │  │ Actions  │      │    │
│  │  └──────────┘  └──────────┘  └──────────┘      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                            │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  PostgreSQL  │  │     Auth     │                     │
│  │   Database   │  │ (Google OAuth)│                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## 2. ディレクトリ構成

```
src/
├── app/                      # App Router
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # トップ（タイムライン）
│   ├── login/
│   │   └── page.tsx          # ログインページ
│   ├── cards/
│   │   ├── new/
│   │   │   └── page.tsx      # カード作成
│   │   ├── edit/
│   │   │   └── page.tsx      # カード編集
│   │   └── [id]/
│   │       └── page.tsx      # カード詳細
│   └── api/
│       └── auth/
│           └── callback/
│               └── route.ts  # OAuth コールバック
├── components/
│   ├── ui/                   # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Card.tsx
│   ├── layout/               # レイアウト関連
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── auth/                 # 認証関連
│   │   ├── LoginButton.tsx
│   │   └── LogoutButton.tsx
│   ├── profile/              # プロフカード関連
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileForm.tsx
│   │   └── GameSelector.tsx
│   └── timeline/             # タイムライン関連
│       └── Timeline.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # ブラウザ用クライアント
│   │   ├── server.ts         # サーバー用クライアント
│   │   └── middleware.ts     # 認証ミドルウェア
│   └── utils.ts              # ユーティリティ関数
├── types/
│   └── index.ts              # 型定義
└── constants/
    └── index.ts              # 定数（プレイスタイル等）
```

## 3. 型定義

```typescript
// types/index.ts

export type PlayStyle = 'serious' | 'casual' | 'solo' | 'party';
export type PlayTime = 'morning' | 'afternoon' | 'night' | 'midnight';

export interface SnsLinks {
  x?: string;
  youtube?: string;
  twitch?: string;
  discord?: string;
}

export interface Game {
  id: string;
  name: string;
  category: string;
}

export interface Profile {
  id: string;
  userId: string;
  nickname: string;
  bio?: string;
  playStyles: PlayStyle[];
  playTimes: PlayTime[];
  favoriteStreamers: string[];
  snsLinks: SnsLinks;
  games: Game[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
}
```

## 4. 定数定義

```typescript
// constants/index.ts

export const PLAY_STYLES = [
  { value: 'serious', label: 'ガチ' },
  { value: 'casual', label: 'エンジョイ' },
  { value: 'solo', label: 'ひとりで' },
  { value: 'party', label: 'みんなと' },
] as const;

export const PLAY_TIMES = [
  { value: 'morning', label: '朝' },
  { value: 'afternoon', label: '昼' },
  { value: 'night', label: '夜' },
  { value: 'midnight', label: '深夜' },
] as const;

export const SNS_TYPES = [
  { key: 'x', label: 'X', placeholder: 'https://x.com/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/username' },
  { key: 'discord', label: 'Discord', placeholder: 'username#1234' },
] as const;

export const TIMELINE_PAGE_SIZE = 20;
```

## 5. 認証フロー

```
1. ユーザーが「Googleでログイン」ボタンをクリック
2. Supabase Auth が Google OAuth 画面にリダイレクト
3. ユーザーが Google アカウントで認証
4. /api/auth/callback にリダイレクト
5. セッション確立、トップページへリダイレクト
```

## 6. データフロー

### プロフカード作成
```
1. /cards/new でフォーム入力
2. Server Action で Supabase に保存
3. 成功時、/cards/[id] にリダイレクト
```

### タイムライン表示
```
1. / にアクセス
2. Server Component で初期20件取得
3. スクロールで Client Component が追加取得
4. 無限スクロールで表示
```

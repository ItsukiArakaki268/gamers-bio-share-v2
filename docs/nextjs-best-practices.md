# Next.js ベストプラクティス

本プロジェクトで採用する Next.js App Router のベストプラクティスをまとめる。

---

## 1. コンポーネント設計

### 1.1 Server Components と Client Components の使い分け

```
Server Components（デフォルト）
├── データフェッチが必要
├── バックエンドリソースに直接アクセス
├── 機密情報（APIキー等）を扱う
└── 大きな依存関係を使用（バンドルサイズ削減）

Client Components（'use client'）
├── インタラクティブなUI（onClick, onChange等）
├── useState, useEffect 等のフックを使用
├── ブラウザAPI（localStorage等）を使用
└── クラスコンポーネントを使用
```

### 1.2 コンポーネント分割の原則

```tsx
// ❌ 悪い例：全体を Client Component にする
'use client'
export default function Page() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <Header />  {/* 静的なのに Client になる */}
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  )
}

// ✅ 良い例：インタラクティブな部分だけ Client Component に分離
// components/Counter.tsx
'use client'
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

// app/page.tsx（Server Component）
export default function Page() {
  return (
    <div>
      <Header />  {/* Server Component のまま */}
      <Counter /> {/* Client Component */}
    </div>
  )
}
```

---

## 2. データフェッチ

### 2.1 Server Components でのデータフェッチ

```tsx
// ✅ 推奨：Server Component で直接フェッチ
export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await getProfile(params.id)

  if (!profile) {
    notFound()
  }

  return <ProfileCard profile={profile} />
}
```

### 2.2 並列データフェッチ

```tsx
// ❌ 悪い例：直列フェッチ（遅い）
export default async function Page() {
  const profile = await getProfile()
  const games = await getGames()  // profile を待ってから実行
  return <div>...</div>
}

// ✅ 良い例：並列フェッチ
export default async function Page() {
  const [profile, games] = await Promise.all([
    getProfile(),
    getGames(),
  ])
  return <div>...</div>
}
```

### 2.3 キャッシュ戦略

```tsx
// 静的データ（ビルド時にキャッシュ）
fetch(url, { cache: 'force-cache' })

// 動的データ（毎回フェッチ）
fetch(url, { cache: 'no-store' })

// 時間ベースの再検証
fetch(url, { next: { revalidate: 3600 } })  // 1時間
```

---

## 3. Server Actions

### 3.1 基本的な使い方

```tsx
// lib/actions/profile.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProfile(formData: FormData) {
  // 1. 認証チェック
  const user = await getUser()
  if (!user) {
    return { error: '認証が必要です' }
  }

  // 2. バリデーション
  const validated = profileSchema.safeParse({
    nickname: formData.get('nickname'),
    bio: formData.get('bio'),
  })

  if (!validated.success) {
    return { error: validated.error.flatten() }
  }

  // 3. DB操作
  const { data, error } = await supabase
    .from('profiles')
    .insert(validated.data)
    .select()
    .single()

  if (error) {
    return { error: 'プロフカードの作成に失敗しました' }
  }

  // 4. キャッシュ更新とリダイレクト
  revalidatePath('/')
  redirect(`/cards/${data.id}`)
}
```

### 3.2 フォームでの使用

```tsx
// components/profile/ProfileForm.tsx
'use client'

import { useActionState } from 'react'
import { createProfile } from '@/lib/actions/profile'

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(createProfile, null)

  return (
    <form action={formAction}>
      <input name="nickname" required />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
    </form>
  )
}
```

---

## 4. ルーティング

### 4.1 ファイル規約

```
app/
├── layout.tsx        # 共通レイアウト（必須）
├── page.tsx          # ルートページ
├── loading.tsx       # ローディングUI
├── error.tsx         # エラーUI
├── not-found.tsx     # 404 UI
└── cards/
    ├── [id]/
    │   └── page.tsx  # 動的ルート
    └── new/
        └── page.tsx  # 静的ルート
```

### 4.2 Dynamic Routes

```tsx
// app/cards/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>
}

export default async function CardPage({ params }: Props) {
  const { id } = await params
  const profile = await getProfile(id)
  // ...
}

// 静的生成する場合
export async function generateStaticParams() {
  const profiles = await getProfiles()
  return profiles.map((profile) => ({
    id: profile.id,
  }))
}
```

### 4.3 ナビゲーション

```tsx
// ✅ 推奨：Link コンポーネント（プリフェッチ有効）
import Link from 'next/link'

<Link href="/cards/new">カード作成</Link>

// プログラマティックナビゲーション
'use client'
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/cards/new')
router.replace('/login')
router.back()
```

---

## 5. メタデータ

### 5.1 静的メタデータ

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | GamersCard',
    default: 'GamersCard - ゲーマー向けプロフカード共有',
  },
  description: 'ゲーマー・ストリーマーリスナー向けのプロフカード共有サービス',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'GamersCard',
  },
}
```

### 5.2 動的メタデータ

```tsx
// app/cards/[id]/page.tsx
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)

  return {
    title: profile?.nickname ?? 'プロフカード',
    description: profile?.bio ?? 'ゲーマー向けプロフカード',
  }
}
```

---

## 6. エラーハンドリング

### 6.1 Error Boundary

```tsx
// app/error.tsx
'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="text-gray-600">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        再試行
      </button>
    </div>
  )
}
```

### 6.2 Not Found

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">ページが見つかりません</h2>
      <Link href="/" className="mt-4 text-blue-500 hover:underline">
        トップへ戻る
      </Link>
    </div>
  )
}

// 動的ルートで使用
import { notFound } from 'next/navigation'

export default async function CardPage({ params }: Props) {
  const profile = await getProfile(params.id)

  if (!profile) {
    notFound()
  }

  return <ProfileCard profile={profile} />
}
```

---

## 7. パフォーマンス最適化

### 7.1 画像最適化

```tsx
import Image from 'next/image'

// ✅ 推奨：next/image を使用
<Image
  src="/avatar.png"
  alt="アバター"
  width={100}
  height={100}
  priority  // LCP 画像の場合
/>

// 外部画像の場合は next.config.js で設定
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
}
```

### 7.2 フォント最適化

```tsx
// app/layout.tsx
import { Noto_Sans_JP } from 'next/font/google'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>{children}</body>
    </html>
  )
}
```

### 7.3 Loading UI（Suspense）

```tsx
// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
    </div>
  )
}

// または Suspense で部分的にローディング
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<CardSkeleton />}>
        <Timeline />
      </Suspense>
    </div>
  )
}
```

---

## 8. セキュリティ

### 8.1 Server Actions のセキュリティ

```tsx
'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  // 1. 必ず認証チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // 2. 入力値のバリデーション
  const validated = schema.safeParse(Object.fromEntries(formData))
  if (!validated.success) {
    throw new Error('Invalid input')
  }

  // 3. 権限チェック（自分のリソースのみ操作可能）
  const profile = await getProfile(validated.data.id)
  if (profile?.userId !== user.id) {
    throw new Error('Forbidden')
  }

  // 4. DB操作
  // ...
}
```

### 8.2 環境変数

```tsx
// ✅ サーバーサイドのみ
process.env.SUPABASE_SERVICE_ROLE_KEY

// ✅ クライアントに公開（NEXT_PUBLIC_ プレフィックス必須）
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ❌ 機密情報を NEXT_PUBLIC_ にしない
// process.env.NEXT_PUBLIC_SECRET_KEY  // 危険！
```

---

## 9. 型安全性

### 9.1 型定義の共有

```tsx
// types/index.ts
export interface Profile {
  id: string
  userId: string
  nickname: string
  bio?: string
  // ...
}

// コンポーネントでの使用
interface ProfileCardProps {
  profile: Profile
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return <div>{profile.nickname}</div>
}
```

### 9.2 Zod によるランタイムバリデーション

```tsx
import { z } from 'zod'

// スキーマ定義
export const profileSchema = z.object({
  nickname: z.string().min(1).max(20),
  bio: z.string().max(30).optional(),
})

// 型の導出
export type ProfileInput = z.infer<typeof profileSchema>

// Server Action での使用
export async function createProfile(formData: FormData) {
  const result = profileSchema.safeParse({
    nickname: formData.get('nickname'),
    bio: formData.get('bio'),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  // result.data は型安全
  const { nickname, bio } = result.data
}
```

---

## 10. テスト

### 10.1 コンポーネントテスト

```tsx
// __tests__/components/ProfileCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProfileCard } from '@/components/profile/ProfileCard'

const mockProfile = {
  id: '1',
  nickname: 'テストユーザー',
  bio: 'よろしく！',
  // ...
}

describe('ProfileCard', () => {
  it('ニックネームが表示される', () => {
    render(<ProfileCard profile={mockProfile} />)
    expect(screen.getByText('テストユーザー')).toBeInTheDocument()
  })
})
```

### 10.2 Server Actions テスト

```tsx
// __tests__/actions/profile.test.ts
import { createProfile } from '@/lib/actions/profile'

describe('createProfile', () => {
  it('バリデーションエラー時にエラーを返す', async () => {
    const formData = new FormData()
    formData.set('nickname', '')  // 空文字

    const result = await createProfile(formData)

    expect(result.error).toBeDefined()
  })
})
```

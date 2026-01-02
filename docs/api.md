# API設計書

## 概要

本プロジェクトでは Next.js App Router の Server Actions を主に使用し、API Routes は認証コールバックのみで使用する。

---

## 1. Server Actions

### 1.1 プロフカード関連

#### createProfile
新規プロフカードを作成する

```typescript
// lib/actions/profile.ts
'use server'

export async function createProfile(formData: FormData): Promise<{
  success: boolean;
  profileId?: string;
  error?: string;
}>
```

**パラメータ（FormData）**
| キー | 型 | 必須 | 説明 |
|------|-----|------|------|
| nickname | string | ○ | ニックネーム（最大20文字） |
| bio | string | - | ひとこと（最大30文字） |
| gameIds | string[] | - | 選択したゲームのID配列 |
| favoriteStreamers | string[] | - | 好きな配信者（最大5人） |
| playStyles | string[] | - | プレイスタイル |
| playTimes | string[] | - | プレイ時間帯 |
| snsX | string | - | X URL |
| snsYoutube | string | - | YouTube URL |
| snsTwitch | string | - | Twitch URL |
| snsDiscord | string | - | Discord ID |

**レスポンス**
```typescript
// 成功時
{ success: true, profileId: "uuid" }

// 失敗時
{ success: false, error: "エラーメッセージ" }
```

---

#### updateProfile
プロフカードを更新する

```typescript
export async function updateProfile(
  profileId: string,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}>
```

---

#### deleteProfile
プロフカードを削除する

```typescript
export async function deleteProfile(profileId: string): Promise<{
  success: boolean;
  error?: string;
}>
```

---

### 1.2 データ取得関連

#### getProfiles
タイムライン用にプロフカード一覧を取得する

```typescript
export async function getProfiles(params: {
  cursor?: string;  // ページネーション用カーソル（最後のcreatedAt）
  limit?: number;   // 取得件数（デフォルト20）
}): Promise<{
  profiles: Profile[];
  nextCursor?: string;
}>
```

---

#### getProfile
プロフカード詳細を取得する

```typescript
export async function getProfile(profileId: string): Promise<Profile | null>
```

---

#### getMyProfile
ログインユーザーのプロフカードを取得する

```typescript
export async function getMyProfile(): Promise<Profile | null>
```

---

#### getGames
ゲームマスター一覧を取得する

```typescript
export async function getGames(): Promise<Game[]>
```

---

## 2. API Routes

### 2.1 認証コールバック

#### GET /api/auth/callback

OAuth認証完了後のコールバックエンドポイント

```typescript
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

---

## 3. バリデーション

### 3.1 プロフカード

```typescript
// lib/validations/profile.ts
import { z } from 'zod'

export const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, 'ニックネームは必須です')
    .max(20, 'ニックネームは20文字以内で入力してください'),
  bio: z
    .string()
    .max(30, 'ひとことは30文字以内で入力してください')
    .optional(),
  gameIds: z
    .array(z.string().uuid())
    .optional(),
  favoriteStreamers: z
    .array(z.string().max(50))
    .max(5, '配信者は最大5人まで登録できます')
    .optional(),
  playStyles: z
    .array(z.enum(['serious', 'casual', 'solo', 'party']))
    .optional(),
  playTimes: z
    .array(z.enum(['morning', 'afternoon', 'night', 'midnight']))
    .optional(),
  snsLinks: z.object({
    x: z.string().url().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal('')),
    twitch: z.string().url().optional().or(z.literal('')),
    discord: z.string().max(50).optional(),
  }).optional(),
})
```

---

## 4. エラーハンドリング

### 4.1 エラーコード

| コード | 説明 |
|--------|------|
| UNAUTHORIZED | 認証が必要 |
| FORBIDDEN | 権限がない |
| NOT_FOUND | リソースが見つからない |
| VALIDATION_ERROR | バリデーションエラー |
| ALREADY_EXISTS | プロフカードが既に存在する |
| INTERNAL_ERROR | サーバーエラー |

### 4.2 エラーレスポンス形式

```typescript
{
  success: false,
  error: "エラーメッセージ",
  code: "ERROR_CODE"
}
```

# データベース設計書

## 1. ER図

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    users    │       │    profiles     │       │    games    │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)         │    ┌──│ id (PK)     │
│ email       │  └───>│ user_id (FK)    │    │  │ name        │
│ created_at  │       │ nickname        │    │  │ category    │
└─────────────┘       │ bio             │    │  │ created_at  │
                      │ play_styles     │    │  └─────────────┘
                      │ play_times      │    │
                      │ favorite_streamers    │
                      │ sns_links       │    │
                      │ created_at      │    │
                      │ updated_at      │    │
                      └────────┬────────┘    │
                               │             │
                               │             │
                      ┌────────┴────────┐    │
                      │  profile_games  │    │
                      ├─────────────────┤    │
                      │ profile_id (FK) │────┘
                      │ game_id (FK)    │─────┘
                      └─────────────────┘
```

---

## 2. テーブル定義

### 2.1 profiles（プロフカード）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| user_id | uuid | NO | - | auth.users.id への外部キー |
| nickname | text | NO | - | ニックネーム（最大20文字） |
| bio | text | YES | NULL | ひとこと（最大30文字） |
| play_styles | text[] | YES | '{}' | プレイスタイル配列 |
| play_times | text[] | YES | '{}' | プレイ時間帯配列 |
| favorite_streamers | text[] | YES | '{}' | 好きな配信者配列（最大5件） |
| sns_links | jsonb | YES | '{}' | SNSリンク（JSON形式） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

**インデックス**
- `profiles_user_id_key`: user_id に UNIQUE 制約
- `profiles_created_at_idx`: created_at に降順インデックス（タイムライン用）

---

### 2.2 games（ゲームマスター）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|------|------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| name | text | NO | - | ゲーム名 |
| category | text | NO | - | カテゴリ |
| created_at | timestamptz | NO | now() | 作成日時 |

---

### 2.3 profile_games（中間テーブル）

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|----------|----------|------|------------|------|
| profile_id | uuid | NO | - | profiles.id への外部キー |
| game_id | uuid | NO | - | games.id への外部キー |

**制約**
- 主キー: (profile_id, game_id) の複合キー

---

## 3. SQL マイグレーション

Supabase SQL Editor で実行：

```sql
-- ================================
-- テーブル作成
-- ================================

-- profiles テーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL CHECK (char_length(nickname) <= 20),
  bio TEXT CHECK (char_length(bio) <= 30),
  play_styles TEXT[] DEFAULT '{}',
  play_times TEXT[] DEFAULT '{}',
  favorite_streamers TEXT[] DEFAULT '{}',
  sns_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- タイムライン用インデックス
CREATE INDEX profiles_created_at_idx ON profiles (created_at DESC);

-- games テーブル
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- profile_games 中間テーブル
CREATE TABLE profile_games (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, game_id)
);

-- ================================
-- RLS（Row Level Security）設定
-- ================================

-- profiles テーブル
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- 自分のプロフカードのみ作成可能
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のプロフカードのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分のプロフカードのみ削除可能
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- games テーブル
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- profile_games テーブル
ALTER TABLE profile_games ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "Profile games are viewable by everyone"
  ON profile_games FOR SELECT
  USING (true);

-- 自分のプロフカードの関連のみ操作可能
CREATE POLICY "Users can manage their own profile games"
  ON profile_games FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_games.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- ================================
-- updated_at 自動更新トリガー
-- ================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================
-- 初期データ投入（ゲームマスター）
-- ================================

INSERT INTO games (name, category) VALUES
  -- FPS/TPS
  ('Apex Legends', 'FPS/TPS'),
  ('VALORANT', 'FPS/TPS'),
  ('Fortnite', 'FPS/TPS'),
  ('Call of Duty', 'FPS/TPS'),
  ('Overwatch 2', 'FPS/TPS'),
  ('Splatoon 3', 'FPS/TPS'),
  ('Counter-Strike 2', 'FPS/TPS'),
  ('Rainbow Six Siege', 'FPS/TPS'),
  -- MOBA
  ('League of Legends', 'MOBA'),
  -- バトロワ
  ('PUBG', 'バトロワ'),
  -- RPG
  ('原神', 'RPG'),
  ('FF14', 'RPG'),
  ('モンスターハンター', 'RPG'),
  ('ゼルダの伝説', 'RPG'),
  ('ポケモン', 'RPG'),
  -- 格闘
  ('ストリートファイター6', '格闘'),
  ('スマブラSP', '格闘'),
  ('鉄拳8', '格闘'),
  -- カード
  ('ポケポケ', 'カード'),
  ('遊戯王マスターデュエル', 'カード'),
  ('Hearthstone', 'カード'),
  -- その他
  ('Minecraft', 'その他'),
  ('Among Us', 'その他'),
  ('雀魂', 'その他'),
  ('Fall Guys', 'その他');
```

---

## 4. sns_links JSONBフォーマット

```json
{
  "x": "https://x.com/username",
  "youtube": "https://youtube.com/@channel",
  "twitch": "https://twitch.tv/username",
  "discord": "username#1234"
}
```

---

## 5. play_styles / play_times 有効値

### play_styles
- `serious` : ガチ
- `casual` : エンジョイ
- `solo` : ひとりで
- `party` : みんなと

### play_times
- `morning` : 朝
- `afternoon` : 昼
- `night` : 夜
- `midnight` : 深夜

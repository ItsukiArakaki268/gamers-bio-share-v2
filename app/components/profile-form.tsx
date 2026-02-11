"use client";

import { useState } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type Game = {
  id: number;
  name: string;
};

type DefaultValues = {
  nickname: string;
  bio: string;
  gameIds: number[];
  streamers: string[];
};

type ProfileFormProps = {
  games: Game[];
  defaultValues?: DefaultValues;
  isEditMode?: boolean;
  profileId?: string;
  onSubmit: (data: {
    nickname: string;
    bio: string;
    gameIds: number[];
    streamers: string[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function ProfileForm({
  games,
  defaultValues,
  isEditMode,
  profileId,
  onSubmit,
  onDelete,
}: ProfileFormProps) {
  const [nickname, setNickname] = useState(defaultValues?.nickname || "");
  const [bio, setBio] = useState(defaultValues?.bio || "");
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>(
    defaultValues?.gameIds || [],
  );
  const [streamers, setStreamers] = useState<string[]>(
    defaultValues?.streamers || [""],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const filteredStreamers = streamers.filter((s) => s.trim() !== "");

      // Server Actionを呼び出し
      await onSubmit({
        nickname,
        bio,
        gameIds: selectedGameIds,
        streamers: filteredStreamers,
      });
    } catch (error) {
      // リダイレクトエラーは正常なので無視
      if (isRedirectError(error)) {
        throw error;
      }

      console.error(error);
      alert("エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        {isEditMode ? "プロフカード編集" : "プロフカード作成"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            ニックネーム
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            required
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="20文字以内"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            ひとこと
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={30}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="30文字以内"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            好きなゲーム
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {games.map((game) => (
              <label
                key={game.id}
                className="flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={selectedGameIds.includes(game.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGameIds([...selectedGameIds, game.id]);
                    } else {
                      setSelectedGameIds(
                        selectedGameIds.filter((id) => id !== game.id),
                      );
                    }
                  }}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {game.name}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            好きな配信者
          </label>
          <div className="space-y-3">
            {streamers.map((streamer, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={streamer}
                  onChange={(e) => {
                    const newStreamers = [...streamers];
                    newStreamers[index] = e.target.value;
                    setStreamers(newStreamers);
                  }}
                  placeholder={`配信者 ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                {streamers.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setStreamers(streamers.filter((_, i) => i !== index))
                    }
                    className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}

            {streamers.length < 5 && (
              <button
                type="button"
                onClick={() => setStreamers([...streamers, ""])}
                className="w-full px-3 py-2 text-sm text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                配信者を追加
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !nickname}
          className="w-full px-4 py-3 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSubmitting ? "送信中" : isEditMode ? "更新する" : "作成する"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";

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
};

export default function ProfileForm({
  games,
  defaultValues,
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

  return (
    <>
      <div>profile-form</div>
      <p>ニックネーム</p>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        required
      />
      <p>ひとこと</p>
      <input
        type="text"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={30}
      />
      <p>好きなゲーム</p>
      {games.map((game) => (
        <label key={game.id}>
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
          />
          {game.name}
        </label>
      ))}
    </>
  );
}

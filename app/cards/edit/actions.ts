"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type UpdateProfileData = {
  nickname: string;
  bio: string;
  gameIds: number[];
  streamers: string[];
};

export async function updateProfile(
  profileId: string,
  data: UpdateProfileData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("認証が必要です");
  }

  if (!data.nickname || data.nickname.length > 20) {
    throw new Error("ニックネームは1~20文字で入力してください");
  }

  if (data.bio && data.bio.length > 30) {
    throw new Error("ひとことは30文字以内で入力してください");
  }

  if (data.streamers.length > 5) {
    throw new Error("配信者は最大5人まで登録できます");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      nickname: data.nickname,
      bio: data.bio || null,
      favorite_streamers: data.streamers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (profileError) {
    throw new Error("プロフィール更新に失敗しました");
  }

  await supabase.from("profile_games").delete().eq("profile_id", profileId);

  if (data.gameIds.length > 0) {
    const profileGames = data.gameIds.map((gameId) => ({
      profile_id: profileId,
      game_id: gameId,
    }));
    await supabase.from("profile_games").insert(profileGames);
  }

  revalidatePath("/");
  redirect("/");
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "../../components/profile-form";
import { updateProfile } from "./actions";

export default async function EditCardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, bio, favorite_streamers")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/cards/new");
  }

  const { data: profileGames } = await supabase
    .from("profile_games")
    .select("game_id")
    .eq("profile_id", profile.id);

  const gameIds = profileGames?.map((pg) => pg.game_id) || [];

  const { data: games } = await supabase
    .from("games")
    .select("id, name")
    .order("id");

  const defaultValue = {
    nickname: profile.nickname,
    bio: profile.bio || "",
    gameIds: gameIds,
    streamers: profile.favorite_streamers || [],
  };
  return (
    <>
      <ProfileForm
        games={games || []}
        defaultValues={defaultValue}
        isEditMode={true}
        onSubmit={async (data) => {
          "use server";
          await updateProfile(profile.id, data);
        }}
      />
    </>
  );
}

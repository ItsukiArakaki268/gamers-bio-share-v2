import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function NewCardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (existingProfile) {
    redirect("/cards/edit");
  }

  const { data: games } = await supabase
    .from("games")
    .select("id, name")
    .order("id");

  return (
    <>
      <ProfileForm games={games || []} />
    </>
  );
}

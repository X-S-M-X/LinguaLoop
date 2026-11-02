export async function uploadAvatar(client, userId, file) {
  if (!userId) throw new Error("Please log in before changing your picture.");
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  ) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photos must be 5 MB or smaller.");
  }
  const bucket = client.storage.from("avatars");
  const path = `${userId}/avatar`;
  const { error: uploadError } = await bucket.upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) throw uploadError;
  const { data } = bucket.getPublicUrl(path);
  const url = data.publicUrl;
  const avatarUrl = url.startsWith("data:") ? url : `${url}?v=${Date.now()}`;
  const { data: updated, error } = await client
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated)
    throw new Error("Your picture could not be saved. Please try again.");
  return avatarUrl;
}

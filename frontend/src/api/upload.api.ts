import client from "./client";

export async function uploadImage(
  file: File,
  type: "avatar" | "cover"
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await client.post<{ url: string }>("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

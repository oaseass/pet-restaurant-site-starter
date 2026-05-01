export function slugifyKo(value: string) {
  return value
    .toLowerCase()
    .replace(/[()\[\]{}]/g, " ")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

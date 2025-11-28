export function formatDate(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString + "T00:00:00"); // evita erro de timezone

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

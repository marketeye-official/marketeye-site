// Blog post URL slug from its _posts filename:
// "2026-06-01-The-Gap-Between-Knowing.md" → "the-gap-between-knowing".
export function postSlug(file) {
  return file
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const SECTIONS = [
  { type: 'book',  slug: 'reads',  label: 'Reads' },
  { type: 'movie', slug: 'flicks', label: 'Flicks' },
  { type: 'music', slug: 'music',  label: 'Music' },
  { type: 'photo', slug: 'photos', label: 'Photos' },
  { type: 'link',  slug: 'links',  label: 'Links' },
  { type: 'note',  slug: 'notes',  label: 'Notes' },
  { type: 'item',  slug: 'items',  label: 'Items' },
  { type: 'place', slug: 'places', label: 'Places' },
] as const

export type SectionSlug = typeof SECTIONS[number]['slug']

export function slugToType(slug: string): string | null {
  return SECTIONS.find(s => s.slug === slug)?.type ?? null
}

export function typeToSlug(type: string): string | null {
  return SECTIONS.find(s => s.type === type)?.slug ?? null
}

export function typeToLabel(type: string): string | null {
  return SECTIONS.find(s => s.type === type)?.label ?? null
}

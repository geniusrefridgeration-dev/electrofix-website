import type { Language } from '@/types'

/**
 * Returns the correct localized name for a service/category/problem
 * Falls back to English name if translation not available
 */
export function getLocalizedName(
  item: { name?: string; nameHindi?: string; nameHinglish?: string } | null | undefined,
  language: Language
): string {
  if (!item) return ''
  switch (language) {
    case 'hindi':    return item.nameHindi    || item.name || ''
    case 'hinglish': return item.nameHinglish || item.name || ''
    default:         return item.name         || ''
  }
}

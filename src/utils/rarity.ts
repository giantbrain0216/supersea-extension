export const RARITY_TYPES = [
  {
    top: 0.001,
    name: 'Legendary' as const,
    color: { light: 'orange.200', dark: 'orange.500' },
  },
  {
    top: 0.01,
    name: 'Epic' as const,
    color: { light: 'purple.200', dark: 'purple.500' },
  },
  {
    top: 0.1,
    name: 'Rare' as const,
    color: { light: 'blue.200', dark: 'blue.500' },
  },
  {
    top: 0.5,
    name: 'Uncommon' as const,
    color: { light: 'green.200', dark: 'green.500' },
  },
  {
    top: Infinity,
    name: 'Common' as const,
    color: { light: 'gray.200', dark: 'gray.500' },
  },
]

export type RarityName = typeof RARITY_TYPES[number]['name']

export const determineRarityType = (rank: number, tokenCount: number) => {
  return rank === 1
    ? RARITY_TYPES[0]
    : RARITY_TYPES.find(({ top }) => rank / tokenCount <= top)!
}

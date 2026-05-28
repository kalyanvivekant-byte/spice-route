// Transliteration map for Indian script / phonetic equivalents
// e.g. "atta" = "aata" = "wheat flour"
const TRANSLITERATION_MAP: Record<string, string[]> = {
  atta: ['aata', 'ata', 'wheat flour', 'chapati flour'],
  aata: ['atta', 'ata', 'wheat flour'],
  dal: ['daal', 'dhal', 'lentils', 'pulses'],
  daal: ['dal', 'dhal', 'lentils'],
  chai: ['tea', 'masala tea', 'masala chai'],
  ghee: ['clarified butter', 'desi ghee'],
  paneer: ['cottage cheese', 'indian cheese'],
  basmati: ['basmati rice', 'long grain rice'],
  jeera: ['cumin', 'jira', 'zeera'],
  zeera: ['cumin', 'jeera', 'jira'],
  haldi: ['turmeric', 'haldee'],
  turmeric: ['haldi', 'haldee'],
  mirch: ['chilli', 'chili', 'pepper'],
  dhaniya: ['coriander', 'dhania'],
  dhania: ['coriander', 'dhaniya'],
  imli: ['tamarind'],
  besan: ['gram flour', 'chickpea flour'],
  maida: ['all purpose flour', 'refined flour'],
  suji: ['semolina', 'sooji', 'rava'],
  sooji: ['semolina', 'suji', 'rava'],
  rava: ['semolina', 'suji', 'sooji'],
  poha: ['flattened rice', 'beaten rice'],
  rajma: ['kidney beans', 'red kidney beans'],
  chana: ['chickpeas', 'chole', 'garbanzo'],
  chole: ['chickpeas', 'chana'],
  moong: ['mung', 'green gram'],
  mung: ['moong', 'green gram'],
  urad: ['black gram', 'urad dal'],
  masoor: ['red lentils', 'masoor dal'],
  toor: ['pigeon peas', 'arhar', 'toor dal'],
  arhar: ['pigeon peas', 'toor', 'toor dal'],
  achar: ['pickle', 'achaar'],
  achaar: ['pickle', 'achar'],
  papad: ['poppadom', 'pappad', 'papadum'],
  poppadom: ['papad', 'pappad'],
}

export function expandSearchQuery(query: string): string[] {
  const lower = query.toLowerCase().trim()
  const terms = new Set<string>([lower])

  // Check each word in the query
  lower.split(/\s+/).forEach((word) => {
    const aliases = TRANSLITERATION_MAP[word]
    if (aliases) aliases.forEach((a) => terms.add(a))
  })

  // Check full query
  const fullAliases = TRANSLITERATION_MAP[lower]
  if (fullAliases) fullAliases.forEach((a) => terms.add(a))

  return Array.from(terms)
}

export function buildSearchVector(terms: string[]): string {
  return terms.join(' | ')
}

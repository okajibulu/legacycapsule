// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/config/globalExpressions.ts
// PURPOSE: Curated multilingual expression library for Global Expressions strip.
//          Separate from participationLanguage.ts — different responsibility.
//          participationLanguage.ts = canonical labels and CTAs (event-aware)
//          globalExpressions.ts     = rotating multilingual expressions (cultural)
//
// ARCHITECTURE:
//   - Each entry is a word or phrase in a national/official language
//   - English entries rotate through a curated vocabulary (never repeated consecutively)
//   - Brand interludes inserted every 8-10 expressions
//   - No tribal or regional dialects — national/official languages only
//   - Adding new expressions requires only adding to the EXPRESSION_POOL array
//   - No code changes needed to add new languages or expressions
//
// ROTATION LOGIC (in GlobalExpressionsStrip.tsx):
//   - Random start position on first load (no obvious starting word)
//   - Continuous time-based progression — never resets on page revisit
//   - English appears every 2-3 foreign expressions (varied, not mechanical)
//   - Brand interlude every 8-10 expressions
//   - Fade transition only, pause on hover, reduced-motion respected
//
// BUILT BY: AI12 · Claude Sonnet 4.6 · 22 July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Types ═══

export interface Expression {
  text:       string          // The expression word/phrase
  language:   string          // Display language name e.g. 'French'
  isEnglish?: boolean         // English vocabulary entry
  isBrand?:   boolean         // Brand interlude entry
}

// ═══ SECTION 2 — English rotating vocabulary ═══
// Never show the same English word consecutively.
// Rotate through this curated set.

export const ENGLISH_VOCABULARY: string[] = [
  'Appreciation',
  'Gratitude',
  'Recognition',
  'Accolades',
  'Admiration',
  'Commendation',
  'Praise',
  'Tribute',
  'Honour',
  'Encomiums',
  'Reverence',
  'Celebration',
]

// ═══ SECTION 3 — Brand interludes ═══

export const BRAND_INTERLUDES: Expression[] = [
  { text: 'Celebrating legacy across cultures.', language: '', isBrand: true },
  { text: 'One legacy. Many expressions.',       language: '', isBrand: true },
  { text: 'Legacy speaks every language.',       language: '', isBrand: true },
  { text: 'Every culture has a way to honour.',  language: '', isBrand: true },
  { text: 'Honouring lives in every language.',  language: '', isBrand: true },
]

// ═══ SECTION 4 — International expression pool ═══
// National and official languages only. No tribal or regional dialects.
// Add new expressions here without any other code changes.
// Organised by region for maintainability.

export const FOREIGN_EXPRESSIONS: Expression[] = [

  // ── Europe ──────────────────────────────────────────────────────────────────
  { text: 'Éloges',           language: 'French' },
  { text: 'Hommage',          language: 'French' },
  { text: 'Reconnaissance',   language: 'French' },
  { text: 'Félicitations',    language: 'French' },

  { text: 'Elogios',          language: 'Spanish' },
  { text: 'Homenaje',         language: 'Spanish' },
  { text: 'Reconocimiento',   language: 'Spanish' },
  { text: 'Felicitaciones',   language: 'Spanish' },

  { text: 'Ehrerbietung',     language: 'German' },
  { text: 'Anerkennung',      language: 'German' },
  { text: 'Wertschätzung',    language: 'German' },
  { text: 'Glückwünsche',     language: 'German' },

  { text: 'Elogio',           language: 'Italian' },
  { text: 'Omaggio',          language: 'Italian' },
  { text: 'Riconoscimento',   language: 'Italian' },
  { text: 'Congratulazioni',  language: 'Italian' },

  { text: 'Homenagem',        language: 'Portuguese' },
  { text: 'Elogio',           language: 'Portuguese' },
  { text: 'Reconhecimento',   language: 'Portuguese' },
  { text: 'Parabéns',         language: 'Portuguese' },

  { text: 'Уважение',         language: 'Russian' },
  { text: 'Признание',        language: 'Russian' },
  { text: 'Почесть',          language: 'Russian' },
  { text: 'Поздравления',     language: 'Russian' },

  { text: 'Waardering',       language: 'Dutch' },
  { text: 'Lofbetuiging',     language: 'Dutch' },
  { text: 'Erkenning',        language: 'Dutch' },

  { text: 'Uppskattning',     language: 'Swedish' },
  { text: 'Erkännande',       language: 'Swedish' },
  { text: 'Hyllning',         language: 'Swedish' },

  { text: 'Uznanie',          language: 'Polish' },
  { text: 'Hołd',             language: 'Polish' },
  { text: 'Gratulacje',       language: 'Polish' },

  { text: 'Τιμή',             language: 'Greek' },
  { text: 'Αναγνώριση',       language: 'Greek' },
  { text: 'Συγχαρητήρια',     language: 'Greek' },

  // ── Middle East ──────────────────────────────────────────────────────────────
  { text: 'تكريم',            language: 'Arabic' },       // Takrīm — honour
  { text: 'امتنان',           language: 'Arabic' },       // Imtinān — gratitude
  { text: 'تقدير',            language: 'Arabic' },       // Taqdīr — appreciation
  { text: 'إشادة',            language: 'Arabic' },       // Ishāda — praise
  { text: 'مباركة',           language: 'Arabic' },       // Mubāraka — blessings
  { text: 'تهانٍ',            language: 'Arabic' },       // Tahānī — congratulations

  { text: 'قدردانی',          language: 'Persian' },      // Appreciation
  { text: 'احترام',           language: 'Persian' },      // Respect
  { text: 'تبریک',            language: 'Persian' },      // Congratulations

  { text: 'Takdir',           language: 'Turkish' },
  { text: 'Saygı',            language: 'Turkish' },
  { text: 'Tebrikler',        language: 'Turkish' },

  { text: 'הוקרה',            language: 'Hebrew' },       // Hokara — appreciation
  { text: 'כבוד',             language: 'Hebrew' },       // Kavod — honour
  { text: 'מזל טוב',          language: 'Hebrew' },       // Mazal tov

  // ── Asia ────────────────────────────────────────────────────────────────────
  { text: '赞赏',              language: 'Mandarin' },     // Zànshǎng — appreciation
  { text: '致敬',              language: 'Mandarin' },     // Zhìjìng — respect
  { text: '荣誉',              language: 'Mandarin' },     // Róngyù — honour
  { text: '祝贺',              language: 'Mandarin' },     // Zhùhè — congratulations
  { text: '感謝',              language: 'Mandarin' },     // Gǎnxiè — gratitude

  { text: '賞賛',              language: 'Japanese' },     // Shōsan — admiration
  { text: '敬意',              language: 'Japanese' },     // Keii — respect
  { text: 'おめでとう',         language: 'Japanese' },     // Omedetou — congratulations
  { text: '感謝',              language: 'Japanese' },     // Kansha — gratitude

  { text: '감사',              language: 'Korean' },       // Gamsa — gratitude
  { text: '존경',              language: 'Korean' },       // Jongyeong — respect
  { text: '축하',              language: 'Korean' },       // Chukha — congratulations

  { text: 'प्रशंसा',           language: 'Hindi' },        // Prashaṃsā — appreciation
  { text: 'सम्मान',            language: 'Hindi' },        // Sammān — honour
  { text: 'बधाई',              language: 'Hindi' },        // Badhāī — congratulations
  { text: 'कृतज्ञता',          language: 'Hindi' },        // Kṛtajñatā — gratitude

  { text: 'ਸਤਿਕਾਰ',           language: 'Punjabi' },      // Respect/honour
  { text: 'ਵਧਾਈ',             language: 'Punjabi' },      // Congratulations

  { text: 'Penghargaan',      language: 'Indonesian' },
  { text: 'Kehormatan',       language: 'Indonesian' },
  { text: 'Selamat',          language: 'Indonesian' },

  { text: 'Pagpapahalaga',    language: 'Filipino' },
  { text: 'Karangalan',       language: 'Filipino' },
  { text: 'Pagbati',          language: 'Filipino' },

  // ── Africa ──────────────────────────────────────────────────────────────────
  { text: 'Shukrani',         language: 'Swahili' },
  { text: 'Heshima',          language: 'Swahili' },
  { text: 'Hongera',          language: 'Swahili' },
  { text: 'Ukumbusho',        language: 'Swahili' },
  { text: 'Kuthamini',        language: 'Swahili' },

  { text: 'Girmawu',          language: 'Amharic' },      // Honour
  { text: 'Enkuan',           language: 'Amharic' },      // Congratulations
  { text: 'Ameseginalehu',    language: 'Amharic' },      // Thank you / appreciation

  { text: 'Godiya',           language: 'Hausa' },        // Gratitude
  { text: 'Daraja',           language: 'Hausa' },        // Honour/rank
  { text: 'Murna',            language: 'Hausa' },        // Celebration

  { text: 'Inhlonipho',       language: 'Zulu' },         // Respect
  { text: 'Ukubonga',         language: 'Zulu' },         // Gratitude
  { text: 'Amahle',           language: 'Zulu' },         // Beautiful/celebration

  { text: 'Ukuhlonipha',      language: 'Xhosa' },        // Respect
  { text: 'Enkosi',           language: 'Xhosa' },        // Gratitude

  { text: 'Nzuri',            language: 'Swahili' },
  { text: 'Asante',           language: 'Swahili' },

  // ── Americas ────────────────────────────────────────────────────────────────
  // Portuguese (Brazil) — already covered above
  // Spanish (Latin America) — already covered above

  { text: 'Tlazòhcamati',     language: 'Nahuatl' },      // Gratitude — Mexico
  { text: 'Yäʼätʼééh',       language: 'Navajo' },       // Greeting/celebration

]

// ═══ SECTION 5 — Sequence builder ═══
// Builds the full rotation sequence:
//   foreign, foreign, english, foreign, foreign, foreign, english,
//   foreign, foreign, english, [brand], foreign, foreign...
// English entries are drawn sequentially from ENGLISH_VOCABULARY.
// Brand interludes are inserted every 8-10 expressions (varied).

export function buildExpressionSequence(): Expression[] {
  const sequence: Expression[] = []
  const foreign  = [...FOREIGN_EXPRESSIONS]
  const english  = [...ENGLISH_VOCABULARY]
  const brands   = [...BRAND_INTERLUDES]

  let foreignIdx  = 0
  let englishIdx  = 0
  let brandIdx    = 0
  let sinceEnglish = 0
  let sinceBrand   = 0

  // Shuffle foreign pool for variety
  for (let i = foreign.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[foreign[i], foreign[j]] = [foreign[j], foreign[i]]
  }

  // Build a sequence of ~100 entries (loops automatically in component)
  const target = 100
  while (sequence.length < target) {
    // Insert brand interlude every 8-10 expressions
    if (sinceBrand >= 8 + (sinceBrand % 3)) {
      sequence.push(brands[brandIdx % brands.length])
      brandIdx++
      sinceBrand = 0
      continue
    }

    // Insert English every 2-3 foreign expressions
    if (sinceEnglish >= 2 + (sequence.length % 2)) {
      const word = english[englishIdx % english.length]
      sequence.push({ text: word, language: 'English', isEnglish: true })
      englishIdx++
      sinceEnglish = 0
      sinceBrand++
      continue
    }

    // Foreign expression
    sequence.push(foreign[foreignIdx % foreign.length])
    foreignIdx++
    sinceEnglish++
    sinceBrand++
  }

  return sequence
}

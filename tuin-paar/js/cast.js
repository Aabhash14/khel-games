// Everyone who might need to cross. Humans guard a bank and can pull the tuin.
// `eats` only happens on a bank with no human on it.
// faces: which way the picture looks, so it can be turned toward the river. size: real-world height relative to Didi.
export const CAST = {
  didi:    { e: '👩', en: 'Didi', ne: 'दिदी', human: true, pull: true, faces: 'front', size: 1, tint: '#f2c230' },
  bhai:    { e: '👦', en: 'Bhai', ne: 'भाइ', human: true, pull: true, lonely: true, faces: 'right', size: 0.88, tint: '#7cc6ff' },
  bandar:  { e: '🐒', en: 'Monkey', ne: 'बाँदर', pull: true, eats: ['momo', 'makai'], faces: 'left', size: 0.8, tint: '#c98b5a' },
  bagh:    { e: '🐯', en: 'Tiger', ne: 'बाघ', eats: ['bakhra', 'kukhura', 'kukur'], faces: 'left', size: 1, tint: '#ff9b3d' },
  bakhra:  { e: '🐐', en: 'Goat', ne: 'बाख्रा', eats: ['ghans'], faces: 'left', size: 0.86, tint: '#e8e2d4' },
  ghans:   { e: '🌾', en: 'Grass', ne: 'घाँस', faces: 'front', size: 0.74, tint: '#b9d66b' },
  kukur:   { e: '🐕', en: 'Dog', ne: 'कुकुर', eats: ['biralo'], faces: 'left', size: 0.8, tint: '#d9b48a' },
  biralo:  { e: '🐈', en: 'Cat', ne: 'बिरालो', eats: ['maachha'], faces: 'left', size: 0.66, tint: '#f0c27a' },
  maachha: { e: '🐟', en: 'Fish', ne: 'माछा', faces: 'left', size: 0.56, tint: '#8fd3f0' },
  kukhura: { e: '🐓', en: 'Hen', ne: 'कुखुरा', eats: ['makai'], faces: 'left', size: 0.7, tint: '#ff8a80' },
  makai:   { e: '🌽', en: 'Corn', ne: 'मकै', faces: 'front', size: 0.64, tint: '#ffe066' },
  momo:    { e: '🥟', en: 'Momo', ne: 'मःम', faces: 'front', size: 0.5, tint: '#f6e7cf' },
};

// Fixed order: share links encode cast members by their index here. Only append, never reorder.
export const IDS = ['didi', 'bhai', 'bandar', 'bagh', 'bakhra', 'ghans', 'kukur', 'biralo', 'maachha', 'kukhura', 'makai', 'momo'];

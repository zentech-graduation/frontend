// ── Static data for Luvax UI ───────────────────────────────────────────────

export const STORIES = [
  { id: 's0', author: 'you', idx: 0, hasStory: false, isOwn: true },
  { id: 's1', author: 'sol.r',  idx: 1, hasStory: true, viewed: false, type: 'photo',
    bg: '#C4BCB2', text: null, caption: 'morning' },
  { id: 's2', author: 'jo.x',   idx: 2, hasStory: true, viewed: false, type: 'text',
    bg: 'var(--lx-ink)', text: 'three minutes of\nreal quiet today', caption: null },
  { id: 's3', author: 'ren.ko', idx: 3, hasStory: true, viewed: false, type: 'video',
    bg: 'var(--lx-ink-2)', text: null, caption: 'walking somewhere' },
  { id: 's4', author: 'lea.p',  idx: 4, hasStory: true, viewed: true, type: 'photo',
    bg: '#BDB0A0', text: null, caption: 'film, 2023' },
  { id: 's5', author: 'noa.b',  idx: 5, hasStory: true, viewed: true, type: 'text',
    bg: '#C8A97E', text: 'observation\nis a practice', caption: null },
  { id: 's6', author: 'mara.v', idx: 6, hasStory: true, viewed: true, type: 'photo',
    bg: '#D5C9BE', text: null, caption: null },
];

export const PROFILE_POSTS = [
  { id: 1, color: '#D5CFC6', tall: true },
  { id: 2, color: '#C4BCB2', tall: false },
  { id: 3, color: '#BDB0A0', tall: false },
  { id: 4, color: '#C8C0B4', tall: true },
  { id: 5, color: '#DDD7CF', tall: false },
  { id: 6, color: '#E8E3DC', tall: false },
  { id: 7, color: '#D8C9B8', tall: false },
  { id: 8, color: '#C8A97E', tall: true },
  { id: 9, color: '#A8885A', tall: false },
];

export const TOPICS = ['photography', 'writing', 'analog', 'architecture', 'light', 'film', 'silence', 'texture', 'morning', 'observation'];

export const TRENDING = [
  { idx: 0, author: 'noa.b',  text: 'the moment before sunrise is the only honest time', tags: ['light'], img: false },
  { idx: 2, author: 'jo.x',   text: 'reading a physical book in 2026 feels radical', tags: ['offline'], img: true, color: '#C4BCB2', h: 240 },
  { idx: 3, author: 'ren.ko', text: 'negative space is not empty', tags: ['design', 'observation'], img: false },
  { idx: 1, author: 'sol.r',  text: 'roll of film from three years ago, developed today', tags: ['film', 'analog'], img: true, color: '#BDB0A0', h: 280 },
  { idx: 4, author: 'lea.p',  text: 'the texture of an old wall is its autobiography', tags: ['texture'], img: false },
  { idx: 5, author: 'mara.v', text: 'walked past the same tree every morning. today it was different.', tags: ['present'], img: true, color: '#D5C9BE', h: 320 },
  { idx: 6, author: 'kai.o',  text: 'making my room emptier on purpose', tags: ['minimalism'], img: false },
  { idx: 0, author: 'eli.w',  text: 'rain on a tin roof is the best podcast', tags: ['sound'], img: true, color: '#5C574F', h: 220 },
];

export const NOTIFS = [
  { idx: 1, type: 'like',    actor: 'sol.r',  text: 'liked your post', target: 'light is the medium, not the message.', time: '2m', unread: true },
  { idx: 2, type: 'follow',  actor: 'jo.x',   text: 'followed you', target: null, time: '14m', unread: true },
  { idx: 3, type: 'comment', actor: 'ren.ko', text: 'commented', target: 'mcluhan said it loud, you said it quieter.', time: '1h', unread: true },
  { idx: 4, type: 'like',    actor: 'lea.p',  text: 'liked your post', target: 'three minutes of real quiet today', time: '3h', unread: false },
  { idx: 5, type: 'mention', actor: 'noa.b',  text: 'mentioned you', target: '@mara.v this reminded me of you', time: '5h', unread: false },
  { idx: 0, type: 'story',   actor: 'eli.w',  text: 'viewed your story', target: null, time: '8h', unread: false },
  { idx: 1, type: 'follow_request', actor: 'kai.o', text: 'requested to follow you', target: null, time: '1d', unread: false },
];

export const INTEREST_CATEGORIES = [
  'photography', 'writing', 'film', 'analog', 'design', 'architecture',
  'music', 'reading', 'nature', 'travel', 'art', 'food',
  'cycling', 'running', 'coffee', 'minimalism',
];

export const SUGGESTED_TAGS = ['observation', 'photography', 'writing', 'light', 'analog', 'film', 'silence', 'texture', 'morning', 'film2025'];

export const ACCENT_PALETTES = [
  '#C8A97E',
  '#7A9E7A',
  '#C4847A',
];

export const FONT_MAP = {
  syne:  "'Syne', sans-serif",
  serif: "'Instrument Serif', serif",
};

export const TWEAK_DEFAULTS = {
  accent: '#C8A97E',
  dark: true,
  font: 'syne',
  density: 'cozy',
  showTags: true,
};

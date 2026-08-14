/**
 * Presentation configuration for the Luvax shell.
 *
 * This file used to also hold invented people, invented posts, invented
 * stories, invented notifications and a list of interests. All of it has been
 * removed. It rendered as though it were real content, and the story rail
 * built links out of it that led to stories which do not exist.
 *
 * Nothing that stands in for server data belongs here. If a surface needs
 * content, it reads it from the API or it says plainly that it has none.
 * See docs/social-states-and-tabs/fabricated-data-removal.md.
 */

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

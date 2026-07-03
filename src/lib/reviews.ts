export interface Review {
  id: string;
  name: string;
  initials: string;
  rating: 5;
  tag: string;
  text: string;
}

const REVIEW_TEXT = [
  "The scan actually broke my skin down by area. It felt way more specific than a normal quiz.",
  "I liked that it showed my strengths first and then gave me a simple plan.",
  "The product suggestions made sense for my dry skin instead of feeling random.",
  "The results page was super clear. I could actually understand what to do next.",
  "It helped me build a routine without spending forever researching products.",
  "The zone breakdown made the routine feel personal, especially around my T-zone.",
  "I expected generic advice, but the scan summary was surprisingly practical.",
  "The budget filter was useful. It did not try to push a huge routine.",
  "I liked seeing why each product was picked, not just a list of names.",
  "It felt calm and polished, and the scan did not make the feedback harsh.",
];

const REVIEW_PROFILES = [
  ["Maya", "M", "Texture"],
  ["Jules", "J", "Oily T-zone"],
  ["Ari", "A", "Dry skin"],
  ["Nia", "N", "Routine builder"],
  ["S.R.", "SR", "Sensitive skin"],
  ["Elena", "E", "Tone"],
  ["Kai", "K", "Simple routine"],
  ["Tess", "T", "Acne-prone"],
  ["A.K.", "AK", "Budget"],
  ["Leah", "L", "Clarity"],
];

export const REVIEWS: Review[] = Array.from({ length: 50 }, (_, index) => {
  const profile = REVIEW_PROFILES[index % REVIEW_PROFILES.length];
  return {
    id: `review-${index + 1}`,
    name: profile[0],
    initials: profile[1],
    rating: 5,
    tag: profile[2],
    text: REVIEW_TEXT[index % REVIEW_TEXT.length],
  };
});

export interface WeekGuide {
  week: number
  season: string
  phase: string
  what_changed: string
  focus: string[]
}

export const weeklyGuide: WeekGuide[] = [
  {
    week: 1,
    season: 'Fall',
    phase: 'Observation Week',
    what_changed: 'Program begins — no food changes yet',
    focus: [
      'Continue eating as you normally would',
      'Add 6–8 glasses of filtered water daily',
      'Begin the 5-5-5-5 breathing exercise twice daily',
      'Start observing your Food Dialogue — notice how foods make you feel',
    ],
  },
  {
    week: 2,
    season: 'Fall',
    phase: 'Sugar Vacation Begins',
    what_changed: 'Refined sugar removed; fruit and Alkagizer Mild added',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Take a vacation from all added and refined sugar',
      'Have 2–3 pieces of fruit on an empty stomach each morning (30 min before other food)',
      'Start the Alkagizer Mild daily',
      'Continue 6–8 glasses of water daily',
    ],
  },
  {
    week: 3,
    season: 'Fall',
    phase: 'Sugar Awareness',
    what_changed: 'No new removals — deepen sugar awareness',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Continue your vacation from refined sugar',
      'Learn to identify the 65+ hidden names of sugar on ingredient labels',
      'Avocado, tomato, olives, dabai, and lemon/lime are always available',
      'Raw honey, maple syrup, and coconut sugar acceptable in very small amounts if previously used',
    ],
  },
  {
    week: 4,
    season: 'Fall → Winter',
    phase: 'Grain & Dairy Exit',
    what_changed: 'All grains and dairy removed this week',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Step away from all grains: bread, pasta, rice, oats, and all cereal grains',
      'Take a break from all dairy (cow, goat, sheep milk products)',
      'Dairy alternatives allowed: almond milk, hemp milk, coconut milk — oat and rice milk are out',
      'Continue the Alkagizer Mild supplement daily',
    ],
  },
  {
    week: 5,
    season: 'Winter',
    phase: 'Full Detox Entry',
    what_changed: 'Food additives, alcohol, caffeine, and nicotine removed',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Take a break from all food additives, alcohol, caffeine, and nicotine',
      'Expect 1–5 days of mild adjustment if you consume caffeine — this is normal and will pass',
      'Continue 6–8 glasses of water daily',
      'Focus on whole, unprocessed vegetables and quality protein',
    ],
  },
  {
    week: 6,
    season: 'Winter',
    phase: 'Deep Winter',
    what_changed: 'No new removals — hold and deepen',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Hold all current guidelines — this is your deepest detox week',
      'Prioritize sleep and stress reduction',
      'Continue the Alkagizer Mild daily',
      'Notice improvements in energy, skin, and sleep quality',
    ],
  },
  {
    week: 7,
    season: 'Spring Entry',
    phase: 'Spring Begins',
    what_changed: 'Spring food list begins; water increases to 12 glasses; Alkagizer Prime starts',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Increase water to 12 glasses daily',
      'Maximize vegetable variety at every meal',
      'Lean quality protein: wild-caught fish preferred, then organic/pastured',
      'Nuts in moderation — one small handful per day (no peanuts or cashews)',
      'Begin the Alkagizer Prime supplement daily',
    ],
  },
  {
    week: 8,
    season: 'Spring',
    phase: 'Deep Spring',
    what_changed: 'No new changes — maintain Spring guidelines',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Continue all Spring guidelines with consistency',
      'Continue 12 glasses of water daily',
      'Keep Alkagizer Prime daily — vary the greens you use',
    ],
  },
  {
    week: 9,
    season: 'Spring',
    phase: 'Spring — Category Split',
    what_changed: 'Category 1 users may begin reintroducing less-sweet fruit',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Category 1: Begin adding small amounts of less-sweet fruits (berries, citrus, guava)',
      'Categories 2 & 3: Continue deep Spring guidelines — stay the course',
      'Fruit (if reintroducing) is consumed in the morning on an empty stomach only',
      'Move back to 8–10 glasses of water daily',
    ],
  },
  {
    week: 10,
    season: 'Spring',
    phase: 'Spring Continuation',
    what_changed: 'Category 1 adds more fruit; Categories 2 & 3 hold — final Spring week',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Category 1: Continue adding berries and low-glycemic fruit slowly',
      'Categories 2 & 3: This is your final full week of deep Spring — finish strong',
      'Continue Alkagizer Prime daily',
      'Do not let yourself go hungry — eat vegetables and protein abundantly',
    ],
  },
  {
    week: 11,
    season: 'Spring Exit',
    phase: 'Coming Out of Spring',
    what_changed: 'Root vegetables and low-glycemic fruit reintroduced for all categories',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'All categories: gradually add root vegetables (except white potato) and berries',
      'Add new foods slowly — one at a time — and observe how you feel',
      'Move back to 8–10 glasses of water daily',
      'The further you move toward Summer foods, the harder it is to return to Spring',
    ],
  },
  {
    week: 12,
    season: 'Transition',
    phase: 'Spring Reset Preparation',
    what_changed: 'Sweet foods removed again to prepare body for Spring state',
    focus: [
      'Maintain 5-5-5-5 breathing exercise twice daily',
      'Steer clear of fruits, sweet vegetables, beans, and honey this week',
      'Avoid sweet-tasting foods to signal the body back into Spring state',
      'Increase water back to 12 glasses daily',
      'Begin Alkagizer Prime daily if you stopped',
      'This is temporary — prepare for your next cycle',
    ],
  },
]

export function getWeekGuide(week: number): WeekGuide | undefined {
  return weeklyGuide.find(w => w.week === week)
}

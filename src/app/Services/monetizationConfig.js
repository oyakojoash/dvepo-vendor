// Development defaults only. Replace this module with server supplied pricing
// after Dvepo exposes an authenticated pricing configuration endpoint.
export const MONETIZATION_PRICING = {
  currency: "KSh",
  story: { price: 60, durationDays: 3 },
  trending: { price: 150, durationDays: 7 },
  bundle: {
    price: 250,
    storyDurationDays: 3,
    trendingDurationDays: 7,
  },
};

export const TRENDING_GROUPS = [
  { id: "premium", label: "Premium group", positions: "First 5 slots" },
  { id: "second", label: "Second group", positions: "Positions 6-8" },
  { id: "third", label: "Third group", positions: "Positions 9-11" },
];

export const COMMISSION_PLANS = [
  { id: "commission-25", monthlyPrice: 500, rate: 25 },
  { id: "commission-20", monthlyPrice: 800, rate: 20 },
  { id: "commission-15", monthlyPrice: 1200, rate: 15 },
  { id: "commission-10", monthlyPrice: 1600, rate: 10 },
  { id: "commission-5", monthlyPrice: 2400, rate: 5 },
];


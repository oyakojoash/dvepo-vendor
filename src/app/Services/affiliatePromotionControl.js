export function confirmAffiliatePromotionChange(enabled, confirmFn = window.confirm) {
  if (enabled) return true;
  return confirmFn(
    "Disable affiliate promotion for this product? Active affiliate memberships will be withdrawn."
  );
}

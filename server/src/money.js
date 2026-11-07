// Rupee <-> dollar helpers. The wallet is in paise; PayPal is charged in USD.

// Converts paise to a USD string with 2 decimals (rounded to the nearest cent, at least 1 cent).
function paiseToUsd(paise, inrPerUsd) {
  if (!Number.isInteger(paise) || paise <= 0) throw new Error('paise must be a positive whole number');
  if (!(inrPerUsd > 0)) throw new Error('inrPerUsd must be positive');
  // paise / 100 = rupees; rupees / inrPerUsd = dollars; dollars * 100 = cents  =>  cents = paise / inrPerUsd
  const cents = Math.max(1, Math.round(paise / inrPerUsd));
  return (cents / 100).toFixed(2);
}

const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

module.exports = { paiseToUsd, formatRupees };

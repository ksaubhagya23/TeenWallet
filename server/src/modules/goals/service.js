// Goal helpers. Pure functions: no database.
function goalView(row) {
  const target = Number(row.target_paise);
  const saved = Number(row.saved_paise);
  return {
    id: row.id,
    title: row.title,
    targetPaise: target,
    savedPaise: saved,
    remainingPaise: Math.max(target - saved, 0),
    percent: Math.min(Math.floor((saved / target) * 100), 100),
    reached: saved >= target,
    product: row.product_name ? { name: row.product_name, imageUrl: row.product_image_url, link: row.product_link } : null,
    createdAt: row.created_at,
  };
}

module.exports = { goalView };

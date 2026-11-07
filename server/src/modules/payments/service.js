// Credits a teen's wallet for a PayPal order. Safe to call twice: the ledger
// has a unique paypal_order_id, so the money can only ever be added once.
async function creditOrder(client, orderId) {
  const o = await client.query('SELECT * FROM paypal_orders WHERE order_id = $1 FOR UPDATE', [orderId]);
  if (o.rowCount === 0) return { found: false, credited: false };
  const order = o.rows[0];
  if (order.status === 'captured') return { found: true, credited: false, teenId: order.teen_id };

  const w = await client.query('SELECT id FROM wallets WHERE teen_id = $1', [order.teen_id]);
  const ins = await client.query(
    `INSERT INTO ledger_entries (wallet_id, amount_paise, type, merchant, paypal_order_id)
     VALUES ($1, $2, 'topup', 'PayPal', $3)
     ON CONFLICT (paypal_order_id) DO NOTHING`,
    [w.rows[0].id, order.amount_paise, orderId]
  );
  await client.query(`UPDATE paypal_orders SET status = 'captured', captured_at = now() WHERE order_id = $1`, [orderId]);
  return { found: true, credited: ins.rowCount > 0, teenId: order.teen_id, amountPaise: Number(order.amount_paise) };
}

module.exports = { creditOrder };

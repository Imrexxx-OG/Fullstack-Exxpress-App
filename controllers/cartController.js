import { getDBConnection } from '../db/db.js'

export async function addToCart(req, res) {
 const db = await getDBConnection()

 const productId = parseInt(req.body.productId, 10)

 if (isNaN(productId)) {
  return res.status(400).json({ error: 'Invalid product ID'})
 }

 const userId = req.session.userId

 const existing = await db.get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId])

 if (existing) {
  await db.run('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?', [existing.id])
 } else {
  await db.run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)', [userId, productId])
 }

 res.json({ message: 'Added to cart' })

}

export async function getCartCount(req, res) {
  const db = await getDBConnection()

  const result = await db.get(`SELECT SUM(quantity) AS totalItems FROM cart_items WHERE user_id = ?`, [req.session.userId])

  res.json({ totalItems: result.totalItems || 0 })
}  


export async function getAll(req, res) {

// Don't touch this code!
  if (!req.session.userId) {
    return res.json({err: 'not logged in'})
  }

  const db = await getDBConnection()

  const cartItems = await db.all(`SELECT 
                                          cart_items.id AS cartItemId,
                                          cart_items.quantity,
                                          products.title,
                                          products.artist,
                                          products.price
                                      FROM cart_items
                                      JOIN products ON cart_items.product_id = products.id
                                      WHERE cart_items.user_id = ?

                                          `, [req.session.userId])

   res.json({ items: cartItems })

} 

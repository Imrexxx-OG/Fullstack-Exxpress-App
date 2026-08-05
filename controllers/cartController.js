import { getDBConnection } from '../db/db.js'

export async function addToCart(req, res) {
 const db = await getDBConnection()

 const product = parseInt(req.body.productId)
 const user = req.session.userId

 if(!user){
  return res.status(401).json({error: "please log in to manage your data"})
 }

 const cartItem = await db.get(`SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`,[user, product])

 if(cartItem){
    await db.run(`UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ? `, [user, product])
 } else {
  await db.run(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?) `, [user, product, 1])
 }

 res.json({ message: 'Added to cart' })

/*
Challenge:

1. Write code to ensure that when a logged-in user clicks 'Add to Cart', the product is either added to their cart or its quantity increased if it’s already there, storing the data in the cart_items table. If successful, send the frontend this JSON: { message: 'Added to cart' }.

Ignore frontend console errors for now!

For testing, log in with:
Username: test
Password: test

Use logTable.js to verify success!

Loads of help in hint.md
*/

}

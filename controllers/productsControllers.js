export async function getProducts(req, res) {

  try {

    const db = await getDBConnection()

    // 1. Store the SQL query in a let variable
    let query = 'SELECT * FROM products'
    
    // 2. Pass it into the all() method
    const products = await db.all(query)
    
    // 3. Send the products back to the frontend
    res.json(products)

  } catch (err) {

    res.status(500).json({error: 'Failed to fetch products', details: err.message})

  }

}
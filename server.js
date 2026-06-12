import express from 'express'

const app = express()
const PORT = 8000
 
app.use(express.static('public'))

/*
Challenge 2:

- Handle any request to /api/products and pass it to productsRouter.

- Save and reload the mini browser. 
  You should see the results of the console.logs from productsControllers.js

*/
 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
}).on('error', (err) => {
  console.error('Failed to start server:', err)
}) 
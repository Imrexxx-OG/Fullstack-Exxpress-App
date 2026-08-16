import express from 'express'
import path from 'node:path'
import { productsRouter } from './routes/products.js'
import { authRouter } from './routes/auth.js'
import { meRouter } from './routes/me.js'
import { cartRouter } from './routes/cart.js'
import session from 'express-session'

const app = express()
const PORT = 8000

const secret = process.env.SPIRAL_SESSION_SECRET || 'jellyfish-baskingshark'


// Parse JSON request bodies
app.use(express.json())


// Sessions
app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
}))


// Serve files from the public folder
app.use(express.static(path.join(process.cwd(), 'public')))


// API routes
app.use('/api/products', productsRouter)

app.use('/api/auth/me', meRouter)

app.use('/api/auth', authRouter)

app.use('/api/cart', cartRouter)


// Test route
app.get('/test', (req, res) => {
  res.send('Express is working!')
})


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
}).on('error', (err) => {
  console.error('Failed to start server:', err)
})
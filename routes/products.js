import express from 'express'
import { getGenres, getProducts } from '../controllers/productsControllers.js'

const productsRouter = express.Router()

productsRouter.get('/genres', getGenres)
productsRouter.get('/', getProducts)

export default productsRouter
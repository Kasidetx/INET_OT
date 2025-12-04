// src/routes/ot.routes.js
import express from 'express'
import {
  getAllOt,
  getOtById,
  createOt,
  updateOt,
  deleteOt
} from '../controllers/ot.controller.js'

const router = express.Router()

// GET /api/ot
router.get('/', getAllOt)

// GET /api/ot/:id
router.get('/:id', getOtById)

// POST /api/ot
router.post('/', createOt)

// POST /api/ot/:id (Alias for update)
router.post('/:id', updateOt)

// PUT /api/ot/:id
router.put('/:id', updateOt)

// DELETE /api/ot/:id
router.delete('/:id', deleteOt)

export default router

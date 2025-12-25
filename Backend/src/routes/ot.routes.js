// src/routes/ot.routes.js
import express from 'express'
import {
  getAllEmployee,
  createOt,
  updateOt,
  deleteOt,
  getRequest,
  submitOtRequest
} from '../controllers/ot.controller.js'

const router = express.Router()

// GET /api/ot
router.get('/', getAllEmployee)

router.get('/request', getRequest)
// POST /api/ot/submit
router.post('/submit', submitOtRequest)

// POST /api/ot
router.post('/', createOt)

// PUT /api/ot/:id
router.put('/:id', updateOt)

// DELETE /api/ot/:id
router.delete('/:id', deleteOt)

export default router

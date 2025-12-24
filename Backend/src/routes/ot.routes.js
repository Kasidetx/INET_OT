// src/routes/ot.routes.js
import express from 'express'
import {
  getAllEmployee,
  createOt,
  updateOt,
  deleteOt,
  getRequest,

} from '../controllers/ot.controller.js'

const router = express.Router()

// GET /api/ot
router.get('/', getAllEmployee)

router.get('/request', getRequest)


// POST /api/ot
router.post('/', createOt)

// POST /api/ot/:id (Alias for update)
router.post('/:id', updateOt)

// PUT /api/ot/:id
router.put('/:id', updateOt)

// DELETE /api/ot/:id
router.delete('/:id', deleteOt)

export default router

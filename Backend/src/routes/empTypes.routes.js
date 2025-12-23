import express from 'express'

import { getAllEmpType, createTypes } from '../controllers/empTypes.controller.js'

const router = express.Router()

// api/types
router.get('/', getAllEmpType)

router.post('/', createTypes)

export default router;
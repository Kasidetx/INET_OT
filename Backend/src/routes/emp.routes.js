import express from 'express'

import { createEmp, AllEmp } from '../controllers/emp.controller.js'

const router = express.Router()

router.get('/', AllEmp)

router.post('/', createEmp)

export default router;
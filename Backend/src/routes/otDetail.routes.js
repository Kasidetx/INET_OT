// src/routes/otDetail.routes.js
import express from 'express';
import {
  getDetailsByOtId,
  createDetailsForOt,
  getAllDetails
} from '../controllers/otDetail.controller.js';

const router = express.Router();

// GET /api/ot/details
router.get('/', getAllDetails);

// GET /api/ot/10/details
router.get('/:id/details', getDetailsByOtId);

// POST /api/ot/10/details
router.post('/:id/details', createDetailsForOt);

export default router;

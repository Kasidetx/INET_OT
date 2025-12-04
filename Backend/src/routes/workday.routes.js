import express from 'express';
import {
    getAllWorkdays,
    getWorkdayById,
    createWorkday,
    updateWorkday,
    deleteWorkday
} from '../controllers/workday.controller.js';

const router = express.Router();

router.get('/', getAllWorkdays);
router.get('/:id', getWorkdayById);
router.post('/', createWorkday);
router.put('/:id', updateWorkday);
router.delete('/:id', deleteWorkday);

export default router;

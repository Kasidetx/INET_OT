import express from 'express';
import {
    getAllOtConfigs,
    getOtConfigById,
    createOtConfig,
    updateOtConfig,
    deleteOtConfig
} from '../controllers/otConfig.controller.js';

const router = express.Router();

router.get('/', getAllOtConfigs);
router.get('/:id', getOtConfigById);
router.post('/', createOtConfig);
router.put('/:id', updateOtConfig);
router.delete('/:id', deleteOtConfig);

export default router;

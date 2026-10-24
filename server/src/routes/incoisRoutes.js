/**
 * INCOIS Services Routes (/api/v1/integrations/incois)
 */

const express = require('express');
const router = express.Router();
const incoisController = require('../controllers/incoisController');

router.get('/status', (req, res, next) => incoisController.getStatusOverview(req, res, next));
router.get('/pfz', (req, res, next) => incoisController.getPfz(req, res, next));
router.get('/osf', (req, res, next) => incoisController.getOsf(req, res, next));
router.get('/tsunami', (req, res, next) => incoisController.getTsunami(req, res, next));
router.get('/marine-heatwave', (req, res, next) => incoisController.getMarineHeatwave(req, res, next));

module.exports = router;

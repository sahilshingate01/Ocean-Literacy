/**
 * Health & Operational Monitoring Routes (/api/v1/health)
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/liveness', (req, res) => healthController.getLiveness(req, res));
router.get('/readiness', (req, res) => healthController.getReadiness(req, res));
router.get('/diagnostic', (req, res) => healthController.getDiagnostic(req, res));

module.exports = router;

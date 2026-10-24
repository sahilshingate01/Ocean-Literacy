/**
 * INCOIS Information Integration HTTP Controllers
 */

const incoisAdapter = require('../integrations/incois/incoisAdapter');

class IncoisController {
  async getStatusOverview(req, res, next) {
    try {
      const overview = await incoisAdapter.getServiceStatusOverview();
      res.status(200).json({
        success: true,
        data: overview
      });
    } catch (err) {
      next(err);
    }
  }

  async getPfz(req, res, next) {
    try {
      const region = req.query.region || 'Maharashtra';
      const result = await incoisAdapter.getPfzAdvisory(region);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getOsf(req, res, next) {
    try {
      const sector = req.query.sector || 'West Coast';
      const result = await incoisAdapter.getOceanStateForecast(sector);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getTsunami(req, res, next) {
    try {
      const result = await incoisAdapter.getTsunamiStatus();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getMarineHeatwave(req, res, next) {
    try {
      const reefArea = req.query.reefArea || 'Gulf of Mannar';
      const result = await incoisAdapter.getMarineHeatwaveAlerts(reefArea);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IncoisController();

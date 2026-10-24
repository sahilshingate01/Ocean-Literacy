/**
 * Authentication and User Account Controllers
 */

const authService = require('../services/authService');
const { validateRegister, validateLogin, validatePasswordReset } = require('../validators/authValidator');
const config = require('../config');

function setAuthCookies(res, accessToken, refreshToken) {
  const isSecure = config.cookie.secure;

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: `${config.apiPrefix}/auth`,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: `${config.apiPrefix}/auth` });
}

class AuthController {
  async register(req, res, next) {
    try {
      const validated = validateRegister(req.body);
      const result = await authService.register(validated);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const validated = validateLogin(req.body);
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login({
        ...validated,
        ipAddress,
        userAgent
      });

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      const result = await authService.refresh({ refreshToken });

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      const userId = req.user?.id;

      await authService.logout({ userId, refreshToken });
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async requestPasswordReset(req, res, next) {
    try {
      const email = req.body?.email;
      if (!email) {
        return res.status(400).json({ success: false, error: { message: 'Email address is required.' } });
      }
      const result = await authService.requestPasswordReset(email);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const validated = validatePasswordReset(req.body);
      const result = await authService.resetPassword(validated);
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await authService.updateSettings(userId, req.body || {});
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async exportData(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await authService.exportUserData(userId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const password = req.body?.password;
      if (!password) {
        return res.status(400).json({ success: false, error: { message: 'Password is required to delete account.' } });
      }
      const result = await authService.deleteAccount(userId, password);
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();

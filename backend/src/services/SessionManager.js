const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pino = require("pino");

const logger = pino();

// In-memory session storage
const sessionStore = new Map();

class SessionManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.tokenExpiry = process.env.JWT_EXPIRY || "24h";
    this.kioskExpiry = process.env.KIOSK_JWT_EXPIRY || "8h";
  }

  async createSession(userId, siteIds, role) {
    try {
      const sessionId = uuidv4();
      const token = jwt.sign(
        { userId, sessionId, role, siteIds, type: "USER" },
        this.jwtSecret,
        { expiresIn: this.tokenExpiry },
      );

      const sessionData = {
        userId,
        sessionId,
        type: "USER",
        role,
        siteIds: JSON.stringify(siteIds),
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      const expiryMs = this.parseExpiry(this.tokenExpiry) * 1000;
      const key = `session:${sessionId}`;
      sessionStore.set(key, sessionData);
      logger.info(
        { sessionId, userId, key, storeSize: sessionStore.size },
        "User session created and stored",
      );

      setTimeout(() => {
        sessionStore.delete(key);
        logger.info({ sessionId, key }, "Session auto-expired");
      }, expiryMs);

      return { token, sessionId, expiresIn: this.tokenExpiry };
    } catch (error) {
      logger.error({ error }, "Failed to create session");
      throw error;
    }
  }

  async createKioskSession() {
    try {
      const sessionId = uuidv4();
      const token = jwt.sign(
        { sessionId, type: "KIOSK", siteIds: ["*"] },
        this.jwtSecret,
        { expiresIn: this.kioskExpiry },
      );

      const sessionData = {
        sessionId,
        type: "KIOSK",
        siteIds: "*",
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      const expiryMs = this.parseExpiry(this.kioskExpiry) * 1000;
      sessionStore.set(`session:${sessionId}`, sessionData);

      setTimeout(() => {
        sessionStore.delete(`session:${sessionId}`);
      }, expiryMs);

      logger.info({ sessionId }, "Kiosk session created");
      return { token, sessionId, expiresIn: this.kioskExpiry };
    } catch (error) {
      logger.error({ error }, "Failed to create kiosk session");
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      logger.info(
        { tokenPreview: token.substring(0, 50) },
        "Verifying token...",
      );
      const decoded = jwt.verify(token, this.jwtSecret);
      logger.info(
        { sessionId: decoded.sessionId },
        "Token decoded successfully",
      );

      const sessionKey = `session:${decoded.sessionId}`;
      const sessionData = sessionStore.get(sessionKey);

      logger.info(
        {
          sessionId: decoded.sessionId,
          sessionExists: !!sessionData,
          storeSize: sessionStore.size,
          allKeys: Array.from(sessionStore.keys()),
        },
        "Verifying token",
      );

      if (!sessionData) {
        throw new Error(
          `Session not found or expired. Key: ${sessionKey}, Store has ${sessionStore.size} entries`,
        );
      }

      return { ...decoded, ...sessionData };
    } catch (error) {
      logger.error(
        { errorMsg: error.message, errorName: error.name },
        "Token verification failed",
      );
      throw error;
    }
  }

  async touchSession(sessionId) {
    try {
      const sessionData = sessionStore.get(`session:${sessionId}`);
      if (sessionData) {
        sessionData.lastActivity = Date.now();
        sessionStore.set(`session:${sessionId}`, sessionData);
      }
    } catch (error) {
      logger.warn({ error, sessionId }, "Failed to touch session");
    }
  }

  async revokeSession(sessionId) {
    try {
      sessionStore.delete(`session:${sessionId}`);
      logger.info({ sessionId }, "Session revoked");
    } catch (error) {
      logger.error({ error, sessionId }, "Failed to revoke session");
      throw error;
    }
  }

  async getActiveSessions(userId) {
    try {
      const sessions = [];
      for (const [key, sessionData] of sessionStore.entries()) {
        if (sessionData.userId === userId) {
          sessions.push(sessionData);
        }
      }
      return sessions;
    } catch (error) {
      logger.error({ error, userId }, "Failed to get active sessions");
      throw error;
    }
  }

  parseExpiry(expiryStr) {
    const match = expiryStr.match(/(\d+)([smhd])/);
    if (!match) return 3600;
    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(value) * multipliers[unit];
  }
}

module.exports = SessionManager;

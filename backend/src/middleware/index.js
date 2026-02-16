const pino = require("pino");

const logger = pino();

const authMiddleware = (sessionManager) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Missing authorization token" });
      }
      const session = await sessionManager.verifyToken(token);
      req.session = session;
      req.user = {
        id: session.userId,
        role: session.role,
        siteIds: JSON.parse(session.siteIds || "[]"),
      };
      await sessionManager.touchSession(session.sessionId);
      next();
    } catch (error) {
      logger.warn(
        { errorMsg: error?.message, errorStack: error?.stack },
        "Auth middleware failed",
      );
      console.error("[AUTH ERROR]", error?.message);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};

const kioskMiddleware = (sessionManager) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const session = await sessionManager.verifyToken(token);
        if (session.type === "KIOSK") {
          req.session = session;
          req.user = { role: "kiosk", siteIds: ["*"] };
          return next();
        }
      }
      const { token: kioskToken, sessionId } =
        await sessionManager.createKioskSession();
      req.session = { sessionId, type: "KIOSK" };
      req.user = { role: "kiosk", siteIds: ["*"] };
      res.setHeader("X-Kiosk-Token", kioskToken);
      next();
    } catch (error) {
      logger.warn({ error }, "Kiosk middleware failed");
      res.status(500).json({ error: "Kiosk initialization failed" });
    }
  };
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
      },
      "Request completed",
    );
  });
  next();
};

module.exports = { authMiddleware, kioskMiddleware, authorize, requestLogger };

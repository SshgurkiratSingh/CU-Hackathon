const pino = require("pino");

const logger = pino();

const attachNoAuthContext = (req) => {
  req.session = req.session || { sessionId: "no-auth", type: "NO_AUTH" };
  req.user = req.user || {
    id: "no-auth-user",
    role: "admin",
    siteIds: ["*"],
  };
};

const authMiddleware = (maybeSessionManagerOrReq, maybeRes, maybeNext) => {
  // Support both usages:
  // 1) router.get("/", authMiddleware, ...)
  // 2) app.use("/x", authMiddleware(sessionManager), ...)
  if (
    maybeSessionManagerOrReq &&
    typeof maybeSessionManagerOrReq === "object" &&
    maybeSessionManagerOrReq.headers &&
    typeof maybeNext === "function"
  ) {
    attachNoAuthContext(maybeSessionManagerOrReq);
    return maybeNext();
  }

  return async (req, res, next) => {
    attachNoAuthContext(req);
    next();
  };
};

const kioskMiddleware = (maybeSessionManagerOrReq, maybeRes, maybeNext) => {
  if (
    maybeSessionManagerOrReq &&
    typeof maybeSessionManagerOrReq === "object" &&
    maybeSessionManagerOrReq.headers &&
    typeof maybeNext === "function"
  ) {
    maybeSessionManagerOrReq.session = maybeSessionManagerOrReq.session || {
      sessionId: "no-auth-kiosk",
      type: "KIOSK",
    };
    maybeSessionManagerOrReq.user = maybeSessionManagerOrReq.user || {
      id: "kiosk-user",
      role: "admin",
      siteIds: ["*"],
    };
    return maybeNext();
  }

  return async (req, res, next) => {
    req.session = req.session || { sessionId: "no-auth-kiosk", type: "KIOSK" };
    req.user = req.user || { id: "kiosk-user", role: "admin", siteIds: ["*"] };
    next();
  };
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Authorization disabled
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

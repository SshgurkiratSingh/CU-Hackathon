const express = require("express");
const bcrypt = require("bcryptjs");
const pino = require("pino");
const { User } = require("../schemas");

const logger = pino();
const router = express.Router();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const successResponse = (data, message) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});
const errorResponse = (error, status = 400) => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json(errorResponse("Missing required fields", 400));
    }
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse("Invalid email format", 400));
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json(errorResponse("Password must be at least 8 characters", 400));
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json(errorResponse("Email already registered", 409));
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: role || "farmer",
      siteIds: [],
    });
    await user.save();
    logger.info({ userId: user._id, email }, "New user registered");
    res
      .status(201)
      .json(
        successResponse(
          { userId: user._id, email: user.email },
          "User registered successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json(errorResponse("Email and password required", 400));
    }
    const user = await User.findOne({
      email: email.toLowerCase(),
      active: true,
    });
    if (!user) {
      return res.status(401).json(errorResponse("Invalid credentials", 401));
    }
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json(errorResponse("Invalid credentials", 401));
    }
    user.lastLogin = new Date();
    await user.save();
    const { token, sessionId, expiresIn } =
      await req.sessionManager.createSession(user._id, user.siteIds, user.role);
    logger.info({ userId: user._id }, "User logged in");
    res.json(
      successResponse(
        {
          token,
          sessionId,
          expiresIn,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        "Login successful",
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res) => {
  try {
    if (req.session) {
      await req.sessionManager.revokeSession(req.session.sessionId);
    }
    res.json(successResponse({}, "Logout successful"));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
});

router.post("/kiosk", async (req, res) => {
  try {
    const { token, sessionId, expiresIn } =
      await req.sessionManager.createKioskSession();
    res.json(
      successResponse({ token, sessionId, expiresIn }, "Kiosk session created"),
    );
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
});

module.exports = router;

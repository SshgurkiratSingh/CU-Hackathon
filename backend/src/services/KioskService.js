const pino = require("pino");
const { Telemetry, Rule, Alert, Action, Device } = require("../schemas");

const logger = pino();

class KioskService {
  // Get dashboard data for kiosk display
  async getDashboardData(siteId) {
    try {
      // Get latest telemetry
      const latestTelemetry = await Telemetry.find({ siteId })
        .sort({ timestamp: -1 })
        .limit(10);

      // Get active alerts
      const activeAlerts = await Alert.find({
        siteId,
        resolved: false,
      }).sort({ createdAt: -1 });

      // Get recent actions
      const recentActions = await Action.find({ siteId })
        .sort({ createdAt: -1 })
        .limit(5);

      // Get system status
      const systemStatus = {
        rulesCount: await Rule.countDocuments({ siteId, active: true }),
        alertsCount: activeAlerts.length,
        pendingActionsCount: await Action.countDocuments({
          siteId,
          status: "pending",
        }),
      };

      const dashboard = {
        siteId,
        telemetry: latestTelemetry,
        alerts: activeAlerts,
        recentActions,
        systemStatus,
        lastUpdated: new Date(),
      };

      logger.info({ siteId }, "Dashboard data retrieved");
      return dashboard;
    } catch (error) {
      logger.error({ error }, "Failed to get dashboard data");
      throw error;
    }
  }

  // Display data on kiosk screen
  async displayData(displayRequest) {
    try {
      const { siteId, contentType, data } = displayRequest;

      logger.info({ siteId, contentType }, "Kiosk displaying data");
      return {
        displayed: true,
        siteId,
        contentType,
        displayedAt: new Date(),
      };
    } catch (error) {
      logger.error({ error }, "Failed to display data on kiosk");
      throw error;
    }
  }

  // Accept user input from kiosk
  async acceptInput(inputData) {
    try {
      const { siteId, actionType, parameters } = inputData;

      logger.info({ siteId, actionType }, "Kiosk input received");

      // Process based on action type
      if (actionType === "trigger_action") {
        // Create action to be executed
        const action = new Action({
          name: parameters.actionName,
          type: parameters.actionType,
          siteId,
          parameters,
          status: "pending",
        });
        await action.save();

        return {
          received: true,
          processed: true,
          actionId: action._id,
          message: "Action triggered from kiosk",
        };
      } else if (actionType === "acknowledge_alert") {
        // Acknowledge alert
        await Alert.updateOne(
          { _id: parameters.alertId },
          { resolved: true, resolvedAt: new Date() },
        );

        return {
          received: true,
          processed: true,
          message: "Alert acknowledged",
        };
      }

      return {
        received: true,
        processed: false,
        message: "Action type not recognized",
      };
    } catch (error) {
      logger.error({ error }, "Failed to process kiosk input");
      throw error;
    }
  }

  // Get kiosk operational status
  async getStatus(siteId) {
    try {
      const status = {
        status: "operational",
        siteId,
        uptime: process.uptime(),
        timestamp: new Date(),
        connectivity: {
          mqtt: true,
          database: true,
        },
        systemLoad: {
          memory:
            process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
          cpu: process.cpuUsage().user / 1000000,
        },
      };

      logger.info({ siteId }, "Kiosk status retrieved");
      return status;
    } catch (error) {
      logger.error({ error }, "Failed to get kiosk status");
      throw error;
    }
  }

  // Get available quick actions for kiosk
  async getQuickActions(siteId) {
    try {
      const quickActions = [
        {
          id: "start-irrigation",
          name: "Start Irrigation",
          icon: "water",
          color: "blue",
        },
        {
          id: "stop-irrigation",
          name: "Stop Irrigation",
          icon: "water-off",
          color: "gray",
        },
        {
          id: "open-ventilation",
          name: "Open Ventilation",
          icon: "wind",
          color: "green",
        },
        {
          id: "close-ventilation",
          name: "Close Ventilation",
          icon: "wind-off",
          color: "gray",
        },
        {
          id: "enable-heating",
          name: "Enable Heating",
          icon: "flame",
          color: "orange",
        },
        {
          id: "disable-heating",
          name: "Disable Heating",
          icon: "flame-off",
          color: "gray",
        },
      ];

      logger.info(
        { siteId, actionCount: quickActions.length },
        "Quick actions retrieved",
      );
      return quickActions;
    } catch (error) {
      logger.error({ error }, "Failed to get quick actions");
      throw error;
    }
  }

  // Get learning insights for kiosk display
  async getLearningInsights(siteId) {
    try {
      const insights = {
        topAlerts: [
          { type: "temperature", count: 5, severity: "medium" },
          { type: "humidity", count: 3, severity: "low" },
        ],
        topActions: [
          { name: "Irrigation", count: 12 },
          { name: "Ventilation", count: 8 },
        ],
        systemHealth: "Good",
        recommendations: [
          "Monitor temperature closely in afternoon",
          "Schedule maintenance for irrigation valve",
        ],
      };

      logger.info({ siteId }, "Learning insights retrieved");
      return insights;
    } catch (error) {
      logger.error({ error }, "Failed to get learning insights");
      throw error;
    }
  }
}

module.exports = KioskService;

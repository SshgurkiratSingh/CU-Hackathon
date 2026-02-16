const pino = require("pino");
const { Settings } = require("../schemas");

const logger = pino();

// In-memory registry of available services
const serviceRegistry = new Map();

class MarketplaceService {
  constructor() {
    this.loadDefaultServices();
  }

  // Initialize with default available services
  loadDefaultServices() {
    const defaultServices = [
      {
        serviceId: "weather-api",
        name: "Weather API",
        description: "Fetches weather data",
        type: "external_api",
        endpoint: "https://api.weather.com",
        status: "available",
        version: "1.0.0",
      },
      {
        serviceId: "soil-sensor",
        name: "Soil Sensor Integration",
        description: "Integrates with soil sensors",
        type: "sensor_integration",
        status: "available",
        version: "1.0.0",
      },
      {
        serviceId: "irrigation-control",
        name: "Irrigation Control",
        description: "Controls irrigation systems",
        type: "device_control",
        status: "available",
        version: "1.0.0",
      },
    ];

    defaultServices.forEach((service) => {
      serviceRegistry.set(service.serviceId, service);
    });
  }

  // Discover available services with optional filtering
  async discoverServices(criteria = {}) {
    try {
      let services = Array.from(serviceRegistry.values());

      // Filter by type if specified
      if (criteria.type) {
        services = services.filter((s) => s.type === criteria.type);
      }

      // Filter by status if specified
      if (criteria.status) {
        services = services.filter((s) => s.status === criteria.status);
      }

      logger.info({ count: services.length, criteria }, "Services discovered");
      return services;
    } catch (error) {
      logger.error({ error }, "Service discovery failed");
      throw error;
    }
  }

  // Register new service in marketplace
  async registerService(serviceInfo) {
    try {
      const serviceId = serviceInfo.serviceId || `service-${Date.now()}`;

      const service = {
        serviceId,
        name: serviceInfo.name,
        description: serviceInfo.description || "",
        type: serviceInfo.type || "custom",
        endpoint: serviceInfo.endpoint || "",
        version: serviceInfo.version || "1.0.0",
        status: "available",
        registeredAt: new Date(),
      };

      serviceRegistry.set(serviceId, service);

      logger.info({ serviceId, name: service.name }, "Service registered");
      return {
        serviceId,
        registered: true,
        message: `Service '${service.name}' registered successfully`,
      };
    } catch (error) {
      logger.error({ error }, "Service registration failed");
      throw error;
    }
  }

  // Call registered service and return result
  async callService(serviceId, params = {}) {
    try {
      const service = serviceRegistry.get(serviceId);

      if (!service) {
        throw new Error(`Service '${serviceId}' not found`);
      }

      if (service.status !== "available") {
        throw new Error(
          `Service '${serviceId}' is not available (status: ${service.status})`,
        );
      }

      logger.info({ serviceId, params }, "Service called");

      // Simulate service execution
      const result = {
        serviceId,
        serviceName: service.name,
        success: true,
        data: {
          executedAt: new Date(),
          parameters: params,
          response: this.simulateServiceResponse(service, params),
        },
      };

      return result;
    } catch (error) {
      logger.error({ serviceId, error }, "Service call failed");
      throw error;
    }
  }

  // Simulate service response based on service type
  simulateServiceResponse(service, params) {
    switch (service.type) {
      case "weather_api":
        return {
          temperature: 25.5,
          humidity: 65,
          condition: "Sunny",
        };
      case "sensor_integration":
        return {
          sensorId: params.sensorId || "sensor-1",
          value: Math.random() * 100,
          unit: "percent",
        };
      case "device_control":
        return {
          deviceId: params.deviceId || "device-1",
          action: params.action || "executed",
          status: "success",
        };
      default:
        return {
          message: `Response from ${service.name}`,
          timestamp: new Date(),
        };
    }
  }

  // Get service status
  async getServiceStatus(serviceId) {
    try {
      const service = serviceRegistry.get(serviceId);

      if (!service) {
        throw new Error(`Service '${serviceId}' not found`);
      }

      return {
        serviceId,
        name: service.name,
        status: service.status,
        version: service.version,
        lastChecked: new Date(),
      };
    } catch (error) {
      logger.error({ serviceId, error }, "Status check failed");
      throw error;
    }
  }

  // Disable service
  async disableService(serviceId) {
    try {
      const service = serviceRegistry.get(serviceId);

      if (!service) {
        throw new Error(`Service '${serviceId}' not found`);
      }

      service.status = "disabled";
      serviceRegistry.set(serviceId, service);

      logger.info({ serviceId }, "Service disabled");
      return { serviceId, status: "disabled" };
    } catch (error) {
      logger.error({ serviceId, error }, "Service disable failed");
      throw error;
    }
  }

  // Enable service
  async enableService(serviceId) {
    try {
      const service = serviceRegistry.get(serviceId);

      if (!service) {
        throw new Error(`Service '${serviceId}' not found`);
      }

      service.status = "available";
      serviceRegistry.set(serviceId, service);

      logger.info({ serviceId }, "Service enabled");
      return { serviceId, status: "available" };
    } catch (error) {
      logger.error({ serviceId, error }, "Service enable failed");
      throw error;
    }
  }
}

module.exports = MarketplaceService;

# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-16

### Added
- **Shorter MQTT Topic Format**: New `gh/{zone}/{sensor}/{node}` format (60% shorter)
- **Enhanced MQTT Logging**: Comprehensive logging for all MQTT message reception and telemetry storage
- **Topic Subscription Logging**: Detailed logs showing all subscribed topics on startup
- **Error Context Logging**: Stack traces and full context for MQTT-related errors
- **Backward Compatibility**: Support for both old and new topic formats
- **Documentation**: 
  - `MQTT_TOPIC_UPDATE.md` - Detailed migration guide
  - `MQTT_QUICK_REFERENCE.md` - Quick reference for developers

### Changed
- **Frontend**: Updated `buildSuggestedTopic()` to generate shorter topic names
- **Frontend**: Changed default device topics to use new format
- **Frontend**: Updated ESP32 code generator with new topic format
- **Backend**: Enhanced `storeTelemetryFromMqtt()` with detailed logging
- **Backend**: Improved MQTT message handler with reception logging
- **Backend**: Simplified subscription to all topics using wildcard `#`
- **Backend**: Enhanced error messages with more context

### Improved
- **Logging Levels**: Proper use of debug/info/warn/error levels
- **Message Tracking**: Each stored telemetry includes MongoDB document ID in logs
- **Debugging**: Easier to trace message flow from MQTT to database
- **Performance**: Shorter topics reduce bandwidth usage by ~40 bytes per message

### Fixed
- Silent failures now logged with appropriate error levels
- Missing device/sensor scenarios now properly logged

## [1.0.0] - 2026-02-16

### Added
- Initial release with Phase 1 MVP complete
- 5 Core Services (750+ lines of code)
- 11 API Route Modules (47+ endpoints)
- 8 MongoDB Data Models with full schemas
- JWT Authentication with role-based access control
- MQTT Integration for real-time messaging
- Gemini AI integration for intelligent decisions
- Comprehensive Logging and error handling
- Production-Ready backend infrastructure

### Features
- User authentication and authorization
- Device management with sensor configuration
- Real-time telemetry collection and storage
- Rule-based automation
- Action dispatching via MQTT
- Zone/Site management
- Alert system
- Settings management
- AI-powered decision making
- Marketplace integration
- Kiosk mode support
- Memory service for context retention

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

## Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes
- **Improved** - Performance or quality improvements

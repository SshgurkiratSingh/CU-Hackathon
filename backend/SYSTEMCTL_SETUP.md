# Systemctl Service Installation

## Quick Setup

```bash
# 1. Copy service file to systemd directory
sudo cp greenhouse-backend.service /etc/systemd/system/

# 2. Reload systemd daemon
sudo systemctl daemon-reload

# 3. Enable service to start on boot
sudo systemctl enable greenhouse-backend

# 4. Start the service
sudo systemctl start greenhouse-backend
```

## Service Management

```bash
# Check status
sudo systemctl status greenhouse-backend

# View logs
sudo journalctl -u greenhouse-backend -f

# Stop service
sudo systemctl stop greenhouse-backend

# Restart service
sudo systemctl restart greenhouse-backend

# Disable auto-start
sudo systemctl disable greenhouse-backend
```

## Notes

- Service runs as user `gurkirat` - change if needed in the service file
- NODE_ENV is set to `production` in the service file
- Logs are sent to systemd journal (use journalctl to view)
- Service auto-restarts on failure with 10 second delay

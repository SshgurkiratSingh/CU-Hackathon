# Frontend Configuration

This directory contains centralized configuration files for the frontend application.

## API Configuration (`api.config.ts`)

Centralized configuration for all API endpoints and server URLs.

### Environment Variables

Configure the backend server URL using environment variables in `.env.local`:

```env
# Primary server URL (required)
NEXT_PUBLIC_SERVER_URL=http://localhost:2500

# Optional: Override API endpoint
# NEXT_PUBLIC_API_URL=http://localhost:2500/api

# Optional: Override WebSocket endpoint
# NEXT_PUBLIC_WS_URL=ws://localhost:2500/ws
```

### Usage

Import the configuration in your components:

```typescript
import { API_BASE_URL, WS_URL, apiConfig } from '@/config/api.config';

// Use individual exports
const response = await fetch(`${API_BASE_URL}/endpoint`);

// Or use the config object
console.log(apiConfig.baseUrl);
console.log(apiConfig.wsUrl);
```

### Production Deployment

For production, update the environment variable:

```env
NEXT_PUBLIC_SERVER_URL=https://your-production-domain.com
```

The configuration will automatically:
- Convert HTTP URLs to WebSocket URLs (http → ws, https → wss)
- Append `/api` for API endpoints
- Append `/ws` for WebSocket connections

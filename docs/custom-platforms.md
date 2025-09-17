# Custom Platform Integration Guide

This guide explains how to integrate custom social media platforms using the flexible custom platform option in the AI Business Developer application.

## Overview

The custom platform feature allows you to integrate any social media platform or API that isn't natively supported. This is particularly useful for:

- Regional social media platforms
- Enterprise social networks
- Custom APIs and webhooks
- Beta or emerging platforms
- Internal company platforms

## Getting Started

### 1. Adding a Custom Platform

1. Navigate to **Settings > Social Platforms**
2. Click **"Add Platform"**
3. Select **"Custom"** from the platform dropdown
4. Configure your custom platform settings

### 2. Basic Configuration

#### Required Fields
- **Platform Name**: A unique identifier for your platform
- **Display Name**: The name shown in the UI
- **API Base URL**: The base URL for your platform's API

#### Authentication
- **Auth Type**: Choose from:
  - `oauth2`: OAuth 2.0 flow
  - `api_key`: Simple API key authentication
  - `bearer`: Bearer token authentication
  - `basic`: Basic HTTP authentication

### 3. Custom Fields

Add platform-specific configuration fields:

- **Field Label**: Human-readable name
- **Field Key**: API parameter name
- **Field Type**: 
  - `text`: Plain text input
  - `password`: Secure password input
  - `url`: URL validation
  - `email`: Email validation
- **Required**: Whether the field is mandatory

#### Example Custom Fields
```json
[
  {
    "label": "API Key",
    "key": "api_key",
    "type": "password",
    "required": true
  },
  {
    "label": "Workspace ID",
    "key": "workspace_id",
    "type": "text",
    "required": true
  },
  {
    "label": "Webhook URL",
    "key": "webhook_url",
    "type": "url",
    "required": false
  }
]
```

## Platform Validation Rules

### Content Limits
Configure content validation for your platform:

```javascript
{
  maxTextLength: 500,        // Maximum characters for text content
  maxFileSize: 10485760,     // Maximum file size in bytes (10MB)
  supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
  requiredFields: ['title'],  // Fields that must be provided
  aspectRatio: '16:9',       // Preferred aspect ratio for media
  maxDuration: 300           // Maximum video duration in seconds
}
```

### API Endpoints
Define the API endpoints for your platform:

```javascript
{
  endpoints: {
    post: '/api/v1/posts',           // Create post endpoint
    upload: '/api/v1/media/upload',  // Media upload endpoint
    profile: '/api/v1/user/profile', // User profile endpoint
    analytics: '/api/v1/analytics'   // Analytics endpoint (optional)
  }
}
```

## Implementation Examples

### Example 1: Simple API Key Platform

```javascript
// Platform Configuration
{
  name: 'my_platform',
  displayName: 'My Platform',
  apiBaseUrl: 'https://api.myplatform.com',
  authType: 'api_key',
  customFields: [
    {
      label: 'API Key',
      key: 'api_key',
      type: 'password',
      required: true
    }
  ],
  validation: {
    maxTextLength: 280,
    supportedMediaTypes: ['image/jpeg', 'image/png'],
    requiredFields: []
  }
}
```

### Example 2: OAuth 2.0 Platform

```javascript
// Platform Configuration
{
  name: 'enterprise_social',
  displayName: 'Enterprise Social',
  apiBaseUrl: 'https://social.company.com/api',
  authType: 'oauth2',
  customFields: [
    {
      label: 'Client ID',
      key: 'client_id',
      type: 'text',
      required: true
    },
    {
      label: 'Client Secret',
      key: 'client_secret',
      type: 'password',
      required: true
    },
    {
      label: 'Scope',
      key: 'scope',
      type: 'text',
      required: false
    }
  ],
  validation: {
    maxTextLength: 1000,
    maxFileSize: 52428800, // 50MB
    supportedMediaTypes: ['image/*', 'video/*', 'application/pdf'],
    requiredFields: ['title']
  }
}
```

## API Integration

### Publishing Posts

When publishing to a custom platform, the system will:

1. **Validate Content**: Check against your validation rules
2. **Prepare Request**: Format the request according to your configuration
3. **Authenticate**: Use the configured authentication method
4. **Send Request**: POST to your specified endpoint
5. **Handle Response**: Process the API response

### Expected API Response Format

Your custom platform API should return responses in this format:

```javascript
// Success Response
{
  "success": true,
  "data": {
    "id": "post_12345",
    "url": "https://myplatform.com/posts/12345",
    "created_at": "2024-01-15T10:30:00Z"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Content exceeds maximum length",
    "details": {
      "field": "content",
      "limit": 280,
      "actual": 350
    }
  }
}
```

## Testing Your Integration

### 1. Configuration Test
- Verify all required fields are properly configured
- Test authentication with your API
- Validate endpoint URLs are accessible

### 2. Content Validation Test
- Test with content at the character limit
- Test with various media types
- Test with missing required fields

### 3. Publishing Test
- Create a test post
- Verify the post appears on your platform
- Check that analytics are properly tracked

## Troubleshooting

### Common Issues

#### Authentication Failures
- Verify API credentials are correct
- Check if API keys have proper permissions
- Ensure OAuth redirect URLs are configured

#### Content Validation Errors
- Review validation rules configuration
- Check character limits and media type restrictions
- Verify required fields are being provided

#### API Connection Issues
- Confirm API base URL is correct and accessible
- Check for CORS issues if applicable
- Verify SSL certificates are valid

### Debug Mode

Enable debug mode to see detailed API requests and responses:

1. Go to **Settings > Developer Options**
2. Enable **"Debug Custom Platforms"**
3. Check the browser console for detailed logs

## Best Practices

### Security
- Always use HTTPS for API endpoints
- Store sensitive credentials securely
- Implement proper rate limiting
- Validate all input data

### Performance
- Implement caching where appropriate
- Use efficient media upload methods
- Handle large file uploads asynchronously

### User Experience
- Provide clear error messages
- Implement proper loading states
- Test thoroughly before deployment

## Support

For additional help with custom platform integration:

- Check the [API Documentation](./api-reference.md)
- Review [Common Integration Patterns](./integration-patterns.md)
- Contact support at support@aibusinessdeveloper.com

## Contributing

If you've successfully integrated a platform that others might find useful, consider contributing it as a native integration. See our [Contributing Guide](../CONTRIBUTING.md) for more information.
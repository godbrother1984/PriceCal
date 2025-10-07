// path: server/src/common/decorators/current-user.decorator.ts
// version: 1.0 (Current User Decorator)
// last-modified: 1 ตุลาคม 2568 14:00

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract user ID from request
 * Usage: @CurrentUser() userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    // Try to get user from JWT payload (if authenticated)
    if (request.user && request.user.sub) {
      return request.user.sub; // JWT payload has 'sub' field with user ID
    }

    // Fallback: get from custom header (for development/testing)
    if (request.headers['x-user-id']) {
      return request.headers['x-user-id'];
    }

    // Default: system user
    return 'system';
  },
);

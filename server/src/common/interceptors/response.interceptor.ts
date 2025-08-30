// path: server/src/common/interceptors/response.interceptor.ts
// version: 2.0 (Enhanced Response Format)
// last-modified: 30 สิงหาคม 2568 10:45

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // Generate appropriate success message based on HTTP method
        let message: string | undefined;
        
        if (method === 'POST') {
          message = 'Resource created successfully';
        } else if (method === 'PUT' || method === 'PATCH') {
          message = 'Resource updated successfully';
        } else if (method === 'DELETE') {
          message = 'Resource deleted successfully';
        }
        // GET requests don't need success messages

        return {
          success: true,
          data,
          message,
          timestamp: new Date().toISOString(),
          path,
        };
      }),
    );
  }
}
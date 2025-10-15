// path: server/src/auth/jwt-auth.guard.ts
// version: 1.0 (JWT Auth Guard)
// last-modified: 14 ตุลาคม 2568 15:35

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}

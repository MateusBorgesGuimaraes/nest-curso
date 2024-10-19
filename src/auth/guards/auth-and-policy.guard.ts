import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthTokenGuard } from './auth-token.guard';
import { RoutePolicyGuard } from './route-policy.guard';

export class AuthAndPolicyGuard implements CanActivate {
  constructor(
    private readonly authTokenGuard: AuthTokenGuard,
    private readonly routePolicyGuard: RoutePolicyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthValid = await this.authTokenGuard.canActivate(context);

    if (!isAuthValid) {
      return false;
    }

    return this.routePolicyGuard.canActivate(context);
  }
}

/**
 * Central export point for all API services
 * 
 * Usage example:
 * import { authService, syncService, paymentService } from '@/services';
 * 
 * const { user, token } = await authService.login(email, password);
 */

export { authService } from './auth.service';
export { paymentService, subscriptionService } from './subscription.service';
export { syncService } from './sync.service';


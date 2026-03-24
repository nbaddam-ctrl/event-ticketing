import { ApiError } from '../api/errors.js';
import { createOrganizerRequest } from '../repositories/organizerRepository.js';
import { db } from '../db/client.js';
import { createNotificationsForAdmins } from './notificationService.js';

export function requestOrganizerRole(userId: string) {
  if (!userId) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const request = createOrganizerRequest(userId);

  // Fire-and-forget: notify all admins of the new organizer request
  try {
    const user = db.prepare('SELECT display_name as displayName, email FROM users WHERE id = ?').get(userId) as
      | { displayName: string; email: string }
      | undefined;

    createNotificationsForAdmins(
      'organizer_request_submitted',
      'New Organizer Request',
      `${user?.displayName ?? user?.email ?? 'A user'} has submitted an organizer role request.`,
      request.id,
      'organizer_request',
      '/admin/organizer-requests',
    );
  } catch (error) {
    console.warn('[notification] Failed to create organizer request notifications:', error);
  }

  return { requestId: request.id, status: request.status };
}

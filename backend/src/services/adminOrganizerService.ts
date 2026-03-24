import { ApiError } from '../api/errors.js';
import { decideOrganizerRequest, getOrganizerRequestById, listOrganizerRequests } from '../repositories/organizerRepository.js';
import { createNotification } from './notificationService.js';

export function listOrganizerRoleRequests(status?: string) {
  return listOrganizerRequests(status);
}

export function decideOrganizerRoleRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  adminUserId: string,
  reason?: string
) {
  const request = getOrganizerRequestById(requestId);
  if (!request) {
    throw new ApiError(404, 'NOT_FOUND', 'Organizer request not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(400, 'BAD_REQUEST', 'Organizer request already decided');
  }

  const result = decideOrganizerRequest(requestId, decision, adminUserId, reason);
  if (!result) {
    throw new ApiError(404, 'NOT_FOUND', 'Organizer request not found');
  }

  // Fire-and-forget: notify the requesting user of the decision
  try {
    const type = decision === 'approved' ? 'organizer_request_approved' : 'organizer_request_rejected' as const;
    const title = decision === 'approved' ? 'Organizer Request Approved' : 'Organizer Request Rejected';
    const reasonText = reason ? ` Reason: ${reason}` : '';
    const message = decision === 'approved'
      ? `Your organizer role request has been approved! You can now create and manage events.${reasonText}`
      : `Your organizer role request has been rejected.${reasonText}`;

    createNotification({
      userId: request.userId,
      type,
      title,
      message,
      referenceId: requestId,
      referenceType: 'organizer_request',
      navigationPath: decision === 'approved' ? '/organizer' : '/request-organizer',
    });
  } catch (error) {
    console.warn('[notification] Failed to create decision notification:', error);
  }

  return result;
}

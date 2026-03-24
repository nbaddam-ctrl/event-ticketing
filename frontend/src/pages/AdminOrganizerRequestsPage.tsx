import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { decideOrganizerRequest, listOrganizerRequests, type OrganizerRequest } from '../services/organizerApi';
import { PageHeader } from '../components/app/PageHeader';
import { ConfirmationBanner } from '../components/app/ConfirmationBanner';
import { ActionConfirmDialog } from '../components/app/ActionConfirmDialog';
import {
  Card,
  CardContent,
  Input,
  Select,
  Button,
  Alert,
  AlertDescription,
  Badge,
} from '../components/ui';
import { Shield, CheckCircle, XCircle, RefreshCw, Clock, User } from 'lucide-react';

export function AdminOrganizerRequestsPage() {
  useDocumentTitle('Organizer Approvals');
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<OrganizerRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  async function fetchRequests() {
    setLoadingList(true);
    setListError('');
    try {
      const result = await listOrganizerRequests(statusFilter || undefined);
      setRequests(result.requests);
    } catch (err) {
      setListError((err as Error).message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  function openDecision(req: OrganizerRequest, dec: 'approved' | 'rejected') {
    setSelectedRequest(req);
    setDecision(dec);
    setReason('');
    setConfirmOpen(true);
  }

  async function confirmDecision() {
    if (loading || !selectedRequest) return;
    setLoading(true);
    setError('');
    setMessage('');
    setConfirmOpen(false);

    try {
      const result = await decideOrganizerRequest({
        requestId: selectedRequest.id,
        decision,
        reason: reason || undefined,
      });
      setMessage(
        `Request from ${selectedRequest.displayName} (${selectedRequest.email}) has been ${result.status}.`
      );
      setSelectedRequest(null);
      setReason('');
      fetchRequests();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const statusBadgeVariant = (s: string) => {
    if (s === 'approved') return 'success' as const;
    if (s === 'rejected') return 'destructive' as const;
    return 'warning' as const;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin — Organizer Requests"
        subtitle="Review and decide on organizer role requests."
        actions={
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loadingList}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {message && (
        <ConfirmationBanner type="success" title="Decision Recorded" message={message} />
      )}

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter */}
      <div className="w-full sm:max-w-xs">
        <Select
          label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: '', label: 'All' },
          ]}
        />
      </div>

      {/* List */}
      {listError && (
        <Alert variant="error">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      {loadingList ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Shield className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No {statusFilter || ''} organizer requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03, ease: 'easeOut' }}
            >
            <Card>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{req.displayName}</span>
                    <span className="text-sm text-muted-foreground">({req.email})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Requested {new Date(req.createdAt).toLocaleDateString()}</span>
                    <Badge variant={statusBadgeVariant(req.status)}>{req.status}</Badge>
                  </div>
                  {req.decisionReason && (
                    <p className="text-sm text-muted-foreground">Reason: {req.decisionReason}</p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => openDecision(req, 'approved')}
                      disabled={loading}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDecision(req, 'rejected')}
                      disabled={loading}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Decision dialog */}
      {selectedRequest && (
        <ActionConfirmDialog
          open={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setSelectedRequest(null);
          }}
          onConfirm={confirmDecision}
          title={decision === 'approved' ? 'Approve Request' : 'Reject Request'}
          description={`Are you sure you want to ${decision === 'approved' ? 'approve' : 'reject'} the organizer request from ${selectedRequest.displayName} (${selectedRequest.email})?`}
          confirmLabel={decision === 'approved' ? 'Approve' : 'Reject'}
          variant={decision === 'rejected' ? 'destructive' : 'default'}
          loading={loading}
        >
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide context for this decision"
          />
        </ActionConfirmDialog>
      )}
    </div>
  );
}

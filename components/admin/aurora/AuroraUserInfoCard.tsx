// components/admin/aurora/AuroraUserInfoCard.tsx
'use client';

type Props = {
  snapshot: any;
};

export default function AuroraUserInfoCard({ snapshot }: Props) {
  const { relationship } = snapshot;

  return (
    <div className="card aurora-card mb-4 p-4">
      <h6 className="mb-3">User Profile</h6>

      <div className="row">
        <div className="col-md-4">
          <div className="text-muted small">User ID</div>
          <div className="fw-light">{relationship.user_id}</div>
        </div>

        <div className="col-md-4">
          <div className="text-muted small">Created</div>
          <div>{new Date(relationship.created_at).toLocaleDateString()}</div>
        </div>

        <div className="col-md-4">
          <div className="text-muted small">Last Seen</div>
          <div>{new Date(relationship.last_seen_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
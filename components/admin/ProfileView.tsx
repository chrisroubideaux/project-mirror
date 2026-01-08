// components/admin/ProfileView.tsx
'use client';

import { useEffect, useState } from 'react';

type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
  profile_image_url?: string | null;
  relationship_stage?: string;
  preferred_tone?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ProfileView({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("aurora_token");

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      // ✅ ADMIN endpoint (not /api/users/me)
      const res = await fetch(`${API_BASE}/api/admins/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Profile fetch failed:", data);
        window.location.href = "/admin/login";
        return;
      }

      setAdmin(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <h3>Loading your profile...</h3>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="container py-5 text-center">
        <h3>Admin not found or unauthorized.</h3>
        <button
          className="btn btn-primary mt-3"
          onClick={() => (window.location.href = "/admin/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        {admin.profile_image_url ? (
          <img
            src={admin.profile_image_url}
            alt="Profile"
            className="rounded-circle shadow"
            style={{ width: 120, height: 120, objectFit: "cover" }}
          />
        ) : (
          <div
            className="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center text-white"
            style={{ width: 120, height: 120 }}
          >
            <span style={{ fontSize: "2rem" }}>
              {admin.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <h2 className="text-center fw-bold">{admin.full_name}</h2>
      <p className="text-center text-muted">{admin.email}</p>

      <hr className="my-4" />

      <div className="mt-4">
        <h5>Relationship Stage</h5>
        <p>{admin.relationship_stage || "Not set"}</p>

        <h5>Preferred Tone</h5>
        <p>{admin.preferred_tone || "Not set"}</p>
      </div>

      <div className="mt-5 text-center">
        <button
          className="btn btn-outline-danger rounded-pill px-4"
          onClick={() => {
            localStorage.removeItem("aurora_token");
            window.location.href = "/admin/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

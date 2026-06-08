import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

// Redirect legacy /preview-draft URL to the new draft portfolio page
export default function PreviewDraftPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.username) {
      navigate(`/portfolio/${user.username}?draft=true`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return null;
}

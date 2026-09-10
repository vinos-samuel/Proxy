import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  photoUrl?: string | null;
  displayName?: string | null;
  className?: string;
  fallbackClassName?: string;
  onPhotoError?: () => void;
}

/** Small identity mark: real headshot when present, otherwise calm initials. Always occupies the avatar slot so a missing photo never looks deleted. */
export default function ProfileAvatar({
  photoUrl,
  displayName,
  className,
  fallbackClassName,
  onPhotoError,
}: ProfileAvatarProps) {
  const initials = getInitials(displayName);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={displayName || ""}
        className={cn("rounded-full object-cover shrink-0", className)}
        onError={onPhotoError}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center font-medium select-none",
        className,
        fallbackClassName,
      )}
      aria-hidden="true"
      data-testid="avatar-placeholder"
    >
      {initials}
    </div>
  );
}

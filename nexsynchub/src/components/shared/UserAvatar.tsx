type UserAvatarProps = {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
}: UserAvatarProps) {

  const initials =
    (name || "U")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      className={`
        relative
        rounded-full
        overflow-hidden
        flex
        items-center
        justify-center
        bg-indigo-600/20
        border border-indigo-500/30
        text-indigo-300
        font-semibold
        shrink-0
        ${sizeClasses[size]}
        ${className}
      `}
    >

      {src ? (
        <img
          src={src}
          alt={name || "User Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>
          {initials}
        </span>
      )}

    </div>
  );
}
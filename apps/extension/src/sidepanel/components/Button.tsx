export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <button className={`btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

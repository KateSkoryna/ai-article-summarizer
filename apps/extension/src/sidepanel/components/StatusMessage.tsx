interface Props {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export function StatusMessage({ message, type }: Props) {
  return <div className={`status-box ${type}`}>{message}</div>;
}

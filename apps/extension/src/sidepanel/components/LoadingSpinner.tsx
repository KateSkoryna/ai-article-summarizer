interface Props {
  text: string;
}

export function LoadingSpinner({ text }: Props) {
  return (
    <div className="loading">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}

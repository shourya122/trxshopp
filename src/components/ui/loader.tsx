import "./loader.css";

export function Loader({ text = "loading" }: { text?: string }) {
  return (
    <div className="loader" role="status" aria-label={text}>
      <p className="loader-text">{text}</p>
      <span className="load" />
    </div>
  );
}

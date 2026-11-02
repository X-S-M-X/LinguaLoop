export default function PageHeading({ eyebrow, title, text, children }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </header>
  );
}

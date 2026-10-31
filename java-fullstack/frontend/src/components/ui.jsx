import React, { useEffect, useRef, useState } from "react";
import { Layers, X } from "lucide-react";
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({
  title = "Nothing here yet",
  text = "Your next step starts with a small action.",
  children,
}) {
  return (
    <div className="empty">
      <Layers size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Button({ children, icon: Icon, className = "", ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      {Icon && <Icon size={16} />} {children}
    </button>
  );
}
export function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "wide" : ""}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-top">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Editor({ config, onClose }) {
  const [data, setData] = useState(config.initial || {}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title={config.title} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await config.submit(data);
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {config.note && <p className="form-note">{config.note}</p>}
        {config.fields.map(([key, label, type, required]) => (
          <label className="field" key={key}>
            {label}
            {Array.isArray(type) ? (
              <select
                value={
                  data[key] ??
                  (typeof type[0] === "object" ? type[0].value : type[0])
                }
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              >
                {type.map((v) => (
                  <option
                    key={typeof v === "object" ? v.value : v}
                    value={typeof v === "object" ? v.value : v}
                  >
                    {typeof v === "object" ? v.label : v}
                  </option>
                ))}
              </select>
            ) : type === "textarea" ? (
              <textarea
                required={required}
                rows={5}
                value={data[key] ?? ""}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
            ) : (
              <input
                type={type}
                required={required}
                value={data[key] ?? ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    [key]:
                      type === "number"
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            )}
          </label>
        ))}
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        <div className="form-actions">
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>
            {busy ? "Saving…" : config.button || "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        A<span />
      </div>
      <strong>
        ascent<span> / LMS</span>
      </strong>
    </div>
  );
}

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Grid2X2,
  Heart,
  ImagePlus,
  LayoutGrid,
  List,
  Menu,
  MoreHorizontal,
  Plus,
  Quote as QuoteIcon,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/latin-600.css";
import "@fontsource/lora/latin-400-italic.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/libre-baskerville/latin-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/caveat/latin-400.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/bitter/latin-400.css";
import "@fontsource/spectral/latin-400.css";
import "@fontsource/nunito/latin-400.css";
import {
  STORAGE_KEY,
  seed,
  fonts,
  backgrounds,
  sizes,
  newQuote,
  visibleQuotes,
  validateLibrary,
  removeNotebook,
} from "./library";
import { drawQuote, exportQuote, readPhoto } from "./draw";
import "./styles.css";

function IconButton({ title, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      title={title}
      aria-label={title}
      {...props}
    >
      {children}
    </button>
  );
}
function QuoteArt({ quote, width = 600, height = 480, className = "" }) {
  const canvas = useRef();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const buffer = document.createElement("canvas");
    setError(false);
    drawQuote(buffer, quote, width, height)
      .then(() => {
        if (!active || !canvas.current) return;
        canvas.current.width = width;
        canvas.current.height = height;
        canvas.current.getContext("2d").drawImage(buffer, 0, 0);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [quote, width, height]);
  return (
    <div
      className={`quote-art ${className}`}
      style={{
        aspectRatio: `${width}/${height}`,
        background: backgrounds.find((b) => b.id === quote.background)?.color,
      }}
    >
      <canvas
        ref={canvas}
        role="img"
        aria-label={`${quote.text || "Your quote preview"}${quote.author ? ` — ${quote.author}` : ""}`}
      />
      {error && (
        <div className="art-error">
          This photo couldn’t load. Choose another background.
        </div>
      )}
    </div>
  );
}
function Modal({ children, onClose, className = "", label }) {
  const ref = useRef();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useLayoutEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function key(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = [
        ...ref.current.querySelectorAll(
          'button, input, textarea, select, [tabindex="0"]',
        ),
      ].filter((e) => !e.disabled && e.getClientRects().length);
      if (!elements.length) {
        event.preventDefault();
        return;
      }
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`modal-backdrop ${className}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </section>
    </div>
  );
}
function QuoteEditor({ quote, library, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...quote });
  const [size, setSize] = useState("medium");
  const [fontSearch, setFontSearch] = useState("");
  const [fontsOpen, setFontsOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const picker = useRef();
  const currentSize = sizes.find((s) => s.id === size);
  const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const close = React.useCallback(() => {
    if (
      JSON.stringify(draft) === JSON.stringify(quote) ||
      window.confirm("Discard your unsaved changes?")
    )
      onClose();
  }, [draft, quote, onClose]);
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      update("photo", await readPhoto(file));
      update("darkness", 0.25);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }
  return (
    <Modal onClose={close} className="editor-backdrop" label="Quote editor">
      <header className="modal-header">
        <div>
          <span className="eyebrow">A LITTLE SELF-EXPRESSION</span>
          <h2>{quote.text ? "Make it yours." : "Something worth keeping."}</h2>
        </div>
        <IconButton title="Close editor" onClick={close}>
          <X size={20} />
        </IconButton>
      </header>
      <div className="editor-scroll">
        <div className="editor-preview">
          <QuoteArt
            quote={draft}
            width={currentSize.width}
            height={currentSize.height}
          />
        </div>
        <div className="size-tabs" aria-label="Preview size">
          {sizes.slice(0, 4).map((s) => (
            <button
              key={s.id}
              className={size === s.id ? "active" : ""}
              onClick={() => setSize(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="form-section">
          <div className="section-label">
            <span>THE WORDS</span>
            <span>{draft.text.length}/1000</span>
          </div>
          <label className="sr-only" htmlFor="quote-text">
            Quote text
          </label>
          <textarea
            id="quote-text"
            value={draft.text}
            onChange={(e) => update("text", e.target.value)}
            maxLength={1000}
            placeholder="What words would you like to keep?"
            rows={4}
          />
          <label className="field-label" htmlFor="quote-author">
            Author or source <span>Optional</span>
          </label>
          <input
            id="quote-author"
            value={draft.author}
            maxLength={100}
            onChange={(e) => update("author", e.target.value)}
            placeholder="Who said it?"
          />
          <label className="field-label" htmlFor="quote-notebook">
            Keep it in
          </label>
          <select
            id="quote-notebook"
            value={draft.notebookId}
            onChange={(e) => update("notebookId", e.target.value)}
          >
            <option value="">Unfiled</option>
            {library.notebooks.map((n) => (
              <option value={n.id} key={n.id}>
                {library.folders.find((f) => f.id === n.folderId)?.name} /{" "}
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-section">
          <div className="section-label">
            <span>MAKE IT FEEL LIKE YOU</span>
            <Sparkles size={14} />
          </div>
          <div className="typography-row">
            <div className="font-select">
              <button
                className="font-trigger"
                aria-expanded={fontsOpen}
                onClick={() => setFontsOpen(!fontsOpen)}
              >
                <span style={{ fontFamily: draft.font }}>{draft.font}</span>
                <ChevronDown size={15} />
              </button>
              {fontsOpen && (
                <div className="font-options">
                  <input
                    aria-label="Search fonts"
                    placeholder="Find a font…"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                  />
                  <div>
                    {fonts
                      .filter((f) =>
                        f.toLowerCase().includes(fontSearch.toLowerCase()),
                      )
                      .map((font) => (
                        <button
                          className={draft.font === font ? "selected" : ""}
                          key={font}
                          style={{ fontFamily: font }}
                          onClick={() => {
                            update("font", font);
                            setFontsOpen(false);
                          }}
                        >
                          {font}
                          {font === draft.font && <Check size={14} />}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="align-buttons">
              {[
                [AlignLeft, "left"],
                [AlignCenter, "center"],
                [AlignRight, "right"],
              ].map(([Icon, align]) => (
                <IconButton
                  title={`Align ${align}`}
                  key={align}
                  aria-pressed={draft.align === align}
                  className={draft.align === align ? "active" : ""}
                  onClick={() => update("align", align)}
                >
                  <Icon size={17} />
                </IconButton>
              ))}
            </div>
          </div>
          <label className="field-label">Background</label>
          <div className="background-swatches">
            {backgrounds.map((bg) => (
              <button
                title={bg.name}
                aria-label={bg.name}
                aria-pressed={!draft.photo && draft.background === bg.id}
                className={
                  !draft.photo && draft.background === bg.id ? "selected" : ""
                }
                style={{
                  background: bg.image
                    ? `linear-gradient(#0001,#0001),url(${bg.image}) center/cover`
                    : bg.color,
                }}
                key={bg.id}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    background: bg.id,
                    photo: undefined,
                    darkness: bg.image ? 0.25 : 0,
                  }))
                }
              >
                {!draft.photo && draft.background === bg.id && (
                  <Check size={17} color={bg.ink} />
                )}
              </button>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={picker}
            className="sr-only"
            onChange={upload}
            tabIndex={-1}
          />
          <button
            className="upload-button"
            disabled={loading}
            onClick={() => picker.current.click()}
          >
            <ImagePlus size={17} />
            {loading
              ? "Preparing your photo…"
              : draft.photo
                ? "Replace your photo"
                : "Upload your own photo"}
            <Plus size={16} />
          </button>
          {draft.photo && (
            <button
              className="text-button"
              onClick={() =>
                setDraft((d) => ({ ...d, photo: undefined, darkness: 0 }))
              }
            >
              Remove uploaded photo
            </button>
          )}
          <label className="field-label" htmlFor="darkness">
            Background dimming <span>{Math.round(draft.darkness * 100)}%</span>
          </label>
          <input
            id="darkness"
            type="range"
            min="0"
            max="0.8"
            step="0.01"
            value={draft.darkness}
            onChange={(e) => update("darkness", Number(e.target.value))}
          />
          <p className="field-note">
            <Sparkles size={13} /> Your words automatically fit every size.
          </p>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="editor-footer">
        <button className="button secondary" onClick={close}>
          Cancel
        </button>
        <button
          className="button primary"
          disabled={!draft.text.trim() || loading}
          onClick={() => {
            const result = onSave({
              ...draft,
              text: draft.text.trim(),
              author: draft.author.trim(),
              updated: Date.now(),
            });
            if (result) onClose();
            else
              setError(
                "Your browser storage is full or unavailable. Try a smaller photo or export a library backup.",
              );
          }}
        >
          <Check size={16} />
          Save quote
        </button>
      </footer>
    </Modal>
  );
}
function WidgetStudio({ library, initialQuote, onClose, notify }) {
  const [quoteId, setQuoteId] = useState(
    initialQuote || library.quotes[0]?.id || "",
  );
  const [size, setSize] = useState("small");
  const [custom, setCustom] = useState({ width: 600, height: 600 });
  const [exporting, setExporting] = useState(false);
  const quote = library.quotes.find((q) => q.id === quoteId);
  const preset = sizes.find((s) => s.id === size);
  const dimensions = size === "custom" ? custom : preset;
  const valid = [dimensions.width, dimensions.height].every(
    (v) => Number.isInteger(v) && v >= 150 && v <= 2000,
  );
  return (
    <Modal onClose={onClose} className="studio-backdrop" label="Widget studio">
      <header className="modal-header">
        <div>
          <span className="eyebrow">INSPIRATION, WITHIN REACH</span>
          <h2>Your words. A little closer.</h2>
        </div>
        <IconButton title="Close widget studio" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </header>
      <div className="studio-body">
        <div className="studio-stage">
          <div className="studio-dots" />
          <div
            className={`widget-preview widget-${size}`}
            style={{ maxWidth: size === "small" ? 230 : 420 }}
          >
            {quote && (
              <QuoteArt
                quote={quote}
                width={valid ? dimensions.width : 600}
                height={valid ? dimensions.height : 600}
              />
            )}
          </div>
          <div className="preview-caption">
            <span className="status-dot" />
            {preset.name} preview<span>·</span>
            {dimensions.width} × {dimensions.height}
          </div>
        </div>
        <div className="studio-controls">
          <span className="eyebrow">WIDGET STUDIO</span>
          <h3>A daily dose of perspective.</h3>
          <p>Make a little space for the words you want to come back to.</p>
          <label className="field-label" htmlFor="widget-quote">
            Choose a quote
          </label>
          <select
            id="widget-quote"
            value={quoteId}
            onChange={(e) => setQuoteId(e.target.value)}
          >
            {library.quotes.map((q) => (
              <option value={q.id} key={q.id}>
                {q.text.slice(0, 60)}
              </option>
            ))}
          </select>
          <label className="field-label">Choose a size</label>
          <div className="widget-sizes">
            {sizes.map((s) => (
              <button
                key={s.id}
                className={s.id === size ? "active" : ""}
                onClick={() => setSize(s.id)}
              >
                <span className={`size-glyph glyph-${s.id}`} />
                {s.name}
              </button>
            ))}
          </div>
          {size === "custom" && (
            <div className="custom-dimensions">
              {["width", "height"].map((key) => (
                <label key={key}>
                  {key}
                  <input
                    aria-label={`Custom ${key}`}
                    type="number"
                    min="150"
                    max="2000"
                    value={custom[key]}
                    onChange={(e) =>
                      setCustom((v) => ({
                        ...v,
                        [key]: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          )}
          {!valid && (
            <p className="error-message">
              Choose whole-number dimensions from 150 to 2000 pixels.
            </p>
          )}
          <p className="field-note">{preset.description}</p>
          <button
            className="button primary full-width"
            disabled={!quote || !valid || exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportQuote(quote, dimensions.width, dimensions.height);
                notify("Your quote image is ready.");
              } catch (e) {
                notify(e.message);
              } finally {
                setExporting(false);
              }
            }}
          >
            <ArrowDownToLine size={16} />
            {exporting ? "Creating image…" : "Download image"}
          </button>
          <div className="studio-note">
            <Smartphone size={19} />
            <p>
              This is a web preview. Download an image in any size; adding a
              live Apple widget requires the native Quo app. Apple sets its
              supported widget sizes.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
function App() {
  const [storageError, setStorageError] = useState("");
  const [library, setLibrary] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(seed);
      const data = JSON.parse(raw);
      if (!validateLibrary(data)) throw new Error("invalid");
      return data;
    } catch {
      return null;
    }
  });
  const [selection, setSelection] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [layout, setLayout] = useState("grid");
  const [editor, setEditor] = useState(null);
  const [studio, setStudio] = useState(null);
  const [naming, setNaming] = useState(null);
  const [name, setName] = useState("");
  const [closedFolders, setClosedFolders] = useState([]);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const importInput = useRef();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  function persist(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setLibrary(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "Couldn’t save to this browser. Storage may be full or disabled. Export a backup before closing this page.",
      );
      return false;
    }
  }
  function navigate(id) {
    setSelection(id);
    setSearch("");
    setMobile(false);
  }
  const closeEditor = React.useCallback(() => setEditor(null), []);
  const closeStudio = React.useCallback(() => setStudio(null), []);
  const closeNaming = React.useCallback(() => setNaming(null), []);
  const closeDelete = React.useCallback(() => setDeleting(null), []);
  if (!library)
    return (
      <main className="recovery">
        <QuoteIcon size={42} />
        <h1>Your words are still yours.</h1>
        <p>
          Your saved library couldn’t be opened. It hasn’t been overwritten.
          Download the original data before starting a new library.
        </p>
        <button
          className="button secondary"
          onClick={() => {
            try {
              downloadBackup(
                localStorage.getItem(STORAGE_KEY) || "",
                "quo-recovery.json",
              );
            } catch {
              setToast("Browser storage is unavailable.");
            }
          }}
        >
          Download original data
        </button>
        <button
          className="button primary"
          onClick={() => {
            if (
              window.confirm(
                "Replace the unreadable library with sample quotes? Download your original data first.",
              )
            )
              persist(structuredClone(seed));
          }}
        >
          Start a new library
        </button>
        {storageError && <p role="alert">{storageError}</p>}
        {toast && <p role="status">{toast}</p>}
      </main>
    );
  const quotes = visibleQuotes(library, selection, search, sort);
  const title =
    selection === "all"
      ? "All quotes"
      : selection === "favorites"
        ? "Your favorites"
        : selection === "unfiled"
          ? "Unfiled"
          : library.notebooks.find((n) => n.id === selection)?.name ||
            "All quotes";
  function favorite(id) {
    persist({
      ...library,
      quotes: library.quotes.map((q) =>
        q.id === id ? { ...q, favorite: !q.favorite } : q,
      ),
    });
  }
  function saveQuote(quote) {
    const exists = library.quotes.some((q) => q.id === quote.id);
    const result = persist({
      ...library,
      quotes: exists
        ? library.quotes.map((q) => (q.id === quote.id ? quote : q))
        : [quote, ...library.quotes],
    });
    if (result)
      setToast(
        exists
          ? "A little more you. Quote updated."
          : "A good thought, safely kept.",
      );
    return result;
  }
  function startNaming(type, folderId) {
    setName("");
    setNaming({ type, folderId });
  }
  function downloadBackup(data, filename) {
    const url = URL.createObjectURL(
      new Blob([data], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("Choose a backup smaller than 20 MB.");
      const data = JSON.parse(await file.text());
      if (!validateLibrary(data))
        throw new Error("This file isn’t a valid Quo web library.");
      if (
        window.confirm(
          "Replace this browser’s library with the imported backup? Export your current library first if you want to keep it.",
        )
      ) {
        if (persist(data)) {
          navigate("all");
          setToast("Welcome back. Your library has been imported.");
        }
      }
    } catch (e) {
      setToast(e.message);
    } finally {
      event.target.value = "";
    }
  }
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("all");
          }}
          aria-label="Quo home"
        >
          <span className="brand-mark">“</span>
          <span>
            Quo<span className="brand-period">.</span>
          </span>
        </a>
        <div className="sidebar-intro">Words worth keeping.</div>
        <div className="sidebar-section-label">YOUR LIBRARY</div>
        <nav className="primary-nav" aria-label="Library">
          {[
            [LayoutGrid, "all", "All quotes", library.quotes.length],
            [
              Heart,
              "favorites",
              "Favorites",
              library.quotes.filter((q) => q.favorite).length,
            ],
            [
              BookOpen,
              "unfiled",
              "Unfiled",
              library.quotes.filter((q) => !q.notebookId).length,
            ],
          ].map(([Icon, id, label, count]) => (
            <button
              key={id}
              className={selection === id ? "selected" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <span className="nav-count">{count}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-section-label folders-label">
          FOLDERS
          <IconButton title="New folder" onClick={() => startNaming("folder")}>
            <Plus size={16} />
          </IconButton>
        </div>
        <nav className="folders" aria-label="Folders and notebooks">
          {library.folders.map((folder) => {
            const closed = closedFolders.includes(folder.id);
            return (
              <div className="folder-group" key={folder.id}>
                <div className="folder-row">
                  <button
                    aria-expanded={!closed}
                    onClick={() =>
                      setClosedFolders((prev) =>
                        closed
                          ? prev.filter((id) => id !== folder.id)
                          : [...prev, folder.id],
                      )
                    }
                  >
                    {closed ? (
                      <ChevronRight size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    <Folder size={17} />
                    <span>{folder.name}</span>
                  </button>
                  <IconButton
                    title={`Add notebook to ${folder.name}`}
                    onClick={() => startNaming("notebook", folder.id)}
                  >
                    <Plus size={14} />
                  </IconButton>
                </div>
                {!closed && (
                  <div className="notebooks">
                    {library.notebooks
                      .filter((n) => n.folderId === folder.id)
                      .map((n) => (
                        <button
                          className={selection === n.id ? "selected" : ""}
                          key={n.id}
                          onClick={() => navigate(n.id)}
                        >
                          <span className="notebook-dot" />
                          <span>{n.name}</span>
                          <span className="notebook-count">
                            {
                              library.quotes.filter(
                                (q) => q.notebookId === n.id,
                              ).length
                            }
                          </span>
                        </button>
                      ))}
                    {!library.notebooks.some(
                      (n) => n.folderId === folder.id,
                    ) && (
                      <button
                        className="empty-folder"
                        onClick={() => startNaming("notebook", folder.id)}
                      >
                        Add a notebook
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button className="new-folder" onClick={() => startNaming("folder")}>
          <FolderPlus size={17} />
          New folder
        </button>
        <div className="sidebar-bottom">
          <button className="widget-promo" onClick={() => setStudio({})}>
            <span className="promo-icon">
              <Smartphone size={19} />
              <span className="mini-sparkle">✧</span>
            </span>
            <span className="promo-title">
              Good words.
              <br />
              Always close.
            </span>
            <span className="promo-description">
              A little inspiration for
              <br />
              your everyday.
            </span>
            <span className="promo-link">
              Explore widgets
              <ArrowUpRight size={15} />
            </span>
          </button>
          <div className="profile">
            <span className="avatar">Y</span>
            <div>
              Your little corner
              <span>
                <span className="status-dot" />
                Stored on this device
              </span>
            </div>
            <details className="data-menu">
              <summary aria-label="Library options">
                <MoreHorizontal size={18} />
              </summary>
              <div>
                <button
                  onClick={() =>
                    downloadBackup(
                      JSON.stringify(library, null, 2),
                      "quo-library.json",
                    )
                  }
                >
                  Export library backup
                </button>
                <button onClick={() => importInput.current.click()}>
                  Import library backup
                </button>
              </div>
            </details>
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              ref={importInput}
              onChange={importBackup}
              tabIndex={-1}
            />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              title="Open navigation"
              className="mobile-menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </IconButton>
            <BookOpen size={16} />
            <span>My library</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span className="status-dot" />
              Your space, at your pace
            </span>
            <span className="topbar-avatar">Y</span>
          </div>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">COLLECT A LITTLE PERSPECTIVE</div>
              <h1>
                {title}
                <span className="title-count">{quotes.length}</span>
              </h1>
              <p>A collection of thoughts to come back to.</p>
            </div>
            <button
              className="button primary add-quote"
              onClick={() =>
                setEditor(
                  newQuote(
                    library.notebooks.some((n) => n.id === selection)
                      ? selection
                      : "",
                  ),
                )
              }
            >
              <Plus size={18} />
              New quote
            </button>
          </div>
          {selection === "all" && !search && (
            <section className="welcome-banner">
              <div className="banner-content">
                <span className="banner-eyebrow">
                  <span />A SMALL COLLECTION. A BIG FEELING.
                </span>
                <h2>
                  A home for the words
                  <br />
                  that stay with you.
                </h2>
                <p>Keep what moves you. Make it yours.</p>
                <button onClick={() => setStudio({})}>
                  Bring your words to life
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="banner-art" aria-hidden="true">
                <div className="decorative-ring ring-one" />
                <div className="decorative-ring ring-two" />
                <div className="banner-widget back-widget">
                  <span>
                    LESS, BUT
                    <br />
                    BETTER.
                  </span>
                  <small>A DAILY REMINDER</small>
                </div>
                <div className="banner-widget front-widget">
                  <span className="little-quote">“</span>
                  <span>
                    There is beauty
                    <br />
                    in the becoming.
                  </span>
                  <small>ONE DAY AT A TIME</small>
                </div>
                <span className="floating-star star-one">✧</span>
                <span className="floating-star star-two">✦</span>
                <span className="banner-art-label">
                  YOUR INSPIRATION, REIMAGINED
                </span>
              </div>
            </section>
          )}
          <div className="collection-toolbar">
            <div className="collection-tab">
              <span>
                {selection === "favorites"
                  ? "Saved favorites"
                  : search
                    ? "Search results"
                    : "Your collection"}
              </span>
              <span>{quotes.length}</span>
            </div>
            <div className="collection-tools">
              <label className="search-box">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a little inspiration…"
                  aria-label="Search quotes"
                />
                {search && (
                  <IconButton
                    title="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={13} />
                  </IconButton>
                )}
              </label>
              <select
                className="sort-select"
                aria-label="Sort quotes"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recent">Recently added</option>
                <option value="oldest">Oldest first</option>
                <option value="author">By author</option>
              </select>
              <div className="view-toggle">
                <IconButton
                  title="Grid view"
                  aria-pressed={layout === "grid"}
                  className={layout === "grid" ? "active" : ""}
                  onClick={() => setLayout("grid")}
                >
                  <Grid2X2 size={16} />
                </IconButton>
                <IconButton
                  title="List view"
                  aria-pressed={layout === "list"}
                  className={layout === "list" ? "active" : ""}
                  onClick={() => setLayout("list")}
                >
                  <List size={18} />
                </IconButton>
              </div>
            </div>
          </div>
          {storageError && (
            <div className="error-message" role="alert">
              {storageError}
            </div>
          )}
          {quotes.length ? (
            <div
              className={`quotes-grid ${layout === "list" ? "list-layout" : ""}`}
            >
              {quotes.map((quote) => {
                const notebook = library.notebooks.find(
                  (n) => n.id === quote.notebookId,
                );
                return (
                  <article className="quote-card" key={quote.id}>
                    <div className="card-visual">
                      <button
                        className="card-open"
                        onClick={() => setEditor(quote)}
                        aria-label={`Edit quote: ${quote.text}`}
                      >
                        <QuoteArt quote={quote} />
                      </button>
                      <IconButton
                        className={`favorite-button ${quote.favorite ? "is-favorite" : ""}`}
                        title={
                          quote.favorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        aria-pressed={quote.favorite}
                        onClick={() => favorite(quote.id)}
                      >
                        <Heart
                          size={15}
                          fill={quote.favorite ? "currentColor" : "none"}
                        />
                      </IconButton>
                      <button
                        className="card-widget-button"
                        onClick={() => setStudio({ quoteId: quote.id })}
                      >
                        <Smartphone size={13} />
                        Preview widget
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <div className="card-footer">
                      <div>
                        <span className={`notebook-symbol ${quote.background}`}>
                          <BookOpen size={12} />
                        </span>
                        <button
                          onClick={() =>
                            navigate(quote.notebookId || "unfiled")
                          }
                        >
                          {notebook?.name || "Unfiled"}
                        </button>
                      </div>
                      <div className="card-menu-wrap">
                        <IconButton
                          title={`Options for quote by ${quote.author || "you"}`}
                          aria-expanded={menu === quote.id}
                          onClick={() =>
                            setMenu(menu === quote.id ? null : quote.id)
                          }
                        >
                          <MoreHorizontal size={19} />
                        </IconButton>
                        {menu === quote.id && (
                          <>
                            <button
                              className="menu-dismiss"
                              aria-label="Close quote options"
                              onClick={() => setMenu(null)}
                            />
                            <div className="card-menu">
                              <button
                                onClick={() => {
                                  setEditor(quote);
                                  setMenu(null);
                                }}
                              >
                                Edit quote
                              </button>
                              <button
                                onClick={() => {
                                  setStudio({ quoteId: quote.id });
                                  setMenu(null);
                                }}
                              >
                                Preview & export
                              </button>
                              <button
                                className="danger"
                                onClick={() => {
                                  setDeleting(quote);
                                  setMenu(null);
                                }}
                              >
                                <Trash2 size={13} />
                                Delete quote
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {layout === "list" && (
                      <div className="list-quote-text">
                        <p>{quote.text}</p>
                        <span>{quote.author || "Your own words"}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span>
                <QuoteIcon size={30} />
              </span>
              <h2>
                {search ? "No words found." : "A little room for inspiration."}
              </h2>
              <p>
                {search
                  ? "Try another word or author."
                  : selection === "favorites"
                    ? "Tap the heart on a quote to keep it close."
                    : "The next thought worth keeping starts here."}
              </p>
              {search ? (
                <button
                  className="button secondary"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              ) : (
                <button
                  className="button secondary"
                  onClick={() =>
                    setEditor(
                      newQuote(
                        library.notebooks.some((n) => n.id === selection)
                          ? selection
                          : "",
                      ),
                    )
                  }
                >
                  <Plus size={16} />
                  Add a quote
                </button>
              )}
            </div>
          )}
          <footer className="collection-footer">
            <span>
              <span className="tiny-quote">“</span>A few good words can change
              the shape of a day.
            </span>
            <span>Made for your everyday.</span>
          </footer>
          {library.notebooks.some((n) => n.id === selection) && (
            <button
              className="text-button remove-notebook"
              onClick={() => {
                if (
                  window.confirm(
                    "Remove this notebook? Its quotes will be kept in Unfiled.",
                  )
                ) {
                  if (persist(removeNotebook(library, selection)))
                    navigate("unfiled");
                }
              }}
            >
              Remove notebook · keep quotes
            </button>
          )}
        </main>
      </div>
      {editor && (
        <QuoteEditor
          quote={editor}
          library={library}
          onClose={closeEditor}
          onSave={saveQuote}
        />
      )}
      {studio && (
        <WidgetStudio
          library={library}
          initialQuote={studio.quoteId}
          onClose={closeStudio}
          notify={setToast}
        />
      )}
      {naming && (
        <Modal
          onClose={closeNaming}
          className="small-modal"
          label={`New ${naming.type}`}
        >
          <header className="modal-header">
            <div>
              <span className="eyebrow">A PLACE FOR YOUR THOUGHTS</span>
              <h2>New {naming.type}</h2>
            </div>
            <IconButton title="Close" onClick={closeNaming}>
              <X size={18} />
            </IconButton>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const item = { id: crypto.randomUUID(), name: name.trim() };
              if (!item.name) return;
              const next =
                naming.type === "folder"
                  ? { ...library, folders: [...library.folders, item] }
                  : {
                      ...library,
                      notebooks: [
                        ...library.notebooks,
                        { ...item, folderId: naming.folderId },
                      ],
                    };
              if (persist(next)) {
                closeNaming();
                setToast(`Your ${naming.type} is ready.`);
              }
            }}
          >
            <label htmlFor="collection-name">Give it a name</label>
            <input
              id="collection-name"
              autoFocus
              placeholder={
                naming.type === "folder"
                  ? "e.g. A creative life"
                  : "e.g. Words for a new day"
              }
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="button primary" disabled={!name.trim()}>
              <Plus size={16} />
              Create {naming.type}
            </button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          onClose={closeDelete}
          className="small-modal"
          label="Delete quote"
        >
          <header className="modal-header">
            <h2>Let this one go?</h2>
            <IconButton title="Cancel deletion" onClick={closeDelete}>
              <X size={18} />
            </IconButton>
          </header>
          <div className="delete-body">
            <p>
              This quote will be removed from your library. This can’t be
              undone.
            </p>
            <div>
              <button className="button secondary" onClick={closeDelete}>
                Keep quote
              </button>
              <button
                className="button danger-button"
                onClick={() => {
                  if (
                    persist({
                      ...library,
                      quotes: library.quotes.filter(
                        (q) => q.id !== deleting.id,
                      ),
                    })
                  ) {
                    closeDelete();
                    setToast("Quote removed.");
                  }
                }}
              >
                <Trash2 size={16} />
                Delete quote
              </button>
            </div>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <IconButton title="Dismiss notification" onClick={() => setToast("")}>
            <X size={14} />
          </IconButton>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);


// ---- Design tokens -------------------------------------------------
const COLORS = {
  paper: "#F5F7FB",
  paperDark: "#E5EBF4",
  ink: "#122A4E",
  inkSoft: "#51637F",
  line: "#C7D3E3",
  press: "#1E4E8C",
  rush: "#B23A2E",
  brass: "#C9A227",
  gold: "#C9A227",
  goldDeep: "#8C6D1F",
  success: "#2F8F5B",
};

const STAGES = [
  { key: "quote", label: "Quote", swatch: "#8FA6C2" },
  { key: "prepress", label: "Prepress", swatch: "#3D6FA8" },
  { key: "printing", label: "Printing", swatch: "#1E4E8C" },
  { key: "finishing", label: "Finishing", swatch: "#B8934B" },
  { key: "ready", label: "Ready", swatch: "#C9A227" },
  { key: "delivered", label: "Delivered", swatch: "#8C6D1F" },
];

const PAY_STATUSES = [
  { key: "unpaid", label: "Unpaid", color: COLORS.rush },
  { key: "invoiced", label: "Invoiced", color: COLORS.press },
  { key: "paid", label: "Paid", color: COLORS.gold },
];

const APPROVAL_STATUSES = [
  { key: "pending", label: "Pending", color: COLORS.brass, icon: "⏳" },
  { key: "approved", label: "Approved", color: COLORS.success, icon: "✓" },
  { key: "changes", label: "Changes requested", color: COLORS.rush, icon: "✎" },
];

const JOB_TYPES = [
  "Business cards","Brochures","Flyers","Banners","Signage",
  "Stickers & labels","Booklets","Apparel","Postcards","Other",
];

const MATERIAL_UNITS = ["sheets","reams","rolls","yards","units","liters","lbs"];

const ACCEPTED_FILE_EXT = [".pdf",".jpg",".jpeg",".png",".stl",".obj",".glb",".gltf",".fbx"];
const ACCEPTED_FILE_ATTR = ACCEPTED_FILE_EXT.join(",");
const MODEL_EXT = ["stl","obj","glb","gltf","fbx"];
const IMAGE_EXT = ["jpg","jpeg","png"];

const BUCKET = "job-files";

// ---- helpers --------------------------------------------------------
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return Math.round((d - today) / 86400000);
}
function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "₱0.00";
  return "₱" + v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtBytes(b) {
  if (!b && b !== 0) return "";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}
function extOf(name) {
  const parts = (name || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}
function fileKind(name) {
  const ext = extOf(name);
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (MODEL_EXT.includes(ext)) return "model";
  return "other";
}
function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek() {
  const d = startOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}
function upsertById(list, item) {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const copy = [...list];
  copy[idx] = item;
  return copy;
}
function removeById(list, id) {
  return list.filter((x) => x.id !== id);
}

// ---- DB <-> app field mapping ---------------------------------------
function jobFromDb(r) {
  return {
    id: r.id, jobNumber: r.job_number, customer: r.customer, jobType: r.job_type || JOB_TYPES[0],
    description: r.description || "", quantity: r.quantity || "", dueDate: r.due_date || "",
    price: r.price == null ? "" : String(r.price), rush: !!r.rush, notes: r.notes || "",
    stage: r.stage || "quote", paymentStatus: r.payment_status || "unpaid",
    invoiceNumber: r.invoice_number || "", approvalStatus: r.approval_status || "pending",
    approvalNote: r.approval_note || "", createdAt: r.created_at,
  };
}
function jobToDb(j) {
  return {
    id: j.id, job_number: j.jobNumber, customer: j.customer, job_type: j.jobType,
    description: j.description || null, quantity: j.quantity || null,
    due_date: j.dueDate || null, price: j.price === "" || j.price == null ? null : parseFloat(j.price),
    rush: !!j.rush, notes: j.notes || null, stage: j.stage, payment_status: j.paymentStatus,
    invoice_number: j.invoiceNumber || null, approval_status: j.approvalStatus,
    approval_note: j.approvalNote || null,
  };
}
function fileFromDb(r) {
  return {
    id: r.id, jobId: r.job_id, fileName: r.file_name, filePath: r.file_path,
    fileUrl: r.file_url, fileType: r.file_type, fileSize: r.file_size, uploadedAt: r.uploaded_at,
  };
}
function customerFromDb(r) {
  return { id: r.id, name: r.name, contactPerson: r.contact_person || "", phone: r.phone || "", email: r.email || "", address: r.address || "", notes: r.notes || "" };
}
function customerToDb(c) {
  return { id: c.id, name: c.name, contact_person: c.contactPerson || null, phone: c.phone || null, email: c.email || null, address: c.address || null, notes: c.notes || null };
}
function supplierFromDb(r) {
  return { id: r.id, name: r.name, supplies: r.supplies || "", contactPerson: r.contact_person || "", phone: r.phone || "", email: r.email || "", address: r.address || "", notes: r.notes || "" };
}
function supplierToDb(s) {
  return { id: s.id, name: s.name, supplies: s.supplies || null, contact_person: s.contactPerson || null, phone: s.phone || null, email: s.email || null, address: s.address || null, notes: s.notes || null };
}
function materialFromDb(r) {
  return { id: r.id, name: r.name, category: r.category || "", qtyOnHand: r.qty_on_hand == null ? "" : String(r.qty_on_hand), unit: r.unit || MATERIAL_UNITS[0], reorderPoint: r.reorder_point == null ? "" : String(r.reorder_point), notes: r.notes || "" };
}
function materialToDb(m) {
  return { id: m.id, name: m.name, category: m.category || null, qty_on_hand: m.qtyOnHand === "" ? null : parseFloat(m.qtyOnHand), unit: m.unit, reorder_point: m.reorderPoint === "" ? null : parseFloat(m.reorderPoint), notes: m.notes || null };
}

function emptyJobDraft() {
  return {
    id: null, customer: "", jobType: JOB_TYPES[0], description: "", quantity: "",
    dueDate: "", price: "", rush: false, notes: "", stage: "quote",
    paymentStatus: "unpaid", invoiceNumber: "", approvalStatus: "pending", approvalNote: "",
  };
}
function emptyCustomerDraft() { return { name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" }; }
function emptySupplierDraft() { return { name: "", supplies: "", contactPerson: "", phone: "", email: "", address: "", notes: "" }; }
function emptyMaterialDraft() { return { name: "", category: "", qtyOnHand: "", unit: MATERIAL_UNITS[0], reorderPoint: "", notes: "" }; }

function downloadCSV(jobs) {
  const headers = ["Job #","Customer","Job Type","Quantity","Stage","Due Date","Price","Payment Status","Invoice #","Approval","Rush","Description","Notes"];
  const rows = jobs.map((j) => [
    j.jobNumber, j.customer, j.jobType, j.quantity,
    STAGES.find((s) => s.key === j.stage)?.label || j.stage,
    j.dueDate, j.price, j.paymentStatus, j.invoiceNumber || "",
    (APPROVAL_STATUSES.find((a) => a.key === j.approvalStatus) || {}).label || j.approvalStatus,
    j.rush ? "Yes" : "No", j.description, j.notes,
  ]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "signatureprintsph_jobs.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- small components -------------------------------------------------
function Toast({ toast, onDismiss }) {
  return (
    <div
      onClick={() => onDismiss(toast.id)}
      style={{
        background: "#fff", border: `1px solid ${COLORS.line}`,
        borderLeft: `4px solid ${toast.type === "error" ? COLORS.rush : toast.type === "success" ? COLORS.success : COLORS.press}`,
        borderRadius: 8, padding: "10px 14px", fontSize: 13.5, color: COLORS.ink,
        boxShadow: "0 8px 20px rgba(18,42,78,0.15)", cursor: "pointer",
        animation: "toastIn .28s cubic-bezier(.34,1.56,.64,1)", minWidth: 220, maxWidth: 320,
      }}
    >
      {toast.message}
    </div>
  );
}
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", bottom: 18, right: 18, display: "flex", flexDirection: "column", gap: 8, zIndex: 200 }}>
      {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}
function FileIcon({ kind, size = 18 }) {
  const color = kind === "pdf" ? COLORS.rush : kind === "model" ? COLORS.press : kind === "image" ? COLORS.gold : COLORS.inkSoft;
  return (
    <div style={{ width: size + 10, height: size + 10, borderRadius: 6, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size - 2, color }}>
        {kind === "pdf" ? "📄" : kind === "model" ? "🧊" : kind === "image" ? "🖼️" : "📎"}
      </span>
    </div>
  );
}
function FileRow({ file, onDelete, uploading }) {
  const kind = fileKind(file.fileName || file.name);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px", border: `1px solid ${COLORS.line}`, borderRadius: 8, background: "#fff" }}>
      <FileIcon kind={kind} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.fileName || file.name}</div>
        <div style={{ fontSize: 11, color: COLORS.inkSoft }}>
          {uploading ? "Uploading…" : fmtBytes(file.fileSize || file.size)}
        </div>
      </div>
      {!uploading && file.fileUrl && (
        <a href={file.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.press, textDecoration: "none" }}>View</a>
      )}
      {onDelete && !uploading && (
        <button onClick={() => onDelete(file)} style={{ background: "none", border: "none", color: COLORS.rush, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 2px" }}>×</button>
      )}
      {uploading && <div className="spinner" />}
    </div>
  );
}
function FileDropzone({ onFiles }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? COLORS.gold : COLORS.line}`,
        background: dragOver ? COLORS.paperDark : "#fff",
        borderRadius: 10, padding: "16px 12px", textAlign: "center", cursor: "pointer",
        transition: "border-color .15s ease, background .15s ease",
      }}
    >
      <div style={{ fontSize: 20 }}>📎</div>
      <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4 }}>
        Drop files or <span style={{ color: COLORS.press, fontWeight: 600 }}>browse</span>
      </div>
      <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 2 }}>PDF, JPG, PNG, or 3D models (STL, OBJ, GLB, FBX)</div>
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_FILE_ATTR} style={{ display: "none" }}
        onChange={(e) => { onFiles(Array.from(e.target.files)); e.target.value = ""; }} />
    </div>
  );
}
function navBtnStyle(disabled) {
  return { fontSize: 12, border: `1px solid ${COLORS.line}`, background: disabled ? COLORS.paperDark : "#fff", color: disabled ? COLORS.line : COLORS.ink, borderRadius: 5, padding: "2px 8px", cursor: disabled ? "default" : "pointer", transition: "transform .08s ease" };
}
const labelStyle = { fontSize: 11, color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const inputStyle = { width: "100%", border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 11px", fontSize: 13.5, outline: "none", boxSizing: "border-box", background: "#fff", color: COLORS.ink, transition: "border-color .15s ease, box-shadow .15s ease" };
const primaryBtnStyle = { background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDeep})`, color: COLORS.ink, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(201,162,39,0.35)" };
const secondaryBtnStyle = { background: "#fff", color: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const linkBtnStyle = { background: "none", border: "none", color: COLORS.press, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 };
const rowStyle = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.6fr 1.4fr", alignItems: "center", borderTop: `1px solid ${COLORS.line}`, padding: "0 14px" };
const cellStyle = { fontSize: 13, padding: "10px 6px" };

function TableHeader({ cols }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.6fr 1.4fr", background: COLORS.paperDark, padding: "0 14px" }}>
      {cols.map((c, i) => <div key={i} style={{ ...cellStyle, ...labelStyle, padding: "9px 6px" }}>{c}</div>)}
    </div>
  );
}
function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div className="fade-up" style={{ animationDelay: `${delay}ms`, background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(18,42,78,0.06)" }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: color || COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
function SimpleJobTable({ jobs, onOpen }) {
  return (
    <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      {jobs.map((j) => (
        <div key={j.id} className="row" onClick={() => onOpen(j.id)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderTop: `1px solid ${COLORS.line}`, cursor: "pointer", fontSize: 13 }}>
          <span><strong>{j.jobNumber}</strong> · {j.customer}</span>
          <span style={{ color: COLORS.rush }}>Due {fmtDate(j.dueDate)}</span>
        </div>
      ))}
    </div>
  );
}
function DetailField({ label, value }) {
  return <div><div style={labelStyle}>{label}</div><div style={{ marginTop: 2 }}>{value}</div></div>;
}
function FormRow({ label, children }) {
  return <div style={{ marginTop: 10 }}><div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>{children}</div>;
}
function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} className="overlay-bg" style={{ position: "fixed", inset: 0, background: "rgba(18,42,78,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 100, backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="overlay-card" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(18,42,78,0.3)" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [jobFiles, setJobFiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState("connecting"); // connecting | live | error
  const [toasts, setToasts] = useState([]);
  const [tab, setTab] = useState("board");
  const [query, setQuery] = useState("");

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobDraft, setJobDraft] = useState(emptyJobDraft());
  const [pendingFiles, setPendingFiles] = useState([]); // files staged during "new job" before save
  const [uploadingCount, setUploadingCount] = useState(0);
  const [detailJobId, setDetailJobId] = useState(null);

  const [custModalOpen, setCustModalOpen] = useState(false);
  const [editingCustId, setEditingCustId] = useState(null);
  const [custDraft, setCustDraft] = useState(emptyCustomerDraft());

  const [supModalOpen, setSupModalOpen] = useState(false);
  const [editingSupId, setEditingSupId] = useState(null);
  const [supDraft, setSupDraft] = useState(emptySupplierDraft());

  const [matModalOpen, setMatModalOpen] = useState(false);
  const [editingMatId, setEditingMatId] = useState(null);
  const [matDraft, setMatDraft] = useState(emptyMaterialDraft());

  function pushToast(message, type = "info") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3400);
  }
  function dismissToast(id) { setToasts((prev) => prev.filter((t) => t.id !== id)); }

  // ---- initial load + realtime subscriptions ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [j, f, c, s, m] = await Promise.all([
          supabase.from("jobs").select("*").order("created_at", { ascending: true }),
          supabase.from("job_files").select("*"),
          supabase.from("customers").select("*"),
          supabase.from("suppliers").select("*"),
          supabase.from("materials").select("*"),
        ]);
        if (cancelled) return;
        if (j.error || f.error || c.error || s.error || m.error) throw (j.error || f.error || c.error || s.error || m.error);
        setJobs((j.data || []).map(jobFromDb));
        setJobFiles((f.data || []).map(fileFromDb));
        setCustomers((c.data || []).map(customerFromDb));
        setSuppliers((s.data || []).map(supplierFromDb));
        setMaterials((m.data || []).map(materialFromDb));
        setSyncState("live");
      } catch (e) {
        setSyncState("error");
        pushToast("Couldn't connect to the database. Check your Supabase setup.", "error");
      } finally {
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        if (payload.eventType === "DELETE") setJobs((prev) => removeById(prev, payload.old.id));
        else setJobs((prev) => upsertById(prev, jobFromDb(payload.new)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "job_files" }, (payload) => {
        if (payload.eventType === "DELETE") setJobFiles((prev) => removeById(prev, payload.old.id));
        else setJobFiles((prev) => upsertById(prev, fileFromDb(payload.new)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, (payload) => {
        if (payload.eventType === "DELETE") setCustomers((prev) => removeById(prev, payload.old.id));
        else setCustomers((prev) => upsertById(prev, customerFromDb(payload.new)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, (payload) => {
        if (payload.eventType === "DELETE") setSuppliers((prev) => removeById(prev, payload.old.id));
        else setSuppliers((prev) => upsertById(prev, supplierFromDb(payload.new)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "materials" }, (payload) => {
        if (payload.eventType === "DELETE") setMaterials((prev) => removeById(prev, payload.old.id));
        else setMaterials((prev) => upsertById(prev, materialFromDb(payload.new)));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSyncState("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSyncState("error");
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ---- filtering ----
  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => [j.customer, j.jobNumber, j.jobType, j.description].join(" ").toLowerCase().includes(q));
  }, [jobs, query]);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => (map[s.key] = []));
    filteredJobs.forEach((j) => { if (map[j.stage]) map[j.stage].push(j); });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (!a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.localeCompare(b.dueDate))));
    return map;
  }, [filteredJobs]);

  const metrics = useMemo(() => {
    const sow = startOfWeek(), eow = endOfWeek();
    const dueThisWeek = jobs.filter((j) => {
      if (!j.dueDate || j.stage === "delivered") return false;
      const d = new Date(j.dueDate + "T00:00:00");
      return d >= sow && d < eow;
    });
    const overdue = jobs.filter((j) => j.dueDate && j.stage !== "delivered" && daysUntil(j.dueDate) < 0);
    const rushActive = jobs.filter((j) => j.rush && j.stage !== "delivered");
    const pendingApproval = jobs.filter((j) => j.approvalStatus === "pending");
    const collected = jobs.filter((j) => j.paymentStatus === "paid").reduce((s, j) => s + (parseFloat(j.price) || 0), 0);
    const outstanding = jobs.filter((j) => j.paymentStatus !== "paid").reduce((s, j) => s + (parseFloat(j.price) || 0), 0);
    const lowStock = materials.filter((m) => parseFloat(m.qtyOnHand) <= parseFloat(m.reorderPoint || 0));
    const stageCounts = STAGES.map((s) => ({ ...s, count: jobs.filter((j) => j.stage === s.key).length }));
    return { dueThisWeek, overdue, rushActive, pendingApproval, collected, outstanding, lowStock, stageCounts };
  }, [jobs, materials]);

  // ---- file upload ----
  async function uploadFiles(files, jobId) {
    const accepted = files.filter((f) => ACCEPTED_FILE_EXT.includes("." + extOf(f.name)));
    const rejected = files.length - accepted.length;
    if (rejected > 0) pushToast(`${rejected} file(s) skipped — unsupported type`, "error");
    for (const file of accepted) {
      const tempId = crypto.randomUUID();
      const stagedEntry = { id: tempId, name: file.name, size: file.size, uploading: true };
      setPendingFiles((prev) => [...prev, stagedEntry]);
      setUploadingCount((c) => c + 1);
      try {
        const path = `${jobId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insErr } = await supabase.from("job_files").insert({
          job_id: jobId, file_name: file.name, file_path: path,
          file_url: urlData.publicUrl, file_type: file.type || extOf(file.name), file_size: file.size,
        });
        if (insErr) throw insErr;
        pushToast(`${file.name} attached`, "success");
      } catch (e) {
        pushToast(`Couldn't upload ${file.name}`, "error");
      } finally {
        setPendingFiles((prev) => prev.filter((f) => f.id !== tempId));
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }
  }
  async function deleteFile(file) {
    try {
      await supabase.storage.from(BUCKET).remove([file.filePath]);
      await supabase.from("job_files").delete().eq("id", file.id);
    } catch (e) {
      pushToast("Couldn't remove file", "error");
    }
  }

  // ---- job CRUD ----
  function openNewJob() {
    setJobDraft({ ...emptyJobDraft(), id: crypto.randomUUID() });
    setEditingJobId(null);
    setPendingFiles([]);
    setJobModalOpen(true);
  }
  function openEditJob(job) { setJobDraft({ ...job }); setEditingJobId(job.id); setJobModalOpen(true); setDetailJobId(null); }

  async function saveJobDraft() {
    if (!jobDraft.customer.trim()) return;
    try {
      if (editingJobId) {
        const { error } = await supabase.from("jobs").update(jobToDb(jobDraft)).eq("id", editingJobId);
        if (error) throw error;
        pushToast("Job updated", "success");
      } else {
        const { data: numData, error: numErr } = await supabase.rpc("next_job_number");
        if (numErr) throw numErr;
        const newJob = { ...jobDraft, jobNumber: numData };
        const { error } = await supabase.from("jobs").insert(jobToDb(newJob));
        if (error) throw error;
        if (!customers.some((c) => c.name.toLowerCase() === jobDraft.customer.trim().toLowerCase())) {
          await supabase.from("customers").insert(customerToDb({ ...emptyCustomerDraft(), id: crypto.randomUUID(), name: jobDraft.customer.trim() }));
        }
        pushToast(`Job ${numData} created 🎉`, "success");
      }
      setJobModalOpen(false);
    } catch (e) {
      pushToast("Couldn't save job", "error");
    }
  }
  async function deleteJob(id) {
    try {
      const files = jobFiles.filter((f) => f.jobId === id);
      if (files.length) await supabase.storage.from(BUCKET).remove(files.map((f) => f.filePath));
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
      setDetailJobId(null);
      pushToast("Job deleted", "info");
    } catch (e) {
      pushToast("Couldn't delete job", "error");
    }
  }
  async function moveStage(id, dir) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const idx = STAGES.findIndex((s) => s.key === job.stage);
    const nextIdx = Math.min(STAGES.length - 1, Math.max(0, idx + dir));
    const nextStage = STAGES[nextIdx].key;
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, stage: nextStage } : j)));
    const { error } = await supabase.from("jobs").update({ stage: nextStage }).eq("id", id);
    if (error) pushToast("Couldn't move job", "error");
  }
  async function setPaymentStatus(id, status) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    let invoiceNumber = job.invoiceNumber;
    try {
      if (status !== "unpaid" && !invoiceNumber) {
        const { data, error } = await supabase.rpc("next_invoice_number");
        if (error) throw error;
        invoiceNumber = data;
      }
      const { error } = await supabase.from("jobs").update({ payment_status: status, invoice_number: invoiceNumber }).eq("id", id);
      if (error) throw error;
      if (status === "paid") pushToast(`${job.jobNumber} marked paid 🎉`, "success");
    } catch (e) {
      pushToast("Couldn't update payment status", "error");
    }
  }
  async function setApprovalStatus(id, status) {
    const job = jobs.find((j) => j.id === id);
    const { error } = await supabase.from("jobs").update({ approval_status: status }).eq("id", id);
    if (error) pushToast("Couldn't update approval status", "error");
    else if (status === "approved") pushToast(`${job?.jobNumber || "Job"} approved by client ✓`, "success");
  }

  // ---- customer CRUD ----
  function openNewCustomer() { setCustDraft(emptyCustomerDraft()); setEditingCustId(null); setCustModalOpen(true); }
  function openEditCustomer(c) { setCustDraft({ ...c }); setEditingCustId(c.id); setCustModalOpen(true); }
  async function saveCustDraft() {
    if (!custDraft.name.trim()) return;
    try {
      if (editingCustId) await supabase.from("customers").update(customerToDb(custDraft)).eq("id", editingCustId);
      else await supabase.from("customers").insert(customerToDb({ ...custDraft, id: crypto.randomUUID() }));
      pushToast("Customer saved", "success");
      setCustModalOpen(false);
    } catch (e) { pushToast("Couldn't save customer", "error"); }
  }
  async function deleteCustomer(id) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) pushToast("Couldn't delete customer", "error");
  }

  // ---- supplier CRUD ----
  function openNewSupplier() { setSupDraft(emptySupplierDraft()); setEditingSupId(null); setSupModalOpen(true); }
  function openEditSupplier(s) { setSupDraft({ ...s }); setEditingSupId(s.id); setSupModalOpen(true); }
  async function saveSupDraft() {
    if (!supDraft.name.trim()) return;
    try {
      if (editingSupId) await supabase.from("suppliers").update(supplierToDb(supDraft)).eq("id", editingSupId);
      else await supabase.from("suppliers").insert(supplierToDb({ ...supDraft, id: crypto.randomUUID() }));
      pushToast("Supplier saved", "success");
      setSupModalOpen(false);
    } catch (e) { pushToast("Couldn't save supplier", "error"); }
  }
  async function deleteSupplier(id) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) pushToast("Couldn't delete supplier", "error");
  }

  // ---- material CRUD ----
  function openNewMaterial() { setMatDraft(emptyMaterialDraft()); setEditingMatId(null); setMatModalOpen(true); }
  function openEditMaterial(m) { setMatDraft({ ...m }); setEditingMatId(m.id); setMatModalOpen(true); }
  async function saveMatDraft() {
    if (!matDraft.name.trim()) return;
    try {
      if (editingMatId) await supabase.from("materials").update(materialToDb(matDraft)).eq("id", editingMatId);
      else await supabase.from("materials").insert(materialToDb({ ...matDraft, id: crypto.randomUUID() }));
      pushToast("Material saved", "success");
      setMatModalOpen(false);
    } catch (e) { pushToast("Couldn't save material", "error"); }
  }
  async function deleteMaterial(id) {
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) pushToast("Couldn't delete material", "error");
  }

  const detailJob = jobs.find((j) => j.id === detailJobId) || null;
  const detailFiles = detailJob ? jobFiles.filter((f) => f.jobId === detailJob.id) : [];
  const draftFiles = jobModalOpen ? [...jobFiles.filter((f) => f.jobId === jobDraft.id), ...pendingFiles] : [];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif", background: COLORS.paper, color: COLORS.ink, minHeight: "100vh", width: "100%" }}>
      <GlobalStyle />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="header-gradient" style={{ borderBottom: `2px solid ${COLORS.ink}`, padding: "14px 24px 0", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: COLORS.ink, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", boxShadow: "0 4px 14px rgba(18,42,78,0.25)" }}>
              <img src="/logo.png" alt="Signature Prints PH" style={{ height: 30, width: "auto", display: "block" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span className={syncState === "live" ? "pulse-dot" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: syncState === "error" ? COLORS.rush : syncState === "live" ? COLORS.success : COLORS.brass, display: "inline-block" }} />
                {syncState === "live" ? "Live — synced across everyone" : syncState === "error" ? "Connection issue" : "Connecting…"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {tab === "board" && (
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, job #, type…"
                style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", fontSize: 13.5, width: 220, outline: "none" }} />
            )}
            <button className="psbtn" onClick={() => downloadCSV(jobs)} style={secondaryBtnStyle}>Export CSV</button>
            {tab === "board" && <button className="psbtn" onClick={openNewJob} style={primaryBtnStyle}>+ New job</button>}
            {tab === "customers" && <button className="psbtn" onClick={openNewCustomer} style={primaryBtnStyle}>+ New customer</button>}
            {tab === "suppliers" && <button className="psbtn" onClick={openNewSupplier} style={primaryBtnStyle}>+ New supplier</button>}
            {tab === "materials" && <button className="psbtn" onClick={openNewMaterial} style={primaryBtnStyle}>+ New material</button>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, position: "relative", zIndex: 1 }}>
          {[["board","Board"],["dashboard","Dashboard"],["invoicing","Invoicing"],["customers","Customers"],["suppliers","Suppliers"],["materials","Materials"]].map(([k,l]) => (
            <button key={k} className={"tabbtn" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      {!loaded && (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.inkSoft, fontSize: 13.5 }}>Loading job board…</div>
      )}

      {loaded && tab === "board" && (
        <div key="board" className="tab-fade board" style={{ display: "flex", gap: 14, padding: 20, overflowX: "auto", alignItems: "flex-start" }}>
          {STAGES.map((stage, stageIdx) => {
            const list = byStage[stage.key] || [];
            return (
              <div key={stage.key} className="fade-up" style={{ animationDelay: `${stageIdx * 40}ms`, background: COLORS.paperDark, border: `1px solid ${COLORS.line}`, borderRadius: 12, width: 254, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 210px)" }}>
                <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${COLORS.line}` }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: stage.swatch, flexShrink: 0 }} />
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{stage.label}</div>
                  <div style={{ marginLeft: "auto", fontSize: 12, color: COLORS.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{list.length}</div>
                </div>
                <div className="stage-col" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                  {list.length === 0 && <div style={{ fontSize: 12, color: COLORS.inkSoft, padding: "6px 2px" }}>No jobs here.</div>}
                  {list.map((job, i) => {
                    const dleft = daysUntil(job.dueDate);
                    const overdue = dleft !== null && dleft < 0 && stage.key !== "delivered";
                    const soon = dleft !== null && dleft >= 0 && dleft <= 2 && stage.key !== "delivered";
                    const pay = PAY_STATUSES.find((p) => p.key === job.paymentStatus) || PAY_STATUSES[0];
                    const appr = APPROVAL_STATUSES.find((a) => a.key === job.approvalStatus) || APPROVAL_STATUSES[0];
                    const fileCount = jobFiles.filter((f) => f.jobId === job.id).length;
                    return (
                      <div key={job.id} className="job-card fade-up" style={{ animationDelay: `${i * 30}ms`, background: "#fff", border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${stage.swatch}`, borderRadius: 8, padding: "9px 10px", cursor: "pointer" }}
                        onClick={() => setDetailJobId(job.id)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: COLORS.inkSoft }}>{job.jobNumber}</div>
                          {job.rush && <div className="rush-pulse" style={{ fontSize: 10, fontWeight: 700, color: COLORS.rush, border: `1px solid ${COLORS.rush}`, borderRadius: 4, padding: "1px 5px" }}>RUSH</div>}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 3 }}>{job.customer}</div>
                        <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 1 }}>{job.jobType}{job.quantity ? ` · ${job.quantity}` : ""}</div>
                        <div style={{ fontSize: 12, marginTop: 6, color: overdue ? COLORS.rush : soon ? COLORS.brass : COLORS.inkSoft, fontWeight: overdue || soon ? 600 : 400 }}>
                          Due {fmtDate(job.dueDate)}{overdue ? " · overdue" : soon ? " · due soon" : ""}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: appr.color, background: appr.color + "1A", borderRadius: 4, padding: "1px 6px" }}>{appr.icon} {appr.label}</span>
                          {fileCount > 0 && <span style={{ fontSize: 10, color: COLORS.inkSoft }}>📎 {fileCount}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="psbtn" onClick={(e) => { e.stopPropagation(); moveStage(job.id, -1); }} disabled={stage.key === STAGES[0].key} style={navBtnStyle(stage.key === STAGES[0].key)}>←</button>
                            <button className="psbtn" onClick={(e) => { e.stopPropagation(); moveStage(job.id, 1); }} disabled={stage.key === STAGES[STAGES.length - 1].key} style={navBtnStyle(stage.key === STAGES[STAGES.length - 1].key)}>→</button>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: pay.color }}>{pay.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loaded && tab === "dashboard" && (
        <div key="dashboard" className="tab-fade" style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard label="Due this week" value={metrics.dueThisWeek.length} sub="active jobs" delay={0} />
            <StatCard label="Overdue" value={metrics.overdue.length} sub="need attention" color={metrics.overdue.length ? COLORS.rush : COLORS.ink} delay={40} />
            <StatCard label="Rush jobs active" value={metrics.rushActive.length} sub="in the queue" color={COLORS.brass} delay={80} />
            <StatCard label="Awaiting approval" value={metrics.pendingApproval.length} sub="pending client sign-off" color={COLORS.brass} delay={120} />
            <StatCard label="Collected" value={money(metrics.collected)} sub="paid invoices" color={COLORS.success} delay={160} />
            <StatCard label="Outstanding" value={money(metrics.outstanding)} sub="unpaid + invoiced" color={COLORS.press} delay={200} />
            <StatCard label="Low stock" value={metrics.lowStock.length} sub="materials to reorder" color={metrics.lowStock.length ? COLORS.rush : COLORS.ink} delay={240} />
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Jobs by stage</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {metrics.stageCounts.map((s) => (
                <div key={s.key} style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderLeft: `4px solid ${s.swatch}`, borderRadius: 8, padding: "10px 14px", minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>

          {metrics.overdue.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: COLORS.rush }}>Overdue jobs</div>
              <SimpleJobTable jobs={metrics.overdue} onOpen={setDetailJobId} />
            </div>
          )}

          {metrics.lowStock.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: COLORS.rush }}>Low stock materials</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {metrics.lowStock.map((m) => (
                  <div key={m.id} style={{ background: "#fff", border: `1px solid ${COLORS.rush}`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{m.qtyOnHand} {m.unit} on hand · reorder at {m.reorderPoint}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loaded && tab === "invoicing" && (
        <div key="invoicing" className="tab-fade" style={{ padding: 22 }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
            <div><div style={labelStyle}>Collected</div><div style={{ fontSize: 22, fontWeight: 700, color: COLORS.success }}>{money(metrics.collected)}</div></div>
            <div><div style={labelStyle}>Outstanding</div><div style={{ fontSize: 22, fontWeight: 700, color: COLORS.press }}>{money(metrics.outstanding)}</div></div>
          </div>
          <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            <TableHeader cols={["Job #","Customer","Price","Status","Invoice #",""]} />
            {jobs.filter((j) => j.price).length === 0 && <div style={{ padding: 16, fontSize: 13, color: COLORS.inkSoft }}>No priced jobs yet.</div>}
            {jobs.filter((j) => j.price).map((j) => {
              const pay = PAY_STATUSES.find((p) => p.key === j.paymentStatus) || PAY_STATUSES[0];
              return (
                <div key={j.id} className="row" style={rowStyle}>
                  <div style={{ ...cellStyle, fontFamily: "'IBM Plex Mono', monospace" }}>{j.jobNumber}</div>
                  <div style={cellStyle}>{j.customer}</div>
                  <div style={cellStyle}>{money(j.price)}</div>
                  <div style={{ ...cellStyle, color: pay.color, fontWeight: 600 }}>{pay.label}</div>
                  <div style={{ ...cellStyle, fontFamily: "'IBM Plex Mono', monospace" }}>{j.invoiceNumber || "—"}</div>
                  <div style={{ ...cellStyle, display: "flex", gap: 6 }}>
                    {PAY_STATUSES.map((p) => (
                      <button key={p.key} className="psbtn" onClick={() => setPaymentStatus(j.id, p.key)}
                        style={{ fontSize: 11, padding: "3px 7px", borderRadius: 5, border: `1px solid ${p.color}`, background: j.paymentStatus === p.key ? p.color : "#fff", color: j.paymentStatus === p.key ? "#fff" : p.color, cursor: "pointer" }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loaded && tab === "customers" && (
        <div key="customers" className="tab-fade" style={{ padding: 22 }}>
          <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            <TableHeader cols={["Name","Contact","Phone","Email","Jobs",""]} />
            {customers.length === 0 && <div style={{ padding: 16, fontSize: 13, color: COLORS.inkSoft }}>No customers yet — add one, or it'll fill in automatically from new jobs.</div>}
            {customers.map((c) => {
              const jobCount = jobs.filter((j) => j.customer.toLowerCase() === c.name.toLowerCase()).length;
              return (
                <div key={c.id} className="row" style={rowStyle}>
                  <div style={{ ...cellStyle, fontWeight: 600 }}>{c.name}</div>
                  <div style={cellStyle}>{c.contactPerson || "—"}</div>
                  <div style={cellStyle}>{c.phone || "—"}</div>
                  <div style={cellStyle}>{c.email || "—"}</div>
                  <div style={cellStyle}>{jobCount}</div>
                  <div style={{ ...cellStyle, display: "flex", gap: 8 }}>
                    <button onClick={() => openEditCustomer(c)} style={linkBtnStyle}>Edit</button>
                    <button onClick={() => deleteCustomer(c.id)} style={{ ...linkBtnStyle, color: COLORS.rush }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loaded && tab === "suppliers" && (
        <div key="suppliers" className="tab-fade" style={{ padding: 22 }}>
          <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            <TableHeader cols={["Name","Supplies","Contact","Phone","Email",""]} />
            {suppliers.length === 0 && <div style={{ padding: 16, fontSize: 13, color: COLORS.inkSoft }}>No suppliers yet — add your paper, ink, or blank-stock contacts here.</div>}
            {suppliers.map((s) => (
              <div key={s.id} className="row" style={rowStyle}>
                <div style={{ ...cellStyle, fontWeight: 600 }}>{s.name}</div>
                <div style={cellStyle}>{s.supplies || "—"}</div>
                <div style={cellStyle}>{s.contactPerson || "—"}</div>
                <div style={cellStyle}>{s.phone || "—"}</div>
                <div style={cellStyle}>{s.email || "—"}</div>
                <div style={{ ...cellStyle, display: "flex", gap: 8 }}>
                  <button onClick={() => openEditSupplier(s)} style={linkBtnStyle}>Edit</button>
                  <button onClick={() => deleteSupplier(s.id)} style={{ ...linkBtnStyle, color: COLORS.rush }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loaded && tab === "materials" && (
        <div key="materials" className="tab-fade" style={{ padding: 22 }}>
          <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            <TableHeader cols={["Material","Category","On hand","Reorder at",""]} />
            {materials.length === 0 && <div style={{ padding: 16, fontSize: 13, color: COLORS.inkSoft }}>No materials tracked yet.</div>}
            {materials.map((m) => {
              const low = parseFloat(m.qtyOnHand) <= parseFloat(m.reorderPoint || 0);
              return (
                <div key={m.id} className="row" style={rowStyle}>
                  <div style={{ ...cellStyle, fontWeight: 600 }}>{m.name}</div>
                  <div style={cellStyle}>{m.category || "—"}</div>
                  <div style={{ ...cellStyle, color: low ? COLORS.rush : COLORS.ink, fontWeight: low ? 700 : 400 }}>{m.qtyOnHand} {m.unit}</div>
                  <div style={cellStyle}>{m.reorderPoint || "—"} {m.unit}</div>
                  <div style={{ ...cellStyle, display: "flex", gap: 8 }}>
                    <button onClick={() => openEditMaterial(m)} style={linkBtnStyle}>Edit</button>
                    <button onClick={() => deleteMaterial(m.id)} style={{ ...linkBtnStyle, color: COLORS.rush }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job detail */}
      {detailJob && (
        <Overlay onClose={() => setDetailJobId(null)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: COLORS.inkSoft }}>{detailJob.jobNumber}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{detailJob.customer}</div>
            </div>
            {detailJob.rush && <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.rush, border: `1px solid ${COLORS.rush}`, borderRadius: 4, padding: "2px 7px", marginTop: 3 }}>RUSH</div>}
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13.5 }}>
            <DetailField label="Job type" value={detailJob.jobType} />
            <DetailField label="Quantity" value={detailJob.quantity || "—"} />
            <DetailField label="Due date" value={fmtDate(detailJob.dueDate)} />
            <DetailField label="Price" value={detailJob.price ? money(detailJob.price) : "—"} />
            <DetailField label="Stage" value={STAGES.find((s) => s.key === detailJob.stage)?.label} />
            <DetailField label="Payment" value={(PAY_STATUSES.find((p) => p.key === detailJob.paymentStatus) || PAY_STATUSES[0]).label} />
            {detailJob.invoiceNumber && <DetailField label="Invoice #" value={detailJob.invoiceNumber} />}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>Client approval</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {APPROVAL_STATUSES.map((a) => (
                <button key={a.key} className="psbtn" onClick={() => setApprovalStatus(detailJob.id, a.key)}
                  style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 6, border: `1px solid ${a.color}`, background: detailJob.approvalStatus === a.key ? a.color : "#fff", color: detailJob.approvalStatus === a.key ? "#fff" : a.color, cursor: "pointer", fontWeight: 600 }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>

          {detailJob.description && <div style={{ marginTop: 14 }}><div style={labelStyle}>Description</div><div style={{ fontSize: 13.5, marginTop: 3, lineHeight: 1.5 }}>{detailJob.description}</div></div>}
          {detailJob.notes && <div style={{ marginTop: 14 }}><div style={labelStyle}>Notes</div><div style={{ fontSize: 13.5, marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{detailJob.notes}</div></div>}

          <div style={{ marginTop: 16 }}>
            <div style={labelStyle}>Files ({detailFiles.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {detailFiles.map((f) => <FileRow key={f.id} file={f} onDelete={deleteFile} />)}
            </div>
            <div style={{ marginTop: 8 }}>
              <FileDropzone onFiles={(files) => uploadFiles(files, detailJob.id)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            <button className="psbtn" onClick={() => openEditJob(detailJob)} style={primaryBtnStyle}>Edit job</button>
            <button className="psbtn" onClick={() => deleteJob(detailJob.id)} style={{ ...secondaryBtnStyle, color: COLORS.rush, borderColor: COLORS.rush }}>Delete</button>
          </div>
        </Overlay>
      )}

      {/* Job modal */}
      {jobModalOpen && (
        <Overlay onClose={() => setJobModalOpen(false)}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{editingJobId ? "Edit job" : "New job"}</div>
          <FormRow label="Customer">
            <input autoFocus list="customer-list" value={jobDraft.customer} onChange={(e) => setJobDraft({ ...jobDraft, customer: e.target.value })} style={inputStyle} placeholder="Customer or company name" />
            <datalist id="customer-list">{customers.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          </FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormRow label="Job type">
              <select value={jobDraft.jobType} onChange={(e) => setJobDraft({ ...jobDraft, jobType: e.target.value })} style={inputStyle}>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormRow>
            <FormRow label="Quantity">
              <input value={jobDraft.quantity} onChange={(e) => setJobDraft({ ...jobDraft, quantity: e.target.value })} style={inputStyle} placeholder="e.g. 500" />
            </FormRow>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormRow label="Due date">
              <input type="date" value={jobDraft.dueDate} onChange={(e) => setJobDraft({ ...jobDraft, dueDate: e.target.value })} style={inputStyle} />
            </FormRow>
            <FormRow label="Price (₱)">
              <input value={jobDraft.price} onChange={(e) => setJobDraft({ ...jobDraft, price: e.target.value })} style={inputStyle} placeholder="e.g. 2500" />
            </FormRow>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormRow label="Stage">
              <select value={jobDraft.stage} onChange={(e) => setJobDraft({ ...jobDraft, stage: e.target.value })} style={inputStyle}>
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </FormRow>
            <FormRow label="Payment status">
              <select value={jobDraft.paymentStatus} onChange={(e) => setJobDraft({ ...jobDraft, paymentStatus: e.target.value })} style={inputStyle}>
                {PAY_STATUSES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Client approval">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {APPROVAL_STATUSES.map((a) => (
                <button key={a.key} type="button" className="psbtn" onClick={() => setJobDraft({ ...jobDraft, approvalStatus: a.key })}
                  style={{ fontSize: 11.5, padding: "6px 10px", borderRadius: 6, border: `1px solid ${a.color}`, background: jobDraft.approvalStatus === a.key ? a.color : "#fff", color: jobDraft.approvalStatus === a.key ? "#fff" : a.color, cursor: "pointer", fontWeight: 600 }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </FormRow>
          <FormRow label="Description">
            <textarea value={jobDraft.description} onChange={(e) => setJobDraft({ ...jobDraft, description: e.target.value })} style={{ ...inputStyle, minHeight: 56, resize: "vertical" }} placeholder="Stock, size, finish, colors…" />
          </FormRow>
          <FormRow label="Notes">
            <textarea value={jobDraft.notes} onChange={(e) => setJobDraft({ ...jobDraft, notes: e.target.value })} style={{ ...inputStyle, minHeight: 48, resize: "vertical" }} placeholder="Anything else worth flagging" />
          </FormRow>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={jobDraft.rush} onChange={(e) => setJobDraft({ ...jobDraft, rush: e.target.checked })} />
            Mark as rush job
          </label>

          <FormRow label={`Attachments — proofs, references, 3D models (${draftFiles.length})`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {jobFiles.filter((f) => f.jobId === jobDraft.id).map((f) => <FileRow key={f.id} file={f} onDelete={deleteFile} />)}
              {pendingFiles.map((f) => <FileRow key={f.id} file={f} uploading />)}
            </div>
              {editingJobId ? (
              <FileDropzone onFiles={(files) => uploadFiles(files, jobDraft.id)} />
            ) : (
              <div style={{ padding: 12, fontSize: 13, color: COLORS.inkSoft, border: `1px dashed ${COLORS.line}`, borderRadius: 8, textAlign: "center" }}>
                Save this job first, then reopen it to attach files.
              </div>
            )}
          </FormRow>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="psbtn" onClick={saveJobDraft} style={primaryBtnStyle} disabled={!jobDraft.customer.trim() || uploadingCount > 0}>
              {uploadingCount > 0 ? "Uploading…" : editingJobId ? "Save changes" : "Add job"}
            </button>
            <button className="psbtn" onClick={() => setJobModalOpen(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </Overlay>
      )}

      {/* Customer modal */}
      {custModalOpen && (
        <Overlay onClose={() => setCustModalOpen(false)}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{editingCustId ? "Edit customer" : "New customer"}</div>
          <FormRow label="Name"><input autoFocus value={custDraft.name} onChange={(e) => setCustDraft({ ...custDraft, name: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Contact person"><input value={custDraft.contactPerson} onChange={(e) => setCustDraft({ ...custDraft, contactPerson: e.target.value })} style={inputStyle} /></FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormRow label="Phone"><input value={custDraft.phone} onChange={(e) => setCustDraft({ ...custDraft, phone: e.target.value })} style={inputStyle} /></FormRow>
            <FormRow label="Email"><input value={custDraft.email} onChange={(e) => setCustDraft({ ...custDraft, email: e.target.value })} style={inputStyle} /></FormRow>
          </div>
          <FormRow label="Address"><input value={custDraft.address} onChange={(e) => setCustDraft({ ...custDraft, address: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Notes"><textarea value={custDraft.notes} onChange={(e) => setCustDraft({ ...custDraft, notes: e.target.value })} style={{ ...inputStyle, minHeight: 48, resize: "vertical" }} /></FormRow>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="psbtn" onClick={saveCustDraft} style={primaryBtnStyle} disabled={!custDraft.name.trim()}>{editingCustId ? "Save changes" : "Add customer"}</button>
            <button className="psbtn" onClick={() => setCustModalOpen(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </Overlay>
      )}

      {/* Supplier modal */}
      {supModalOpen && (
        <Overlay onClose={() => setSupModalOpen(false)}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{editingSupId ? "Edit supplier" : "New supplier"}</div>
          <FormRow label="Name"><input autoFocus value={supDraft.name} onChange={(e) => setSupDraft({ ...supDraft, name: e.target.value })} style={inputStyle} placeholder="Supplier or company name" /></FormRow>
          <FormRow label="Supplies"><input value={supDraft.supplies} onChange={(e) => setSupDraft({ ...supDraft, supplies: e.target.value })} style={inputStyle} placeholder="e.g. Paper stock, ink, vinyl" /></FormRow>
          <FormRow label="Contact person"><input value={supDraft.contactPerson} onChange={(e) => setSupDraft({ ...supDraft, contactPerson: e.target.value })} style={inputStyle} /></FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormRow label="Phone"><input value={supDraft.phone} onChange={(e) => setSupDraft({ ...supDraft, phone: e.target.value })} style={inputStyle} /></FormRow>
            <FormRow label="Email"><input value={supDraft.email} onChange={(e) => setSupDraft({ ...supDraft, email: e.target.value })} style={inputStyle} /></FormRow>
          </div>
          <FormRow label="Address"><input value={supDraft.address} onChange={(e) => setSupDraft({ ...supDraft, address: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Notes"><textarea value={supDraft.notes} onChange={(e) => setSupDraft({ ...supDraft, notes: e.target.value })} style={{ ...inputStyle, minHeight: 48, resize: "vertical" }} /></FormRow>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="psbtn" onClick={saveSupDraft} style={primaryBtnStyle} disabled={!supDraft.name.trim()}>{editingSupId ? "Save changes" : "Add supplier"}</button>
            <button className="psbtn" onClick={() => setSupModalOpen(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </Overlay>
      )}

      {/* Material modal */}
      {matModalOpen && (
        <Overlay onClose={() => setMatModalOpen(false)}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>{editingMatId ? "Edit material" : "New material"}</div>
          <FormRow label="Name"><input autoFocus value={matDraft.name} onChange={(e) => setMatDraft({ ...matDraft, name: e.target.value })} style={inputStyle} placeholder="e.g. 100lb gloss cover" /></FormRow>
          <FormRow label="Category"><input value={matDraft.category} onChange={(e) => setMatDraft({ ...matDraft, category: e.target.value })} style={inputStyle} placeholder="e.g. Paper stock" /></FormRow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <FormRow label="On hand"><input value={matDraft.qtyOnHand} onChange={(e) => setMatDraft({ ...matDraft, qtyOnHand: e.target.value })} style={inputStyle} /></FormRow>
            <FormRow label="Unit">
              <select value={matDraft.unit} onChange={(e) => setMatDraft({ ...matDraft, unit: e.target.value })} style={inputStyle}>
                {MATERIAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </FormRow>
            <FormRow label="Reorder at"><input value={matDraft.reorderPoint} onChange={(e) => setMatDraft({ ...matDraft, reorderPoint: e.target.value })} style={inputStyle} /></FormRow>
          </div>
          <FormRow label="Notes"><textarea value={matDraft.notes} onChange={(e) => setMatDraft({ ...matDraft, notes: e.target.value })} style={{ ...inputStyle, minHeight: 48, resize: "vertical" }} /></FormRow>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="psbtn" onClick={saveMatDraft} style={primaryBtnStyle} disabled={!matDraft.name.trim()}>{editingMatId ? "Save changes" : "Add material"}</button>
            <button className="psbtn" onClick={() => setMatModalOpen(false)} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      input:focus, textarea:focus, select:focus { border-color: ${COLORS.press} !important; box-shadow: 0 0 0 3px rgba(30,78,140,0.12); }
      .psbtn { transition: transform .08s ease, box-shadow .08s ease, opacity .15s ease; }
      .psbtn:hover { transform: translateY(-1px); }
      .psbtn:active { transform: translateY(1px) scale(0.98); }
      .psbtn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .job-card { transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease; }
      .job-card:hover { box-shadow: 0 8px 20px rgba(18,42,78,0.15); border-color: ${COLORS.press}; transform: translateY(-2px); }
      .row:hover { background: ${COLORS.paperDark}; }
      .stage-col::-webkit-scrollbar { width: 6px; }
      .stage-col::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 3px; }
      .board::-webkit-scrollbar { height: 8px; }
      .board::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 4px; }
      .tabbtn { border: none; background: none; padding: 9px 13px; font-size: 13.5px; font-weight: 600; cursor: pointer; color: ${COLORS.inkSoft}; border-bottom: 2px solid transparent; transition: color .15s ease, border-color .15s ease; }
      .tabbtn:hover { color: ${COLORS.ink}; }
      .tabbtn.active { color: ${COLORS.ink}; border-bottom: 2px solid ${COLORS.gold}; }
      input, textarea, select { font-family: inherit; }
      .header-gradient { background: linear-gradient(120deg, ${COLORS.paper} 0%, #EFF3FA 45%, ${COLORS.paper} 100%); background-size: 200% 200%; animation: gradientShift 12s ease infinite; }
      @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
      @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(47,143,91,0.5); } 50% { box-shadow: 0 0 0 5px rgba(47,143,91,0); } }
      .rush-pulse { animation: rushPulse 1.6s ease-in-out infinite; }
      @keyframes rushPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      .fade-up { animation: fadeUp .35s ease both; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .tab-fade { animation: tabFade .25s ease both; }
      @keyframes tabFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes toastIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
      .overlay-bg { animation: overlayIn .15s ease both; }
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      .overlay-card { animation: cardIn .22s cubic-bezier(.34,1.56,.64,1) both; }
      @keyframes cardIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      .spinner { width: 14px; height: 14px; border: 2px solid ${COLORS.line}; border-top-color: ${COLORS.press}; border-radius: 50%; animation: spin .7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  );
}

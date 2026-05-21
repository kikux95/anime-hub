import { useState, useEffect, useRef } from "react";

// ── UTILITAIRES ───────────────────────────────────────────────────────────────
function sanitize(str: string): string {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
}
function genId(): string { return crypto.randomUUID(); }
function clampInt(val: number, min: number, max: number): number {
  const n = Math.floor(Number(val));
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch { return []; }
}
function loadStrList(key: string, defaults: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    return parsed as string[];
  } catch { return defaults; }
}

const MAX_ITEMS = 100;
const MAX_SHORT = 80;
const MAX_LONG = 500;
const MAX_EPISODES = 9999;

// ── CONSTANTES (defaults) ─────────────────────────────────────────────────────
const SECTIONS = ["Cartes Perso","Arsenal","Dino Codex","Mes Animes","Créateur","Music"];
const DEFAULT_ANIME_THEMES = ["Naruto","One Piece","Dragon Ball","Demon Slayer","Jujutsu Kaisen","Bleach","Attack on Titan","My Hero Academia","Hunter x Hunter","Fullmetal Alchemist","Sword Art Online","Tokyo Ghoul","Death Note","Fairy Tail"];
const DEFAULT_WEAPON_TYPES = ["Épée","Lance","Arc","Bâton","Masse","Dague","Hache","Marteau","Katana"];
const DEFAULT_POWER_TYPES: string[] = []; // entièrement personnalisé par l'user
const RANKS = ["D","C","B","A","S","SS","Légendaire"];
const DINO_DIET = ["Carnivore","Herbivore","Omnivore"];
const DINO_ERAS = ["Trias","Jurassique","Crétacé"];
const ANIME_STATUS = ["Terminé","En cours","Abandonné","À voir"];

const rankColor: Record<string,string> = { D:"#6b7280",C:"#22c55e",B:"#3b82f6",A:"#f59e0b",S:"#ef4444",SS:"#ec4899","Légendaire":"#a855f7" };
const statusColor: Record<string,string> = { "Terminé":"#22c55e","En cours":"#3b82f6","Abandonné":"#ef4444","À voir":"#f59e0b" };

// ── COMPOSANT : sélecteur + créateur de tag personnalisé ──────────────────────
// Utilisé pour Anime/Thème, Type d'arme, Types de pouvoir
interface TagPickerProps {
  label: string;
  value: string;          // valeur sélectionnée (pour les sections 1 & 2)
  onSelect: (v: string) => void;
  tags: string[];         // liste des tags disponibles (state parent)
  onTagsChange: (t: string[]) => void;
  storageKey: string;
  color?: string;
  placeholder?: string;
  multiSelect?: boolean;              // mode multi-select (section créateur)
  selected?: string[];                // pour mode multi
  onMultiToggle?: (t: string) => void;
}

function TagPicker({ label, value, onSelect, tags, onTagsChange, storageKey, color="#a78bfa", placeholder="ex: Mon anime...", multiSelect=false, selected=[], onMultiToggle }: TagPickerProps) {
  const [newTag, setNewTag] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const addTag = () => {
    const trimmed = newTag.trim().slice(0, MAX_SHORT);
    if (!trimmed || tags.includes(trimmed)) { setNewTag(""); setShowAdd(false); return; }
    const updated = [...tags, trimmed];
    onTagsChange(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    if (!multiSelect) onSelect(trimmed);
    setNewTag(""); setShowAdd(false);
  };

  const removeTag = (t: string) => {
    const updated = tags.filter(x => x !== t);
    onTagsChange(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    if (value === t) onSelect("");
  };

  const inputStyle: React.CSSProperties = { background:"#ffffff0f", border:"1px solid #ffffff25", borderRadius:8, padding:"8px 12px", color:"#eee", fontSize:14, flex:1 };

  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, color:"#aaa", display:"block", marginBottom:6 }}>{label}</label>

      {/* Mode select classique pour sections 1 & 2 */}
      {!multiSelect && (
        <select value={value} onChange={e=>onSelect(e.target.value)} style={{ ...inputStyle, width:"100%", boxSizing:"border-box", background:"#1a1a2e", color:"#eee" }}>
          <option value="" style={{ background:"#1a1a2e", color:"#eee" }}>-- Choisir --</option>
          {tags.map(t=><option key={t} value={t} style={{ background:"#1a1a2e", color:"#eee" }}>{t}</option>)}
        </select>
      )}

      {/* Mode multi-tag pour créateur */}
      {multiSelect && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
          {tags.length === 0 && <span style={{ color:"#555", fontSize:13, fontStyle:"italic" }}>Crée tes types de pouvoir ci-dessous ↓</span>}
          {tags.map(t=>(
            <button key={t} onClick={()=>onMultiToggle?.(t)} style={{ background:selected.includes(t)?color+"33":"#ffffff10", border:`1px solid ${selected.includes(t)?color:"#ffffff20"}`, borderRadius:20, padding:"4px 12px", color:selected.includes(t)?color:"#ccc", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
              {t}
              <span onClick={e=>{e.stopPropagation();removeTag(t);}} style={{ color:"#ef4444", fontSize:10, fontWeight:700, marginLeft:2 }}>✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Zone d'ajout */}
      {showAdd ? (
        <div style={{ display:"flex", gap:6, marginTop:6 }}>
          <input
            value={newTag}
            onChange={e=>setNewTag(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addTag()}
            placeholder={placeholder}
            maxLength={MAX_SHORT}
            autoFocus
            style={{ ...inputStyle, flex:1 }}
          />
          <button onClick={addTag} style={{ background:color, border:"none", borderRadius:8, color:"#fff", padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>✓</button>
          <button onClick={()=>{setShowAdd(false);setNewTag("");}} style={{ background:"#ffffff15", border:"none", borderRadius:8, color:"#aaa", padding:"8px 12px", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>
      ) : (
        <button onClick={()=>setShowAdd(true)} style={{ background:"#ffffff08", border:`1px dashed ${color}55`, borderRadius:8, color:color, padding:"6px 14px", cursor:"pointer", fontSize:12, marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16, fontWeight:700 }}>+</span> {multiSelect?"Créer un type de pouvoir":"Créer un anime / thème"}
        </button>
      )}

      {/* Gestion des tags existants (non-multi) : bouton supprimer depuis liste */}
      {!multiSelect && tags.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
          {tags.map(t=>(
            <span key={t} style={{ background:"#ffffff08", border:"1px solid #ffffff15", borderRadius:20, padding:"2px 10px", fontSize:11, color:"#888", display:"flex", alignItems:"center", gap:4 }}>
              {t}
              <button onClick={()=>removeTag(t)} style={{ background:"none", border:"none", color:"#ef444488", cursor:"pointer", fontSize:10, padding:0 }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── COMPOSANT : sélecteur de type d'arme avec ajout ──────────────────────────
function WeaponTypePicker({ value, onChange, types, onTypesChange }: { value:string; onChange:(v:string)=>void; types:string[]; onTypesChange:(t:string[])=>void }) {
  const [newType, setNewType] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const style: React.CSSProperties = { background:"#ffffff0f", border:"1px solid #ffffff25", borderRadius:8, padding:"8px 12px", color:"#eee", fontSize:14, boxSizing:"border-box" };

  const addType = () => {
    const trimmed = newType.trim().slice(0, MAX_SHORT);
    if (!trimmed || types.includes(trimmed)) { setNewType(""); setShowAdd(false); return; }
    const updated = [...types, trimmed];
    onTypesChange(updated);
    localStorage.setItem("weapon_types", JSON.stringify(updated));
    onChange(trimmed);
    setNewType(""); setShowAdd(false);
  };

  const removeType = (t: string) => {
    const updated = types.filter(x => x !== t);
    onTypesChange(updated);
    localStorage.setItem("weapon_types", JSON.stringify(updated));
    if (value === t) onChange("");
  };

  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, color:"#aaa", display:"block", marginBottom:4 }}>Type</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...style, width:"100%", background:"#1a1a2e", color:"#eee" }}>
        <option value="" style={{ background:"#1a1a2e", color:"#eee" }}>-- Choisir --</option>
        {types.map(t=><option key={t} value={t} style={{ background:"#1a1a2e", color:"#eee" }}>{t}</option>)}
      </select>
      {showAdd ? (
        <div style={{ display:"flex", gap:6, marginTop:6 }}>
          <input value={newType} onChange={e=>setNewType(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addType()} placeholder="ex: Chakram, Fouet..." maxLength={MAX_SHORT} autoFocus style={{ ...style, flex:1 }} />
          <button onClick={addType} style={{ background:"#b45309", border:"none", borderRadius:8, color:"#fff", padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:700 }}>✓</button>
          <button onClick={()=>{setShowAdd(false);setNewType("");}} style={{ background:"#ffffff15", border:"none", borderRadius:8, color:"#aaa", padding:"8px 12px", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>
      ) : (
        <button onClick={()=>setShowAdd(true)} style={{ background:"#ffffff08", border:"1px dashed #f59e0b55", borderRadius:8, color:"#f59e0b", padding:"6px 14px", cursor:"pointer", fontSize:12, marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16, fontWeight:700 }}>+</span> Créer un type d'arme
        </button>
      )}
      {types.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
          {types.map(t=>(
            <span key={t} style={{ background:"#ffffff08", border:"1px solid #ffffff15", borderRadius:20, padding:"2px 10px", fontSize:11, color:"#888", display:"flex", alignItems:"center", gap:4 }}>
              {t}
              <button onClick={()=>removeType(t)} style={{ background:"none", border:"none", color:"#ef444488", cursor:"pointer", fontSize:10, padding:0 }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── IMAGE UPLOAD HELPER ───────────────────────────────────────────────────────
function ImageUploader({ value, onChange, label="Image (optionnel)" }: { value: string; onChange: (v: string) => void; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"file"|"url">("file");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Image trop grande (max 10 Mo)"); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUrl = () => {
    if (urlInput.match(/^https?:\/\/.+/)) { onChange(urlInput); setUrlInput(""); }
    else alert("URL invalide");
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: "#aaa", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button onClick={()=>setMode("file")} style={{ background: mode==="file"?"#7c3aed33":"#ffffff10", border:`1px solid ${mode==="file"?"#7c3aed":"#ffffff20"}`, borderRadius: 6, padding: "4px 12px", color: mode==="file"?"#a78bfa":"#aaa", cursor:"pointer", fontSize:12 }}>📁 Fichier</button>
        <button onClick={()=>setMode("url")} style={{ background: mode==="url"?"#7c3aed33":"#ffffff10", border:`1px solid ${mode==="url"?"#7c3aed":"#ffffff20"}`, borderRadius: 6, padding: "4px 12px", color: mode==="url"?"#a78bfa":"#aaa", cursor:"pointer", fontSize:12 }}>🔗 URL</button>
      </div>
      {mode==="file" ? (
        <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #ffffff25", borderRadius: 8, padding: "16px", textAlign:"center", cursor:"pointer", background:"#ffffff05" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
          <div style={{ fontSize: 12, color: "#888" }}>Cliquer pour choisir une image</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
        </div>
      ) : (
        <div style={{ display:"flex", gap:6 }}>
          <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="https://..." style={{ flex:1, background:"#ffffff0f", border:"1px solid #ffffff20", borderRadius:8, padding:"8px 12px", color:"#eee", fontSize:13 }} />
          <button onClick={handleUrl} style={{ background:"#7c3aed", border:"none", borderRadius:8, color:"#fff", padding:"8px 14px", cursor:"pointer", fontSize:13 }}>OK</button>
        </div>
      )}
      {value && (
        <div style={{ marginTop: 8, position:"relative", display:"inline-block" }}>
          <img src={value} alt="preview" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid #ffffff20" }} />
          <button onClick={()=>onChange("")} style={{ position:"absolute", top:-6, right:-6, background:"#ef4444", border:"none", borderRadius:"50%", color:"#fff", width:18, height:18, cursor:"pointer", fontSize:11, lineHeight:"18px", textAlign:"center" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── COMPOSANTS UI ─────────────────────────────────────────────────────────────
function Badge({ text, color="#a78bfa" }: { text: string; color?: string }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}55`, borderRadius:6, padding:"2px 10px", fontSize:12, fontWeight:600 }}>{sanitize(text)}</span>;
}

function StatBar({ label, value, max=10, color="#a78bfa" }: { label:string; value:number; max?:number; color?:string }) {
  const safeValue = clampInt(value, 0, max);
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#bbb", marginBottom:2 }}>
        <span>{sanitize(label)}</span><span style={{ color }}>{safeValue}/{max}</span>
      </div>
      <div style={{ background:"#ffffff15", borderRadius:4, height:6 }}>
        <div style={{ width:`${(safeValue/max)*100}%`, background:color, borderRadius:4, height:6, transition:"width 0.4s" }} />
      </div>
    </div>
  );
}

interface InputProps { label?:string; value:string|number; onChange:(v:string)=>void; type?:string; options?:string[]; placeholder?:string; maxLen?:number; }
function Input({ label, value, onChange, type="text", options, placeholder, maxLen=MAX_SHORT }: InputProps) {
  const style: React.CSSProperties = { width:"100%", background:"#ffffff0f", border:"1px solid #ffffff25", borderRadius:8, padding:"8px 12px", color:"#eee", fontSize:14, boxSizing:"border-box" };
  const handleChange = (raw:string) => onChange(raw.slice(0, maxLen));
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ fontSize:12, color:"#aaa", display:"block", marginBottom:4 }}>{label}</label>}
      {options ? (
        <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...style, background:"#1a1a2e", color:"#eee" }}>
          <option value="" style={{ background:"#1a1a2e", color:"#eee" }}>-- Choisir --</option>
          {options.map(o=><option key={o} value={o} style={{ background:"#1a1a2e", color:"#eee" }}>{o}</option>)}
        </select>
      ) : type==="textarea" ? (
        <textarea value={value} onChange={e=>handleChange(e.target.value)} placeholder={placeholder} rows={3} maxLength={MAX_LONG} style={{ ...style, resize:"vertical" }} />
      ) : type==="number" ? (
        <input type="number" value={value} min={0} max={MAX_EPISODES} onChange={e=>{const n=clampInt(Number(e.target.value),0,MAX_EPISODES);onChange(String(n));}} placeholder={placeholder} style={style} />
      ) : (
        <input type={type} value={value} onChange={e=>handleChange(e.target.value)} placeholder={placeholder} maxLength={maxLen} style={style} />
      )}
      {type==="textarea" && <div style={{ fontSize:11, color:"#555", textAlign:"right", marginTop:2 }}>{String(value).length}/{MAX_LONG}</div>}
    </div>
  );
}

function Btn({ children, onClick, color="#7c3aed", small }: { children:React.ReactNode; onClick:()=>void; color?:string; small?:boolean }) {
  return <button onClick={onClick} style={{ background:color, border:"none", borderRadius:8, color:"#fff", padding:small?"6px 14px":"9px 20px", fontSize:small?13:14, fontWeight:600, cursor:"pointer" }}>{children}</button>;
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return <div style={{ background:"#ffffff08", border:"1px solid #ffffff15", borderRadius:12, padding:"1rem 1.25rem", ...style }}>{children}</div>;
}

function DeleteBtn({ onConfirm }: { onConfirm:()=>void }) {
  const [asking, setAsking] = useState(false);
  if (asking) return (
    <span style={{ display:"inline-flex", gap:6, alignItems:"center" }}>
      <button onClick={()=>{onConfirm();setAsking(false);}} style={{ background:"#ef4444", border:"none", borderRadius:6, color:"#fff", cursor:"pointer", fontSize:12, padding:"3px 8px", fontWeight:700 }}>✓</button>
      <button onClick={()=>setAsking(false)} style={{ background:"#ffffff20", border:"none", borderRadius:6, color:"#aaa", cursor:"pointer", fontSize:12, padding:"3px 8px" }}>✗</button>
    </span>
  );
  return <button onClick={()=>setAsking(true)} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:18 }} title="Supprimer">🗑</button>;
}

function SearchBar({ value, onChange, placeholder="Rechercher..." }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  return (
    <div style={{ position:"relative", marginBottom:14 }}>
      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#666", fontSize:14 }}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%", background:"#ffffff0a", border:"1px solid #ffffff20", borderRadius:10, padding:"9px 12px 9px 36px", color:"#eee", fontSize:14, boxSizing:"border-box" }} />
      {value && <button onClick={()=>onChange("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:16 }}>✕</button>}
    </div>
  );
}

// ── MODAL DETAIL ──────────────────────────────────────────────────────────────
interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  image?: string;
  imagePlaceholder?: string;
  accentColor?: string;
  children: React.ReactNode;
}

function DetailModal({ open, onClose, title, subtitle, image, imagePlaceholder = "🎴", accentColor = "#a78bfa", children }: DetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", boxSizing: "border-box",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #13101f 0%, #0a0814 100%)",
          border: `1.5px solid ${accentColor}55`,
          borderRadius: 18, maxWidth: 560, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: `0 0 60px ${accentColor}33`,
          position: "relative",
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            background: "#ffffff18", border: "none", borderRadius: "50%",
            color: "#eee", width: 32, height: 32, cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>

        {/* Image grande */}
        <div style={{
          width: "100%",
          background: image ? "#000" : `${accentColor}15`,
          position: "relative", borderRadius: "16px 16px 0 0", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {image
            ? <img src={image} alt={title} style={{ width: "100%", display: "block", objectFit: "cover" }} />
            : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 110, fontSize: 64 }}>{imagePlaceholder}</div>}
          {/* Dégradé subtil en bas uniquement si image */}
          {image && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, #13101f)" }} />}
        </div>

        {/* Titre sous l'image */}
        <div style={{ padding: "14px 20px 0", borderBottom: `1px solid ${accentColor}22`, paddingBottom: 12, marginBottom: 2 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: accentColor, marginTop: 3 }}>{subtitle}</div>}
        </div>

        {/* Contenu */}
        <div style={{ padding: "14px 20px 20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── SECTION 1 : Cartes Personnages ────────────────────────────────────────────
interface Carte {
  id: string; nom: string; anime: string; rang: string; affiliation: string;
  pouvoir: string; force: number; vitesse: number; endurance: number;
  intelligence: number; chakra: number; image: string;
}

function CartePerso() {
  const emptyForm = { nom:"", anime:"", rang:"", affiliation:"", pouvoir:"", force:5, vitesse:5, endurance:5, intelligence:5, chakra:5, image:"" };
  const [form, setForm] = useState(emptyForm);
  const [cartes, setCartes] = useState<Carte[]>(()=>loadFromStorage<Carte>("cartes"));
  const [animeThemes, setAnimeThemes] = useState<string[]>(()=>loadStrList("anime_themes", DEFAULT_ANIME_THEMES));
  const [view, setView] = useState<"list"|"new"|"edit">("list");
  const [editId, setEditId] = useState<string|null>(null);
  const [animeFilter, setAnimeFilter] = useState<string>("Tout");
  const [modalCarte, setModalCarte] = useState<Carte|null>(null);

  useEffect(()=>{ localStorage.setItem("cartes", JSON.stringify(cartes)); }, [cartes]);

  const set = (k: string) => (v: string) => setForm(f=>({ ...f, [k]:v }));

  const save = () => {
    if (!form.nom.trim() || !form.anime) return;
    if (!editId && cartes.length >= MAX_ITEMS) { alert(`Limite de ${MAX_ITEMS} cartes atteinte !`); return; }
    const data: Carte = {
      ...form, id: editId || genId(),
      nom: sanitize(form.nom.trim()), affiliation: sanitize(form.affiliation.trim()),
      pouvoir: sanitize(form.pouvoir.trim()),
      force: clampInt(form.force,1,10), vitesse: clampInt(form.vitesse,1,10),
      endurance: clampInt(form.endurance,1,10), intelligence: clampInt(form.intelligence,1,10),
      chakra: clampInt(form.chakra,1,10),
    };
    if (editId) setCartes(cs=>cs.map(c=>c.id===editId?data:c));
    else setCartes(c=>[data,...c]);
    setForm(emptyForm); setEditId(null); setView("list");
  };

  const startEdit = (c: Carte) => { setForm({ nom:c.nom, anime:c.anime, rang:c.rang, affiliation:c.affiliation, pouvoir:c.pouvoir, force:c.force, vitesse:c.vitesse, endurance:c.endurance, intelligence:c.intelligence, chakra:c.chakra, image:c.image||"" }); setEditId(c.id); setView("edit"); };

  // Animes présents dans les cartes existantes
  const usedAnimes = Array.from(new Set(cartes.map(c=>c.anime).filter(Boolean)));
  const filtered = animeFilter === "Tout" ? cartes : cartes.filter(c => c.anime === animeFilter);

  // Couleurs cycliques pour les pills
  const pillColors = ["#f97316","#ef4444","#eab308","#a855f7","#eab308","#3b82f6","#6366f1","#22c55e"];
  const getPillColor = (anime: string) => {
    const idx = usedAnimes.indexOf(anime);
    return pillColors[idx % pillColors.length];
  };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <Btn onClick={()=>{setView("list");setEditId(null);}} color={view==="list"?"#7c3aed":"#ffffff20"}>Mes cartes ({cartes.length})</Btn>
        <Btn onClick={()=>{setView("new");setForm(emptyForm);setEditId(null);}} color={view==="new"?"#7c3aed":"#ffffff20"}>+ Nouvelle carte</Btn>
      </div>

      {(view==="new"||view==="edit") && (
        <Card>
          <h3 style={{ color:"#a78bfa", marginTop:0 }}>{view==="edit"?"✏️ Modifier la carte":"Créer une carte"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <div>
              <Input label="Nom du personnage" value={form.nom} onChange={set("nom")} placeholder="ex: Naruto Uzumaki" maxLen={MAX_SHORT} />
              {/* Sélecteur anime avec création libre */}
              <TagPicker
                label="Anime / Thème"
                value={form.anime}
                onSelect={v=>setForm(f=>({...f,anime:v}))}
                tags={animeThemes}
                onTagsChange={setAnimeThemes}
                storageKey="anime_themes"
                color="#a78bfa"
                placeholder="ex: Bleach, Solo Leveling..."
              />
              <Input label="Rang" value={form.rang} onChange={set("rang")} options={RANKS} />
              <Input label="Affiliation" value={form.affiliation} onChange={set("affiliation")} placeholder="ex: Konoha" maxLen={MAX_SHORT} />
              <Input label="Pouvoir principal" value={form.pouvoir} onChange={set("pouvoir")} placeholder="ex: Rasengan, Kyubi..." maxLen={MAX_SHORT} />
            </div>
            <div>
              <ImageUploader value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} />
              <h4 style={{ color:"#aaa", margin:"8px 0 10px" }}>Stats (1–10)</h4>
              {(["force","vitesse","endurance","intelligence","chakra"] as const).map(s=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                  <span style={{ width:90, fontSize:13, color:"#ccc", textTransform:"capitalize" }}>{s}</span>
                  <input type="range" min={1} max={10} value={form[s]} onChange={e=>setForm(f=>({...f,[s]:clampInt(+e.target.value,1,10)}))} style={{ flex:1 }} />
                  <span style={{ width:20, fontSize:13, color:"#a78bfa", fontWeight:700 }}>{form[s]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <Btn onClick={save}>{view==="edit"?"💾 Sauvegarder":"Créer la carte"}</Btn>
            <Btn onClick={()=>{setView("list");setEditId(null);setForm(emptyForm);}} color="#ffffff20">Annuler</Btn>
          </div>
        </Card>
      )}

      {view==="list" && (
        <>
          {/* Pills de filtre par anime */}
          {cartes.length > 0 && usedAnimes.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 0", borderBottom:"1px solid #ffffff10" }}>
              <button
                onClick={()=>setAnimeFilter("Tout")}
                style={{
                  background: animeFilter==="Tout" ? "transparent" : "#ffffff08",
                  border: animeFilter==="Tout" ? "1.5px solid #a78bfa" : "1px solid #ffffff20",
                  borderRadius: 20, padding: "5px 14px",
                  color: animeFilter==="Tout" ? "#a78bfa" : "#888",
                  cursor: "pointer", fontSize: 13,
                  fontWeight: animeFilter==="Tout" ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 6, outline: "none",
                }}
              >
                {animeFilter==="Tout" && <span style={{ width:8, height:8, borderRadius:"50%", background:"#a78bfa", display:"inline-block" }} />}
                Tout
              </button>
              {usedAnimes.map(anime => {
                const col = getPillColor(anime);
                const active = animeFilter === anime;
                return (
                  <button key={anime} onClick={()=>setAnimeFilter(anime)}
                    style={{
                      background: active ? col+"22" : "#ffffff08",
                      border: active ? `1.5px solid ${col}` : "1px solid #ffffff20",
                      borderRadius: 20, padding: "5px 14px",
                      color: active ? col : "#888",
                      cursor: "pointer", fontSize: 13,
                      fontWeight: active ? 700 : 400,
                      display: "flex", alignItems: "center", gap: 6, outline: "none",
                    }}
                  >
                    <span style={{ width:8, height:8, borderRadius:"50%", background:col, display:"inline-block", opacity: active ? 1 : 0.5 }} />
                    {anime}
                  </button>
                );
              })}
              <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center", fontSize:12, color:"#555", flexWrap:"wrap" }}>
                <span><span style={{ color:"#a78bfa", fontWeight:700 }}>{filtered.length}</span> cartes</span>
                <span><span style={{ color:"#f59e0b", fontWeight:700 }}>{filtered.filter(c=>c.rang==="Légendaire").length}</span> légendaires</span>
                <span><span style={{ color:"#888", fontWeight:700 }}>{usedAnimes.length}</span> thèmes</span>
              </div>
            </div>
          )}
          {filtered.length===0
            ? <p style={{ color:"#666", textAlign:"center", marginTop:40 }}>{animeFilter!=="Tout"?`Aucune carte pour "${animeFilter}".`:"Aucune carte créée. Crée ta première carte !"}</p>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:14 }}>
                {filtered.map(c=>{
                  const rc = rankColor[c.rang]||"#7c3aed";
                  return (
                    <div key={c.id} style={{ background:`linear-gradient(160deg, #1a1040 0%, #0c0820 100%)`, border:`1.5px solid ${rc}55`, borderRadius:14, padding:"0", position:"relative", overflow:"hidden" }}>
                      <div style={{ height:110, background:c.image?"none":`${rc}11`, position:"relative", overflow:"hidden" }}>
                        {c.image
                          ? <img src={c.image} alt={c.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:40 }}>⚡</div>}
                        <div style={{ position:"absolute", top:8, right:8 }}><Badge text={c.rang||"?"} color={rc} /></div>
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:30, background:"linear-gradient(transparent,#0c0820)" }} />
                      </div>
                      <div style={{ padding:"10px 12px" }}>
                        <div style={{ fontWeight:700, fontSize:15, color:"#fff", marginBottom:2 }}>{c.nom}</div>
                        <div style={{ fontSize:12, color:"#a78bfa", marginBottom:2 }}>{c.anime}</div>
                        <div style={{ fontSize:11, color:"#888", marginBottom:8 }}>{c.affiliation}</div>
                        {(["force","vitesse","endurance","intelligence","chakra"] as const).map(s=>(
                          <StatBar key={s} label={s} value={c[s]} color={rc} />
                        ))}
                        {c.pouvoir && <div style={{ marginTop:6, fontSize:12, color:"#fbbf24", fontStyle:"italic" }}>✨ {c.pouvoir}</div>}
                        <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
                          <button onClick={()=>setModalCarte(c)} style={{ background:"none", border:"none", color:"#a78bfa", cursor:"pointer", fontSize:16 }} title="Agrandir">🔍</button>
                          <button onClick={()=>startEdit(c)} style={{ background:"none", border:"none", color:"#a78bfa", cursor:"pointer", fontSize:16 }} title="Modifier">✏️</button>
                          <DeleteBtn onConfirm={()=>setCartes(cs=>cs.filter(x=>x.id!==c.id))} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>}
        </>
      )}

      {/* Modal détail carte */}
      {modalCarte && (() => {
        const rc = rankColor[modalCarte.rang]||"#7c3aed";
        return (
          <DetailModal
            open={true}
            onClose={()=>setModalCarte(null)}
            title={modalCarte.nom}
            subtitle={`${modalCarte.anime} · ${modalCarte.affiliation||"Affiliation inconnue"}`}
            image={modalCarte.image}
            imagePlaceholder="⚡"
            accentColor={rc}
          >
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              <Badge text={modalCarte.rang||"?"} color={rc} />
              {modalCarte.anime && <Badge text={modalCarte.anime} color="#a78bfa" />}
            </div>
            {modalCarte.pouvoir && <div style={{ background:"#fbbf2415", border:"1px solid #fbbf2440", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>✨ Pouvoir</div>
              <div style={{ fontSize:14, color:"#fbbf24" }}>{modalCarte.pouvoir}</div>
            </div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 20px" }}>
              {(["force","vitesse","endurance","intelligence","chakra"] as const).map(s=>(
                <StatBar key={s} label={s.charAt(0).toUpperCase()+s.slice(1)} value={modalCarte[s]} color={rc} />
              ))}
            </div>
          </DetailModal>
        );
      })()}
    </div>
  );
}

// ── SECTION 2 : Arsenal ───────────────────────────────────────────────────────
interface Arme {
  id: string; nom: string; type: string; origine: string; proprio: string;
  effet: string; puissance: number; image: string;
}

function Arsenal() {
  const emptyForm = { nom:"", type:"", origine:"", proprio:"", effet:"", puissance:7, image:"" };
  const [form, setForm] = useState(emptyForm);
  const [armes, setArmes] = useState<Arme[]>(()=>loadFromStorage<Arme>("armes"));
  const [weaponTypes, setWeaponTypes] = useState<string[]>(()=>loadStrList("weapon_types", DEFAULT_WEAPON_TYPES));
  const [view, setView] = useState<"list"|"new"|"edit">("list");
  const [editId, setEditId] = useState<string|null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("Tout");
  const [modalArme, setModalArme] = useState<Arme|null>(null);

  useEffect(()=>{ localStorage.setItem("armes", JSON.stringify(armes)); }, [armes]);

  const set = (k:string)=>(v:string)=>setForm(f=>({...f,[k]:v}));

  const save = () => {
    if (!form.nom.trim()) return;
    if (!editId && armes.length>=MAX_ITEMS) { alert(`Limite de ${MAX_ITEMS} armes atteinte !`); return; }
    const data: Arme = { ...form, id:editId||genId(), nom:sanitize(form.nom.trim()), origine:sanitize(form.origine.trim()), proprio:sanitize(form.proprio.trim()), effet:sanitize(form.effet.trim()), puissance:clampInt(form.puissance,1,10) };
    if (editId) setArmes(as=>as.map(a=>a.id===editId?data:a));
    else setArmes(a=>[data,...a]);
    setForm(emptyForm); setEditId(null); setView("list");
  };

  const startEdit = (a: Arme) => { setForm({ nom:a.nom, type:a.type, origine:a.origine, proprio:a.proprio, effet:a.effet, puissance:a.puissance, image:a.image||"" }); setEditId(a.id); setView("edit"); };

  const usedTypes = Array.from(new Set(armes.map(a=>a.type).filter(Boolean)));
  const filtered = typeFilter === "Tout" ? armes : armes.filter(a => a.type === typeFilter);
  const typeColors: Record<string,string> = { "Épée":"#f59e0b","Lance":"#ef4444","Arc":"#22c55e","Bâton":"#a855f7","Masse":"#f97316","Dague":"#ec4899","Hache":"#ef4444","Marteau":"#6366f1","Katana":"#f59e0b" };
  const getTypeColor = (t: string) => typeColors[t] || "#64748b";

  const getIcon = (t: string) => {
    const icons: Record<string,string> = { "Épée":"⚔️","Lance":"🗡️","Arc":"🏹","Bâton":"🪄","Masse":"🔨","Dague":"🗡️","Hache":"🪓","Marteau":"🔨","Katana":"⚔️" };
    return icons[t] || "💠";
  };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <Btn onClick={()=>{setView("list");setEditId(null);}} color={view==="list"?"#b45309":"#ffffff20"}>Arsenal ({armes.length})</Btn>
        <Btn onClick={()=>{setView("new");setForm(emptyForm);setEditId(null);}} color={view==="new"?"#b45309":"#ffffff20"}>+ Ajouter arme</Btn>
      </div>
      {(view==="new"||view==="edit") && (
        <Card>
          <h3 style={{ color:"#f59e0b", marginTop:0 }}>{view==="edit"?"✏️ Modifier l'arme":"Nouvelle arme légendaire"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <div>
              <Input label="Nom de l'arme" value={form.nom} onChange={set("nom")} placeholder="ex: Excalibur, Zangetsu..." maxLen={MAX_SHORT} />
              {/* Type d'arme avec création */}
              <WeaponTypePicker
                value={form.type}
                onChange={v=>setForm(f=>({...f,type:v}))}
                types={weaponTypes}
                onTypesChange={setWeaponTypes}
              />
              <Input label="Anime / Origine" value={form.origine} onChange={set("origine")} placeholder="ex: Bleach" maxLen={MAX_SHORT} />
              <Input label="Propriétaire" value={form.proprio} onChange={set("proprio")} placeholder="ex: Ichigo" maxLen={MAX_SHORT} />
              <Input label="Effet spécial" value={form.effet} onChange={set("effet")} type="textarea" placeholder="Décris le pouvoir ou l'effet de cette arme..." maxLen={MAX_LONG} />
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <span style={{ fontSize:13, color:"#ccc" }}>Puissance</span>
                <input type="range" min={1} max={10} value={form.puissance} onChange={e=>setForm(f=>({...f,puissance:clampInt(+e.target.value,1,10)}))} style={{ flex:1 }} />
                <span style={{ fontSize:16, fontWeight:700, color:"#f59e0b" }}>{form.puissance}/10</span>
              </div>
            </div>
            <div>
              <ImageUploader value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} label="Image de l'arme (optionnel)" />
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} color="#b45309">{view==="edit"?"💾 Sauvegarder":"Forger l'arme"}</Btn>
            <Btn onClick={()=>{setView("list");setEditId(null);setForm(emptyForm);}} color="#ffffff20">Annuler</Btn>
          </div>
        </Card>
      )}
      {view==="list" && (
        <>
          {armes.length > 0 && usedTypes.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 0", borderBottom:"1px solid #ffffff10" }}>
              <button onClick={()=>setTypeFilter("Tout")} style={{ background:"transparent", border: typeFilter==="Tout" ? "1.5px solid #f59e0b" : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: typeFilter==="Tout" ? "#f59e0b" : "#888", cursor:"pointer", fontSize:13, fontWeight: typeFilter==="Tout" ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                {typeFilter==="Tout" && <span style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b", display:"inline-block" }} />}
                Tout
              </button>
              {usedTypes.map(t => {
                const col = getTypeColor(t);
                const active = typeFilter === t;
                return (
                  <button key={t} onClick={()=>setTypeFilter(t)} style={{ background: active ? col+"22" : "#ffffff08", border: active ? `1.5px solid ${col}` : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: active ? col : "#888", cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:col, display:"inline-block", opacity: active ? 1 : 0.5 }} />
                    {t}
                  </button>
                );
              })}
              <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center", fontSize:12, color:"#555", flexWrap:"wrap" }}>
                <span><span style={{ color:"#f59e0b", fontWeight:700 }}>{filtered.length}</span> armes</span>
                <span><span style={{ color:"#888", fontWeight:700 }}>{usedTypes.length}</span> types</span>
              </div>
            </div>
          )}
          {filtered.length===0
            ? <p style={{ color:"#666", textAlign:"center", marginTop:40 }}>{typeFilter!=="Tout"?`Aucune arme de type "${typeFilter}".`:"Arsenal vide. Ajoute une arme légendaire !"}</p>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:14 }}>
                {filtered.map(a=>(
                  <div key={a.id} style={{ background:"linear-gradient(160deg, #1c1000 0%, #0f0800 100%)", border:"1.5px solid #f59e0b44", borderRadius:14, overflow:"hidden" }}>
                    <div style={{ height:100, background:a.image?"none":"#f59e0b11", position:"relative" }}>
                      {a.image ? <img src={a.image} alt={a.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:36 }}>{getIcon(a.type)}</div>}
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:24, background:"linear-gradient(transparent,#0f0800)" }} />
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontWeight:700, fontSize:15, color:"#f59e0b" }}>{a.nom}</div>
                      <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>{a.type} · {a.origine}</div>
                      <div style={{ fontSize:12, color:"#ccc", marginBottom:8 }}>Propriétaire : <span style={{ color:"#fbbf24" }}>{a.proprio||"Inconnu"}</span></div>
                      <StatBar label="Puissance" value={a.puissance} color="#f59e0b" />
                      {a.effet && <div style={{ marginTop:8, fontSize:12, color:"#d4d4d4", fontStyle:"italic" }}>{a.effet}</div>}
                      <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
                        <button onClick={()=>setModalArme(a)} style={{ background:"none", border:"none", color:"#f59e0b", cursor:"pointer", fontSize:16 }}>🔍</button>
                        <button onClick={()=>startEdit(a)} style={{ background:"none", border:"none", color:"#f59e0b", cursor:"pointer", fontSize:16 }}>✏️</button>
                        <DeleteBtn onConfirm={()=>setArmes(as=>as.filter(x=>x.id!==a.id))} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
        </>
      )}

      {/* Modal détail arme */}
      {modalArme && (
        <DetailModal
          open={true}
          onClose={()=>setModalArme(null)}
          title={modalArme.nom}
          subtitle={`${modalArme.type} · ${modalArme.origine}`}
          image={modalArme.image}
          imagePlaceholder={getIcon(modalArme.type)}
          accentColor="#f59e0b"
        >
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {modalArme.type && <Badge text={modalArme.type} color="#f59e0b" />}
            {modalArme.origine && <Badge text={modalArme.origine} color="#fbbf24" />}
          </div>
          <div style={{ background:"#fbbf2410", border:"1px solid #fbbf2430", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:2 }}>Propriétaire</div>
            <div style={{ fontSize:15, color:"#fbbf24", fontWeight:700 }}>{modalArme.proprio||"Inconnu"}</div>
          </div>
          <StatBar label="Puissance" value={modalArme.puissance} color="#f59e0b" />
          {modalArme.effet && <div style={{ marginTop:14, background:"#ffffff08", borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>⚡ Effet spécial</div>
            <div style={{ fontSize:13, color:"#d4d4d4" }}>{modalArme.effet}</div>
          </div>}
        </DetailModal>
      )}
    </div>
  );
}

// ── SECTION 3 : Dino Codex ────────────────────────────────────────────────────
interface Dino {
  id: string; nom: string; espece: string; ere: string; regime: string;
  taille: string; poids: string; description: string; danger: number; image: string;
}

function DinoCodex() {
  const emptyForm = { nom:"", espece:"", ere:"", regime:"", taille:"", poids:"", description:"", danger:5, image:"" };
  const [form, setForm] = useState(emptyForm);
  const [dinos, setDinos] = useState<Dino[]>(()=>loadFromStorage<Dino>("dinos"));
  const [view, setView] = useState<"list"|"new"|"edit">("list");
  const [editId, setEditId] = useState<string|null>(null);
  const [regimeFilter, setRegimeFilter] = useState<string>("Tout");
  const [modalDino, setModalDino] = useState<Dino|null>(null);

  useEffect(()=>{ localStorage.setItem("dinos", JSON.stringify(dinos)); }, [dinos]);
  const set = (k:string)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  const dietColor: Record<string,string> = { Carnivore:"#ef4444", Herbivore:"#22c55e", Omnivore:"#f59e0b" };
  const ereColor: Record<string,string> = { Trias:"#8b5cf6", Jurassique:"#3b82f6", Crétacé:"#f59e0b" };

  const save = () => {
    if (!form.nom.trim()) return;
    if (!editId && dinos.length>=MAX_ITEMS) { alert(`Limite de ${MAX_ITEMS} dinos atteinte !`); return; }
    const data: Dino = { ...form, id:editId||genId(), nom:sanitize(form.nom.trim()), espece:sanitize(form.espece.trim()), taille:sanitize(form.taille.trim()), poids:sanitize(form.poids.trim()), description:sanitize(form.description.trim()), danger:clampInt(form.danger,1,10) };
    if (editId) setDinos(ds=>ds.map(d=>d.id===editId?data:d));
    else setDinos(d=>[data,...d]);
    setForm(emptyForm); setEditId(null); setView("list");
  };

  const startEdit = (d: Dino) => { setForm({ nom:d.nom, espece:d.espece, ere:d.ere, regime:d.regime, taille:d.taille, poids:d.poids, description:d.description, danger:d.danger, image:d.image||"" }); setEditId(d.id); setView("edit"); };

  const usedRegimes = Array.from(new Set(dinos.map(d=>d.regime).filter(Boolean)));
  const usedEres = Array.from(new Set(dinos.map(d=>d.ere).filter(Boolean)));
  // regimeFilter peut être un régime OU une ère
  const filtered = regimeFilter === "Tout"
    ? dinos
    : dinos.filter(d => d.regime === regimeFilter || d.ere === regimeFilter);
  const getFilterColor = (f: string) => dietColor[f] || ereColor[f] || "#888";

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <Btn onClick={()=>{setView("list");setEditId(null);}} color={view==="list"?"#065f46":"#ffffff20"}>Codex ({dinos.length})</Btn>
        <Btn onClick={()=>{setView("new");setForm(emptyForm);setEditId(null);}} color={view==="new"?"#065f46":"#ffffff20"}>+ Ajouter dino</Btn>
      </div>
      {(view==="new"||view==="edit") && (
        <Card>
          <h3 style={{ color:"#34d399", marginTop:0 }}>{view==="edit"?"✏️ Modifier le dino":"Nouvelle entrée Dino Codex"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <div>
              <Input label="Nom commun" value={form.nom} onChange={set("nom")} placeholder="ex: T-Rex" maxLen={MAX_SHORT} />
              <Input label="Espèce (latin)" value={form.espece} onChange={set("espece")} placeholder="ex: Tyrannosaurus rex" maxLen={MAX_SHORT} />
              <Input label="Ère" value={form.ere} onChange={set("ere")} options={DINO_ERAS} />
              <Input label="Régime alimentaire" value={form.regime} onChange={set("regime")} options={DINO_DIET} />
              <Input label="Taille (m)" value={form.taille} onChange={set("taille")} placeholder="ex: 12m" maxLen={20} />
              <Input label="Poids (tonnes)" value={form.poids} onChange={set("poids")} placeholder="ex: 8t" maxLen={20} />
              <Input label="Description" value={form.description} onChange={set("description")} type="textarea" placeholder="Caractéristiques, comportement..." maxLen={MAX_LONG} />
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <span style={{ fontSize:13, color:"#ccc" }}>Niveau de danger</span>
                <input type="range" min={1} max={10} value={form.danger} onChange={e=>setForm(f=>({...f,danger:clampInt(+e.target.value,1,10)}))} style={{ flex:1 }} />
                <span style={{ fontSize:16, fontWeight:700, color:"#ef4444" }}>{form.danger}/10</span>
              </div>
            </div>
            <div>
              <ImageUploader value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} label="Image du dinosaure (optionnel)" />
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} color="#065f46">{view==="edit"?"💾 Sauvegarder":"Ajouter au codex"}</Btn>
            <Btn onClick={()=>{setView("list");setEditId(null);setForm(emptyForm);}} color="#ffffff20">Annuler</Btn>
          </div>
        </Card>
      )}
      {view==="list" && (
        <>
          {dinos.length > 0 && (usedRegimes.length > 0 || usedEres.length > 0) && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 0", borderBottom:"1px solid #ffffff10" }}>
              <button onClick={()=>setRegimeFilter("Tout")} style={{ background:"transparent", border: regimeFilter==="Tout" ? "1.5px solid #34d399" : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: regimeFilter==="Tout" ? "#34d399" : "#888", cursor:"pointer", fontSize:13, fontWeight: regimeFilter==="Tout" ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                {regimeFilter==="Tout" && <span style={{ width:8, height:8, borderRadius:"50%", background:"#34d399", display:"inline-block" }} />}
                Tout
              </button>
              {/* Régimes alimentaires */}
              {usedRegimes.map(r => {
                const col = dietColor[r] || "#888";
                const active = regimeFilter === r;
                return (
                  <button key={r} onClick={()=>setRegimeFilter(r)} style={{ background: active ? col+"22" : "#ffffff08", border: active ? `1.5px solid ${col}` : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: active ? col : "#888", cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:col, display:"inline-block", opacity: active ? 1 : 0.5 }} />
                    {r==="Carnivore"?"🥩":r==="Herbivore"?"🌿":"🍖"} {r}
                  </button>
                );
              })}
              {/* Séparateur visuel */}
              {usedRegimes.length > 0 && usedEres.length > 0 && <span style={{ color:"#333", alignSelf:"center" }}>|</span>}
              {/* Ères */}
              {usedEres.map(e => {
                const col = ereColor[e] || "#888";
                const active = regimeFilter === e;
                return (
                  <button key={e} onClick={()=>setRegimeFilter(e)} style={{ background: active ? col+"22" : "#ffffff08", border: active ? `1.5px solid ${col}` : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: active ? col : "#888", cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:col, display:"inline-block", opacity: active ? 1 : 0.5 }} />
                    {e}
                  </button>
                );
              })}
              <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center", fontSize:12, color:"#555", flexWrap:"wrap" }}>
                <span><span style={{ color:"#34d399", fontWeight:700 }}>{filtered.length}</span> dinos</span>
              </div>
            </div>
          )}
          {filtered.length===0
            ? <p style={{ color:"#666", textAlign:"center", marginTop:40 }}>{regimeFilter!=="Tout"?`Aucun dino pour "${regimeFilter}".`:"Codex vide. Ajoute ton premier dinosaure !"}</p>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px,1fr))", gap:14 }}>
                {filtered.map(d=>(
                  <div key={d.id} style={{ background:"linear-gradient(160deg, #021a0f 0%, #010f08 100%)", border:"1.5px solid #34d39944", borderRadius:14, overflow:"hidden" }}>
                    <div style={{ height:100, background:d.image?"none":"#34d39911", position:"relative" }}>
                      {d.image ? <img src={d.image} alt={d.nom} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:40 }}>🦕</div>}
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:24, background:"linear-gradient(transparent,#010f08)" }} />
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontWeight:700, fontSize:15, color:"#34d399" }}>{d.nom}</div>
                      <div style={{ fontSize:11, color:"#888", fontStyle:"italic", marginBottom:6 }}>{d.espece}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                        {d.ere && <Badge text={d.ere} color={ereColor[d.ere]||"#888"} />}
                        {d.regime && <Badge text={d.regime} color={dietColor[d.regime]||"#888"} />}
                      </div>
                      <div style={{ fontSize:12, color:"#ccc", marginBottom:6 }}>
                        {d.taille && <span>📏 {d.taille} </span>}
                        {d.poids && <span>⚖️ {d.poids}</span>}
                      </div>
                      <StatBar label="Danger" value={d.danger} color="#ef4444" />
                      {d.description && <div style={{ marginTop:8, fontSize:12, color:"#ccc" }}>{d.description}</div>}
                      <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
                        <button onClick={()=>setModalDino(d)} style={{ background:"none", border:"none", color:"#34d399", cursor:"pointer", fontSize:16 }}>🔍</button>
                        <button onClick={()=>startEdit(d)} style={{ background:"none", border:"none", color:"#34d399", cursor:"pointer", fontSize:16 }}>✏️</button>
                        <DeleteBtn onConfirm={()=>setDinos(ds=>ds.filter(x=>x.id!==d.id))} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
        </>
      )}

      {/* Modal détail dino */}
      {modalDino && (
        <DetailModal
          open={true}
          onClose={()=>setModalDino(null)}
          title={modalDino.nom}
          subtitle={modalDino.espece}
          image={modalDino.image}
          imagePlaceholder="🦕"
          accentColor="#34d399"
        >
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {modalDino.ere && <Badge text={modalDino.ere} color={ereColor[modalDino.ere]||"#888"} />}
            {modalDino.regime && <Badge text={modalDino.regime} color={dietColor[modalDino.regime]||"#888"} />}
          </div>
          <div style={{ display:"flex", gap:16, marginBottom:14, fontSize:14, color:"#ccc" }}>
            {modalDino.taille && <span>📏 <strong style={{ color:"#34d399" }}>{modalDino.taille}</strong></span>}
            {modalDino.poids && <span>⚖️ <strong style={{ color:"#34d399" }}>{modalDino.poids}</strong></span>}
          </div>
          <StatBar label="Niveau de danger" value={modalDino.danger} color="#ef4444" />
          {modalDino.description && <div style={{ marginTop:14, background:"#ffffff08", borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>📋 Description</div>
            <div style={{ fontSize:13, color:"#ccc", lineHeight:1.6 }}>{modalDino.description}</div>
          </div>}
        </DetailModal>
      )}
    </div>
  );
}

// ── SECTION 4 : Mes Animes ────────────────────────────────────────────────────
interface Anime {
  id: string; titre: string; genre: string; statut: string; episodes: string;
  note: number; avis: string; image: string; malId?: number;
  baseTitre?: string; // titre de base pour regrouper les saisons
  saison?: number;    // numéro de saison
}
interface JikanAnime { mal_id: number; title: string; images: { jpg: { image_url: string } }; genres: { name: string }[]; episodes: number|null; season?: number; }

// Extrait le titre de base (sans "Season X", "Saison X", "Part X", etc.)
function extractBaseTitre(titre: string): string {
  return titre
    .replace(/\s+(season|saison|part|cour|s)\s*\d+\s*$/i, "")
    .replace(/\s+\d+(st|nd|rd|th)\s+season\s*$/i, "")
    .replace(/:\s*(season|saison|part)\s*\d+\s*$/i, "")
    .trim();
}

function MesAnimes() {
  const emptyForm = { titre:"", genre:"", statut:"", episodes:"", note:5, avis:"", image:"" };
  const [form, setForm] = useState(emptyForm);
  const [animes, setAnimes] = useState<Anime[]>(()=>loadFromStorage<Anime>("animes"));
  const [view, setView] = useState<"list"|"new"|"search">("list");
  const [filtre, setFiltre] = useState("Tous");
  const [search, setSearch] = useState("");
  const [internetSearch, setInternetSearch] = useState("");
  const [searchResults, setSearchResults] = useState<JikanAnime[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [editStatutId, setEditStatutId] = useState<string|null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [modalAnime, setModalAnime] = useState<Anime|null>(null);

  useEffect(()=>{ localStorage.setItem("animes", JSON.stringify(animes)); }, [animes]);
  const set = (k:string)=>(v:string)=>setForm(f=>({...f,[k]:v}));

  const searchOnline = async () => {
    if (!internetSearch.trim()) return;
    setSearching(true); setSearchError(""); setSearchResults([]);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(internetSearch)}&limit=12`);
      const data = await res.json();
      if (data.data) setSearchResults(data.data);
      else setSearchError("Aucun résultat trouvé.");
    } catch { setSearchError("Erreur de connexion. Vérifie ta connexion internet."); }
    finally { setSearching(false); }
  };

  const addFromSearch = (ja: JikanAnime) => {
    if (animes.length>=MAX_ITEMS) { alert(`Limite de ${MAX_ITEMS} animes atteinte !`); return; }
    if (animes.find(a=>a.malId===ja.mal_id)) { alert("Cet anime est déjà dans ta liste !"); return; }
    const base = extractBaseTitre(ja.title);
    const newAnime: Anime = { id:genId(), titre:sanitize(ja.title), baseTitre:sanitize(base), genre:ja.genres.map(g=>g.name).join(", "), statut:"À voir", episodes:String(ja.episodes||0), note:5, avis:"", image:ja.images.jpg.image_url, malId:ja.mal_id };
    setAnimes(a=>[newAnime,...a]);
    alert(`"${ja.title}" ajouté à ta liste !`);
  };

  const add = () => {
    if (!form.titre.trim()) return;
    if (animes.length>=MAX_ITEMS) { alert(`Limite de ${MAX_ITEMS} animes atteinte !`); return; }
    const titre = sanitize(form.titre.trim());
    const base = extractBaseTitre(titre);
    const newAnime: Anime = { ...form, id:genId(), titre, baseTitre:base, genre:sanitize(form.genre.trim()), episodes:String(clampInt(Number(form.episodes),0,MAX_EPISODES)), avis:sanitize(form.avis.trim()), note:clampInt(form.note,1,10) };
    setAnimes(a=>[newAnime,...a]); setForm(emptyForm); setView("list");
  };

  const updateStatut = (id: string, statut: string) => {
    setAnimes(as=>as.map(a=>a.id===id?{...a,statut}:a));
    setEditStatutId(null);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Grouper les animes par baseTitre
  const buildGroups = () => {
    const filtered = animes.filter(a=>{
      const matchFiltre = filtre==="Tous"||a.statut===filtre;
      const matchSearch = a.titre.toLowerCase().includes(search.toLowerCase());
      return matchFiltre && matchSearch;
    });
    const groups: Map<string, Anime[]> = new Map();
    filtered.forEach(a => {
      const key = (a.baseTitre || a.titre).toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      baseTitre: items[0].baseTitre || items[0].titre,
      items: items.sort((a,b)=>a.titre.localeCompare(b.titre)),
    }));
  };

  const groups = buildGroups();
  const noteColor = (n:number) => n>=8?"#22c55e":n>=6?"#f59e0b":n>=4?"#3b82f6":"#ef4444";

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <Btn onClick={()=>setView("list")} color={view==="list"?"#1d4ed8":"#ffffff20"}>Ma liste ({animes.length})</Btn>
        <Btn onClick={()=>setView("search")} color={view==="search"?"#1d4ed8":"#ffffff20"}>🔎 Chercher un anime</Btn>
        <Btn onClick={()=>{setView("new");setForm(emptyForm);}} color={view==="new"?"#1d4ed8":"#ffffff20"}>+ Ajouter manuellement</Btn>
      </div>

      {view==="search" && (
        <div>
          <Card style={{ marginBottom:16 }}>
            <h3 style={{ color:"#60a5fa", marginTop:0 }}>🔎 Rechercher un anime sur Internet</h3>
            <div style={{ display:"flex", gap:8 }}>
              <input value={internetSearch} onChange={e=>setInternetSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchOnline()} placeholder="ex: Attack on Titan, Naruto..." style={{ flex:1, background:"#ffffff0a", border:"1px solid #3b82f655", borderRadius:10, padding:"10px 14px", color:"#eee", fontSize:14 }} />
              <Btn onClick={searchOnline} color="#1d4ed8">{searching?"⏳ Recherche...":"🔍 Rechercher"}</Btn>
            </div>
            {searchError && <p style={{ color:"#ef4444", marginTop:8, fontSize:13 }}>{searchError}</p>}
          </Card>
          {searching && <p style={{ color:"#888", textAlign:"center" }}>Recherche en cours...</p>}
          {searchResults.length>0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:12 }}>
              {searchResults.map(ja=>{
                const already = animes.some(a=>a.malId===ja.mal_id);
                return (
                  <div key={ja.mal_id} style={{ background:"#ffffff08", border:"1px solid #3b82f630", borderRadius:12, overflow:"hidden" }}>
                    <img src={ja.images.jpg.image_url} alt={ja.title} style={{ width:"100%", height:180, objectFit:"cover", display:"block" }} />
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#eee", marginBottom:4, lineHeight:1.3 }}>{ja.title}</div>
                      <div style={{ fontSize:11, color:"#888", marginBottom:8 }}>{ja.genres.slice(0,2).map(g=>g.name).join(", ")} {ja.episodes?`· ${ja.episodes} ep`:""}</div>
                      {already
                        ? <div style={{ background:"#22c55e22", border:"1px solid #22c55e55", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#22c55e", textAlign:"center" }}>✓ Dans ta liste</div>
                        : <button onClick={()=>addFromSearch(ja)} style={{ width:"100%", background:"#1d4ed8", border:"none", borderRadius:8, color:"#fff", padding:"6px 0", cursor:"pointer", fontSize:13, fontWeight:600 }}>+ Ajouter</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view==="new" && (
        <Card>
          <h3 style={{ color:"#60a5fa", marginTop:0 }}>Ajouter un anime manuellement</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
            <div>
              <Input label="Titre" value={form.titre} onChange={set("titre")} placeholder="ex: Naruto Shippuden" maxLen={MAX_SHORT} />
              <Input label="Genre" value={form.genre} onChange={set("genre")} placeholder="ex: Shonen, Isekai..." maxLen={MAX_SHORT} />
              <Input label="Statut" value={form.statut} onChange={set("statut")} options={ANIME_STATUS} />
              <Input label="Nombre d'épisodes vus" value={form.episodes} onChange={set("episodes")} type="number" placeholder="ex: 500" />
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <span style={{ fontSize:13, color:"#ccc" }}>Ma note</span>
                <input type="range" min={1} max={10} value={form.note} onChange={e=>setForm(f=>({...f,note:clampInt(+e.target.value,1,10)}))} style={{ flex:1 }} />
                <span style={{ fontSize:16, fontWeight:700, color:"#60a5fa" }}>{form.note}/10</span>
              </div>
              <Input label="Mon avis (optionnel)" value={form.avis} onChange={set("avis")} type="textarea" placeholder="Ce que j'ai pensé de cet anime..." maxLen={MAX_LONG} />
            </div>
            <div>
              <ImageUploader value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} label="Image de l'anime (optionnel)" />
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={add} color="#1d4ed8">Ajouter à ma liste</Btn>
            <Btn onClick={()=>setView("list")} color="#ffffff20">Annuler</Btn>
          </div>
        </Card>
      )}

      {view==="list" && (
        <>
          {animes.length>0 && (
            <>
              <SearchBar value={search} onChange={setSearch} placeholder="Rechercher dans ma liste..." />
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                {["Tous",...ANIME_STATUS].map(s=>(
                  <button key={s} onClick={()=>setFiltre(s)} style={{ background:filtre===s?(statusColor[s]||"#1d4ed8")+"33":"#ffffff10", border:`1px solid ${filtre===s?(statusColor[s]||"#1d4ed8"):"#ffffff20"}`, borderRadius:20, padding:"4px 14px", color:filtre===s?(statusColor[s]||"#93c5fd"):"#ccc", cursor:"pointer", fontSize:13 }}>{s}</button>
                ))}
              </div>
            </>
          )}
          {groups.length===0
            ? <p style={{ color:"#666", textAlign:"center", marginTop:40 }}>{search||filtre!=="Tous"?"Aucun résultat.":"Aucun anime. Recherche-en un !"}</p>
            : <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {groups.map(group=>{
                  const isSingle = group.items.length===1;
                  const isExpanded = expandedGroups.has(group.key);
                  const bestStatut = group.items.some(a=>a.statut==="En cours")?"En cours":group.items.some(a=>a.statut==="Terminé")?"Terminé":group.items.some(a=>a.statut==="Abandonné")?"Abandonné":"À voir";
                  const groupColor = statusColor[bestStatut]||"#888";
                  if (isSingle) {
                    const a = group.items[0];
                    const sc = statusColor[a.statut]||"#888";
                    const nc = noteColor(a.note);
                    return (
                      <div key={a.id} style={{ background:"linear-gradient(160deg, #050f2a 0%, #020818 100%)", border:`1.5px solid ${sc}44`, borderRadius:14, overflow:"hidden", display:"flex" }}>
                        <div style={{ width:100, minWidth:100, position:"relative", background:a.image?"none":"#1d4ed811", flexShrink:0 }}>
                          {a.image ? <img src={a.image} alt={a.titre} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                            : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:32 }}>📺</div>}
                        </div>
                        <div style={{ padding:"12px 14px", flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:15, color:"#eee", marginBottom:4 }}>{a.titre}</div>
                          <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>{a.genre} {a.episodes?`· ${a.episodes} ep`:""}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                            {editStatutId===a.id ? (
                              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                {ANIME_STATUS.map(s=>(
                                  <button key={s} onClick={()=>updateStatut(a.id,s)} style={{ background:statusColor[s]+"33", border:`1px solid ${statusColor[s]}`, borderRadius:14, padding:"3px 10px", color:statusColor[s], cursor:"pointer", fontSize:11, fontWeight:600 }}>{s}</button>
                                ))}
                                <button onClick={()=>setEditStatutId(null)} style={{ background:"#ffffff15", border:"none", borderRadius:14, padding:"3px 10px", color:"#aaa", cursor:"pointer", fontSize:11 }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={()=>setEditStatutId(a.id)} style={{ background:sc+"22", border:`1px solid ${sc}55`, borderRadius:14, padding:"3px 12px", color:sc, cursor:"pointer", fontSize:12, fontWeight:600 }}>{a.statut||"?"} ✎</button>
                            )}
                            <span style={{ background:"#000000aa", borderRadius:6, padding:"2px 8px" }}>
                              <span style={{ color:nc, fontWeight:700, fontSize:13 }}>★{a.note}</span>
                            </span>
                          </div>
                          {a.avis && <div style={{ fontSize:12, color:"#ccc", marginTop:6, fontStyle:"italic" }}>{a.avis}</div>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", padding:"0 10px", gap:4 }}>
                          <button onClick={()=>setModalAnime(a)} style={{ background:"none", border:"none", color:"#60a5fa", cursor:"pointer", fontSize:16 }}>🔍</button>
                          <DeleteBtn onConfirm={()=>setAnimes(cs=>cs.filter(x=>x.id!==a.id))} />
                        </div>
                      </div>
                    );
                  }
                  // Groupe de plusieurs saisons
                  return (
                    <div key={group.key} style={{ border:`1.5px solid ${groupColor}44`, borderRadius:14, overflow:"hidden" }}>
                      {/* Header du groupe */}
                      <div onClick={()=>toggleGroup(group.key)} style={{ background:`linear-gradient(90deg, ${groupColor}22, #050f2a)`, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>📺</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:15, color:"#eee" }}>{group.baseTitre}</div>
                          <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{group.items.length} saisons · {group.items.map(a=>a.statut).join(", ")}</div>
                        </div>
                        <span style={{ color:"#888", fontSize:18 }}>{isExpanded?"▲":"▼"}</span>
                      </div>
                      {/* Saisons détaillées */}
                      {isExpanded && (
                        <div style={{ background:"#020818" }}>
                          {group.items.map((a,idx)=>{
                            const sc = statusColor[a.statut]||"#888";
                            const nc = noteColor(a.note);
                            return (
                              <div key={a.id} style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderTop:idx>0?"1px solid #ffffff10":"none", gap:10 }}>
                                {a.image && <img src={a.image} alt={a.titre} style={{ width:44, height:60, objectFit:"cover", borderRadius:6, flexShrink:0 }} />}
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight:600, fontSize:13, color:"#ddd", marginBottom:3 }}>{a.titre}</div>
                                  <div style={{ fontSize:11, color:"#666" }}>{a.episodes?`${a.episodes} ep`:""}</div>
                                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4, flexWrap:"wrap" }}>
                                    {editStatutId===a.id ? (
                                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                        {ANIME_STATUS.map(s=>(
                                          <button key={s} onClick={()=>updateStatut(a.id,s)} style={{ background:statusColor[s]+"33", border:`1px solid ${statusColor[s]}`, borderRadius:14, padding:"2px 8px", color:statusColor[s], cursor:"pointer", fontSize:11, fontWeight:600 }}>{s}</button>
                                        ))}
                                        <button onClick={()=>setEditStatutId(null)} style={{ background:"#ffffff15", border:"none", borderRadius:14, padding:"2px 8px", color:"#aaa", cursor:"pointer", fontSize:11 }}>✕</button>
                                      </div>
                                    ) : (
                                      <button onClick={()=>setEditStatutId(a.id)} style={{ background:sc+"22", border:`1px solid ${sc}55`, borderRadius:14, padding:"2px 10px", color:sc, cursor:"pointer", fontSize:11, fontWeight:600 }}>{a.statut||"?"} ✎</button>
                                    )}
                                    <span style={{ color:nc, fontWeight:700, fontSize:12 }}>★{a.note}</span>
                                  </div>
                                </div>
                                <button onClick={()=>setModalAnime(a)} style={{ background:"none", border:"none", color:"#60a5fa", cursor:"pointer", fontSize:15 }}>🔍</button>
                                <DeleteBtn onConfirm={()=>setAnimes(cs=>cs.filter(x=>x.id!==a.id))} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
        </>
      )}

      {/* Modal détail anime */}
      {modalAnime && (() => {
        const sc = statusColor[modalAnime.statut]||"#888";
        const nc = noteColor(modalAnime.note);
        return (
          <DetailModal
            open={true}
            onClose={()=>setModalAnime(null)}
            title={modalAnime.titre}
            subtitle={modalAnime.genre}
            image={modalAnime.image}
            imagePlaceholder="📺"
            accentColor={sc}
          >
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {modalAnime.statut && <Badge text={modalAnime.statut} color={sc} />}
              {modalAnime.genre && <Badge text={modalAnime.genre} color="#60a5fa" />}
            </div>
            <div style={{ display:"flex", gap:16, marginBottom:14 }}>
              {modalAnime.episodes && <div style={{ background:"#ffffff08", borderRadius:10, padding:"8px 14px", flex:1, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#888" }}>Épisodes vus</div>
                <div style={{ fontSize:20, fontWeight:700, color:"#eee" }}>{modalAnime.episodes}</div>
              </div>}
              <div style={{ background:"#000000aa", borderRadius:10, padding:"8px 14px", flex:1, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#888" }}>Ma note</div>
                <div style={{ fontSize:20, fontWeight:700, color:nc }}>★ {modalAnime.note}/10</div>
              </div>
            </div>
            {modalAnime.avis && <div style={{ background:"#ffffff08", borderRadius:10, padding:"10px 14px" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>💬 Mon avis</div>
              <div style={{ fontSize:13, color:"#ccc", lineHeight:1.6, fontStyle:"italic" }}>{modalAnime.avis}</div>
            </div>}
          </DetailModal>
        );
      })()}
    </div>
  );
}

// ── SECTION 5 : Créateur de Puissance ────────────────────────────────────────
const DANGER_RANKS = ["E","D","C","B","A","S","SS","SSS"] as const;
type DangerRank = typeof DANGER_RANKS[number];
type PersonnageRole = "hero"|"civil"|"vilain";

const dangerRankColor: Record<DangerRank,string> = {
  E:"#6b7280", D:"#22c55e", C:"#3b82f6", B:"#a855f7", A:"#f59e0b", S:"#ef4444", SS:"#ec4899", SSS:"#ff0055"
};

interface Perso {
  id: string; nom: string; types: string[]; nb_pouvoirs: number; portee: number;
  controle: number; destruction: number; vitesse: number; regen: number;
  limite: number; description: string; score: number; image: string;
  pouvoirs_custom: string[]; description_pouvoirs: string;
  role: PersonnageRole; nom_heros: string; danger_rank: DangerRank;
}

function calculatePower(form: Omit<Perso,"id"|"score">): number {
  const poids = { portee:0.17, controle:0.23, destruction:0.23, vitesse:0.12, regen:0.12, limite:0.13 };
  let score = 0;
  score += (clampInt(form.portee,1,10)/10)*10*poids.portee;
  score += (clampInt(form.controle,1,10)/10)*10*poids.controle;
  score += (clampInt(form.destruction,1,10)/10)*10*poids.destruction;
  score += (clampInt(form.vitesse,1,10)/10)*10*poids.vitesse;
  score += (clampInt(form.regen,1,10)/10)*10*poids.regen;
  score += ((10-clampInt(form.limite,1,10))/10)*10*poids.limite;
  // Bonus pour les types multiples et les pouvoirs custom
  const bonus = (form.types.length>1?0.5:0) + (form.pouvoirs_custom.length>2?0.5:0);
  return Math.min(10, Math.round((score+bonus)*10)/10);
}

function powerLabel(n: number) {
  if (n<3) return { label:"Ordinaire", color:"#6b7280" };
  if (n<5) return { label:"Intermédiaire", color:"#22c55e" };
  if (n<7) return { label:"Avancé", color:"#3b82f6" };
  if (n<9) return { label:"Élite", color:"#f59e0b" };
  if (n<10) return { label:"Légendaire", color:"#a855f7" };
  return { label:"DIEU", color:"#ef4444" };
}

function Createur() {
  const emptyForm = { nom:"", types:[] as string[], nb_pouvoirs:1, portee:5, controle:5, destruction:5, vitesse:5, regen:3, limite:5, description:"", description_pouvoirs:"", image:"", pouvoirs_custom:[] as string[], role:"civil" as PersonnageRole, nom_heros:"", danger_rank:"C" as DangerRank };
  const [form, setForm] = useState(emptyForm);
  const [persos, setPersos] = useState<Perso[]>(()=>loadFromStorage<Perso>("persos"));
  // Types de pouvoir ENTIÈREMENT créés par l'user, pas de défauts
  const [powerTypes, setPowerTypes] = useState<string[]>(()=>loadStrList("power_types", DEFAULT_POWER_TYPES));
  const [view, setView] = useState<"list"|"new"|"edit">("list");
  const [editId, setEditId] = useState<string|null>(null);
  const [newPouvoir, setNewPouvoir] = useState("");
  const [niveauFilter, setNiveauFilter] = useState<string>("Tout");
  const [roleFilter, setRoleFilter] = useState<string>("Tout");
  const [searchPerso, setSearchPerso] = useState<string>("");
  const [modalPerso, setModalPerso] = useState<Perso|null>(null);

  useEffect(()=>{ localStorage.setItem("persos", JSON.stringify(persos)); }, [persos]);

  const score = calculatePower(form);
  const info = powerLabel(score);

  const addPouvoir = () => {
    if (!newPouvoir.trim()) return;
    if (form.pouvoirs_custom.length>=20) return;
    setForm(f=>({...f, pouvoirs_custom:[...f.pouvoirs_custom, sanitize(newPouvoir.trim())]}));
    setNewPouvoir("");
  };

  const save = () => {
    if (!form.nom.trim()) return;
    if (!editId && persos.length>=MAX_ITEMS) { alert(`Limite de ${MAX_ITEMS} personnages atteinte !`); return; }
    // Valider que les types sélectionnés existent toujours dans la liste
    const data: Perso = {
      ...form, id:editId||genId(), score,
      nom:sanitize(form.nom.trim()), description:sanitize(form.description.trim()),
      types: form.types.filter(t=>powerTypes.includes(t)),
      nom_heros: sanitize(form.nom_heros.trim()),
      danger_rank: form.danger_rank,
      role: form.role,
    };
    if (editId) setPersos(ps=>ps.map(p=>p.id===editId?data:p));
    else setPersos(p=>[data,...p]);
    setForm(emptyForm); setEditId(null); setView("list");
  };

  const startEdit = (p: Perso) => {
    setForm({ nom:p.nom, types:p.types, nb_pouvoirs:p.nb_pouvoirs, portee:p.portee, controle:p.controle, destruction:p.destruction, vitesse:p.vitesse, regen:p.regen, limite:p.limite, description:p.description, description_pouvoirs:p.description_pouvoirs||"", image:p.image||"", pouvoirs_custom:p.pouvoirs_custom||[], role:p.role||"civil", nom_heros:p.nom_heros||"", danger_rank:p.danger_rank||"C" });
    setEditId(p.id); setView("edit");
  };

  const sliders = [
    { key:"destruction", label:"Puissance", min:1, max:10 },
    { key:"vitesse", label:"Vitesse", min:1, max:10 },
    { key:"controle", label:"Technique", min:1, max:10 },
    { key:"portee", label:"Intelligence", min:1, max:10 },
    { key:"regen", label:"Coopération", min:1, max:10 },
    { key:"limite", label:"Résistance", min:1, max:10 },
  ] as const;

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <Btn onClick={()=>{setView("list");setEditId(null);}} color={view==="list"?"#be123c":"#ffffff20"}>Personnages ({persos.length})</Btn>
        <Btn onClick={()=>{setView("new");setForm(emptyForm);setEditId(null);}} color={view==="new"?"#be123c":"#ffffff20"}>+ Créer personnage</Btn>
      </div>

      {(view==="new"||view==="edit") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card>
            <h3 style={{ color:"#f43f5e", marginTop:0 }}>{view==="edit"?"✏️ Modifier":"Infos du personnage"}</h3>
            <Input label="Nom" value={form.nom} onChange={v=>setForm(f=>({...f,nom:v}))} placeholder="ex: Shadow the Reaper" maxLen={MAX_SHORT} />

            {/* Sélecteur de rôle */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"#aaa", display:"block", marginBottom:8 }}>Rôle</label>
              <div style={{ display:"flex", gap:8 }}>
                {([
                  { key:"hero" as PersonnageRole, label:"🦸 Héros", color:"#22c55e" },
                  { key:"civil" as PersonnageRole, label:"🧑 Civil", color:"#3b82f6" },
                  { key:"vilain" as PersonnageRole, label:"💀 Vilain", color:"#ef4444" },
                ]).map(r=>(
                  <button key={r.key} onClick={()=>setForm(f=>({...f,role:r.key}))} style={{ flex:1, padding:"8px 0", borderRadius:8, border:`2px solid ${form.role===r.key?r.color:"#ffffff20"}`, background:form.role===r.key?r.color+"22":"#ffffff08", color:form.role===r.key?r.color:"#888", cursor:"pointer", fontSize:13, fontWeight:form.role===r.key?700:400, transition:"all 0.15s" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Champ nom de héros */}
            {form.role==="hero" && (
              <div style={{ marginBottom:14, background:"#22c55e0d", border:"1px solid #22c55e33", borderRadius:10, padding:"10px 14px" }}>
                <Input label="🦸 Nom de héros / Alias" value={form.nom_heros} onChange={v=>setForm(f=>({...f,nom_heros:v}))} placeholder="ex: All Might, Deku, Spider-Man..." maxLen={MAX_SHORT} />
              </div>
            )}

            {/* Niveau de danger pour les vilains */}
            {form.role==="vilain" && (
              <div style={{ marginBottom:14, background:"#ef44440d", border:"1px solid #ef444433", borderRadius:10, padding:"10px 14px" }}>
                <label style={{ fontSize:12, color:"#aaa", display:"block", marginBottom:8 }}>☠️ Niveau de danger</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {DANGER_RANKS.map(rank=>{
                    const col = dangerRankColor[rank];
                    const active = form.danger_rank===rank;
                    return (
                      <button key={rank} onClick={()=>setForm(f=>({...f,danger_rank:rank}))} style={{ padding:"6px 14px", borderRadius:8, border:`2px solid ${active?col:"#ffffff20"}`, background:active?col+"33":"#ffffff08", color:active?col:"#888", cursor:"pointer", fontSize:14, fontWeight:active?800:500, transition:"all 0.15s", letterSpacing:1 }}>
                        {rank}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:"#888", marginTop:6 }}>E = Faible menace → SSS = Catastrophe nationale</div>
              </div>
            )}

            <ImageUploader value={form.image} onChange={v=>setForm(f=>({...f,image:v}))} label="Image du personnage (optionnel)" />
            <Input label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} type="textarea" placeholder="Backstory, apparence..." maxLen={MAX_LONG} />

            {/* Types de pouvoir : entièrement créés par l'user */}
            <TagPicker
              label="Types de pouvoir (crée les tiens)"
              value=""
              onSelect={()=>{}}
              tags={powerTypes}
              onTagsChange={t=>{setPowerTypes(t); setForm(f=>({...f, types:f.types.filter(x=>t.includes(x))}));}}
              storageKey="power_types"
              color="#f43f5e"
              placeholder="ex: Feu divin, Ombre cosmique..."
              multiSelect={true}
              selected={form.types}
              onMultiToggle={t=>setForm(f=>({ ...f, types:f.types.includes(t)?f.types.filter(x=>x!==t):(f.types.length<14?[...f.types,t]:f.types) }))}
            />

            {/* Pouvoirs nommés du perso */}
            <label style={{ fontSize:12, color:"#aaa", display:"block", marginBottom:6 }}>✨ Noms de pouvoirs du personnage</label>
            <div style={{ display:"flex", gap:6, marginBottom:8 }}>
              <input value={newPouvoir} onChange={e=>setNewPouvoir(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPouvoir()} placeholder="ex: Kamehameha, Bankai, Amenotejikara..." style={{ flex:1, background:"#ffffff0a", border:"1px solid #f43f5e55", borderRadius:8, padding:"7px 12px", color:"#eee", fontSize:13 }} maxLength={60} />
              <button onClick={addPouvoir} style={{ background:"#be123c", border:"none", borderRadius:8, color:"#fff", padding:"7px 14px", cursor:"pointer", fontSize:13 }}>+</button>
            </div>
            {form.pouvoirs_custom.length>0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {form.pouvoirs_custom.map((p,i)=>(
                  <span key={i} style={{ background:"#f43f5e22", border:"1px solid #f43f5e55", borderRadius:20, padding:"3px 10px", fontSize:12, color:"#f43f5e", display:"flex", alignItems:"center", gap:6 }}>
                    {p}
                    <button onClick={()=>setForm(f=>({...f,pouvoirs_custom:f.pouvoirs_custom.filter((_,j)=>j!==i)}))} style={{ background:"none", border:"none", color:"#f43f5e", cursor:"pointer", fontSize:12, padding:0 }}>✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* Description des pouvoirs */}
            <Input label="⚡ Description des pouvoirs" value={form.description_pouvoirs} onChange={v=>setForm(f=>({...f,description_pouvoirs:v}))} type="textarea" placeholder="Comment fonctionnent les pouvoirs, leur origine, leurs effets..." maxLen={MAX_LONG} />

            {sliders.map(s=>(
              <div key={s.key} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#ccc", marginBottom:3 }}>
                  <span>{s.label}</span><span style={{ color:"#f43f5e", fontWeight:700 }}>{form[s.key]}</span>
                </div>
                <input type="range" min={s.min} max={s.max} value={form[s.key]} onChange={e=>setForm(f=>({...f,[s.key]:clampInt(+e.target.value,s.min,s.max)}))} style={{ width:"100%" }} />
              </div>
            ))}
          </Card>
          <div>
            <Card style={{ textAlign:"center", marginBottom:14 }}>
              <h3 style={{ color:"#aaa", marginTop:0, fontSize:14 }}>Niveau de puissance calculé</h3>
              <div style={{ fontSize:64, fontWeight:700, color:info.color, lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:11, color:"#888", marginBottom:8 }}>/10</div>
              <Badge text={info.label} color={info.color} />
              <div style={{ marginTop:16 }}>
                {[...Array(10)].map((_,i)=>(
                  <div key={i} style={{ display:"inline-block", width:20, height:20, borderRadius:4, background:i<score?info.color:"#ffffff15", margin:2 }} />
                ))}
              </div>
            </Card>
            <Card>
              <h4 style={{ color:"#ccc", margin:"0 0 10px", textAlign:"center", letterSpacing:2, fontSize:13, textTransform:"uppercase" }}>Statistiques</h4>
              {(() => {
                // Labels identiques aux sliders — même nom des deux côtés
                const radarStats = sliders.map(s => ({ key: s.key, label: s.label }));
                const size = 200;
                const cx = size / 2;
                const cy = size / 2;
                const r = 78;
                const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
                const n = radarStats.length;
                const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
                const pt = (i: number, frac: number) => {
                  const a = angle(i);
                  return { x: cx + r * frac * Math.cos(a), y: cy + r * frac * Math.sin(a) };
                };
                const hexPoints = (frac: number) =>
                  Array.from({ length: n }, (_, i) => pt(i, frac))
                    .map(p => `${p.x},${p.y}`).join(" ");
                const dataPoints = radarStats.map((s, i) => {
                  const val = form[s.key as keyof typeof form] as number;
                  return pt(i, val / 10);
                }).map(p => `${p.x},${p.y}`).join(" ");
                return (
                  <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display:"block", maxWidth:220, margin:"0 auto" }}>
                    {/* Grilles hexagonales */}
                    {levels.map((frac, li) => (
                      <polygon key={li} points={hexPoints(frac)} fill="none" stroke="#ffffff18" strokeWidth={0.8} />
                    ))}
                    {/* Axes */}
                    {radarStats.map((_, i) => {
                      const p = pt(i, 1);
                      return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#ffffff20" strokeWidth={0.8} />;
                    })}
                    {/* Aire de données */}
                    <polygon points={dataPoints} fill={info.color + "44"} stroke={info.color} strokeWidth={2} strokeLinejoin="round" />
                    {/* Points */}
                    {radarStats.map((s, i) => {
                      const val = form[s.key as keyof typeof form] as number;
                      const p = pt(i, val / 10);
                      return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={info.color} />;
                    })}
                    {/* Labels */}
                    {radarStats.map((s, i) => {
                      const labelR = r + 16;
                      const a = angle(i);
                      const lx = cx + labelR * Math.cos(a);
                      const ly = cy + labelR * Math.sin(a);
                      const anchor = Math.abs(Math.cos(a)) < 0.1 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
                      return (
                        <text key={i} x={lx} y={ly + 4} textAnchor={anchor} fontSize="9" fill="#cccccc" fontFamily="'Segoe UI', system-ui, sans-serif">
                          {s.label}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
              <div style={{ marginTop:14, display:"flex", gap:10 }}>
                <Btn onClick={save} color="#be123c">{view==="edit"?"💾 Sauvegarder":"Enregistrer le personnage"}</Btn>
                <Btn onClick={()=>{setView("list");setEditId(null);setForm(emptyForm);}} color="#ffffff20">Annuler</Btn>
              </div>
            </Card>
          </div>
        </div>
      )}

      {view==="list" && (() => {
        const allNiveaux = ["Ordinaire","Intermédiaire","Avancé","Élite","Légendaire","DIEU"];
        const niveauColors: Record<string,string> = { "Ordinaire":"#6b7280","Intermédiaire":"#22c55e","Avancé":"#3b82f6","Élite":"#f59e0b","Légendaire":"#a855f7","DIEU":"#ef4444" };
        const usedNiveaux = allNiveaux.filter(n => persos.some(p => powerLabel(p.score).label === n));
        const filteredPersos = persos.filter(p => {
          if (niveauFilter !== "Tout" && powerLabel(p.score).label !== niveauFilter) return false;
          if (roleFilter !== "Tout" && p.role !== roleFilter) return false;
          if (searchPerso.trim()) {
            const q = searchPerso.trim().toLowerCase();
            if (!p.nom.toLowerCase().includes(q) && !(p.nom_heros||"").toLowerCase().includes(q) && !p.types.join(" ").toLowerCase().includes(q) && !(p.description||"").toLowerCase().includes(q)) return false;
          }
          return true;
        });
        return (
          <>
            {persos.length > 0 && usedNiveaux.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 0", borderBottom:"1px solid #ffffff10" }}>
                <button onClick={()=>setNiveauFilter("Tout")} style={{ background:"transparent", border: niveauFilter==="Tout" ? "1.5px solid #f43f5e" : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: niveauFilter==="Tout" ? "#f43f5e" : "#888", cursor:"pointer", fontSize:13, fontWeight: niveauFilter==="Tout" ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                  {niveauFilter==="Tout" && <span style={{ width:8, height:8, borderRadius:"50%", background:"#f43f5e", display:"inline-block" }} />}
                  Tout
                </button>
                {usedNiveaux.map(n => {
                  const col = niveauColors[n];
                  const active = niveauFilter === n;
                  return (
                    <button key={n} onClick={()=>setNiveauFilter(n)} style={{ background: active ? col+"22" : "#ffffff08", border: active ? `1.5px solid ${col}` : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: active ? col : "#888", cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400, display:"flex", alignItems:"center", gap:6, outline:"none" }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:col, display:"inline-block", opacity: active ? 1 : 0.5 }} />
                      {n}
                    </button>
                  );
                })}
                <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center", fontSize:12, color:"#555", flexWrap:"wrap" }}>
                  <span><span style={{ color:"#f43f5e", fontWeight:700 }}>{filteredPersos.length}</span> persos</span>
                  <span><span style={{ color:"#a855f7", fontWeight:700 }}>{persos.filter(p=>powerLabel(p.score).label==="Légendaire"||powerLabel(p.score).label==="DIEU").length}</span> légendaires+</span>
                </div>
              </div>
            )}
            {/* Barre de recherche */}
            {persos.length > 0 && <SearchBar value={searchPerso} onChange={setSearchPerso} placeholder="Rechercher par nom, alias, pouvoir..." />}

            {/* Filtre par rôle */}
            {persos.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                {([
                  { key:"Tout", label:"Tous", color:"#f43f5e", emoji:"👥" },
                  { key:"hero", label:"Héros", color:"#22c55e", emoji:"🦸" },
                  { key:"vilain", label:"Vilains", color:"#ef4444", emoji:"💀" },
                  { key:"civil", label:"Civils", color:"#3b82f6", emoji:"🧑" },
                ] as const).map(r => {
                  const active = roleFilter === r.key;
                  return (
                    <button key={r.key} onClick={()=>setRoleFilter(r.key)} style={{ background: active ? r.color+"22" : "#ffffff08", border: active ? `1.5px solid ${r.color}` : "1px solid #ffffff20", borderRadius:20, padding:"5px 14px", color: active ? r.color : "#888", cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400, display:"flex", alignItems:"center", gap:5, outline:"none" }}>
                      {r.emoji} {r.label}
                      {r.key !== "Tout" && <span style={{ background: active ? r.color+"33" : "#ffffff10", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700, color: active ? r.color : "#666", marginLeft:2 }}>
                        {persos.filter(p=>p.role===r.key).length}
                      </span>}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredPersos.length===0
              ? <p style={{ color:"#666", textAlign:"center", marginTop:40 }}>{searchPerso || niveauFilter!=="Tout" || roleFilter!=="Tout" ? "Aucun personnage trouvé." :"Aucun personnage. Crée ton premier guerrier !"}</p>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:14 }}>
                  {filteredPersos.map(p=>{
                    const inf = powerLabel(p.score);
                    return (
                      <div key={p.id} style={{ background:`linear-gradient(160deg, #1a0010 0%, #0d0008 100%)`, border:`1.5px solid ${inf.color}44`, borderRadius:14, overflow:"hidden" }}>
                        {/* Zone image : hauteur naturelle, défile avec la carte */}
                        <div style={{ position:"relative", background:p.image?"#000":`${inf.color}11` }}>
                          {p.image
                            ? <img src={p.image} alt={p.nom} style={{ width:"100%", display:"block", objectFit:"cover" }} />
                            : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:140, fontSize:60 }}>{p.role==="hero"?"🦸":p.role==="vilain"?"💀":"🧑"}</div>}
                          {/* Dégradé bas */}
                          {p.image && <div style={{ position:"absolute", bottom:0, left:0, right:0, height:50, background:"linear-gradient(transparent,#0d0008)" }} />}
                          {/* Badge rôle en haut à gauche */}
                          <div style={{ position:"absolute", top:6, left:6 }}>
                            {p.role==="hero" && <span style={{ background:"#22c55e33", border:"1px solid #22c55e88", borderRadius:6, padding:"2px 7px", fontSize:10, fontWeight:700, color:"#22c55e" }}>🦸 HÉROS</span>}
                            {p.role==="civil" && <span style={{ background:"#3b82f633", border:"1px solid #3b82f688", borderRadius:6, padding:"2px 7px", fontSize:10, fontWeight:700, color:"#3b82f6" }}>🧑 CIVIL</span>}
                            {p.role==="vilain" && <span style={{ background:"#ef444433", border:"1px solid #ef444488", borderRadius:6, padding:"2px 7px", fontSize:10, fontWeight:700, color:"#ef4444" }}>💀 VILAIN</span>}
                          </div>
                          {/* Niveau de danger pour les vilains */}
                          {p.role==="vilain" && p.danger_rank && (
                            <div style={{ position:"absolute", top:6, right:6 }}>
                              <span style={{ background:dangerRankColor[p.danger_rank]+"44", border:`1.5px solid ${dangerRankColor[p.danger_rank]}`, borderRadius:6, padding:"2px 8px", fontSize:12, fontWeight:800, color:dangerRankColor[p.danger_rank], letterSpacing:1 }}>{p.danger_rank}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ padding:"10px 12px" }}>
                          <div style={{ fontWeight:700, fontSize:15, color:"#eee", marginBottom:2 }}>{p.nom}</div>
                          {p.role==="hero" && p.nom_heros && (
                            <div style={{ fontSize:12, color:"#22c55e", marginBottom:4, fontStyle:"italic" }}>✦ {p.nom_heros}</div>
                          )}
                          {p.role==="vilain" && p.danger_rank && (
                            <div style={{ fontSize:12, color:dangerRankColor[p.danger_rank], marginBottom:4, fontWeight:700 }}>Danger : {p.danger_rank}</div>
                          )}
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                            {p.types.map(t=><Badge key={t} text={t} color={inf.color} />)}
                            {(p.pouvoirs_custom||[]).map((pc,i)=><Badge key={`pc${i}`} text={pc} color="#f43f5e" />)}
                          </div>
                          <div style={{ fontSize:40, fontWeight:700, color:inf.color, textAlign:"center" }}>{p.score}</div>
                          <div style={{ fontSize:11, color:"#888", textAlign:"center" }}>/10</div>
                          <div style={{ textAlign:"center", marginBottom:8 }}><Badge text={inf.label} color={inf.color} /></div>
                          {p.description && <div style={{ fontSize:12, color:"#ccc", fontStyle:"italic", marginBottom:4 }}>{p.description}</div>}
                          {p.description_pouvoirs && <div style={{ fontSize:12, color:"#f43f5e99", fontStyle:"italic" }}>⚡ {p.description_pouvoirs}</div>}
                          <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end", gap:8 }}>
                            <button onClick={()=>setModalPerso(p)} style={{ background:"none", border:"none", color:"#f43f5e", cursor:"pointer", fontSize:16 }}>🔍</button>
                            <button onClick={()=>startEdit(p)} style={{ background:"none", border:"none", color:"#f43f5e", cursor:"pointer", fontSize:16 }}>✏️</button>
                            <DeleteBtn onConfirm={()=>setPersos(ps=>ps.filter(x=>x.id!==p.id))} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </>
        );
      })()}

      {/* Modal détail personnage */}
      {modalPerso && (() => {
        const inf = powerLabel(modalPerso.score);
        const sliderLabels: Record<string,string> = { portee:"Portée", controle:"Contrôle", destruction:"Destruction", vitesse:"Vitesse", regen:"Régénération", limite:"Limites / coût" };
        return (
          <DetailModal
            open={true}
            onClose={()=>setModalPerso(null)}
            title={modalPerso.nom}
            subtitle={modalPerso.types.length>0 ? modalPerso.types.join(" · ") : undefined}
            image={modalPerso.image}
            imagePlaceholder="💀"
            accentColor={inf.color}
          >
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <Badge text={inf.label} color={inf.color} />
              <span style={{ fontSize:28, fontWeight:800, color:inf.color }}>{modalPerso.score}</span>
              <span style={{ fontSize:13, color:"#666" }}>/10</span>
              {modalPerso.role==="hero" && <Badge text="🦸 Héros" color="#22c55e" />}
              {modalPerso.role==="civil" && <Badge text="🧑 Civil" color="#3b82f6" />}
              {modalPerso.role==="vilain" && <Badge text="💀 Vilain" color="#ef4444" />}
              {modalPerso.role==="vilain" && modalPerso.danger_rank && (
                <span style={{ background:dangerRankColor[modalPerso.danger_rank]+"33", border:`2px solid ${dangerRankColor[modalPerso.danger_rank]}`, borderRadius:8, padding:"3px 12px", fontSize:15, fontWeight:800, color:dangerRankColor[modalPerso.danger_rank], letterSpacing:2 }}>Danger {modalPerso.danger_rank}</span>
              )}
            </div>
            {modalPerso.role==="hero" && modalPerso.nom_heros && (
              <div style={{ background:"#22c55e12", border:"1px solid #22c55e33", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>🦸</span>
                <div>
                  <div style={{ fontSize:11, color:"#888" }}>Alias / Nom de héros</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#22c55e" }}>{modalPerso.nom_heros}</div>
                </div>
              </div>
            )}
            {modalPerso.types.length>0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {modalPerso.types.map(t=><Badge key={t} text={t} color={inf.color} />)}
              </div>
            )}
            {(modalPerso.pouvoirs_custom||[]).length>0 && (
              <div style={{ background:"#f43f5e12", border:"1px solid #f43f5e33", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>⚡ Pouvoirs</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {modalPerso.pouvoirs_custom.map((pc,i)=><Badge key={i} text={pc} color="#f43f5e" />)}
                </div>
              </div>
            )}
            {(() => {
              const modalRadar = (["portee","controle","destruction","vitesse","regen","limite"] as const).map(k=>({ key:k, label:sliderLabels[k] }));
              const size=220, cx=size/2, cy=size/2, r=80, n=modalRadar.length;
              const angle=(i:number)=>(Math.PI*2*i)/n-Math.PI/2;
              const pt=(i:number,frac:number)=>({ x:cx+r*frac*Math.cos(angle(i)), y:cy+r*frac*Math.sin(angle(i)) });
              const hexPts=(frac:number)=>Array.from({length:n},(_,i)=>pt(i,frac)).map(p=>`${p.x},${p.y}`).join(" ");
              const dataPts=modalRadar.map((s,i)=>pt(i,modalPerso[s.key]/10)).map(p=>`${p.x},${p.y}`).join(" ");
              return (
                <div style={{ marginBottom:14 }}>
                  <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display:"block", maxWidth:240, margin:"0 auto" }}>
                    {[0.2,0.4,0.6,0.8,1.0].map((frac,li)=><polygon key={li} points={hexPts(frac)} fill="none" stroke="#ffffff18" strokeWidth={0.8}/>)}
                    {modalRadar.map((_,i)=>{const p=pt(i,1);return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#ffffff20" strokeWidth={0.8}/>;} )}
                    <polygon points={dataPts} fill={inf.color+"44"} stroke={inf.color} strokeWidth={2} strokeLinejoin="round"/>
                    {modalRadar.map((s,i)=>{const p=pt(i,modalPerso[s.key]/10);return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={inf.color}/>;} )}
                    {modalRadar.map((s,i)=>{
                      const a=angle(i), lx=cx+(r+16)*Math.cos(a), ly=cy+(r+16)*Math.sin(a);
                      const anchor=Math.abs(Math.cos(a))<0.1?"middle":Math.cos(a)>0?"start":"end";
                      return <text key={i} x={lx} y={ly+4} textAnchor={anchor} fontSize="9" fill="#cccccc" fontFamily="'Segoe UI',system-ui,sans-serif">{s.label}</text>;
                    })}
                  </svg>
                </div>
              );
            })()}
            {modalPerso.description && <div style={{ background:"#ffffff08", borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>📋 Description</div>
              <div style={{ fontSize:13, color:"#ccc", lineHeight:1.6 }}>{modalPerso.description}</div>
            </div>}
            {modalPerso.description_pouvoirs && <div style={{ background:"#f43f5e0a", border:"1px solid #f43f5e22", borderRadius:10, padding:"10px 14px" }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>⚡ Description des pouvoirs</div>
              <div style={{ fontSize:13, color:"#f43f5ecc", lineHeight:1.6 }}>{modalPerso.description_pouvoirs}</div>
            </div>}
          </DetailModal>
        );
      })()}
    </div>
  );
}


// ── SECTION 6 : Music Studio ─────────────────────────────────────────────────
const MUSIC_COLOR = "#0891b2";
const MUSIC_ACCENT = "#22d3ee";

const BEAT_ROWS = [
  { name:"Kick",    emoji:"🥁", color:"#f97316", freq:60,   type:"sine"     },
  { name:"Snare",   emoji:"💥", color:"#ef4444", freq:200,  type:"triangle" },
  { name:"Hi-Hat",  emoji:"🔔", color:"#eab308", freq:800,  type:"square"   },
  { name:"Bass",    emoji:"🎸", color:"#a855f7", freq:80,   type:"sawtooth" },
  { name:"Synth 1", emoji:"🎹", color:"#22d3ee", freq:440,  type:"sine"     },
  { name:"Synth 2", emoji:"🎵", color:"#6366f1", freq:330,  type:"triangle" },
  { name:"FX",      emoji:"✨", color:"#ec4899", freq:1200, type:"sawtooth" },
  { name:"Pad",     emoji:"🌊", color:"#10b981", freq:220,  type:"sine"     },
] as const;

const STEPS = 16;
const BPM_MIN = 60;
const BPM_MAX = 200;

type RowDef = typeof BEAT_ROWS[number];
type Grid = boolean[][];

function makeEmptyGrid(): Grid {
  return BEAT_ROWS.map(() => Array(STEPS).fill(false));
}

function playSound(ctx: AudioContext, row: RowDef, vol: number) {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (row.name === "Kick") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(row.freq, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.15);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain); osc.start(now); osc.stop(now + 0.25);
  } else if (row.name === "Snare" || row.name === "Hi-Hat") {
    const dur = row.name === "Hi-Hat" ? 0.05 : 0.15;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol * (row.name === "Hi-Hat" ? 0.4 : 0.7), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(gain); src.start(now);
  } else {
    const osc = ctx.createOscillator();
    osc.type = row.type as OscillatorType;
    osc.frequency.setValueAtTime(row.freq, now);
    gain.gain.setValueAtTime(vol * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain); osc.start(now); osc.stop(now + 0.4);
  }
}

interface SavedBeat {
  id: string; name: string; grid: Grid; bpm: number; createdAt: string;
}

function MusicStudio() {
  const [grid, setGrid] = useState<Grid>(makeEmptyGrid);
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [volume, setVolume] = useState(0.7);
  const [rowVolumes, setRowVolumes] = useState<number[]>(BEAT_ROWS.map(() => 1));
  const [savedBeats, setSavedBeats] = useState<SavedBeat[]>(() => loadFromStorage<SavedBeat>("music_beats"));
  const [beatName, setBeatName] = useState("");
  const [activeTab, setActiveTab] = useState<"sequencer"|"library">("sequencer");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const gridRef = useRef(grid);
  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const rowVolRef = useRef(rowVolumes);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { rowVolRef.current = rowVolumes; }, [rowVolumes]);
  useEffect(() => { localStorage.setItem("music_beats", JSON.stringify(savedBeats)); }, [savedBeats]);

  const getCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const stopPlayback = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null; stepRef.current = 0;
    setCurrentStep(-1); setPlaying(false);
  };

  const startTick = (ms: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const step = stepRef.current;
      setCurrentStep(step);
      const ctx = getCtx();
      gridRef.current.forEach((row, ri) => {
        if (row[step]) playSound(ctx, BEAT_ROWS[ri], volumeRef.current * rowVolRef.current[ri]);
      });
      stepRef.current = (step + 1) % STEPS;
    }, ms);
  };

  const startPlayback = () => {
    stepRef.current = 0;
    startTick((60 / bpm / 4) * 1000);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    startTick((60 / bpm / 4) * 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const toggleStep = (ri: number, si: number) =>
    setGrid(g => g.map((row, r) => r === ri ? row.map((v, s) => s === si ? !v : v) : row));

  const clearGrid = () => { stopPlayback(); setGrid(makeEmptyGrid()); };

  const randomize = () => {
    stopPlayback();
    setGrid(BEAT_ROWS.map((_, ri) =>
      Array.from({ length: STEPS }, (_, si) => {
        if (ri === 0) return si % 4 === 0;
        if (ri === 1) return si === 4 || si === 12;
        if (ri === 2) return Math.random() > 0.4;
        return Math.random() > 0.65;
      })
    ));
  };

  const saveBeat = () => {
    const name = beatName.trim().slice(0, 40) || `Beat ${savedBeats.length + 1}`;
    if (savedBeats.length >= 50) { alert("Limite de 50 beats !"); return; }
    const beat: SavedBeat = { id: genId(), name, grid: JSON.parse(JSON.stringify(grid)), bpm, createdAt: new Date().toLocaleDateString("fr-FR") };
    setSavedBeats(bs => [beat, ...bs]);
    setBeatName("");
  };

  const loadBeat = (b: SavedBeat) => { stopPlayback(); setGrid(b.grid); setBpm(b.bpm); setActiveTab("sequencer"); };
  const deleteBeat = (id: string) => setSavedBeats(bs => bs.filter(b => b.id !== id));
  const previewRow = (ri: number) => playSound(getCtx(), BEAT_ROWS[ri], volume * rowVolumes[ri]);

  const inputStyle: React.CSSProperties = { background:"#ffffff0f", border:"1px solid #ffffff25", borderRadius:8, padding:"8px 12px", color:"#eee", fontSize:14, boxSizing:"border-box" };

  return (
    <div>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0c1a2e,#061018)", border:"1px solid #0891b255", borderRadius:16, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>🎵 Music Studio</div>
          <div style={{ fontSize:12, color:MUSIC_ACCENT, marginTop:2 }}>Crée tes beats & sons instrumentaux</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {(["sequencer","library"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background:activeTab===tab?MUSIC_COLOR+"33":"#ffffff10", border:`1px solid ${activeTab===tab?MUSIC_COLOR:"#ffffff20"}`, borderRadius:8, color:activeTab===tab?MUSIC_ACCENT:"#aaa", padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {tab === "sequencer" ? "🎛️ Séquenceur" : `📂 Biblio (${savedBeats.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "sequencer" && (
        <>
          {/* Transport Controls */}
          <div style={{ background:"#ffffff06", border:"1px solid #ffffff12", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", flexWrap:"wrap", gap:14, alignItems:"center" }}>
            <button onClick={() => playing ? stopPlayback() : startPlayback()}
              style={{ background:playing?"#ef444422":MUSIC_COLOR+"44", border:`2px solid ${playing?"#ef4444":MUSIC_COLOR}`, borderRadius:12, color:playing?"#ef4444":MUSIC_ACCENT, padding:"10px 24px", cursor:"pointer", fontSize:20, fontWeight:800 }}>
              {playing ? "⏹" : "▶"}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, color:"#aaa" }}>BPM</span>
              <input type="range" min={BPM_MIN} max={BPM_MAX} value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ width:90 }} />
              <span style={{ fontSize:16, fontWeight:800, color:MUSIC_ACCENT, minWidth:34 }}>{bpm}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>🔊</span>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVolume(Number(e.target.value))} style={{ width:70 }} />
              <span style={{ fontSize:12, color:"#aaa" }}>{Math.round(volume * 100)}%</span>
            </div>
            <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
              <button onClick={randomize} style={{ background:"#a855f722", border:"1px solid #a855f755", borderRadius:8, color:"#a855f7", padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600 }}>🎲 Aléatoire</button>
              <button onClick={clearGrid} style={{ background:"#ffffff08", border:"1px solid #ffffff20", borderRadius:8, color:"#aaa", padding:"6px 14px", cursor:"pointer", fontSize:12 }}>🗑 Vider</button>
            </div>
          </div>

          {/* Step playhead */}
          <div style={{ display:"flex", gap:2, marginBottom:6, paddingLeft:92 }}>
            {Array.from({ length: STEPS }, (_, i) => (
              <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i===currentStep?MUSIC_ACCENT:"#ffffff10", transition:"background 0.05s", minWidth:0 }} />
            ))}
          </div>

          {/* Grid */}
          <div style={{ background:"#ffffff04", border:"1px solid #ffffff0f", borderRadius:14, padding:"12px 14px", marginBottom:16, overflowX:"auto" }}>
            {BEAT_ROWS.map((row, ri) => (
              <div key={ri} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                <div style={{ width:88, minWidth:88, display:"flex", alignItems:"center", gap:5 }}>
                  <button onClick={() => previewRow(ri)} title="Écouter" style={{ background:"none", border:"none", cursor:"pointer", fontSize:15, padding:0 }}>{row.emoji}</button>
                  <span style={{ fontSize:10, color:row.color, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:60 }}>{row.name}</span>
                </div>
                {Array.from({ length: STEPS }, (_, si) => {
                  const on = grid[ri][si];
                  const cur = si === currentStep;
                  return (
                    <button key={si} onClick={() => toggleStep(ri, si)} style={{
                      flex:1, minWidth:0, height:30,
                      background: on ? (cur ? "#fff" : row.color) : cur ? "#ffffff18" : si%4===0 ? "#ffffff0b" : "#ffffff06",
                      border:`1px solid ${on ? row.color+"88" : "#ffffff10"}`,
                      borderRadius:4, cursor:"pointer",
                      boxShadow: on && cur ? `0 0 8px ${row.color}` : "none",
                      transition:"background 0.05s, box-shadow 0.05s",
                    }} />
                  );
                })}
                <div style={{ width:58, minWidth:58 }}>
                  <input type="range" min={0} max={1} step={0.1} value={rowVolumes[ri]}
                    onChange={e => setRowVolumes(rv => rv.map((v, i) => i === ri ? Number(e.target.value) : v))}
                    style={{ width:"100%" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {BEAT_ROWS.map(row => (
              <span key={row.name} style={{ background:row.color+"18", border:`1px solid ${row.color}44`, borderRadius:20, padding:"2px 10px", fontSize:11, color:row.color }}>
                {row.emoji} {row.name}
              </span>
            ))}
          </div>

          {/* Save */}
          <div style={{ background:"#0891b210", border:"1px solid #0891b233", borderRadius:12, padding:"14px 18px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:13, color:"#aaa" }}>💾</span>
            <input value={beatName} onChange={e => setBeatName(e.target.value)} onKeyDown={e => e.key==="Enter" && saveBeat()} placeholder="Nom du beat..." maxLength={40} style={{ ...inputStyle, flex:1, minWidth:160 }} />
            <button onClick={saveBeat} style={{ background:MUSIC_COLOR, border:"none", borderRadius:8, color:"#fff", padding:"9px 20px", cursor:"pointer", fontSize:13, fontWeight:700 }}>Sauvegarder</button>
          </div>
        </>
      )}

      {activeTab === "library" && (
        <div>
          {savedBeats.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎵</div>
              <div style={{ fontSize:16, color:"#555" }}>Aucun beat sauvegardé</div>
              <div style={{ fontSize:13, color:"#333", marginTop:6 }}>Crée ton premier beat dans le séquenceur !</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
              {savedBeats.map(b => (
                <div key={b.id} style={{ background:"#ffffff08", border:"1px solid #0891b230", borderRadius:12, padding:"14px 16px" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#eee", marginBottom:4 }}>🎵 {sanitize(b.name)}</div>
                  <div style={{ fontSize:12, color:MUSIC_ACCENT, marginBottom:2 }}>♩ {b.bpm} BPM</div>
                  <div style={{ fontSize:11, color:"#555", marginBottom:10 }}>📅 {b.createdAt}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:12 }}>
                    {b.grid.map((row, ri) => (
                      <div key={ri} style={{ display:"flex", gap:1 }}>
                        {row.map((on, si) => (
                          <div key={si} style={{ flex:1, height:4, borderRadius:1, background:on?BEAT_ROWS[ri].color:"#ffffff0a" }} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                    <button onClick={() => loadBeat(b)} style={{ background:MUSIC_COLOR+"33", border:`1px solid ${MUSIC_COLOR}55`, borderRadius:8, color:MUSIC_ACCENT, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>▶ Charger</button>
                    <DeleteBtn onConfirm={() => deleteBeat(b.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
const ICONS = ["🃏","⚔️","🦕","📺","💥","🎵"];
const COLORS = ["#7c3aed","#b45309","#065f46","#1d4ed8","#be123c","#0891b2"];

export default function App() {
  const [active, setActive] = useState(0);
  const sections = [<CartePerso />, <Arsenal />, <DinoCodex />, <MesAnimes />, <Createur />, <MusicStudio />];
  return (
    <div style={{ minHeight:"100vh", background:"#07070f", color:"#eee", fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background:"linear-gradient(90deg, #1a0a2e 0%, #0d0018 100%)", borderBottom:"1px solid #ffffff15", padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:"#fff", letterSpacing:1 }}>
              <span style={{ color:"#a78bfa" }}>⚡</span> Anime Universe Hub
            </h1>
            <p style={{ margin:"4px 0 0", fontSize:12, color:"#666" }}>Ton univers anime, tout en un.</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#a78bfa18", border:"1px solid #a78bfa44", borderRadius:20, padding:"5px 14px" }}>
            <span style={{ fontSize:14 }}>✨</span>
            <span style={{ fontSize:12, color:"#aaa" }}>Créé par</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#a78bfa", letterSpacing:0.5 }}>kikux</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", borderBottom:"1px solid #ffffff10", overflowX:"auto" }}>
        {SECTIONS.map((s,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{ flex:"0 0 auto", background:active===i?COLORS[i]+"22":"none", border:"none", borderBottom:active===i?`2px solid ${COLORS[i]}`:"2px solid transparent", color:active===i?COLORS[i]:"#888", padding:"12px 16px", cursor:"pointer", fontSize:13, fontWeight:active===i?700:400, whiteSpace:"nowrap" }}>
            {ICONS[i]} {s}
          </button>
        ))}
      </div>
      <div style={{ padding:"20px 16px", maxWidth:1000, margin:"0 auto" }}>
        {sections[active]}
      </div>
    </div>
  );
}

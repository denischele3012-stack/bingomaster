import { useState, useRef, useCallback, useEffect } from "react";

const STORAGE_KEY = "bingo_organizers";

function loadOrganizers() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : {};
  } catch { return {}; }
}
function saveOrganizers(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const PRESET_CELLS = {
  linea_h0: [[0,0],[0,1],[0,2],[0,3],[0,4]],
  linea_h1: [[1,0],[1,1],[1,2],[1,3],[1,4]],
  linea_h2: [[2,0],[2,1],[2,2],[2,3],[2,4]],
  linea_h3: [[3,0],[3,1],[3,2],[3,3],[3,4]],
  linea_h4: [[4,0],[4,1],[4,2],[4,3],[4,4]],
  linea_v0: [[0,0],[1,0],[2,0],[3,0],[4,0]],
  linea_v1: [[0,1],[1,1],[2,1],[3,1],[4,1]],
  linea_v2: [[0,2],[1,2],[2,2],[3,2],[4,2]],
  linea_v3: [[0,3],[1,3],[2,3],[3,3],[4,3]],
  linea_v4: [[0,4],[1,4],[2,4],[3,4],[4,4]],
  diagonal_p: [[0,0],[1,1],[2,2],[3,3],[4,4]],
  diagonal_s: [[0,4],[1,3],[2,2],[3,1],[4,0]],
  esquinas: [[0,0],[0,4],[4,0],[4,4]],
  letra_L: [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]],
  letra_T: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,2],[2,2],[3,2],[4,2]],
  llena: Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>[r,c])).flat(),
};

const PRESETS = [
  { id:"linea_h", label:"Línea horizontal (fila 3)", cells: PRESET_CELLS.linea_h2 },
  { id:"linea_v", label:"Línea vertical (col B)", cells: PRESET_CELLS.linea_v0 },
  { id:"diagonal_p", label:"Diagonal principal", cells: PRESET_CELLS.diagonal_p },
  { id:"esquinas", label:"4 esquinas", cells: PRESET_CELLS.esquinas },
  { id:"letra_L", label:"Letra L", cells: PRESET_CELLS.letra_L },
  { id:"letra_T", label:"Letra T", cells: PRESET_CELLS.letra_T },
  { id:"llena", label:"Cartón lleno", cells: PRESET_CELLS.llena },
];

function cellsToKey(cells) {
  return cells.map(([r,c])=>`${r},${c}`).sort().join("|");
}

function checkPatternCells(grid, called, cells) {
  return cells.every(([r,c]) => grid[r][c] === 0 || called.has(grid[r][c]));
}

function missingForCells(grid, called, cells) {
  return cells.filter(([r,c]) => grid[r][c] !== 0 && !called.has(grid[r][c])).map(([r,c]) => grid[r][c]);
}

function MiniGrid({ selected, onToggle, disabled }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,32px)", gap:3 }}>
      {["B","I","N","G","O"].map(l => <div key={l} style={{textAlign:"center",fontSize:11,fontWeight:500,color:"#178bca"}}>{l}</div>)}
      {Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>{
        const isCenter = r===2&&c===2;
        const sel = selected.some(([sr,sc])=>sr===r&&sc===c);
        return (
          <div key={`${r}-${c}`} onClick={() => !disabled && !isCenter && onToggle(r,c)}
            style={{
              width:32,height:32,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,fontWeight:500,cursor:isCenter||disabled?"default":"pointer",
              background: isCenter ? "#178bca" : sel ? "#1D9E75" : "var(--color-background-secondary)",
              color: isCenter||sel ? "#fff" : "var(--color-text-secondary)",
              border: sel&&!isCenter ? "1px solid #0F6E56" : "1px solid var(--color-border-tertiary)",
              userSelect:"none"
            }}>
            {isCenter ? "★" : ""}
          </div>
        );
      }))}
    </div>
  );
}

function BingoCard({ tabla, called, activePatterns, wonPatterns, onBingo }) {
  const { code, grid } = tabla;
  const notifiedRef = useRef(new Set());
  const alerts = [];
  for (const p of activePatterns) {
    if (wonPatterns.includes(p.id)) continue;
    const won = checkPatternCells(grid, called, p.cells);
    if (won) { alerts.push({ id: p.id, label: p.label, type:"win" }); continue; }
    const m = missingForCells(grid, called, p.cells);
    if (m.length === 1) alerts.push({ id: p.id, label: p.label, type:"uno", missing: m[0] });
    else if (m.length === 2) alerts.push({ id: p.id, label: p.label, type:"dos", missing: m });
  }
  const hasWin = alerts.some(a => a.type==="win");
  const hasUno = alerts.some(a => a.type==="uno");

  useEffect(() => {
    for (const a of alerts) {
      if (a.type === "win" && !notifiedRef.current.has(a.id)) {
        notifiedRef.current.add(a.id);
        onBingo && onBingo({ code, grid, label: a.label });
      }
    }
  }, [JSON.stringify(alerts.map(a=>a.id+a.type))]);

  return (
    <div style={{
      border: hasWin ? "2px solid #1D9E75" : hasUno ? "2px solid #EF9F27" : "1px solid var(--color-border-tertiary)",
      borderRadius:10, padding:"8px", background:"var(--color-background-primary)", fontSize:13, position:"relative"
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontWeight:500,fontSize:12,color:"var(--color-text-secondary)"}}>#{code}</span>
        {hasWin && <span style={{background:"#1D9E75",color:"#fff",borderRadius:4,padding:"1px 6px",fontSize:11,fontWeight:500}}>¡BINGO!</span>}
        {!hasWin&&hasUno && <span style={{background:"#EF9F27",color:"#fff",borderRadius:4,padding:"1px 6px",fontSize:11,fontWeight:500}}>¡1 falta!</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:2}}>
        {["B","I","N","G","O"].map(l=><div key={l} style={{textAlign:"center",fontWeight:500,fontSize:11,color:"#178bca",padding:"2px 0"}}>{l}</div>)}
        {grid.map((row,r)=>row.map((num,c)=>{
          const isCenter=r===2&&c===2;
          const isCalled=num===0||called.has(num);
          const isMiss1=alerts.some(a=>a.type==="uno"&&a.missing===num);
          return (
            <div key={`${r}-${c}`} style={{
              textAlign:"center",padding:"3px 0",borderRadius:4,fontSize:13,fontWeight:isCalled?500:400,
              background:isCenter?"#178bca":isCalled?"#1D9E75":isMiss1?"#FAEEDA":"var(--color-background-secondary)",
              color:isCenter?"#fff":isCalled?"#fff":isMiss1?"#633806":"var(--color-text-primary)",
            }}>{isCenter?"★":num}</div>
          );
        }))}
      </div>
      {alerts.length>0 && (
        <div style={{marginTop:4,fontSize:11}}>
          {alerts.filter(a=>a.type==="uno").map(a=><div key={a.id} style={{color:"#854F0B"}}>⚡ {a.label}: falta {a.missing}</div>)}
          {alerts.filter(a=>a.type==="dos").map(a=><div key={a.id} style={{color:"var(--color-text-secondary)"}}>🎯 {a.label}: faltan {a.missing.join(", ")}</div>)}
        </div>
      )}
    </div>
  );
}

function WinPopup({ win, onClose, called }) {
  if (!win) return null;
  const { code, grid, label } = win;
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:1000,padding:16
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"var(--color-background-primary)",borderRadius:16,padding:"24px",
        textAlign:"center",maxWidth:380,width:"100%",
        border:"2px solid #1D9E75",boxShadow:"0 0 0 8px rgba(29,158,117,0.12)"
      }}>
        <div style={{fontSize:40,marginBottom:4}}>🎉</div>
        <div style={{fontSize:24,fontWeight:700,color:"#0F6E56",marginBottom:2}}>¡BINGO!</div>
        <div style={{fontSize:13,color:"#1D9E75",marginBottom:2,background:"#E1F5EE",borderRadius:8,padding:"4px 14px",display:"inline-block"}}>{label}</div>

        {/* Tabla ganadora */}
        <div style={{margin:"14px auto 0",background:"#F0FBF7",border:"2px solid #1D9E75",borderRadius:12,padding:"12px",maxWidth:260}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:500,color:"#0F6E56"}}>BingoMaster</span>
            <span style={{fontSize:12,color:"#0F6E56",fontWeight:500}}>#{code}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
            {["B","I","N","G","O"].map(l=>(
              <div key={l} style={{textAlign:"center",fontWeight:700,fontSize:12,color:"#178bca",padding:"2px 0"}}>{l}</div>
            ))}
            {grid.map((row,r)=>row.map((num,c)=>{
              const isCenter=r===2&&c===2;
              const isCalled=num===0||called.has(num);
              return (
                <div key={`${r}-${c}`} style={{
                  textAlign:"center",padding:"5px 2px",borderRadius:5,fontSize:13,fontWeight:500,
                  background:isCenter?"#178bca":isCalled?"#1D9E75":"#fff",
                  color:isCenter||isCalled?"#fff":"#333",
                  border:isCalled&&!isCenter?"1px solid #0F6E56":"1px solid #D0EEE5"
                }}>{isCenter?"★":num}</div>
              );
            }))}
          </div>
        </div>

        <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:10,marginBottom:14}}>📸 Haz screenshot aquí para reclamar tu premio</div>
        <button onClick={onClose} style={{
          padding:"10px 32px",borderRadius:8,background:"#1D9E75",color:"#fff",
          border:"none",fontWeight:500,fontSize:15,cursor:"pointer"
        }}>Continuar jugando</button>
      </div>
    </div>
  );
}

const CLAUDE_MODEL = "claude-opus-4-5";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | game
  const [organizers, setOrganizers] = useState(loadOrganizers);
  const [orgName, setOrgName] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [patterns, setPatterns] = useState([]);
  const [editingPattern, setEditingPattern] = useState(null); // null | {id,label,cells}
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternCells, setNewPatternCells] = useState([]);
  const [tablas, setTablas] = useState([]);
  const [called, setCalled] = useState(new Set());
  const [calledList, setCalledList] = useState([]);
  const [numInput, setNumInput] = useState("");
  const [wonPatterns, setWonPatterns] = useState([]);
  const [tab, setTab] = useState("tablas");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [winPopup, setWinPopup] = useState(null);
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [showNewPattern, setShowNewPattern] = useState(false);
  const fileRef = useRef();

  const persistOrgs = (data) => { setOrganizers(data); saveOrganizers(data); };

  const addOrg = () => {
    const n = orgName.trim();
    if (!n) return;
    const updated = { ...organizers, [n]: { patterns: [] } };
    persistOrgs(updated);
    setSelectedOrg(n);
    setPatterns([]);
    setOrgName("");
    setShowNewOrg(false);
  };

  const selectOrg = (name) => {
    setSelectedOrg(name);
    setPatterns(organizers[name]?.patterns || []);
  };

  const savePatterns = (pts) => {
    setPatterns(pts);
    if (!selectedOrg) return;
    const updated = { ...organizers, [selectedOrg]: { ...(organizers[selectedOrg]||{}), patterns: pts } };
    persistOrgs(updated);
  };

  const addPattern = () => {
    const n = newPatternName.trim();
    if (!n || newPatternCells.length === 0) return;
    const pt = { id: Date.now().toString(), label: n, cells: newPatternCells };
    const pts = [...patterns, pt];
    savePatterns(pts);
    setNewPatternName(""); setNewPatternCells([]); setShowNewPattern(false);
  };

  const removePattern = (id) => savePatterns(patterns.filter(p => p.id !== id));

  const applyPreset = (cells) => setNewPatternCells(cells);

  const toggleCell = (r, c) => {
    const exists = newPatternCells.some(([sr,sc])=>sr===r&&sc===c);
    setNewPatternCells(exists ? newPatternCells.filter(([sr,sc])=>!(sr===r&&sc===c)) : [...newPatternCells,[r,c]]);
  };

  const extractTablesFromPDF = useCallback(async (pdfBase64) => {
    setLoadMsg("Analizando PDF con IA...");
    const prompt = `Eres un extractor de tablas de bingo. El PDF contiene hojas con 4 tablas de bingo cada una.
Cada tabla tiene código como #0220337, grilla 5x5 con columnas B I N G O, y el centro (fila 3 col N) es libre (0).
Extrae TODAS las tablas y devuelve SOLO JSON sin markdown:
{"tablas":[{"code":"0220337","grid":[[5,20,44,48,72],[8,21,31,49,65],[10,16,0,52,74],[12,17,35,59,73],[9,19,36,56,70]]}]}
El 0 es el espacio libre. Devuelve todas las tablas.`;
    const resp = await fetch("/api/messages", {
      method:"POST", headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model:CLAUDE_MODEL, max_tokens:4000, messages:[{ role:"user", content:[
        {type:"document",source:{type:"base64",media_type:"application/pdf",data:pdfBase64}},
        {type:"text",text:prompt}
      ]}]})
    });
    const data = await resp.json();
    console.log("Respuesta API:", JSON.stringify(data));
    if (!data.content) throw new Error("Sin contenido: " + JSON.stringify(data));
    const text = data.content.map(b=>b.text||"").join("");
    return JSON.parse(text.replace(/```json|```/g,"").trim());
    
  }, []);

  const handleFiles = async (files) => {
    setLoading(true);
    const allTablas = [];
    for (const file of Array.from(files)) {
      setLoadMsg(`Leyendo ${file.name}...`);
      const base64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      try { const result = await extractTablesFromPDF(base64); if (result.tablas) allTablas.push(...result.tablas); }
      catch(e){ console.error(e); }
    }
    setTablas(prev=>{const ex=new Set(prev.map(t=>t.code));return [...prev,...allTablas.filter(t=>!ex.has(t.code))];});
    setLoading(false); setLoadMsg("");
  };

  const callNumber = () => {
    const n = parseInt(numInput.trim());
    if (!n||n<1||n>75||called.has(n)){setNumInput("");return;}
    setCalled(prev=>new Set([...prev,n]));
    setCalledList(prev=>[n,...prev]);
    setNumInput("");
  };

  const markWon = (id) => setWonPatterns(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const reset = () => { setCalled(new Set()); setCalledList([]); setWonPatterns([]); setNumInput(""); };
  const startGame = () => { reset(); setScreen("game"); setTab("tablas"); };

  const colBg=n=>{if(n<=15)return"#E6F1FB";if(n<=30)return"#EAF3DE";if(n<=45)return"#FAEEDA";if(n<=60)return"#FBEAF0";return"#EEEDFE";};
  const colTxt=n=>{if(n<=15)return"#0C447C";if(n<=30)return"#27500A";if(n<=45)return"#633806";if(n<=60)return"#72243E";return"#3C3489";};

  const winTablas = tablas.filter(t=>patterns.some(p=>!wonPatterns.includes(p.id)&&checkPatternCells(t.grid,called,p.cells)));
  const unoTablas = tablas.filter(t=>!winTablas.includes(t)&&patterns.some(p=>!wonPatterns.includes(p.id)&&missingForCells(t.grid,called,p.cells).length===1));
  const displayed = filter==="ganadoras"?winTablas:filter==="alertas"?unoTablas:tablas;

  // ── SETUP SCREEN ──
  if (screen === "setup") {
    return (
      <div style={{fontFamily:"var(--font-sans)",maxWidth:700,margin:"0 auto",padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{background:"#178bca",borderRadius:8,padding:"6px 14px",color:"#fff",fontWeight:500,fontSize:18}}>🎱 BingoMaster</div>
          <span style={{color:"var(--color-text-secondary)",fontSize:13}}>Configuración de partida</span>
        </div>

        {/* Organizador */}
        <div style={{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontWeight:500,marginBottom:12}}>1. Selecciona el organizador</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
            {Object.keys(organizers).map(n=>(
              <button key={n} onClick={()=>selectOrg(n)} style={{
                padding:"6px 14px",borderRadius:20,cursor:"pointer",fontSize:13,
                border: selectedOrg===n?"1px solid #178bca":"1px solid var(--color-border-secondary)",
                background: selectedOrg===n?"#E6F1FB":"transparent",
                color: selectedOrg===n?"#0C447C":"var(--color-text-primary)"
              }}>{n}</button>
            ))}
            <button onClick={()=>setShowNewOrg(v=>!v)} style={{padding:"6px 14px",borderRadius:20,cursor:"pointer",fontSize:13,border:"1px dashed var(--color-border-secondary)",background:"transparent",color:"var(--color-text-secondary)"}}>+ Nuevo organizador</button>
          </div>
          {showNewOrg && (
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <input value={orgName} onChange={e=>setOrgName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addOrg()} placeholder="Nombre del organizador (ej: María Fer)" style={{flex:1,padding:"7px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",fontSize:13}}/>
              <button onClick={addOrg} style={{padding:"7px 16px",borderRadius:8,background:"#178bca",color:"#fff",border:"none",cursor:"pointer",fontWeight:500}}>Guardar</button>
            </div>
          )}
        </div>

        {/* Patrones */}
        <div style={{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontWeight:500,marginBottom:4}}>2. Patrones de premios</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:12}}>{selectedOrg ? `Los patrones de ${selectedOrg} se guardan automáticamente.` : "Selecciona un organizador para guardar los patrones."}</div>
          
          {patterns.length > 0 && (
            <div style={{display:"grid",gap:8,marginBottom:12}}>
              {patterns.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:"1px solid var(--color-border-tertiary)",borderRadius:8,background:"var(--color-background-secondary)"}}>
                  <span style={{fontSize:13,fontWeight:500,flex:1}}>{p.label}</span>
                  <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{p.cells.length} celdas</span>
                  <button onClick={()=>removePattern(p.id)} style={{fontSize:12,padding:"3px 10px",borderRadius:6,border:"1px solid #F7C1C1",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer"}}>Eliminar</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={()=>setShowNewPattern(v=>!v)} style={{fontSize:13,padding:"7px 16px",borderRadius:8,border:"1px dashed var(--color-border-secondary)",background:"transparent",cursor:"pointer",color:"var(--color-text-secondary)"}}>+ Crear patrón</button>

          {showNewPattern && (
            <div style={{marginTop:14,padding:"14px",border:"1px solid var(--color-border-secondary)",borderRadius:10,background:"var(--color-background-secondary)"}}>
              <div style={{fontWeight:500,fontSize:13,marginBottom:10}}>Nuevo patrón</div>
              <input value={newPatternName} onChange={e=>setNewPatternName(e.target.value)} placeholder="Nombre del premio (ej: Letra L, Línea central...)" style={{width:"100%",padding:"7px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",fontSize:13,marginBottom:12,boxSizing:"border-box"}}/>
              <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>Usa un preset o haz clic en las celdas para crear el patrón:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {PRESETS.map(pr=>(
                  <button key={pr.id} onClick={()=>applyPreset(pr.cells)} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",color:"var(--color-text-secondary)"}}>{pr.label}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
                <MiniGrid selected={newPatternCells} onToggle={toggleCell} />
                <div style={{flex:1,minWidth:140}}>
                  <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>{newPatternCells.length} celdas seleccionadas</div>
                  <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>★ = espacio libre (siempre marcado)</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button onClick={addPattern} style={{padding:"8px 20px",borderRadius:8,background:"#178bca",color:"#fff",border:"none",fontWeight:500,fontSize:13,cursor:"pointer"}}>Guardar patrón</button>
                <button onClick={()=>{setShowNewPattern(false);setNewPatternCells([]);setNewPatternName("");}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontSize:13}}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* PDFs */}
        <div style={{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:12,padding:"16px",marginBottom:20}}>
          <div style={{fontWeight:500,marginBottom:8}}>3. Carga tus tablas (PDF)</div>
          {tablas.length > 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:13,color:"#0F6E56",background:"#E1F5EE",padding:"6px 14px",borderRadius:8}}>{tablas.length} tablas cargadas ✓</span>
              <button onClick={()=>fileRef.current.click()} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer"}}>+ Agregar más PDFs</button>
              <button onClick={()=>setTablas([])} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:"1px solid #F7C1C1",background:"#FCEBEB",color:"#A32D2D",cursor:"pointer"}}>Limpiar</button>
            </div>
          ) : (
            <div onClick={()=>fileRef.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}
              style={{border:"2px dashed var(--color-border-secondary)",borderRadius:10,padding:"28px",textAlign:"center",cursor:"pointer"}}>
              {loading ? <p style={{color:"var(--color-text-secondary)"}}>{loadMsg}</p> :
                <div><div style={{fontSize:32,marginBottom:6}}>📄</div><p style={{fontWeight:500,margin:"0 0 4px"}}>Sube tus PDFs de bingo</p><p style={{fontSize:13,color:"var(--color-text-secondary)",margin:0}}>Clic o arrastra. La IA extrae todas las tablas automáticamente.</p></div>}
            </div>
          )}
          {loading && tablas.length > 0 && <p style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:8}}>⏳ {loadMsg}</p>}
          <input ref={fileRef} type="file" accept=".pdf" multiple onChange={e=>handleFiles(e.target.files)} style={{display:"none"}}/>
        </div>

        <button
          onClick={startGame}
          disabled={tablas.length===0||patterns.length===0}
          style={{
            width:"100%",padding:"14px",borderRadius:10,fontSize:16,fontWeight:500,cursor:tablas.length===0||patterns.length===0?"not-allowed":"pointer",
            background:tablas.length>0&&patterns.length>0?"#1D9E75":"var(--color-background-secondary)",
            color:tablas.length>0&&patterns.length>0?"#fff":"var(--color-text-secondary)",
            border:"none",transition:"background 0.2s"
          }}
        >
          {tablas.length===0?"Carga tus PDFs para continuar":patterns.length===0?"Crea al menos un patrón de premio":"🚀 ¡Iniciar partida!"}
        </button>
      </div>
    );
  }

  // ── GAME SCREEN ──
  return (
    <div style={{fontFamily:"var(--font-sans)",maxWidth:900,margin:"0 auto",padding:"12px 16px"}}>
      <WinPopup win={winPopup} onClose={()=>setWinPopup(null)} called={called}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{background:"#178bca",borderRadius:8,padding:"6px 12px",color:"#fff",fontWeight:500,fontSize:16}}>🎱 BingoMaster</div>
        {selectedOrg && <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>— {selectedOrg}</span>}
        <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{tablas.length} tablas</span>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <button onClick={reset} style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",color:"var(--color-text-secondary)"}}>Reiniciar</button>
          <button onClick={()=>setScreen("setup")} style={{fontSize:12,padding:"4px 10px",borderRadius:6,border:"1px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",color:"var(--color-text-secondary)"}}>⚙ Configurar</button>
        </div>
      </div>

      {/* Ingreso de número siempre visible */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input type="number" min={1} max={75} value={numInput} onChange={e=>setNumInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&callNumber()}
          placeholder="Número cantado (1-75)" style={{flex:1,fontSize:18,padding:"10px 14px",borderRadius:8,border:"1px solid var(--color-border-secondary)"}}/>
        <button onClick={callNumber} style={{padding:"10px 24px",borderRadius:8,background:"#178bca",color:"#fff",border:"none",fontWeight:500,fontSize:16,cursor:"pointer"}}>Marcar</button>
      </div>

      {calledList.length > 0 && (
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {calledList.slice(0,15).map((n,i)=>(
            <div key={i} style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
              fontWeight:i===0?500:400,fontSize:i===0?15:13,
              background:i===0?"#178bca":colBg(n),color:i===0?"#fff":colTxt(n),
              border:i===0?"none":"1px solid var(--color-border-tertiary)"}}>
              {n}
            </div>
          ))}
          {calledList.length>15 && <div style={{fontSize:12,color:"var(--color-text-secondary)",alignSelf:"center"}}>+{calledList.length-15} más</div>}
        </div>
      )}

      <div style={{display:"flex",gap:4,marginBottom:14,borderBottom:"1px solid var(--color-border-tertiary)"}}>
        {[["tablas","Mis tablas"],["premios","Premios"],["numeros","Tablero"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:"7px 14px",border:"none",background:"transparent",cursor:"pointer",
            fontWeight:tab===k?500:400,fontSize:14,
            borderBottom:tab===k?"2px solid #178bca":"2px solid transparent",
            color:tab===k?"#178bca":"var(--color-text-secondary)"
          }}>{l}
          {k==="tablas"&&winTablas.length>0&&<span style={{marginLeft:5,background:"#1D9E75",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11}}>{winTablas.length}</span>}
          {k==="tablas"&&unoTablas.length>0&&winTablas.length===0&&<span style={{marginLeft:5,background:"#EF9F27",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11}}>{unoTablas.length}</span>}
          </button>
        ))}
      </div>

      {tab==="tablas" && (
        <div>
          <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
            {[["all","Todas"],["ganadoras","¡Ganadoras!"],["alertas","¡1 falta!"]].map(([k,l])=>(
              <button key={k} onClick={()=>setFilter(k)} style={{fontSize:12,padding:"4px 10px",borderRadius:6,cursor:"pointer",
                border:filter===k?"1px solid #178bca":"1px solid var(--color-border-secondary)",
                background:filter===k?"#E6F1FB":"transparent",color:filter===k?"#0C447C":"var(--color-text-secondary)"}}>
                {l}{k==="ganadoras"&&winTablas.length>0?` (${winTablas.length})`:k==="alertas"&&unoTablas.length>0?` (${unoTablas.length})`:""}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
            {displayed.map(t=><BingoCard key={t.code} tabla={t} called={called} activePatterns={patterns} wonPatterns={wonPatterns} onBingo={setWinPopup}/>)}
          </div>
          {displayed.length===0&&<p style={{color:"var(--color-text-secondary)",textAlign:"center",padding:24}}>No hay tablas en esta categoría.</p>}
        </div>
      )}

      {tab==="premios" && (
        <div style={{display:"grid",gap:10}}>
          {patterns.map(p=>{
            const isWon=wonPatterns.includes(p.id);
            return (
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                border:isWon?"1px solid var(--color-border-tertiary)":"1px solid #178bca",
                borderRadius:8,background:isWon?"var(--color-background-secondary)":"#E6F1FB",opacity:isWon?0.5:1}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500,fontSize:14,color:isWon?"var(--color-text-secondary)":"#0C447C"}}>{p.label}</div>
                  <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{p.cells.length} celdas</div>
                </div>
                {!isWon
                  ? <button onClick={()=>markWon(p.id)} style={{fontSize:12,padding:"5px 14px",borderRadius:6,cursor:"pointer",border:"1px solid #993C1D",background:"#FAECE7",color:"#993C1D"}}>Ya lo ganaron</button>
                  : <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Ganado ✓</span>}
              </div>
            );
          })}
        </div>
      )}

      {tab==="numeros" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
          {[["B",1,15],["I",16,30],["N",31,45],["G",46,60],["O",61,75]].map(([col,min,max])=>(
            <div key={col}>
              <div style={{textAlign:"center",fontWeight:500,color:"#178bca",marginBottom:4}}>{col}</div>
              {Array.from({length:max-min+1},(_,i)=>i+min).map(n=>(
                <div key={n} style={{textAlign:"center",padding:"3px",margin:"2px 0",borderRadius:4,fontSize:13,
                  background:called.has(n)?"#1D9E75":"var(--color-background-secondary)",
                  color:called.has(n)?"#fff":"var(--color-text-primary)"}}>
                  {n}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

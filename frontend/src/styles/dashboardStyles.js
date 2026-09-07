// NOTE: this was defined in the original App.jsx but never actually injected into the
// page (no <style>{STYLE}</style> anywhere). The .cx-root/.cx-btn/.cx-fade etc classes
// used across the dashboard views depend on this. Wired up in Dashboard.jsx.
export const STYLE = `
  .cx-root{ --bg:#070a0c; --card:#0f1416; --card2:#151b1e; --lime:#b6ff00; --text:#f2f5f3;
    --muted:#8c969a; --dim:#626c70; --line:rgba(255,255,255,.08); --danger:#ff5c67; --warning:#ffbd4a;
    background:var(--bg); color:var(--text); font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
    border-radius:20px; border:1px solid var(--line); overflow:hidden; min-height:640px; position:relative; }
  .cx-root *{ box-sizing:border-box; }
  .cx-btn{ border:0;border-radius:10px;padding:12px 18px;font-weight:800;font-size:13px;cursor:pointer; }
  .cx-btn-primary{ background:var(--lime); color:#081000; }
  .cx-btn-secondary{ background:rgba(255,255,255,.06); color:#fff; border:1px solid var(--line); }
  .cx-fade-up{ animation:cxFadeUp .4s ease; }
  .cx-fade{ animation:cxFade .35s ease; }
  .cx-scale{ animation:cxScale .35s ease; }
  @keyframes cxFadeUp{ from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes cxFade{ from{opacity:0} to{opacity:1} }
  @keyframes cxScale{ from{opacity:0;transform:scale(.97)} to{opacity:1;transform:none} }
  @keyframes cxSpin{ to{transform:rotate(360deg)} }
  .cx-spinner{ width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:cxSpin .7s linear infinite;display:inline-block; }
  .cx-spinner.dark{ border:2px solid rgba(0,0,0,.2); border-top-color:#071000; }
  .cx-badge{ font-size:9px; font-weight:900; letter-spacing:.08em; padding:4px 8px; border-radius:6px; display:inline-block; }
  .cx-scroll::-webkit-scrollbar{ width:8px; } .cx-scroll::-webkit-scrollbar-thumb{ background:#232a2d; border-radius:8px; }
`;

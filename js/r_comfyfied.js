import { app } from "../../scripts/app.js";

const ID = "kickrocss";
const PALETTES = "Comfy.CustomColorPalettes";
const ACTIVE = "Comfy.ColorPalette";
const LAYOUT = "R_Comfyfied.Layout";
const EDIT = "R_Comfyfied.EditLayout";

// KickRoCSS colours (https://github.com/retr0gr4d3/KickRoCSS). Canvas colours must be plain hex for the 2D context.
const PALETTE = {
  id: ID,
  name: "KickRoCSS",
  colors: {
    node_slot: {},
    litegraph_base: {
      BACKGROUND_IMAGE: "",
      CLEAR_BACKGROUND_COLOR: "#000000",
      NODE_TITLE_COLOR: "#e8e8e8",
      NODE_SELECTED_TITLE_COLOR: "#ffffff",
      NODE_TEXT_COLOR: "#c8c8c8",
      NODE_TEXT_HIGHLIGHT_COLOR: "#ffffff",
      NODE_DEFAULT_COLOR: "#321919",
      NODE_DEFAULT_BGCOLOR: "#1c1c1c",
      NODE_DEFAULT_BOXCOLOR: "#8f8f8f",
      NODE_BOX_OUTLINE_COLOR: "#d4000b",
      WIDGET_BGCOLOR: "#141414",
      WIDGET_OUTLINE_COLOR: "#501414",
      WIDGET_TEXT_COLOR: "#e8e8e8",
      WIDGET_SECONDARY_TEXT_COLOR: "#8f8f8f",
      WIDGET_DISABLED_TEXT_COLOR: "#5a5a5a",
      LINK_COLOR: "#8f8f8f",
      CONNECTING_LINK_COLOR: "#d4000b",
      BADGE_FG_COLOR: "#ffffff",
      BADGE_BG_COLOR: "#a3070e",
    },
    // Custom palettes set every legacy variable, so point them back at the theme tokens like Dark does.
    comfy_base: {
      "fg-color": "var(--foreground)",
      "bg-color": "var(--background)",
      "comfy-menu-bg": "var(--background)",
      "comfy-menu-secondary-bg": "var(--card)",
      "comfy-input-bg": "var(--input)",
      "input-text": "var(--foreground)",
      "descrip-text": "var(--muted-foreground)",
      "drag-text": "var(--muted-foreground)",
      "error-text": "var(--destructive)",
      "border-color": "var(--border)",
      "tr-even-bg-color": "var(--background)",
      "tr-odd-bg-color": "var(--secondary)",
      "content-bg": "var(--secondary)",
      "content-fg": "var(--foreground)",
      "content-hover-bg": "var(--accent)",
      "content-hover-fg": "var(--foreground)",
    },
    theme: {
      background: "#191919",
      foreground: "#e8e8e8",
      card: "#1c1c1c",
      popover: "#1c1c1c",
      primary: "#d4000b",
      secondary: "#232323",
      muted: "#2a2a2a",
      "muted-foreground": "#8f8f8f",
      accent: "color-mix(in srgb, #d4000b 14%, #1c1c1c)",
      destructive: "#f85149",
      border: "color-mix(in srgb, #d4000b 28%, transparent)",
      input: "#141414",
      ring: "#d4000b",
      node: "#1c1c1c",
      "node-foreground": "#e8e8e8",
      "node-header": "#321919",
      "node-border": "color-mix(in srgb, #d4000b 35%, transparent)",
      warning: "#d29922",
      "shadow-color": "rgb(0 0 0 / 0.35)",
    },
  },
};

const settings = () => app.extensionManager.setting;
const root = document.documentElement;
const layoutStyle = document.head.appendChild(document.createElement("style"));
let layout = {};

function renderLayout() {
  layoutStyle.textContent = Object.entries(layout).map(([sel, r]) => `html.kickro ${sel}{` +
    (r.hidden ? "display:none !important;" : "") +
    (r.x || r.y ? `translate:${r.x}px ${r.y}px !important;` : "") +
    (r.w ? `width:${r.w}px !important;min-width:0 !important;max-width:none !important;flex:none !important;` : "") +
    (r.h ? `height:${r.h}px !important;min-height:0 !important;max-height:none !important;` : "") + "}").join("\n");
}

// ponytail: a path of nth-child steps up to the nearest id/data-testid. Survives Vue re-renders, but an
// edit can land on a different element if the frontend changes its markup. Upgrade: per-element anchors.
function selectorFor(el) {
  const parts = [];
  for (; el && el !== document.body; el = el.parentElement) {
    if (el.id) { parts.unshift("#" + CSS.escape(el.id)); break; }
    const tid = el.getAttribute("data-testid");
    if (tid) { parts.unshift(`[data-testid="${CSS.escape(tid)}"]`); break; }
    parts.unshift(`${el.localName}:nth-child(${[...el.parentElement.children].indexOf(el) + 1})`);
  }
  return parts.join(" > ");
}

const save = () => { renderLayout(); settings().set(LAYOUT, layout); };
const labelFor = (el) => (el.getAttribute("aria-label") || el.title || el.textContent.trim().replace(/\s+/g, " ").slice(0, 40) || el.localName);

// Layout edit mode. Hover (or tap) highlights, scrolling or Parent walks outwards, click/tap selects,
// drag moves, dragging the bottom-right corner resizes. The bar's buttons act on the selection.
let editor = null;

function startEdit() {
  if (!root.classList.contains("kickro")) {
    app.extensionManager.toast.add({ severity: "info", summary: "R_Comfyfied", detail: "Select the KickRoCSS palette to edit the layout.", life: 4000 });
    return;
  }
  const box = document.body.appendChild(document.createElement("div"));
  box.className = "kr-edit-box";
  const selBox = document.body.appendChild(document.createElement("div"));
  selBox.className = "kr-edit-box kr-selected";
  const bar = document.body.appendChild(document.createElement("div"));
  bar.className = "kr-edit-bar";

  let hovered = null, depth = 0, picked = null, selected = null, drag = null;
  const ours = (t) => bar.contains(t);
  const place = (b, el) => {
    const r = el?.isConnected && el.getBoundingClientRect();
    if (!r || !r.width) return (b.style.display = "none");
    Object.assign(b.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  };
  const pick = () => {
    picked = hovered;
    for (let i = 0; i < depth && picked?.parentElement && picked.parentElement !== document.body; i++) picked = picked.parentElement;
    place(box, picked);
    place(selBox, selected);
  };
  const drawBar = () => {
    const hidden = Object.entries(layout).filter(([, r]) => r.hidden);
    bar.innerHTML = `<button data-act="parent">Parent</button><button data-act="hide">Hide</button><button data-act="reset">Reset</button>
      <select data-act="show"><option value="">Hidden (${hidden.length})</option>${hidden.map(([sel, r]) =>
        `<option value="${sel.replace(/"/g, "&quot;")}">Show: ${r.label.replace(/</g, "&lt;")}</option>`).join("")}</select>
      <button data-act="reset-all">Reset all</button><button data-act="done">Done</button>`;
  };
  bar.onclick = (e) => {
    const act = e.target.dataset.act;
    if (act === "done") return stopEdit();
    if (act === "reset-all") {
      if (confirm("Reset every moved, resized or hidden element?")) { layout = {}; save(); drawBar(); }
      return;
    }
    if (!selected) return;
    if (act === "parent" && selected.parentElement !== document.body) selected = selected.parentElement;
    if (act === "hide") {
      Object.assign((layout[selectorFor(selected)] ??= { x: 0, y: 0 }), { hidden: true, label: labelFor(selected) });
      selected = null;
      save();
      drawBar();
    }
    if (act === "reset") { delete layout[selectorFor(selected)]; save(); }
    pick();
  };
  bar.onchange = (e) => {
    const r = layout[e.target.value];
    if (!r) return;
    delete r.hidden;
    delete r.label;
    if (!r.x && !r.y && !r.w && !r.h) delete layout[e.target.value];
    save();
    drawBar();
  };
  drawBar();

  const block = (e) => { if (!ours(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); } };
  const handlers = {
    pointermove(e) {
      if (drag) {
        const r = layout[drag.sel];
        if (drag.resize) { r.w = Math.max(20, Math.round(drag.w + e.clientX - drag.cx)); r.h = Math.max(20, Math.round(drag.h + e.clientY - drag.cy)); }
        else { r.x = Math.round(drag.x + e.clientX - drag.cx); r.y = Math.round(drag.y + e.clientY - drag.cy); }
        renderLayout();
      } else if (!ours(e.target)) {
        if (hovered !== e.target) depth = 0;
        hovered = e.target;
      }
      pick();
      if (!ours(e.target)) e.stopImmediatePropagation();
    },
    pointerdown(e) {
      block(e);
      if (ours(e.target) || e.button !== 0) return;
      // Touch has no hover, so the tap itself picks.
      if (e.pointerType !== "mouse") { hovered = e.target; depth = 0; pick(); }
      if (!picked) return;
      selected = picked;
      const sel = selectorFor(picked);
      const rect = picked.getBoundingClientRect();
      const r = layout[sel] ?? { x: 0, y: 0 };
      drag = { sel, r, cx: e.clientX, cy: e.clientY, x: r.x, y: r.y, w: rect.width, h: rect.height,
        resize: e.clientX > rect.right - 16 && e.clientY > rect.bottom - 16 };
      layout[sel] = r;
      pick();
    },
    pointerup(e) {
      block(e);
      if (!drag) return;
      const { sel, r } = drag;
      drag = null;
      if (!r.x && !r.y && !r.w && !r.h && !r.hidden) delete layout[sel];
      save();
    },
    contextmenu(e) {
      block(e);
      if (!picked || ours(e.target)) return;
      delete layout[selectorFor(picked)];
      save();
      pick();
    },
    wheel(e) {
      block(e);
      if (ours(e.target)) return;
      depth = Math.max(0, depth + (e.deltaY < 0 ? 1 : -1));
      pick();
    },
    keydown(e) { if (e.key === "Escape") stopEdit(); },
    mousedown: block, mouseup: block, click: block, dblclick: block,
  };
  handlers.pointercancel = handlers.pointerup;
  for (const [type, fn] of Object.entries(handlers)) window.addEventListener(type, fn, { capture: true, passive: false });
  root.style.touchAction = "none"; // otherwise a touch drag scrolls/zooms the page and cancels the move
  editor = { els: [box, selBox, bar], handlers };
}

function stopEdit() {
  if (!editor) return;
  root.style.touchAction = "";
  for (const [type, fn] of Object.entries(editor.handlers)) window.removeEventListener(type, fn, { capture: true });
  editor.els.forEach((el) => el.remove());
  editor = null;
}

app.registerExtension({
  name: "R_Comfyfied",
  settings: [{ id: LAYOUT, name: "R_Comfyfied layout", type: "hidden", defaultValue: {} }],
  commands: [{ id: EDIT, label: "Edit layout (KickRoCSS)", icon: "pi pi-arrows-alt", function: () => (editor ? stopEdit() : startEdit()) }],
  menuCommands: [{ path: ["Edit"], commands: [EDIT] }],
  keybindings: [{ combo: { key: "l", ctrl: true, alt: true }, commandId: EDIT }],
  async setup() {
    const link = document.head.appendChild(document.createElement("link"));
    link.rel = "stylesheet";
    link.href = new URL("./kickro.css", import.meta.url);

    // The palette store reads this setting after setup, so KickRoCSS shows up in the Color Palette list.
    const all = settings().get(PALETTES) ?? {};
    if (JSON.stringify(all[ID]) !== JSON.stringify(PALETTE)) await settings().set(PALETTES, { ...all, [ID]: PALETTE });

    layout = settings().get(LAYOUT) ?? {};
    renderLayout();
    const sync = () => {
      const on = settings().get(ACTIVE) === ID;
      root.classList.toggle("kickro", on);
      if (!on) stopEdit();
    };
    app.ui.settings.addEventListener(`${ACTIVE}.change`, sync);
    sync();
  },
});

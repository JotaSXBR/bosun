/* @ds-bundle: {"format":4,"namespace":"BOSUNDesignSystem_c587fa","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Wordmark","sourcePath":"components/core/Wordmark.jsx"},{"name":"BarChart","sourcePath":"components/data/BarChart.jsx"},{"name":"Metric","sourcePath":"components/data/Metric.jsx"},{"name":"ProgressBar","sourcePath":"components/data/ProgressBar.jsx"},{"name":"RingChart","sourcePath":"components/data/RingChart.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"TooltipBubble","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"ModuleNav","sourcePath":"components/navigation/ModuleNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Accordion","sourcePath":"components/surfaces/Accordion.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Dialog","sourcePath":"components/surfaces/Dialog.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"40fa0170ac4d","components/core/Badge.jsx":"60eea887fcac","components/core/Button.jsx":"459198f4c142","components/core/Icon.jsx":"4af81c8533e1","components/core/IconButton.jsx":"2dfafd44c3f9","components/core/Tag.jsx":"f986442e6a65","components/core/Wordmark.jsx":"3145d8d4b48e","components/core/iconPaths.js":"7ac6141c156d","components/core/interaction.js":"c3a7b577d326","components/data/BarChart.jsx":"a40248d7bdb9","components/data/Metric.jsx":"6f68ad60d802","components/data/ProgressBar.jsx":"b77af45dfefb","components/data/RingChart.jsx":"de5204c124bc","components/feedback/Toast.jsx":"986202e94bc5","components/feedback/Tooltip.jsx":"864c6131def9","components/forms/Checkbox.jsx":"1dfafc52c404","components/forms/Input.jsx":"10db0e85d56b","components/forms/Radio.jsx":"cabb8f08d329","components/forms/Select.jsx":"987be13a0e91","components/forms/Switch.jsx":"6054e226a774","components/navigation/ModuleNav.jsx":"f895126112fd","components/navigation/Tabs.jsx":"ff5176656003","components/surfaces/Accordion.jsx":"c6b4d6ff6831","components/surfaces/Card.jsx":"03c0ff037e68","components/surfaces/Dialog.jsx":"7461b2f0c31f","ui_kits/webapp/app.jsx":"b85c3a8dca79","ui_kits/webapp/connect.jsx":"6365db8b4d5a","ui_kits/webapp/flows.jsx":"2dd613aca63d","ui_kits/webapp/home.jsx":"1b56d21b581d","ui_kits/webapp/login.jsx":"8e3613915742","ui_kits/webapp/shell.jsx":"7046dde26201","ui_kits/webapp/tasks.jsx":"d3d2f0e862e9","ui_kits/website/app.jsx":"70789eae679f","ui_kits/website/hero.jsx":"6510a83cc5a8","ui_kits/website/sections.jsx":"39c2635ebb36"},"inlinedExternals":[],"unexposedExports":[{"name":"iconNames","sourcePath":"components/core/Icon.jsx"},{"name":"iconPaths","sourcePath":"components/core/iconPaths.js"},{"name":"useInteractive","sourcePath":"components/core/interaction.js"}]} */

(() => {

const __ds_ns = (window.BOSUNDesignSystem_c587fa = window.BOSUNDesignSystem_c587fa || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 72
};
function Avatar({
  src,
  name = '',
  size = 'md',
  ring = false,
  status,
  style
}) {
  const d = typeof size === 'number' ? size : SIZES[size] || 40;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const statusColor = {
    online: 'var(--signal-400)',
    busy: 'var(--amber-500)',
    offline: 'var(--steel-500)'
  }[status];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: d,
      height: d,
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: ring ? 'var(--signal-400)' : 'var(--ocean-700)',
      color: ring ? 'var(--abyss-900)' : 'var(--ocean-100)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: Math.round(d * 0.38),
      letterSpacing: '-0.01em',
      boxShadow: ring ? '0 0 0 2px var(--bg-page), 0 0 0 3.5px var(--signal-400)' : 'inset 0 0 0 1px var(--border-subtle)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'grayscale(1) contrast(1.05)'
    }
  }) : initials), statusColor && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: Math.max(8, d * 0.24),
      height: Math.max(8, d * 0.24),
      borderRadius: '50%',
      background: statusColor,
      boxShadow: '0 0 0 2px var(--bg-page)'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Wordmark.jsx
try { (() => {
const SIZES = {
  sm: 16,
  md: 22,
  lg: 32,
  xl: 56
};
function Wordmark({
  size = 'md',
  tone = 'default',
  tagline = false,
  style
}) {
  const fs = typeof size === 'number' ? size : SIZES[size] || 22;
  const color = {
    default: 'var(--text-strong)',
    light: 'var(--mist)',
    dark: 'var(--abyss-900)',
    accent: 'var(--signal-400)'
  }[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      gap: fs * 0.28,
      color,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: fs,
      lineHeight: 1,
      letterSpacing: '0.06em'
    }
  }, "BOSUN"), tagline && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 400,
      fontSize: Math.max(11, fs * 0.42),
      lineHeight: 1.2,
      letterSpacing: 0,
      opacity: 0.72
    }
  }, "Seu mundo digital, sob comando."));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/iconPaths.js
try { (() => {
// Lucide icon paths (lucide-static@0.469.0, ISC). Generated — do not hand-edit.
const iconPaths = {
  "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
  "list-checks": "<path d=\"m3 17 2 2 4-4\"/><path d=\"m3 7 2 2 4-4\"/><path d=\"M13 6h8\"/><path d=\"M13 12h8\"/><path d=\"M13 18h8\"/>",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>",
  "workflow": "<rect width=\"8\" height=\"8\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M7 11v4a2 2 0 0 0 2 2h4\"/><rect width=\"8\" height=\"8\" x=\"13\" y=\"13\" rx=\"2\"/>",
  "plug": "<path d=\"M12 22v-5\"/><path d=\"M9 8V2\"/><path d=\"M15 8V2\"/><path d=\"M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z\"/>",
  "chart-no-axes-column": "<line x1=\"18\" x2=\"18\" y1=\"20\" y2=\"10\"/><line x1=\"12\" x2=\"12\" y1=\"20\" y2=\"4\"/><line x1=\"6\" x2=\"6\" y1=\"20\" y2=\"14\"/>",
  "chart-line": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/><path d=\"m19 9-5 5-4-4-3 3\"/>",
  "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\"/><path d=\"M20 3v4\"/><path d=\"M22 5h-4\"/><path d=\"M4 17v2\"/><path d=\"M5 18H3\"/>",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>",
  "bell": "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\"/><path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"/>",
  "arrow-up-right": "<path d=\"M7 7h10v10\"/><path d=\"M7 17 17 7\"/>",
  "arrow-right": "<path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/>",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\"/><path d=\"M19 12H5\"/>",
  "arrow-up": "<path d=\"m5 12 7-7 7 7\"/><path d=\"M12 19V5\"/>",
  "arrow-down": "<path d=\"M12 5v14\"/><path d=\"m19 12-7 7-7-7\"/>",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\"/><line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\"/><line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\"/><line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\"/><line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\"/><line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\"/><line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\"/><line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\"/><line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\"/>",
  "list-filter": "<path d=\"M3 6h18\"/><path d=\"M7 12h10\"/><path d=\"M10 18h4\"/>",
  "calendar": "<path d=\"M8 2v4\"/><path d=\"M16 2v4\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/><path d=\"M3 10h18\"/>",
  "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
  "check": "<path d=\"M20 6 9 17l-5-5\"/>",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\"/>",
  "chevron-up": "<path d=\"m18 15-6-6-6 6\"/>",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\"/>",
  "plus": "<path d=\"M5 12h14\"/><path d=\"M12 5v14\"/>",
  "minus": "<path d=\"M5 12h14\"/>",
  "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/>",
  "ellipsis-vertical": "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"5\" r=\"1\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/>",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16 17 21 12 16 7\"/><line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\"/>",
  "upload": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"17 8 12 3 7 8\"/><line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\"/>",
  "share": "<path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"/><polyline points=\"16 6 12 2 8 6\"/><line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"15\"/>",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\"/>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"/><line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"/>",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/>",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>",
  "key-round": "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\"/><circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "eye-off": "<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49\"/><path d=\"M14.084 14.158a3 3 0 0 1-4.242-4.242\"/><path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143\"/><path d=\"m2 2 20 20\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/>",
  "play": "<polygon points=\"6 3 20 12 6 21 6 3\"/>",
  "pause": "<rect x=\"14\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\"/>",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>",
  "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/>",
  "unlink": "<path d=\"m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71\"/><path d=\"m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71\"/><line x1=\"8\" x2=\"8\" y1=\"2\" y2=\"5\"/><line x1=\"2\" x2=\"5\" y1=\"8\" y2=\"8\"/><line x1=\"16\" x2=\"16\" y1=\"19\" y2=\"22\"/><line x1=\"19\" x2=\"22\" y1=\"16\" y2=\"16\"/>",
  "folder": "<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"/>",
  "inbox": "<polyline points=\"22 12 16 12 14 15 10 15 8 12 2 12\"/><path d=\"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\"/>",
  "mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\"/>",
  "message-square": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>",
  "git-branch": "<line x1=\"6\" x2=\"6\" y1=\"3\" y2=\"15\"/><circle cx=\"18\" cy=\"6\" r=\"3\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M18 9a9 9 0 0 1-9 9\"/>",
  "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\"/>",
  "gauge": "<path d=\"m12 14 4-4\"/><path d=\"M3.34 19a10 10 0 1 1 17.32 0\"/>",
  "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/><path d=\"M9 18h6\"/><path d=\"M10 22h4\"/>",
  "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\"/><path d=\"M12 22V12\"/><path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\"/><path d=\"m7.5 4.27 9 5.15\"/>",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\"/><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\"/><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\"/>",
  "command": "<path d=\"M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3\"/>",
  "compass": "<path d=\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/>",
  "trash-2": "<path d=\"M3 6h18\"/><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\"/><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\"/><line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\"/><line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\"/>",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"/><path d=\"m15 5 4 4\"/>",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>",
  "external-link": "<path d=\"M15 3h6v6\"/><path d=\"M10 14 21 3\"/><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"/>",
  "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/>",
  "circle-dashed": "<path d=\"M10.1 2.182a10 10 0 0 1 3.8 0\"/><path d=\"M13.9 21.818a10 10 0 0 1-3.8 0\"/><path d=\"M17.609 3.721a10 10 0 0 1 2.69 2.7\"/><path d=\"M2.182 13.9a10 10 0 0 1 0-3.8\"/><path d=\"M20.279 17.609a10 10 0 0 1-2.7 2.69\"/><path d=\"M21.818 10.1a10 10 0 0 1 0 3.8\"/><path d=\"M3.721 6.391a10 10 0 0 1 2.7-2.69\"/><path d=\"M6.391 20.279a10 10 0 0 1-2.69-2.7\"/>",
  "loader": "<path d=\"M12 2v4\"/><path d=\"m16.2 7.8 2.9-2.9\"/><path d=\"M18 12h4\"/><path d=\"m16.2 16.2 2.9 2.9\"/><path d=\"M12 18v4\"/><path d=\"m4.9 19.1 2.9-2.9\"/><path d=\"M2 12h4\"/><path d=\"m4.9 4.9 2.9 2.9\"/>",
  "database": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5V19A9 3 0 0 0 21 19V5\"/><path d=\"M3 12A9 3 0 0 0 21 12\"/>",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/><path d=\"M2 12h20\"/>",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/><path d=\"m9 12 2 2 4-4\"/>",
  "calendar-days": "<path d=\"M8 2v4\"/><path d=\"M16 2v4\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/><path d=\"M3 10h18\"/><path d=\"M8 14h.01\"/><path d=\"M12 14h.01\"/><path d=\"M16 14h.01\"/><path d=\"M8 18h.01\"/><path d=\"M12 18h.01\"/><path d=\"M16 18h.01\"/>",
  "file": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/>",
  "layers": "<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z\"/><path d=\"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12\"/><path d=\"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17\"/>",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>",
  "flag": "<path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\"/><line x1=\"4\" x2=\"4\" y1=\"22\" y2=\"15\"/>",
  "trending-up": "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\"/><polyline points=\"16 7 22 7 22 13\"/>",
  "trending-down": "<polyline points=\"22 17 13.5 8.5 8.5 13.5 2 7\"/><polyline points=\"16 17 22 17 22 11\"/>",
  "grip-vertical": "<circle cx=\"9\" cy=\"12\" r=\"1\"/><circle cx=\"9\" cy=\"5\" r=\"1\"/><circle cx=\"9\" cy=\"19\" r=\"1\"/><circle cx=\"15\" cy=\"12\" r=\"1\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><circle cx=\"15\" cy=\"19\" r=\"1\"/>",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/>",
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\"/>",
  "panel-left": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M9 3v18\"/>",
  "circle-play": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polygon points=\"10 8 16 12 10 16 10 8\"/>",
  "hash": "<line x1=\"4\" x2=\"20\" y1=\"9\" y2=\"9\"/><line x1=\"4\" x2=\"20\" y1=\"15\" y2=\"15\"/><line x1=\"10\" x2=\"8\" y1=\"3\" y2=\"21\"/><line x1=\"16\" x2=\"14\" y1=\"3\" y2=\"21\"/>",
  "at-sign": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8\"/>",
  "paperclip": "<path d=\"M13.234 20.252 21 12.3\"/><path d=\"m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486\"/>",
  "send": "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\"/><path d=\"m21.854 2.147-10.94 10.939\"/>",
  "cloud": "<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\"/>",
  "webhook": "<path d=\"M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2\"/><path d=\"m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06\"/><path d=\"m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8\"/>",
  "timer": "<line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\"/><line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\"/><circle cx=\"12\" cy=\"14\" r=\"8\"/>",
  "activity": "<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\"/>",
  "square-check": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"m9 12 2 2 4-4\"/>",
  "list-todo": "<rect x=\"3\" y=\"5\" width=\"6\" height=\"6\" rx=\"1\"/><path d=\"m3 17 2 2 4-4\"/><path d=\"M13 6h8\"/><path d=\"M13 12h8\"/><path d=\"M13 18h8\"/>",
  "book-open": "<path d=\"M12 7v14\"/><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"/>",
  "bot": "<path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/>",
  "calendar-clock": "<path d=\"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5\"/><path d=\"M16 2v4\"/><path d=\"M8 2v4\"/><path d=\"M3 10h5\"/><path d=\"M17.5 17.5 16 16.3V14\"/><circle cx=\"16\" cy=\"16\" r=\"6\"/>",
  "circle-x": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/>",
  "badge-check": "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\"/><path d=\"m9 12 2 2 4-4\"/>",
  "house-plug": "<path d=\"M10 12V8.964\"/><path d=\"M14 12V8.964\"/><path d=\"M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z\"/><path d=\"M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2\"/>",
  "folder-kanban": "<path d=\"M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z\"/><path d=\"M8 10v4\"/><path d=\"M12 10v2\"/><path d=\"M16 10v6\"/>",
  "notebook-pen": "<path d=\"M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4\"/><path d=\"M2 6h4\"/><path d=\"M2 10h4\"/><path d=\"M2 14h4\"/><path d=\"M2 18h4\"/><path d=\"M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\"/>",
  "rocket": "<path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\"/><path d=\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\"/><path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0\"/><path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\"/>",
  "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5\"/><path d=\"M12 7v5l4 2\"/>"
};
Object.assign(__ds_scope, { iconPaths });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/iconPaths.js", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  color = 'currentColor',
  title,
  style,
  ...rest
}) {
  const paths = __ds_scope.iconPaths[name];
  if (!paths && typeof console !== 'undefined') console.warn('[BOSUN Icon] unknown icon: ' + name);
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: title ? 'img' : undefined,
    "aria-hidden": title ? undefined : true,
    "aria-label": title,
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: paths || ''
    }
  }, rest));
}
const iconNames = Object.keys(__ds_scope.iconPaths);
Object.assign(__ds_scope, { Icon, iconNames });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: ['var(--surface-raised-2)', 'var(--text-body)', 'var(--steel-300)'],
  accent: ['var(--surface-accent-soft)', 'var(--text-accent)', 'var(--signal-400)'],
  success: ['var(--status-success-bg)', 'var(--status-success)', 'var(--status-success)'],
  warning: ['var(--status-warning-bg)', 'var(--status-warning)', 'var(--status-warning)'],
  danger: ['var(--status-danger-bg)', 'var(--status-danger)', 'var(--status-danger)'],
  info: ['var(--status-info-bg)', 'var(--status-info)', 'var(--status-info)'],
  running: ['var(--status-running-bg)', 'var(--status-running)', 'var(--status-running)']
};
function Badge({
  tone = 'neutral',
  variant = 'soft',
  icon,
  dot = false,
  size = 'md',
  children,
  style
}) {
  const [bg, fg, dotColor] = TONES[tone] || TONES.neutral;
  const solid = variant === 'solid';
  const h = size === 'sm' ? 20 : 24;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: h,
      padding: size === 'sm' ? '0 8px' : '0 10px',
      borderRadius: 'var(--radius-pill)',
      background: solid ? dotColor : bg,
      color: solid ? 'var(--abyss-900)' : fg,
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 500,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: solid ? 'var(--abyss-900)' : dotColor,
      animation: tone === 'running' ? 'bx-pulse 1.6s var(--ease-standard) infinite' : undefined
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 12 : 13,
    strokeWidth: 2
  }), children, dot && tone === 'running' && /*#__PURE__*/React.createElement("style", null, '@keyframes bx-pulse{0%,100%{opacity:1}50%{opacity:.35}}'));
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/interaction.js
try { (() => {
// Shared hover/press state for inline-styled components.
function useInteractive(disabled) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const handlers = disabled ? {} : {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    onFocus: e => {
      if (e.target.matches && e.target.matches(':focus-visible')) setFocus(true);
    },
    onBlur: () => setFocus(false)
  };
  return {
    hover,
    active,
    focus,
    handlers
  };
}
Object.assign(__ds_scope, { useInteractive });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/interaction.js", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 'var(--control-sm)',
    px: 14,
    fs: 13,
    gap: 6,
    icon: 16
  },
  md: {
    h: 'var(--control-md)',
    px: 18,
    fs: 14,
    gap: 8,
    icon: 18
  },
  lg: {
    h: 'var(--control-lg)',
    px: 24,
    fs: 15,
    gap: 10,
    icon: 20
  }
};
function variantStyle(variant, hover, active) {
  switch (variant) {
    case 'primary':
      return {
        background: hover ? 'var(--surface-accent-hover)' : 'var(--surface-accent)',
        color: 'var(--text-on-accent)',
        border: '1px solid transparent',
        boxShadow: hover ? 'var(--shadow-glow)' : 'none'
      };
    case 'inverse':
      return {
        background: hover ? 'var(--white)' : 'var(--surface-inverse)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'outline':
      return {
        background: hover ? 'var(--surface-accent-soft)' : 'transparent',
        color: 'var(--text-accent)',
        border: '1px solid var(--border-accent)'
      };
    case 'ghost':
      return {
        background: hover ? 'var(--surface-control)' : 'transparent',
        color: 'var(--text-body)',
        border: '1px solid transparent'
      };
    case 'danger':
      return {
        background: hover ? 'var(--status-danger)' : 'var(--status-danger-bg)',
        color: hover ? 'var(--abyss-900)' : 'var(--status-danger)',
        border: '1px solid transparent'
      };
    default:
      return {
        background: active ? 'var(--surface-control-active)' : hover ? 'var(--surface-control-hover)' : 'var(--surface-control)',
        color: 'var(--text-strong)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-control)'
      };
  }
}
function Button({
  variant = 'secondary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  children,
  style,
  onClick,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const {
    hover,
    active,
    focus,
    handlers
  } = __ds_scope.useInteractive(disabled || loading);
  const v = variantStyle(variant, hover, active);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled || loading,
    onClick: onClick
  }, handlers, rest, {
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.h,
      padding: '0 ' + s.px + 'px',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-sans)',
      fontSize: s.fs,
      fontWeight: 500,
      letterSpacing: 'var(--tracking-ui)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : loading ? 'progress' : 'pointer',
      transition: 'background var(--dur-fast) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-instant) var(--ease-standard), color var(--dur-fast)',
      transform: active ? 'translateY(1px) scale(.985)' : 'none',
      opacity: disabled ? 0.42 : 1,
      outline: 'none',
      ...v,
      ...(focus ? {
        boxShadow: 'var(--focus-ring)'
      } : null),
      ...style
    }
  }), loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "loader",
    size: s.icon,
    style: {
      animation: 'bx-spin 900ms linear infinite'
    }
  }) : iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }) : null, children != null && /*#__PURE__*/React.createElement("span", null, children), iconRight && !loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }) : null, /*#__PURE__*/React.createElement("style", null, '@keyframes bx-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    d: 34,
    i: 16
  },
  md: {
    d: 44,
    i: 18
  },
  lg: {
    d: 52,
    i: 20
  }
};
function IconButton({
  icon,
  label,
  variant = 'control',
  size = 'md',
  dot = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const {
    hover,
    active,
    focus,
    handlers
  } = __ds_scope.useInteractive(disabled);
  const v = {
    control: {
      background: active ? 'var(--surface-control-active)' : hover ? 'var(--surface-control-hover)' : 'var(--surface-control)',
      color: hover ? 'var(--icon-strong)' : 'var(--icon-default)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-control)'
    },
    inverse: {
      background: hover ? 'var(--white)' : 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      border: '1px solid transparent'
    },
    accent: {
      background: hover ? 'var(--surface-accent-hover)' : 'var(--surface-accent)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent',
      boxShadow: hover ? 'var(--shadow-glow)' : 'none'
    },
    outline: {
      background: hover ? 'var(--surface-accent-soft)' : 'transparent',
      color: 'var(--text-accent)',
      border: '1px solid var(--border-accent)'
    },
    ghost: {
      background: hover ? 'var(--surface-control)' : 'transparent',
      color: hover ? 'var(--icon-strong)' : 'var(--icon-default)',
      border: '1px solid transparent'
    },
    onAccent: {
      background: hover ? 'rgba(11,23,38,.18)' : 'rgba(11,23,38,.10)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick
  }, handlers, rest, {
    style: {
      position: 'relative',
      width: s.d,
      height: s.d,
      minWidth: s.d,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.42 : 1,
      padding: 0,
      outline: 'none',
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast), box-shadow var(--dur-base), transform var(--dur-instant)',
      transform: active ? 'scale(.94)' : 'none',
      ...v,
      ...(focus ? {
        boxShadow: 'var(--focus-ring)'
      } : null),
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.i
  }), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: s.d * 0.22,
      right: s.d * 0.24,
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'var(--signal-400)',
      boxShadow: '0 0 0 2px var(--surface-control)'
    }
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  icon,
  selected = false,
  onRemove,
  onClick,
  size = 'md',
  style
}) {
  const {
    hover,
    handlers
  } = __ds_scope.useInteractive(false);
  const h = size === 'sm' ? 30 : 38;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick
  }, handlers, {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: h,
      padding: onRemove ? '0 8px 0 16px' : '0 16px',
      borderRadius: 'var(--radius-pill)',
      background: selected ? 'var(--surface-accent-soft)' : hover && onClick ? 'var(--surface-control-hover)' : 'var(--surface-control)',
      border: '1px solid ' + (selected ? 'var(--border-accent)' : 'var(--border-subtle)'),
      boxShadow: 'var(--shadow-control)',
      color: selected ? 'var(--text-accent)' : 'var(--text-strong)',
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 12 : 13,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15
  }), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Remover filtro",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      width: h - 14,
      height: h - 14,
      borderRadius: '50%',
      border: 0,
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      color: 'inherit',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14,
    strokeWidth: 2
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/Metric.jsx
try { (() => {
const SIZES = {
  sm: 'var(--text-metric-sm)',
  md: 'var(--text-metric)',
  lg: 'var(--text-metric-xl)'
};
function Metric({
  value,
  prefix,
  suffix,
  label,
  delta,
  deltaTone = 'success',
  deltaIcon = 'arrow-up-right',
  size = 'md',
  onAccent = false,
  style
}) {
  const fs = SIZES[size] || SIZES.md;
  const c = onAccent ? 'var(--text-on-accent)' : 'var(--text-strong)';
  const m = onAccent ? 'var(--text-on-accent-muted)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      color: c,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: fs,
      lineHeight: 1,
      letterSpacing: '-0.035em',
      fontVariantNumeric: 'tabular-nums'
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.42em',
      fontWeight: 400,
      letterSpacing: 0,
      color: m,
      alignSelf: 'flex-start',
      marginTop: '0.3em'
    }
  }, prefix), /*#__PURE__*/React.createElement("span", null, value), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.38em',
      fontWeight: 400,
      letterSpacing: 0,
      color: m
    }
  }, suffix)), (label || delta) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, delta && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: deltaTone,
    icon: deltaIcon
  }, delta), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: m
    }
  }, label)));
}
Object.assign(__ds_scope, { Metric });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Metric.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressBar.jsx
try { (() => {
const H = {
  sm: 6,
  md: 12,
  lg: 26
};
function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  tone = 'accent',
  pattern = true,
  thumb = false,
  labels,
  label,
  valueLabel,
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const h = typeof size === 'number' ? size : H[size] || 12;
  const fill = {
    accent: 'var(--data-1)',
    mist: 'var(--data-2)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
    success: 'var(--status-success)'
  }[tone] || 'var(--data-1)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minWidth: 0,
      ...style
    }
  }, (label || valueLabel) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, valueLabel)), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemin": 0,
    "aria-valuemax": max,
    style: {
      position: 'relative',
      height: h,
      borderRadius: 'var(--radius-pill)',
      background: pattern ? 'repeating-linear-gradient(135deg, var(--pattern-ink) 0 1.5px, transparent 1.5px 7px), var(--data-track)' : 'var(--data-track)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: pct + '%',
      minWidth: pct > 0 ? h : 0,
      borderRadius: 'var(--radius-pill)',
      background: fill,
      transition: 'width var(--dur-chart) var(--ease-standard)'
    }
  }), thumb && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '50%',
      left: pct + '%',
      width: h + 12,
      height: h + 12,
      transform: 'translate(-60%, -50%)',
      borderRadius: '50%',
      background: 'radial-gradient(circle at 50% 40%, var(--surface-raised-2), var(--surface-card))',
      boxShadow: 'var(--shadow-glow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'left var(--dur-chart) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 2.5,
      height: 2.5,
      borderRadius: '50%',
      background: 'var(--mist)'
    }
  }))))), labels && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: 'var(--text-subtle)'
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/RingChart.jsx
try { (() => {
function RingChart({
  segments = [],
  size = 140,
  thickness = 18,
  gap = 14,
  showValues = true,
  children,
  style
}) {
  const r = (size - thickness) / 2 - 8;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const usable = 360 - gap * segments.length;
  const capDeg = thickness / C * 360;
  let angle = -210;
  const arcs = segments.map((s, i) => {
    const sweep = s.value / total * usable;
    const start = angle;
    angle += sweep + gap;
    const dash = Math.max(0.01, (sweep - capDeg) / 360 * C);
    return {
      ...s,
      start,
      sweep,
      dash,
      color: s.color || ['var(--data-1)', 'var(--data-2)', 'var(--data-3)', 'var(--data-4)'][i % 4]
    };
  });
  const cx = size / 2;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: '0 0 ' + size + ' ' + size,
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cx,
    r: r,
    fill: "none",
    stroke: "var(--data-track)",
    strokeWidth: thickness * 0.35
  }), arcs.map((a, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: cx,
    cy: cx,
    r: r,
    fill: "none",
    stroke: a.color,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: a.dash + ' ' + C,
    transform: 'rotate(' + (a.start + capDeg / 2) + ' ' + cx + ' ' + cx + ')',
    style: {
      transition: 'stroke-dasharray var(--dur-chart) var(--ease-standard)'
    }
  }))), showValues && arcs.map((a, i) => {
    const rad = a.start * Math.PI / 180;
    const x = cx + Math.cos(rad) * (r + thickness / 2 + 4),
      y = cx + Math.sin(rad) * (r + thickness / 2 + 4);
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        minWidth: 24,
        height: 20,
        padding: '0 6px',
        borderRadius: 10,
        background: 'var(--surface-raised-2)',
        color: 'var(--text-strong)',
        fontSize: 11,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 3px var(--surface-card)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, a.display != null ? a.display : a.value);
  }), children && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center'
    }
  }, children));
}
Object.assign(__ds_scope, { RingChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/RingChart.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  success: ['circle-check', 'var(--status-success)', 'var(--status-success-bg)'],
  warning: ['triangle-alert', 'var(--status-warning)', 'var(--status-warning-bg)'],
  danger: ['circle-alert', 'var(--status-danger)', 'var(--status-danger-bg)'],
  info: ['info', 'var(--status-info)', 'var(--status-info-bg)'],
  running: ['loader', 'var(--status-running)', 'var(--status-running-bg)']
};
function Toast({
  tone = 'success',
  title,
  description,
  action,
  onClose,
  style
}) {
  const [icon, fg, bg] = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", {
    role: tone === 'danger' ? 'alert' : 'status',
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      width: '100%',
      maxWidth: 420,
      padding: '14px 12px 14px 14px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-raised)',
      boxShadow: 'var(--shadow-pop)',
      color: 'var(--text-body)',
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes bx-spin{to{transform:rotate(360deg)}}'), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: bg,
      color: fg
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    style: tone === 'running' ? {
      animation: 'bx-spin 1.1s linear infinite'
    } : undefined
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      paddingTop: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-strong)',
      lineHeight: 1.4
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      lineHeight: 1.45,
      marginTop: 2
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      gap: 8
    }
  }, action)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    size: "sm",
    variant: "ghost",
    icon: "x",
    label: "Dispensar",
    onClick: onClose
  }));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const TONES = {
  inverse: ['var(--surface-inverse)', 'var(--text-inverse)'],
  accent: ['var(--surface-accent)', 'var(--text-on-accent)'],
  default: ['var(--surface-raised-2)', 'var(--text-strong)']
};
function TooltipBubble({
  children,
  tone = 'inverse',
  stem = 8,
  placement = 'top',
  style
}) {
  const [bg, fg] = TONES[tone] || TONES.inverse;
  const bubble = /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      height: 26,
      padding: '0 10px',
      borderRadius: 'var(--radius-pill)',
      background: bg,
      color: fg,
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      boxShadow: '0 6px 18px -6px rgba(2,6,12,.5)'
    }
  }, children);
  const pin = stem ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1.5,
      height: stem,
      background: bg
    }
  }) : null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      ...style
    }
  }, placement === 'top' ? /*#__PURE__*/React.createElement(React.Fragment, null, bubble, pin) : /*#__PURE__*/React.createElement(React.Fragment, null, pin, bubble));
}
function Tooltip({
  content,
  children,
  tone = 'inverse',
  placement = 'top',
  open,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const show = open !== undefined ? open : hover;
  const pos = placement === 'top' ? {
    bottom: 'calc(100% + 4px)'
  } : {
    top: 'calc(100% + 4px)'
  };
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    }
  }, children, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      ...pos,
      zIndex: 40,
      transform: 'translateX(-50%) translateY(' + (show ? 0 : placement === 'top' ? 4 : -4) + 'px)',
      opacity: show ? 1 : 0,
      transition: 'opacity var(--dur-fast) var(--ease-standard), transform var(--dur-base) var(--ease-standard)',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement(TooltipBubble, {
    tone: tone,
    placement: placement,
    stem: 6
  }, content)));
}
Object.assign(__ds_scope, { TooltipBubble, Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/data/BarChart.jsx
try { (() => {
function BarChart({
  data = [],
  height = 220,
  highlight,
  defaultHighlight,
  onHighlight,
  formatValue = v => v,
  maxBarWidth = 72,
  style
}) {
  const [inner, setInner] = React.useState(defaultHighlight != null ? defaultHighlight : data.reduce((m, d, i) => d.value > data[m].value ? i : m, 0));
  const hi = highlight != null ? highlight : inner;
  const max = Math.max(1, ...data.map(d => Math.max(d.value, d.target || 0)));
  const usable = height - 44;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 10,
      height
    }
  }, data.map((d, i) => {
    const on = i === hi;
    const vh = Math.max(18, d.value / max * usable);
    const th = d.target && d.target > d.value ? Math.max(18, (d.target - d.value) / max * usable) : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onMouseEnter: () => {
        setInner(i);
        onHighlight && onHighlight(i);
      },
      style: {
        position: 'relative',
        flex: 1,
        maxWidth: maxBarWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 4,
        cursor: 'default'
      }
    }, on && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.TooltipBubble, {
      tone: "accent",
      stem: 12
    }, formatValue(d.value, d))), th > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        height: th,
        borderRadius: 18,
        background: 'repeating-linear-gradient(135deg, var(--pattern-ink) 0 1.5px, transparent 1.5px 7px), color-mix(in oklab, var(--surface-raised-2) 45%, transparent)',
        opacity: on ? 1 : 0.85
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: vh,
        borderRadius: 18,
        transition: 'height var(--dur-chart) var(--ease-standard), background var(--dur-base)',
        background: on ? 'radial-gradient(circle, var(--pattern-ink-on-accent) 1.1px, transparent 1.6px) 0 0 / 7px 7px, var(--data-1)' : 'var(--surface-raised-2)'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      maxWidth: maxBarWidth,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 24,
      padding: '0 9px',
      borderRadius: 12,
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 12,
      background: i === hi ? 'var(--surface-raised-2)' : 'transparent',
      color: i === hi ? 'var(--text-strong)' : 'var(--text-muted)'
    }
  }, d.label)))));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  defaultChecked = false,
  indeterminate = false,
  onChange,
  label,
  description,
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    const n = !on;
    setInner(n);
    onChange && onChange(n);
  };
  const filled = on || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    onClick: e => {
      e.preventDefault();
      toggle();
    },
    style: {
      display: 'inline-flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "checkbox",
    "aria-checked": indeterminate ? 'mixed' : on,
    tabIndex: disabled ? -1 : 0,
    onKeyDown: e => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    style: {
      width: 18,
      height: 18,
      flexShrink: 0,
      borderRadius: 6,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: description ? 1 : 0,
      background: filled ? 'var(--surface-accent)' : 'var(--bg-sunken)',
      border: '1.5px solid ' + (filled ? 'var(--surface-accent)' : 'var(--border-strong)'),
      color: 'var(--text-on-accent)',
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast)'
    }
  }, indeterminate ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 13,
    strokeWidth: 2.5
  }) : on ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 2.5
  }) : null), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: 'var(--control-sm)',
  md: 'var(--control-md)',
  lg: 'var(--control-lg)'
};
function Input({
  label,
  hint,
  error,
  icon,
  trailing,
  size = 'md',
  shape = 'pill',
  disabled = false,
  value,
  defaultValue,
  placeholder,
  type = 'text',
  onChange,
  id,
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : undefined;
  const fid = id || autoId;
  const border = error ? 'var(--status-danger)' : focus ? 'var(--border-accent)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 0,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: H[size] || H.md,
      padding: '0 16px',
      borderRadius: shape === 'pill' ? 'var(--radius-pill)' : 'var(--radius-md)',
      background: 'var(--bg-sunken)',
      border: '1px solid ' + border,
      boxShadow: focus ? '0 0 0 3px ' + (error ? 'var(--status-danger-bg)' : 'var(--surface-accent-soft)') : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17,
    color: focus ? 'var(--icon-strong)' : 'var(--icon-muted)'
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      border: 0,
      outline: 'none',
      background: 'transparent',
      color: 'var(--text-strong)',
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 13 : 14,
      ...inputStyle
    }
  })), trailing), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: error ? 'var(--status-danger)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  options = [],
  value,
  defaultValue,
  onChange,
  name,
  direction = 'column',
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const cur = value !== undefined ? value : inner;
  const norm = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    "aria-label": name,
    style: {
      display: 'flex',
      flexDirection: direction,
      gap: direction === 'row' ? 20 : 12,
      ...style
    }
  }, norm.map(o => {
    const on = o.value === cur;
    return /*#__PURE__*/React.createElement("label", {
      key: o.value,
      onClick: () => {
        if (disabled) return;
        setInner(o.value);
        onChange && onChange(o.value);
      },
      style: {
        display: 'inline-flex',
        alignItems: o.description ? 'flex-start' : 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        userSelect: 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      role: "radio",
      "aria-checked": on,
      tabIndex: 0,
      style: {
        width: 18,
        height: 18,
        flexShrink: 0,
        borderRadius: '50%',
        marginTop: o.description ? 1 : 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-sunken)',
        border: '1.5px solid ' + (on ? 'var(--surface-accent)' : 'var(--border-strong)'),
        transition: 'border-color var(--dur-fast)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--surface-accent)',
        transform: on ? 'scale(1)' : 'scale(0)',
        transition: 'transform var(--dur-base) var(--ease-standard)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        color: 'var(--text-strong)'
      }
    }, o.label), o.description && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: 'var(--text-muted)'
      }
    }, o.description)));
  }));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = 'Selecionar',
  label,
  size = 'md',
  icon,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const [inner, setInner] = React.useState(defaultValue);
  const ref = React.useRef(null);
  const current = value !== undefined ? value : inner;
  const norm = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const sel = norm.find(o => o.value === current);
  React.useEffect(() => {
    if (!open) return;
    const close = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const pick = v => {
    setInner(v);
    setOpen(false);
    onChange && onChange(v);
  };
  const h = size === 'sm' ? 'var(--control-sm)' : 'var(--control-md)';
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative',
      display: 'inline-flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(!open),
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: h,
      padding: '0 12px 0 16px',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      background: open ? 'var(--surface-control-hover)' : 'var(--surface-control)',
      border: '1px solid ' + (open ? 'var(--border-strong)' : 'var(--border-subtle)'),
      boxShadow: 'var(--shadow-control)',
      color: sel ? 'var(--text-strong)' : 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: 'left'
    }
  }, sel ? sel.label : placeholder), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15,
    style: {
      transition: 'transform var(--dur-base) var(--ease-standard)',
      transform: open ? 'rotate(180deg)' : 'none'
    }
  })), open && /*#__PURE__*/React.createElement("div", {
    role: "listbox",
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      minWidth: '100%',
      zIndex: 30,
      padding: 6,
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-raised)',
      boxShadow: 'var(--shadow-pop)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, norm.map(o => {
    const on = o.value === current;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      type: "button",
      role: "option",
      "aria-selected": on,
      onClick: () => pick(o.value),
      onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-control-hover)',
      onMouseLeave: e => e.currentTarget.style.background = 'transparent',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 36,
        padding: '0 10px',
        border: 0,
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        cursor: 'pointer',
        color: on ? 'var(--text-accent)' : 'var(--text-body)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        whiteSpace: 'nowrap',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, o.label), on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 15,
      strokeWidth: 2
    }));
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  defaultChecked = false,
  onChange,
  label,
  description,
  size = 'md',
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const w = size === 'sm' ? 30 : 38,
    h = size === 'sm' ? 18 : 22,
    k = h - 6;
  const toggle = () => {
    if (disabled) return;
    setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    disabled: disabled,
    onClick: toggle,
    style: {
      position: 'relative',
      width: w,
      height: h,
      flexShrink: 0,
      padding: 0,
      border: 0,
      borderRadius: 'var(--radius-pill)',
      cursor: 'inherit',
      background: on ? 'var(--surface-accent)' : 'var(--surface-raised-2)',
      boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--border-default)',
      transition: 'background var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: k,
      height: k,
      borderRadius: '50%',
      background: on ? 'var(--abyss-900)' : 'var(--steel-300)',
      transform: on ? 'translateX(' + (w - k - 6) + 'px)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-standard), background var(--dur-base)'
    }
  })), (label || description) && /*#__PURE__*/React.createElement("span", {
    onClick: toggle,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-strong)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ModuleNav.jsx
try { (() => {
function NavItem({
  item,
  on,
  compact,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 14,
    fontWeight: on ? 500 : 400,
    whiteSpace: 'nowrap',
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast), border-color var(--dur-fast)'
  };
  const look = compact ? {
    width: 48,
    height: 48,
    borderRadius: '50%',
    padding: 0,
    border: '1px solid ' + (on ? 'transparent' : 'var(--border-subtle)'),
    background: on ? 'var(--surface-accent)' : hover ? 'var(--surface-control-hover)' : 'var(--surface-control)',
    color: on ? 'var(--text-on-accent)' : 'var(--icon-default)'
  } : {
    height: 'var(--control-md)',
    padding: '0 16px 0 14px',
    borderRadius: 'var(--radius-pill)',
    border: '1px solid ' + (on ? 'var(--border-accent)' : 'var(--border-subtle)'),
    background: on ? 'var(--surface-accent-soft)' : hover ? 'var(--surface-control-hover)' : 'var(--surface-control)',
    color: on ? 'var(--text-accent)' : 'var(--text-body)',
    boxShadow: on ? 'none' : 'var(--shadow-control)'
  };
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-current": on ? 'page' : undefined,
    "aria-label": compact ? item.label : undefined,
    title: compact ? item.label : undefined,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...look
    }
  }, item.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: item.icon,
    size: compact ? 20 : 17
  }), !compact && item.label, !compact && item.badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 18,
      height: 18,
      padding: '0 5px',
      borderRadius: 9,
      background: on ? 'var(--surface-accent)' : 'var(--surface-raised-2)',
      color: on ? 'var(--text-on-accent)' : 'var(--text-body)',
      fontSize: 11,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, item.badge));
}
function ModuleNav({
  items = [],
  value,
  defaultValue,
  onChange,
  compact = false,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue !== undefined ? defaultValue : items[0] && items[0].id);
  const cur = value !== undefined ? value : inner;
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "M\xF3dulos",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 8 : 6,
      flexWrap: 'wrap',
      ...style
    }
  }, items.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    item: it,
    compact: compact,
    on: it.id === cur,
    onClick: () => {
      setInner(it.id);
      onChange && onChange(it.id);
    }
  })));
}
Object.assign(__ds_scope, { ModuleNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ModuleNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  style
}) {
  const norm = items.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const [inner, setInner] = React.useState(defaultValue !== undefined ? defaultValue : norm[0] && norm[0].value);
  const cur = value !== undefined ? value : inner;
  const pick = v => {
    setInner(v);
    onChange && onChange(v);
  };
  const pill = variant === 'pill';
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: pill ? 2 : 32,
      padding: pill ? 4 : 0,
      borderRadius: pill ? 'var(--radius-pill)' : 0,
      background: pill ? 'var(--surface-control)' : 'transparent',
      border: pill ? '1px solid var(--border-subtle)' : 0,
      width: 'fit-content',
      ...style
    }
  }, norm.map(o => {
    const on = o.value === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      role: "tab",
      "aria-selected": on,
      type: "button",
      onClick: () => pick(o.value),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: 0,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        fontSize: pill ? 13 : 15,
        fontWeight: on ? 500 : 400,
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        height: pill ? 32 : 36,
        padding: pill ? '0 14px' : '0 0 10px',
        borderRadius: pill ? 'var(--radius-pill)' : 0,
        background: pill && on ? 'var(--surface-raised-2)' : 'transparent',
        boxShadow: pill && on ? 'var(--shadow-control)' : 'none',
        transition: 'color var(--dur-fast) var(--ease-standard), background var(--dur-fast)'
      }
    }, o.label, o.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontVariantNumeric: 'tabular-nums',
        color: on ? 'var(--text-accent)' : 'var(--text-subtle)'
      }
    }, o.count), !pill && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        borderRadius: 2,
        background: on ? 'var(--text-strong)' : 'transparent',
        transition: 'background var(--dur-base)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Accordion.jsx
try { (() => {
function Accordion({
  items = [],
  defaultOpen,
  multiple = false,
  style
}) {
  const [open, setOpen] = React.useState(() => new Set(defaultOpen != null ? [].concat(defaultOpen) : items[0] ? [items[0].id] : []));
  const toggle = id => setOpen(prev => {
    const n = new Set(multiple ? prev : []);
    if (prev.has(id)) n.delete(id);else n.add(id);
    return n;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, items.map(it => {
    const on = open.has(it.id);
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      style: {
        borderRadius: 'var(--radius-card-inner)',
        background: on ? 'var(--surface-raised)' : 'transparent',
        boxShadow: on ? 'var(--shadow-card)' : 'none',
        transition: 'background var(--dur-base) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => toggle(it.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: on ? '14px 14px 6px 18px' : '10px 14px 10px 18px',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        fontWeight: 500,
        color: on ? 'var(--text-strong)' : 'var(--text-body)',
        letterSpacing: '-0.01em'
      }
    }, it.title), it.meta && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, it.meta)), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
      size: "sm",
      icon: on ? 'chevron-up' : 'chevron-down',
      label: on ? 'Recolher' : 'Expandir',
      onClick: e => {
        e.stopPropagation();
        toggle(it.id);
      }
    })), on && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '6px 18px 18px'
      }
    }, it.content));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
const TONES = {
  default: ['var(--surface-card)', 'var(--text-body)', 'var(--text-strong)', 'var(--text-muted)'],
  raised: ['var(--surface-raised)', 'var(--text-body)', 'var(--text-strong)', 'var(--text-muted)'],
  accent: ['var(--surface-accent)', 'var(--text-on-accent)', 'var(--text-on-accent)', 'var(--text-on-accent-muted)'],
  sunken: ['var(--bg-sunken)', 'var(--text-body)', 'var(--text-strong)', 'var(--text-muted)']
};
function Card({
  title,
  subtitle,
  icon,
  actions,
  tone = 'default',
  padding = 24,
  radius = 24,
  notchGap = 8,
  fillet = 16,
  titleSize = 18,
  children,
  style,
  bodyStyle,
  onClick
}) {
  const [bg, fg, tc, mc] = TONES[tone] || TONES.default;
  const shadow = tone === 'accent' ? 'none' : 'var(--shadow-card)';
  const patternInk = tone === 'accent' ? {
    '--pattern-ink': 'var(--pattern-ink-on-accent)'
  } : null;
  const head = title || subtitle || icon ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }
  }, icon, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: titleSize,
      fontWeight: 500,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
      color: tc,
      textWrap: 'balance'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: mc
    }
  }, subtitle)) : null;
  if (!actions) {
    return /*#__PURE__*/React.createElement("section", {
      onClick: onClick,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: bg,
        color: fg,
        borderRadius: radius,
        padding,
        boxShadow: shadow,
        minWidth: 0,
        textAlign: 'left',
        ...patternInk,
        ...style
      }
    }, head, children != null && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        ...bodyStyle
      }
    }, children));
  }
  return /*#__PURE__*/React.createElement("section", {
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      color: fg,
      minWidth: 0,
      textAlign: 'left',
      ...patternInk,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1,
      minWidth: 0,
      background: bg,
      borderRadius: radius + 'px ' + radius + 'px 0 0',
      padding: padding - 4 + 'px ' + padding + 'px 0',
      boxShadow: shadow
    }
  }, head, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: -fillet,
      bottom: 0,
      width: fillet,
      height: fillet,
      pointerEvents: 'none',
      background: 'radial-gradient(circle at 100% 0, transparent ' + (fillet - 0.5) + 'px, ' + bg + ' ' + fillet + 'px)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '0 0 ' + notchGap + 'px ' + notchGap + 'px'
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minWidth: 0,
      background: bg,
      borderRadius: '0 ' + radius + 'px ' + radius + 'px ' + radius + 'px',
      padding: notchGap + 4 + 'px ' + padding + 'px ' + padding + 'px',
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Dialog.jsx
try { (() => {
function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  width = 480,
  style
}) {
  React.useEffect(() => {
    if (!open) return;
    const k = e => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(var(--blur-overlay))',
      WebkitBackdropFilter: 'blur(var(--blur-overlay))',
      animation: 'bx-fade var(--dur-base) var(--ease-enter)'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes bx-fade{from{opacity:0}}@keyframes bx-rise{from{opacity:0;transform:translateY(8px) scale(.985)}}'), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-pop)',
      color: 'var(--text-body)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'bx-rise var(--dur-slow) var(--ease-standard)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      padding: '24px 20px 0 24px'
    }
  }, icon, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      paddingTop: 4
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 600,
      color: 'var(--text-strong)',
      letterSpacing: '-0.015em'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-muted)'
    }
  }, description)), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    size: "sm",
    icon: "x",
    label: "Fechar",
    onClick: onClose
  })), children && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 24px 0'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      padding: '24px'
    }
  }, footer), !footer && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  })));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Dialog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/app.jsx
try { (() => {
// BOSUN webapp — app router
(() => {
  const {
    Button
  } = window.BOSUNDesignSystem_c587fa;
  function App() {
    const [authed, setAuthed] = React.useState(true);
    const [route, setRoute] = React.useState('home');
    const [palette, setPalette] = React.useState(false);
    const [toasts, setToasts] = React.useState([]);
    const dismiss = id => setToasts(ts => ts.filter(t => t.id !== id));
    const notify = t => {
      const id = Date.now() + Math.random();
      setToasts(ts => [{
        ...t,
        id
      }, ...ts].slice(0, 3));
      if (t.tone !== 'danger') setTimeout(() => dismiss(id), 5000);
    };
    const go = r => {
      setRoute(r);
      window.scrollTo(0, 0);
    };
    React.useEffect(() => {
      localStorage.removeItem('bosun-kit-authed');
      localStorage.removeItem('bosun-kit-route');
    }, []);
    React.useEffect(() => {
      const k = e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setPalette(true);
        }
        if (e.key === 'Escape') setPalette(false);
      };
      window.addEventListener('keydown', k);
      return () => window.removeEventListener('keydown', k);
    }, []);
    if (!authed) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BosunLoginScreen, {
      onLogin: () => {
        setAuthed(true);
        go('home');
        notify({
          tone: 'success',
          title: 'Seu espaço de trabalho está pronto.'
        });
      }
    }), /*#__PURE__*/React.createElement(BosunToastHost, {
      toasts: toasts,
      onDismiss: dismiss
    }));
    let screen;
    if (route === 'tasks') screen = /*#__PURE__*/React.createElement(BosunTasksScreen, {
      notify: notify
    });else if (route === 'flows') screen = /*#__PURE__*/React.createElement(BosunFlowsScreen, {
      notify: notify
    });else if (route === 'connect') screen = /*#__PURE__*/React.createElement(BosunConnectScreen, {
      notify: notify
    });else if (route === 'docs') screen = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(BosunPageHeader, {
      title: "Documentos",
      tabs: ['Recentes', 'Compartilhados', 'Modelos'],
      tab: "Recentes"
    }), /*#__PURE__*/React.createElement(BosunEmptyState, {
      icon: "file-text",
      title: "Nenhum documento ainda",
      body: "Crie seu primeiro documento para come\xE7ar. Ele fica dispon\xEDvel para tarefas e automa\xE7\xF5es.",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: "plus",
        onClick: () => notify({
          tone: 'info',
          title: 'Documento criado em Rascunhos.'
        })
      }, "Novo documento")
    }));else screen = /*#__PURE__*/React.createElement(BosunHomeScreen, {
      onNavigate: go,
      notify: notify
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100vh'
      }
    }, /*#__PURE__*/React.createElement(BosunTopBar, {
      route: route,
      onNavigate: go,
      onSearch: () => setPalette(true),
      onLogout: () => setAuthed(false)
    }), /*#__PURE__*/React.createElement("main", {
      style: {
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: '0 32px 48px'
      },
      "data-screen-label": route
    }, screen), /*#__PURE__*/React.createElement(BosunCommandPalette, {
      open: palette,
      onClose: () => setPalette(false),
      onNavigate: go
    }), /*#__PURE__*/React.createElement(BosunToastHost, {
      toasts: toasts,
      onDismiss: dismiss
    }));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/connect.jsx
try { (() => {
// BOSUN webapp — Integrações (connections grid + permission dialog)
(() => {
  const {
    Card,
    IconButton,
    Badge,
    Icon,
    Button,
    Dialog,
    Checkbox,
    Radio,
    Input
  } = window.BOSUNDesignSystem_c587fa;
  const TOOLS = [{
    id: 'gcal',
    name: 'Google Agenda',
    icon: 'calendar',
    desc: 'Eventos e disponibilidade',
    state: 'warning',
    note: 'Acesso expira em 2 dias'
  }, {
    id: 'gmail',
    name: 'Gmail',
    icon: 'mail',
    desc: 'Leitura e envio de e-mails',
    state: 'connected',
    note: 'Sincronizado há 4 min'
  }, {
    id: 'sheets',
    name: 'Planilhas',
    icon: 'database',
    desc: 'Dados para relatórios',
    state: 'connected',
    note: 'Sincronizado há 1 h'
  }, {
    id: 'erp',
    name: 'ERP Financeiro',
    icon: 'layers',
    desc: 'Contas, notas e extratos',
    state: 'error',
    note: 'Credenciais inválidas'
  }, {
    id: 'chat',
    name: 'Chat da equipe',
    icon: 'message-square',
    desc: 'Avisos em canais',
    state: 'available'
  }, {
    id: 'drive',
    name: 'Drive',
    icon: 'folder',
    desc: 'Arquivos e pastas',
    state: 'available'
  }, {
    id: 'hooks',
    name: 'Webhooks',
    icon: 'webhook',
    desc: 'Eventos de qualquer sistema',
    state: 'available'
  }, {
    id: 'cal',
    name: 'Agenda pública',
    icon: 'calendar-clock',
    desc: 'Agendamentos de clientes',
    state: 'available'
  }];
  const BADGE = {
    connected: ['success', 'Conectada'],
    warning: ['warning', 'Atenção'],
    error: ['danger', 'Erro'],
    available: ['neutral', 'Disponível']
  };
  function ToolCard({
    t,
    onConnect,
    onFix
  }) {
    const [tone, label] = BADGE[t.state];
    const connected = t.state !== 'available';
    return /*#__PURE__*/React.createElement(Card, {
      title: t.name,
      subtitle: t.desc,
      icon: /*#__PURE__*/React.createElement("span", {
        style: {
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: connected ? 'var(--surface-accent-soft)' : 'var(--surface-raised)',
          color: connected ? 'var(--text-accent)' : 'var(--icon-default)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: t.icon,
        size: 20
      })),
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: connected ? 'settings' : 'plus',
        label: connected ? 'Configurar' : 'Conectar',
        variant: connected ? 'control' : 'accent',
        onClick: () => connected ? onFix(t) : onConnect(t)
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: tone,
      dot: true
    }, label), t.note && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: t.state === 'error' ? 'var(--status-danger)' : 'var(--text-subtle)'
      }
    }, t.note)));
  }
  function ConnectScreen({
    notify
  }) {
    const [tools, setTools] = React.useState(TOOLS);
    const [dlg, setDlg] = React.useState(null);
    const [access, setAccess] = React.useState('read');
    const [q, setQ] = React.useState('');
    const confirm = () => {
      setTools(tools.map(x => x.id === dlg.id ? {
        ...x,
        state: 'connected',
        note: 'Conectada agora'
      } : x));
      notify({
        tone: 'success',
        title: dlg.name + ' conectada.',
        description: access === 'read' ? 'Acesso somente leitura.' : 'Acesso de leitura e escrita.'
      });
      setDlg(null);
    };
    const fix = t => {
      if (t.state === 'error') notify({
        tone: 'danger',
        title: 'Não foi possível conectar esta ferramenta.',
        description: 'Revise as credenciais e tente novamente.'
      });else setDlg(t);
    };
    const shown = tools.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
    const connected = tools.filter(t => t.state !== 'available');
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(BosunPageHeader, {
      title: "Integra\xE7\xF5es",
      tabs: ['Todas', 'Conectadas', 'Disponíveis'],
      tab: "Todas",
      right: /*#__PURE__*/React.createElement(Input, {
        icon: "search",
        size: "md",
        placeholder: "Buscar ferramenta",
        value: q,
        onChange: e => setQ(e.target.value),
        style: {
          width: 280
        }
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '.04em',
        color: 'var(--text-subtle)',
        margin: '0 0 12px'
      }
    }, connected.length, " CONECTADAS \xB7 ", tools.length - connected.length, " DISPON\xCDVEIS"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 16
      }
    }, shown.map(t => /*#__PURE__*/React.createElement(ToolCard, {
      key: t.id,
      t: t,
      onConnect: setDlg,
      onFix: fix
    }))), /*#__PURE__*/React.createElement(Dialog, {
      open: !!dlg,
      onClose: () => setDlg(null),
      width: 520,
      icon: dlg && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--surface-raised)',
          color: 'var(--text-accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: dlg.icon,
        size: 20
      })),
      title: dlg ? 'Conectar ' + dlg.name : '',
      description: "Voc\xEA decide quais informa\xE7\xF5es esta integra\xE7\xE3o pode acessar.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        onClick: () => setDlg(null)
      }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: "shield-check",
        onClick: confirm
      }, "Permitir acesso"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(Radio, {
      name: "N\xEDvel de acesso",
      value: access,
      onChange: setAccess,
      options: [{
        value: 'read',
        label: 'Somente leitura',
        description: 'A BOSUN vê os dados, mas não altera nada.'
      }, {
        value: 'write',
        label: 'Leitura e escrita',
        description: 'Necessário para automações que criam ou editam itens.'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: 'var(--border-subtle)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "Itens dos \xFAltimos 90 dias",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Itens compartilhados com voc\xEA"
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Metadados (t\xEDtulos, datas, participantes)",
      defaultChecked: true
    })))));
  }
  Object.assign(window, {
    BosunConnectScreen: ConnectScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/connect.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/flows.jsx
try { (() => {
// BOSUN webapp — Automações (flows list + flow detail)
(() => {
  const {
    Card,
    IconButton,
    Badge,
    Icon,
    Button,
    Switch,
    Tabs
  } = window.BOSUNDesignSystem_c587fa;
  const FLOWS = [{
    id: 'flow_8f2c',
    name: 'Resumo diário de vendas',
    trigger: 'Todos os dias, 8h',
    runs: 214,
    on: true,
    last: 'Concluído às 08:00'
  }, {
    id: 'flow_3a91',
    name: 'Triagem de e-mails de suporte',
    trigger: 'Novo e-mail em suporte@',
    runs: 1290,
    on: true,
    last: 'Executando agora'
  }, {
    id: 'flow_c07d',
    name: 'Lembrete de faturas vencidas',
    trigger: 'Toda segunda, 9h',
    runs: 32,
    on: true,
    last: 'Falhou há 2 dias'
  }, {
    id: 'flow_51be',
    name: 'Onboarding de clientes',
    trigger: 'Novo contrato assinado',
    runs: 18,
    on: false,
    last: 'Pausado'
  }];
  const STEPS = [['clock', 'Gatilho', 'Todos os dias às 8h'], ['database', 'Buscar dados', 'Planilha “Vendas 2026”, aba Diário'], ['sparkles', 'Gerar resumo', 'Totais, variação e destaques'], ['send', 'Enviar', 'E-mail para equipe-comercial@']];
  function stateOf(f) {
    if (!f.on) return ['neutral', 'Pausado'];
    if (f.last.startsWith('Executando')) return ['running', 'Em execução'];
    if (f.last.startsWith('Falhou')) return ['danger', 'Falhou'];
    return ['success', 'Ativo'];
  }
  function StepNode({
    icon,
    title,
    body,
    state,
    last
  }) {
    const color = state === 'done' ? 'var(--signal-400)' : state === 'running' ? 'var(--mist)' : 'var(--steel-500)';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '44px minmax(0,1fr) auto',
        gap: 16,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        alignSelf: 'stretch'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: state === 'done' ? 'var(--surface-accent)' : 'var(--surface-raised)',
        color: state === 'done' ? 'var(--text-on-accent)' : color,
        boxShadow: state === 'running' ? 'var(--shadow-glow)' : 'none',
        transition: 'background var(--dur-base), box-shadow var(--dur-base)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: state === 'running' ? 'loader' : icon,
      size: 18,
      style: state === 'running' ? {
        animation: 'bx-spin 1s linear infinite'
      } : undefined
    })), !last && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        width: 0,
        minHeight: 28,
        borderLeft: '1.5px dotted ' + (state === 'done' ? 'var(--signal-400)' : 'var(--steel-600)'),
        margin: '6px 0'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: 4,
        paddingBottom: last ? 0 : 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 500,
        color: 'var(--text-strong)'
      }
    }, title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, body)), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: 10,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-subtle)'
      }
    }, state === 'done' ? 'ok' : state === 'running' ? '…' : ''));
  }
  function FlowsScreen({
    notify
  }) {
    const [flows, setFlows] = React.useState(FLOWS);
    const [sel, setSel] = React.useState(FLOWS[0].id);
    const [run, setRun] = React.useState(-1); // index of running step, -1 idle, 4 = finished
    const [log, setLog] = React.useState([['08:00:02', 'ok', 'flow_8f2c · etapa 4/4 · enviar · 212ms'], ['08:00:01', 'ok', 'flow_8f2c · etapa 3/4 · gerar-resumo · 1.4s'], ['08:00:00', 'ok', 'flow_8f2c · etapa 2/4 · buscar-dados · 380ms']]);
    const flow = flows.find(f => f.id === sel);
    React.useEffect(() => {
      if (run < 0 || run > 3) return;
      const t = setTimeout(() => {
        const now = new Date().toTimeString().slice(0, 8);
        setLog(l => [[now, 'ok', flow.id + ' · etapa ' + (run + 1) + '/4 · ' + STEPS[run][1].toLowerCase().replace(/ /g, '-') + ' · ' + (200 + Math.round(Math.random() * 900)) + 'ms'], ...l].slice(0, 6));
        if (run === 3) notify({
          tone: 'success',
          title: 'Fluxo concluído.',
          description: 'Todas as etapas foram executadas.'
        });
        setRun(run + 1);
      }, 900);
      return () => clearTimeout(t);
    }, [run]);
    const stepState = i => run < 0 ? 'done' : i < run ? 'done' : i === run ? 'running' : run > 3 ? 'done' : 'idle';
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("style", null, '@keyframes bx-spin{to{transform:rotate(360deg)}}'), /*#__PURE__*/React.createElement(BosunPageHeader, {
      title: "Automa\xE7\xF5es",
      tabs: ['Todas', 'Ativas', 'Pausadas', 'Com falha'],
      tab: "Todas",
      right: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: "plus",
        onClick: () => notify({
          tone: 'info',
          title: 'Escolha um gatilho para começar.'
        })
      }, "Nova automa\xE7\xE3o")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '400px minmax(0,1fr)',
        gap: 16,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, flows.map(f => {
      const [tone, label] = stateOf(f);
      const on = f.id === sel;
      return /*#__PURE__*/React.createElement("div", {
        key: f.id,
        onClick: () => {
          setSel(f.id);
          setRun(-1);
        },
        style: {
          cursor: 'pointer',
          padding: 20,
          borderRadius: 24,
          background: on ? 'var(--surface-raised)' : 'var(--surface-card)',
          boxShadow: on ? 'inset 0 0 0 1px var(--border-accent)' : 'var(--shadow-card)',
          transition: 'background var(--dur-fast)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 500,
          color: 'var(--text-strong)'
        }
      }, f.name), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          color: 'var(--text-muted)',
          marginTop: 4
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "zap",
        size: 13
      }), f.trigger)), /*#__PURE__*/React.createElement("span", {
        onClick: e => e.stopPropagation()
      }, /*#__PURE__*/React.createElement(Switch, {
        size: "sm",
        checked: f.on,
        onChange: v => {
          setFlows(flows.map(x => x.id === f.id ? {
            ...x,
            on: v,
            last: v ? 'Ativado agora' : 'Pausado'
          } : x));
          notify({
            tone: 'info',
            title: v ? 'Automação ativada.' : 'Automação pausada.',
            description: f.name
          });
        }
      }))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 14
        }
      }, /*#__PURE__*/React.createElement(Badge, {
        tone: tone,
        dot: true
      }, label), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--text-subtle)'
        }
      }, f.last), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-subtle)'
        }
      }, f.runs, " execu\xE7\xF5es")));
    })), /*#__PURE__*/React.createElement(Card, {
      title: flow.name,
      subtitle: /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 12
        }
      }, flow.id),
      titleSize: 24,
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "pencil",
        label: "Editar fluxo"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "copy",
        label: "Duplicar"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "ellipsis",
        label: "Mais"
      }))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '8px 0 28px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: run >= 0 && run < 4 ? undefined : 'play',
      loading: run >= 0 && run < 4,
      disabled: !flow.on,
      onClick: () => setRun(0)
    }, run >= 0 && run < 4 ? 'Executando…' : 'Executar agora'), /*#__PURE__*/React.createElement(Button, {
      iconLeft: "history"
    }, "Hist\xF3rico"), !flow.on && /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      dot: true
    }, "Ative a automa\xE7\xE3o para executar.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bx-grid",
      style: {
        borderRadius: 18,
        background: 'var(--bg-sunken)',
        padding: 24
      }
    }, STEPS.map(([ic, t, b], i) => /*#__PURE__*/React.createElement(StepNode, {
      key: t,
      icon: ic,
      title: t,
      body: b,
      state: stepState(i),
      last: i === STEPS.length - 1
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 500,
        color: 'var(--text-strong)'
      }
    }, "Registro de execu\xE7\xE3o"), /*#__PURE__*/React.createElement(Tabs, {
      variant: "pill",
      items: ['Hoje', '7 dias']
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 18,
        background: 'var(--bg-sunken)',
        padding: '14px 18px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        lineHeight: 1.9,
        color: 'var(--text-body)',
        minHeight: 220
      }
    }, log.map(([t, s, m], i) => /*#__PURE__*/React.createElement("div", {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-subtle)'
      }
    }, t), "  ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--signal-400)'
      }
    }, "\u2713"), " ", m))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10
      }
    }, [['99,1%', 'sucesso'], ['1,9s', 'duração média'], [String(flow.runs), 'execuções']].map(([v, l]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        borderRadius: 16,
        background: 'var(--surface-raised)',
        padding: '14px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: 26,
        letterSpacing: '-0.03em',
        color: 'var(--text-strong)'
      }
    }, v), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, l)))))))));
  }
  Object.assign(window, {
    BosunFlowsScreen: FlowsScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/flows.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/home.jsx
try { (() => {
// BOSUN webapp — Início (home dashboard)
(() => {
  const {
    Card,
    IconButton,
    Metric,
    ProgressBar,
    RingChart,
    BarChart,
    Accordion,
    Badge,
    Avatar,
    Icon,
    Button
  } = window.BOSUNDesignSystem_c587fa;
  const WEEK = {
    'Esta semana': [{
      label: 'Seg',
      value: 18,
      target: 26
    }, {
      label: 'Ter',
      value: 22,
      target: 26
    }, {
      label: 'Qua',
      value: 32,
      target: 34
    }, {
      label: 'Qui',
      value: 14,
      target: 28
    }, {
      label: 'Sex',
      value: 20,
      target: 24
    }, {
      label: 'Sáb',
      value: 6,
      target: 10
    }, {
      label: 'Dom',
      value: 4,
      target: 8
    }],
    'Hoje': [{
      label: '8h',
      value: 3,
      target: 4
    }, {
      label: '10h',
      value: 6,
      target: 6
    }, {
      label: '12h',
      value: 2,
      target: 5
    }, {
      label: '14h',
      value: 7,
      target: 8
    }, {
      label: '16h',
      value: 4,
      target: 6
    }, {
      label: '18h',
      value: 1,
      target: 3
    }, {
      label: '20h',
      value: 0,
      target: 1
    }]
  };
  function Capsule({
    h,
    children,
    cls,
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: cls,
      style: {
        height: h,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 500,
        ...style
      }
    }, children);
  }
  function FlowSplit() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        height: 140
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 58,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Capsule, {
      h: 58,
      cls: "bx-hatch bx-on-accent"
    }), /*#__PURE__*/React.createElement(Capsule, {
      h: 70,
      style: {
        background: 'var(--abyss-900)',
        color: 'var(--mist)'
      }
    }, "58%")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 58,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Capsule, {
      h: 60,
      style: {
        background: 'linear-gradient(180deg, rgba(255,255,255,.42), rgba(255,255,255,.14))',
        color: 'var(--abyss-900)'
      }
    }, "25%"), /*#__PURE__*/React.createElement(Capsule, {
      h: 72,
      cls: "bx-dots bx-on-accent"
    })));
  }
  function Legend({
    items
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, items.map(([c, l, v]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: 'var(--text-body)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: c
      }
    }), l, v != null && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, v))));
  }
  function ProjectBody({
    pct,
    steps,
    next,
    people
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(ProgressBar, {
      value: pct,
      size: "sm",
      label: "Andamento",
      valueLabel: steps
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 14,
        background: 'var(--surface-raised-2)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "flag",
      size: 15,
      color: "var(--text-accent)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 13,
        color: 'var(--text-body)'
      }
    }, next)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex'
      }
    }, people.map((p, i) => /*#__PURE__*/React.createElement(Avatar, {
      key: p,
      name: p,
      size: 28,
      style: {
        marginLeft: i ? -8 : 0,
        borderRadius: '50%',
        boxShadow: '0 0 0 2px var(--surface-raised)'
      }
    }))));
  }
  const ACTIVITY = [['09:41', 'circle-check', 'var(--status-success)', 'Fluxo “Resumo diário de vendas” concluído. Todas as etapas foram executadas.', 'Automações'], ['09:12', 'square-check', 'var(--text-accent)', 'Rafael Lima concluiu “Revisar proposta comercial”.', 'Tarefas'], ['08:55', 'triangle-alert', 'var(--status-warning)', 'O acesso ao Google Agenda expira em 2 dias. Renove para manter a sincronização.', 'Integrações'], ['08:30', 'file-text', 'var(--icon-default)', 'Ana Dias editou “Plano de lançamento Q4”.', 'Documentos']];
  function HomeScreen({
    onNavigate,
    notify
  }) {
    const [tab, setTab] = React.useState('Esta semana');
    const [filters, setFilters] = React.useState(['Minha equipe']);
    const data = WEEK[tab] || WEEK['Esta semana'];
    const done = data.reduce((a, d) => a + d.value, 0),
      planned = data.reduce((a, d) => a + d.target, 0);
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(BosunPageHeader, {
      title: "In\xEDcio",
      tabs: ['Esta semana', 'Hoje'],
      tab: tab,
      onTab: setTab,
      filters: filters,
      onRemoveFilter: f => setFilters(filters.filter(x => x !== f)),
      right: /*#__PURE__*/React.createElement(IconButton, {
        variant: "inverse",
        icon: "list-filter",
        label: "Filtros"
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 16,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      title: "Prioridades de hoje",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "bell",
        label: "Lembretes"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir tarefas",
        onClick: () => onNavigate('tasks')
      })),
      style: {
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement(Metric, {
      value: "12",
      suffix: "tarefas"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 26
      }
    }), /*#__PURE__*/React.createElement(ProgressBar, {
      size: "lg",
      thumb: true,
      value: 33,
      labels: ['8h', '10h', '12h', '14h', '16h', '18h']
    })), /*#__PURE__*/React.createElement(Card, {
      tone: "accent",
      title: "Automa\xE7\xF5es ativas",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        variant: "control",
        icon: "bell",
        label: "Alertas"
      }), /*#__PURE__*/React.createElement(IconButton, {
        variant: "accent",
        icon: "arrow-up-right",
        label: "Abrir automa\xE7\xF5es",
        onClick: () => onNavigate('flows'),
        style: {
          boxShadow: '0 0 0 1px rgba(11,23,38,.15)'
        }
      })),
      style: {
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        paddingBottom: 6
      }
    }, /*#__PURE__*/React.createElement(Metric, {
      onAccent: true,
      value: "24",
      size: "sm",
      label: "executando hoje"
    })), /*#__PURE__*/React.createElement(FlowSplit, null))), /*#__PURE__*/React.createElement(Card, {
      title: "Execu\xE7\xF5es hoje",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "bell",
        label: "Alertas"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Detalhes",
        onClick: () => onNavigate('flows')
      })),
      style: {
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingTop: 8
      }
    }, /*#__PURE__*/React.createElement(Legend, {
      items: [['var(--data-1)', 'Automáticas', '70%'], ['var(--data-2)', 'Manuais', '30%']]
    }), /*#__PURE__*/React.createElement(RingChart, {
      size: 132,
      thickness: 18,
      segments: [{
        value: 70,
        color: 'var(--data-1)'
      }, {
        value: 30,
        color: 'var(--data-2)'
      }]
    }))), /*#__PURE__*/React.createElement(Card, {
      title: "Projetos",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Todos os projetos"
      }),
      style: {
        gridRow: 'span 2',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement(Accordion, {
      items: [{
        id: 'q4',
        title: 'Lançamento Q4',
        meta: 'Prazo · 14 nov',
        content: /*#__PURE__*/React.createElement(ProjectBody, {
          pct: 57,
          steps: "8 de 14 etapas",
          next: "Aprovar pe\xE7as da campanha",
          people: ['Marina Costa', 'Rafael Lima', 'Ana Dias']
        })
      }, {
        id: 'ops',
        title: 'Rotina de operações',
        meta: 'Contínuo',
        content: /*#__PURE__*/React.createElement(ProjectBody, {
          pct: 82,
          steps: "23 de 28",
          next: "Conferir estoque semanal",
          people: ['Rafael Lima']
        })
      }, {
        id: 'fin',
        title: 'Fechamento mensal',
        meta: 'Prazo · 31 out',
        content: /*#__PURE__*/React.createElement(ProjectBody, {
          pct: 40,
          steps: "4 de 10",
          next: "Conciliar extratos",
          people: ['Ana Dias', 'Marina Costa']
        })
      }, {
        id: 'hire',
        title: 'Contratação design',
        meta: 'Prazo · 20 nov',
        content: /*#__PURE__*/React.createElement(ProjectBody, {
          pct: 20,
          steps: "1 de 5",
          next: "Triar portf\xF3lios",
          people: ['Marina Costa']
        })
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      iconLeft: "plus",
      fullWidth: true,
      style: {
        marginTop: 16
      },
      onClick: () => notify({
        tone: 'info',
        title: 'Crie seu primeiro modelo de projeto para começar.'
      })
    }, "Novo projeto")), /*#__PURE__*/React.createElement(Card, {
      title: "Andamento da semana",
      style: {
        gridColumn: 'span 3'
      },
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        variant: "inverse",
        icon: "list-filter",
        label: "Filtrar"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "calendar",
        label: "Per\xEDodo"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Relat\xF3rio"
      }))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 240px',
        gap: 32,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(BarChart, {
      data: data,
      height: 250,
      formatValue: v => v + ' concluídas'
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 36
      }
    }, /*#__PURE__*/React.createElement(Metric, {
      value: done,
      size: "lg",
      label: "tarefas conclu\xEDdas",
      delta: "18% vs. anterior"
    }), /*#__PURE__*/React.createElement(Metric, {
      value: planned,
      size: "sm",
      label: "planejadas no per\xEDodo"
    })))), /*#__PURE__*/React.createElement(Card, {
      title: "Atividade recente",
      style: {
        gridColumn: 'span 4'
      },
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "history",
        label: "Hist\xF3rico completo"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, ACTIVITY.map(([t, ic, c, txt, mod], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '56px 36px minmax(0,1fr) auto',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderTop: i ? '1px solid var(--border-subtle)' : 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-subtle)'
      }
    }, t), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--surface-raised)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: c
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 16
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        color: 'var(--text-body)'
      }
    }, txt), /*#__PURE__*/React.createElement(Badge, null, mod)))))));
  }
  Object.assign(window, {
    BosunHomeScreen: HomeScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/login.jsx
try { (() => {
// BOSUN webapp — Entrar (login)
(() => {
  const {
    Wordmark,
    Input,
    Button,
    IconButton,
    Checkbox
  } = window.BOSUNDesignSystem_c587fa;
  const NODES = [[14, 44, 'Tarefas', 'var(--signal-400)'], [40, 24, 'Automações', 'var(--mist)'], [72, 36, 'Integrações', 'var(--ocean-300)'], [54, 56, 'Documentos', 'var(--steel-400)']];
  function LoginScreen({
    onLogin
  }) {
    const [email, setEmail] = React.useState('marina@costa.studio');
    const [pw, setPw] = React.useState('');
    const [show, setShow] = React.useState(false);
    const [err, setErr] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const submit = e => {
      e.preventDefault();
      if (pw.length < 4) {
        setErr('Senha incorreta. Tente novamente ou redefina sua senha.');
        return;
      }
      setErr('');
      setBusy(true);
      setTimeout(() => onLogin(), 700);
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
        minHeight: '100vh',
        padding: 16,
        gap: 16,
        boxSizing: 'border-box'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bx-grid",
      style: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 32,
        background: 'var(--bg-sunken)',
        padding: 48,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement(Wordmark, {
      size: 24
    }), /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M14 44 C 22 26, 32 22, 40 24 S 62 40, 72 36 M40 24 C 46 40, 50 50, 54 56",
      fill: "none",
      stroke: "var(--steel-600)",
      strokeDasharray: "0.12 0.9",
      strokeLinecap: "round",
      vectorEffect: "non-scaling-stroke",
      style: {
        strokeWidth: 1.5
      }
    })), NODES.map(([x, y, l, c]) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        position: 'absolute',
        left: x + '%',
        top: y + '%',
        transform: 'translate(-8px, -50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: c,
        boxShadow: '0 0 0 6px rgba(244,247,250,.05)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-strong)',
        background: 'var(--surface-raised)',
        padding: '6px 12px',
        borderRadius: 999
      }
    }, l))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        position: 'relative',
        maxWidth: 560
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 56,
        lineHeight: 1.04,
        letterSpacing: '-0.035em'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 300,
        color: 'var(--text-muted)'
      }
    }, "Voc\xEA define o rumo."), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--text-strong)'
      }
    }, "BOSUN organiza a opera\xE7\xE3o.")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32
      }
    }, /*#__PURE__*/React.createElement("form", {
      onSubmit: submit,
      style: {
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 32,
        fontWeight: 600,
        letterSpacing: '-0.025em',
        color: 'var(--text-strong)'
      }
    }, "Entrar na BOSUN"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '8px 0 0',
        fontSize: 15,
        color: 'var(--text-muted)'
      }
    }, "Acesse sua \xE1rea de trabalho.")), /*#__PURE__*/React.createElement(Input, {
      shape: "rounded",
      size: "lg",
      label: "E-mail",
      type: "email",
      icon: "at-sign",
      value: email,
      onChange: e => setEmail(e.target.value)
    }), /*#__PURE__*/React.createElement(Input, {
      shape: "rounded",
      size: "lg",
      label: "Senha",
      type: show ? 'text' : 'password',
      icon: "lock",
      placeholder: "Sua senha",
      value: pw,
      error: err,
      onChange: e => setPw(e.target.value),
      trailing: /*#__PURE__*/React.createElement(IconButton, {
        size: "sm",
        variant: "ghost",
        icon: show ? 'eye-off' : 'eye',
        label: show ? 'Ocultar senha' : 'Mostrar senha',
        onClick: () => setShow(!show),
        style: {
          marginRight: -8
        }
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "Manter conectado",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => e.preventDefault(),
      style: {
        fontSize: 13
      }
    }, "Esqueci minha senha")), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      loading: busy
    }, busy ? 'Entrando…' : 'Entrar'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'var(--text-subtle)',
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--border-subtle)'
      }
    }), "ou", /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'var(--border-subtle)'
      }
    })), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      fullWidth: true,
      iconLeft: "key-round"
    }, "Entrar com SSO"), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '6px 0 0',
        fontSize: 13,
        color: 'var(--text-muted)',
        textAlign: 'center'
      }
    }, "Ainda n\xE3o tem conta? ", /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => e.preventDefault()
    }, "Come\xE7ar agora")))));
  }
  Object.assign(window, {
    BosunLoginScreen: LoginScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/shell.jsx
try { (() => {
// BOSUN webapp — shell: top bar, page header, command palette, toast host.
(() => {
  const {
    Wordmark,
    ModuleNav,
    IconButton,
    Avatar,
    Icon,
    Input,
    Toast,
    Tabs,
    Tag
  } = window.BOSUNDesignSystem_c587fa;
  const MODULES = [{
    id: 'home',
    label: 'Início',
    icon: 'house'
  }, {
    id: 'tasks',
    label: 'Tarefas',
    icon: 'list-checks',
    badge: 3
  }, {
    id: 'docs',
    label: 'Documentos',
    icon: 'file-text'
  }, {
    id: 'flows',
    label: 'Automações',
    icon: 'workflow'
  }, {
    id: 'connect',
    label: 'Integrações',
    icon: 'plug'
  }];
  function UserMenu({
    onLogout
  }) {
    const [open, setOpen] = React.useState(false);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOpen(!open),
      "aria-label": "Conta",
      style: {
        border: 0,
        padding: 0,
        background: 'none',
        cursor: 'pointer',
        borderRadius: '50%'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Marina Costa",
      size: 44,
      ring: open
    })), open && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        right: 0,
        top: 54,
        zIndex: 50,
        width: 220,
        padding: 6,
        borderRadius: 14,
        background: 'var(--surface-raised)',
        boxShadow: 'var(--shadow-pop)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 10px 12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: 'var(--text-strong)'
      }
    }, "Marina Costa"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, "marina@costa.studio")), [['settings', 'Configurações'], ['users', 'Equipe'], ['log-out', 'Sair']].map(([ic, l]) => /*#__PURE__*/React.createElement("button", {
      key: l,
      type: "button",
      onClick: () => {
        setOpen(false);
        if (ic === 'log-out') onLogout();
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-control-hover)',
      onMouseLeave: e => e.currentTarget.style.background = 'transparent',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        height: 38,
        padding: '0 10px',
        border: 0,
        borderRadius: 10,
        background: 'transparent',
        color: 'var(--text-body)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 16
    }), l))));
  }
  function TopBar({
    route,
    onNavigate,
    onSearch,
    onLogout
  }) {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 24,
        height: 'var(--nav-height)',
        padding: '0 32px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Wordmark, {
      size: 20
    })), /*#__PURE__*/React.createElement(ModuleNav, {
      items: MODULES,
      value: route,
      onChange: onNavigate
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "search",
      label: "Buscar (\u2318K)",
      onClick: onSearch
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell",
      label: "Notifica\xE7\xF5es",
      dot: true
    }), /*#__PURE__*/React.createElement(UserMenu, {
      onLogout: onLogout
    })));
  }
  function PageHeader({
    title,
    tabs,
    tab,
    onTab,
    filters = [],
    onRemoveFilter,
    right
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        padding: '20px 0 28px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 40,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        color: 'var(--text-strong)',
        lineHeight: 1
      }
    }, title), tabs && /*#__PURE__*/React.createElement(Tabs, {
      items: tabs,
      value: tab,
      onChange: onTab,
      style: {
        marginTop: 8
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, filters.map(f => /*#__PURE__*/React.createElement(Tag, {
      key: f,
      onRemove: () => onRemoveFilter && onRemoveFilter(f)
    }, f)), right));
  }
  const RESULTS = [{
    group: 'Ações',
    items: [['plus', 'Criar tarefa', 'tasks'], ['workflow', 'Nova automação', 'flows'], ['plug', 'Conectar ferramenta', 'connect']]
  }, {
    group: 'Tarefas',
    items: [['square-check', 'Revisar proposta comercial · Lançamento Q4', 'tasks'], ['square-check', 'Fechar relatório de despesas · Financeiro', 'tasks']]
  }, {
    group: 'Automações',
    items: [['workflow', 'Resumo diário de vendas', 'flows'], ['workflow', 'Triagem de e-mails de suporte', 'flows']]
  }];
  function CommandPalette({
    open,
    onClose,
    onNavigate
  }) {
    const [q, setQ] = React.useState('');
    React.useEffect(() => {
      if (open) setQ('');
    }, [open]);
    if (!open) return null;
    const groups = RESULTS.map(g => ({
      ...g,
      items: g.items.filter(i => i[1].toLowerCase().includes(q.toLowerCase()))
    })).filter(g => g.items.length);
    return /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'var(--surface-overlay)',
        backdropFilter: 'blur(var(--blur-overlay))',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 120
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        width: 640,
        maxHeight: 460,
        alignSelf: 'flex-start',
        borderRadius: 24,
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-pop)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Input, {
      autoFocus: true,
      size: "lg",
      icon: "search",
      placeholder: "Buscar conte\xFAdo e a\xE7\xF5es",
      value: q,
      onChange: e => setQ(e.target.value),
      trailing: /*#__PURE__*/React.createElement("kbd", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-subtle)',
          padding: '2px 6px',
          borderRadius: 6,
          border: '1px solid var(--border-default)'
        }
      }, "esc")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        overflow: 'auto',
        padding: '4px 4px 6px'
      }
    }, groups.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '28px 12px',
        textAlign: 'center',
        fontSize: 14,
        color: 'var(--text-muted)'
      }
    }, "Nenhum resultado para \u201C", q, "\u201D."), groups.map(g => /*#__PURE__*/React.createElement("div", {
      key: g.group,
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '6px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-subtle)',
        letterSpacing: '.04em'
      }
    }, g.group.toUpperCase()), g.items.map(([ic, l, r]) => /*#__PURE__*/React.createElement("button", {
      key: l,
      type: "button",
      onClick: () => {
        onNavigate(r);
        onClose();
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-raised)',
      onMouseLeave: e => e.currentTarget.style.background = 'transparent',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        height: 44,
        padding: '0 10px',
        border: 0,
        borderRadius: 12,
        background: 'transparent',
        color: 'var(--text-body)',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'var(--surface-control)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--icon-default)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 15
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, l), /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 15,
      color: "var(--icon-muted)"
    }))))))));
  }
  function ToastHost({
    toasts,
    onDismiss
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 400
      }
    }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
      key: t.id,
      tone: t.tone,
      title: t.title,
      description: t.description,
      onClose: () => onDismiss(t.id)
    })));
  }
  function EmptyState({
    icon,
    title,
    body,
    action
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '96px 24px',
        borderRadius: 24,
        background: 'var(--surface-card)',
        textAlign: 'center'
      },
      className: "bx-grid"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'var(--surface-raised)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-accent)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 26
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--text-strong)',
        letterSpacing: '-0.02em'
      }
    }, title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-muted)',
        maxWidth: 380
      }
    }, body), action);
  }
  Object.assign(window, {
    BosunTopBar: TopBar,
    BosunPageHeader: PageHeader,
    BosunCommandPalette: CommandPalette,
    BosunToastHost: ToastHost,
    BosunEmptyState: EmptyState,
    BOSUN_MODULES: MODULES
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/webapp/tasks.jsx
try { (() => {
// BOSUN webapp — Tarefas (tasks list)
(() => {
  const {
    Card,
    IconButton,
    Metric,
    RingChart,
    Badge,
    Avatar,
    Icon,
    Button,
    Input,
    Select,
    Checkbox
  } = window.BOSUNDesignSystem_c587fa;
  const SEED = [{
    id: 'T-1042',
    title: 'Revisar proposta comercial',
    project: 'Lançamento Q4',
    who: 'Rafael Lima',
    due: 'Hoje',
    status: 'progress',
    done: false
  }, {
    id: 'T-1043',
    title: 'Aprovar peças da campanha',
    project: 'Lançamento Q4',
    who: 'Marina Costa',
    due: 'Hoje',
    status: 'review',
    done: false
  }, {
    id: 'T-1038',
    title: 'Conciliar extratos de setembro',
    project: 'Fechamento mensal',
    who: 'Ana Dias',
    due: 'Ontem',
    status: 'late',
    done: false
  }, {
    id: 'T-1047',
    title: 'Conferir estoque semanal',
    project: 'Rotina de operações',
    who: 'Rafael Lima',
    due: 'Amanhã',
    status: 'todo',
    done: false
  }, {
    id: 'T-1031',
    title: 'Enviar relatório de despesas',
    project: 'Fechamento mensal',
    who: 'Marina Costa',
    due: '02 out',
    status: 'done',
    done: true
  }, {
    id: 'T-1049',
    title: 'Triar portfólios recebidos',
    project: 'Contratação design',
    who: 'Marina Costa',
    due: '18 out',
    status: 'todo',
    done: false
  }, {
    id: 'T-1050',
    title: 'Atualizar página de preços',
    project: 'Lançamento Q4',
    who: 'Ana Dias',
    due: '21 out',
    status: 'todo',
    done: false
  }];
  const STATUS = {
    todo: ['neutral', 'A fazer'],
    progress: ['running', 'Em andamento'],
    review: ['warning', 'Em revisão'],
    late: ['danger', 'Atrasada'],
    done: ['success', 'Concluída']
  };
  function Th({
    children,
    w
  }) {
    return /*#__PURE__*/React.createElement("th", {
      style: {
        width: w,
        textAlign: 'left',
        padding: '0 12px 12px',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-subtle)'
      }
    }, children);
  }
  function TasksScreen({
    notify
  }) {
    const [tab, setTab] = React.useState('Tudo');
    const [rows, setRows] = React.useState(SEED);
    const [q, setQ] = React.useState('');
    const [project, setProject] = React.useState();
    const toggle = id => setRows(rows.map(r => {
      if (r.id !== id) return r;
      const done = !r.done;
      if (done) notify({
        tone: 'success',
        title: 'Tarefa concluída.',
        description: r.title
      });
      return {
        ...r,
        done,
        status: done ? 'done' : 'todo'
      };
    }));
    const visible = rows.filter(r => (tab === 'Tudo' || tab === 'Hoje' && r.due === 'Hoje' || tab === 'Atrasadas' && r.status === 'late' || tab === 'Concluídas' && r.done) && (!project || r.project === project) && (r.title + r.project + r.id).toLowerCase().includes(q.toLowerCase()));
    const open = rows.filter(r => !r.done).length;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(BosunPageHeader, {
      title: "Tarefas",
      tabs: [{
        value: 'Tudo',
        label: 'Tudo'
      }, {
        value: 'Hoje',
        label: 'Hoje',
        count: rows.filter(r => r.due === 'Hoje').length
      }, {
        value: 'Atrasadas',
        label: 'Atrasadas',
        count: rows.filter(r => r.status === 'late').length
      }, {
        value: 'Concluídas',
        label: 'Concluídas'
      }],
      tab: tab,
      onTab: setTab,
      right: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: "plus",
        onClick: () => notify({
          tone: 'info',
          title: 'Nova tarefa criada em Rascunhos.'
        })
      }, "Nova tarefa")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr 1fr',
        gap: 16,
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(Card, {
      tone: "accent",
      title: "Em aberto",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        variant: "inverse",
        icon: "arrow-up-right",
        label: "Ver todas"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement(Metric, {
      onAccent: true,
      value: open,
      label: "tarefas para voc\xEA e sua equipe"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        alignItems: 'flex-end',
        height: 96
      }
    }, [[40, 'bx-hatch bx-on-accent'], [72, ''], [56, 'bx-dots bx-on-accent'], [88, '']].map(([h, cls], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: cls,
      style: {
        width: 30,
        height: h,
        borderRadius: 15,
        background: cls ? undefined : i === 1 ? 'var(--abyss-900)' : 'rgba(255,255,255,.3)'
      }
    }))))), /*#__PURE__*/React.createElement(Card, {
      title: "Por projeto"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, [['Lançamento Q4', 3], ['Fechamento mensal', 1], ['Rotina de operações', 1], ['Contratação design', 1]].map(([p, n]) => /*#__PURE__*/React.createElement("button", {
      key: p,
      type: "button",
      onClick: () => setProject(project === p ? undefined : p),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: 0,
        padding: 0,
        background: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 13.5,
        color: project === p ? 'var(--text-accent)' : 'var(--text-body)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        textAlign: 'left'
      }
    }, p), /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-muted)'
      }
    }, n))))), /*#__PURE__*/React.createElement(Card, {
      title: "Carga da equipe"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 20
      }
    }, /*#__PURE__*/React.createElement(RingChart, {
      size: 104,
      thickness: 14,
      showValues: false,
      segments: [{
        value: 3,
        color: 'var(--data-1)'
      }, {
        value: 2,
        color: 'var(--data-2)'
      }, {
        value: 2,
        color: 'var(--data-3)'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, [['Marina Costa', 3, 'var(--data-1)'], ['Rafael Lima', 2, 'var(--data-2)'], ['Ana Dias', 2, 'var(--data-3)']].map(([n, v, c]) => /*#__PURE__*/React.createElement("div", {
      key: n,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: c
      }
    }), n, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-muted)'
      }
    }, v))))))), /*#__PURE__*/React.createElement(Card, {
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        variant: "inverse",
        icon: "list-filter",
        label: "Filtros"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "share",
        label: "Exportar"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir em tela cheia"
      })),
      title: /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: -6
        }
      }, /*#__PURE__*/React.createElement(Input, {
        icon: "search",
        size: "sm",
        placeholder: "Buscar tarefas",
        value: q,
        onChange: e => setQ(e.target.value),
        style: {
          width: 320
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        placeholder: "Projeto",
        value: project,
        onChange: setProject,
        options: ['Lançamento Q4', 'Fechamento mensal', 'Rotina de operações', 'Contratação design']
      }), /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        placeholder: "Respons\xE1vel",
        options: ['Marina Costa', 'Rafael Lima', 'Ana Dias']
      }), /*#__PURE__*/React.createElement(Select, {
        size: "sm",
        placeholder: "Prazo",
        options: ['Hoje', 'Esta semana', 'Este mês']
      }))
    }, /*#__PURE__*/React.createElement("table", {
      style: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement(Th, {
      w: 44
    }), /*#__PURE__*/React.createElement(Th, null, "Tarefa"), /*#__PURE__*/React.createElement(Th, {
      w: 200
    }, "Projeto"), /*#__PURE__*/React.createElement(Th, {
      w: 190
    }, "Respons\xE1vel"), /*#__PURE__*/React.createElement(Th, {
      w: 110
    }, "Prazo"), /*#__PURE__*/React.createElement(Th, {
      w: 150
    }, "Status"), /*#__PURE__*/React.createElement(Th, {
      w: 52
    }))), /*#__PURE__*/React.createElement("tbody", null, visible.map(r => {
      const [tone, label] = STATUS[r.status];
      return /*#__PURE__*/React.createElement("tr", {
        key: r.id,
        style: {
          borderTop: '1px solid var(--border-subtle)'
        },
        onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-raised)',
        onMouseLeave: e => e.currentTarget.style.background = 'transparent'
      }, /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px'
        }
      }, /*#__PURE__*/React.createElement(Checkbox, {
        checked: r.done,
        onChange: () => toggle(r.id)
      })), /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14,
          color: r.done ? 'var(--text-muted)' : 'var(--text-strong)',
          textDecoration: r.done ? 'line-through' : 'none'
        }
      }, r.title), /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-subtle)',
          marginTop: 2
        }
      }, r.id)), /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px',
          fontSize: 13,
          color: 'var(--text-body)'
        }
      }, r.project), /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: r.who,
        size: 26
      }), r.who)), /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px',
          fontSize: 13,
          color: r.status === 'late' ? 'var(--status-danger)' : 'var(--text-body)'
        }
      }, r.due), /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px'
        }
      }, /*#__PURE__*/React.createElement(Badge, {
        tone: tone,
        dot: true
      }, label)), /*#__PURE__*/React.createElement("td", {
        style: {
          padding: '14px 12px'
        }
      }, /*#__PURE__*/React.createElement(IconButton, {
        size: "sm",
        variant: "ghost",
        icon: "ellipsis",
        label: "Mais a\xE7\xF5es"
      })));
    }))), visible.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '40px 0 16px',
        textAlign: 'center',
        fontSize: 14,
        color: 'var(--text-muted)'
      }
    }, "Nenhuma tarefa por aqui. Ajuste os filtros ou crie uma nova tarefa.")));
  }
  Object.assign(window, {
    BosunTasksScreen: TasksScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/webapp/tasks.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/app.jsx
try { (() => {
// BOSUN website — page assembly
(() => {
  const {
    Toast
  } = window.BOSUNDesignSystem_c587fa;
  function Site() {
    const [toast, setToast] = React.useState(false);
    const cta = () => {
      setToast(true);
      setTimeout(() => setToast(false), 4000);
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      onCta: cta
    }), /*#__PURE__*/React.createElement(SiteHero, {
      onCta: cta
    }), /*#__PURE__*/React.createElement(SiteIdea, null), /*#__PURE__*/React.createElement(SiteModules, null), /*#__PURE__*/React.createElement(SitePillars, null), /*#__PURE__*/React.createElement(SiteManifesto, null), /*#__PURE__*/React.createElement(SiteFaq, null), /*#__PURE__*/React.createElement(SiteFooter, {
      onCta: cta
    }), toast && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 60,
        width: 380
      }
    }, /*#__PURE__*/React.createElement(Toast, {
      tone: "success",
      title: "Seu espa\xE7o de trabalho est\xE1 pronto.",
      description: "Enviamos o link de acesso para o seu e-mail.",
      onClose: () => setToast(false)
    })));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Site, null));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/hero.jsx
try { (() => {
// BOSUN website — nav, hero, product preview, idea
(() => {
  const {
    Wordmark,
    Button,
    Card,
    IconButton,
    Metric,
    ProgressBar,
    RingChart,
    BarChart,
    Badge,
    Icon
  } = window.BOSUNDesignSystem_c587fa;
  function SiteNav({
    onCta
  }) {
    const [scrolled, setScrolled] = React.useState(false);
    React.useEffect(() => {
      const s = () => setScrolled(window.scrollY > 24);
      window.addEventListener('scroll', s);
      return () => window.removeEventListener('scroll', s);
    }, []);
    return /*#__PURE__*/React.createElement("header", {
      style: {
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'background var(--dur-base), backdrop-filter var(--dur-base)',
        background: scrolled ? 'rgba(11,23,38,.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(var(--blur-glass))' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(var(--blur-glass))' : 'none',
        borderBottom: '1px solid ' + (scrolled ? 'var(--border-subtle)' : 'transparent')
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        height: 76,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 40
      }
    }, /*#__PURE__*/React.createElement(Wordmark, {
      size: 22
    }), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        gap: 28,
        flex: 1,
        justifyContent: 'center'
      }
    }, [['Plataforma', '#plataforma'], ['Módulos', '#modulos'], ['Manifesto', '#manifesto'], ['Perguntas', '#perguntas']].map(([l, h]) => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: h,
      style: {
        fontSize: 14,
        color: 'var(--text-body)',
        textDecoration: 'none'
      }
    }, l))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm"
    }, "Entrar"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: onCta
    }, "Come\xE7ar agora"))));
  }
  function Eyebrow({
    children,
    onLight
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 500,
        color: onLight ? 'var(--signal-700)' : 'var(--text-accent)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'currentColor'
      }
    }), children);
  }
  function TwoWeight({
    lead,
    payoff,
    size = 64,
    onLight,
    style
  }) {
    return /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: '-0.035em',
        textWrap: 'balance',
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 300,
        color: onLight ? 'var(--steel-600)' : 'var(--text-muted)'
      }
    }, lead), ' ', /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: onLight ? 'var(--abyss-900)' : 'var(--text-strong)'
      }
    }, payoff));
  }
  function ProductPreview() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 32,
        padding: 16,
        background: 'var(--bg-sunken)',
        boxShadow: '0 0 0 1px var(--border-default), 0 60px 120px -40px rgba(45,212,191,.18)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 12px 20px'
      }
    }, /*#__PURE__*/React.createElement(Wordmark, {
      size: 15
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flex: 1,
        justifyContent: 'center'
      }
    }, [['house', 'Início', true], ['list-checks', 'Tarefas'], ['file-text', 'Documentos'], ['workflow', 'Automações'], ['plug', 'Integrações']].map(([ic, l, on]) => /*#__PURE__*/React.createElement("span", {
      key: l,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 32,
        padding: '0 12px',
        borderRadius: 999,
        fontSize: 12,
        color: on ? 'var(--text-accent)' : 'var(--text-body)',
        background: on ? 'var(--surface-accent-soft)' : 'var(--surface-control)',
        border: '1px solid ' + (on ? 'var(--border-accent)' : 'var(--border-subtle)')
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 14
    }), l))), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--ocean-700)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Card, {
      title: "Prioridades de hoje",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "bell",
        label: "Lembretes",
        size: "sm"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir",
        size: "sm"
      }))
    }, /*#__PURE__*/React.createElement(Metric, {
      value: "12",
      suffix: "tarefas",
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 18
      }
    }), /*#__PURE__*/React.createElement(ProgressBar, {
      size: "md",
      value: 42,
      labels: ['8h', '12h', '16h', '20h']
    })), /*#__PURE__*/React.createElement(Card, {
      tone: "accent",
      title: "Automa\xE7\xF5es ativas",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir",
        size: "sm",
        variant: "inverse"
      })
    }, /*#__PURE__*/React.createElement(Metric, {
      onAccent: true,
      value: "24",
      size: "sm",
      label: "executando hoje"
    })), /*#__PURE__*/React.createElement(Card, {
      title: "Execu\xE7\xF5es",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir",
        size: "sm"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(RingChart, {
      size: 104,
      thickness: 14,
      showValues: false,
      segments: [{
        value: 70
      }, {
        value: 30
      }]
    }))), /*#__PURE__*/React.createElement(Card, {
      title: "Andamento da semana",
      style: {
        gridColumn: 'span 3'
      },
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        icon: "list-filter",
        variant: "inverse",
        label: "Filtrar",
        size: "sm"
      }), /*#__PURE__*/React.createElement(IconButton, {
        icon: "calendar",
        label: "Per\xEDodo",
        size: "sm"
      }))
    }, /*#__PURE__*/React.createElement(BarChart, {
      height: 170,
      maxBarWidth: 96,
      formatValue: v => v + ' concluídas',
      data: [{
        label: 'Seg',
        value: 18,
        target: 26
      }, {
        label: 'Ter',
        value: 22,
        target: 26
      }, {
        label: 'Qua',
        value: 32,
        target: 34
      }, {
        label: 'Qui',
        value: 14,
        target: 28
      }, {
        label: 'Sex',
        value: 20,
        target: 24
      }, {
        label: 'Sáb',
        value: 6,
        target: 10
      }, {
        label: 'Dom',
        value: 4,
        target: 8
      }]
    }))));
  }
  function Hero({
    onCta
  }) {
    return /*#__PURE__*/React.createElement("section", {
      className: "bx-grid",
      style: {
        position: 'relative',
        paddingTop: 88
      },
      id: "plataforma"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 0%, transparent 0%, var(--bg-page) 72%)',
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Sistema operacional de trabalho na web"), /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: '24px 0 0',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-display-xl)',
        lineHeight: 0.98,
        letterSpacing: '-0.04em'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 300,
        color: 'var(--text-muted)'
      }
    }, "Seu mundo digital,"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--text-strong)'
      }
    }, "sob comando.")), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '28px 0 0',
        maxWidth: 560,
        fontSize: 18,
        lineHeight: 1.55,
        color: 'var(--text-body)'
      }
    }, "Organize tarefas, re\xFAna informa\xE7\xF5es e conecte suas ferramentas em um \xFAnico ambiente de trabalho."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        marginTop: 36
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      iconRight: "arrow-right",
      onClick: onCta
    }, "Come\xE7ar agora"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "lg",
      onClick: () => window.scrollTo({
        top: document.getElementById('modulos').offsetTop - 60,
        behavior: 'smooth'
      })
    }, "Conhecer a plataforma")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-subtle)',
        marginTop: 16
      }
    }, "Funciona no navegador. Nada para instalar."), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        marginTop: 72
      }
    }, /*#__PURE__*/React.createElement(ProductPreview, null))));
  }
  function Idea() {
    return /*#__PURE__*/React.createElement("section", {
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '160px 32px 120px',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 80,
        alignItems: 'end'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "A ideia"), /*#__PURE__*/React.createElement(TwoWeight, {
      size: 52,
      lead: "Ferramentas dispersas viram",
      payoff: "um ambiente de trabalho conectado.",
      style: {
        marginTop: 20
      }
    })), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 17,
        lineHeight: 1.6,
        color: 'var(--text-muted)'
      }
    }, "BOSUN \xE9 seu ambiente de trabalho na web. Re\xFAna ferramentas, organize atividades e conecte informa\xE7\xF5es em uma experi\xEAncia feita para acompanhar sua rotina."));
  }
  Object.assign(window, {
    SiteNav,
    SiteHero: Hero,
    SiteIdea: Idea,
    SiteEyebrow: Eyebrow,
    SiteTwoWeight: TwoWeight
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/sections.jsx
try { (() => {
// BOSUN website — módulos (light panel), pilares, manifesto, FAQ, footer
(() => {
  const {
    Wordmark,
    Button,
    Card,
    IconButton,
    Metric,
    ProgressBar,
    Badge,
    Icon,
    Accordion,
    Switch,
    Checkbox,
    Toast
  } = window.BOSUNDesignSystem_c587fa;
  const MODS = [{
    id: 'home',
    name: 'BOSUN Home',
    nav: 'Início',
    icon: 'house',
    body: 'Visão geral do dia: prioridades, andamento e o que precisa de atenção.'
  }, {
    id: 'tasks',
    name: 'BOSUN Tasks',
    nav: 'Tarefas',
    icon: 'list-checks',
    body: 'Tarefas e projetos com prazos, responsáveis e próximos passos claros.'
  }, {
    id: 'docs',
    name: 'BOSUN Docs',
    nav: 'Documentos',
    icon: 'file-text',
    body: 'Documentos e conhecimento ligados às tarefas que dependem deles.'
  }, {
    id: 'flow',
    name: 'BOSUN Flow',
    nav: 'Automações',
    icon: 'workflow',
    body: 'Fluxos que executam etapas repetitivas e mostram cada resultado.'
  }, {
    id: 'connect',
    name: 'BOSUN Connect',
    nav: 'Integrações',
    icon: 'plug',
    body: 'Conecte as ferramentas que você já usa. Você decide o que cada uma acessa.'
  }, {
    id: 'insights',
    name: 'BOSUN Insights',
    nav: 'Indicadores',
    icon: 'chart-no-axes-column',
    body: 'Indicadores e relatórios a partir do que acontece no seu ambiente.'
  }];
  function ModPreview({
    id
  }) {
    if (id === 'flow') return /*#__PURE__*/React.createElement(Card, {
      tone: "raised",
      title: "Resumo di\xE1rio de vendas",
      subtitle: "Todos os dias, 8h",
      actions: /*#__PURE__*/React.createElement(Switch, {
        defaultChecked: true,
        size: "sm"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 6
      }
    }, ['Buscar dados', 'Gerar resumo', 'Enviar para a equipe'].map(s => /*#__PURE__*/React.createElement("div", {
      key: s,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'var(--surface-accent)',
        color: 'var(--text-on-accent)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 14,
      strokeWidth: 2.2
    })), s)), /*#__PURE__*/React.createElement(Toast, {
      tone: "success",
      title: "Fluxo conclu\xEDdo.",
      description: "Todas as etapas foram executadas.",
      style: {
        marginTop: 8,
        boxShadow: 'var(--shadow-raised)'
      }
    })));
    if (id === 'connect') return /*#__PURE__*/React.createElement(Card, {
      tone: "raised",
      title: "Conectar Google Agenda",
      subtitle: "Voc\xEA decide quais informa\xE7\xF5es esta integra\xE7\xE3o pode acessar."
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "Ler eventos",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Criar e editar eventos"
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Ver disponibilidade da equipe",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "primary"
    }, "Permitir acesso"))));
    if (id === 'tasks') return /*#__PURE__*/React.createElement(Card, {
      tone: "raised",
      title: "Lan\xE7amento Q4",
      subtitle: "8 de 14 etapas",
      actions: /*#__PURE__*/React.createElement(IconButton, {
        icon: "arrow-up-right",
        label: "Abrir"
      })
    }, /*#__PURE__*/React.createElement(ProgressBar, {
      value: 57
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 18
      }
    }, [['Aprovar peças da campanha', 'warning', 'Em revisão'], ['Revisar proposta comercial', 'running', 'Em andamento'], ['Publicar página de preços', 'neutral', 'A fazer']].map(([t, tone, l]) => /*#__PURE__*/React.createElement("div", {
      key: t,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement(Checkbox, null), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, t), /*#__PURE__*/React.createElement(Badge, {
      tone: tone,
      dot: true
    }, l)))));
    return /*#__PURE__*/React.createElement(Card, {
      tone: "accent",
      title: id === 'insights' ? 'Tarefas concluídas' : id === 'docs' ? 'Documentos vinculados' : 'Prioridades de hoje',
      actions: /*#__PURE__*/React.createElement(IconButton, {
        variant: "inverse",
        icon: "arrow-up-right",
        label: "Abrir"
      })
    }, /*#__PURE__*/React.createElement(Metric, {
      onAccent: true,
      size: "lg",
      value: id === 'insights' ? '116' : id === 'docs' ? '38' : '12',
      label: id === 'insights' ? 'nesta semana · 18% acima da anterior' : id === 'docs' ? 'a tarefas em andamento' : 'tarefas · 4 concluídas'
    }), /*#__PURE__*/React.createElement("div", {
      className: "bx-dots bx-on-accent",
      style: {
        height: 64,
        borderRadius: 20,
        marginTop: 24
      }
    }));
  }
  function Modules() {
    const [sel, setSel] = React.useState('home');
    return /*#__PURE__*/React.createElement("section", {
      id: "modulos",
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      "data-theme": "light",
      style: {
        borderRadius: 40,
        background: 'var(--bg-page)',
        color: 'var(--text-body)',
        padding: 64,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: 64
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteEyebrow, {
      onLight: true
    }, "M\xF3dulos"), /*#__PURE__*/React.createElement(SiteTwoWeight, {
      onLight: true,
      size: 44,
      lead: "Um s\xF3 ambiente.",
      payoff: "M\xF3dulos que trabalham juntos.",
      style: {
        marginTop: 18
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 40
      }
    }, MODS.map(m => {
      const on = m.id === sel;
      return /*#__PURE__*/React.createElement("button", {
        key: m.id,
        type: "button",
        onClick: () => setSel(m.id),
        style: {
          display: 'grid',
          gridTemplateColumns: '40px 1fr auto',
          gap: 14,
          alignItems: 'start',
          textAlign: 'left',
          padding: '16px 0',
          border: 0,
          borderTop: '1px solid var(--border-default)',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: on ? 'var(--surface-accent)' : 'var(--surface-control)',
          color: on ? 'var(--text-on-accent)' : 'var(--icon-default)',
          transition: 'background var(--dur-base)'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: m.icon,
        size: 17
      })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'block',
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-strong)',
          letterSpacing: '-0.01em',
          marginTop: 6
        }
      }, m.name), on && /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'block',
          fontSize: 14.5,
          lineHeight: 1.5,
          color: 'var(--text-muted)',
          marginTop: 6,
          maxWidth: 420
        }
      }, m.body)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--text-subtle)',
          marginTop: 10
        }
      }, "no menu: ", m.nav));
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 28,
        background: 'var(--abyss-900)',
        padding: 32,
        display: 'flex',
        alignItems: 'center'
      },
      "data-theme": "dark"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%'
      }
    }, /*#__PURE__*/React.createElement(ModPreview, {
      id: sel
    })))));
  }
  const PILLARS = [['target', 'Clareza', 'Mostrar o que importa e qual é a próxima ação.'], ['git-branch', 'Coordenação', 'Conectar funcionalidades, não apenas colocá-las lado a lado.'], ['sliders-horizontal', 'Autonomia', 'Cada pessoa organiza o próprio ambiente.'], ['shield-check', 'Confiança', 'Estados, resultados e problemas sem ambiguidade.'], ['layers', 'Evolução', 'A plataforma cresce com novas necessidades.']];
  function Pillars() {
    return /*#__PURE__*/React.createElement("section", {
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '140px 32px 0'
      }
    }, /*#__PURE__*/React.createElement(SiteTwoWeight, {
      size: 44,
      lead: "Tudo conectado.",
      payoff: "Voc\xEA no comando."
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0,1fr))',
        gap: 12,
        marginTop: 48
      }
    }, PILLARS.map(([ic, t, b], i) => /*#__PURE__*/React.createElement(Card, {
      key: t,
      tone: i === 0 ? 'accent' : 'default',
      icon: /*#__PURE__*/React.createElement("span", {
        style: {
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
          background: i === 0 ? 'rgba(11,23,38,.12)' : 'var(--surface-raised)',
          color: i === 0 ? 'var(--text-on-accent)' : 'var(--text-accent)'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: ic,
        size: 19
      })),
      title: t,
      titleSize: 22
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 14.5,
        lineHeight: 1.5,
        color: i === 0 ? 'var(--text-on-accent-muted)' : 'var(--text-muted)'
      }
    }, b)))));
  }
  const MANIFESTO = [['m', 'Você não precisa de mais uma ferramenta isolada.'], ['s', 'Precisa de um lugar onde tudo faça sentido.'], ['m', 'Onde informações encontrem contexto. Onde tarefas tenham direção. Onde ferramentas trabalhem juntas.'], ['s', 'BOSUN nasce para coordenar essa experiência.'], ['m', 'Você escolhe o destino. Organiza suas prioridades. Mantém o controle.'], ['s', 'Nós conectamos o que precisa funcionar em conjunto.']];
  function Manifesto() {
    return /*#__PURE__*/React.createElement("section", {
      id: "manifesto",
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '160px 32px',
        display: 'grid',
        gridTemplateColumns: '240px minmax(0,1fr)',
        gap: 48
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteEyebrow, null, "Manifesto")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        maxWidth: 860
      }
    }, MANIFESTO.map(([k, t], i) => /*#__PURE__*/React.createElement("p", {
      key: i,
      style: {
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontSize: 34,
        lineHeight: 1.22,
        letterSpacing: '-0.025em',
        fontWeight: k === 's' ? 600 : 300,
        color: k === 's' ? 'var(--text-strong)' : 'var(--text-muted)',
        textWrap: 'pretty'
      }
    }, t)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 24
      }
    }, /*#__PURE__*/React.createElement(Wordmark, {
      size: 28,
      tagline: true
    }))));
  }
  function Faq() {
    const items = [['install', 'Preciso instalar alguma coisa?', 'Não. A BOSUN é um ambiente de trabalho acessado pelo navegador. Ela não substitui o sistema operacional do seu computador.'], ['data', 'Quem decide o que cada integração acessa?', 'Você. Ao conectar uma ferramenta, você escolhe o nível de acesso e quais informações ela pode ler ou alterar, e pode revogar quando quiser.'], ['team', 'Funciona para equipes?', 'Sim. Profissionais independentes, empreendedores e pequenas equipes usam o mesmo ambiente, com permissões por pessoa.'], ['custom', 'Posso organizar o ambiente do meu jeito?', 'Sim. Escolha os módulos, a ordem dos painéis e o que aparece na sua página inicial, sem perder a consistência entre eles.']];
    return /*#__PURE__*/React.createElement("section", {
      id: "perguntas",
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px 140px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)',
        gap: 64
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteEyebrow, null, "Perguntas frequentes"), /*#__PURE__*/React.createElement(SiteTwoWeight, {
      size: 44,
      lead: "D\xFAvidas?",
      payoff: "Respostas diretas.",
      style: {
        marginTop: 18
      }
    })), /*#__PURE__*/React.createElement(Accordion, {
      items: items.map(([id, q, a]) => ({
        id,
        title: q,
        content: /*#__PURE__*/React.createElement("p", {
          style: {
            margin: 0,
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--text-muted)'
          }
        }, a)
      }))
    }));
  }
  function Footer({
    onCta
  }) {
    const cols = [['Plataforma', ['Módulos', 'Integrações', 'Segurança', 'Preços']], ['Empresa', ['Sobre', 'Manifesto', 'Carreiras']], ['Suporte', ['Central de ajuda', 'Status', 'Contato']], ['Recursos', ['Guias', 'Modelos', 'Novidades']]];
    return /*#__PURE__*/React.createElement("footer", {
      style: {
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px 32px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 40,
        background: 'var(--surface-accent)',
        color: 'var(--text-on-accent)',
        padding: '56px 64px 32px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.4fr repeat(4, minmax(0,1fr))',
        gap: 32
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement(Wordmark, {
      size: 30,
      tone: "dark",
      tagline: true
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "inverse",
      iconRight: "arrow-right",
      onClick: onCta,
      style: {
        background: 'var(--abyss-900)',
        color: 'var(--mist)'
      }
    }, "Come\xE7ar agora")), cols.map(([h, ls]) => /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '.08em',
        fontWeight: 500
      }
    }, h.toUpperCase()), ls.map(l => /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      onClick: e => e.preventDefault(),
      style: {
        fontSize: 14,
        color: 'var(--abyss-900)',
        textDecoration: 'none'
      }
    }, l))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 64,
        paddingTop: 20,
        borderTop: '1px solid rgba(11,23,38,.18)',
        fontSize: 12.5,
        color: 'var(--signal-900)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 BOSUN"), /*#__PURE__*/React.createElement("span", null, "Privacidade \xB7 Termos"))));
  }
  Object.assign(window, {
    SiteModules: Modules,
    SitePillars: Pillars,
    SiteManifesto: Manifesto,
    SiteFaq: Faq,
    SiteFooter: Footer
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/sections.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.Metric = __ds_scope.Metric;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.RingChart = __ds_scope.RingChart;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.TooltipBubble = __ds_scope.TooltipBubble;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.ModuleNav = __ds_scope.ModuleNav;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Dialog = __ds_scope.Dialog;

})();

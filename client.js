window.__ModuleLoader__.load({
  id: 'dsh-powertools',
  factory(require) {
    const React = require('react')
    const { Button, IconChevronRightOutlineRegular, writeClipboard } = require('@deepseek-ai/dsh-client-ui-primitives')
    const { createElement: h, useEffect, useLayoutEffect, useRef, useState } = React
    const PANEL = 'dsh-powertools'

    // Lucide 1.61.0 icon geometry from Magi Code (web/src/lib/icons.ts), license in licenses/lucide.txt.
    const ICONS = {
      'layout-grid': [
        ['rect', { width: 7, height: 7, x: 3, y: 3, rx: 1 }],
        ['rect', { width: 7, height: 7, x: 14, y: 3, rx: 1 }],
        ['rect', { width: 7, height: 7, x: 14, y: 14, rx: 1 }],
        ['rect', { width: 7, height: 7, x: 3, y: 14, rx: 1 }],
      ],
      'message-square': [
        ['path', { d: 'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z' }],
      ],
      plug: [
        ['path', { d: 'M12 22v-5' }],
        ['path', { d: 'M15 8V2' }],
        ['path', { d: 'M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z' }],
        ['path', { d: 'M9 8V2' }],
      ],
      'wand-sparkles': [
        ['path', { d: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72' }],
        ['path', { d: 'm14 7 3 3' }],
        ['path', { d: 'M5 6v4' }],
        ['path', { d: 'M19 14v4' }],
        ['path', { d: 'M10 2v2' }],
        ['path', { d: 'M7 8H3' }],
        ['path', { d: 'M21 16h-4' }],
        ['path', { d: 'M11 3H9' }],
      ],
      enhance: [
        ['path', { d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z' }],
        ['path', { d: 'M20 2v4' }],
        ['path', { d: 'M22 4h-4' }],
        ['circle', { cx: 4, cy: 20, r: 2 }],
      ],
      loader: [
        ['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }],
      ],
      undo: [
        ['path', { d: 'M9 14 4 9l5-5' }],
        ['path', { d: 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11' }],
      ],
      plus: [
        ['path', { d: 'M5 12h14' }],
        ['path', { d: 'M12 5v14' }],
      ],
      'refresh-cw': [
        ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }],
        ['path', { d: 'M21 3v5h-5' }],
        ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }],
        ['path', { d: 'M8 16H3v5' }],
      ],
      'rotate-cw': [
        ['path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' }],
        ['path', { d: 'M21 3v5h-5' }],
      ],
      play: [
        ['path', { d: 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z' }],
      ],
      'square-pen': [
        ['path', { d: 'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }],
        ['path', { d: 'M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z' }],
      ],
      trash: [
        ['path', { d: 'M10 11v6' }],
        ['path', { d: 'M14 11v6' }],
        ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
        ['path', { d: 'M3 6h18' }],
        ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
      ],
      archive: [
        ['rect', { width: 20, height: 5, x: 2, y: 3, rx: 1 }],
        ['path', { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8' }],
        ['path', { d: 'M10 12h4' }],
      ],
      'archive-restore': [
        ['rect', { width: 20, height: 5, x: 2, y: 3, rx: 1 }],
        ['path', { d: 'M4 8v11a2 2 0 0 0 2 2h2' }],
        ['path', { d: 'M20 8v11a2 2 0 0 1-2 2h-2' }],
        ['path', { d: 'm9 15 3-3 3 3' }],
        ['path', { d: 'M12 12v9' }],
      ],
      eye: [
        ['path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' }],
        ['circle', { cx: 12, cy: 12, r: 3 }],
      ],
      'folder-plus': [
        ['path', { d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }],
        ['path', { d: 'M12 10v6' }],
        ['path', { d: 'M9 13h6' }],
      ],
      folder: [
        ['path', { d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }],
      ],
      'external-link': [
        ['path', { d: 'M15 3h6v6' }],
        ['path', { d: 'M10 14 21 3' }],
        ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
      ],
      copy: [
        ['rect', { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }],
        ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }],
      ],
      check: [
        ['path', { d: 'M20 6 9 17l-5-5' }],
      ],
      x: [
        ['path', { d: 'M18 6 6 18' }],
        ['path', { d: 'm6 6 12 12' }],
      ],
      'git-branch': [
        ['line', { x1: 6, x2: 6, y1: 3, y2: 15 }],
        ['circle', { cx: 18, cy: 6, r: 3 }],
        ['circle', { cx: 6, cy: 18, r: 3 }],
        ['path', { d: 'M18 9a9 9 0 0 1-9 9' }],
      ],
      download: [
        ['path', { d: 'M12 15V3' }],
        ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
        ['path', { d: 'm7 10 5 5 5-5' }],
      ],
      'chevrons-down-up': [
        ['path', { d: 'm7 20 5-5 5 5' }],
        ['path', { d: 'm7 4 5 5 5-5' }],
      ],
    }

    function Icon({ name, size = 14, className = '' }) {
      const shapes = ICONS[name]
      if (!shapes) return null
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, 'data-icon': name, className: `dpt-icon${className ? ` ${className}` : ''}`,
      }, ...shapes.map(([tag, attrs], index) => h(tag, { key: index, ...attrs })))
    }

    const css = `
.dpt {
  --dpt-line: var(--dsw-alias-border-l2);
  --dpt-module: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2));
  --dpt-entry: var(--dsw-alias-bg-base, var(--dsw-alias-bg-layer-1));
  --dpt-muted: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
  --dpt-accent: var(--dsw-alias-state-business-primary);
  --dpt-danger: var(--dsw-alias-state-error-primary);
  --dpt-ease: 140ms var(--ds-ease-in-out, cubic-bezier(.4, 0, .2, 1));
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  font-weight: 400;
  min-width: 0;
  container-type: inline-size;
}
.dpt *, .dpt *::before { box-sizing: border-box; }
.dpt-icon { display: block; flex: 0 0 auto; }
@keyframes dpt-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.dpt-spin { animation: dpt-spin 900ms linear infinite; }
.dpt h1, .dpt h2, .dpt h3, .dpt p, .dpt ul, .dpt dl, .dpt dd { margin: 0; }
.dpt h1 { font-size: 20px; line-height: 28px; font-weight: 500; }
.dpt h2 { font-size: 16px; line-height: 24px; font-weight: 500; overflow-wrap: anywhere; }
.dpt h3 { font-size: 14px; line-height: 20px; font-weight: 500; }
.dpt a, .dpt button, .dpt input, .dpt select, .dpt textarea { font: inherit; }
.dpt-page {
  width: 100%; height: 100%; min-height: 0; overflow-x: hidden; overflow-y: auto;
  scrollbar-gutter: stable; background: var(--dsw-alias-bg-base);
  --dsh-scrollbar-width: 9px; --dsh-scrollbar-thumb-border: 2px;
}
.dpt-page-inner { width: 100%; max-width: 960px; margin: 0 auto; padding: 0 clamp(24px, 4vw, 48px) 48px; }
@media (max-width: 767px) { .dpt-page-inner { padding-inline: 20px; } }
.dpt-inline { width: 100%; padding: 0; }
.dpt-page-head { display: flex; align-items: center; gap: 12px; padding-top: 28px; margin-bottom: 14px; }
[data-platform='darwin'] .dpt-page .dpt-page-head { padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px)); }
.dpt-page-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--dsw-radius-sm, 8px); background: var(--dpt-module); color: var(--dsw-alias-label-primary); }
.dpt-controls { display: grid; gap: 14px; }
.dpt-panel { display: grid; gap: 12px; min-width: 0; }
.dpt-bar, .dpt-actions, .dpt-nav, .dpt-form-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.dpt-nav { gap: 4px; border-bottom: .5px solid var(--dpt-line); }
.dpt-nav .dpt-tab {
  position: relative; min-height: 34px; padding: 0 12px; border-radius: 6px 6px 0 0;
  color: var(--dpt-muted); background: transparent;
}
.dpt-nav .dpt-tab[aria-pressed='true'] { color: var(--dsw-alias-label-primary); font-weight: 500; background: transparent; }
.dpt-nav .dpt-tab[aria-pressed='true']::after {
  content: ''; position: absolute; left: 8px; right: 8px; bottom: -1px; height: 2px;
  border-radius: 2px; background: var(--dpt-accent);
}
/* Unified single-row sticky toolbar with clickable segmented pills */
.dpt-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; min-width: 0;
}
@container (min-width: 561px) {
  .dpt-page .dpt-toolbar {
    position: sticky; top: 0; z-index: 10; padding-block: 6px; margin-block: -6px -2px;
    background: var(--dsw-alias-bg-base);
  }
}
.dpt-toolbar-right {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; flex: 1 1 auto; min-width: 0;
}
.dpt-seg {
  display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 2px;
  border-radius: var(--dsw-radius-sm, 8px); background: var(--dpt-module); border: .5px solid var(--dpt-line);
}
.dpt-seg-btn {
  display: inline-flex; align-items: center; gap: 5px; min-height: 26px; padding: 0 9px;
  border: 0; border-radius: 6px; background: transparent; color: var(--dpt-muted);
  font-size: 12.5px; line-height: 18px; cursor: pointer; white-space: nowrap;
  transition: background var(--dpt-ease), color var(--dpt-ease);
}
.dpt-seg-btn[aria-pressed='true'] {
  background: var(--dpt-entry); color: var(--dsw-alias-label-primary); font-weight: 500;
  box-shadow: 0 1px 2px rgb(0 0 0 / 7%);
}
.dpt-seg-count { font-size: 11px; color: var(--dpt-muted); font-weight: 400; }
.dpt-seg-btn[aria-pressed='true'] .dpt-seg-count { color: var(--dsw-alias-label-secondary); }
.dpt-seg-btn[data-alert='true'] .dpt-seg-count { color: var(--dsw-alias-state-warn-primary); font-weight: 500; }
.dpt .dpt-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  max-width: 100%; min-height: 30px; height: auto; padding: 0 10px; font-size: 13px; line-height: 20px;
  white-space: nowrap;
  transition: background var(--dpt-ease), box-shadow var(--dpt-ease), color var(--dpt-ease);
}
.dpt .dpt-icon-btn { width: 30px; min-width: 30px; min-height: 30px; padding: 0; color: var(--dsw-alias-label-secondary); }
.dpt .dpt-row-btn { min-height: 26px; padding: 0 8px; font-size: 12px; line-height: 18px; }
.dpt .dpt-row-icon-btn { width: 26px; min-width: 26px; min-height: 26px; padding: 0; color: var(--dsw-alias-label-secondary); }
.dpt .dpt-button:disabled { cursor: default; }
.dpt .dpt-primary { background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); font-weight: 500; }
.dpt .dpt-danger { color: var(--dpt-danger); }
.dpt :is(button, input, select, textarea):focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dpt-accent));
  outline-offset: 1px;
}
.dpt :is(input:not([type='checkbox']), select, textarea) {
  min-width: 0; max-width: 100%; height: 30px; padding: 0 10px; color: inherit;
  border: .5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-sm, 8px);
  background: var(--dsw-alias-bg-layer-3);
}
.dpt .dpt-form :is(input:not([type='checkbox']), select) { height: 32px; }
.dpt .dpt-search { width: auto; flex: 1 1 130px; max-width: 220px; font-size: 12.5px; }
.dpt .dpt-toolbar-right select { font-size: 12.5px; padding-inline: 8px; }
.dpt :is(input, select, textarea):focus { border-color: var(--dpt-accent); }
.dpt textarea { height: auto; padding-block: 6px; }
.dpt textarea.dpt-fixed-editor { height: 180px; resize: none; overflow-y: auto; }
.dpt input.dpt-inline-filter { height: 28px; padding: 0 8px; font-size: 12px; width: 180px; max-width: 100%; }
@media (hover: hover) {
  .dpt .dpt-button:hover:not(:disabled), .dpt .dpt-row-main:hover { background: var(--dsw-alias-interactive-bg-hover); }
  .dpt .dpt-seg-btn:hover:not([aria-pressed='true']) { color: var(--dsw-alias-label-primary); }
  .dpt .dpt-nav .dpt-tab:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
  .dpt .dpt-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-fill); box-shadow: inset 0 0 0 1000px var(--dsw-alias-interactive-bg-hover); }
  .dpt .dpt-danger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-danger); color: var(--dpt-danger); }
  .dpt .dpt-icon-btn:hover:not(:disabled), .dpt .dpt-row-icon-btn:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
}
.dpt-card {
  min-width: 0; overflow: hidden; border: .5px solid var(--dsw-alias-settings-card-stroke, var(--dpt-line));
  border-radius: var(--dsw-radius-md, 10px);
  background: var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-1));
}
.dpt ul.dpt-card { padding: 0; list-style: none; }
.dpt-row + .dpt-row { border-top: .5px solid var(--dpt-line); }
.dpt-sentinel { height: 1px; border: 0; padding: 0; margin: 0; pointer-events: none; }
.dpt-subhead {
  padding: 5px 16px; background: color-mix(in srgb, var(--dpt-module) 55%, transparent);
  color: var(--dpt-muted); font-size: 11.5px; line-height: 18px; font-weight: 500;
}
.dpt-subhead:not(:first-child) { border-top: .5px solid var(--dpt-line); }
.dpt-subhead + .dpt-row { border-top: .5px solid var(--dpt-line); }
.dpt-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px 16px; flex-wrap: wrap; margin-bottom: 8px; }
.dpt-section-body { display: grid; gap: 8px; min-width: 0; }
/* High-density row with hover-swap checkbox and 1-click trailing actions */
.dpt-row-main {
  display: flex; align-items: center; min-width: 0;
  transition: background var(--dpt-ease);
}
.dpt-row[data-selected='true'] > .dpt-row-main {
  background: color-mix(in srgb, var(--dpt-accent) 7%, transparent);
}
.dpt-lead-cell {
  position: relative; display: grid; place-items: center; width: 36px; align-self: stretch;
  flex: 0 0 36px; cursor: pointer; user-select: none;
}
.dpt-lead-cell .dpt-indicator { transition: opacity 120ms ease; }
.dpt-row-checkbox {
  position: absolute; width: 15px; height: 15px; margin: 0; cursor: pointer;
  accent-color: var(--dpt-accent); opacity: 0; transition: opacity 120ms ease;
}
@media (pointer: coarse) {
  .dpt-lead-cell .dpt-indicator { opacity: 0; }
  .dpt-row-checkbox { opacity: .65; }
}
.dpt-row-main:hover .dpt-lead-cell .dpt-indicator,
.dpt-lead-cell:focus-within .dpt-indicator,
.dpt-card[data-selecting='true'] .dpt-lead-cell .dpt-indicator { opacity: 0; }
.dpt-row-main:hover .dpt-row-checkbox,
.dpt-lead-cell:focus-within .dpt-row-checkbox,
.dpt-card[data-selecting='true'] .dpt-row-checkbox { opacity: 1; }
.dpt .dpt-disclosure {
  display: flex; align-items: center; gap: 10px; text-align: start; cursor: pointer;
  flex: 1; min-width: 0; padding: 9px 10px 9px 16px; border: 0; border-radius: 0; background: transparent; color: inherit;
}
.dpt-lead-cell + .dpt-disclosure { padding-inline-start: 0; }
.dpt .dpt-disclosure:focus-visible { outline-offset: -2px; }
.dpt-row-end {
  display: flex; align-items: center; gap: 8px; padding-inline-end: 16px; flex: 0 0 auto;
}
.dpt-row-toggle-tail {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer; align-self: stretch;
}
.dpt-quick-actions {
  display: inline-flex; align-items: center; gap: 3px;
}
@media (hover: hover) {
  .dpt-quick-actions--hover { opacity: 0; transition: opacity 120ms ease; }
  .dpt-row-main:hover .dpt-quick-actions--hover,
  .dpt-row-main:focus-within .dpt-quick-actions--hover,
  .dpt-row[data-open='true'] .dpt-quick-actions--hover { opacity: 1; }
}
.dpt-switch {
  width: 32px; height: 18px; padding: 2px; border: 0; border-radius: 999px;
  background: var(--dsw-alias-border-l4, var(--dpt-line)); cursor: pointer;
  display: inline-flex; align-items: center; flex: 0 0 32px;
  transition: background var(--dpt-ease);
}
.dpt-switch[aria-checked='true'] { background: var(--dpt-accent); }
.dpt-switch:disabled { opacity: .45; cursor: default; }
.dpt-switch-thumb {
  width: 14px; height: 14px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 22%);
  transition: transform var(--dpt-ease);
}
.dpt-switch[aria-checked='true'] .dpt-switch-thumb { transform: translateX(14px); }
.dpt-row-label { display: grid; gap: 1px; flex: 1; min-width: 0; }
.dpt-row-title { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dpt-row-title strong { font-size: 13px; line-height: 20px; font-weight: 500; color: var(--dsw-alias-label-primary); }
.dpt-row-tag { min-width: 0; color: var(--dpt-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dpt-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.dpt-indicator { width: 6px; height: 6px; border-radius: 50%; flex: 0 0 auto; background: var(--dpt-tone, var(--dpt-muted)); }
.dpt[data-tone='ready'], .dpt [data-tone='ready'] { --dpt-tone: var(--dsw-alias-state-success-primary); }
.dpt[data-tone='attention'], .dpt [data-tone='attention'] { --dpt-tone: var(--dsw-alias-state-warn-primary); }
.dpt[data-tone='info'], .dpt [data-tone='info'] { --dpt-tone: var(--dpt-accent); }
.dpt-pill {
  flex: 0 0 auto; padding: 1px 7px; border-radius: 999px; font-size: 11px; line-height: 17px;
  color: var(--dsw-alias-label-secondary); background: var(--dpt-module); border: .5px solid transparent;
}
.dpt-pill:not([data-tone='idle']) {
  color: var(--dpt-tone); background: color-mix(in srgb, var(--dpt-tone) 12%, transparent);
  border-color: color-mix(in srgb, var(--dpt-tone) 24%, transparent);
}
.dpt-chevron {
  display: grid; place-items: center; flex: 0 0 20px; width: 20px; height: 20px; color: var(--dpt-muted);
  transition: transform var(--dpt-ease);
}
.dpt-row[data-open='true'] .dpt-chevron { transform: rotate(90deg); }
/* Flat full-bleed disclosure drawer: max 2 visual layers */
.dpt-drawer {
  margin: 0; padding: 10px 16px 12px 36px; min-width: 0; display: grid; gap: 10px;
  border-top: 1px dashed var(--dpt-line);
  background: color-mix(in srgb, var(--dpt-module) 68%, var(--dsw-alias-bg-base));
}
.dpt-drawer[hidden] { display: none; }
.dpt-drawer-bar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; min-width: 0;
}
.dpt-drawer-facts {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 12px; color: var(--dpt-muted); min-width: 0;
}
.dpt-drawer-facts > span { display: inline-flex; align-items: baseline; gap: 5px; min-width: 0; }
.dpt-drawer-facts strong { font-weight: 500; color: var(--dsw-alias-label-primary); }
.dpt-drawer-split {
  padding-top: 10px; border-top: .5px solid var(--dpt-line); min-width: 0; display: grid; gap: 8px;
}
/* Floating bottom multi-select action bar (zero layout shift) */
.dpt-floating-batch {
  position: sticky; bottom: 14px; z-index: 25; justify-self: center;
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
  max-width: 100%; padding: 6px 10px 6px 14px; border-radius: 999px;
  border: .5px solid var(--dsw-alias-border-l3, var(--dpt-line));
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, var(--dpt-module));
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
}
.dpt-batch-sep { width: 1px; height: 16px; background: var(--dpt-line); flex: 0 0 1px; }
/* Non-shifting floating toast for transient feedback & recovery paths */
.dpt-toast {
  position: fixed; right: 20px; bottom: 20px; z-index: 45;
  width: max-content; max-width: min(440px, calc(100vw - 32px));
  display: flex; align-items: start; gap: 10px; padding: 8px 10px 8px 14px;
  border-radius: var(--dsw-radius-md, 10px);
  border: .5px solid var(--dsw-alias-border-l3, var(--dpt-line));
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 8px 28px rgb(0 0 0 / 18%);
  transition: bottom var(--dpt-ease);
}
.dpt-controls:has(.dpt-floating-batch) > .dpt-toast { bottom: 68px; }
.dpt-toast[data-error='true'] { border-color: color-mix(in srgb, var(--dpt-danger) 45%, var(--dpt-line)); }
.dpt-toast-body { flex: 1; min-width: 0; display: grid; gap: 4px; padding-block: 2px; font-size: 12.5px; line-height: 18px; }
.dpt-toast[data-error='true'] .dpt-toast-body { color: var(--dpt-danger); }
.dpt-maintenance { background: transparent; border-style: dashed; }
.dpt-maintenance .dpt-disclosure { background: transparent; padding-block: 8px; }
.dpt-maintenance .dpt-row-title strong { font-size: 12.5px; color: var(--dpt-muted); font-weight: 500; }
.dpt-meta { display: grid; grid-template-columns: max-content minmax(0, 1fr); align-items: baseline; gap: 4px 12px; }
.dpt-meta dt, .dpt-field > span, .dpt-label { color: var(--dpt-muted); font-size: 12px; line-height: 18px; font-weight: 500; }
.dpt-meta dd, .dpt-message-text, .dpt-muted { min-width: 0; overflow-wrap: anywhere; }
.dpt-muted, .dpt-summary { color: var(--dpt-muted); font-size: 12px; line-height: 18px; }
.dpt, .dpt-modal { font-variant-numeric: tabular-nums; }
.dpt .dpt-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 18px; }
@media (pointer: coarse) { .dpt :is(input, select, textarea), .dpt :is(input, textarea).dpt-mono { font-size: 16px; } }
.dpt-empty { padding: 14px 16px; }
.dpt-empty-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; }
.dpt-scroll-box { max-height: 220px; overflow-y: auto; padding-inline-end: 4px; }
.dpt-repo-scroll { max-height: 420px; overflow-y: auto; padding-inline-end: 4px; }
.dpt-message {
  display: flex; align-items: start; gap: 8px; padding: 5px 10px; min-width: 0;
  border-radius: var(--dsw-radius-sm, 7px);
  background: color-mix(in srgb, var(--dpt-entry) 70%, var(--dpt-module));
}
.dpt-message-text { flex: 1; padding-block: 2px; font-size: 12px; line-height: 18px; }
.dpt-message [role='alert'] { color: var(--dpt-danger); }
.dpt .dpt-close { width: 22px; min-height: 22px; padding: 0; flex: 0 0 auto; color: var(--dpt-muted); }
.dpt-actions { justify-content: flex-end; gap: 6px; }
.dpt-path { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px 10px; }
.dpt-path code { flex: 1 1 220px; min-width: 0; overflow-wrap: anywhere; }
.dpt .dpt-copy { width: 76px; min-width: 76px; min-height: 26px; font-size: 12px; }
.dpt .dpt-copy[data-copied] { color: var(--dsw-alias-state-success-primary); }
.dpt-form { display: grid; gap: 10px; }
.dpt-edit { display: grid; gap: 10px; min-width: 0; }
.dpt-field { display: grid; gap: 4px; min-width: 0; }
.dpt-field textarea { width: 100%; resize: vertical; }
.dpt-field textarea.dpt-fixed-editor { height: 180px; resize: none; overflow-y: auto; }
.dpt-form-row .dpt-field { flex: 1 1 180px; }
.dpt ul.dpt-repo-skills { list-style: none; display: grid; gap: 0; padding: 0; border-top: .5px solid var(--dpt-line); }
.dpt-repo-skill { padding: 10px 0; display: grid; gap: 6px; min-width: 0; }
.dpt-repo-skill + .dpt-repo-skill { border-top: .5px solid var(--dpt-line); }
.dpt-argument-row { display: flex; gap: 6px; min-width: 0; }
.dpt-argument-row input { flex: 1 1 0; }
.dpt-check { display: inline-flex; gap: 6px; align-items: center; cursor: pointer; user-select: none; }
.dpt-check input[type='checkbox'] { accent-color: var(--dpt-accent); cursor: pointer; }
.dpt-tool-list { display: flex; flex-wrap: wrap; gap: 6px; }
.dpt-tool-chip {
  padding: 1px 7px; border-radius: 5px; border: .5px solid var(--dpt-line);
  background: var(--dpt-entry); color: var(--dsw-alias-label-primary);
}
.dpt-file-list { list-style: none; display: grid; gap: 4px; padding: 0; margin: 0; }
.dpt-file-list li { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--dpt-muted); }
.dpt-modal {
  width: min(480px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto;
  border: .5px solid var(--dpt-line); border-radius: var(--dsw-radius-lg, 14px);
  color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); padding: 20px;
}
.dpt-modal::backdrop { background: var(--dsw-alias-bg-mask-1, rgb(0 0 0 / 24%)); }
.dpt-review { width: min(700px, calc(100vw - 32px)); }
.dpt-modal-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.dpt-confirm-list { display: grid; gap: 8px; }
.dpt-confirm-list > section { padding: 8px 10px; border-radius: var(--dsw-radius-sm, 8px); background: var(--dpt-module); }
.dpt-confirm-list ul { padding-inline-start: 18px; }
.dpt pre { margin: 0; font: inherit; border: .5px solid var(--dpt-line); border-radius: var(--dsw-radius-sm, 8px); background: var(--dpt-entry); padding: 10px; max-height: 38dvh; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
.dpt-composer { display: inline-flex; gap: 6px; align-items: center; container-type: normal; }
.dpt-composer-action--fallback {
  display: grid; place-items: center; flex: none; width: 32px; height: 32px; padding: 0;
  border: 0; border-radius: 50%; corner-shape: round;
  cursor: pointer; transition: background-color 100ms ease;
}
.dpt .dpt-composer-action {
  background: var(--dsw-specific-selector);
  color: var(--dsw-alias-label-primary);
}
.dpt .dpt-composer-action:disabled { opacity: 1; cursor: default; }
.dpt-composer-action:disabled svg { opacity: .4; }
.dpt-composer-action.dpt-composer-undo {
  background: var(--dsw-alias-button-tool-bar-fill);
  color: var(--dsw-alias-label-secondary);
}
@media (hover: hover) {
  .dpt .dpt-composer-action:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-solid); }
  .dpt .dpt-composer-action.dpt-composer-undo:hover {
    background: var(--dsw-alias-button-tool-bar-hover);
    color: var(--dsw-alias-label-primary);
  }
}
.dpt-composer .dpt-message { font-size: 11px; max-width: 180px; padding: 2px 6px; }
@container (max-width: 560px) {
  .dpt .dpt-search, .dpt-bar > input[type='search'] { flex: 1 1 100%; width: 100%; }
  .dpt-toolbar-right { justify-content: flex-start; width: 100%; }
  .dpt-quick-actions--hover { display: none; }
  .dpt-summary { white-space: normal; overflow-wrap: anywhere; }
  .dpt-row-summary { white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .dpt-actions { row-gap: 4px; }
  .dpt-drawer { padding: 10px 12px 12px 12px; }
  .dpt-floating-batch { border-radius: var(--dsw-radius-md, 10px); }
}
@media (prefers-reduced-motion: reduce) {
  .dpt button, .dpt-chevron, .dpt-composer-action, .dpt-switch, .dpt-switch-thumb { transition: none; }
  .dpt-spin { animation: none; }
}
`

    async function request(feature, payload = {}, signal) {
      const response = await fetch('api/dsh-powertools', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ feature, ...payload }), signal,
      })
      const value = await response.json().catch(() => null)
      if (!response.ok || !value) throw new Error(value?.error ?? '无法连接 DSH 工具箱。')
      return value
    }

    const button = (text, click, { className = '', icon, iconSize = 14, iconClass = '', ...props } = {}) => h(Button, {
      size: 'sm', onClick: click, ...props, className: `dpt-button ${className}`,
    }, icon && h(Icon, { name: icon, size: iconSize, className: iconClass }), text)
    const primary = (text, click, props) => button(text, click, { variant: 'primary', className: 'dpt-primary', ...props })
    const iconButton = (label, icon, click, { className = '', iconSize = 14, iconClass = '', ...props } = {}) => button('', click, {
      icon, iconSize, iconClass, className: `dpt-icon-btn ${className}`, 'aria-label': label, title: props.title ?? label, ...props,
    })
    const option = (value, text) => h('option', { key: value, value }, text)
    const field = (label, control) => h('label', { className: 'dpt-field' }, h('span', null, label), control)
    const muted = (text, props) => h('p', { className: 'dpt-muted', ...props }, text)
    const code = text => h('code', { className: 'dpt-mono', dir: 'ltr' }, text)
    const filterInput = (label, value, set, className = 'dpt-search') => h('input', {
      type: 'search', className, 'aria-label': label, placeholder: label, value,
      onChange: e => set(e.target.value),
      onKeyDown: e => { if (e.key === 'Escape' && value) { e.preventDefault(); set('') } },
    })
    const pick = (label, value, set, options) => h('select', { 'aria-label': label, value, onChange: e => set(e.target.value) }, options)
    const feedback = (message, error, dismiss) => message && h('div', { className: 'dpt-message' },
      h('div', { className: 'dpt-message-text', role: error ? 'alert' : 'status' }, message),
      dismiss && button('', dismiss, { icon: 'x', iconSize: 13, className: 'dpt-close', 'aria-label': '关闭反馈' }))
    const matches = (query, ...values) => values.some(value => value?.toLowerCase().includes(query.trim().toLowerCase()))
    const formatBytes = bytes => {
      if (!Number.isFinite(bytes)) return ''
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
    }
    const formatShortTime = ts => {
      if (!ts || !Number.isFinite(ts) || ts <= 0) return ''
      const date = new Date(ts)
      const now = new Date()
      const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
      const hm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      if (sameDay) return `今天 ${hm}`
      const md = `${date.getMonth() + 1}/${date.getDate()}`
      return date.getFullYear() === now.getFullYear() ? `${md} ${hm}` : `${date.getFullYear()}/${md}`
    }
    const identity = value => value
    const workspaceTitle = workspace => workspace.title === 'default-workspace' ? '默认工作区' : workspace.title

    function Segmented({ label, value, onChange, items }) {
      return h('div', { className: 'dpt-seg', role: 'group', 'aria-label': label }, items.map(item =>
        h('button', {
          key: item.value, type: 'button', className: 'dpt-seg-btn',
          'aria-pressed': value === item.value,
          'data-alert': item.alert || undefined,
          onClick: () => onChange(item.value),
        },
        h('span', null, item.label),
        item.count !== undefined && item.count !== null && h('span', { className: 'dpt-seg-count' }, item.count))))
    }

    function Switch({ checked, onChange, label, disabled }) {
      return h('button', {
        type: 'button', role: 'switch', className: 'dpt-switch',
        'aria-checked': Boolean(checked), 'aria-label': label, title: label, disabled,
        onClick: e => { e.stopPropagation(); onChange(!checked) },
      }, h('span', { className: 'dpt-switch-thumb', 'aria-hidden': true }))
    }

    function useToast() {
      const [toast, setToast] = useState(null)
      const [hovered, setHovered] = useState(false)
      useEffect(() => {
        if (!toast || toast.error || hovered) return
        const duration = toast.sticky ? 8000 : 2600
        const timer = setTimeout(() => setToast(null), duration)
        return () => clearTimeout(timer)
      }, [toast, hovered])
      const show = (content, { error = false, sticky = false } = {}) => {
        if (!content) { setToast(null); return }
        setToast({ id: Date.now() + Math.random(), content, error, sticky })
      }
      const node = toast && h('div', {
        className: 'dpt-toast', 'data-error': toast.error || undefined,
        onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false),
      },
      h('div', { className: 'dpt-toast-body', role: toast.error ? 'alert' : 'status' }, toast.content),
      button('', () => setToast(null), { icon: 'x', iconSize: 13, className: 'dpt-close', 'aria-label': '关闭提示' }))
      return { show, dismiss: () => setToast(null), node }
    }

    function useInfiniteScroll(total, resetKey, step = 50) {
      const [state, setState] = useState({ key: resetKey, limit: step })
      const sentinelRef = useRef(null)
      const limit = state.key === resetKey ? state.limit : step
      const hasMore = total > limit
      useEffect(() => {
        if (state.key !== resetKey) setState({ key: resetKey, limit: step })
      }, [resetKey, step, state.key])
      useEffect(() => {
        const node = sentinelRef.current
        if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return
        const observer = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            setState(previous => ({
              key: resetKey,
              limit: Math.min(total, (previous.key === resetKey ? previous.limit : step) + step),
            }))
          }
        }, { rootMargin: '360px 0px' })
        observer.observe(node)
        return () => observer.disconnect()
      }, [hasMore, limit, resetKey, step, total])
      return {
        limit,
        hasMore,
        sentinel: hasMore && h('li', { ref: sentinelRef, className: 'dpt-sentinel', 'aria-hidden': true }),
      }
    }

    function PanelSection({ title, summary, toolbar, children }) {
      return h('section', { 'aria-label': title },
        h('header', { className: 'dpt-heading' }, h('h3', null, title),
          summary && h('p', { className: 'dpt-summary' }, summary)),
        h('div', { className: 'dpt-section-body' }, toolbar, children))
    }

    const empty = (message, onReset) => h('div', { className: `dpt-card dpt-empty${onReset ? ' dpt-empty-row' : ''}` },
      muted(message, { role: 'status' }),
      onReset && button('重置筛选', onReset, { icon: 'x', iconSize: 13 }))
    const facts = entries => h('dl', { className: 'dpt-meta' }, entries.map(([label, value]) =>
      h(React.Fragment, { key: label }, h('dt', null, label), h('dd', null, value))))
    const pill = (text, tone = 'idle', id) => h('span', { id, className: 'dpt-pill', 'data-tone': tone }, text)

    function useHostStatus() {
      const [state, setState] = useState({ loading: true })
      const active = useRef(null)
      async function check() {
        active.current?.abort()
        const controller = new AbortController()
        active.current = controller
        setState(previous => ({ ...previous, loading: true, error: '' }))
        try {
          const info = await request('capabilities', {}, controller.signal)
          if (!controller.signal.aborted) setState({ info })
        } catch (error) {
          if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: error.message, failed: true }))
        }
      }
      useEffect(() => {
        void check()
        return () => active.current?.abort()
      }, [])
      return { ...state, check, dismiss: () => setState(previous => ({ ...previous, error: '' })) }
    }

    function PathLine({ value, label = '路径' }) {
      const [copied, setCopied] = useState(false)
      const [error, setError] = useState('')
      const timer = useRef(null)
      useEffect(() => () => clearTimeout(timer.current), [])
      async function copy() {
        clearTimeout(timer.current)
        setError('')
        try {
          if (!await writeClipboard(value)) throw new Error('clipboard unavailable')
          setCopied(true)
          timer.current = setTimeout(() => setCopied(false), 1800)
        } catch {
          setCopied(false)
          setError('无法访问剪贴板。可以选择并复制路径。')
        }
      }
      return h(React.Fragment, null, h('div', { className: 'dpt-path' }, code(value),
        button(copied ? '已复制' : '复制', copy, {
          icon: copied ? 'check' : 'copy', iconSize: 12,
          className: 'dpt-copy', 'data-copied': copied || undefined,
          'aria-label': copied ? `已复制${label}` : `复制${label}`,
        })),
      feedback(error, true, () => setError('')))
    }

    function DisclosureRow({
      title, tag, chips, detail, badge, tone = 'idle', expanded, onToggle,
      selectable, quickActions, alwaysActions, children, ...props
    }) {
      const id = React.useId()
      const descriptions = [tag && `${id}-tag`, detail && `${id}-detail`, badge && `${id}-status`].filter(Boolean).join(' ')
      return h('li', {
        className: 'dpt-row', 'data-open': expanded || undefined,
        'data-selected': selectable?.checked || undefined, ...props,
      },
      h('div', { className: 'dpt-row-main' },
        selectable && h('label', {
          className: 'dpt-lead-cell',
          onClick: e => e.stopPropagation(),
        },
        h('span', { className: 'dpt-indicator', 'data-tone': tone, 'aria-hidden': true }),
        h('input', {
          type: 'checkbox', className: 'dpt-row-checkbox',
          checked: selectable.checked, 'aria-label': selectable.label,
          onChange: e => selectable.onChange(e.target.checked, Boolean(e.nativeEvent?.shiftKey)),
        })),
        h('button', {
          type: 'button', className: 'dpt-disclosure', onClick: onToggle,
          'aria-label': title, 'aria-expanded': expanded, 'aria-controls': id,
          'aria-describedby': descriptions || undefined,
        },
        !selectable && h('span', { className: 'dpt-indicator', 'data-tone': tone, 'aria-hidden': true }),
        h('span', { className: 'dpt-row-label' },
          h('span', { className: 'dpt-row-title' },
            h('strong', { className: 'dpt-ellipsis', dir: 'auto' }, title),
            tag && h('span', { id: `${id}-tag`, className: 'dpt-row-tag dpt-mono', dir: 'ltr' }, tag),
            chips),
          detail && h('span', { id: `${id}-detail`, className: 'dpt-muted dpt-ellipsis dpt-row-summary', dir: 'auto' }, detail))),
        h('div', { className: 'dpt-row-end' },
          quickActions && h('div', { className: 'dpt-quick-actions dpt-quick-actions--hover' }, quickActions),
          alwaysActions && h('div', { className: 'dpt-quick-actions' }, alwaysActions),
          h('span', { className: 'dpt-row-toggle-tail', onClick: onToggle, 'aria-hidden': true },
            badge && pill(badge, tone, `${id}-status`),
            h('span', { className: 'dpt-chevron' }, h(IconChevronRightOutlineRegular, { size: 16 }))))),
      h('div', { id, hidden: !expanded, className: 'dpt-drawer' }, expanded && children))
    }

    function useDisclosure() {
      const [choices, setChoices] = useState(() => new Map())
      const bind = (key, initial = false) => {
        const expanded = choices.get(key) ?? initial
        return {
          expanded,
          open: () => setChoices(previous => new Map(previous).set(key, true)),
          onToggle: () => setChoices(previous => new Map(previous).set(key, !expanded)),
        }
      }
      bind.isOpen = (key, initial = false) => choices.get(key) ?? initial
      bind.collapseAll = keys => setChoices(previous => {
        const next = new Map(previous)
        for (const key of keys) next.set(key, false)
        return next
      })
      return bind
    }

    function Modal({ title, close, review = false, children }) {
      const dialog = useRef(null)
      const heading = React.useId()
      useLayoutEffect(() => {
        const node = dialog.current
        node.showModal()
        return () => node.close()
      }, [])
      return h('dialog', {
        ref: dialog, className: `dpt dpt-modal${review ? ' dpt-review' : ''}`, 'aria-labelledby': heading,
        onCancel: e => { e.preventDefault(); close() },
      },
      h('style', null, css),
      h('header', { className: 'dpt-modal-head' }, h('h2', { id: heading }, title), button('关闭', close, { icon: 'x', iconSize: 13 })), children)
    }

    function useAction() {
      const [status, setStatus] = useState({ busy: false })
      const active = useRef(false)
      async function run(operation) {
        if (active.current) return
        active.current = true
        setStatus({ busy: true })
        try {
          const message = await operation()
          setStatus({ busy: false, message })
          return message
        } catch (error) {
          setStatus({ busy: false, message: error.message || '操作未完成。', error: true })
          return undefined
        } finally { active.current = false }
      }
      const dismiss = () => setStatus(previous => ({ busy: previous.busy }))
      return [status, run, dismiss]
    }

    function useHostSessions(sessionVersion, hostInfo) {
      const [items, setItems] = useState(null)
      const [error, setError] = useState('')
      const [reloading, setReloading] = useState(false)
      const generation = useRef(0)
      async function reload(signal) {
        const current = ++generation.current
        setReloading(true)
        try {
          const { sessions } = await request('sessions', { action: 'list' }, signal)
          if (current === generation.current && !signal?.aborted) { setItems(sessions); setError('') }
        } catch (err) {
          if (current === generation.current && !signal?.aborted) {
            const staleHost = hostInfo && hostInfo.sessionDelete === false
            setError(staleHost ? 'DSH 宿主仍在运行旧版插件代码，请完全退出并重启 DSH 后生效。' : err.message)
          }
        } finally {
          if (current === generation.current) setReloading(false)
        }
      }
      useEffect(() => {
        const abort = new AbortController()
        void reload(abort.signal)
        return () => { abort.abort(); generation.current++ }
      }, [sessionVersion, hostInfo?.sessionDelete])
      return { items, error, reloading, reload, dismissError: () => setError('') }
    }

    function subagentLabel(item) {
      const parts = ['子 Agent']
      if (item.agentPreset) parts.push(item.agentPreset)
      if (item.delegationDepth) parts.push(`L${item.delegationDepth}`)
      return parts.join(' · ')
    }

    function SessionRow({
      row, id, title, workspaces, isArchived, subagents, totalBytes, navigation, onArchived, onDeleted,
      notify, disclosure, selectable,
    }) {
      const [status, run, dismiss] = useAction()
      const [removal, setRemoval] = useState(false)
      const [showAllSubagents, setShowAllSubagents] = useState(false)
      async function archive() {
        await run(async () => {
          try {
            if (isArchived) await navigation.unarchiveSession(id)
            else await navigation.archiveSession(id, { stopActivity: false })
          } catch (error) {
            if (error.rpcError?.code === 'workspace/session-active') throw new Error('会话仍有运行中的工作。停止后可归档。')
            throw error
          }
          onArchived(isArchived ? '会话已恢复' : '会话已归档')
        })
      }
      const timeSummary = formatShortTime(row.updatedAt || row.createdAt)
      const sizeSummary = totalBytes !== null ? formatBytes(totalBytes) : ''
      const detailParts = [
        row.isSubagent ? (row.orphanSubagent ? '孤儿子会话（父会话已移除）' : `隶属 ${row.parentSessionId}`) : (workspaces.map(workspaceTitle).join('、') || '未分组'),
        sizeSummary,
        timeSummary,
      ].filter(Boolean)
      const badge = row.running ? '运行中' : row.isSubagent ? '子 Agent' : isArchived ? '已归档' : undefined
      const tone = row.running ? 'info' : row.isSubagent ? 'attention' : 'idle'
      const removedItems = [
        `${row.isSubagent ? '子 Agent 会话' : '会话'}「${title}」（${id}）`,
        ...(subagents.length > 0 ? [
          `关联的 ${subagents.length} 条子 Agent 会话记录：` + subagents.slice(0, 6).map(item => item.id).join('、') + (subagents.length > 6 ? ` 等共 ${subagents.length} 条` : ''),
        ] : []),
      ]
      const visibleSubagents = showAllSubagents ? subagents : subagents.slice(0, 6)
      const activeTime = row.updatedAt || row.createdAt
      const deleteHint = row.deletable
        ? (subagents.length > 0 ? `关联删除（含 ${subagents.length} 条子会话）` : '删除会话')
        : (row.deleteReason || '当前不可删除')

      const quickActions = h(React.Fragment, null,
        !row.isSubagent && button('打开', () => run(() => navigation.openSession(id)), {
          icon: 'external-link', iconSize: 13, className: 'dpt-row-btn', disabled: status.busy,
          'aria-label': `打开 ${title}`,
        }),
        !row.isSubagent && iconButton(
          `${isArchived ? '恢复' : '归档'} ${title}`,
          isArchived ? 'archive-restore' : 'archive',
          archive,
          { className: 'dpt-row-icon-btn', iconSize: 13, title: isArchived ? '恢复会话' : '归档会话', disabled: status.busy || (!isArchived && row.running) },
        ),
        iconButton(
          `删除 ${title}`,
          'trash',
          () => setRemoval(true),
          { className: 'dpt-row-icon-btn dpt-danger', iconSize: 13, title: deleteHint, disabled: status.busy || !row.deletable },
        ))

      return h(DisclosureRow, {
        'data-session-id': id, 'data-session-kind': row.isSubagent ? 'subagent' : 'session',
        title,
        tag: row.isSubagent ? (row.agentPreset || (row.delegationDepth ? `L${row.delegationDepth}` : undefined)) : undefined,
        chips: subagents.length > 0 ? pill(`${subagents.length} 子会话`) : undefined,
        detail: detailParts.join(' · '), badge, tone, selectable, quickActions, ...disclosure,
      },
      h('div', { className: 'dpt-drawer-bar' },
        h('div', { className: 'dpt-drawer-facts' },
          h('span', null, '会话 ID', code(id)),
          row.isSubagent && row.parentSessionId && h('span', null, '父会话', code(row.parentSessionId)),
          activeTime > 0 && h('span', null, row.updatedAt > 0 ? '更新' : '创建', h('strong', null, new Date(activeTime).toLocaleString())),
          totalBytes !== null && h('span', null, '大小', h('strong', null,
            subagents.length > 0 && Number.isFinite(row.sizeBytes) && totalBytes > row.sizeBytes
              ? `${formatBytes(totalBytes)}（主会话 ${formatBytes(row.sizeBytes)}）`
              : formatBytes(totalBytes)))),
        h('div', { className: 'dpt-actions' },
          !row.isSubagent && button('打开', () => run(() => navigation.openSession(id)), { icon: 'external-link', disabled: status.busy }),
          !row.isSubagent && button(isArchived ? '恢复' : '归档', archive, { icon: isArchived ? 'archive-restore' : 'archive', disabled: status.busy || (!isArchived && row.running) }),
          button(subagents.length > 0 ? `关联删除（${subagents.length + 1}）` : '删除', () => setRemoval(true), {
            icon: 'trash', className: 'dpt-danger', disabled: status.busy || !row.deletable, title: deleteHint,
          }))),
      row.cwd && h(PathLine, { value: row.cwd }),
      subagents.length > 0 && h('div', { className: 'dpt-drawer-split' },
        h('div', { className: 'dpt-drawer-bar' },
          h('span', { className: 'dpt-label' }, `关联子 Agent 会话（${subagents.length}）· 删除主会话时自动一并清理`),
          subagents.length > 6 && button(showAllSubagents ? '收起列表' : `展开全部 ${subagents.length} 条`, () => setShowAllSubagents(!showAllSubagents))),
        h('ul', { className: `dpt-file-list${showAllSubagents && subagents.length > 8 ? ' dpt-scroll-box' : ''}` }, visibleSubagents.map(child =>
          h('li', { key: child.id, 'data-subagent-id': child.id },
            h('span', null, subagentLabel(child), ' ', code(child.id)),
            h('span', null, [
              child.running ? '运行中' : child.resident ? '打开中' : '',
              Number.isFinite(child.sizeBytes) ? formatBytes(child.sizeBytes) : '',
            ].filter(Boolean).join(' · ') || '已落盘'))))),
      !row.deletable && row.deleteReason && muted(row.deleteReason),
      feedback(status.error ? status.message : '', true, dismiss),
      removal && h(Confirm, {
        title: `删除 ${title}`,
        label: subagents.length > 0 ? `确认关联删除（${subagents.length + 1} 条）` : '确认删除会话',
        removed: removedItems,
        preserved: ['工作区目录及所有项目文件', '其他无关会话与独立分支会话', 'Profile 恢复目录中的会话备份（含 manifest.json）'],
        close: () => setRemoval(false),
        confirm: async () => {
          const result = await request('sessions', { action: 'delete', sessionId: id, confirm: id })
          setRemoval(false)
          await onDeleted(result)
        },
      }))
    }

    function SessionPanel({ sessionList, workspaceList, navigation, refresh, host, toast }) {
      const [query, search] = useState('')
      const [workspace, selectWorkspace] = useState('all')
      const [viewMode, setViewMode] = useState('active')
      const [sortBy, setSortBy] = useState('recent')
      const [selectedIds, setSelectedIds] = useState(() => new Set())
      const [batchRemoval, setBatchRemoval] = useState(false)
      const [refreshing, setRefreshing] = useState(false)
      const [status, run, dismiss] = useAction()
      const lastClickedIndex = useRef(-1)
      const disclosure = useDisclosure()
      const hostSessions = useHostSessions(`${sessionList.ids.length}:${workspaceList.archivedSessionIds.length}`, host.info)
      const archived = new Set(workspaceList.archivedSessionIds)
      const groups = new Map()
      for (const item of workspaceList.items) for (const id of item.sessionIds) {
        groups.set(id, [...(groups.get(id) ?? []), item])
      }

      const mergedById = new Map()
      for (const id of sessionList.ids) {
        const clientRow = sessionList.byId[id]
        mergedById.set(id, {
          id,
          title: clientRow.title || (clientRow.displayTitle !== id && clientRow.displayTitle) || '未命名会话',
          cwd: clientRow.cwd ?? '',
          updatedAt: clientRow.updatedAt ?? 0,
          createdAt: 0,
          running: Boolean(clientRow.running),
          isSubagent: false,
          orphanSubagent: false,
          parentSessionId: null,
          descendantSubagentIds: [],
          sizeBytes: null,
          deletable: false,
          deleteReason: '正在核对会话持久化状态…',
          workspaces: groups.get(id) ?? [],
        })
      }
      for (const hRow of hostSessions.items ?? []) {
        const existing = mergedById.get(hRow.id)
        const byCwd = hRow.cwd ? workspaceList.items.filter(item => item.path && item.path === hRow.cwd) : []
        const wsList = existing?.workspaces?.length
          ? existing.workspaces
          : (hRow.workspaces?.length
            ? hRow.workspaces
            : (groups.get(hRow.id) ?? (hRow.rootSessionId ? groups.get(hRow.rootSessionId) : undefined) ?? byCwd))
        const fallbackTitle = hRow.isSubagent ? subagentLabel(hRow) : '未命名会话'
        mergedById.set(hRow.id, {
          ...(existing ?? {}),
          ...hRow,
          title: existing?.title && existing.title !== '未命名会话' ? existing.title : fallbackTitle,
          cwd: existing?.cwd || hRow.cwd || '',
          updatedAt: existing?.updatedAt || hRow.createdAt || 0,
          running: Boolean(existing?.running || hRow.running),
          workspaces: wsList,
        })
      }

      const allMerged = [...mergedById.values()]
      const inSelectedWorkspace = row => {
        const ws = row.workspaces ?? []
        return workspace === 'all' || (workspace === 'none' ? ws.length === 0 : ws.some(item => item.workspaceId === workspace))
      }

      // Counts on the segmented tabs reflect workspace filter so numbers always match what you click into.
      const wsScoped = allMerged.filter(inSelectedWorkspace)
      const activeCount = wsScoped.filter(item => (!item.isSubagent || item.orphanSubagent) && !archived.has(item.id)).length
      const archivedCount = wsScoped.filter(item => !item.isSubagent && archived.has(item.id)).length
      const subagentCount = wsScoped.filter(item => item.isSubagent).length

      const rows = wsScoped.flatMap(row => {
        const isArchived = archived.has(row.id)
        if (viewMode === 'active') {
          if ((row.isSubagent && !row.orphanSubagent) || isArchived) return []
        } else if (viewMode === 'archived') {
          if (row.isSubagent || !isArchived) return []
        } else if (viewMode === 'subagent') {
          if (!row.isSubagent) return []
        }
        const subagents = (row.descendantSubagentIds ?? []).map(subId => mergedById.get(subId)).filter(Boolean)
        const subagentText = subagents.map(sub => `${sub.id} ${sub.agentPreset ?? ''}`).join(' ')
        if (!matches(query, row.title, row.id, row.agentPreset ?? '', subagentText)) return []
        const ownBytes = Number.isFinite(row.sizeBytes) ? row.sizeBytes : 0
        const subBytes = subagents.reduce((sum, sub) => sum + (Number.isFinite(sub.sizeBytes) ? sub.sizeBytes : 0), 0)
        const totalBytes = Number.isFinite(row.sizeBytes) || subagents.some(sub => Number.isFinite(sub.sizeBytes))
          ? ownBytes + subBytes : null
        return [{ row, id: row.id, title: row.title, workspaces: row.workspaces ?? [], isArchived, subagents, totalBytes }]
      }).sort((a, b) => {
        const recentDiff = (b.row.updatedAt || b.row.createdAt) - (a.row.updatedAt || a.row.createdAt)
        if (sortBy === 'oldest') return ((a.row.createdAt || a.row.updatedAt) - (b.row.createdAt || b.row.updatedAt)) || -recentDiff
        if (sortBy === 'size') return ((b.totalBytes ?? -1) - (a.totalBytes ?? -1)) || recentDiff
        if (sortBy === 'subagents') return (b.subagents.length - a.subagents.length) || recentDiff
        return recentDiff
      })

      const hasActiveFilter = Boolean(query.trim()) || workspace !== 'all' || sortBy !== 'recent'
      const resetFilters = () => { search(''); selectWorkspace('all'); setSortBy('recent') }
      const scroller = useInfiniteScroll(rows.length, `${viewMode}\n${query}\n${workspace}\n${sortBy}`, 50)
      const visibleRows = rows.slice(0, scroller.limit)
      const openKeys = visibleRows.filter(item => disclosure.isOpen(item.id)).map(item => item.id)

      const selectedRows = rows.filter(item => selectedIds.has(item.id))
      const deletableRows = rows.filter(item => item.row.deletable)
      const deletableSelected = selectedRows.filter(item => item.row.deletable)
      const lockedSelectedCount = selectedRows.length - deletableSelected.length
      const archivableSelected = selectedRows.filter(item => !item.row.isSubagent && !item.isArchived && !item.row.running)
      const restorableSelected = selectedRows.filter(item => !item.row.isSubagent && item.isArchived)
      const allFilteredSelected = rows.length > 0 && selectedRows.length === rows.length

      const cascadeTargetIds = new Set()
      const directDeleteSet = new Set(deletableSelected.map(item => item.id))
      for (const item of deletableSelected) {
        cascadeTargetIds.add(item.id)
        for (const sub of item.subagents) cascadeTargetIds.add(sub.id)
      }
      const cascadedExtraCount = [...cascadeTargetIds].filter(id => !directDeleteSet.has(id)).length

      useEffect(() => {
        if (!selectedRows.length) return
        const onKey = e => {
          if (e.key === 'Escape' && !document.querySelector('dialog[open]')) {
            setSelectedIds(new Set())
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [selectedRows.length])

      function toggleSelect(index, id, checked, shiftKey) {
        if (checked) toast.dismiss()
        setSelectedIds(previous => {
          const next = new Set(previous)
          if (shiftKey && lastClickedIndex.current >= 0 && lastClickedIndex.current < rows.length) {
            const [start, end] = [Math.min(lastClickedIndex.current, index), Math.max(lastClickedIndex.current, index)]
            for (let i = start; i <= end; i++) {
              if (checked) next.add(rows[i].id)
              else next.delete(rows[i].id)
            }
          } else if (checked) next.add(id)
          else next.delete(id)
          lastClickedIndex.current = index
          return next
        })
      }

      async function silentRefresh() {
        if (refreshing) return
        setRefreshing(true)
        try { await Promise.all([refresh(), hostSessions.reload()]) }
        finally { setRefreshing(false) }
      }

      async function handleDeleted(result) {
        await Promise.all([refresh(), hostSessions.reload()])
        setSelectedIds(previous => {
          const next = new Set(previous)
          for (const id of result.deletedIds ?? []) next.delete(id)
          return next
        })
        const total = result.deletedIds?.length ?? 1
        const sub = result.subagentCount ?? 0
        const isBatch = (result.requestedCount ?? 1) > 1
        toast.show(h(React.Fragment, null,
          h('p', null, isBatch
            ? `已批量清理 ${total} 条会话${sub > 0 ? `（含 ${sub} 条子 Agent）` : ''}`
            : (sub > 0 ? `已关联删除 ${total} 条会话（含 ${sub} 条子 Agent）` : '会话已移至恢复目录')),
          h(PathLine, { value: result.recovery, label: '恢复目录' })), { sticky: true })
      }

      function batchArchive(restore) {
        const targets = restore ? restorableSelected : archivableSelected
        if (!targets.length) return
        return run(async () => {
          let completed = 0
          for (const item of targets) {
            try {
              if (restore) await navigation.unarchiveSession(item.id)
              else await navigation.archiveSession(item.id, { stopActivity: false })
              completed++
            } catch (error) {
              if (error.rpcError?.code !== 'workspace/session-active') throw error
            }
          }
          setSelectedIds(previous => {
            const next = new Set(previous)
            for (const item of targets) next.delete(item.id)
            return next
          })
          await hostSessions.reload()
          toast.show(restore ? `已恢复 ${completed} 个会话` : `已归档 ${completed} 个会话`)
        })
      }

      return h('div', { className: 'dpt-panel' },
        feedback(host.error, true, host.dismiss),
        feedback(hostSessions.error, true, hostSessions.dismissError),
        feedback(status.error ? status.message : '', true, dismiss),
        h('div', { className: 'dpt-toolbar' },
          h(Segmented, {
            label: '会话视图', value: viewMode,
            onChange: next => { setViewMode(next); setSelectedIds(new Set()); lastClickedIndex.current = -1 },
            items: [
              { value: 'active', label: '未归档', count: sessionList.phase === 'ready' ? activeCount : null },
              { value: 'archived', label: '已归档', count: sessionList.phase === 'ready' ? archivedCount : null },
              { value: 'subagent', label: '子 Agent', count: hostSessions.items ? subagentCount : null },
            ],
          }),
          h('div', { className: 'dpt-toolbar-right' },
            filterInput('搜索会话标题', query, search),
            pick('工作区', workspace, selectWorkspace, [
              option('all', '全部工作区'),
              option('none', '未分组'),
              ...workspaceList.items.map(item => option(item.workspaceId, workspaceTitle(item))),
            ]),
            pick('排序方式', sortBy, setSortBy, [
              option('recent', '最近活跃'),
              option('oldest', '最早创建'),
              option('size', '占用最大'),
              option('subagents', '子会话最多'),
            ]),
            hasActiveFilter && rows.length > 0 && button('重置筛选', resetFilters, { icon: 'x', iconSize: 13 }),
            openKeys.length >= 2 && button('收起全部', () => disclosure.collapseAll(openKeys), { icon: 'chevrons-down-up', iconSize: 13 }),
            iconButton('刷新会话', 'refresh-cw', silentRefresh, {
              iconClass: (refreshing || hostSessions.reloading) ? 'dpt-spin' : '',
              disabled: refreshing, 'aria-busy': refreshing,
            }))),
        rows.length === 0
          ? empty(sessionList.phase === 'ready' ? '没有符合条件的会话。' : '正在读取会话…', sessionList.phase === 'ready' && hasActiveFilter ? resetFilters : undefined)
          : h('ul', { className: 'dpt-card', 'data-selecting': selectedRows.length > 0 || undefined },
            visibleRows.map((item, index) => h(SessionRow, {
              ...item, key: item.id, navigation, notify: toast.show,
              disclosure: disclosure(item.id),
              selectable: {
                checked: selectedIds.has(item.id),
                label: `选择会话 ${item.title}`,
                onChange: (checked, shiftKey) => toggleSelect(index, item.id, checked, shiftKey),
              },
              onArchived: message => { toast.show(message); void hostSessions.reload() },
              onDeleted: handleDeleted,
            })),
            scroller.sentinel),
        selectedRows.length > 0 && h('div', { className: 'dpt-floating-batch', role: 'region', 'aria-label': '会话批量操作' },
          h('span', { className: 'dpt-summary' }, `已选 ${selectedRows.length} 项${cascadedExtraCount > 0 ? `（+${cascadedExtraCount} 子会话）` : ''}`),
          button(allFilteredSelected ? '取消全选' : `全选 (${rows.length})`, () => {
            setSelectedIds(allFilteredSelected ? new Set() : new Set(rows.map(item => item.id)))
          }, { className: 'dpt-row-btn' }),
          deletableRows.length > 0 && deletableRows.length < rows.length && button(`仅选可删 (${deletableRows.length})`, () => {
            setSelectedIds(new Set(deletableRows.map(item => item.id)))
          }, { className: 'dpt-row-btn' }),
          h('span', { className: 'dpt-batch-sep', 'aria-hidden': true }),
          archivableSelected.length > 0 && button(`归档 (${archivableSelected.length})`, () => batchArchive(false), { icon: 'archive', iconSize: 13, className: 'dpt-row-btn', disabled: status.busy }),
          restorableSelected.length > 0 && button(`恢复 (${restorableSelected.length})`, () => batchArchive(true), { icon: 'archive-restore', iconSize: 13, className: 'dpt-row-btn', disabled: status.busy }),
          button(`删除 (${deletableSelected.length})`, () => setBatchRemoval(true), {
            icon: 'trash', iconSize: 13, className: 'dpt-row-btn dpt-danger',
            disabled: status.busy || deletableSelected.length === 0,
            title: deletableSelected.length === 0 ? '所选会话正在运行或由当前进程持有，暂不可删除' : undefined,
          }),
          iconButton('取消选择', 'x', () => setSelectedIds(new Set()), { className: 'dpt-row-icon-btn', iconSize: 13 })),
        batchRemoval && deletableSelected.length > 0 && h(Confirm, {
          title: `批量删除 ${deletableSelected.length} 条会话`,
          label: `确认批量删除（共 ${cascadeTargetIds.size} 条）`,
          removed: [
            ...deletableSelected.slice(0, 6).map(item => `${item.row.isSubagent ? '子 Agent 会话' : '会话'}「${item.title}」（${item.id}）`),
            ...(deletableSelected.length > 6 ? [`其余 ${deletableSelected.length - 6} 条已选会话（合计 ${deletableSelected.length} 条）`] : []),
            ...(cascadedExtraCount > 0 ? [`自动关联的 ${cascadedExtraCount} 条子 Agent 会话记录`] : []),
          ],
          preserved: [
            ...(lockedSelectedCount > 0 ? [`已自动跳过的 ${lockedSelectedCount} 条运行中或当前进程打开的会话`] : []),
            '工作区目录及所有项目文件',
            '其他未选中会话与独立分支会话',
            'Profile 恢复目录中的会话备份（含 manifest.json）',
          ],
          close: () => setBatchRemoval(false),
          confirm: async () => {
            const result = await request('sessions', {
              action: 'batch-delete',
              sessionIds: deletableSelected.map(item => item.id),
              confirm: true,
            })
            setBatchRemoval(false)
            await handleDeleted(result)
          },
        }))
    }

    const mcpSources = { user: '用户配置', inherited: '继承配置', plugin: '插件注册', retired: '已移除' }
    const mcpSourceOrder = { user: 1, inherited: 2, plugin: 3, retired: 4 }
    const mcpStates = { disabled: '已停用', connected: '已连接', connecting: '连接中', reconnecting: '重连中', failed: '连接失败', closed: '已断开', 'waiting-credentials': '等待凭据', 'waiting-authorization': '等待授权' }
    const mcpIssues = {
      failed: '连接未建立。可以测试连接或重新连接。',
      'waiting-credentials': '请在 DSH 中检查此服务器引用的凭据。',
      'waiting-authorization': '请在 DSH 的连接账号界面完成授权。',
      closed: '服务器连接已关闭。可以尝试重新连接。',
    }

    const mcpFields = ['command', 'args', 'cwd', 'env', 'url', 'headers']
    const mcpObject = value => value && typeof value === 'object' && !Array.isArray(value)

    function mcpDraft(text) {
      let data
      try { data = JSON.parse(text) } catch { throw new Error('JSON 格式无效，请检查括号和引号。') }
      if (!mcpObject(data)) throw new Error('请提供一个 MCP 服务器对象。')
      let name = data.name
      let config = data
      if (Object.hasOwn(data, 'mcpServers')) {
        if (!mcpObject(data.mcpServers) || Object.keys(data.mcpServers).length !== 1) {
          throw new Error('每次保存一个服务器。请在 mcpServers 中保留一项。')
        }
        const [entry] = Object.entries(data.mcpServers)
        name = entry[0]
        config = entry[1]
      }
      if (!mcpObject(config) || name !== undefined && typeof name !== 'string') throw new Error('服务器配置或名称无效。')
      const type = config.transport ?? config.type ?? (config.url !== undefined ? 'streamable-http' : 'stdio')
      const transport = type === 'http' ? 'streamable-http' : type
      if (!['stdio', 'streamable-http'].includes(transport)) throw new Error('传输方式须为 stdio 或 streamable-http。')
      const allowed = transport === 'stdio' ? ['command', 'args', 'cwd', 'env'] : ['url', 'headers']
      const values = {}
      for (const [key, value] of Object.entries(config)) {
        if (['name', 'type', 'transport'].includes(key)) continue
        if (!allowed.includes(key)) throw new Error('JSON 包含当前传输方式无法录入的字段。')
        if (key === 'args') {
          if (!Array.isArray(value) || value.some(arg => typeof arg !== 'string')) throw new Error('args 须为字符串数组。')
        } else if (['env', 'headers'].includes(key)) {
          if (!mcpObject(value) || Object.values(value).some(item => typeof item !== 'string')) throw new Error(`${key} 须为字符串映射。`)
        } else if (typeof value !== 'string') throw new Error(`${key} 须为字符串。`)
        values[key] = value
      }
      return { name: name?.trim() ?? '', transport, values }
    }

    function McpListFields({ fieldName, label, values, update, pairs }) {
      const rows = values ?? []
      function change(index, column, value) {
        update(rows.map((row, i) => i === index ? row.map((part, j) => j === column ? value : part) : row))
      }
      return h('div', { className: 'dpt-edit' },
        h('span', { className: 'dpt-label' }, label),
        rows.map((row, index) => h('div', { key: index, className: 'dpt-argument-row' },
          row.map((part, column) => h('input', {
            key: column, className: 'dpt-mono', dir: 'ltr', spellCheck: false,
            'aria-label': pairs ? `${fieldName} ${index + 1} ${column ? '值' : '名称'}` : `参数 ${index + 1}`,
            placeholder: pairs ? column ? 'Bearer ${credential:MCP_TOKEN}' : '名称' : '参数',
            value: part, onChange: e => change(index, column, e.target.value),
          })),
          button('', () => update(rows.filter((_, i) => i !== index)), { icon: 'x', iconSize: 13, className: 'dpt-danger', 'aria-label': `移除${fieldName} ${index + 1}` }))),
        h('div', { className: 'dpt-actions' }, button(`添加${fieldName}`, () => update([...rows, pairs ? ['', ''] : ['']]), { icon: 'plus', iconSize: 13 })))
    }

    function McpEditor({ row, revision, close, saved }) {
      const [status, run, dismiss] = useAction()
      const [mode, setMode] = useState('form')
      const [name, setName] = useState(row?.name ?? '')
      const [transport, setTransport] = useState(row?.transport ?? 'stdio')
      const [values, setValues] = useState({})
      const [json, setJson] = useState('')
      const [modeError, setModeError] = useState('')
      const set = (key, value) => setValues(previous => ({ ...previous, [key]: value }))
      const switching = row && transport !== row.transport
      const existing = row && !switching

      function input(key, label, placeholder, type = 'text') {
        return field(label, h('input', {
          type, dir: 'ltr', className: 'dpt-mono', spellCheck: false,
          value: values[key] ?? '', placeholder, onChange: e => set(key, e.target.value), autoComplete: 'off',
        }))
      }
      function formValues() {
        const result = {}
        const listFields = transport === 'stdio' ? ['command', 'args', 'cwd', 'env'] : ['url', 'headers']
        for (const key of listFields) {
          if (!Object.hasOwn(values, key)) continue
          const value = values[key]
          if (key === 'args') result.args = value.map(([argument]) => argument)
          else if (['env', 'headers'].includes(key)) {
            const seen = new Set()
            for (const [entryName, item] of value) {
              if (!entryName.trim() || !item.trim() || seen.has(entryName.trim())) throw new Error('请填写非空且唯一的环境变量或请求头。')
              seen.add(entryName.trim())
            }
            result[key] = Object.fromEntries(value.map(([entryName, item]) => [entryName.trim(), item]))
          } else result[key] = value
        }
        return result
      }
      function readJson() {
        const draft = mcpDraft(json)
        if (row && draft.name && row.name !== draft.name) throw new Error('编辑时请保留原服务器名称。')
        return { ...draft, name: row?.name ?? draft.name }
      }
      function changeMode(next) {
        if (mode === next) return
        try {
          if (next === 'json') {
            const config = { transport, ...formValues() }
            setJson(JSON.stringify(name.trim() ? { mcpServers: { [name.trim()]: config } } : { name: '', ...config }, null, 2))
          } else {
            const draft = readJson()
            setName(draft.name); setTransport(draft.transport)
            setValues(Object.fromEntries(mcpFields.filter(key => Object.hasOwn(draft.values, key)).map(key => {
              const value = draft.values[key]
              return [key, key === 'args' ? value.map(argument => [argument]) : ['env', 'headers'].includes(key) ? Object.entries(value) : value]
            })))
          }
          dismiss(); setModeError(''); setMode(next)
        } catch (error) { setModeError(error.message) }
      }
      async function save() {
        const draft = mode === 'json' ? readJson() : { name: name.trim(), transport, values: formValues() }
        await request('mcp', { action: row ? 'edit' : 'create', revision, name: draft.name, transport: draft.transport, ...draft.values })
        saved(row ? '服务器配置已更新' : '服务器已添加（默认停用，可先测试连接再启用）')
      }
      const modeNav = h('nav', { className: 'dpt-nav', 'aria-label': 'MCP 录入方式' },
        button('表单录入', () => changeMode('form'), { 'aria-pressed': mode === 'form', disabled: status.busy }),
        button('JSON 录入', () => changeMode('json'), { 'aria-pressed': mode === 'json', disabled: status.busy }))
      return h('div', { className: 'dpt-edit' },
        h('h3', null, row ? '编辑服务器' : '新增 MCP 服务器'), modeNav,
        h('form', { className: 'dpt-form', onSubmit: e => { e.preventDefault(); void run(save) } },
          mode === 'json' ? h(React.Fragment, null,
            field('MCP JSON', h('textarea', {
              rows: 10, value: json, spellCheck: false, dir: 'ltr', className: 'dpt-mono dpt-fixed-editor',
              onChange: e => { setJson(e.target.value); setModeError('') },
            })),
            muted(h(React.Fragment, null, '支持单个服务器对象或 ', code('mcpServers'), ' 中的单项。编辑时省略的字段沿用现有值。')))
            : h(React.Fragment, null,
              h('div', { className: 'dpt-form-row' },
                field('服务器名称', h('input', { value: name, onChange: e => setName(e.target.value), disabled: Boolean(row), required: true, dir: 'ltr', className: 'dpt-mono' })),
                field('传输方式', pick('传输方式', transport, value => { setTransport(value); setValues({}) }, [option('stdio', 'stdio'), option('streamable-http', 'streamable-http')]))),
              existing && muted('未填写的字段沿用现有值。要清空现有列表，可用 JSON 提交空数组或对象。'),
              switching && muted('切换传输方式会清空原传输配置。'),
              transport === 'stdio' ? h(React.Fragment, null,
                input('command', '可执行文件', 'node 或 node.exe'), input('cwd', '启动目录（绝对路径，可选）', ''),
                h(McpListFields, { fieldName: '参数', label: '进程参数', values: values.args, update: value => set('args', value) }),
                h(McpListFields, { fieldName: '环境变量', label: '环境变量 · DSH 凭据引用', values: values.env, pairs: true, update: value => set('env', value) }))
                : h(React.Fragment, null,
                  input('url', 'MCP 地址', 'https://example.com/mcp', 'url'),
                  h(McpListFields, { fieldName: '请求头', label: '请求头 · DSH 凭据引用', values: values.headers, pairs: true, update: value => set('headers', value) }))),
          feedback(modeError, true, () => setModeError('')), feedback(status.message, status.error, dismiss),
          h('div', { className: 'dpt-actions' },
            button('取消编辑', close, { disabled: status.busy }),
            primary('保存', undefined, { type: 'submit', icon: 'check', disabled: status.busy, 'aria-busy': status.busy }))))
    }

    function Confirm({ title, removed, preserved, label, close, confirm }) {
      const [status, run, dismiss] = useAction()
      return h(Modal, { title, close },
        h('div', { className: 'dpt-form' },
          h('div', { className: 'dpt-confirm-list' }, [['将移除', removed], ['将保留', preserved]].map(([heading, items]) =>
            h('section', { key: heading }, h('h3', null, heading), h('ul', null, items.map(item => h('li', { key: item }, item)))))),
          feedback(status.message, status.error, dismiss),
          h('div', { className: 'dpt-actions' }, button('取消', close, { autoFocus: true, disabled: status.busy }),
            button(label, () => run(confirm), { icon: 'trash', className: 'dpt-danger', disabled: status.busy, 'aria-busy': status.busy }))))
    }

    function useMcpList() {
      const [view, setView] = useState(null)
      const [error, setError] = useState('')
      const [reloading, setReloading] = useState(false)
      const generation = useRef(0)
      async function refresh(signal, manual = false) {
        const current = ++generation.current
        if (manual) setReloading(true)
        try {
          const next = await request('mcp', { action: 'list' }, signal)
          if (current === generation.current && !signal?.aborted) { setView(next); setError('') }
        } catch (error) {
          if (current === generation.current && !signal?.aborted) setError(error.message)
        } finally {
          if (manual && current === generation.current) setReloading(false)
        }
      }
      useEffect(() => {
        const abort = new AbortController()
        void refresh(abort.signal)
        const timer = setInterval(() => refresh(abort.signal), 2500)
        return () => { clearInterval(timer); abort.abort(); generation.current++ }
      }, [])
      return { view, error, reloading, refresh: () => refresh(undefined, true), dismissError: () => setError('') }
    }

    function McpRow({ row, revision, refresh, removed, disclosure, onProbed, notify }) {
      const [editing, setEditing] = useState(null)
      const [removal, setRemoval] = useState(null)
      const [probedTools, setProbedTools] = useState(null)
      const [toolQuery, setToolQuery] = useState('')
      const [showAllTools, setShowAllTools] = useState(false)
      const [optimisticEnabled, setOptimisticEnabled] = useState(null)
      const [status, run, dismiss] = useAction()
      useEffect(() => { setOptimisticEnabled(null) }, [row.enabled, row.status])
      const effectiveEnabled = optimisticEnabled ?? row.enabled
      const issue = row.enabled && mcpIssues[row.status]
      const tone = issue ? 'attention' : row.status === 'connected' ? 'ready' : effectiveEnabled ? 'info' : 'idle'

      function operation(action, success, expandOnDone = false) {
        if (action === 'enable' || action === 'disable') setOptimisticEnabled(action === 'enable')
        return run(async () => {
          try {
            const result = await request('mcp', { action, name: row.name, revision })
            await refresh()
            if (action === 'probe') {
              if (!result.closed) throw new Error(`${row.name} 的探测进程未确认清理。`)
              if (!result.ok) throw new Error(`${row.name} ${result.stage === 'list' ? '工具列表读取失败' : '连接测试失败'}。`)
              const names = result.toolNames ?? []
              setProbedTools({ names, truncated: Boolean(result.truncated) })
              setToolQuery('')
              setShowAllTools(false)
              onProbed?.(row.name, names)
              if (expandOnDone && names.length > 0) disclosure.open()
              const msg = `${row.name} 测试通过 · ${result.toolCount}${result.truncated ? '+' : ''} 个工具 · ${result.durationMs} ms`
              notify(msg)
              return msg
            }
            if (success) notify(`${row.name} ${success}`)
            return `${row.name} ${success}`
          } catch (err) {
            setOptimisticEnabled(null)
            throw err
          }
        })
      }

      const allTools = probedTools?.names ?? []
      const filteredTools = toolQuery.trim() ? allTools.filter(tool => matches(toolQuery, tool)) : allTools
      const visibleTools = showAllTools ? filteredTools : filteredTools.slice(0, 24)

      const quickActions = row.testable && iconButton(
        `测试 ${row.name}`, 'play', () => operation('probe', '', true),
        { className: 'dpt-row-icon-btn', iconSize: 13, title: '测试连接', disabled: status.busy },
      )
      const alwaysActions = row.editable && h(Switch, {
        checked: effectiveEnabled,
        disabled: status.busy,
        label: `${effectiveEnabled ? '停用' : '启用'} ${row.name}`,
        onChange: next => operation(next ? 'enable' : 'disable', next ? '已启用' : '已停用'),
      })

      return h(DisclosureRow, {
        title: row.name, tag: row.transport,
        detail: [
          mcpSources[row.source],
          row.transport === 'stdio' ? '本地进程' : row.transport === 'streamable-http' ? 'HTTP 服务' : '传输未公开',
          Number.isInteger(row.toolCount) ? `${row.toolCount} 个工具` : '',
        ].filter(Boolean).join(' · '),
        badge: mcpStates[row.status] ?? '状态未知', tone,
        quickActions, alwaysActions, ...disclosure,
      },
      h('div', { className: 'dpt-drawer-bar' },
        h('div', { className: 'dpt-drawer-facts' },
          h('span', null, '来源', h('strong', null, mcpSources[row.source])),
          h('span', null, '传输', row.transport ? code(row.transport) : h('strong', null, '未公开')),
          h('span', null, '配置', h('strong', null, row.enabled ? '启用' : '停用')),
          Number.isInteger(row.toolCount) && h('span', null, '工具', h('strong', null, row.toolCount))),
        h('div', { className: 'dpt-actions' },
          row.testable && button('测试连接', () => operation('probe'), { icon: 'play', disabled: status.busy, 'aria-busy': status.busy }),
          row.reconnectable && button('重连', () => operation('restart', '已请求重连'), { icon: 'rotate-cw', disabled: status.busy }),
          row.editable && button(row.enabled ? '停用' : '启用', () => operation(row.enabled ? 'disable' : 'enable', row.enabled ? '已停用' : '已启用'), { disabled: status.busy }),
          row.editable && !editing && button('编辑', () => setEditing({ revision }), { icon: 'square-pen', disabled: status.busy }),
          row.editable && button('移除', () => setRemoval({ revision }), { icon: 'trash', className: 'dpt-danger', disabled: status.busy }))),
      allTools.length > 0 && h('div', { className: 'dpt-edit' },
        allTools.length > 12 && h('div', { className: 'dpt-drawer-bar' },
          h('span', { className: 'dpt-label' }, `探测工具（${filteredTools.length}${filteredTools.length !== allTools.length ? ` / ${allTools.length}` : ''}${probedTools.truncated ? '+' : ''}）`),
          h('div', { className: 'dpt-actions' },
            h('input', {
              type: 'search', className: 'dpt-inline-filter',
              'aria-label': `筛选 ${row.name} 工具`, placeholder: '筛选工具名…',
              value: toolQuery, onChange: e => setToolQuery(e.target.value),
              onKeyDown: e => { if (e.key === 'Escape' && toolQuery) { e.preventDefault(); setToolQuery('') } },
            }),
            filteredTools.length > 24 && button(showAllTools ? '收起列表' : `展开全部 ${filteredTools.length} 个`, () => setShowAllTools(!showAllTools)))),
        filteredTools.length > 0
          ? h('div', { className: `dpt-tool-list${showAllTools && filteredTools.length > 24 ? ' dpt-scroll-box' : ''}`, 'aria-label': '探测到的工具' },
            visibleTools.map(tool => h('code', { key: tool, className: 'dpt-mono dpt-tool-chip', dir: 'ltr' }, tool)),
            (!showAllTools && filteredTools.length > 24)
              ? h('span', { className: 'dpt-muted' }, `…其余 ${filteredTools.length - 24} 个`)
              : (probedTools.truncated && !toolQuery.trim() && h('span', { className: 'dpt-muted' }, '…')))
          : muted('没有匹配的探测工具。')),
      issue && muted(issue),
      feedback(status.error ? status.message : '', true, dismiss),
      editing && h('div', { className: 'dpt-drawer-split' }, h(McpEditor, {
        row, ...editing, close: () => setEditing(null), saved: message => {
          dismiss(); notify(message); setEditing(null); void refresh()
        },
      })),
      removal && h(Confirm, {
        title: `移除 ${row.name}`, label: '移除服务器',
        removed: [`服务器「${row.name}」的用户配置`, '此服务器的连接与会话中的工具注册'],
        preserved: ['本机可执行文件及资源', 'DSH 凭据和其他 MCP 服务器配置'],
        close: () => setRemoval(null), confirm: async () => {
          await request('mcp', { action: 'remove', name: row.name, revision: removal.revision })
          setRemoval(null); removed(row.name); await refresh()
        },
      }))
    }

    function McpPanel({ host, toast }) {
      const { view, error, reloading, refresh, dismissError } = useMcpList()
      const [query, search] = useState('')
      const [sourceFilter, setSourceFilter] = useState('all')
      const [statusFilter, setStatusFilter] = useState('all')
      const [probedByServer, setProbedByServer] = useState({})
      const [editor, setEditor] = useState(null)
      const disclosure = useDisclosure()
      const rows = (view?.servers ?? []).filter(row => row.source !== 'retired')
      const connectedCount = rows.filter(row => row.status === 'connected').length
      const issueCount = rows.filter(row => row.enabled && mcpIssues[row.status]).length
      const disabledCount = rows.filter(row => !row.enabled).length

      const filtered = rows.filter(row => {
        if (sourceFilter !== 'all' && row.source !== sourceFilter) return false
        if (statusFilter === 'connected' && row.status !== 'connected') return false
        if (statusFilter === 'issue' && !(row.enabled && mcpIssues[row.status])) return false
        if (statusFilter === 'disabled' && row.enabled) return false
        return matches(query, row.name, row.transport ?? '', mcpSources[row.source], ...(probedByServer[row.name] ?? []))
      }).sort((a, b) => (mcpSourceOrder[a.source] ?? 9) - (mcpSourceOrder[b.source] ?? 9))

      const hasActiveFilter = Boolean(query.trim()) || sourceFilter !== 'all' || statusFilter !== 'all'
      const resetFilters = () => { search(''); setSourceFilter('all'); setStatusFilter('all') }
      const scroller = useInfiniteScroll(filtered.length, `${query}\n${sourceFilter}\n${statusFilter}`, 50)
      const visibleRows = filtered.slice(0, scroller.limit)
      const openKeys = visibleRows.filter(row => disclosure.isOpen(row.name, Boolean(row.enabled && mcpIssues[row.status]))).map(row => row.name)

      return h('div', { className: 'dpt-panel' },
        feedback(host.error || (host.info?.mcp === false ? '当前 DSH 配置未加载 MCP 服务。' : ''), true, host.dismiss),
        feedback(error, true, dismissError),
        h('div', { className: 'dpt-toolbar' },
          h(Segmented, {
            label: 'MCP 状态筛选', value: statusFilter, onChange: setStatusFilter,
            items: [
              { value: 'all', label: '全部', count: view ? rows.length : null },
              { value: 'connected', label: '已连接', count: view ? connectedCount : null },
              { value: 'issue', label: '异常', count: view ? issueCount : null, alert: issueCount > 0 },
              { value: 'disabled', label: '已停用', count: view ? disabledCount : null },
            ],
          }),
          h('div', { className: 'dpt-toolbar-right' },
            rows.length > 0 && filterInput('搜索 MCP 服务器', query, search),
            rows.length > 0 && pick('MCP 来源筛选', sourceFilter, setSourceFilter, [
              option('all', '全部来源'),
              option('user', '用户配置'),
              option('inherited', '继承配置'),
              option('plugin', '插件注册'),
            ]),
            hasActiveFilter && filtered.length > 0 && button('重置筛选', resetFilters, { icon: 'x', iconSize: 13 }),
            openKeys.length >= 2 && button('收起全部', () => disclosure.collapseAll(openKeys), { icon: 'chevrons-down-up', iconSize: 13 }),
            iconButton('刷新 MCP', 'refresh-cw', refresh, { iconClass: reloading ? 'dpt-spin' : '', disabled: reloading, 'aria-busy': reloading }),
            primary('新增服务器', () => setEditor({ revision: view.revision }), { icon: 'plus', disabled: !view?.writable || Boolean(editor) }))),
        editor && h('div', { className: 'dpt-card dpt-empty' }, h(McpEditor, {
          ...editor, close: () => setEditor(null), saved: message => {
            toast.show(message); setEditor(null); void refresh()
          },
        })),
        filtered.length ? h('ul', { className: 'dpt-card' }, (() => {
          const groups = Object.entries(mcpSources).map(([source, title]) => [source, title, visibleRows.filter(row => row.source === source)]).filter(([, , items]) => items.length > 0)
          return groups.map(([source, title, group]) => h(React.Fragment, { key: source },
            groups.length > 1 && h('li', { className: 'dpt-subhead' }, title),
            group.map(row => h(McpRow, {
              key: row.name, row, revision: view.revision, refresh, notify: toast.show,
              disclosure: disclosure(row.name, Boolean(row.enabled && mcpIssues[row.status])),
              onProbed: (serverName, names) => setProbedByServer(previous => ({ ...previous, [serverName]: names })),
              removed: name => toast.show(`已移除服务器 · ${name}`),
            }))))
        })(), scroller.sentinel)
          : empty(rows.length ? '没有符合条件的 MCP 服务器。' : view ? '暂无 MCP 服务器，点击右上角「新增服务器」添加。' : error ? '服务器列表暂不可用。' : '正在读取 MCP 服务器…', rows.length && hasActiveFilter ? resetFilters : undefined))
    }

    const skillSources = { 'project-dsh': '项目 · DSH', 'project-agents': '项目 · Agents', 'user-dsh': '个人 · DSH', 'user-agents': '个人 · Agents', bundled: '内置', runtime: '插件', custom: '自定义目录' }
    const skillSourceOrder = { 'project-dsh': 1, 'project-agents': 2, 'user-dsh': 3, 'user-agents': 4, custom: 5, runtime: 6, bundled: 7 }

    function SkillPreview({ preview, initialEditing = false, close, update }) {
      const [editing, setEditing] = useState(initialEditing)
      const [showAllFiles, setShowAllFiles] = useState(false)
      const [description, setDescription] = useState(preview.description)
      const [body, setBody] = useState(preview.body)
      const [modelInvocable, model] = useState(preview.modelInvocable)
      const [userInvocable, user] = useState(preview.userInvocable)
      const [status, run, dismiss] = useAction()
      const files = preview.files ?? []
      const visibleFiles = showAllFiles ? files : files.slice(0, 8)
      return h('div', { className: 'dpt-edit' }, editing
        ? h('form', { className: 'dpt-form', onSubmit: e => { e.preventDefault(); void run(() => update({ description, body, modelInvocable, userInvocable })) } },
          field('描述', h('input', { required: true, value: description, onChange: e => setDescription(e.target.value) })),
          field('正文', h('textarea', { rows: 11, className: 'dpt-mono dpt-fixed-editor', value: body, onChange: e => setBody(e.target.value) })),
          h('div', { className: 'dpt-actions' },
            h('label', { className: 'dpt-check' }, h('input', { type: 'checkbox', checked: modelInvocable, onChange: e => model(e.target.checked) }), '允许模型调用'),
            h('label', { className: 'dpt-check' }, h('input', { type: 'checkbox', checked: userInvocable, onChange: e => user(e.target.checked) }), '允许用户手动调用')),
          feedback(status.message, status.error, dismiss),
          h('div', { className: 'dpt-actions' }, primary('保存 Skill', undefined, { type: 'submit', icon: 'check', disabled: status.busy, 'aria-busy': status.busy }),
            button('取消编辑', () => {
              setDescription(preview.description); setBody(preview.body); model(preview.modelInvocable); user(preview.userInvocable)
              dismiss()
              if (initialEditing) close()
              else setEditing(false)
            }, { disabled: status.busy })))
        : h(React.Fragment, null,
          h('div', { className: 'dpt-drawer-bar' },
            muted(h(React.Fragment, null, preview.raw ? code('SKILL.md') : 'DSH 提供的 Skill 正文',
              preview.bytes ? ` · ${formatBytes(preview.bytes)}` : '')),
            h('div', { className: 'dpt-actions' },
              preview.editable && button('编辑内容与权限', () => setEditing(true), { icon: 'square-pen' }),
              button('关闭预览', close, { icon: 'x', iconSize: 13 }))),
          preview.meta?.length > 0 && h('div', { className: 'dpt-drawer-facts' },
            preview.meta.map(entry => h('span', { key: entry.key }, entry.key, code(entry.value)))),
          h('pre', { className: 'dpt-mono', dir: 'ltr' }, preview.markdown),
          files.length > 0 && h('div', { className: 'dpt-edit' },
            h('div', { className: 'dpt-drawer-bar' },
              h('span', { className: 'dpt-label' }, `随附文件（${files.length}）`),
              files.length > 8 && button(showAllFiles ? '收起文件列表' : `展开全部 ${files.length} 个文件`, () => setShowAllFiles(!showAllFiles))),
            h('ul', { className: `dpt-file-list${showAllFiles && files.length > 8 ? ' dpt-scroll-box' : ''}` }, visibleFiles.map(file =>
              h('li', { key: file.path }, code(file.path), h('span', null, formatBytes(file.size))))))))
    }

    function SkillImport({ workspace, navigation, close, save }) {
      const [directory, setDirectory] = useState('')
      const [destination, setDestination] = useState(workspace ? 'project' : 'personal')
      const [status, run, dismiss] = useAction()
      return h('div', { className: 'dpt-edit' }, h('h3', null, '导入本地 Skill'),
        h('form', { className: 'dpt-form', onSubmit: e => { e.preventDefault(); void run(() => save({ directory: directory.trim(), destination })) } },
          field('来源目录（包含 SKILL.md）', h('input', { required: true, autoFocus: true, value: directory, onChange: e => setDirectory(e.target.value), dir: 'ltr', className: 'dpt-mono' })),
          h('div', { className: 'dpt-actions' },
            button('选择本地目录', () => run(async () => { const dir = await navigation.pickDirectory(); if (dir) setDirectory(dir) }), { icon: 'folder', disabled: status.busy })),
          field('导入位置', pick('导入位置', destination, setDestination, [workspace && option('project', '当前项目'), option('personal', '个人 DSH')].filter(Boolean))),
          feedback(status.message, status.error, dismiss),
          h('div', { className: 'dpt-actions' }, button('取消', close, { disabled: status.busy }),
            primary('导入', undefined, { type: 'submit', icon: 'folder-plus', disabled: status.busy, 'aria-busy': status.busy }))))
    }

    function SkillRow({ row, scope, disclosure, refresh, removed, notify }) {
      const [preview, setPreview] = useState(null)
      const [startInEdit, setStartInEdit] = useState(false)
      const [removal, setRemoval] = useState(false)
      const [optimisticPerm, setOptimisticPerm] = useState(null)
      const [status, run, dismiss] = useAction()
      useEffect(() => { setOptimisticPerm(null) }, [row.modelInvocable, row.userInvocable])
      const modelChecked = optimisticPerm ? optimisticPerm.model : row.modelInvocable
      const userChecked = optimisticPerm ? optimisticPerm.user : row.userInvocable

      async function load() {
        return request('skills', { ...scope, action: 'preview', name: row.name })
      }

      async function openMode(editMode) {
        await run(async () => {
          const current = await load()
          setStartInEdit(editMode)
          setPreview(current)
          disclosure.open()
        })
      }

      async function quickTogglePermission(nextModel, nextUser) {
        setOptimisticPerm({ model: nextModel, user: nextUser })
        await run(async () => {
          try {
            const current = await load()
            await request('skills', {
              ...scope, action: 'edit', name: row.name, revision: current.revision,
              description: current.description, body: current.body,
              modelInvocable: nextModel, userInvocable: nextUser,
            })
            if (preview) setPreview(await load())
            notify(`${row.name} 调用权限已更新`)
            await refresh()
          } catch (err) {
            setOptimisticPerm(null)
            throw err
          }
        })
      }

      const restrictionChips = (!modelChecked || !userChecked) && h(React.Fragment, null,
        !modelChecked && pill('模型停用', 'attention'),
        !userChecked && pill('手动停用'))

      const quickActions = h(React.Fragment, null,
        iconButton(`快速预览 ${row.name}`, 'eye', () => openMode(false), { className: 'dpt-row-icon-btn', iconSize: 13, title: '预览 SKILL.md', disabled: status.busy }),
        row.editable && iconButton(`快速编辑 ${row.name}`, 'square-pen', () => openMode(true), { className: 'dpt-row-icon-btn', iconSize: 13, title: '编辑内容与权限', disabled: status.busy }))

      return h(DisclosureRow, {
        title: row.name, chips: restrictionChips, detail: row.description,
        badge: row.editable ? '可编辑' : '只读', tone: row.editable ? 'ready' : 'idle',
        quickActions, ...disclosure,
      },
      h('div', { className: 'dpt-drawer-bar' },
        h('div', { className: 'dpt-drawer-facts' },
          h('span', null, '来源', h('strong', null, skillSources[row.source] ?? `插件 · ${row.source}`)),
          row.editable
            ? h(React.Fragment, null,
              h('label', { className: 'dpt-check' },
                h('input', {
                  type: 'checkbox', checked: modelChecked, disabled: status.busy,
                  onChange: e => quickTogglePermission(e.target.checked, userChecked),
                }), '模型调用'),
              h('label', { className: 'dpt-check' },
                h('input', {
                  type: 'checkbox', checked: userChecked, disabled: status.busy,
                  onChange: e => quickTogglePermission(modelChecked, e.target.checked),
                }), '手动调用'))
            : h('span', null, '权限', h('strong', null, `模型${row.modelInvocable ? '可调用' : '停用'} · 手动${row.userInvocable ? '可调用' : '停用'}`))),
        h('div', { className: 'dpt-actions' },
          !preview && button('预览', () => openMode(false), { icon: 'eye', disabled: status.busy, 'aria-label': `预览 ${row.name}` }),
          !preview && row.editable && button('编辑', () => openMode(true), { icon: 'square-pen', disabled: status.busy }),
          row.editable && button('移除', () => run(async () => {
            const current = await load()
            setStartInEdit(false); setPreview(current); setRemoval(true)
          }), { icon: 'trash', className: 'dpt-danger', disabled: status.busy }))),
      feedback(status.error ? status.message : '', true, dismiss),
      preview && h('div', { className: 'dpt-drawer-split' }, h(SkillPreview, {
        key: `${preview.revision ?? preview.name}:${startInEdit}`, preview, initialEditing: startInEdit,
        close: () => { setPreview(null); setStartInEdit(false) },
        update: async fields => {
          await request('skills', { ...scope, action: 'edit', ...fields, name: row.name, revision: preview.revision })
          setPreview(null); setStartInEdit(false); notify('Skill 已更新'); await refresh()
        },
      })),
      preview && removal && h(Confirm, {
        title: `移除 ${row.name}`, label: '移除 Skill',
        removed: [`DSH 扫描目录中的 ${row.name}`],
        preserved: ['恢复目录中的 SKILL.md 和随附文件', '导入来源中的原始文件以及其他 Skill'],
        close: () => setRemoval(false), confirm: async () => {
          const result = await request('skills', { ...scope, action: 'remove', name: row.name, revision: preview.revision, confirm: row.name })
          setRemoval(false); removed(result.recovery); await refresh()
        },
      }))
    }

    function RepositorySkill({ repository, skill, scope, destination, installed, onInstall }) {
      const [preview, setPreview] = useState('')
      const [status, run, dismiss] = useAction()
      const selection = { ...scope, repositoryId: repository.id, commit: repository.commit, skillId: skill.id }
      return h('li', { className: 'dpt-repo-skill' },
        h('div', { className: 'dpt-drawer-bar' },
          h('div', { className: 'dpt-row-title' }, h('strong', { className: 'dpt-ellipsis' }, skill.name),
            installed && pill('已安装')),
          h('div', { className: 'dpt-actions' },
            button(preview ? '关闭预览' : '预览 Skill', () => preview ? setPreview('') : run(async () => {
              const result = await request('skills', { ...selection, action: 'repository-preview' })
              setPreview(result.markdown)
            }), { icon: preview ? 'x' : 'eye', disabled: status.busy, 'aria-label': preview ? '关闭预览' : `预览 Skill ${skill.name}` }),
            button('安装', () => run(async () => {
              const result = await request('skills', { ...selection, action: 'repository-install', destination })
              await onInstall(result.name)
            }), { icon: 'download', disabled: installed || status.busy, 'aria-busy': status.busy, 'aria-label': `安装 ${skill.name}` }))),
        muted(skill.description),
        preview && h('pre', { className: 'dpt-mono', dir: 'ltr' }, preview),
        feedback(status.error ? status.message : '', true, dismiss))
    }

    function RepositoryRow({ repository, scope, destination, installed, disclosure, query, installFilter = 'all', update, remove, onInstall, notify }) {
      const [removal, setRemoval] = useState(false)
      const [status, run, dismiss] = useAction()
      const skills = repository.skills.filter(skill => {
        const isInstalled = installed.has(skill.name)
        if (installFilter === 'available' && isInstalled) return false
        if (installFilter === 'installed' && !isInstalled) return false
        return matches(query, skill.name, skill.description)
      })
      const hasRepoFilter = Boolean(query.trim()) || installFilter !== 'all'
      const scroller = useInfiniteScroll(skills.length, `${query}\n${installFilter}`, 35)
      const visibleSkills = skills.slice(0, scroller.limit)
      return h(DisclosureRow, {
        title: repository.name,
        detail: hasRepoFilter
          ? `匹配 ${skills.length} / ${repository.skills.length} 个 Skill`
          : `${repository.skills.length} 个可安装 Skill`,
        badge: '已同步', tone: 'ready', ...disclosure,
      },
      h('div', { className: 'dpt-drawer-bar' },
        h('div', { className: 'dpt-drawer-facts' },
          h('span', null, '来源', h('a', { href: repository.url, target: '_blank', rel: 'noreferrer' }, 'GitHub ↗')),
          h('span', null, '同步时间', h('strong', null, new Date(repository.checkedAt).toLocaleString()))),
        h('div', { className: 'dpt-actions' },
          button('刷新仓库', () => run(async () => {
            const result = await request('skills', { action: 'repository-refresh', repositoryId: repository.id })
            update(result.repository)
            notify('仓库已同步更新')
          }), { icon: 'refresh-cw', disabled: status.busy, 'aria-busy': status.busy }),
          button('移除仓库', () => setRemoval(true), { icon: 'trash', className: 'dpt-danger', disabled: status.busy }))),
      h(PathLine, { value: repository.commit, label: '提交哈希' }),
      feedback(status.error ? status.message : '', true, dismiss),
      skills.length ? h('ul', { className: `dpt-repo-skills${visibleSkills.length > 10 ? ' dpt-repo-scroll' : ''}`, 'aria-label': '仓库 Skill' },
        visibleSkills.map(skill => h(RepositorySkill, {
          key: `${repository.commit}:${skill.id}:${destination}`, repository,
          skill, scope, destination, installed: installed.has(skill.name), onInstall,
        })),
        scroller.sentinel) :
        muted(hasRepoFilter ? '仓库中没有符合筛选条件的 Skill。' : '仓库中未发现 Skill。'),
      removal && h(Confirm, {
        title: `移除仓库 ${repository.name}`, label: '确认移除仓库',
        removed: ['工具箱中的来源记录与下载缓存'], preserved: ['已安装的 Skill 和 GitHub 仓库'],
        close: () => setRemoval(false), confirm: async () => {
          await request('skills', { action: 'repository-remove', repositoryId: repository.id, confirm: repository.id })
          remove(repository.id)
        },
      }))
    }

    function SkillRepositoryPanel({ scope, installedRows, onInstall, onRemove, notify }) {
      const [repositories, setRepositories] = useState(null)
      const [url, setUrl] = useState('')
      const [query, search] = useState('')
      const [installFilter, setInstallFilter] = useState('all')
      const [destination, setDestination] = useState(scope.workspaceId ? 'project' : 'personal')
      const [status, run, dismiss] = useAction()
      const [failure, setFailure] = useState('')
      const [added, setAdded] = useState(null)
      const disclosure = useDisclosure()
      useEffect(() => {
        const abort = new AbortController()
        request('skills', { action: 'repository-list' }, abort.signal).then(
          value => { if (!abort.signal.aborted) setRepositories(value.repositories) },
          error => { if (!abort.signal.aborted) setFailure(error.message) },
        )
        return () => abort.abort()
      }, [])
      const installed = new Set(installedRows?.map(skill => skill.name))
      const hasRepoFilter = Boolean(query.trim()) || installFilter !== 'all'
      async function add() {
        const { repository } = await request('skills', { action: 'repository-add', url: url.trim() })
        setRepositories(previous => [...(previous ?? []), repository])
        setAdded(repository.id); setUrl(''); setFailure('')
        notify(`已添加仓库 ${repository.name}`)
      }
      return h(PanelSection, { title: 'Skill 仓库', summary: repositories && `${repositories.length} 个仓库` },
        h('div', { className: 'dpt-card dpt-empty dpt-edit' },
          h('form', { className: 'dpt-form', onSubmit: e => { e.preventDefault(); void run(add) } },
            field('GitHub 仓库地址', h('input', {
              type: 'url', value: url, dir: 'ltr', className: 'dpt-mono',
              placeholder: 'https://github.com/owner/repo', required: true, onChange: e => setUrl(e.target.value),
            })),
            h('div', { className: 'dpt-actions' },
              button('添加仓库', undefined, { type: 'submit', icon: 'plus', disabled: status.busy, 'aria-busy': status.busy }))),
          feedback(failure, true, () => setFailure('')), feedback(status.error ? status.message : '', true, dismiss)),
        repositories?.length > 0 && h(React.Fragment, null,
          h('div', { className: 'dpt-bar' }, filterInput('搜索仓库 Skill', query, search),
            pick('仓库安装状态', installFilter, setInstallFilter, [
              option('all', '全部状态'),
              option('available', '仅未安装'),
              option('installed', '已安装'),
            ]),
            pick('仓库 Skill 安装位置', destination, setDestination, [scope.workspaceId && option('project', '当前项目'), option('personal', '个人 DSH')].filter(Boolean)),
            hasRepoFilter && button('重置筛选', () => { search(''); setInstallFilter('all') }, { icon: 'x', iconSize: 13 })),
          h('ul', { className: 'dpt-card' }, repositories.map(repository => h(RepositoryRow, {
            key: repository.id,
            repository, query, installFilter, scope, destination, installed, notify,
            disclosure: disclosure(repository.id, added === repository.id),
            update: refreshed => setRepositories(previous => previous.map(item => item.id === refreshed.id ? refreshed : item)),
            remove: id => {
              setRepositories(previous => previous.filter(item => item.id !== id))
              onRemove()
            },
            onInstall,
          })))),
        (!repositories || !repositories.length) && empty(repositories ? '尚未添加 Skill 仓库。' : failure ? '仓库列表暂不可用。' : '正在读取 Skill 仓库…'))
    }

    function SkillsPanel({ workspaceList, sessionList, navigation, host, toast }) {
      const main = Object.values(sessionList.byId).find(item => item.retainedBy?.mainView > 0)
      const current = workspaceList.items.find(item => item.sessionIds.includes(main?.id) || item.path === main?.cwd)
      const [override, setWorkspace] = useState(null)
      const workspace = override ?? current?.workspaceId ?? ''
      const [query, search] = useState('')
      const [sourceFilter, setSourceFilter] = useState('all')
      const [permFilter, setPermFilter] = useState('all')
      const [rows, setRows] = useState(null)
      const [error, setError] = useState('')
      const [reloading, setReloading] = useState(false)
      const [importing, setImporting] = useState(false)
      const [library, setLibrary] = useState(false)
      const disclosure = useDisclosure()
      const scope = { workspaceId: workspace, sessionId: main?.id }
      const generation = useRef(0)
      async function refresh(signal, manual = false) {
        const currentGen = ++generation.current
        if (manual) setReloading(true)
        try {
          const { skills } = await request('skills', { ...scope, action: 'list' }, signal)
          if (generation.current === currentGen && !signal?.aborted) { setRows(skills); setError('') }
        } catch (error) {
          if (generation.current === currentGen && !signal?.aborted) setError(error.message)
        } finally {
          if (manual && generation.current === currentGen) setReloading(false)
        }
      }
      useEffect(() => {
        const abort = new AbortController()
        setRows(null)
        setImporting(false)
        setError('')
        void refresh(abort.signal)
        return () => { generation.current++; abort.abort() }
      }, [workspace, main?.id])

      const allRows = rows ?? []
      const editableCount = allRows.filter(row => row.editable).length
      const projectCount = allRows.filter(row => row.source?.startsWith('project-')).length
      const personalCount = allRows.filter(row => row.source?.startsWith('user-')).length
      const builtinPluginCount = allRows.filter(row => row.source === 'bundled' || row.source === 'runtime' || row.source === 'custom').length

      const shown = allRows.filter(row => {
        if (sourceFilter === 'editable' && !row.editable) return false
        if (sourceFilter === 'project' && !row.source?.startsWith('project-')) return false
        if (sourceFilter === 'personal' && !row.source?.startsWith('user-')) return false
        if (sourceFilter === 'readonly' && !(row.source === 'bundled' || row.source === 'runtime' || row.source === 'custom')) return false
        if (permFilter === 'model' && !row.modelInvocable) return false
        if (permFilter === 'user' && !row.userInvocable) return false
        if (permFilter === 'restricted' && row.modelInvocable && row.userInvocable) return false
        return matches(query, row.name, row.description, skillSources[row.source] ?? '')
      }).sort((a, b) => (skillSourceOrder[a.source] ?? 6) - (skillSourceOrder[b.source] ?? 6))

      const hasActiveFilter = Boolean(query.trim()) || sourceFilter !== 'all' || permFilter !== 'all'
      const resetFilters = () => { search(''); setSourceFilter('all'); setPermFilter('all') }
      const scroller = useInfiniteScroll(shown.length, `${workspace}\n${query}\n${sourceFilter}\n${permFilter}`, 50)
      const visibleRows = shown.slice(0, scroller.limit)
      const openKeys = visibleRows.filter(row => disclosure.isOpen(row.name)).map(row => row.name)

      const groups = new Map()
      for (const row of visibleRows) {
        const title = skillSources[row.source] ?? '插件'
        if (!groups.has(title)) groups.set(title, [])
        groups.get(title).push(row)
      }

      return h('div', { className: 'dpt-panel' },
        feedback(host.error || (host.info?.skills === false ? '当前 DSH 配置未加载 Skill 服务。' : ''), true, host.dismiss),
        feedback(error, true, () => setError('')),
        h('div', { className: 'dpt-toolbar' },
          h(Segmented, {
            label: 'Skill 来源筛选', value: sourceFilter, onChange: setSourceFilter,
            items: [
              { value: 'all', label: '全部', count: rows ? allRows.length : null },
              { value: 'editable', label: '可编辑', count: rows ? editableCount : null },
              ...(projectCount > 0 ? [{ value: 'project', label: '项目', count: projectCount }] : []),
              ...(personalCount > 0 ? [{ value: 'personal', label: '个人', count: personalCount }] : []),
              { value: 'readonly', label: '只读', count: rows ? builtinPluginCount : null },
            ],
          }),
          h('div', { className: 'dpt-toolbar-right' },
            filterInput('搜索 Skill', query, search),
            pick('调用权限', permFilter, setPermFilter, [
              option('all', '全部权限'),
              option('model', '模型可调用'),
              option('user', '手动可调用'),
              option('restricted', '含停用限制'),
            ]),
            pick('Skill 工作区', workspace, setWorkspace, [
              option('', '个人与全局'),
              ...workspaceList.items.map(item => option(item.workspaceId, workspaceTitle(item))),
            ]),
            hasActiveFilter && shown.length > 0 && button('重置筛选', resetFilters, { icon: 'x', iconSize: 13 }),
            openKeys.length >= 2 && button('收起全部', () => disclosure.collapseAll(openKeys), { icon: 'chevrons-down-up', iconSize: 13 }),
            iconButton('刷新 Skill', 'refresh-cw', () => refresh(undefined, true), { iconClass: reloading ? 'dpt-spin' : '', disabled: reloading, 'aria-busy': reloading }),
            button('仓库管理', () => setLibrary(!library), { icon: 'git-branch', 'aria-expanded': library }),
            primary('导入 Skill', () => setImporting(true), { icon: 'folder-plus', disabled: !rows || importing }))),
        library && h(SkillRepositoryPanel, {
          key: workspace, scope, installedRows: rows, notify: toast.show,
          onInstall: async name => { toast.show(`已从仓库安装 ${name}`); await refresh() },
          onRemove: () => toast.show('仓库已移除，已安装的 Skill 已保留'),
        }),
        importing && h('div', { className: 'dpt-card dpt-empty' }, h(SkillImport, {
          workspace, navigation, close: () => setImporting(false), save: async payload => {
            const result = await request('skills', { ...scope, action: 'import', ...payload })
            setImporting(false); toast.show(`已导入 ${result.name}`); await refresh()
          },
        })),
        shown.length ? h('ul', { className: 'dpt-card' }, [...groups].map(([title, group]) =>
          h(React.Fragment, { key: title }, groups.size > 1 && h('li', { className: 'dpt-subhead' }, title),
            group.map(row => h(SkillRow, {
              key: `${workspace}:${main?.id}:${row.name}`, row, scope, notify: toast.show,
              refresh: () => refresh(),
              disclosure: disclosure(row.name),
              removed: value => toast.show(h(React.Fragment, null,
                h('p', null, `已移除 ${row.name} 至恢复目录`),
                h(PathLine, { value, label: '恢复目录' })), { sticky: true }),
            })))), scroller.sentinel)
          : empty(rows ? '没有符合条件的 Skill。' : error ? 'Skill 列表暂不可用。' : '正在发现 Skill…', rows && hasActiveFilter ? resetFilters : undefined))
    }

    function PowerToolsHelp({ host, tab, embedded }) {
      const disclosure = useDisclosure()
      const status = enabled => enabled === undefined ? '等待检查' : enabled ? '可用' : '不可用'
      const usage = {
        sessions: '悬停会话行可直接打开、归档或删除；行首勾选（支持 Shift 连选）呼出底部悬浮批量操作条。',
        mcp: '行尾开关可一键启停用户配置的服务器；点击行查看探测工具列表与连接详情。',
        skills: h(React.Fragment, null, '可编辑的项目与个人 Skill 置顶展示，展开行可直接切换模型/手动调用开关。'),
      }
      return h('ul', { className: 'dpt-card dpt-maintenance', 'aria-label': '使用与诊断' },
        h(DisclosureRow, {
          title: '使用与诊断',
          tag: host.info?.version ? `v${host.info.version}` : undefined,
          ...disclosure('help'),
        },
        muted(usage[tab]),
        facts([['插件版本', host.info?.version ? code(host.info.version) : '—'],
          ['MCP 管理', status(host.info?.mcp)], ['Skill 管理', status(host.info?.skills)],
          ['提示词增强', status(host.info?.enhance)], ['会话清理', status(host.info?.sessionDelete)]]),
        host.info?.profilePath && h('div', { className: 'dpt-drawer-split' },
          h('h3', null, 'Profile 配置'), h(PathLine, { value: host.info.profilePath })),
        embedded && h('div', { className: 'dpt-drawer-split' },
          h('h3', null, '会话与工作区偏好'), muted('工具箱尚无已保存的覆盖规则。')),
        h('div', { className: 'dpt-actions' }, button('重新检查宿主', host.check, { icon: 'refresh-cw', disabled: host.loading, 'aria-busy': host.loading }))))
    }

    function PowerTools({ useSessions, useWorkspaces, navigation, refresh, embedded = false }) {
      const [tab, select] = useState('sessions')
      const sessionList = useSessions(identity)
      const workspaceList = useWorkspaces(identity)
      const host = useHostStatus()
      const toast = useToast()
      const controls = h('div', { className: 'dpt-controls' },
        h('nav', { className: 'dpt-nav', 'aria-label': '工具箱功能' },
          [['sessions', '会话', 'message-square'], ['mcp', 'MCP', 'plug'], ['skills', 'Skill', 'wand-sparkles']].map(([id, label, icon]) =>
            button(label, () => select(id), { key: id, icon, className: 'dpt-tab', 'aria-pressed': tab === id }))),
        tab === 'sessions' ? h(SessionPanel, { sessionList, workspaceList, navigation, refresh, host, toast })
          : tab === 'mcp' ? h(McpPanel, { host, toast }) : h(SkillsPanel, { sessionList, workspaceList, navigation, host, toast }),
        h(PowerToolsHelp, { host, tab, embedded }),
        toast.node)
      const stylesheet = h('style', null, css)
      if (embedded) return h('div', { className: 'dpt dpt-inline' }, stylesheet, controls)
      return h('main', { className: 'dpt dpt-page' }, stylesheet, h('div', { className: 'dpt-page-inner' },
        h('header', { className: 'dpt-page-head' },
          h('div', { className: 'dpt-page-icon' }, h(PowerToolsIcon, { size: 18 })), h('h1', null, '工具箱')),
        controls))
    }

    function PowerToolsConfig(props) {
      return props.view === 'page' ? h(PowerTools, { ...props, embedded: true }) : null
    }

    function Enhance({ useInput, inputActions, sessionId }) {
      const input = useInput(identity)
      const [requesting, setRequesting] = useState(false)
      const [undo, setUndo] = useState(null)
      const [error, setError] = useState('')
      const [sendClass, setSendClass] = useState('')
      const pending = useRef(null)
      const rootRef = useRef(null)
      const draft = input?.draft ?? ''
      const plain = input?.phase === 'plain' && !input?.occurrences?.length
      const allowed = plain && draft.trim() && !/^\s*\/\S/.test(draft) && typeof inputActions?.insertText === 'function'

      useLayoutEffect(() => {
        const root = rootRef.current
        const card = root.closest('[data-composer-card]')
        // The host marks the primary action with aria-busy on both release lines.
        const primaryButton = ':scope > button[aria-busy]:not(.dpt-composer-action)'
        let toolbar = root.parentElement
        while (toolbar && toolbar !== card && !toolbar.querySelector(primaryButton)) toolbar = toolbar.parentElement
        if (!toolbar || toolbar === card) return
        const sync = () => setSendClass(toolbar.querySelector(primaryButton)?.className ?? '')
        const observer = new MutationObserver(sync)
        observer.observe(toolbar, { childList: true })
        sync()
        return () => observer.disconnect()
      }, [])

      useEffect(() => () => { pending.current?.abort(); pending.current = null }, [sessionId])
      useEffect(() => { setError('') }, [input?.draftRev, sessionId])
      useEffect(() => {
        if (pending.current && (pending.current.revision !== input?.draftRev || !plain || pending.current.sessionId !== sessionId)) {
          pending.current.abort(); pending.current = null; setRequesting(false)
        }
        if (undo && (undo.revision !== input?.draftRev || !plain || undo.sessionId !== sessionId)) setUndo(null)
      }, [input?.draftRev, plain, sessionId, undo])

      function focusComposer() {
        const card = rootRef.current?.closest('[data-composer-card]')
        const editor = card?.querySelector('[contenteditable="true"][role="textbox"]')
        if (editor instanceof HTMLElement) editor.focus()
      }

      async function enhance() {
        if (!allowed || pending.current) return
        const controller = new AbortController()
        const revision = inputActions.captureInsertion().draftRev
        if (revision !== input.draftRev) return
        const active = { revision, sessionId, abort: () => controller.abort() }
        pending.current = active
        setError(''); setRequesting(true)
        try {
          const result = await request('enhance', { draft, sessionId }, AbortSignal.any([controller.signal, AbortSignal.timeout(48_000)]))
          if (pending.current === active && inputActions.captureInsertion().draftRev === revision) {
            if (inputActions.insertText(result.text, { start: 0, end: draft.length, draftRev: revision })) {
              const nextRev = inputActions.captureInsertion().draftRev
              setUndo({
                sessionId, revision: nextRev, original: draft, enhanced: result.text,
                model: result.model, contextTurns: result.contextTurns ?? 0,
              })
              focusComposer()
            } else setError('草稿已变化，请重新增强。')
          }
        } catch (error) {
          if (pending.current === active && !controller.signal.aborted) setError(error.message)
        } finally {
          if (pending.current === active) { pending.current = null; setRequesting(false) }
        }
      }

      function revert() {
        if (!undo || undo.sessionId !== sessionId) return
        if (plain && undo.revision === inputActions.captureInsertion().draftRev && draft === undo.enhanced) {
          inputActions.insertText(undo.original, { start: 0, end: undo.enhanced.length, draftRev: undo.revision })
          focusComposer()
        }
        setUndo(null)
      }

      const keepFocus = e => e.preventDefault()
      const actionClass = 'dpt-composer-action ' + (sendClass || 'dpt-composer-action--fallback')

      return h('div', { ref: rootRef, className: 'dpt dpt-composer' }, h('style', null, css),
        feedback(error, true, () => setError('')),
        undo && h('button', {
          type: 'button', className: actionClass + ' dpt-composer-undo', 'aria-label': '撤销增强',
          title: undo.model
            ? `撤销增强（已由 ${undo.model} 改写${undo.contextTurns > 0 ? `，参考最近 ${undo.contextTurns} 条上下文` : ''}）`
            : '撤销增强',
          onMouseDown: keepFocus, onClick: revert,
        }, h(Icon, { name: 'undo', size: 16 })),
        requesting
          ? h('button', {
            type: 'button', className: actionClass, 'aria-label': '取消增强', title: '取消增强',
            'aria-busy': true, onMouseDown: keepFocus,
            onClick: () => { pending.current?.abort(); pending.current = null; setRequesting(false) },
          }, h(Icon, { name: 'loader', size: 16, className: 'dpt-spin' }))
          : h('button', {
            type: 'button', className: actionClass, 'aria-label': '增强',
            title: '使用当前主对话模型结合近期上下文改写草稿', disabled: !allowed,
            onMouseDown: keepFocus, onClick: enhance,
          }, h(Icon, { name: 'enhance', size: 16 })))
    }

    function EnhanceSlot(props) {
      if (!props.useInput || !props.inputActions || !props.sessionId) return null
      return h(Enhance, { key: props.sessionId, ...props })
    }

    function PowerToolsIcon({ size = 16 }) {
      return h(Icon, { name: 'layout-grid', size })
    }

    return {
      inject: ['slots', 'uiWorkspace', 'sessions'],
      apply(ctx) {
        const panelProps = () => ({ navigation: ctx.uiWorkspace, refresh: () => ctx.sessions.refresh() })
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL, inject: panelProps }, PowerTools))
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({ name: 'plugins.bundle.config', key: PANEL, inject: panelProps }, PowerToolsConfig))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL, order: 20, label: '工具箱' }, PowerToolsIcon))
        ctx.slots.inject('conversation.input.activity', () => ctx.slots.register({
          name: 'conversation.input.activity', id: PANEL, order: 15,
          inject: sessionId => ({ sessionId }),
        }, EnhanceSlot))
      },
    }
  },
})

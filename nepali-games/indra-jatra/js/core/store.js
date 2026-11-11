// Progress, kept in localStorage. Works (without saving) when storage is blocked.
const KEY = 'indra-jatra-v2';
export const save = { lang: 'ne', mute: false, best: {}, done: {}, notes: [], memory: null, lucky: false };
try {
  const old = JSON.parse(localStorage.getItem('indra-jatra-v1') || 'null');
  const cur = JSON.parse(localStorage.getItem(KEY) || 'null');
  Object.assign(save, old ? { lang: old.lang, mute: old.mute, notes: old.notes || [] } : {}, cur || {});
} catch (e) { /* storage blocked: play without saving */ }

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* storage blocked */ }
}

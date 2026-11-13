// One drawn icon family for the game tiles: 24 grid, round caps, painted in currentColor.
const ICONS = {
  memory: '<rect x="2.5" y="6" width="11" height="15" rx="2.2" transform="rotate(-8 8 13.5)"/><rect x="10.5" y="3" width="11" height="15" rx="2.2" transform="rotate(7 16 10.5)"/><circle cx="16" cy="10.5" r="2.2"/>',
  pool: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="M7.5 7.2a6.5 6.5 0 0 1 3-1.8"/>',
  guess: '<circle cx="9.5" cy="9" r="4.2"/><path d="M2.5 21c.8-4.2 3.6-6.4 7-6.4s6.2 2.2 7 6.4"/><path d="M16.5 3.6a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1.1.8-1.1 1.6v.6"/><path d="M18.8 11.2v.1"/>',
  reversi: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="3"/><circle cx="15" cy="15" r="3"/><circle cx="15" cy="9" r="3" fill="currentColor"/><circle cx="9" cy="15" r="3" fill="currentColor"/>',
  four: '<rect x="2.5" y="3.5" width="19" height="17" rx="3"/><circle cx="8" cy="9" r="1.9"/><circle cx="12" cy="9" r="1.9"/><circle cx="16" cy="9" r="1.9"/><circle cx="8" cy="15" r="1.9"/><circle cx="12" cy="15" r="1.9"/><circle cx="16" cy="15" r="1.9"/>',
  dots: '<path d="M5 5h7v7H5z"/><path d="M12 12h7"/><circle cx="5" cy="5" r=".4"/><circle cx="12" cy="5" r=".4"/><circle cx="19" cy="5" r=".4"/><circle cx="5" cy="12" r=".4"/><circle cx="12" cy="12" r=".4"/><circle cx="19" cy="12" r=".4"/><circle cx="5" cy="19" r=".4"/><circle cx="12" cy="19" r=".4"/><circle cx="19" cy="19" r=".4"/>',
  sea: '<path d="M2 19c2 1.6 4 1.6 6 0 2 1.6 4 1.6 6 0 2 1.6 4 1.6 6 0"/><path d="M4.5 14.5h15l-2.5 3H7z"/><path d="M12 3.5v11"/><path d="M12 4.5l5.5 3-5.5 2.6"/>',
  mancala: '<rect x="2" y="7" width="20" height="10" rx="5"/><ellipse cx="5.6" cy="12" rx="1.6" ry="3"/><ellipse cx="18.4" cy="12" rx="1.6" ry="3"/><circle cx="9.6" cy="10" r="1.3"/><circle cx="14.4" cy="10" r="1.3"/><circle cx="9.6" cy="14" r="1.3"/><circle cx="14.4" cy="14" r="1.3"/>',
  stack: '<path d="M3 21h18"/><rect x="5" y="14" width="14" height="7" rx="3"/><rect x="7.5" y="8" width="10" height="6" rx="3" transform="rotate(-8 12.5 11)"/><circle cx="12" cy="5" r="2.6"/>',
};

export const icon = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id] || ''}</svg>`;

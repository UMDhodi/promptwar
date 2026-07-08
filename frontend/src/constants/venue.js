/**
 * @file venue.js
 * @description Single source of truth for all venue-wide constants.
 * Imported by VenueMap, useGemini, useFirestore, and WaitTimeDashboard
 * so that facility IDs, positions, and zone paths are never duplicated.
 */

// ─── Facility category keys ────────────────────────────────────────────────
export const FACILITY_TYPES = /** @type {const} */ ({
  GATES:       'Gates',
  CONCESSIONS: 'Concessions',
  RESTROOMS:   'Restrooms',
  MEDICAL:     'Medical',
  PARKING:     'Parking',
});

// ─── Zone IDs ──────────────────────────────────────────────────────────────
export const ZONE = /** @type {const} */ ({
  NORTH:     'Z1',
  SOUTH:     'Z2',
  EAST:      'Z3',
  WEST:      'Z4',
  CONCOURSE: 'Z5',
});

// ─── Fixed pixel positions for each facility type on a 900×900 canvas ──────
export const POSITIONS = /** @type {Record<string, Array<{x:number,y:number}>>} */ ({
  [FACILITY_TYPES.GATES]:       [{ x: 450, y: 55  }, { x: 450, y: 845 }, { x: 855, y: 450 }, { x: 45,  y: 450 }],
  [FACILITY_TYPES.CONCESSIONS]: [{ x: 360, y: 175 }, { x: 450, y: 755 }, { x: 720, y: 360 }, { x: 180, y: 540 }],
  [FACILITY_TYPES.RESTROOMS]:   [{ x: 540, y: 175 }, { x: 558, y: 795 }, { x: 720, y: 540 }, { x: 180, y: 360 }],
  [FACILITY_TYPES.MEDICAL]:     [{ x: 760, y: 140 }, { x: 225, y: 770 }],
  [FACILITY_TYPES.PARKING]:     [{ x: 760, y: 35  }, { x: 140, y: 862 }],
});

/** User's default seat position on the 900×900 canvas */
export const USER_POS = { x: 450, y: 790 };

// ─── Heatmap hot-spot centres per zone ────────────────────────────────────
export const ZONE_HOTSPOTS = /** @type {Record<string, Array<{x:number,y:number}>>} */ ({
  [ZONE.NORTH]:     [{ x: 450, y: 120 }, { x: 390, y: 100 }, { x: 510, y: 100 }],
  [ZONE.SOUTH]:     [{ x: 450, y: 775 }, { x: 395, y: 790 }, { x: 505, y: 790 }],
  [ZONE.EAST]:      [{ x: 780, y: 450 }, { x: 790, y: 395 }, { x: 790, y: 505 }],
  [ZONE.WEST]:      [{ x: 120, y: 450 }, { x: 110, y: 395 }, { x: 110, y: 505 }],
  [ZONE.CONCOURSE]: [{ x: 450, y: 450 }],
});

// ─── SVG path data for zone density overlays (900×900 viewBox) ────────────
export const ZONE_PATHS = /** @type {Record<string, string>} */ ({
  [ZONE.NORTH]: 'M 250 50 Q 450 20 650 50 L 620 200 Q 450 175 280 200 Z',
  [ZONE.SOUTH]: 'M 280 700 Q 450 725 620 700 L 650 850 Q 450 880 250 850 Z',
  [ZONE.EAST]:  'M 700 280 L 850 250 Q 880 450 850 650 L 700 620 Q 725 450 700 280 Z',
  [ZONE.WEST]:  'M 200 280 Q 175 450 200 620 L 50 650 Q 20 450 50 250 Z',
});

// ─── Zone label centre positions on the 900×900 canvas ────────────────────
export const ZONE_CENTRES = /** @type {Record<string, {x:number,y:number}>} */ ({
  [ZONE.NORTH]: { x: 450, y: 118 },
  [ZONE.SOUTH]: { x: 450, y: 778 },
  [ZONE.EAST]:  { x: 780, y: 450 },
  [ZONE.WEST]:  { x: 120, y: 450 },
});

// ─── Emoji map for facility types ─────────────────────────────────────────
export const FACILITY_EMOJI = /** @type {Record<string, string>} */ ({
  [FACILITY_TYPES.GATES]:       '🚪',
  [FACILITY_TYPES.CONCESSIONS]: '🍔',
  [FACILITY_TYPES.RESTROOMS]:   '🚻',
  [FACILITY_TYPES.MEDICAL]:     '⛑️',
  [FACILITY_TYPES.PARKING]:     '🅿️',
});

// ─── Density colour thresholds ────────────────────────────────────────────
/**
 * Returns fill, label, and ring colours for a given density percentage.
 * @param {number} pct - 0–100
 * @returns {{ fill: string, label: string }}
 */
export function densityToColor(pct) {
  if (pct >= 90) return { fill: '#ef4444', label: '#fff' };
  if (pct >= 75) return { fill: '#f97316', label: '#fff' };
  if (pct >= 55) return { fill: '#eab308', label: '#000' };
  return               { fill: '#22c55e', label: '#fff' };
}

/**
 * Returns a CSS hex colour for a wait-time value (in minutes).
 * @param {number|string} wait
 * @returns {string}
 */
export function waitColor(wait) {
  if (typeof wait === 'string') return '#6b7280';
  if (wait > 15) return '#ef4444';
  if (wait > 5)  return '#f59e0b';
  return '#22c55e';
}

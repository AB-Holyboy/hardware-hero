/**
 * Axis-Aligned Bounding Box Collision
 * @param {Object} a - Entity A with { x, y, w, h }
 * @param {Object} b - Entity B with { x, y, w, h }
 */
export function rectCollide(a, b) {
  return Math.abs(a.x - b.x) * 2 < (a.w + b.w) &&
         Math.abs(a.y - b.y) * 2 < (a.h + b.h);
}
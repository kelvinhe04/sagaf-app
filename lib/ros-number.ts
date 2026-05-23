// lib/ros-number.ts — Generación de número único de ROS (RF-01 RE-01)
// Previene DEF-12: cuenta secuencial atómica con bloqueo por transacción.
import { db } from './db';

const lastROS = db.prepare<[string], { numero_ros: string }>(
  `SELECT numero_ros FROM ros WHERE numero_ros LIKE ? ORDER BY numero_ros DESC LIMIT 1`,
);

export function generateNumeroROS(): string {
  const year = new Date().getFullYear();
  const prefix = `ROS-${year}-`;
  const tx = db.transaction(() => {
    const last = lastROS.get(`${prefix}%`);
    let next = 1;
    if (last) {
      const tail = last.numero_ros.replace(prefix, '');
      next = Number.parseInt(tail, 10) + 1;
    }
    return `${prefix}${String(next).padStart(6, '0')}`;
  });
  return tx();
}

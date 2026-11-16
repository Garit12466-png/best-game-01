// MONSTERWEAVE — Tactical Monster Entities, AI Behavior & Wave Spawning

import { ARENA_Y, LANES, MONSTER_TYPES, SANCTUM_GATE_Y } from './config.js';

export function createMonster(typeKey, laneIndex, wave = 1) {
  const base = MONSTER_TYPES[typeKey];
  const laneX = LANES[laneIndex];

  // Scale stats with wave count
  const hpScale = 1 + (wave - 1) * 0.22;
  const speedScale = Math.min(1.4, 1 + (wave - 1) * 0.05);

  return {
    id: `m_${Math.random().toString(36).substring(2, 9)}`,
    type: base.id,
    name: base.name,
    maxHp: Math.round(base.maxHp * hpScale),
    hp: Math.round(base.maxHp * hpScale),
    speed: base.speed * speedScale,
    baseSpeed: base.speed * speedScale,
    score: base.score,
    radius: base.radius,
    color: base.color,
    aura: base.aura,
    isBoss: !!base.isBoss,
    laneIndex: laneIndex,
    x: laneX,
    y: ARENA_Y - 40 - Math.random() * 50,
    wobbleOffset: Math.random() * Math.PI * 2,
    slowTimer: 0,
    flashTimer: 0,
    dead: false,
    breached: false
  };
}

export function updateMonster(monster, dt) {
  if (monster.dead || monster.breached) return;

  // Handle status effects
  if (monster.slowTimer > 0) {
    monster.slowTimer -= dt;
    monster.speed = monster.baseSpeed * 0.45;
  } else {
    monster.speed = monster.baseSpeed;
  }

  if (monster.flashTimer > 0) {
    monster.flashTimer -= dt;
  }

  // Advance position downwards
  monster.y += monster.speed * dt;

  // Subtle natural organic wobble
  monster.wobbleOffset += dt * 5;
  const laneX = LANES[monster.laneIndex];
  const wobbleAmp = monster.isBoss ? 4 : 12;
  monster.x = laneX + Math.sin(monster.wobbleOffset) * wobbleAmp;

  // Check if reached Sanctum Core gate
  if (monster.y >= SANCTUM_GATE_Y) {
    monster.breached = true;
  }
}

export function applyMonsterDamage(monster, damage, gemTypeId = null) {
  monster.hp -= damage;
  monster.flashTimer = 0.12;

  if (gemTypeId === 'sapphire') {
    monster.slowTimer = 3.0; // 3 seconds frost chill
  }

  if (monster.hp <= 0) {
    monster.hp = 0;
    monster.dead = true;
  }
  return monster.dead;
}

export function generateWaveQueue(waveNumber, difficultyMultiplier = 1.0) {
  const queue = [];
  const wave = waveNumber;

  if (wave % 5 === 0) {
    // Boss Wave!
    queue.push({ type: 'TITAN', lane: 1, delay: 1.0 });
    const adds = 4 + wave;
    for (let i = 0; i < adds; i++) {
      queue.push({
        type: i % 2 === 0 ? 'BEETLE' : 'GARGOYLE',
        lane: i % 3,
        delay: 2.5 + i * 1.5
      });
    }
    return queue;
  }

  // Standard Waves
  const beetleCount = Math.floor((5 + wave * 2) * difficultyMultiplier);
  const gargoyleCount = Math.floor((wave >= 2 ? wave * 1.5 : 0) * difficultyMultiplier);
  const golemCount = Math.floor((wave >= 3 ? Math.floor(wave / 2) : 0) * difficultyMultiplier);

  let currentTime = 0.8;

  // Spawn beetles
  for (let i = 0; i < beetleCount; i++) {
    queue.push({
      type: 'BEETLE',
      lane: Math.floor(Math.random() * 3),
      delay: currentTime
    });
    currentTime += 0.85 + Math.random() * 0.7;
  }

  // Spawn gargoyles
  for (let i = 0; i < gargoyleCount; i++) {
    queue.push({
      type: 'GARGOYLE',
      lane: (i + 1) % 3,
      delay: currentTime + 0.5
    });
    currentTime += 1.4;
  }

  // Spawn golems
  for (let i = 0; i < golemCount; i++) {
    queue.push({
      type: 'GOLEM',
      lane: i % 3,
      delay: currentTime + 1.0
    });
    currentTime += 2.2;
  }

  // Sort queue chronologically by delay
  queue.sort((a, b) => a.delay - b.delay);
  return queue;
}

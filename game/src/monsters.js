// MONSTERWEAVE — Tactical Monster Entities, AI Behavior & Wave Spawning

import { ARENA_Y, LANES, MONSTER_TYPES, SANCTUM_GATE_Y } from './config.js';

export function createMonster(typeKey, laneIndex, wave = 1) {
  const base = MONSTER_TYPES[typeKey];
  const laneX = LANES[laneIndex];

  // Gentle scaling per wave
  const hpScale = 1 + (wave - 1) * 0.15;
  const speedScale = Math.min(1.3, 1 + (wave - 1) * 0.04);

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
    y: ARENA_Y - 20 - Math.random() * 10,
    wobbleOffset: Math.random() * Math.PI * 2,
    animTimer: Math.random() * 10,
    slowTimer: 0,
    flashTimer: 0,
    dead: false,
    breached: false
  };
}

export function updateMonster(monster, dt) {
  if (monster.dead || monster.breached) return;

  monster.animTimer += dt * 4;

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

  // Subtle organic crawl / flight wobble
  monster.wobbleOffset += dt * 3.5;
  const laneX = LANES[monster.laneIndex];
  const wobbleAmp = monster.isBoss ? 4 : 8;
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
    monster.slowTimer = 3.5; // Frost chill
  }

  if (monster.hp <= 0) {
    monster.hp = 0;
    monster.dead = true;
  }
  return monster.dead;
}

export function generateWaveQueue(waveNumber, spawnMultiplier = 1.0) {
  const queue = [];
  const wave = waveNumber;

  // Prompt start delay: 0.35s (monsters enter the battlefield right away!)
  let currentTime = 0.35;

  if (wave % 5 === 0) {
    // Boss Wave! (Wave 5 & 10)
    queue.push({ type: 'TITAN', lane: 1, delay: currentTime });
    currentTime += 2.5;

    const adds = 4 + wave;
    for (let i = 0; i < adds; i++) {
      queue.push({
        type: i % 2 === 0 ? 'BEETLE' : 'GARGOYLE',
        lane: i % 3,
        delay: currentTime + i * 1.8
      });
    }
    return queue;
  }

  // Wave 1: Engaging start with 5 beetles entering promptly
  if (wave === 1) {
    for (let i = 0; i < 5; i++) {
      queue.push({
        type: 'BEETLE',
        lane: i % 3,
        delay: currentTime
      });
      currentTime += 1.8; // Steady, balanced 1.8s between spawns
    }
    return queue;
  }

  // Wave 2+: Gradually scale
  const beetleCount = Math.floor((5 + wave * 1.5) * spawnMultiplier);
  const gargoyleCount = Math.floor((wave >= 2 ? wave + 1 : 0) * spawnMultiplier);
  const golemCount = Math.floor((wave >= 3 ? Math.floor(wave / 2) : 0) * spawnMultiplier);

  // Spawn beetles
  for (let i = 0; i < beetleCount; i++) {
    queue.push({
      type: 'BEETLE',
      lane: i % 3,
      delay: currentTime
    });
    currentTime += 1.5 + Math.random() * 0.5;
  }

  // Spawn gargoyles
  for (let i = 0; i < gargoyleCount; i++) {
    queue.push({
      type: 'GARGOYLE',
      lane: (i + 1) % 3,
      delay: currentTime
    });
    currentTime += 2.0;
  }

  // Spawn golems
  for (let i = 0; i < golemCount; i++) {
    queue.push({
      type: 'GOLEM',
      lane: i % 3,
      delay: currentTime
    });
    currentTime += 2.6;
  }

  queue.sort((a, b) => a.delay - b.delay);
  return queue;
}

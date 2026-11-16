// MONSTERWEAVE — Particle Systems, Beam Projectiles, Floating Text & Screen Shake

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.beams = [];
    this.shakeAmount = 0;
    this.shakeDecay = 18;
  }

  addShake(amount) {
    this.shakeAmount = Math.min(25, this.shakeAmount + amount);
  }

  getShakeOffset() {
    if (this.shakeAmount <= 0.1) return { x: 0, y: 0 };
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(angle) * this.shakeAmount,
      y: Math.sin(angle) * this.shakeAmount
    };
  }

  spawnExplosion(x, y, color = '#ff3366', count = 24, maxSpeed = 160) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * maxSpeed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: color,
        alpha: 1.0,
        decay: 1.2 + Math.random() * 1.5
      });
    }
  }

  spawnPlacementSparks(x, y, color = '#00d2ff') {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: color,
        alpha: 0.9,
        decay: 2.2
      });
    }
  }

  spawnLaserBeam(startX, startY, targetX, targetY, color = '#ffcc00') {
    this.beams.push({
      x1: startX,
      y1: startY,
      x2: targetX,
      y2: targetY,
      color: color,
      width: 6,
      alpha: 1.0,
      duration: 0.22,
      timer: 0.22
    });
  }

  addFloatingText(x, y, text, color = '#ffffff', fontSize = 18, isCrit = false) {
    this.texts.push({
      x: x + (Math.random() * 20 - 10),
      y: y,
      vy: isCrit ? -70 : -45,
      text: text,
      color: color,
      fontSize: fontSize,
      isCrit: isCrit,
      alpha: 1.0,
      life: 0.9
    });
  }

  update(dt) {
    // Decay screen shake
    if (this.shakeAmount > 0) {
      this.shakeAmount = Math.max(0, this.shakeAmount - this.shakeDecay * dt);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      t.alpha = Math.max(0, t.life / 0.9);
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      }
    }

    // Update laser beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.timer -= dt;
      b.alpha = Math.max(0, b.timer / b.duration);
      if (b.timer <= 0) {
        this.beams.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw beams
    ctx.save();
    for (const b of this.beams) {
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // Inner white hot core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = b.width * 0.4;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    }
    ctx.restore();

    // Draw particles
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw floating texts
    ctx.save();
    for (const t of this.texts) {
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = t.isCrit ? `bold ${t.fontSize}px sans-serif` : `${t.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }
}

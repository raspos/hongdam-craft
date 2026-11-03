import * as THREE from 'three';
import { Character3DAction, StageNumber } from '../../types/game';

export function createLabelSprite(
  topText: string,
  bottomText: string,
  borderColor = '#f59e0b'
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 84;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
  ctx.fillRect(4, 4, 312, 76);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 312, 76);

  ctx.fillStyle = borderColor;
  ctx.font = 'bold 18px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(topText.slice(0, 26), 160, 30);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 21px Pretendard, sans-serif';
  ctx.fillText(bottomText.slice(0, 24), 160, 60);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(2.35, 0.62, 1);
  return sprite;
}

export function createSpeechSprite(text: string, speaker: string, isReporter: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 132;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isReporter ? '#fef2f2' : '#eff6ff';
  ctx.fillRect(8, 8, 364, 96);

  ctx.strokeStyle = isReporter ? '#dc2626' : '#2563eb';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 364, 96);

  ctx.fillStyle = isReporter ? '#b91c1c' : '#1d4ed8';
  ctx.font = 'bold 16px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`[${speaker.slice(0, 22)}]`, 22, 33);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px Pretendard, sans-serif';
  const line1 = text.slice(0, 21);
  const line2 = text.slice(21, 42) + (text.length > 42 ? '…' : '');
  ctx.fillText(line1, 22, 62);
  if (line2) ctx.fillText(line2, 22, 87);

  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(3.1, 1.08, 1);
  return sprite;
}

/**
 * Builds Stage 1~6 distinct 3D Voxel Environments
 */
export function buildStageEnvironment(
  stage: StageNumber
): { group: THREE.Group; skyColor: number; floorColor: number; animateEnv?: (ms: number) => void } {
  const group = new THREE.Group();
  const animHooks: ((ms: number) => void)[] = [];

  // Battle Arena Platform Ring (connects Left PR Chief vs Right Journalist)
  const arenaBase = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.14, 5.2),
    new THREE.MeshLambertMaterial({ color: 0x1e293b })
  );
  arenaBase.position.set(0, 0.07, 0.4);
  arenaBase.receiveShadow = true;
  group.add(arenaBase);

  // Left Blue Pad (PR Chief) & Right Red Pad (Journalist)
  const padL = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.08, 2.3),
    new THREE.MeshLambertMaterial({ color: 0x1d4ed8 })
  );
  padL.position.set(-2.5, 0.16, 0.5);
  const padR = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.08, 2.5),
    new THREE.MeshLambertMaterial({ color: 0xb91c1c })
  );
  padR.position.set(2.5, 0.16, 0.5);
  group.add(padL, padR);

  // Center VS Divider Line
  const vsLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.09, 4.8),
    new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
  );
  vsLine.position.set(0, 0.16, 0.4);
  group.add(vsLine);

  if (stage === 1) {
    // Corporate Glass HQ Lobby + Trees
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(9, 7, 2.5),
      new THREE.MeshLambertMaterial({ color: 0x334155 })
    );
    tower.position.set(0, 3.5, -3.5);
    group.add(tower);

    for (let x = -3.2; x <= 3.2; x += 1.6) {
      for (let y = 1.4; y <= 5.6; y += 1.4) {
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.9, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
        );
        win.position.set(x, y, -2.22);
        group.add(win);
      }
    }
    return { group, skyColor: 0x38bdf8, floorColor: 0x4d7c0f };
  }

  if (stage === 2) {
    // Night Office Whistleblower Alley
    const bldg = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 2.5),
      new THREE.MeshLambertMaterial({ color: 0x0f172a })
    );
    bldg.position.set(0, 4, -3.6);
    group.add(bldg);

    for (let x = -3.6; x <= 3.6; x += 1.8) {
      for (let y = 1.5; y <= 6.2; y += 1.5) {
        const lit = (Math.abs(x * 3 + y * 7) % 3) !== 0;
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.85, 0.1),
          new THREE.MeshLambertMaterial({ color: lit ? 0xfef08a : 0x1e293b })
        );
        win.position.set(x, y, -2.3);
        group.add(win);
      }
    }
    return { group, skyColor: 0x0f172a, floorColor: 0x1e293b };
  }

  if (stage === 3) {
    // Financial Vault & Stock Ticker Board
    const vault = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6.5, 2.2),
      new THREE.MeshLambertMaterial({ color: 0x172554 })
    );
    vault.position.set(0, 3.25, -3.4);
    group.add(vault);

    // Stock chart bars in background
    const barColors = [0x22c55e, 0xef4444, 0xef4444, 0x22c55e, 0xef4444, 0xef4444];
    barColors.forEach((col, i) => {
      const h = 1.2 + ((i * 7) % 3) * 0.9;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, h, 0.25),
        new THREE.MeshLambertMaterial({ color: col })
      );
      bar.position.set(-2.8 + i * 1.1, 1.5 + h / 2, -2.15);
      group.add(bar);
    });
    return { group, skyColor: 0x1e1b4b, floorColor: 0x0f172a };
  }

  if (stage === 4) {
    // Broadcast Studio Set (ON-AIR Sign + Studio Tripod Cameras)
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(11, 7, 2.0),
      new THREE.MeshLambertMaterial({ color: 0x111827 })
    );
    wall.position.set(0, 3.5, -3.4);
    group.add(wall);

    const onAirSign = createLabelSprite('ON AIR · LIVE', '탐사보도 스튜디오', '#ef4444');
    onAirSign.position.set(0, 4.8, -2.1);
    onAirSign.scale.set(3.2, 0.85, 1);
    group.add(onAirSign);

    [-4.1, 4.1].forEach((cx) => {
      const tripod = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.3, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x475569 })
      );
      tripod.position.set(cx, 0.65, 1.8);
      const camHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.4, 0.7),
        new THREE.MeshLambertMaterial({ color: 0x020617 })
      );
      camHead.position.set(cx, 1.4, 1.8);
      camHead.lookAt(0, 1.2, 0.4);
      group.add(tripod, camHead);
    });

    return { group, skyColor: 0x18181b, floorColor: 0x27272a };
  }

  if (stage === 5) {
    // Prosecution Raid Plaza + Flashing Raid Van + Blue Seizure Boxes!
    const hq = new THREE.Mesh(
      new THREE.BoxGeometry(10, 7.5, 2.4),
      new THREE.MeshLambertMaterial({ color: 0x1e293b })
    );
    hq.position.set(0, 3.75, -3.6);
    group.add(hq);

    const vanGroup = createProsecutionVanMesh();
    vanGroup.group.position.set(0, 0.15, -1.65);
    group.add(vanGroup.group);
    animHooks.push(vanGroup.animate);

    // Yellow Press Line Tape
    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.08, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xfacc15 })
    );
    tape.position.set(0, 0.9, -0.7);
    group.add(tape);

    return {
      group,
      skyColor: 0x1e293b,
      floorColor: 0x334155,
      animateEnv: (ms) => animHooks.forEach((fn) => fn(ms)),
    };
  }

  // Stage 6: Chaebol Chairman Penthouse & Boss Pillars!
  const penthouse = new THREE.Mesh(
    new THREE.BoxGeometry(11, 8, 2.4),
    new THREE.MeshLambertMaterial({ color: 0x27121b })
  );
  penthouse.position.set(0, 4, -3.6);
  group.add(penthouse);

  // Golden Pillars
  const pillars: THREE.Mesh[] = [];
  [-4.2, -1.8, 1.8, 4.2].forEach((px) => {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 6.2, 0.55),
      new THREE.MeshLambertMaterial({ color: 0xd97706 })
    );
    p.position.set(px, 3.1, -2.2);
    group.add(p);
    pillars.push(p);
  });

  // Red Carpet
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.05, 5.0),
    new THREE.MeshLambertMaterial({ color: 0x991b1b })
  );
  carpet.position.set(0, 0.17, 0.4);
  group.add(carpet);

  return {
    group,
    skyColor: 0x1c0914,
    floorColor: 0x18181b,
    animateEnv: (ms) => {
      const pulse = 0.5 + 0.5 * Math.sin(ms * 0.004);
      pillars.forEach((p, idx) => {
        p.position.y = 3.1 + Math.sin(ms * 0.003 + idx) * 0.08 * pulse;
      });
    },
  };
}

export function createProsecutionVanMesh(): { group: THREE.Group; animate: (ms: number) => void } {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.5, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x0f172a })
  );
  body.position.y = 0.9;
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.24, 0.22, 1.54),
    new THREE.MeshLambertMaterial({ color: 0x2563eb })
  );
  stripe.position.y = 0.85;

  const sirenRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const sirenBlueMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const sirenR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.32), sirenRedMat);
  sirenR.position.set(-0.35, 1.75, 0);
  const sirenB = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.32), sirenBlueMat);
  sirenB.position.set(0.35, 1.75, 0);

  // Iconic Korean Prosecution Blue Seizure Boxes ("압수물")
  const boxMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.42), boxMat);
  box1.position.set(-1.95, 0.2, 0.55);
  const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.42), boxMat);
  box2.position.set(-1.95, 0.58, 0.55);

  group.add(body, stripe, sirenR, sirenB, box1, box2);

  return {
    group,
    animate: (ms: number) => {
      const blink = Math.floor(ms / 180) % 2 === 0;
      sirenRedMat.color.setHex(blink ? 0xff2222 : 0x450a0a);
      sirenBlueMat.color.setHex(!blink ? 0x38bdf8 : 0x172554);
    },
  };
}

/**
 * Builds dynamic center-stage 3D Props & Visual Effects for all 15 required scenes!
 */
export function buildActionPropScene(
  propType: Character3DAction,
  isEn: boolean
): { group: THREE.Group; animate?: (ms: number) => void } {
  const group = new THREE.Group();

  switch (propType) {
    case 'phone_call': {
      // Expanding signal rings between PR Chief and Reporter
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const ring1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), ringMat);
      ring1.position.set(-1.4, 1.9, 0.5);
      group.add(ring1);
      return {
        group,
        animate: (ms) => {
          const s = 0.6 + ((ms * 0.002) % 1.0) * 0.9;
          ring1.scale.set(s, s, s);
          ring1.rotation.y = ms * 0.003;
        },
      };
    }

    case 'laptop_typing': {
      // Desk + Glowing Voxel Laptop
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.78, 0.85),
        new THREE.MeshLambertMaterial({ color: 0x78350f })
      );
      desk.position.set(1.35, 0.45, 0.5);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.05, 0.42),
        new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
      );
      base.position.set(1.35, 0.88, 0.5);
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.38, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      screen.position.set(1.35, 1.08, 0.32);
      group.add(desk, base, screen);
      return { group };
    }

    case 'submit_doc': {
      // Sliding Official Explanation Document Stack with Blue Seal
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.72, 1.0),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      table.position.set(0, 0.42, 0.5);
      const docStack = new THREE.Group();
      const paper = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.16, 0.42),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      const seal = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.03, 0.14),
        new THREE.MeshLambertMaterial({ color: 0x2563eb })
      );
      seal.position.y = 0.09;
      docStack.add(paper, seal);
      docStack.position.set(-0.5, 0.88, 0.5);
      group.add(table, docStack);
      return {
        group,
        animate: (ms) => {
          docStack.position.x = -0.5 + Math.min(1.0, (ms % 1800) / 1200) * 0.9;
        },
      };
    }

    case 'table_social':
    case 'bomb_shot_stagger': {
      // Pocha/Cafe Round Table + Green Soju Bottles + Golden Bomb Shot Glasses!
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.08, 12),
        new THREE.MeshLambertMaterial({ color: propType === 'bomb_shot_stagger' ? 0xdc2626 : 0x92400e })
      );
      table.position.set(0, 0.82, 0.5);
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.75, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x475569 })
      );
      leg.position.set(0, 0.42, 0.5);
      group.add(table, leg);

      // Green Soju bottles & Golden Beer Bomb-Shot mugs
      const greenMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
      [-0.3, 0.25].forEach((bx) => {
        const bottle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), greenMat);
        bottle.position.set(bx, 1.03, 0.4);
        group.add(bottle);
      });

      const mugs: THREE.Mesh[] = [];
      for (let i = 0; i < (propType === 'bomb_shot_stagger' ? 5 : 2); i++) {
        const mug = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), goldMat);
        mug.position.set(-0.32 + i * 0.16, 0.97 + (i === 2 ? 0.22 : 0), 0.65);
        group.add(mug);
        mugs.push(mug);
      }

      return {
        group,
        animate:
          propType === 'bomb_shot_stagger'
            ? (ms) => {
                mugs.forEach((m, idx) => {
                  m.rotation.y = ms * 0.005 + idx;
                });
              }
            : undefined,
      };
    }

    case 'legal_squad': {
      // 2 Voxel Corporate Lawyers with Briefcases + Blue Compliance Ring!
      [-3.5, -1.6].forEach((lx, idx) => {
        const lawyer = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.95, 0.28),
          new THREE.MeshLambertMaterial({ color: 0x0f172a })
        );
        body.position.y = 0.65;
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.45, 0.45),
          new THREE.MeshLambertMaterial({ color: 0xf3cfb3 })
        );
        head.position.y = 1.38;
        const briefcase = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.24, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x451a03 })
        );
        briefcase.position.set(0.32, 0.45, 0.15);
        lawyer.add(body, head, briefcase);
        lawyer.position.set(lx, 0.16, -0.35 + idx * 0.2);
        group.add(lawyer);
      });

      const shield = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2.2, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28 })
      );
      shield.position.set(-1.3, 1.25, 0.5);
      group.add(shield);
      return { group };
    }

    case 'press_conference': {
      // Official Press Podium + Dual Microphones + Camera Flash Cubes!
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.15, 0.7),
        new THREE.MeshLambertMaterial({ color: 0x1e3a8a })
      );
      podium.position.set(-1.5, 0.72, 0.5);
      const micL = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.28, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x020617 })
      );
      micL.position.set(-1.35, 1.42, 0.6);
      const micR = micL.clone();
      micR.position.set(-1.65, 1.42, 0.6);

      const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const flash = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), flashMat);
      flash.position.set(1.2, 2.1, 1.2);
      group.add(podium, micL, micR, flash);

      return {
        group,
        animate: (ms) => {
          const burst = (ms % 550) < 90 ? 0.9 : 0.0;
          flashMat.opacity = burst;
          flash.position.x = 0.8 + ((Math.floor(ms / 550) * 7) % 3) * 0.7;
        },
      };
    }

    case 'prosecution_van': {
      const van = createProsecutionVanMesh();
      van.group.position.set(0, 0.16, -0.8);
      group.add(van.group);
      return { group, animate: van.animate };
    }

    case 'news_publish': {
      // Giant Spinning Newspaper / Breaking Mobile Screen!
      const board = createLabelSprite(
        isEn ? 'BREAKING NEWS' : '🚨 긴급 속보 발행',
        isEn ? 'HEADLINE PUBLISHED!' : '포털 메인 톱기사 송고!',
        '#ef4444'
      );
      board.position.set(0, 2.1, 0.6);
      board.scale.set(3.4, 1.0, 1);
      group.add(board);
      return {
        group,
        animate: (ms) => {
          board.position.y = 2.1 + Math.sin(ms * 0.005) * 0.12;
        },
      };
    }

    case 'celebrate_promo': {
      // Executive Desk + Golden Trophy + Confetti Cubes!
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.85, 0.95),
        new THREE.MeshLambertMaterial({ color: 0x451a03 })
      );
      desk.position.set(0, 0.55, 0.4);
      const trophy = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.55, 0.32),
        new THREE.MeshLambertMaterial({ color: 0xfacc15 })
      );
      trophy.position.set(0, 1.25, 0.4);
      const nameplate = createLabelSprite(
        isEn ? 'EXECUTIVE PROMOTION' : '임원 인사 발령',
        isEn ? 'VP of Communications' : '홍보담당 상무 승진!',
        '#facc15'
      );
      nameplate.position.set(0, 2.35, 0.4);
      group.add(desk, trophy, nameplate);

      const confetti: THREE.Mesh[] = [];
      const cols = [0xfacc15, 0x38bdf8, 0x22c55e, 0xf43f5e, 0xa855f7];
      for (let i = 0; i < 16; i++) {
        const c = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.14, 0.14),
          new THREE.MeshBasicMaterial({ color: cols[i % cols.length] })
        );
        c.position.set(-2.5 + (i % 8) * 0.7, 2.6 + (i % 3) * 0.5, 0.5);
        group.add(c);
        confetti.push(c);
      }
      return {
        group,
        animate: (ms) => {
          trophy.rotation.y = ms * 0.003;
          confetti.forEach((c, idx) => {
            c.position.y = 3.2 - (((ms * 0.0018 + idx * 0.3) % 2.4));
            c.rotation.x = ms * 0.005 + idx;
          });
        },
      };
    }

    case 'demoted_box': {
      // Cardboard Moving Box + Wilted Plant
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.5, 0.55),
        new THREE.MeshLambertMaterial({ color: 0xd97706 })
      );
      box.position.set(-1.9, 1.05, 0.55);
      const plant = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.32, 0.18),
        new THREE.MeshLambertMaterial({ color: 0x65a30d })
      );
      plant.position.set(-1.9, 1.4, 0.55);
      plant.rotation.z = 0.35;
      group.add(box, plant);
      return { group };
    }

    case 'hospital_bed':
    case 'resting_drip': {
      // Hospital Bed / Lounge + Silver IV Drip Stand ("링거 투혼")!
      if (propType === 'hospital_bed') {
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.55, 1.1),
          new THREE.MeshLambertMaterial({ color: 0xf8fafc })
        );
        bed.position.set(-2.2, 0.44, 0.5);
        group.add(bed);
      }
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 2.3, 0.08),
        new THREE.MeshLambertMaterial({ color: 0xcbd5e1 })
      );
      pole.position.set(-3.1, 1.3, 0.5);
      const ivBag = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.36, 0.12),
        new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
      );
      ivBag.position.set(-3.0, 2.2, 0.5);
      group.add(pole, ivBag);
      return { group };
    }

    case 'resignation_exit': {
      // White Resignation Envelope ("사직서") Slammed on Desk!
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.8, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      desk.position.set(-0.5, 0.5, 0.5);
      const env = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, 0.38),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      env.position.set(-0.5, 0.95, 0.5);
      const tag = createLabelSprite(
        isEn ? 'LETTER OF RESIGNATION' : '사 직 서',
        isEn ? 'I QUIT! GOODBYE!' : '오늘부로 홍담 탈출!',
        '#10b981'
      );
      tag.position.set(-0.5, 1.9, 0.5);
      group.add(desk, env, tag);
      return { group };
    }

    default:
      return { group };
  }
}

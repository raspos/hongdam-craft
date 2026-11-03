import * as THREE from 'three';
import { Character3DAction, JournalistAppearance, PRAppearance } from '../../types/game';

export interface CharacterBuildConfig {
  skinTone: string;
  hairStyle: 'neat' | 'parted' | 'short' | 'bob';
  hairColor: string;
  topColor: string;
  bottomColor: string;
  accentColor: string;
  glasses: boolean;
  hatColor?: string;
  hasCamera?: boolean;
  isPlayer: boolean;
}

export function fromPlayerAppearance(app: PRAppearance): CharacterBuildConfig {
  return {
    skinTone: app.skinTone,
    hairStyle: app.hairStyle,
    hairColor: app.hairColor,
    topColor: app.suitColor,
    bottomColor: '#0f172a',
    accentColor: app.tieColor,
    glasses: app.glasses,
    isPlayer: true,
  };
}

export function fromJournalistAppearance(app: JournalistAppearance): CharacterBuildConfig {
  return {
    skinTone: app.skinTone,
    hairStyle: app.hairStyle,
    hairColor: app.hairColor,
    topColor: app.jacketColor,
    bottomColor: app.pantsColor,
    accentColor: app.pressCardColor,
    glasses: app.glasses,
    hatColor: app.hatColor,
    hasCamera: app.hasCamera,
    isPlayer: false,
  };
}

export class VoxelActor {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;

  private phoneProp: THREE.Mesh;
  private padProp: THREE.Group;
  private sunglassesProp: THREE.Group;
  private blushL: THREE.Mesh;
  private blushR: THREE.Mesh;
  private action: Character3DAction = 'idle';

  constructor(cfg: CharacterBuildConfig, scale = 1.08) {
    this.group = new THREE.Group();
    this.group.scale.set(scale, scale, scale);

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.42;

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 0.92;

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.46, 1.24, 0);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.46, 1.24, 0);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.18, 0.6, 0);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.18, 0.6, 0);

    this.group.add(
      this.headGroup,
      this.bodyGroup,
      this.leftArm,
      this.rightArm,
      this.leftLeg,
      this.rightLeg
    );

    // Handheld props initialized
    this.phoneProp = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.2, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
    );
    this.padProp = new THREE.Group();
    this.sunglassesProp = new THREE.Group();
    this.blushL = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.04),
      new THREE.MeshLambertMaterial({ color: 0xf43f5e })
    );
    this.blushR = this.blushL.clone();

    this.rebuild(cfg);
  }

  public rebuild(cfg: CharacterBuildConfig) {
    [this.headGroup, this.bodyGroup, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg].forEach(
      (grp) => {
        while (grp.children.length > 0) grp.remove(grp.children[0]);
      }
    );

    const skinMat = new THREE.MeshLambertMaterial({ color: cfg.skinTone });
    const hairMat = new THREE.MeshLambertMaterial({ color: cfg.hairColor });
    const topMat = new THREE.MeshLambertMaterial({ color: cfg.topColor });
    const bottomMat = new THREE.MeshLambertMaterial({ color: cfg.bottomColor });
    const accentMat = new THREE.MeshLambertMaterial({ color: cfg.accentColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // Head
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), skinMat);
    headMesh.position.y = 0.31;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.04);
    const eyeL = new THREE.Mesh(eyeGeo, darkMat);
    eyeL.position.set(-0.14, 0.33, 0.32);
    const eyeR = new THREE.Mesh(eyeGeo, darkMat);
    eyeR.position.set(0.14, 0.33, 0.32);
    this.headGroup.add(eyeL, eyeR);

    // Drunk rosy cheeks (hidden unless bomb_shot_stagger)
    this.blushL.position.set(-0.2, 0.24, 0.32);
    this.blushR.position.set(0.2, 0.24, 0.32);
    this.blushL.visible = false;
    this.blushR.visible = false;
    this.headGroup.add(this.blushL, this.blushR);

    // Mouth
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), darkMat);
    mouth.position.set(0, 0.17, 0.32);
    this.headGroup.add(mouth);

    // Hair
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.66), hairMat);
    hairTop.position.set(0, 0.59, 0);
    this.headGroup.add(hairTop);

    if (cfg.hairStyle === 'bob') {
      const sideGeo = new THREE.BoxGeometry(0.1, 0.42, 0.64);
      const sideL = new THREE.Mesh(sideGeo, hairMat);
      sideL.position.set(-0.32, 0.35, 0);
      const sideR = new THREE.Mesh(sideGeo, hairMat);
      sideR.position.set(0.32, 0.35, 0);
      this.headGroup.add(sideL, sideR);
    } else if (cfg.hairStyle === 'parted' || cfg.hairStyle === 'neat') {
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.36, 0.14), hairMat);
      back.position.set(0, 0.4, -0.28);
      this.headGroup.add(back);
      if (cfg.hairStyle === 'parted') {
        const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.08), hairMat);
        fringe.position.set(-0.1, 0.52, 0.31);
        this.headGroup.add(fringe);
      }
    }

    if (cfg.hatColor) {
      const hatMat = new THREE.MeshLambertMaterial({ color: cfg.hatColor });
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.68), hatMat);
      crown.position.set(0, 0.68, 0);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.25), hatMat);
      brim.position.set(0, 0.61, 0.38);
      this.headGroup.add(crown, brim);
    }

    if (cfg.glasses) {
      const rimGeo = new THREE.BoxGeometry(0.19, 0.14, 0.05);
      const rimL = new THREE.Mesh(rimGeo, darkMat);
      rimL.position.set(-0.15, 0.33, 0.34);
      const rimR = new THREE.Mesh(rimGeo, darkMat);
      rimR.position.set(0.15, 0.33, 0.34);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), darkMat);
      bridge.position.set(0, 0.35, 0.34);
      this.headGroup.add(rimL, rimR, bridge);
    }

    // Cool resignation sunglasses (toggled on resignation_exit)
    this.sunglassesProp = new THREE.Group();
    const sgMat = new THREE.MeshLambertMaterial({ color: 0x020617 });
    const sgBar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.15, 0.07), sgMat);
    sgBar.position.set(0, 0.34, 0.35);
    this.sunglassesProp.add(sgBar);
    this.sunglassesProp.visible = false;
    this.headGroup.add(this.sunglassesProp);

    // Body
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.66, 0.32), topMat);
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    if (cfg.isPlayer) {
      // Shirt V + Tie for PR Chief
      const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.03), whiteMat);
      shirtV.position.set(0, 0.18, 0.16);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.04), accentMat);
      tie.position.set(0, 0.04, 0.17);
      this.bodyGroup.add(shirtV, tie);
    } else {
      // Press Pass lanyard for Journalist
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.04), accentMat);
      card.position.set(0, -0.04, 0.17);
      this.bodyGroup.add(card);
    }

    // Arms + Hands
    const armGeo = new THREE.BoxGeometry(0.19, 0.58, 0.21);
    const armL = new THREE.Mesh(armGeo, topMat);
    armL.position.y = -0.24;
    armL.castShadow = true;
    this.leftArm.add(armL);

    const armR = new THREE.Mesh(armGeo, topMat);
    armR.position.y = -0.24;
    armR.castShadow = true;
    this.rightArm.add(armR);

    // Smartphone on Right Arm
    this.phoneProp = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.2, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
    );
    this.phoneProp.position.set(0, -0.46, 0.14);
    this.phoneProp.visible = false;
    this.rightArm.add(this.phoneProp);

    // Notepad / Camera on Journalist Right Arm
    this.padProp = new THREE.Group();
    if (cfg.hasCamera) {
      const camBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.2, 0.34),
        new THREE.MeshLambertMaterial({ color: 0x1e293b })
      );
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.14),
        new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
      );
      lens.position.set(0, 0, 0.22);
      this.padProp.add(camBody, lens);
    } else {
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.24, 0.04),
        new THREE.MeshLambertMaterial({ color: 0xfef08a })
      );
      this.padProp.add(pad);
    }
    this.padProp.position.set(0, -0.45, 0.18);
    this.padProp.visible = !cfg.isPlayer;
    this.rightArm.add(this.padProp);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.24);
    const legL = new THREE.Mesh(legGeo, bottomMat);
    legL.position.y = -0.3;
    legL.castShadow = true;
    this.leftLeg.add(legL);

    const legR = new THREE.Mesh(legGeo, bottomMat);
    legR.position.y = -0.3;
    legR.castShadow = true;
    this.rightLeg.add(legR);
  }

  public setAction(act: Character3DAction) {
    this.action = act;
  }

  public animate(elapsedMs: number) {
    const t = elapsedMs * 0.004;

    // Reset baseline transforms
    this.group.rotation.z = 0;
    this.group.rotation.x = 0;
    this.bodyGroup.rotation.x = 0;
    this.headGroup.rotation.set(0, 0, 0);
    this.leftArm.rotation.set(0, 0, 0);
    this.rightArm.rotation.set(0, 0, 0);
    this.leftLeg.rotation.set(0, 0, 0);
    this.rightLeg.rotation.set(0, 0, 0);

    this.phoneProp.visible = this.action === 'phone_call';
    this.blushL.visible = this.action === 'bomb_shot_stagger';
    this.blushR.visible = this.action === 'bomb_shot_stagger';
    this.sunglassesProp.visible = this.action === 'resignation_exit';

    switch (this.action) {
      case 'phone_call': {
        this.rightArm.rotation.x = -2.25;
        this.rightArm.rotation.z = -0.35;
        this.headGroup.rotation.z = 0.12;
        this.headGroup.rotation.x = Math.sin(t * 5) * 0.08;
        this.group.position.y = Math.abs(Math.sin(t * 3)) * 0.04;
        break;
      }
      case 'notebook_out': {
        this.padProp.visible = true;
        this.rightArm.rotation.x = -1.15 + Math.sin(t * 9) * 0.12;
        this.leftArm.rotation.x = -0.85;
        this.headGroup.rotation.x = 0.18;
        this.group.position.y = Math.sin(t * 2) * 0.02;
        break;
      }
      case 'laptop_typing': {
        this.group.position.y = -0.1;
        this.leftArm.rotation.x = -1.25 + Math.sin(t * 14) * 0.16;
        this.rightArm.rotation.x = -1.25 - Math.sin(t * 14) * 0.16;
        this.headGroup.rotation.x = 0.15;
        break;
      }
      case 'submit_doc': {
        this.leftArm.rotation.x = -1.35;
        this.rightArm.rotation.x = -1.35;
        this.bodyGroup.rotation.x = 0.15;
        this.group.position.y = Math.abs(Math.sin(t * 4)) * 0.06;
        break;
      }
      case 'table_social': {
        this.rightArm.rotation.x = -1.1 + Math.sin(t * 4) * 0.35;
        this.headGroup.rotation.y = Math.sin(t * 2) * 0.18;
        this.group.position.y = 0;
        break;
      }
      case 'bomb_shot_stagger': {
        // Stagger & sway drunkenly!
        this.group.rotation.z = Math.sin(t * 3.2) * 0.24;
        this.group.position.y = Math.abs(Math.sin(t * 4)) * 0.08;
        this.rightArm.rotation.x = -2.5 + Math.sin(t * 6) * 0.25;
        this.leftArm.rotation.z = -0.4 + Math.cos(t * 4) * 0.2;
        this.headGroup.rotation.z = Math.cos(t * 3) * 0.2;
        break;
      }
      case 'sincere_bow': {
        // Deep Korean 60-degree formal bow
        this.bodyGroup.rotation.x = 0.65;
        this.headGroup.rotation.x = 0.75;
        this.leftArm.rotation.x = 0.2;
        this.rightArm.rotation.x = 0.2;
        this.group.position.y = -0.08;
        break;
      }
      case 'press_conference': {
        this.rightArm.rotation.x = -1.1 + Math.sin(t * 5) * 0.2;
        this.leftArm.rotation.x = -0.6;
        this.headGroup.rotation.y = Math.sin(t * 1.8) * 0.28;
        this.group.position.y = 0.18;
        break;
      }
      case 'celebrate_promo': {
        const jump = Math.max(0, Math.sin(t * 5.5)) * 0.42;
        this.group.position.y = jump;
        this.leftArm.rotation.x = Math.PI - 0.35;
        this.rightArm.rotation.x = Math.PI - 0.35;
        this.leftArm.rotation.z = -0.35;
        this.rightArm.rotation.z = 0.35;
        this.headGroup.rotation.y = Math.sin(t * 3) * 0.22;
        break;
      }
      case 'demoted_box': {
        // Carrying cardboard box with slumped shoulders
        this.leftArm.rotation.x = -1.15;
        this.rightArm.rotation.x = -1.15;
        this.headGroup.rotation.x = 0.42;
        this.group.position.y = -0.05;
        const trudge = Math.sin(t * 3) * 0.25;
        this.leftLeg.rotation.x = trudge;
        this.rightLeg.rotation.x = -trudge;
        break;
      }
      case 'hospital_bed': {
        // Lying horizontal on hospital bed!
        this.group.rotation.x = -Math.PI / 2;
        this.group.position.y = 0.78;
        break;
      }
      case 'resting_drip': {
        this.group.position.y = -0.12;
        this.headGroup.rotation.x = -0.25;
        this.leftArm.rotation.x = -0.5;
        this.rightArm.rotation.x = -0.5;
        break;
      }
      case 'resignation_exit': {
        const stride = Math.sin(t * 6);
        this.leftLeg.rotation.x = stride * 0.65;
        this.rightLeg.rotation.x = -stride * 0.65;
        this.leftArm.rotation.x = -stride * 0.6;
        this.rightArm.rotation.x = -2.4; // Waving goodbye!
        this.group.position.y = Math.abs(stride) * 0.08;
        break;
      }
      case 'angry_point': {
        this.rightArm.rotation.x = -1.55;
        this.headGroup.rotation.y = Math.sin(t * 12) * 0.08;
        this.group.position.y = Math.abs(Math.sin(t * 7)) * 0.06;
        break;
      }
      case 'shocked': {
        this.leftArm.rotation.z = -0.7;
        this.rightArm.rotation.z = 0.7;
        this.leftArm.rotation.x = -2.2;
        this.rightArm.rotation.x = -2.2;
        this.group.position.y = Math.abs(Math.sin(t * 10)) * 0.1;
        break;
      }
      case 'idle':
      default: {
        this.group.position.y = Math.sin(t * 2) * 0.025;
        this.headGroup.rotation.y = Math.sin(t * 1.2) * 0.16;
        this.leftArm.rotation.x = Math.sin(t * 1.5) * 0.07;
        this.rightArm.rotation.x = -0.25 + Math.cos(t * 1.5) * 0.07;
        break;
      }
    }
  }
}

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { JOURNALIST_ARCHETYPES } from '../../data/journalists';
import { useLanguage } from '../../i18n/LanguageContext';
import { ActiveJournalist, GamePhase, PRAppearance, SceneVisualCue, StageNumber } from '../../types/game';
import {
  fromJournalistAppearance,
  fromPlayerAppearance,
  VoxelActor,
} from './VoxelPRCharacter';
import {
  buildActionPropScene,
  buildStageEnvironment,
  createLabelSprite,
  createSpeechSprite,
} from './VoxelStageScenes';

interface BattleArenaCanvasProps {
  phase: GamePhase;
  stage: StageNumber;
  playerName: string;
  playerAppearance: PRAppearance;
  journalists: ActiveJournalist[];
  headline: string;
  deadline: number;
  pressure: number;
  visualCue: SceneVisualCue;
}

export const BattleArenaCanvas: React.FC<BattleArenaCanvasProps> = ({
  phase,
  stage,
  playerName,
  playerAppearance,
  journalists,
  headline,
  deadline,
  pressure,
  visualCue,
}) => {
  const { isEn } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const floorMatRef = useRef<THREE.MeshLambertMaterial | null>(null);
  const envGroupRef = useRef<THREE.Group | null>(null);
  const actorsGroupRef = useRef<THREE.Group | null>(null);
  const propsGroupRef = useRef<THREE.Group | null>(null);
  const speechGroupRef = useRef<THREE.Group | null>(null);

  const playerActorRef = useRef<VoxelActor | null>(null);
  const journalistActorsRef = useRef<VoxelActor[]>([]);
  const envAnimRef = useRef<((ms: number) => void) | undefined>(undefined);
  const propAnimRef = useRef<((ms: number) => void) | undefined>(undefined);

  // Orbit drag state
  const isDraggingRef = useRef(false);
  const prevXRef = useRef(0);
  const yawOffsetRef = useRef(0);

  // Initialize Three.js Scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
    } catch {
      setWebGLFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 3.8, 9.2);
    camera.lookAt(0, 1.4, 0.2);
    cameraRef.current = camera;

    const hemi = new THREE.HemisphereLight(0xfffbeb, 0x1e293b, 1.0);
    const dir = new THREE.DirectionalLight(0xffffff, 1.35);
    dir.position.set(6, 14, 9);
    dir.castShadow = true;
    scene.add(hemi, dir, new THREE.AmbientLight(0xffffff, 0.45));

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    floorMatRef.current = floorMat;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(28, 28, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    const envGroup = new THREE.Group();
    const actorsGroup = new THREE.Group();
    const propsGroup = new THREE.Group();
    const speechGroup = new THREE.Group();
    scene.add(envGroup, actorsGroup, propsGroup, speechGroup);

    envGroupRef.current = envGroup;
    actorsGroupRef.current = actorsGroup;
    propsGroupRef.current = propsGroup;
    speechGroupRef.current = speechGroup;

    const onResize = () => {
      if (!container) return;
      const w = Math.max(100, container.clientWidth);
      const h = Math.max(100, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    onResize();
    window.addEventListener('resize', onResize);

    let rafId = 0;
    const t0 = performance.now();
    const loop = () => {
      const elapsed = performance.now() - t0;
      playerActorRef.current?.animate(elapsed);
      journalistActorsRef.current.forEach((ja, i) => ja.animate(elapsed + i * 240));
      envAnimRef.current?.(elapsed);
      propAnimRef.current?.(elapsed);

      scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, yawOffsetRef.current, 0.09);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  }, []);

  // Update Stage 3D Environment
  useEffect(() => {
    const envGroup = envGroupRef.current;
    const scene = sceneRef.current;
    if (!envGroup || !scene) return;

    while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
    const built = buildStageEnvironment(stage);
    envGroup.add(built.group);
    scene.background = new THREE.Color(built.skyColor);
    floorMatRef.current?.color.setHex(built.floorColor);
    envAnimRef.current = built.animateEnv;
  }, [stage]);

  // Rebuild Player & Journalist 3D Voxel Characters
  useEffect(() => {
    const actorsGroup = actorsGroupRef.current;
    if (!actorsGroup) return;

    while (actorsGroup.children.length > 0) actorsGroup.remove(actorsGroup.children[0]);

    // 1. Left Side: PR Chief
    const playerActor = new VoxelActor(fromPlayerAppearance(playerAppearance), 1.12);
    playerActor.group.position.set(-2.45, 0.18, 0.5);
    playerActor.group.rotation.y = Math.PI * 0.36;
    playerActor.setAction(visualCue.playerAction);
    actorsGroup.add(playerActor.group);
    playerActorRef.current = playerActor;

    const pTag = createLabelSprite(
      isEn ? 'PR TEAM LEAD' : '홍보팀장',
      playerName || (isEn ? 'PR Chief' : '김홍담'),
      '#38bdf8'
    );
    pTag.position.set(-2.45, 2.75, 0.5);
    actorsGroup.add(pTag);

    // 2. Right Side: Journalist NPC(s) (Preview challenger on setup screen, or actual 1~2 NPCs in battle!)
    const displayJournalists: ActiveJournalist[] =
      journalists.length > 0
        ? journalists
        : [
            {
              memoryId: 'preview',
              nameKo: '강태성 기자',
              nameEn: 'Reporter Kang',
              outletKo: '한빛일보',
              outletEn: 'Hanbit Daily',
              titleKo: '특별취재팀',
              titleEn: 'Special Desk',
              archetype: 'scoop_hunter',
              appearance: JOURNALIST_ARCHETYPES.scoop_hunter.appearancePreset,
              stats: {
                reportingPower: 80,
                persistence: 80,
                expertise: 75,
                sourceNetwork: 80,
                deadlineUrgency: 70,
                intimacy: 40,
                distrust: 60,
                evidenceLevel: 65,
              },
              isAnalyzed: false,
              intentProbed: false,
              isReturning: false,
              currentDialogueKo: '단독 기사 나가기 전에 공식 입장 주시죠!',
              currentDialogueEn: 'Give me your official stance before this Exclusive runs!',
              isLead: true,
            },
          ];

    const builtJ: VoxelActor[] = [];
    displayJournalists.forEach((j, idx) => {
      const archDef = JOURNALIST_ARCHETYPES[j.archetype];
      const jScale = j.archetype === 'legend_investigative' ? 1.24 : idx === 0 ? 1.12 : 1.02;
      const ja = new VoxelActor(fromJournalistAppearance(j.appearance), jScale);
      const posX = displayJournalists.length === 1 ? 2.45 : idx === 0 ? 2.15 : 3.25;
      const posZ = displayJournalists.length === 1 ? 0.5 : idx === 0 ? 0.65 : -0.15;
      ja.group.position.set(posX, 0.18, posZ);
      ja.group.rotation.y = -Math.PI * 0.36;
      ja.setAction(visualCue.journalistAction);
      actorsGroup.add(ja.group);
      builtJ.push(ja);

      const jTag = createLabelSprite(
        isEn ? `${j.outletEn} · ${archDef.nameEn}` : `${j.outletKo} · ${archDef.nameKo}`,
        isEn ? j.nameEn : `${j.nameKo} ${j.titleKo}`,
        '#f87171'
      );
      jTag.position.set(posX, 2.82 + (j.archetype === 'legend_investigative' ? 0.2 : 0), posZ);
      actorsGroup.add(jTag);
    });
    journalistActorsRef.current = builtJ;
  }, [playerName, playerAppearance, journalists, isEn, visualCue.playerAction, visualCue.journalistAction]);

  // Update 3D Action Props & Speech Bubbles
  useEffect(() => {
    const propsGroup = propsGroupRef.current;
    const speechGroup = speechGroupRef.current;
    if (!propsGroup || !speechGroup) return;

    while (propsGroup.children.length > 0) propsGroup.remove(propsGroup.children[0]);
    while (speechGroup.children.length > 0) speechGroup.remove(speechGroup.children[0]);

    const propScene = buildActionPropScene(visualCue.propType, isEn);
    propsGroup.add(propScene.group);
    propAnimRef.current = propScene.animate;

    if (visualCue.playerSpeechKo || visualCue.playerSpeechEn) {
      const sp = createSpeechSprite(
        (isEn ? visualCue.playerSpeechEn : visualCue.playerSpeechKo) || '',
        playerName || (isEn ? 'PR Chief' : '홍보팀장'),
        false
      );
      sp.position.set(-2.2, 3.55, 0.5);
      speechGroup.add(sp);
    }

    const jText = isEn ? visualCue.journalistSpeechEn : visualCue.journalistSpeechKo;
    if (jText) {
      const leadJ = journalists[0];
      const spJ = createSpeechSprite(
        jText,
        leadJ ? (isEn ? leadJ.nameEn : leadJ.nameKo) : isEn ? 'Reporter' : '취재기자',
        true
      );
      spJ.position.set(2.15, 3.65, 0.5);
      speechGroup.add(spJ);
    }
  }, [visualCue, isEn, playerName, journalists]);

  if (webGLFailed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-xl border-4 border-slate-800 p-6 text-center font-pixel">
        <div className="text-4xl mb-2">⚔️</div>
        <div className="text-amber-300 font-bold">
          {isEn ? '3D Voxel PR Battle Arena (2D Fallback Mode)' : '3D 복셀 언론대응 배틀 아레나 (심플 모드)'}
        </div>
        <div className="text-xs text-slate-400 mt-2">{headline}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative rounded-xl overflow-hidden border-4 border-slate-950 shadow-[5px_5px_0_#000] bg-slate-950 cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') return;
        isDraggingRef.current = true;
        prevXRef.current = e.clientX;
      }}
      onPointerMove={(e) => {
        if (!isDraggingRef.current) return;
        yawOffsetRef.current = THREE.MathUtils.clamp(
          yawOffsetRef.current + (e.clientX - prevXRef.current) * 0.005,
          -0.65,
          0.65
        );
        prevXRef.current = e.clientX;
      }}
      onPointerUp={() => {
        isDraggingRef.current = false;
      }}
      onPointerLeave={() => {
        isDraggingRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Center Top Breaking Headline & Deadline Overlay (Section 24) */}
      {phase === 'battle' && (
        <div className="absolute top-2.5 inset-x-2.5 sm:inset-x-6 pointer-events-none flex flex-col items-center gap-1.5">
          <div className="newspaper-banner px-3 py-1.5 rounded max-w-xl w-full text-center">
            <div className="flex items-center justify-between text-[10px] font-pixel text-red-700 border-b border-stone-400 pb-0.5 mb-0.5">
              <span>{isEn ? '📰 BREAKING DRAFT IN PROGRESS' : '📰 현재 취재·작성 중인 기사 가제'}</span>
              <span className="font-bold">
                {isEn ? `PRESSURE ${pressure}%` : `보도 압박 ${pressure}%`}
              </span>
            </div>
            <div className="font-bold text-xs sm:text-sm text-stone-900 leading-snug truncate">
              {headline}
            </div>
          </div>

          <div
            className={`px-3 py-0.5 rounded-full border-2 font-pixel text-xs shadow-md flex items-center gap-2 ${
              deadline <= 1
                ? 'bg-red-950/95 border-red-400 text-red-200 danger-pulse'
                : 'bg-slate-950/90 border-amber-400 text-amber-300'
            }`}
          >
            <span>⏰ {isEn ? 'DEADLINE:' : '보도 마감까지:'}</span>
            <span className="font-extrabold text-sm">
              {isEn ? `${deadline} Turn(s) Left` : `${deadline}턴 남음`}
            </span>
          </div>
        </div>
      )}

      {phase === 'character_create' && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="bg-red-600/95 border-2 border-amber-300 px-2.5 py-1 rounded text-[11px] font-pixel text-white shadow">
            ⚔️ {isEn ? '3D TURN-BASED PR BATTLE RPG' : '3D 복셀 턴제 언론대응 배틀 RPG'}
          </span>
          <span className="bg-slate-950/85 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-pixel text-slate-300 hidden sm:inline">
            {isEn ? 'Drag to rotate arena' : '드래그하여 아레나 회전'}
          </span>
        </div>
      )}
    </div>
  );
};

export default BattleArenaCanvas;

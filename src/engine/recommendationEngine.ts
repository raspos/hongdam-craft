import { PR_SKILLS_BY_ID } from '../data/skills';
import { GameState, PRSkillDef, SkillExecutionPreview } from '../types/game';
import { evaluateSkillPreview } from './skillEngine';

export interface RecommendedSkillItem {
  skillId: string;
  rank: 1 | 2 | 3;
  utilityScore: number;
  reasonKo: string;
  reasonEn: string;
  preview: SkillExecutionPreview;
}

export function getTop3RecommendedSkills(state: GameState): RecommendedSkillItem[] {
  const battle = state.stageBattle;
  if (!battle) return [];

  const lead = battle.journalists[0];
  const buffs = battle.buffs;
  const currentPressure = battle.pressure;
  const deadline = battle.deadline;
  const currentXp = state.resources.xp;
  const currentHp = state.resources.hp;

  const candidates: {
    skill: PRSkillDef;
    preview: SkillExecutionPreview;
    score: number;
    reasonKo: string;
    reasonEn: string;
  }[] = [];

  for (const skillId of state.unlockedSkillIds) {
    const skill = PR_SKILLS_BY_ID[skillId];
    if (!skill) continue;

    const preview = evaluateSkillPreview(state, skillId);
    if (!preview.usable) continue;

    let score = 0;
    let reasonKo = '상황에 부합하는 균형 잡힌 대응입니다.';
    let reasonEn = 'A well-balanced tactical response for this situation.';

    // Base utility from pressure reduction (primary win condition)
    const pressureDrop = Math.abs(preview.expectedPressureDelta);
    score += pressureDrop * 2.2;

    // Trust gain
    if (preview.expectedTrustDelta > 0) {
      score += preview.expectedTrustDelta * 1.1;
    }

    // Resource cost penalties
    score -= preview.effectiveXpCost * 0.45;
    if (preview.effectiveHpCost > 0) {
      score -= preview.effectiveHpCost * 0.6;
    } else if (preview.effectiveHpCost < 0) {
      // HP healing reward
      score += Math.abs(preview.effectiveHpCost) * 1.2;
    }

    // Risk penalty
    if (preview.expectedRiskDelta > 0) {
      score -= preview.expectedRiskDelta * 1.4;
    }

    // Reputation bonus
    if (preview.expectedReputationDelta > 0) {
      score += preview.expectedReputationDelta * 1.2;
    }

    // Lethal warning extreme penalty
    if (preview.lethalWarningType) {
      score -= 400;
    }

    // Streak penalty (diminishing return)
    if (battle.lastCategory === skill.category && battle.sameCategoryStreak >= 1) {
      score -= battle.sameCategoryStreak * 18;
    }

    // Affinity bonus / penalty
    if (preview.affinityRating === 'great') {
      score += 26;
      reasonKo = `기자(${lead?.outletKo || '언론'}) 성향과 최적의 상성을 이룹니다.`;
      reasonEn = `Optimal matchup against this reporter’s archetype.`;
    } else if (preview.affinityRating === 'good') {
      score += 12;
      reasonKo = `기자 성향에 긍정적으로 작용하는 대응입니다.`;
      reasonEn = `Effective response tailored to reporter habits.`;
    } else if (preview.affinityRating === 'backfire') {
      score -= 300;
      reasonKo = `기자의 성향상 강한 역풍과 폭로로 이어질 수 있습니다.`;
      reasonEn = `High risk of backlash and hostile exposure.`;
    }

    // Contextual Rule 1: Need Fact-Check first
    if (!buffs.factChecked && (skill.id === 'B05_fact_check_team' || skill.id === 'B06_disclosure_crosscheck')) {
      score += 42;
      reasonKo = '현재 사안은 사실관계 확인이 급선무입니다. 확인 후 후속 대응 효율이 대폭 상승합니다.';
      reasonEn = 'Fact verification is urgent. Dramatically boosts follow-up response impact.';
    }

    // Contextual Rule 2: Post Fact-Check statement synergy
    if (buffs.factChecked && skill.id === 'A04_press_statement') {
      score += 38;
      reasonKo = '사내 팩트체크가 완료되어 공식 해명자료의 설득력이 최고조입니다.';
      reasonEn = 'Fact check is complete; official statement impact is at its peak.';
    }

    // Contextual Rule 3: Post Fact-Check / Audit correction synergy
    if ((buffs.factChecked || buffs.disclosureAudited) && skill.id === 'E18_factual_correction') {
      score += 34;
      reasonKo = '검증된 팩트를 토대로 기사 오류 정정과 반론을 확실히 반영시킬 수 있습니다.';
      reasonEn = 'Verified facts allow guaranteed rebuttal and factual corrections.';
    }

    // Contextual Rule 4: Urgent deadline (D-1 or D-2)
    if (deadline <= 2) {
      if (currentPressure > 68 && pressureDrop >= 14) {
        score += 32;
        reasonKo = `마감 임박(D-${deadline}턴)! 보도 압박을 68 이하로 즉시 낮추는 신속 대응이 필요합니다.`;
        reasonEn = `Deadline imminent! Fast response needed to lower pressure below 68%.`;
      }
    }

    // Contextual Rule 5: Critical budget (XP) shortage
    if (currentXp <= 24) {
      if (skill.mechanic === 'grant_vp_xp' || skill.mechanic === 'owner_banquet_xp') {
        score += 45;
        reasonKo = '홍보예산(XP)이 바닥나기 직전입니다. 긴급 예산을 확보해 파산을 막아야 합니다.';
        reasonEn = 'Budget is critically low. Secure emergency XP to prevent collapse.';
      } else if (preview.effectiveXpCost === 0) {
        score += 15;
        reasonKo = '예산 소모가 없어 자원 고갈 위기에서 안전하게 턴을 넘길 수 있습니다.';
        reasonEn = 'Zero XP cost ensures safe turn progression without budget depletion.';
      }
    }

    // Contextual Rule 6: Critical Stamina (HP) shortage
    if (currentHp <= 32) {
      if (skill.id === 'A02_coffee_lunch' || skill.id === 'E20_emergency_leave') {
        score += 40;
        reasonKo = '과로로 쓰러질 위험(HP 저하)이 큽니다. 체력을 긴급 회복해야 합니다.';
        reasonEn = 'Severe overwork risk! Emergency stamina recovery is paramount.';
      }
    }

    // Contextual Rule 7: Low initial rapport on Turn 1
    if (battle.turnNumber === 1 && skill.id === 'A01_phone_call') {
      score += 24;
      reasonKo = '적은 비용으로 기자의 첫 취재 의도를 탐색하고 신뢰를 트기에 최적입니다.';
      reasonEn = 'Low-cost opener to probe journalist intent and build initial rapport.';
    }

    candidates.push({
      skill,
      preview,
      score,
      reasonKo,
      reasonEn,
    });
  }

  // Sort descending by calculated utility score
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, 3).map((item, idx) => ({
    skillId: item.skill.id,
    rank: (idx + 1) as 1 | 2 | 3,
    utilityScore: item.score,
    reasonKo: item.reasonKo,
    reasonEn: item.reasonEn,
    preview: item.preview,
  }));
}

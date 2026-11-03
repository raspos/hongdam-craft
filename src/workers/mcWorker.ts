import {
  CompanyScaleId,
  GameState,
  MonteCarloResult,
  StageNumber,
  StrategyPolicyId,
} from '../types/game';
import { runMonteCarloSurvival } from '../engine/analyticsEngine';

export interface MCWorkerRequest {
  id: string;
  kind: 'single' | 'scales_compare' | 'strategies_compare';
  baseState?: GameState;
  companyScale?: CompanyScaleId;
  experienceYears?: number;
  startStage?: StageNumber;
  strategyPolicy: StrategyPolicyId;
  iterations: number;
  seed: number;
}

export interface MCWorkerResponse {
  id: string;
  kind: MCWorkerRequest['kind'];
  singleResult?: MonteCarloResult;
  multiResults?: Record<string, MonteCarloResult>;
}

self.onmessage = (ev: MessageEvent<MCWorkerRequest>) => {
  const req = ev.data;
  if (req.kind === 'single') {
    const singleResult = runMonteCarloSurvival({
      baseState: req.baseState,
      companyScale: req.companyScale,
      experienceYears: req.experienceYears,
      startStage: req.startStage,
      strategyPolicy: req.strategyPolicy,
      iterations: req.iterations,
      seed: req.seed,
    });
    const res: MCWorkerResponse = { id: req.id, kind: 'single', singleResult };
    self.postMessage(res);
  } else if (req.kind === 'scales_compare') {
    const scales: CompanyScaleId[] = ['startup', 'sme', 'midsize', 'large', 'chaebol'];
    const multiResults: Record<string, MonteCarloResult> = {};
    scales.forEach((sc) => {
      multiResults[sc] = runMonteCarloSurvival({
        companyScale: sc,
        experienceYears: req.experienceYears ?? 7,
        startStage: 1,
        strategyPolicy: req.strategyPolicy,
        iterations: req.iterations,
        seed: req.seed,
      });
    });
    const res: MCWorkerResponse = { id: req.id, kind: 'scales_compare', multiResults };
    self.postMessage(res);
  } else if (req.kind === 'strategies_compare') {
    const policies: StrategyPolicyId[] = [
      'transparent_remedy',
      'fact_check',
      'relationship',
      'legal_defense',
      'big_budget',
      'random_baseline',
    ];
    const multiResults: Record<string, MonteCarloResult> = {};
    policies.forEach((pol) => {
      multiResults[pol] = runMonteCarloSurvival({
        companyScale: req.companyScale ?? 'midsize',
        experienceYears: req.experienceYears ?? 7,
        startStage: 1,
        strategyPolicy: pol,
        iterations: req.iterations,
        seed: req.seed,
      });
    });
    const res: MCWorkerResponse = { id: req.id, kind: 'strategies_compare', multiResults };
    self.postMessage(res);
  }
};

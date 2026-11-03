import { runMonteCarloSurvival } from '../engine/analyticsEngine';
import { CompanyScaleId, MonteCarloResult, StageNumber, StrategyPolicyId } from '../types/game';
import type { MCWorkerRequest, MCWorkerResponse } from './mcWorker';

let sharedWorker: Worker | null = null;
const pendingMap = new Map<string, (res: MCWorkerResponse) => void>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
  if (!sharedWorker) {
    try {
      sharedWorker = new Worker(new URL('./mcWorker.ts', import.meta.url), { type: 'module' });
      sharedWorker.onmessage = (ev: MessageEvent<MCWorkerResponse>) => {
        const resolver = pendingMap.get(ev.data.id);
        if (resolver) {
          pendingMap.delete(ev.data.id);
          resolver(ev.data);
        }
      };
    } catch {
      sharedWorker = null;
    }
  }
  return sharedWorker;
}

export async function runMonteCarloAsync(
  req: Omit<MCWorkerRequest, 'id'>
): Promise<MCWorkerResponse> {
  const id = `mc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const worker = getWorker();
  if (worker) {
    return new Promise((resolve) => {
      pendingMap.set(id, resolve);
      worker.postMessage({ ...req, id } satisfies MCWorkerRequest);
    });
  }

  // Fallback synchronous execution
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
    return { id, kind: 'single', singleResult };
  }
  if (req.kind === 'scales_compare') {
    const scales: CompanyScaleId[] = ['startup', 'sme', 'midsize', 'large', 'chaebol'];
    const multiResults: Record<string, MonteCarloResult> = {};
    scales.forEach((sc) => {
      multiResults[sc] = runMonteCarloSurvival({
        companyScale: sc,
        experienceYears: req.experienceYears ?? 7,
        startStage: 1 as StageNumber,
        strategyPolicy: req.strategyPolicy,
        iterations: req.iterations,
        seed: req.seed,
      });
    });
    return { id, kind: 'scales_compare', multiResults };
  }

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
      startStage: 1 as StageNumber,
      strategyPolicy: pol,
      iterations: req.iterations,
      seed: req.seed,
    });
  });
  return { id, kind: 'strategies_compare', multiResults };
}

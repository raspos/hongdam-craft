import { createPlaceholderGameState, GAME_STATE_VERSION } from '../engine/gameEngine';
import { GameState } from '../types/game';

const STORAGE_GAME_KEY = 'hongdam_craft_gamestate_v2';
const STORAGE_COMPLETED_HISTORY_KEY = 'hongdam_craft_completed_runs_v2';

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_GAME_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save game state to localStorage', err);
  }
}

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_GAME_KEY);
    if (!raw) return createPlaceholderGameState();
    const parsed = JSON.parse(raw) as GameState;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== GAME_STATE_VERSION ||
      !parsed.player ||
      !parsed.resources
    ) {
      return createPlaceholderGameState();
    }
    if (!Array.isArray(parsed.telemetryLogs)) parsed.telemetryLogs = [];
    if (!parsed.stageSnapshots) parsed.stageSnapshots = {};
    return parsed;
  } catch {
    return createPlaceholderGameState();
  }
}

export function clearSavedGameState(): GameState {
  try {
    localStorage.removeItem(STORAGE_GAME_KEY);
  } catch {}
  const fresh = createPlaceholderGameState();
  saveGameState(fresh);
  return fresh;
}

export function recordFinishedRunCount(): number {
  try {
    const cur = parseInt(localStorage.getItem(STORAGE_COMPLETED_HISTORY_KEY) || '0', 10) || 0;
    const next = cur + 1;
    localStorage.setItem(STORAGE_COMPLETED_HISTORY_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function getFinishedRunCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_COMPLETED_HISTORY_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

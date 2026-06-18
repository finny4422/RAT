export class WidgetSnapshotInvariantError extends Error {
  constructor(message = 'WidgetSnapshot must not be generated from stale lifecycle state.') {
    super(message);
    this.name = 'WidgetSnapshotInvariantError';
  }
}

let snapshotGateOpen = false;

export function openSnapshotGate(): void {
  snapshotGateOpen = true;
}

export function closeSnapshotGate(): void {
  snapshotGateOpen = false;
}

export function assertSnapshotGateOpen(): void {
  if (!snapshotGateOpen) {
    throw new WidgetSnapshotInvariantError();
  }
}

export function isSnapshotGateOpen(): boolean {
  return snapshotGateOpen;
}

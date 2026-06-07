export type Sensitivity = 'public' | 'internal' | 'private' | 'secret';
export type DocumentKind = 'runbook' | 'checklist' | 'reference' | 'calculator';

export interface LocalDocument {
  title: string;
  kind: DocumentKind;
  words: number;
  sensitivity: Sensitivity;
  updatedAt: string;
}

export interface WorkspaceInput {
  name: string;
  documents: LocalDocument[];
  cloudDependencies: number;
  encryptionEnabled: boolean;
  externalTrackers: number;
  offlineCriticality: number;
}

export interface SovereigntyScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  risks: string[];
}

export interface RemediationItem {
  priority: 'critical' | 'high' | 'medium';
  title: string;
  action: string;
  impact: number;
}


export interface ThreatVector {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  countermeasure: string;
}

export interface MissionPhase {
  phase: string;
  objective: string;
  durationHours: number;
  failureTrigger: string;
}

export interface AutonomyBrief {
  autonomyIndex: number;
  posture: 'demo' | 'harden' | 'deploy' | 'field-operate';
  nextBestAction: string;
  operatorPromise: string;
  threatVectors: ThreatVector[];
  missionPhases: MissionPhase[];
  powerBudget: {
    runtimeHours: number;
    packetReserveKilobytes: number;
    transferCycles: number;
  };
}

export interface SyncPacket {
  id: string;
  transport: 'manual-file-transfer';
  cloudEndpoints: string[];
  manifestHash: string;
  manifest: {
    workspace: string;
    deviceId: string;
    documents: Array<Pick<LocalDocument, 'title' | 'kind' | 'sensitivity' | 'updatedAt'>>;
    generatedAt: 'local-clock';
  };
}

export interface PacketPreview extends SyncPacket {
  fileName: string;
  payloadBytes: number;
  payloadHash: string;
  armor: string;
  readiness: 'field-ready' | 'needs-hardening';
}

export interface PacketVerification {
  status: 'trusted' | 'warning' | 'failed';
  summary: string;
  checks: Array<{
    label: string;
    ok: boolean;
    detail: string;
  }>;
}

const sensitivityWeight: Record<Sensitivity, number> = {
  public: 1,
  internal: 2,
  private: 3,
  secret: 4,
};

const sensitivityProtocol: Record<Sensitivity, string> = {
  secret: 'Confirm airplane mode, verify local unlock, then open only on trusted hardware.',
  private: 'Work locally, disable background sync, and export only through encrypted packets.',
  internal: 'Keep in the workspace vault and include in signed operational handoffs.',
  public: 'Safe to publish or print after content review.',
};

export function calculateSovereigntyScore(workspace: WorkspaceInput): SovereigntyScore {
  const offlineCriticality = clamp(workspace.offlineCriticality, 0, 10);
  const trackerPenalty = workspace.externalTrackers * 9;
  const cloudPenalty = workspace.cloudDependencies * 4;
  const encryptionBonus = workspace.encryptionEnabled ? 12 : -12;
  const localDocBonus = Math.min(workspace.documents.length * 2, 12);
  const criticalityBonus = offlineCriticality * 2.4;

  const raw = 58 + encryptionBonus + localDocBonus + criticalityBonus - trackerPenalty - cloudPenalty;
  const score = Math.round(clamp(raw, 0, 100));
  const grade = score >= 88 ? 'A' : score >= 74 ? 'B' : score >= 58 ? 'C' : 'D';

  const strengths = [
    workspace.encryptionEnabled ? 'Encrypted local vault enabled' : '',
    workspace.externalTrackers === 0 ? 'Zero external trackers' : '',
    workspace.documents.length >= 3 ? 'Operational knowledge captured locally' : '',
    offlineCriticality >= 8 ? 'Designed for high-consequence offline work' : '',
  ].filter(Boolean);

  const risks = [
    workspace.cloudDependencies === 1 ? '1 cloud dependency remains' : '',
    workspace.cloudDependencies > 1 ? `${workspace.cloudDependencies} cloud dependencies remain` : '',
    workspace.externalTrackers > 0 ? `${workspace.externalTrackers} external tracker${workspace.externalTrackers > 1 ? 's' : ''} detected` : '',
    !workspace.encryptionEnabled ? 'Vault encryption is disabled' : '',
  ].filter(Boolean);

  return { score, grade, strengths, risks };
}

export function estimateLocalFootprint(documents: LocalDocument[], encrypted: boolean) {
  const textKilobytes = documents.reduce((sum, doc) => sum + doc.words * 0.008, 0);
  const metadataKilobytes = documents.length * 3.5;
  const indexKilobytes = documents.reduce((sum, doc) => sum + sensitivityWeight[doc.sensitivity] * 1.4, 0);
  const encryptionOverhead = encrypted ? 1.22 : 1;
  const estimatedKilobytes = Math.ceil((textKilobytes + metadataKilobytes + indexKilobytes) * encryptionOverhead);

  return {
    documentCount: documents.length,
    estimatedKilobytes,
    syncPacketKilobytes: Math.ceil(estimatedKilobytes * (encrypted ? 1.38 : 1.12) + 8),
  };
}

export function generateRunbook(workspace: WorkspaceInput) {
  return [...workspace.documents]
    .sort((a, b) => sensitivityWeight[b.sensitivity] - sensitivityWeight[a.sensitivity] || b.words - a.words)
    .map((doc, index) => ({
      step: index + 1,
      title: doc.title,
      kind: doc.kind,
      sensitivity: doc.sensitivity,
      protocol: sensitivityProtocol[doc.sensitivity],
      checksumHint: `${slugify(workspace.name)}:${slugify(doc.title)}:${doc.updatedAt}`,
    }));
}

export function generateRemediationPlan(workspace: WorkspaceInput): RemediationItem[] {
  const items: RemediationItem[] = [];

  if (!workspace.encryptionEnabled) {
    items.push({
      priority: 'critical',
      title: 'Turn on vault encryption before capture',
      action: 'Enable passphrase-backed AES-GCM for every private, secret, and internal record.',
      impact: 24,
    });
  }

  if (workspace.externalTrackers > 0) {
    items.push({
      priority: 'high',
      title: 'Remove external telemetry and analytics',
      action: `Eliminate ${workspace.externalTrackers} tracker${workspace.externalTrackers > 1 ? 's' : ''} and replace metrics with local-only audit logs.`,
      impact: Math.min(30, workspace.externalTrackers * 9),
    });
  }

  if (workspace.cloudDependencies > 0) {
    items.push({
      priority: 'high',
      title: 'Create a no-cloud fallback route',
      action: `Replace ${workspace.cloudDependencies} cloud dependency${workspace.cloudDependencies > 1 ? 'ies' : ''} with encrypted packet export, LAN sync, or removable-media transfer.`,
      impact: Math.min(20, workspace.cloudDependencies * 4),
    });
  }

  if (workspace.documents.length < 5) {
    items.push({
      priority: 'medium',
      title: 'Capture missing operating knowledge',
      action: 'Add at least five local runbooks/checklists so the workspace remains useful under pressure.',
      impact: Math.max(2, (5 - workspace.documents.length) * 2),
    });
  }

  if (workspace.offlineCriticality < 8) {
    items.push({
      priority: 'medium',
      title: 'Define offline failure criteria',
      action: 'Document the point where the team must switch from cloud workflow to local-only operations.',
      impact: Math.round((8 - workspace.offlineCriticality) * 2.4),
    });
  }

  return items.sort((a, b) => b.impact - a.impact);
}


export function generateThreatModel(workspace: WorkspaceInput): ThreatVector[] {
  const vectors: ThreatVector[] = [];
  const secretDocs = workspace.documents.filter((document) => document.sensitivity === 'secret').length;
  const privateDocs = workspace.documents.filter((document) => document.sensitivity === 'private').length;

  if (!workspace.encryptionEnabled) {
    vectors.push({
      name: 'Local device compromise',
      severity: 'critical',
      likelihood: 9,
      countermeasure: 'Seal the vault with passphrase-backed encryption before any private capture.',
    });
  } else if (secretDocs > 0) {
    vectors.push({
      name: 'High-sensitivity vault exposure',
      severity: 'high',
      likelihood: Math.min(8, secretDocs + privateDocs + 2),
      countermeasure: 'Require packet verification and trusted-device unlock for every secret runbook.',
    });
  }

  if (workspace.externalTrackers > 0) {
    vectors.push({
      name: 'Telemetry leakage',
      severity: workspace.externalTrackers > 1 ? 'critical' : 'high',
      likelihood: Math.min(10, workspace.externalTrackers * 4),
      countermeasure: 'Remove external scripts and replace analytics with local-only event journaling.',
    });
  }

  if (workspace.cloudDependencies > 0) {
    vectors.push({
      name: 'Cloud lockout or vendor seizure',
      severity: workspace.cloudDependencies > 2 ? 'critical' : 'high',
      likelihood: Math.min(10, workspace.cloudDependencies * 3),
      countermeasure: 'Create removable-media, LAN, or printed-fallback transfer routes for every dependency.',
    });
  }

  if (workspace.offlineCriticality >= 8) {
    vectors.push({
      name: 'Network-denied operation window',
      severity: 'high',
      likelihood: workspace.offlineCriticality,
      countermeasure: 'Pre-stage runbooks, calculators, packet verifier, and power budget before deployment.',
    });
  }

  if (workspace.documents.length < 5) {
    vectors.push({
      name: 'Knowledge gap under pressure',
      severity: 'medium',
      likelihood: Math.max(3, 7 - workspace.documents.length),
      countermeasure: 'Capture missing checklists until the workspace can run without tribal memory.',
    });
  }

  if (vectors.length === 0) {
    vectors.push({
      name: 'Residual operator error',
      severity: 'low',
      likelihood: 2,
      countermeasure: 'Keep rehearsal cadence and packet verification rituals active.',
    });
  }

  return vectors.sort((left, right) => severityRank(right.severity) - severityRank(left.severity) || right.likelihood - left.likelihood);
}

export function generateMissionPhases(workspace: WorkspaceInput, runtimeHours: number): MissionPhase[] {
  const safeRuntime = Math.max(0.5, runtimeHours);
  const captureHours = clamp(safeRuntime * 0.18, 0.5, 4);
  const operateHours = clamp(safeRuntime * 0.55, 1, 18);
  const handoffHours = clamp(safeRuntime * 0.17, 0.5, 6);
  const reserveHours = clamp(safeRuntime - captureHours - operateHours - handoffHours, 0.5, 8);

  return [
    {
      phase: '01 / capture',
      objective: `Freeze ${workspace.documents.length} critical document${workspace.documents.length === 1 ? '' : 's'} into a local runbook order.`,
      durationHours: roundOne(captureHours),
      failureTrigger: 'Stop capture if any required checklist remains cloud-only.',
    },
    {
      phase: '02 / operate',
      objective: 'Use the local desk as the source of truth while network access is optional or unavailable.',
      durationHours: roundOne(operateHours),
      failureTrigger: 'Switch to paper or cold-spare device if battery reserve falls below 20%.',
    },
    {
      phase: '03 / handoff',
      objective: 'Seal, transfer, and verify .cipherpacket payloads on receiving hardware.',
      durationHours: roundOne(handoffHours),
      failureTrigger: 'Reject the handoff if manifest, filename, armor, or cloud-endpoint checks fail.',
    },
    {
      phase: '04 / reserve',
      objective: 'Hold energy and operator attention for recovery, audit, and after-action notes.',
      durationHours: roundOne(reserveHours),
      failureTrigger: 'Declare degraded mode when reserve cannot cover one more packet verification cycle.',
    },
  ];
}

export function buildAutonomyBrief(workspace: WorkspaceInput, batteryWh: number, watts: number): AutonomyBrief {
  const score = calculateSovereigntyScore(workspace);
  const remediation = generateRemediationPlan(workspace);
  const footprint = estimateLocalFootprint(workspace.documents, workspace.encryptionEnabled);
  const runtimeHours = roundOne(Math.max(0, batteryWh / Math.max(1, watts)));
  const threatVectors = generateThreatModel(workspace);
  const missionPhases = generateMissionPhases(workspace, runtimeHours);
  const threatPenalty = threatVectors.reduce((sum, vector) => sum + severityRank(vector.severity) * vector.likelihood, 0) / 5;
  const remediationPenalty = remediation.reduce((sum, item) => sum + item.impact, 0) / 3;
  const runtimeBonus = Math.min(16, runtimeHours * 1.2);
  const autonomyIndex = Math.round(clamp(score.score + runtimeBonus - threatPenalty - remediationPenalty, 0, 100));
  const posture = autonomyIndex >= 92 ? 'field-operate' : autonomyIndex >= 80 ? 'deploy' : autonomyIndex >= 58 ? 'harden' : 'demo';
  const nextBestAction = remediation[0]?.action ?? threatVectors[0]?.countermeasure ?? 'Run one rehearsal, export a packet, and verify it on a second trusted device.';

  return {
    autonomyIndex,
    posture,
    nextBestAction,
    operatorPromise: posture === 'field-operate'
      ? 'This workspace can function as a field operations desk without depending on the cloud.'
      : 'This workspace has a clear hardening route before it should be trusted under pressure.',
    threatVectors,
    missionPhases,
    powerBudget: {
      runtimeHours,
      packetReserveKilobytes: Math.ceil(footprint.syncPacketKilobytes * Math.max(2, workspace.documents.length)),
      transferCycles: Math.max(1, Math.floor(runtimeHours / 1.5)),
    },
  };
}

export function buildSyncPacket(workspace: WorkspaceInput, deviceId: string): SyncPacket {
  const manifest = {
    workspace: workspace.name,
    deviceId,
    documents: workspace.documents.map((doc) => ({
      title: doc.title,
      kind: doc.kind,
      sensitivity: doc.sensitivity,
      updatedAt: doc.updatedAt,
    })),
    generatedAt: 'local-clock' as const,
  };
  const manifestText = stableStringify(manifest);

  return {
    id: `cipherdesk-${slugify(workspace.name)}-${shortHash(manifestText).slice(0, 10)}`,
    transport: 'manual-file-transfer' as const,
    cloudEndpoints: [] as string[],
    manifestHash: pseudoSha256(manifestText),
    manifest,
  };
}

export function buildPacketPreview(workspace: WorkspaceInput, deviceId: string): PacketPreview {
  const packet = buildSyncPacket(workspace, deviceId);
  const score = calculateSovereigntyScore(workspace);
  const footprint = estimateLocalFootprint(workspace.documents, workspace.encryptionEnabled);
  const runbook = generateRunbook(workspace);
  const remediation = generateRemediationPlan(workspace);
  const sealedPayload = stableStringify({ packet, score, footprint, runbook, remediation });
  const payloadHash = pseudoSha256(sealedPayload);
  const armor = chunk(`${packet.id}.${payloadHash}.${shortHash(sealedPayload)}`, 16).join('-');

  return {
    ...packet,
    fileName: `${packet.id}.cipherpacket`,
    payloadBytes: new TextEncoder().encode(sealedPayload).length,
    payloadHash,
    armor,
    readiness: score.score >= 88 && remediation.length <= 1 ? 'field-ready' : 'needs-hardening',
  };
}

export function verifyPacketJson(rawPacket: string): PacketVerification {
  let packet: PacketPreview;

  try {
    packet = JSON.parse(rawPacket) as PacketPreview;
  } catch {
    return {
      status: 'failed',
      summary: 'Packet is not valid JSON.',
      checks: [{ label: 'Readable packet', ok: false, detail: 'Paste a complete .cipherpacket JSON payload.' }],
    };
  }

  const checks: PacketVerification['checks'] = [];
  const manifestText = isPlainObject(packet.manifest) ? stableStringify(packet.manifest) : '';
  const expectedManifestHash = manifestText ? pseudoSha256(manifestText) : '';
  const expectedFileName = typeof packet.id === 'string' ? `${packet.id}.cipherpacket` : '';
  const armorToken = typeof packet.armor === 'string' ? packet.armor.replace(/-/g, '') : '';

  const manifestHashOk = Boolean(expectedManifestHash && packet.manifestHash === expectedManifestHash);
  checks.push({
    label: 'Manifest hash',
    ok: manifestHashOk,
    detail: manifestHashOk
      ? 'Manifest matches its recorded hash.'
      : expectedManifestHash
        ? 'Manifest hash drift detected; packet contents may have been edited.'
        : 'Manifest is missing or malformed.',
  });

  checks.push({
    label: 'No cloud endpoints',
    ok: Array.isArray(packet.cloudEndpoints) && packet.cloudEndpoints.length === 0,
    detail: Array.isArray(packet.cloudEndpoints) ? `${packet.cloudEndpoints.length} cloud endpoint(s) declared.` : 'cloudEndpoints must be an array.',
  });

  checks.push({
    label: 'Manual transfer only',
    ok: packet.transport === 'manual-file-transfer',
    detail: `Transport: ${String(packet.transport ?? 'missing')}`,
  });

  checks.push({
    label: 'Filename binding',
    ok: Boolean(expectedFileName && packet.fileName === expectedFileName),
    detail: expectedFileName ? `Expected ${expectedFileName}.` : 'Packet id is missing.',
  });

  checks.push({
    label: 'Armor fingerprint',
    ok: Boolean(typeof packet.payloadHash === 'string' && packet.payloadHash.length === 64 && armorToken.includes(packet.payloadHash.slice(0, 18))),
    detail: typeof packet.payloadHash === 'string' ? 'Armor contains the payload fingerprint prefix.' : 'payloadHash is missing.',
  });

  checks.push({
    label: 'Field readiness',
    ok: packet.readiness === 'field-ready',
    detail: packet.readiness === 'field-ready' ? 'Packet marked ready to seal.' : 'Packet still needs hardening before transfer.',
  });

  const failedChecks = checks.filter((check) => !check.ok);
  const structuralFailures = failedChecks.filter((check) => check.label !== 'Field readiness');

  if (structuralFailures.length > 0) {
    return { status: 'failed', summary: `${structuralFailures.length} integrity check(s) failed. Do not trust this packet.`, checks };
  }

  if (failedChecks.length > 0) {
    return { status: 'warning', summary: 'Packet integrity is intact, but the workspace still needs hardening.', checks };
  }

  return { status: 'trusted', summary: 'Packet integrity verified and ready for manual transfer.', checks };
}

export const demoWorkspace: WorkspaceInput = {
  name: 'Sovereign Ops Desk',
  documents: [
    { title: 'Disaster comms restart', kind: 'runbook', words: 920, sensitivity: 'secret', updatedAt: '2026-06-06' },
    { title: 'Offline AI model notes', kind: 'reference', words: 680, sensitivity: 'private', updatedAt: '2026-06-04' },
    { title: 'Field inventory delta', kind: 'checklist', words: 340, sensitivity: 'internal', updatedAt: '2026-06-01' },
    { title: 'Solar runtime calculator', kind: 'calculator', words: 210, sensitivity: 'public', updatedAt: '2026-05-30' },
  ],
  cloudDependencies: 0,
  encryptionEnabled: true,
  externalTrackers: 0,
  offlineCriticality: 10,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function shortHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function pseudoSha256(input: string) {
  const parts = Array.from({ length: 8 }, (_, index) => shortHash(`${index}:${input}:${input.length}`));
  return parts.join('').slice(0, 64);
}

function chunk(value: string, size: number) {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}


function severityRank(severity: ThreatVector['severity']) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

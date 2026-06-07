import { describe, expect, it } from 'vitest';
import {
  buildAutonomyBrief,
  buildPacketPreview,
  buildSyncPacket,
  calculateSovereigntyScore,
  estimateLocalFootprint,
  generateMissionPhases,
  generateRemediationPlan,
  generateRunbook,
  generateThreatModel,
  verifyPacketJson,
  type WorkspaceInput,
} from './privacyEngine';

const workspace: WorkspaceInput = {
  name: 'Field Lab Alpha',
  documents: [
    { title: 'Network recovery', kind: 'runbook', words: 840, sensitivity: 'secret', updatedAt: '2026-06-01' },
    { title: 'Medication checklist', kind: 'checklist', words: 260, sensitivity: 'private', updatedAt: '2026-06-03' },
    { title: 'Parts inventory', kind: 'reference', words: 510, sensitivity: 'internal', updatedAt: '2026-05-28' },
  ],
  cloudDependencies: 1,
  encryptionEnabled: true,
  externalTrackers: 0,
  offlineCriticality: 9,
};

const sealedWorkspace: WorkspaceInput = {
  name: 'Sealed Field Vault',
  documents: [
    { title: 'Network recovery', kind: 'runbook', words: 840, sensitivity: 'secret', updatedAt: '2026-06-01' },
    { title: 'Medication checklist', kind: 'checklist', words: 260, sensitivity: 'private', updatedAt: '2026-06-03' },
    { title: 'Parts inventory', kind: 'reference', words: 510, sensitivity: 'internal', updatedAt: '2026-05-28' },
    { title: 'Radio restoration', kind: 'runbook', words: 410, sensitivity: 'internal', updatedAt: '2026-05-30' },
    { title: 'Solar runtime', kind: 'calculator', words: 320, sensitivity: 'public', updatedAt: '2026-05-31' },
  ],
  cloudDependencies: 0,
  encryptionEnabled: true,
  externalTrackers: 0,
  offlineCriticality: 10,
};

describe('privacy engine', () => {
  it('scores local sovereignty from privacy posture and offline criticality', () => {
    const score = calculateSovereigntyScore(workspace);

    expect(score.grade).toBe('A');
    expect(score.score).toBeGreaterThanOrEqual(88);
    expect(score.risks).toContain('1 cloud dependency remains');
    expect(score.strengths).toContain('Zero external trackers');
  });

  it('estimates local storage footprint with encrypted sync overhead', () => {
    const footprint = estimateLocalFootprint(workspace.documents, true);

    expect(footprint.documentCount).toBe(3);
    expect(footprint.estimatedKilobytes).toBeGreaterThan(16);
    expect(footprint.syncPacketKilobytes).toBeGreaterThan(footprint.estimatedKilobytes);
  });

  it('generates deterministic runbook sections ordered by sensitivity', () => {
    const runbook = generateRunbook(workspace);

    expect(runbook[0].title).toBe('Network recovery');
    expect(runbook[0].protocol).toContain('airplane mode');
    expect(runbook.at(-1)?.title).toBe('Parts inventory');
  });

  it('builds a portable sync packet without cloud endpoints', () => {
    const packet = buildSyncPacket(workspace, 'device-parker-mac-mini');

    expect(packet.id).toMatch(/^cipherdesk-/);
    expect(packet.transport).toBe('manual-file-transfer');
    expect(packet.cloudEndpoints).toEqual([]);
    expect(packet.manifestHash.length).toBe(64);
  });

  it('changes the packet hash when nested document metadata changes', () => {
    const original = buildSyncPacket(workspace, 'device-parker-mac-mini');
    const modified = buildSyncPacket(
      {
        ...workspace,
        documents: workspace.documents.map((document) =>
          document.title === 'Parts inventory' ? { ...document, updatedAt: '2026-06-06' } : document,
        ),
      },
      'device-parker-mac-mini',
    );

    expect(modified.manifestHash).not.toBe(original.manifestHash);
    expect(modified.id).not.toBe(original.id);
  });

  it('prioritizes hardening steps by expected sovereignty impact', () => {
    const exposedWorkspace: WorkspaceInput = {
      ...workspace,
      encryptionEnabled: false,
      externalTrackers: 2,
      cloudDependencies: 3,
      documents: workspace.documents.slice(0, 2),
    };

    const plan = generateRemediationPlan(exposedWorkspace);

    expect(plan[0].title).toBe('Turn on vault encryption before capture');
    expect(plan.map((item) => item.title)).toContain('Remove external telemetry and analytics');
    expect(plan.map((item) => item.title)).toContain('Create a no-cloud fallback route');
  });

  it('assembles a field packet preview with deterministic armor and file name', () => {
    const preview = buildPacketPreview(workspace, 'device-parker-mac-mini');

    expect(preview.fileName).toMatch(/\.cipherpacket$/);
    expect(preview.payloadBytes).toBeGreaterThan(500);
    expect(preview.payloadHash).toHaveLength(64);
    expect(preview.armor).toContain('cipherdesk-field');
    expect(preview.readiness).toBe('needs-hardening');
  });

  it('verifies a sealed packet that is field-ready and structurally intact', () => {
    const preview = buildPacketPreview(sealedWorkspace, 'field-tablet-02');
    const verification = verifyPacketJson(JSON.stringify(preview));

    expect(preview.readiness).toBe('field-ready');
    expect(verification.status).toBe('trusted');
    expect(verification.checks.every((check) => check.ok)).toBe(true);
  });

  it('warns when packet integrity is intact but the workspace needs hardening', () => {
    const preview = buildPacketPreview(workspace, 'device-parker-mac-mini');
    const verification = verifyPacketJson(JSON.stringify(preview));

    expect(verification.status).toBe('warning');
    expect(verification.checks.find((check) => check.label === 'Field readiness')?.ok).toBe(false);
  });

  it('rejects tampered packet manifests and injected cloud endpoints', () => {
    const preview = buildPacketPreview(sealedWorkspace, 'field-tablet-02');
    const tampered = {
      ...preview,
      cloudEndpoints: ['https://vendor-sync.example'],
      manifest: {
        ...preview.manifest,
        documents: preview.manifest.documents.map((document, index) =>
          index === 0 ? { ...document, title: 'Injected recovery plan' } : document,
        ),
      },
    };

    const verification = verifyPacketJson(JSON.stringify(tampered));

    expect(verification.status).toBe('failed');
    expect(verification.checks.find((check) => check.label === 'Manifest hash')?.ok).toBe(false);
    expect(verification.checks.find((check) => check.label === 'No cloud endpoints')?.ok).toBe(false);
  });

  it('rejects malformed packet JSON', () => {
    const verification = verifyPacketJson('{not-json');

    expect(verification.status).toBe('failed');
    expect(verification.summary).toContain('not valid JSON');
  });

  it('generates an operator threat model ranked by severity and likelihood', () => {
    const threats = generateThreatModel({
      ...workspace,
      encryptionEnabled: false,
      externalTrackers: 2,
      cloudDependencies: 3,
    });

    expect(threats[0].severity).toBe('critical');
    expect(threats.map((threat) => threat.name)).toContain('Local device compromise');
    expect(threats.map((threat) => threat.name)).toContain('Telemetry leakage');
  });

  it('allocates runtime into mission phases with explicit failure triggers', () => {
    const phases = generateMissionPhases(sealedWorkspace, 12.2);

    expect(phases).toHaveLength(4);
    expect(phases[0].phase).toContain('capture');
    expect(phases.every((phase) => phase.durationHours > 0)).toBe(true);
    expect(phases.map((phase) => phase.failureTrigger).join(' ')).toContain('packet verification');
  });

  it('builds an autonomy brief that combines privacy, power, threats, and next-best action', () => {
    const brief = buildAutonomyBrief(sealedWorkspace, 768, 36);

    expect(brief.autonomyIndex).toBeGreaterThanOrEqual(80);
    expect(brief.posture).toMatch(/deploy|field-operate/);
    expect(brief.powerBudget.runtimeHours).toBeCloseTo(21.3, 1);
    expect(brief.powerBudget.transferCycles).toBeGreaterThan(8);
    expect(brief.nextBestAction.length).toBeGreaterThan(20);
  });
});

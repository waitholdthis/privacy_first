import { describe, expect, it } from 'vitest';
import {
  buildPacketPreview,
  buildSyncPacket,
  calculateSovereigntyScore,
  estimateLocalFootprint,
  generateRemediationPlan,
  generateRunbook,
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
    expect(preview.armor).toContain('cipherdesk-field');
    expect(preview.readiness).toBe('needs-hardening');
  });
});

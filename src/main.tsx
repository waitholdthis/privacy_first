import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BatteryCharging,
  DatabaseZap,
  FileKey2,
  Fingerprint,
  HardDrive,
  LockKeyhole,
  Radar,
  CloudOff,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import {
  buildSyncPacket,
  calculateSovereigntyScore,
  demoWorkspace,
  estimateLocalFootprint,
  generateRunbook,
  type WorkspaceInput,
} from './core/privacyEngine';
import './styles.css';

const scenarios: WorkspaceInput[] = [
  demoWorkspace,
  {
    name: 'Field Medic Kit',
    documents: [
      { title: 'Medication cold-chain failover', kind: 'runbook', words: 760, sensitivity: 'secret', updatedAt: '2026-06-02' },
      { title: 'Patient transport checklist', kind: 'checklist', words: 430, sensitivity: 'private', updatedAt: '2026-06-03' },
      { title: 'Radio channel reference', kind: 'reference', words: 190, sensitivity: 'internal', updatedAt: '2026-05-29' },
    ],
    cloudDependencies: 1,
    encryptionEnabled: true,
    externalTrackers: 0,
    offlineCriticality: 9,
  },
  {
    name: 'Workshop Command Bench',
    documents: [
      { title: 'CNC recovery playbook', kind: 'runbook', words: 880, sensitivity: 'private', updatedAt: '2026-05-28' },
      { title: 'Parts substitution map', kind: 'reference', words: 540, sensitivity: 'internal', updatedAt: '2026-06-01' },
      { title: 'Battery runtime calculator', kind: 'calculator', words: 300, sensitivity: 'public', updatedAt: '2026-05-26' },
    ],
    cloudDependencies: 0,
    encryptionEnabled: true,
    externalTrackers: 0,
    offlineCriticality: 8,
  },
];

function App() {
  const [selected, setSelected] = useState(0);
  const [watts, setWatts] = useState(42);
  const [batteryWh, setBatteryWh] = useState(512);
  const [deviceId, setDeviceId] = useState('device-parker-mac-mini');
  const workspace = scenarios[selected];

  const score = useMemo(() => calculateSovereigntyScore(workspace), [workspace]);
  const footprint = useMemo(() => estimateLocalFootprint(workspace.documents, workspace.encryptionEnabled), [workspace]);
  const runbook = useMemo(() => generateRunbook(workspace), [workspace]);
  const syncPacket = useMemo(() => buildSyncPacket(workspace, deviceId), [workspace, deviceId]);
  const runtime = Math.max(0, Math.floor((batteryWh / Math.max(watts, 1)) * 10) / 10);

  return (
    <main>
      <section className="hero">
        <div className="aurora auroraOne" />
        <div className="aurora auroraTwo" />
        <nav className="nav">
          <div className="brand"><Fingerprint size={22} /> CipherDesk</div>
          <div className="pill"><CloudOff size={16} /> zero cloud required</div>
        </nav>
        <div className="heroGrid">
          <div className="copy">
            <div className="eyebrow"><ShieldCheck size={18} /> Strategy B: privacy-first / offline-first utility</div>
            <h1>Your personal operations desk when the internet becomes optional.</h1>
            <p>
              CipherDesk is a local-first workspace for high-consequence runbooks, technical calculators,
              field notes, and encrypted handoff packets. It is built for power users who want speed,
              sovereignty, and no data-harvesting cloud spine.
            </p>
            <div className="ctaRow">
              <a className="primary" href="#workbench">Open the local workbench</a>
              <a className="secondary" href="#privacy">Inspect privacy model</a>
            </div>
          </div>
          <div className="orbitalCard" aria-label="Sovereignty score panel">
            <div className="scanner" />
            <span className="tiny">LOCAL SOVEREIGNTY</span>
            <strong>{score.score}</strong>
            <span className={`grade grade${score.grade}`}>Grade {score.grade}</span>
            <div className="signalBars"><i /><i /><i /><i /><i /></div>
            <p>{workspace.name} is ready for encrypted manual transfer with {score.risks.length || 'no'} active risk flags.</p>
          </div>
        </div>
      </section>

      <section className="console" id="workbench">
        <div className="sectionHeader">
          <span><Radar size={18} /> Mission workbench</span>
          <h2>Three utilities. One local vault. No account creation.</h2>
        </div>

        <div className="scenarioSwitch" role="tablist" aria-label="Workspace scenarios">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.name}
              className={selected === index ? 'active' : ''}
              onClick={() => setSelected(index)}
              role="tab"
              aria-selected={selected === index}
            >
              {scenario.name}
            </button>
          ))}
        </div>

        <div className="dashboard">
          <article className="panel scorePanel">
            <header><LockKeyhole /> Sovereignty audit</header>
            <div className="scoreRing" style={{ '--score': `${score.score}%` } as React.CSSProperties}>
              <span>{score.score}</span>
            </div>
            <div className="chips">
              {score.strengths.map((item) => <span key={item}>{item}</span>)}
              {score.risks.map((item) => <span className="risk" key={item}>{item}</span>)}
            </div>
          </article>

          <article className="panel">
            <header><HardDrive /> Vault footprint</header>
            <div className="metric"><strong>{footprint.estimatedKilobytes} KB</strong><span>local encrypted index</span></div>
            <div className="metric"><strong>{footprint.syncPacketKilobytes} KB</strong><span>manual sync packet</span></div>
            <div className="meter"><i style={{ width: `${Math.min(92, footprint.syncPacketKilobytes)}%` }} /></div>
          </article>

          <article className="panel calculator">
            <header><BatteryCharging /> Offline runtime calculator</header>
            <label>Battery watt-hours<input value={batteryWh} onChange={(event) => setBatteryWh(Number(event.target.value))} type="number" /></label>
            <label>Device draw watts<input value={watts} onChange={(event) => setWatts(Number(event.target.value))} type="number" /></label>
            <div className="runtime"><strong>{runtime}h</strong><span>estimated local operating time</span></div>
          </article>
        </div>

        <div className="runbookGrid">
          <article className="panel wide">
            <header><Workflow /> Auto-generated operating runbook</header>
            <ol className="runbook">
              {runbook.map((step) => (
                <li key={step.title}>
                  <span>{String(step.step).padStart(2, '0')}</span>
                  <div><strong>{step.title}</strong><p>{step.protocol}</p><em>{step.sensitivity} • {step.kind} • {step.checksumHint}</em></div>
                </li>
              ))}
            </ol>
          </article>

          <article className="panel wide sync">
            <header><FileKey2 /> Secure sync packet</header>
            <label>Receiving device ID<input value={deviceId} onChange={(event) => setDeviceId(event.target.value)} /></label>
            <pre>{JSON.stringify(syncPacket, null, 2)}</pre>
          </article>
        </div>
      </section>

      <section className="privacy" id="privacy">
        <div className="sectionHeader centered">
          <span><DatabaseZap size={18} /> Product thesis</span>
          <h2>Power-user software should feel elite without making the user the product.</h2>
        </div>
        <div className="privacyCards">
          <div><h3>Local by default</h3><p>Documents, calculators, runbooks, and indexes are designed to live on-device first.</p></div>
          <div><h3>Sync without surveillance</h3><p>Handoff packets use manual file transfer patterns instead of vendor-controlled cloud storage.</p></div>
          <div><h3>Specialized utility surface</h3><p>The MVP targets technical operators: people who need calculators and procedure memory when networks fail.</p></div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

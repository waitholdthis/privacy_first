import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  BatteryCharging,
  BrainCircuit,
  CheckCircle2,
  Clipboard,
  CloudOff,
  DatabaseZap,
  Download,
  FileKey2,
  Fingerprint,
  HardDrive,
  LockKeyhole,
  Radar,
  ScanSearch,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import {
  buildAutonomyBrief,
  buildPacketPreview,
  calculateSovereigntyScore,
  demoWorkspace,
  estimateLocalFootprint,
  generateRemediationPlan,
  generateRunbook,
  verifyPacketJson,
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
  {
    name: 'Cloud-Leaky Baseline',
    documents: [
      { title: 'Shared SOP draft', kind: 'runbook', words: 420, sensitivity: 'private', updatedAt: '2026-06-05' },
      { title: 'Vendor login checklist', kind: 'checklist', words: 180, sensitivity: 'secret', updatedAt: '2026-06-04' },
    ],
    cloudDependencies: 3,
    encryptionEnabled: false,
    externalTrackers: 2,
    offlineCriticality: 6,
  },
];

function App() {
  const [selected, setSelected] = useState(0);
  const [watts, setWatts] = useState(42);
  const [batteryWh, setBatteryWh] = useState(512);
  const [deviceId, setDeviceId] = useState('device-parker-mac-mini');
  const [packetStatus, setPacketStatus] = useState('ready');
  const workspace = scenarios[selected];

  const score = useMemo(() => calculateSovereigntyScore(workspace), [workspace]);
  const footprint = useMemo(() => estimateLocalFootprint(workspace.documents, workspace.encryptionEnabled), [workspace]);
  const runbook = useMemo(() => generateRunbook(workspace), [workspace]);
  const remediation = useMemo(() => generateRemediationPlan(workspace), [workspace]);
  const packetPreview = useMemo(() => buildPacketPreview(workspace, deviceId), [workspace, deviceId]);
  const runtime = Math.max(0, Math.floor((batteryWh / Math.max(watts, 1)) * 10) / 10);
  const autonomyBrief = useMemo(() => buildAutonomyBrief(workspace, batteryWh, watts), [workspace, batteryWh, watts]);
  const packetJson = JSON.stringify(packetPreview, null, 2);
  const [verificationText, setVerificationText] = useState(packetJson);
  const packetVerification = useMemo(() => verifyPacketJson(verificationText), [verificationText]);

  useEffect(() => {
    setVerificationText(packetJson);
  }, [packetJson]);

  const resetPacketStatus = (value: string) => {
    setPacketStatus(value);
    window.setTimeout(() => setPacketStatus('ready'), 1800);
  };

  const copyPacket = async () => {
    await navigator.clipboard.writeText(packetJson);
    resetPacketStatus('copied');
  };

  const downloadPacket = () => {
    const blob = new Blob([packetJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = packetPreview.fileName;
    link.click();
    URL.revokeObjectURL(url);
    resetPacketStatus('downloaded');
  };

  const tamperPacket = () => {
    const cloned = JSON.parse(packetJson);
    cloned.cloudEndpoints = ['https://vendor-sync.example'];
    cloned.manifest.documents[0].title = 'Injected recovery plan';
    setVerificationText(JSON.stringify(cloned, null, 2));
  };

  const verificationIcon = packetVerification.status === 'trusted' ? <CheckCircle2 /> : <AlertTriangle />;

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
            <p>{workspace.name} is {packetPreview.readiness === 'field-ready' ? 'field-ready' : 'not sealed yet'} with {score.risks.length || 'no'} active risk flags.</p>
          </div>
        </div>
      </section>

      <section className="console" id="workbench">
        <div className="sectionHeader">
          <span><Radar size={18} /> Mission workbench</span>
          <h2>Audit the vault. Harden the risks. Seal and verify the packet.</h2>
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

        <div className="autonomyDeck">
          <article className="panel autonomyPrime">
            <header><BrainCircuit /> Autonomy command layer</header>
            <div className="autonomyScore">
              <strong>{autonomyBrief.autonomyIndex}</strong>
              <span>{autonomyBrief.posture}</span>
            </div>
            <p>{autonomyBrief.operatorPromise}</p>
            <div className="operatorAction">
              <span>next best action</span>
              <strong>{autonomyBrief.nextBestAction}</strong>
            </div>
          </article>

          <article className="panel threatPanel">
            <header><Radar /> Threat model</header>
            <div className="threatList">
              {autonomyBrief.threatVectors.slice(0, 4).map((threat) => (
                <div className={`threat ${threat.severity}`} key={threat.name}>
                  <span>{threat.severity}</span>
                  <div>
                    <strong>{threat.name}</strong>
                    <p>{threat.countermeasure}</p>
                    <em>likelihood {threat.likelihood}/10</em>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel missionPanel">
            <header><Workflow /> Mission timeline</header>
            <div className="missionList">
              {autonomyBrief.missionPhases.map((phase) => (
                <div key={phase.phase}>
                  <span>{phase.phase}</span>
                  <strong>{phase.durationHours}h</strong>
                  <p>{phase.objective}</p>
                  <em>{phase.failureTrigger}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="panel powerPanel">
            <header><BatteryCharging /> Field power budget</header>
            <div className="metric"><strong>{autonomyBrief.powerBudget.runtimeHours}h</strong><span>computed runtime</span></div>
            <div className="metric"><strong>{autonomyBrief.powerBudget.transferCycles}</strong><span>packet verification cycles</span></div>
            <div className="metric"><strong>{autonomyBrief.powerBudget.packetReserveKilobytes} KB</strong><span>packet reserve target</span></div>
          </article>
        </div>

        <div className="hardeningGrid">
          <article className="panel readiness">
            <header>{packetPreview.readiness === 'field-ready' ? <CheckCircle2 /> : <AlertTriangle />} Field readiness</header>
            <strong>{packetPreview.readiness === 'field-ready' ? 'Ready to seal' : 'Needs hardening'}</strong>
            <p>{remediation.length ? `${remediation.length} hardening step${remediation.length > 1 ? 's' : ''} recommended before field transfer.` : 'No high-impact hardening steps remain for this scenario.'}</p>
          </article>
          <article className="panel remediation">
            <header><ShieldCheck /> Hardening queue</header>
            {remediation.length ? remediation.map((item) => (
              <div className={`remediationItem ${item.priority}`} key={item.title}>
                <span>{item.priority}</span>
                <div><strong>{item.title}</strong><p>{item.action}</p><em>+{item.impact} potential sovereignty points</em></div>
              </div>
            )) : <p>All critical privacy posture checks are green.</p>}
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
            <div className="packetActions">
              <button onClick={copyPacket}><Clipboard size={16} /> Copy packet</button>
              <button onClick={downloadPacket}><Download size={16} /> Download .cipherpacket</button>
              <span>{packetStatus}</span>
            </div>
            <div className="packetMeta">
              <span>{packetPreview.fileName}</span>
              <span>{packetPreview.payloadBytes.toLocaleString()} bytes</span>
              <span>{packetPreview.payloadHash}</span>
              <span>{packetPreview.armor}</span>
            </div>
            <pre>{packetJson}</pre>
          </article>
        </div>

        <article className={`panel verifier ${packetVerification.status}`}>
          <header><ScanSearch /> Packet integrity verifier</header>
          <div className="verifierGrid">
            <div>
              <div className="verifierStatus">
                {verificationIcon}
                <strong>{packetVerification.status}</strong>
                <p>{packetVerification.summary}</p>
              </div>
              <div className="packetActions">
                <button onClick={() => setVerificationText(packetJson)}>Load generated packet</button>
                <button onClick={tamperPacket}>Simulate tampering</button>
              </div>
              <div className="verificationChecks">
                {packetVerification.checks.map((check) => (
                  <div className={check.ok ? 'ok' : 'bad'} key={check.label}>
                    <span>{check.ok ? 'pass' : 'fail'}</span>
                    <div><strong>{check.label}</strong><p>{check.detail}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <label>
              Paste received .cipherpacket JSON
              <textarea value={verificationText} onChange={(event) => setVerificationText(event.target.value)} />
            </label>
          </div>
        </article>
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

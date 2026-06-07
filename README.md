# CipherDesk

CipherDesk is a privacy-first, offline-first utility workspace for power users who are tired of bloated, cloud-dependent, data-harvesting software.

It turns Strategy B into a concrete product: a local operations desk for technical runbooks, specialized calculators, private documentation, and secure manual sync packets.

## Product thesis

There is an underserved market of operators, builders, field teams, privacy-conscious professionals, and technical power users who need software that remains useful when the network is unreliable or intentionally disabled.

CipherDesk is designed around that reality:

- no account requirement
- no external trackers
- no cloud endpoint assumption
- local-first document and calculator workflows
- encrypted manual sync as the default mental model
- high-craft interface instead of ugly enterprise utility design

## MVP features

- Sovereignty audit: scores a workspace by encryption posture, cloud dependencies, tracker exposure, local documentation depth, and offline criticality.
- Vault footprint estimator: estimates local encrypted index size and portable sync packet size.
- Offline runtime calculator: estimates battery-backed operating time for local devices.
- Runbook generator: orders operational notes by sensitivity and emits handling protocols.
- Secure sync packet manifest: creates a deterministic packet ID/hash without any cloud endpoint.
- Hardening queue: converts privacy posture risks into prioritized remediation steps with expected sovereignty impact.
- `.cipherpacket` preview: assembles a deterministic portable packet payload with copy/download controls for manual transfer workflows.
- Cinematic React/Vite interface with scenario switching and live calculations.

## Privacy model

Current MVP behavior:

- Runs entirely in the browser.
- Does not call any external API.
- Does not include analytics or tracking scripts.
- Does not require account creation.
- Uses deterministic local calculations only.

Future production direction:

- Store workspace data in IndexedDB.
- Encrypt vault records using WebCrypto AES-GCM with a user-held passphrase or hardware key.
- Export/import encrypted `.cipherpacket` files for manual sync via USB, AirDrop, Syncthing, local network, or user-owned storage.
- Add optional peer-to-peer sync without a centralized vendor data store.

## Latest improvement sprint

The second sprint turned CipherDesk from a static MVP demo into a sharper product workflow:

- Fixed nested packet hashing so document metadata changes now alter packet IDs/hashes.
- Added a deterministic packet preview builder with filename, payload byte count, readiness state, and armored packet fingerprint.
- Added risk remediation logic that prioritizes encryption, trackers, cloud dependencies, missing runbooks, and offline criteria.
- Added a fourth “Cloud-Leaky Baseline” scenario so the UI demonstrates both clean and compromised privacy postures.
- Added copy and download actions for the generated `.cipherpacket` preview.

## Stack

- React
- TypeScript
- Vite
- Vitest
- Lucide icons

## Commands

```bash
npm install
npm test
npm run build
npm run dev
```

## Development notes

The core engine lives in `src/core/privacyEngine.ts` and is covered by `src/core/privacyEngine.test.ts`, including packet hash determinism and hardening-queue behavior.

The interface lives in `src/main.tsx` and `src/styles.css`.

## Roadmap

1. Add real encrypted local vault persistence with IndexedDB + WebCrypto.
2. Upgrade `.cipherpacket` preview into passphrase-encrypted export/import.
3. Add user-created calculators: battery runtime, storage forecasting, network recovery, solar sizing, medication cold-chain windows, field inventory deltas.
4. Add markdown runbook editor with local full-text search.
5. Add optional local-only PWA install mode.
6. Add desktop shell through Tauri for filesystem-backed vaults.
7. Add mobile companion for scanning/importing packets without cloud storage.

## Strategic positioning

CipherDesk is not another notes app. It is a private operating layer for people who need their knowledge, calculations, and procedures to remain available under pressure.

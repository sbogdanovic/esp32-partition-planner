# ESP32 Partition Planner

![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)

Production-ready React + TypeScript single page application for designing ESP32 partition layouts and generating an ESP-IDF-compatible `partitions.csv`.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Supported Targets](#supported-targets)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [How to Use](#how-to-use)
- [Validation and Safety Rules](#validation-and-safety-rules)
- [Encryption Behavior](#encryption-behavior)
- [Project Structure](#project-structure)
- [Architecture Notes](#architecture-notes)
- [Quality Gates](#quality-gates)
- [CI Pipeline](#ci-pipeline)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Roadmap Ideas](#roadmap-ideas)

## Overview

This app helps firmware teams quickly iterate on partition strategies without manually calculating offsets, alignments, and flash budget constraints.

It is optimized for practical ESP-IDF workflows:

- tune partition sizes by flash target and strategy
- visualize usage and free space
- configure per-partition encryption choices
- download or copy a generated `partitions.csv`

## Key Features

- Preset-driven planning: `balanced`, `max_app`, `max_storage`, `production_secure`
- Partition strategies:
	- single-app factory layout
	- OTA with factory + `ota_0` + `ota_1`
	- OTA-only (`ota_0` + `ota_1`)
- Optional partitions:
	- `phy_init`
	- `nvs_keys`
	- `coredump`
	- `efuse_em` (with explicit warning that it is not recommended in production)
- Data filesystem support:
	- `none`
	- `spiffs`
	- `littlefs`
	- `fat`
- Visual partition map with encrypted status indicators
- CSV output with ESP-IDF-style columns and `encrypted` flags
- Full i18n text extraction (`src/i18n/en.json`)
- Type-safe codebase with strict TypeScript
- Domain regression tests (Vitest)
- ESLint v9 flat config with typed TypeScript rules
- GitHub Actions CI (lint, typecheck, test, build)

## Supported Targets

Chip variants:

- ESP32
- ESP32-S2
- ESP32-S3
- ESP32-C2
- ESP32-C3
- ESP32-C6
- ESP32-H2

Flash size options are variant-specific and validated in the UI.

## Quick Start

### 1) Prerequisites

- Node.js 20+
- npm 10+

### 2) Install dependencies

```bash
npm ci
```

### 3) Start development server

```bash
npm run dev
```

### 4) Create production build

```bash
npm run build
```

### 5) Preview production build locally

```bash
npm run preview
```

## Available Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: create optimized production bundle
- `npm run preview`: serve built assets locally
- `npm run test`: run Vitest test suite
- `npm run typecheck`: TypeScript compile checks (`--noEmit`)
- `npm run lint`: lint source and Vite config
- `npm run lint:fix`: apply safe lint autofixes

## How to Use

1. Select chip variant and flash size.
2. Pick a preset for a baseline layout.
3. Adjust strategy, app slots, NVS, optional partitions, and filesystem.
4. Configure partition encryption options.
5. Review summary, warnings/errors, and visual partition map.
6. Copy or download generated `partitions.csv`.

For ESP-IDF projects, place the output in your project as `partitions.csv` and configure your build to use a custom partition table.

## Validation and Safety Rules

The planner applies domain constraints automatically:

- sector alignment at 4 KiB (`0x1000`)
- app alignment at 64 KiB (`0x10000`)
- partition table base assumptions compatible with ESP-IDF defaults
- overflow detection if total layout exceeds flash size
- low-free-space warning when unallocated flash is below 128 KiB
- NVS minimum-size recommendation warning
- app-slot headroom warning against firmware target
- small SPIFFS efficiency warning

If `efuse_em` is enabled, it is placed last and a production warning is emitted.

## Encryption Behavior

The tool models practical encryption behavior in ESP-IDF environments:

- App partitions are treated as enforced encrypted when flash encryption is on.
- `otadata` and `nvs_keys` are treated as enforced encrypted.
- Optional partitions (`nvs`, `coredump`, `storage`, `phy_init`, `efuse_em`) can be user-selected.
- UI tooltips explain recommended vs optional encryption decisions.
- Generated CSV includes `encrypted` in the `Flags` column where applicable.

## Project Structure

```text
.
├── .github/workflows/ci.yml
├── src
│   ├── i18n
│   │   ├── en.json
│   │   └── index.ts
│   ├── modules/planner
│   │   ├── components
│   │   ├── domain
│   │   └── hooks
│   ├── App.tsx
│   └── main.tsx
├── eslint.config.js
├── tsconfig.json
└── vite.config.ts
```

## Architecture Notes

- Domain logic is centralized in `src/modules/planner/domain/partitionEngine.ts`.
- State orchestration uses reducer-based hook in `src/modules/planner/hooks/usePlanner.ts`.
- UI is split into small presentational components in `src/modules/planner/components`.
- i18n lookup helper is in `src/i18n/index.ts`, with strings in `src/i18n/en.json`.

This separation keeps calculations deterministic and testable while keeping the UI composable.

## Quality Gates

Before merging changes, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Unit tests currently focus on partition engine correctness:

- flash overflow detection
- app alignment guarantees
- eFuse partition ordering
- encryption flag correctness
- CSV output structure

## CI Pipeline

Workflow: `.github/workflows/ci.yml`

Triggers:

- push (all branches)
- pull requests

Jobs:

- `lint`
- `typecheck`
- `test`
- `build` (depends on previous three)

Concurrency is enabled to cancel stale runs for the same ref.

### CI Badge Snippet

Replace placeholders and use:

```md
![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)
```

## Configuration

Core constants are defined in `src/modules/planner/domain/constants.ts`, including:

- sector size
- app alignment
- partition table offsets
- variant flash-size availability
- default encryption selections

Preset behavior is defined in `src/modules/planner/domain/presets.ts`.

## Troubleshooting

- Clipboard copy may fail on `file://` URLs in some browsers due to security restrictions; use download as fallback.
- If lint fails on local setup differences, use the repo Node/npm versions from this README and reinstall with `npm ci`.
- If generated layout exceeds flash, reduce app slot size and/or filesystem size, or switch preset/strategy.

## Roadmap Ideas

- Add import/export for planner state JSON
- Add E2E browser tests
- Add downloadable sample configurations per chip family
- Add localization bundles beyond English

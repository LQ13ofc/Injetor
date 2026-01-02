
# 🚀 Flux Core Nexus v5.0 - God Mode Edition

![Flux Core Banner](https://img.shields.io/badge/Flux_Core-v5.0_God_Mode-blue?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-UNDETECTED-green?style=for-the-badge) ![Platform](https://img.shields.io/badge/Platform-Windows_10%2F11-blue?style=for-the-badge)

**Flux Core Nexus** is a next-generation script execution environment designed for reverse engineering, game penetration testing, and real-time behavior modification.

> **Note:** This application relies on low-level Windows APIs (`kernel32`, `ntdll`) for memory manipulation. It is **Windows Only**.

---

## ⚡ Quick Start Guide

### 1. Pre-requisites
- **Node.js** (LTS version recommended)
- **Visual C++ Build Tools** (Windows) for compiling native dependencies like `koffi`.

### 2. Installation
Run the following command in the project root to install dependencies and rebuild native modules for Electron:

```bash
npm install
```

### 3. Build Application
This command cleans previous builds and generates the installer for your current OS:

```bash
npm run build:auto
```

The output files (Installer/Executable) will be located in the `release/` directory.

---

## 🔧 Troubleshooting

### 🔴 Native Bindings Error / Koffi Failed to Load
**Cause:** The `koffi` library was compiled for Node.js but is running inside Electron.
**Solution:**
Run the rebuild command manually:
```bash
npm run postinstall
```

### 🔴 EBUSY: Resource busy or locked
**Cause:** A previous instance of the app or the builder is still running in the background.
**Solution:**
1. Close Flux Core.
2. Open Task Manager.
3. Kill any `electron`, `Flux Core Nexus`, or `node` processes.
4. Try building again.

---

**Developed by Nexus Dev Team.**
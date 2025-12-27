# 🚀 Flux Core Nexus v4.1 - God Mode Edition

![Flux Core Banner](https://img.shields.io/badge/Flux_Core-v4.1_God_Mode-blue?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-UNDETECTED-green?style=for-the-badge) ![Platform](https://img.shields.io/badge/Platform-Windows_%7C_Linux_%7C_macOS-lightgrey?style=for-the-badge)

**Flux Core Nexus** é um ambiente de execução de scripts de última geração ("Executor") projetado para engenharia reversa, testes de penetração em jogos e modificação de comportamento em tempo real.

---

## ⚡ Guia de Instalação Rápida

Siga estes passos exatos para compilar o projeto sem erros.

### 1. Preparar Ambiente
Se certifique de fechar qualquer instância aberta do Flux Core antes de começar. Se deu erro **EBUSY**, verifique o Gerenciador de Tarefas e feche processos `electron.exe` travados.

### 2. Instalar
Execute no terminal na pasta do projeto:

```bash
npm install
```

### 3. Gerar Executável (Build)
Este comando detecta seu sistema, limpa builds anteriores e cria o instalador novo:

```bash
npm run build:auto
```

O executável final (Setup) aparecerá na pasta `dist/`.
*   **Windows:** `Flux Core Nexus Setup 4.1.0.exe`
*   **Linux:** `Flux Core Nexus-4.1.0.AppImage`

---

## 🔧 Solução de Problemas Comuns

### 🔴 Erro: `EBUSY: resource busy or locked`
**Causa:** Você tentou fazer o build enquanto o programa estava aberto ou um processo "zumbi" ficou travado no fundo.
**Solução:**
1.  Feche o Flux Core se estiver aberto.
2.  Abra o **Gerenciador de Tarefas** (Ctrl+Shift+Esc).
3.  Procure por processos `electron.exe` ou `Flux Core Nexus` e finalize-os.
4.  Tente rodar `npm run build:auto` novamente.

### 🔴 Erro: `Binary not found on disk` ao rodar `npm start`
**Status:** Normal.
Isso apenas avisa que você não compilou a DLL C++ (`FluxCore_x64.dll`). O aplicativo funcionará em **Modo Remote Bridge** (interface completa, mas injeção simulada). Para uso real em jogos, você precisa compilar o código C++ na pasta `/native`.

### 🔴 Tela Branca / Crash
Se a janela ficar preta ou invisível:
1.  Isso pode ser incompatibilidade de GPU com a transparência.
2.  Edite `electron-main.js` e mude `transparent: true` para `false` e `frame: false` para `true` temporariamente para testar.

---

**Desenvolvido por Nexus Dev Team.**

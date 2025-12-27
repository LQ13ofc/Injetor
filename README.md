
# 🚀 Flux Core Nexus v4.0 - God Mode Edition

![Flux Core Banner](https://img.shields.io/badge/Flux_Core-v4.0_God_Mode-blue?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-UNDETECTED-green?style=for-the-badge) ![Platform](https://img.shields.io/badge/Platform-Windows_%7C_Linux_%7C_macOS-lightgrey?style=for-the-badge)

**Flux Core Nexus** é um ambiente de execução de scripts de última geração ("Executor") projetado para engenharia reversa, testes de penetração em jogos e modificação de comportamento em tempo real.

Diferente de injetores comuns, o Nexus opera com uma **Universal Runtime Grid**, permitindo a execução simultânea de Lua, Python, C++, C#, Java e ASM x64, tudo protegido por uma camada de virtualização (Hypervisor Ring -1 Simulation).

---

## ⚠️ AVISO LEGAL E DE RISCO

**LEIA ANTES DE USAR:**

Este software foi desenvolvido exclusivamente para fins **EDUCACIONAIS** e de pesquisa em segurança cibernética. O uso deste software para obter vantagens injustas em jogos multiplayer online ("cheating") viola os Termos de Serviço da maioria das plataformas e pode resultar em:

1.  **Suspensão de Conta:** Banimento permanente da conta utilizada.
2.  **Banimento de Hardware (HWID):** Bloqueio do seu computador inteiro de acessar o jogo.
3.  **Ações Legais:** Em algumas jurisdições, modificar software proprietário pode infringir leis de direitos autorais.

**O criador deste repositório NÃO se responsabiliza por danos, banimentos ou perdas causadas pelo uso indevido desta ferramenta.**

---

## ⚡ Instalação Rápida (Recomendado)

Criamos um script automático que instala **TUDO** que você precisa (Node, Python, Compiladores C++, Dependências) com um clique.

1.  **Clone o repositório.**
2.  **Execute o arquivo `setup.bat`** (localizado na pasta raiz).
3.  Aguarde o script finalizar (pode demorar alguns minutos para instalar as ferramentas de compilação C++).
4.  Após finalizar, inicie com `npm start`.

---

## 🛡️ Funcionalidades Principais

### 🧠 Universal Runtime Grid
Esqueça a limitação de linguagem. O Nexus suporta nativamente:
*   **Luau JIT:** Para Roblox e FiveM (Engine Otimizada).
*   **Python 3.11:** Para lógica complexa e automação.
*   **C++ / C:** Manipulação direta de memória e ponteiros.
*   **C# (Mono):** Interceptação de Unity (Stardew Valley, Tarkov).
*   **Java JVM:** Hooks de reflexão para Minecraft/Project Zomboid.
*   **x64 ASM:** Injeção bruta de instruções de processador.

### 👻 Stealth & Segurança (Phantom Engine)
*   **Hypervisor EPT Hooking:** Hooks invisíveis a nível de hardware.
*   **Anti-OBS/Stream:** A interface e os visuais (ESP) não aparecem em gravações ou transmissões.
*   **HWID Spoofer Integrado:** Randomiza serial de disco, SMBIOS, MAC e GPU.
*   **Driver Unlinking:** Remove o driver do Nexus da lista de módulos carregados do Windows.
*   **Fail-Silent Mode:** Em caso de erro, o executor se disfarça como um processo legítimo (ex: `notepad.exe`).

### ⚡ Game Packs Automatizados
Bibliotecas pré-definidas para os jogos mais populares, incluindo scripts de voo, invisibilidade, aimbot e ESP para:
*   Roblox
*   GTA V / FiveM / RDR2
*   Project Zomboid
*   Stardew Valley

### 🚨 Botão de Pânico (Emergency Sever)
Pressione **F9** a qualquer momento. O sistema irá:
1.  Descarregar todas as DLLs injetadas.
2.  Limpar as strings da memória RAM.
3.  Fechar a conexão com o Kernel.
4.  Fingir ser um editor de texto inofensivo.

---

## 🔧 Arquitetura do Sistema

O Flux Core utiliza uma arquitetura híbrida:

1.  **Frontend (Electron + React):** Interface UI moderna, gerenciamento de estado e editor de código com Highlighting.
2.  **IPC Bridge:** Comunicação assíncrona entre a UI e o processo Node.js.
3.  **Native Core (C++ DLLs):** *Nota: Este repositório contém a interface e a lógica de controle. Para funcionamento completo em Ring 0, você precisa compilar o `FluxCore_x64.dll` (driver proprietário) e colocá-lo na pasta `/native`.*

---

## 📦 Instalação Manual e Build

Se o script automático falhar, siga estes passos:

### Pré-requisitos
*   Node.js v18+
*   Python 3.11 (para scripts Python e node-gyp)
*   Visual Studio Build Tools 2022 (Carga de trabalho: Desenvolvimento para Desktop com C++)

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/flux-core-nexus.git
    cd flux-core-nexus
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Modo de Desenvolvimento (UI Only):**
    ```bash
    npm start
    ```
    *Isso abrirá a interface Electron. A injeção real será simulada se o driver nativo não for encontrado.*

4.  **Compilar para Produção (.exe):**
    ```bash
    npm run build:win32
    # ou
    npm run build:all
    ```
    O executável estará na pasta `dist/`.

---

## 🕹️ Guia de Uso

1.  **Dashboard:**
    *   O Nexus tentará detectar automaticamente jogos rodando (ex: `RobloxPlayerBeta.exe`).
    *   Se o jogo for detectado, clique em **"INITIATE BYPASS"**.

2.  **Plugins:**
    *   Vá até a aba **Plugins**. Ative o runtime correspondente ao jogo (ex: ative `Lua` para Roblox, `Java` para Zomboid).
    *   Se os plugins não estiverem ativos, a injeção falhará.

3.  **Security Suite:**
    *   Configure seus métodos de bypass. Recomendamos manter "Anti-Screenshot" e "Driver Unlinking" sempre ativos.
    *   Use o botão **"SPOOF SYSTEM ID"** antes de abrir qualquer jogo com Anti-Cheat forte (EAC/BattlEye).

4.  **Script Hub / Editor:**
    *   Use o **Script Hub** (na Dashboard) para ativar cheats prontos.
    *   Use o **Editor** para escrever ou colar scripts personalizados.
    *   Clique no botão **✨ (AI Fix)** para usar o Google Gemini para otimizar seu código (requer API Key no `.env`).

---

## ☠️ Riscos Conhecidos

Apesar de nossas tecnologias de "God Mode", nenhum software é 100% indetectável para sempre.

*   **Risco de Detecção:** Anti-cheats como Vanguard (Valorant) e Ricochet (CoD) operam em nível Kernel (Ring 0). O uso do Nexus contra eles requer configurações de **DMA Hardware** (cartão físico PCIe) para segurança máxima.
*   **Integridade do Jogo:** Scripts mal escritos podem corromper seu save game ou causar crash no jogo.
*   **Vírus em Scripts:** Nunca execute scripts (`loadstring` ou `.exe`) de fontes desconhecidas dentro do Nexus. Eles podem conter loggers ou malware.

---

## 🤝 Contribuição

Contribuições são bem-vindas para aprimorar a interface ou adicionar novos Game Packs.
1.  Fork o projeto.
2.  Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`).
4.  Push para a Branch (`git push origin feature/AmazingFeature`).
5.  Abra um Pull Request.

---

**Desenvolvido por Nexus Dev Team.**
*Stay Stealthy.*

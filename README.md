# Agent Context Core

Shared working rules for AI agents across projects. The Core context covers communication, collaboration, security, verification, and Git workflow. It does not include domain-specific skills.

## Install always-on instructions

Run from any directory. With no arguments, Core adds its managed instruction block to Codex's user-level AGENTS.md, so Codex loads the rules in every project:

```bash
npx @ai-agent-context/agent-context-core
```

Choose another supported agent explicitly:

```bash
npx @ai-agent-context/agent-context-core --agent claude-code
npx @ai-agent-context/agent-context-core --agent copilot-cli
npx @ai-agent-context/agent-context-core --agent gemini-cli
```

Requires Node.js ^18.17.0 or >=20.5.0.

| Agent | User-level instruction file |
|---|---|
| Codex | ~/.codex/AGENTS.md (CODEX_HOME overrides ~/.codex) |
| Claude Code | ~/.claude/CLAUDE.md (CLAUDE_CONFIG_DIR can override ~/.claude) |
| GitHub Copilot CLI | ~/.copilot/copilot-instructions.md (COPILOT_HOME can override ~/.copilot) |
| Gemini CLI | ~/.gemini/GEMINI.md |

The installer keeps any text outside its marked Core section. Re-running it updates that section in place. It refuses symlink destinations and malformed or duplicated markers rather than replacing user instructions.

The file name and loading behavior are agent-specific: Codex reads global AGENTS.md; Claude Code uses CLAUDE.md; Copilot CLI has user-level custom instructions; Gemini CLI loads global GEMINI.md. This installer configures only the selected agent. See the Codex guide at https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide, Claude Code memory guide at https://code.claude.com/docs/en/memory, Copilot CLI custom instructions at https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions, and Gemini CLI context files at https://geminicli.com/docs/cli/gemini-md/.

## Project copy

If you need the Markdown file in the current project for a host that you configure manually, run:

    npx @ai-agent-context/agent-context-core --project

This copies GLOBAL_WORKING_CONTEXT.md to the current directory. Copying the file alone does not make an agent load it.

## Use with domain packages

Core is the single source for shared context. The Coding (https://github.com/AI-Agent-Context/agent-context-coding) and Research (https://github.com/AI-Agent-Context/agent-context-research) packages depend on Core. Their installers add this Core instruction block to the selected agent's user-level instructions, then install the selected domain context and skills in the current project. Installing Core directly configures only the shared rules.

# Agent Context Core

Install the universal working context into the current project.

Command: `npx @ai-agent-context/agent-context-core`

The installer copies `GLOBAL_WORKING_CONTEXT.md`. If an identical file already exists, it reuses it. If a different file exists, it leaves it untouched and exits with an error.

Coding and Research packages consume this file from Core through the exported package path `@ai-agent-context/agent-context-core/GLOBAL_WORKING_CONTEXT.md`. Keep that path stable so Core updates do not require edits to the domain repositories.

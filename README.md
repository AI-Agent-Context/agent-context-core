# Agent Context Core

Shared working rules for AI agents across projects. The Core context covers communication, collaboration, security, verification, and Git workflow. It does not include domain-specific skills.

## Install

Run this command from the root of the project where you want the context installed:

```bash
npx @ai-agent-context/agent-context-core
```

Requires Node.js `^18.17.0 || >=20.5.0`.

## What gets installed

The command copies `GLOBAL_WORKING_CONTEXT.md` into the current directory. It does not install Coding, Research, or other domain skills, and it does not edit `AGENTS.md` or configure an agent to load the context automatically. Load the file through your agent or project instructions when you start work.

## Use with domain packages

Core is the single source for the shared context. The [Coding](https://github.com/AI-Agent-Context/agent-context-coding) and [Research](https://github.com/AI-Agent-Context/agent-context-research) packages depend on Core and install this file together with their own context and skills. Installing Core directly installs only the shared context.

## Existing context file

If `GLOBAL_WORKING_CONTEXT.md` already exists with identical contents, the installer reuses it. If it differs, the installer stops and leaves the existing file unchanged. Review and merge the files yourself before retrying.

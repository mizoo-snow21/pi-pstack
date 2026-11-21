# pi-pstack

A Pi-native port of [pstack](https://github.com/cursor/plugins/tree/main/pstack). It tracks upstream pstack 0.15.46 (`cursor/plugins@0b46ec3`): 57 skills with their references, playbooks, and scripts, plus Pi implementations of `poteto-agent` and `comment-sicko`. `make-bot-ui` is not ported because it depends on Cursor Automations.

## Install

Install the published package:

```bash
pi install git:github.com/mizoo-snow21/pi-pstack
```

Then restart Pi. Use `pi config` to enable or disable package resources.

## Start

```text
/setup-pstack
/poteto-mode investigate and fix the retry regression, then verify it
/poteto-mode off
```

`/setup-pstack` is an extension command. It interactively maps pstack roles to models that Pi has configured and saves the result in `~/.pi/agent/pstack/models.json`.

`/poteto-mode` enables sticky Poteto Mode for the current Pi session and expands the bundled `poteto-mode` skill. `/poteto-mode off` disables it. Individual skills use Pi's standard form, for example `/skill:how` and `/skill:no-comments`.

## Skills

The package ships 57 skills. `/skill:poteto-help` maps a question to the skill, playbook, or principle that answers it.

- 32 skills are visible to the model, so they load from your words or from `/skill:<name>`: `architect`, `arena`, `automate-me`, `benchmark-checklist`, `blast-radius`, `bro`, `correct`, `create-formal-verification-skill`, `create-verification-skill`, `figure-it-out`, `how`, `in-your-own-words`, `interrogate`, `ketchup`, `ketchup-video`, `maintain-formal-verification-skill`, `maintain-verification-skill`, `no-comments`, `poteto-help`, `poteto-mode`, `recall`, `reflect`, `sharpen`, `show-me-your-work`, `statechart`, `swarm`, `tdd`, `teach`, `technical-writing`, `typescript-best-practices`, `unslop`, and `why`.
- 25 skills load only by name: the 24 `principle-*` skills, which `/poteto-mode` reads by path when it applies one, and `setup-pstack`.

`/poteto-mode` also carries 22 playbooks under `skills/poteto-mode/playbooks/`. The Autopilot and Autonomous run playbooks assume agents that run in the background. A Pi child blocks its parent and cannot push or merge, so those playbooks run in bounded phases with the root doing every external write.

## Pi subagents

The extension registers a `subagent` tool using Pi's official isolated-process pattern. A child runs as a separate `pi --mode json --print --no-session` process and returns only its final result to the parent context.

Bundled agents:

- `poteto-agent` for pstack implementation and investigation delegates. It must read the full `poteto-mode` skill and its `worker.md` before working.
- `comment-sicko` for comment-only review.

The tool supports a single task, `tasks` for parallel work, and `chain` for sequential work with `{previous}` interpolation. It accepts `role` for the model configuration and `model` for a one-off `provider/model` override. It permits at most eight tasks and runs at most four concurrently.

It also honors Pi's subagent definition locations:

- `~/.pi/agent/agents/*.md` for user agents.
- `.pi/agents/*.md` for project agents, only with `agentScope: "project"` or `"both"`.

Bundled agents are the default. Project agents require interactive approval unless `confirmProjectAgents: false` is explicit.

## Safety and compatibility

This port deliberately removes Cursor-only setup and behavior:

| Cursor pstack behavior | Pi equivalent |
|---|---|
| `Task` and `subagent_type` | `subagent` tool and Markdown agent definitions |
| Cursor model slugs and rules | `/setup-pstack`, `pstack_config`, and Pi `provider/model` selectors |
| sticky `mode: true` | session-persisted `/poteto-mode` extension command |
| Cursor todo list | `pstack_todo` tool |
| Cursor transcript directories | `$PI_SESSION_FILE` and `pstack_sessions` |
| `/loop`, cloud-agent resume | explicit project watchers; child Pi processes are local and fresh |
| Cursor Team Kit skills | capability detection and project-native verification tooling |

The extension requests confirmation for recognizable shell commands that push, alter pull requests, merge, deploy, mutate infrastructure, or recursively delete files. In non-interactive mode it blocks these commands. This is a guardrail, not a complete shell-security sandbox. Prompts also require explicit approval for all external or irreversible actions.

The upstream `watch-pr` helper scripts are retained. Their runtime requirements remain project-specific. In particular, the script package uses Bun and GitHub workflows require `gh` authentication. `/skill:statechart` runs TLC, so its first run installs Java and `tla2tools` with `mise` and needs the network.

`/setup-pstack` covers nine roles. Its picker sets one model per role and keeps an existing list. To give a panel role (`arena runners`, `arena cross-judge pool`, `interrogate reviewers`) a list, use the `pstack_config` tool with `models`. Upstream's reasoning budget is not ported. Set a thinking level per role by ending its selector with a level, such as `provider/model:high`.

## License and provenance

Derived from Cursor's pstack, licensed under MIT. See [LICENSE](LICENSE).

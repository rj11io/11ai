# 11ai SSH operations

Ten standalone skills for common OpenSSH client work, with safety checks around remote state changes, key handling, port exposure, and host key trust.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-ssh-cheatsheet`](./skills/11ai-ssh-cheatsheet/SKILL.md) | Looking up SSH commands, flags, config keywords, and forwarding forms |
| [`11ai-ssh-setup`](./skills/11ai-ssh-setup/SKILL.md) | Installing the client, creating a first key, loading the agent, and authorizing the public key |
| [`11ai-ssh-environment`](./skills/11ai-ssh-environment/SKILL.md) | Inspecting the client, key inventory, agent, effective per-host config, and reachability |
| [`11ai-ssh-keys`](./skills/11ai-ssh-keys/SKILL.md) | Creating, inspecting, authorizing, rotating, and revoking key pairs |
| [`11ai-ssh-config`](./skills/11ai-ssh-config/SKILL.md) | Adding and repairing host entries, patterns, jump hosts, and multiplexing |
| [`11ai-ssh-sessions`](./skills/11ai-ssh-sessions/SKILL.md) | Opening sessions and running remote commands with reliable exit status and output |
| [`11ai-ssh-tunnels`](./skills/11ai-ssh-tunnels/SKILL.md) | Forwarding local, remote, and dynamic ports, then verifying and tearing them down |
| [`11ai-ssh-file-transfer`](./skills/11ai-ssh-file-transfer/SKILL.md) | Copying and synchronizing files with scp, rsync, and sftp, including deletion policy |
| [`11ai-ssh-integrations`](./skills/11ai-ssh-integrations/SKILL.md) | Connecting SSH to Git hosting, pipelines, bastions, restricted automation keys, Docker, and deploys |
| [`11ai-ssh-troubleshooting`](./skills/11ai-ssh-troubleshooting/SKILL.md) | Diagnosing unreachable ports, publickey denials, permission problems, host key changes, and stalls |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as inspecting the effective configuration before opening a tunnel, or creating a restricted key before wiring a deploy.

## Safety contract

Start with read-only inspection, and use `ssh -G HOST` to confirm the effective user, host, port, and key before anything else — a correct command on the wrong host is the failure these skills work hardest to prevent.

Only the public half of a key ever leaves the machine. Never display, copy, or transmit a private key, never accept a passphrase or key through the terminal, and never overwrite an existing key file.

Treat as requiring explicit approval for the exact command on the exact host: any remote command that installs, restarts, deletes, or reconfigures; editing a remote `authorized_keys` file; `rsync --delete`; binding a forwarded port beyond loopback; a remote forward that publishes a local service; and removing a `known_hosts` entry.

Never weaken security to get past a symptom. `StrictHostKeyChecking no`, `UserKnownHostsFile /dev/null`, a blanket `ForwardAgent yes`, and a world-readable private key each trade a real protection for a shortcut; `accept-new` is the acceptable middle ground for a genuinely new host. A changed host key is a warning to investigate out of band, not a line to delete.

Do not print private keys, passphrases, tokens appearing in remote output, or internal hostnames when they are sensitive.

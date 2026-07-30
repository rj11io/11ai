---
name: 11ai-operator-ssh-tunnels
description: "Forward ports through SSH, covering local forwarding to reach a private service, remote forwarding to expose a local one, dynamic SOCKS proxies, jump hosts, bind addresses, background tunnels, and how to verify and tear one down. Use when a database or internal service must be reached through a bastion, when a local port must be reachable from a remote host, or when a tunnel is open but nothing connects through it."
---
# 11ai SSH tunnels

A tunnel moves network reachability across a trust boundary, so name both ends and the direction before running anything. The three forms do different things and mixing them up either fails silently or exposes something unintended.

## Choose the direction

- **Local forwarding** brings a remote service to a local port. Use it to reach a private database through a bastion. Nothing of yours becomes reachable.
- **Remote forwarding** exposes a local service on the remote host. Use it to let a remote system call back into a local development server. This one publishes something, so treat it as an externally visible action.
- **Dynamic forwarding** opens a local SOCKS proxy that routes arbitrary traffic through the remote host.

Write the mapping out before running the command. In `-L LOCAL_PORT:TARGET_HOST:TARGET_PORT`, the target is resolved **from the remote host**, which is the single most common confusion: `localhost` there means the server, not your machine.

## Inspect first

```bash
ssh -G HOST | grep -E '^(hostname|user|port) '
lsof -nP -iTCP:LOCAL_PORT -sTCP:LISTEN
ssh HOST 'nc -z -w 3 TARGET_HOST TARGET_PORT; echo "reachable: $?"'
```

Check the local port is free, or the tunnel binds nothing and the old listener answers instead — which looks like a working tunnel returning wrong data. Then confirm the remote host can actually reach the target; a tunnel cannot fix a path that does not exist on the far side.

## Open a tunnel

```bash
ssh -N -L 15432:db.internal:5432 USER@BASTION
ssh -N -L 15432:localhost:5432 USER@HOST
ssh -N -J bastion.example.com -L 15432:db.internal:5432 USER@HOST
ssh -N -D 1080 USER@HOST
ssh -N -R 8080:localhost:3000 USER@HOST
```

`-N` runs no remote command, which is what a pure tunnel wants. Add `-f` to background it, and prefer a distinct local port such as `15432` over the service's real one so a local instance is not shadowed.

Two settings worth adding to a tunnel you leave running:

```bash
ssh -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
  -L 15432:db.internal:5432 USER@BASTION
```

`ExitOnForwardFailure=yes` is the important one: without it, SSH connects successfully and prints a warning when the forward cannot be established, so the command looks fine and the tunnel does not exist.

By default a forwarded port binds to `127.0.0.1`. Binding wider exposes it to your network:

```bash
ssh -N -L 0.0.0.0:15432:db.internal:5432 USER@BASTION
```

Only do that when asked, and say plainly that it makes a private service reachable from the local network with no authentication of its own.

Remote forwarding binds to the remote loopback unless the server sets `GatewayPorts`. Do not change a server's `GatewayPorts` to publish a local service more widely without explicit approval — that exposes a development machine to the remote network.

## Verify and tear down

```bash
lsof -nP -iTCP:15432 -sTCP:LISTEN
nc -z -w 3 localhost 15432; echo "exit: $?"
psql "postgresql://USER@localhost:15432/DBNAME" -c 'select 1'
```

A listening socket only proves SSH bound the port. Prove the whole path by speaking the service's own protocol through it — the tunnel can be up while the far side refuses the connection.

Tear down deliberately:

```bash
pgrep -fl 'ssh -N.*15432'
kill PID
ssh -O check -S ~/.ssh/cm-USER@HOST:22 HOST
ssh -O cancel -L 15432:db.internal:5432 HOST
```

Match the exact tunnel before killing anything; `pkill ssh` kills every session including unrelated ones. With a multiplexed connection, `-O cancel` removes one forward without dropping the session.

## Report

State the direction and full mapping, both endpoints, the bind address, whether the tunnel runs in the foreground or background and its process id, the protocol-level verification result, and the exact teardown command. Call out explicitly when a bind address is wider than loopback or when a remote forward publishes a local service, and note that a tunnel keeps an authenticated channel open until it is closed. Hand connection failures to `11ai-operator-ssh-troubleshooting`.

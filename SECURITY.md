# Security Policy

## Reporting a vulnerability

Please report security issues privately, not in a public issue.

Use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**), which opens a channel visible only to
the maintainers.

Please include what you did, what happened, what you expected, and the version
or commit you were on. A proof of concept helps but is not required.

You should get an acknowledgement within **7 days**. ProForma is maintained by
a very small team, so please treat that as a realistic figure rather than a
service level. You will be told whether the report is accepted and, if it is,
when a fix is expected. Credit is offered on any accepted report unless you ask
otherwise.

Please do not run automated scanners against infrastructure you do not own, and
do not test against anyone else's deployment.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Threat model — what ProForma actually is

The application is a static site. It has **no backend, no accounts, no
telemetry and no network calls**. Your business case is held in `localStorage`
in your own browser and is never transmitted anywhere.

The practical consequences are worth stating plainly:

- Anyone with access to the browser profile can read the saved case. If the
  figures are sensitive, treat the device as the security boundary, because it
  is.
- Clearing site data deletes the case. Use **Export → JSON** for anything you
  need to keep.
- There is no server-side copy and no recovery.

## The assist server holds an API key — read this before running it

`server/index.mjs` is an **optional** local Node process, off by default. The
application is fully functional without it. It exists so the Export step can
have a model review your business case.

**It reads `ANTHROPIC_API_KEY` from its own environment and never sends the key
to the browser.** That separation is the entire reason the file exists rather
than the frontend calling the API directly.

### Do not expose it to the public internet

The review endpoint is **unauthenticated by design**, on the assumption that
only you can reach it. Its current protections are:

- It binds to `127.0.0.1` explicitly, so it is not reachable from the network.
- CORS is pinned to `http://localhost:5173`.
- Request bodies are capped at 1 MB.

None of that survives being put behind a reverse proxy, a tunnel, a container
port mapping, or a changed bind address. If you do any of those things, you
have published an **open, unauthenticated proxy to your paid API account**, and
anyone who finds it can spend your budget and send arbitrary prompts under your
key. It is not hardened for that and adding a bind flag would not make it so.

Run it on your own machine. If you need a shared deployment, put a real
authenticating gateway in front of it and rate-limit it — treat
`server/index.mjs` as a reference implementation, not a production service.

### Handling the key

- Set it in your shell or in a local `.env` that is **never committed**. `.env`
  is in `.gitignore`; `.env.example` shows the shape and holds no value.
- Prefer a key scoped to a workspace with a spending limit.
- If a key is ever committed, pasted or logged, **rotate it first** and clean up
  afterwards. Revocation is the fix; deleting the commit is not.
- Maintainers will never ask you for a key in an issue or pull request. Never
  attach one to a bug report — the review text and any error output are enough.

## Dependencies

ProForma ships two runtime dependencies, `react` and `react-dom`. Keeping that
surface small is deliberate and pull requests that add runtime dependencies will
be held to it. Development and tooling dependencies are a normal part of a
change.

`@anthropic-ai/sdk` is an optional dependency, loaded only by the assist server
when it runs.

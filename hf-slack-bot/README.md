---
title: The One With the AI — Slack Bot
emoji: 💬
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# The One With the AI — Slack Bot

The Friends-themed six-persona Slack agent team (Monica / Joey / Ross / Chandler / Rachel / Phoebe), running 24/7 in this Hugging Face Space so it stays alive when the maintainer's Mac sleeps.

Reads STATUS.md + TIMELINE.md from this image, picks a persona per Slack message, calls Claude, posts the reply under the persona's display name via `chat:write.customize`.

Source: [github.com/joyo11/the-one-with-the-ai](https://github.com/joyo11/the-one-with-the-ai)

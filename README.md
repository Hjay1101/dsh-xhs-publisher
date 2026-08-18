# dsh-xhs-publisher

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI **client-only plugin**: a Xiaohongshu (RED) post publishing assistant. Paste your AI-written draft — validate lengths, generate a cover, copy everything and paste it into the Xiaohongshu publisher.

## Why

- Xiaohongshu notes have hard format rules: **title ≤ 20 chars, body ≤ 1000 chars, 5-8 tags** — counting by hand is tedious
- Covers must be 3:4 vertical (1242×1656); generating one usually means opening a design tool
- The publishing loop repeats: title → body → cover → tags → checks

## Features

- **Post editor**: title/body/tag inputs with **live counters** (title ≤20, body ≤1000; over-limit turns red)
- **Canvas cover generator**: two templates (dark grid / light minimal), live preview, one-click export of 1242×1656 PNG — no screenshotting or image tools required
- **Publish checklist**: title length / body length / tag count / cover exported — auto-checked
- **Ready actions**: one-click copy (title + body + tags) to clipboard, open the Xiaohongshu creator platform
- **No separate LLM config**: the copy itself is written by the DSH agent you already use; the plugin just provides the workflow tooling

## Install

```sh
dsh plugin --profile web add github:Hjay1101/dsh-xhs-publisher
```

Add the plugin line to your profile patch layer (`$DSH_HOME/profiles/web/cordis.patch.yml`):

```yaml
- insert:
    - id: xhs-publisher
      name: 'dsh-xhs-publisher'
```

Restart `dsh web`, then open Settings → the "XHS Publisher" sidebar entry.

## Usage

1. Ask the AI (current session model) to draft the title, body and tags per Xiaohongshu rules
2. Open Settings → XHS Publisher and paste the draft into the inputs — lengths validate live
3. Tune cover fields (title / highlight phrase / subtitle / three stat rows / bottom chips), pick a template, watch the live preview
4. Click "Export cover PNG" to download the 1242×1656 cover
5. When the checklist is green, "Copy title + body + tags" and paste into the Xiaohongshu creator
6. Put external links in the pinned comment, not in the body

## How it works

Client-only plugin: no host logic (`index.js` is just a cordis-loadable empty entry), no Typert Remote, no secrets. Editing, validation, canvas drawing and clipboard all happen in the browser; mounted via the `settings.section` slot.

## Known limitations

- Xiaohongshu has no open publishing API, so **fully automatic publishing is not possible**; the plugin handles "ready-to-publish" (content + cover + validation + bundling) and you do the final paste
- Covers are drawn from built-in templates, not an exact 1:1 preview of the platform; exported as high-res PNG and compressed by the platform

## License

MIT
# Image prompts

Prompts for the README images. Generate each one, save it under `docs/assets/`
with the file name given, then replace the matching `<!-- ... IMAGE -->` comment
in `README.md` with
`<p align="center"><img src="docs/assets/<name>.png" width="100%" alt="..."></p>`.

Keep every image 16:9 (1600x900 or larger), dark background, so it reads well in
GitHub's dark and light themes. Ask for no text other than the words quoted in
the prompt: image models misspell anything longer.

## hero.png

```text
Wide 16:9 banner, dark charcoal background. Left half: a chaotic tangle of glowing red and orange code windows piled on top of each other, overlapping, cracked, with warning triangles and duplicated fragments floating around, slightly blurred, like a messy desk. Right half: the same code reorganised into a neat grid of small, evenly spaced, crisp green-tinted file cards, perfectly aligned, calm. In the middle, a thin vertical beam of light acting as a filter, with a small friendly robot hand passing the mess through it. Large bold clean sans-serif text centered at the top: "codeality". Smaller text below it: "A++ clean code from your AI agents". Minimal, modern, high contrast, flat vector style with soft glow, no other text.
```

## before-after.png

```text
Split-screen 16:9 illustration, dark background. Left side labelled "BEFORE" in red: one enormous scrolling code file towering like a skyscraper, with red highlights marking duplicated blocks, a loop of arrows going back to a server (N+1 requests), a slow hourglass, and a fuel gauge labelled "tokens" on empty. Right side labelled "AFTER" in green: five small tidy file cards arranged in a folder tree, a single straight arrow to the server, a stopwatch, and the "tokens" gauge nearly full. Flat vector, clean, developer-tool aesthetic, only the words "BEFORE", "AFTER" and "tokens".
```

## agent-loop.png

```text
Square 1:1 diagram, dark background. A circular loop with three stations: a small robot labelled "agent" writing code, a shield labelled "gates" with a red X, and a green check mark labelled "clean". Arrows go agent to gates, gates back to agent with a small speech bubble containing a wrench, and finally gates to clean. Flat vector, minimal, two accent colours (red, green) plus white, only those three words.
```

## social-preview.png

```text
1280x640 GitHub social preview card, dark charcoal background. Left: the word "codeality" in large bold white sans-serif, below it "Clean code A++ for AI agents. Zero effort. Fewer tokens." in smaller grey text. Right: a small stack of neat glowing green file cards next to a crumpled red pile. Lots of empty space, nothing else.
```

Upload `social-preview.png` in the repository's Settings > General > Social
preview so links shared on X, LinkedIn and Slack show it.

# Third-party notices

grokbot-clone is MIT-licensed (see `LICENSE`). It bundles or depends on the third-party work listed below. npm dependencies not listed here are covered by their own licenses, included in their packages.

## Lucide icons

The web UI's icons come from [Lucide](https://lucide.dev), via the `lucide-react` package (pinned to 1.61.0 in `web/package.json`). They are rendered in `web/src/components/Icon.tsx`, `web/src/components/config/glyphs.tsx` and `web/src/components/VoiceCallBar.tsx`.

```
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

Some Lucide icons are derived from [Feather](https://feathericons.com). Those are under the MIT License:

```
Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## App logos

The Connect Apps screen and app cards show each app's logo by loading it at runtime from Composio's logo service (`https://logos.composio.dev/api/<toolkit>`). No logos are bundled in this repository. When a logo can't load, the UI shows a letter tile instead. Each logo is a trademark of its owner, and showing one implies no endorsement.

The "Sign in with Google" button shows Google's "G" mark, which is a trademark of Google LLC.

## Original artwork

The bot avatar characters (`web/src/avatar/`), the favicon and `assets/icon.svg` were made for this project. They are drawn from basic geometry and covered by the project's MIT license.

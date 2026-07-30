# ear-trainer

 Fully functional interval ear training app with settings and stats saved to local storage. 
 
 Supports ascending, descending, and harmonic intervals with a choice of numerous instruments.
 
 The main reason I even built this was to support selecting all intervals from a particular key because for whatever reason my brain starts hearing them differently when they all relate. Dissonant things kinda sound less dissonant when they are in key if that makes sense. Anyway, it supports constraining the intervals to the notes of any major key (which is really any diatonic key or mode since the intervals don't truly have a tonal center being random)
 
 Currently all intervals are included in the randomization, but if you need to select specific intervals let me know and I can probably add it :)
 
 Currently hosted at: https://s3.amazonaws.com/in-key-ear-trainer/index.html

## Development

```
npm install
npm run dev        # esbuild dev server with live reload
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
```

Pushing to `master` builds and deploys `dist/` to the S3 bucket via GitHub Actions
(`.github/workflows/deploy.yml`). Requires repo secrets `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY`.

Many thanks to [MIDI.js](https://github.com/mudcube/MIDI.js) for making this at all possible (and also pleaz stop using globals and support commonjs cause i mean it's 2018 :P https://github.com/mudcube/MIDI.js/issues/24)

And to [these guys](https://github.com/gleitz/midi-js-soundfonts) for providing the soundfonts to change instruments.

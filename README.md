# SousMath

Sous vide timing math - every recipe says one inch equals one hour like thickness is the whole story, the core lags the bath by an hour nobody warns you about, and pasteurization is time at temperature, not a vibe.

**Live:** https://ilanis-agent.github.io/sousmath/

## What it does

- **Heat-up** - core time from fridge, room or freezer, honestly quadratic in thickness (double the thickness, quadruple the wait), with a latent-heat penalty for frozen.
- **Pasteurization dwell** - 6.5-log time-at-temperature by protein (poultry and ground meat need far more than intact steak or fish), with a plain warning below 55C instead of a false number.
- **Doneness band** - what the bath temp actually tastes like for that protein.
- **Plate plan** - drop-in countdown back from dinner time, plus ice-bath chill for cook-chill.

## Run it

Static site, no build. Open `app.html` or visit the live URL. `engine.js` is pure functions (`window.SousMath` in the browser, `module.exports` in Node).

## Tests

```
node test-engine.js
```

## Caveats

Estimates for slab-shaped cuts. Bones, fat caps, bag overlap and circulator flow move real times; a probe thermometer and the texture on the plate are the authority.

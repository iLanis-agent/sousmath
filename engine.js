/* SousMath engine - sous vide timing math. Pure functions, no DOM. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SousMath = api;
}(typeof self !== 'undefined' ? self : this, function () {

  // Heat transfer constant calibrated so a 25mm slab from the fridge (4C)
  // into a 55C bath reaches bath-minus-0.5C at the core in ~75 min.
  // Time is quadratic in thickness - double the thickness, quadruple the wait.
  var C = 16.2;
  var START = { fridge: 4, room: 20, freezer: -18 };

  function startTemp(startKey) {
    return START.hasOwnProperty(startKey) ? START[startKey] : START.fridge;
  }

  // Core heat-up: slab from start temp to within 0.5C of bath. Rounded to 5 min.
  // Frozen adds a 40% latent-heat penalty the plain log model misses.
  function heatUpMin(thicknessMm, bathC, startKey) {
    var t0 = startTemp(startKey);
    var gap = (bathC - t0) / 0.5;
    if (gap <= 1) return 0;
    var min = C * Math.pow(thicknessMm / 25, 2) * Math.log(gap);
    if (startKey === 'freezer') min = min * 1.4;
    return Math.round(min / 5) * 5;
  }

  // 6.5-log pasteurization dwell for poultry/ground once the core is at temp.
  // Anchors in C: minutes needed at that temperature.
  var ANCHORS = [[55, 100], [57.5, 40], [60, 12], [62.5, 4], [65, 1]];

  // Protein safety multiplier: intact red meat and fish need far less dwell
  // than poultry or anything ground (surface sear handles intact muscle).
  var PROTEIN_MULT = { poultry: 1.0, ground: 1.0, pork: 0.5, redmeat: 0.25, fish: 0.2 };

  // Dwell minutes at bath temp, or null below 55C (do not rely on timing there).
  function dwellMin(protein, bathC) {
    if (bathC < 55) return null;
    if (bathC >= 65) return 0;
    var i;
    for (i = 0; i < ANCHORS.length - 1; i++) {
      var a = ANCHORS[i], b = ANCHORS[i + 1];
      if (bathC >= a[0] && bathC <= b[0]) {
        var f = (bathC - a[0]) / (b[0] - a[0]);
        var ln = Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * f;
        var base = Math.exp(ln);
        var mult = PROTEIN_MULT[protein] === undefined ? 1.0 : PROTEIN_MULT[protein];
        var d = Math.round(base * mult);
        return d < 2 ? 0 : d;
      }
    }
    return 0;
  }

  function totalMin(heat, dwell) {
    return heat + (dwell || 0);
  }

  // Ice-bath chill for cook-chill: core from bath temp down to 4C. Rounded to 5 min.
  function chillMin(thicknessMm, bathC) {
    var min = 0.8 * C * Math.pow(thicknessMm / 25, 2) * Math.log(bathC / 4);
    return Math.round(min / 5) * 5;
  }

  // When to drop the bag so it is ready at dinnerTime ('HH:MM'). Handles midnight.
  function dropIn(dinnerHHMM, total) {
    var p = dinnerHHMM.split(':');
    var dinner = parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    var drop = ((dinner - total) % 1440 + 1440) % 1440;
    var h = Math.floor(drop / 60), m = drop % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function fmtMin(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  // Doneness band for the chosen bath temperature.
  var BANDS = {
    fish:    [[41, 'very rare, sashimi-like'], [46, 'silky, translucent'], [49, 'just opaque, buttery'], [99, 'flaky and firm']],
    redmeat: [[52, 'rare'], [56, 'medium-rare'], [59, 'medium'], [62, 'medium-well'], [99, 'well done']],
    poultry: [[61, 'very juicy - full dwell matters'], [65, 'classic juicy'], [69, 'traditional firm'], [99, 'pull-apart tender']],
    pork:    [[59, 'blushing and juicy'], [62, 'classic'], [99, 'firm']],
    ground:  [[61, 'juicy - full dwell matters'], [66, 'classic'], [99, 'well done']]
  };

  function bandNote(protein, bathC) {
    var b = BANDS[protein] || BANDS.redmeat;
    for (var i = 0; i < b.length; i++) if (bathC <= b[i][0]) return b[i][1];
    return b[b.length - 1][1];
  }

  return {
    startTemp: startTemp,
    heatUpMin: heatUpMin,
    dwellMin: dwellMin,
    totalMin: totalMin,
    chillMin: chillMin,
    dropIn: dropIn,
    fmtMin: fmtMin,
    bandNote: bandNote
  };
}));

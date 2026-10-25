Kit.init({
  id: 'power-keeper', title: 'Power Keeper', hearts: 3,
  timer: { 1: 45, 2: 75, 3: 120 },
  modes: { on: 'Water pipes', off: 'Circuit schematic' },
  skin: ana => ana
    ? { heartName: 'pressure bars', heartIcon: '💧', tagline: 'You run a water system. Each level is a repair job on the pipes: keep the pressure up, answer fast for bonus points, and fill the reservoir. Every puzzle is the real circuit idea in plumbing clothes.', winText: 'Reservoir full!', loseText: 'The pipes ran dry' }
    : { heartName: 'stability', heartIcon: '⚡', tagline: 'You keep a city’s power grid alive. Each level is a substation under stress: answer the faults before the grid falters, answer fast for bonus points, and light up the skyline.', winText: 'Grid restored!', loseText: 'Blackout' },
  levels: GRID_LEVELS, stage: gridStage,
});

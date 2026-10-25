Kit.init({
  id: 'circuit-basics-quest', title: 'Circuit Basics Quest', hearts: 3,
  modes: { on: 'Water pipes', off: 'Circuit schematic' },
  skin: ana => ana
    ? { heartName: 'pressure bars', heartIcon: '💧', tagline: 'You run a water system. Each level is a repair job on the pipes: keep the pressure up and fill the reservoir. Every puzzle is the real circuit idea in plumbing clothes.', winText: 'Reservoir full!', loseText: 'The pipes ran dry' }
    : { heartName: 'stability', heartIcon: '⚡', tagline: 'You are the circuit analyst on call. Each level is a fault to diagnose from KCL, KVL and the rest of the toolbox: answer correctly and light up the skyline.', winText: 'Circuit solved!', loseText: 'Short circuit' },
  levels: WATER_LEVELS, stage: waterStage,
});

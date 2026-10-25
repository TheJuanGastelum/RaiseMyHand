Kit.init({
  id: 'cpu-quest', title: 'CPU Quest', hearts: 3,
  modes: { on: 'Car assembly line', off: 'Microchips' },
  skin: ana => ana
    ? { heartName: 'shifts', heartIcon: '♥', tagline: 'Pete runs a car factory. Each level is a station on the assembly line: solve the challenges to build the car, and keep ahead of the jam that creeps up on every mistake. Every puzzle is real computer architecture in factory clothes.', winText: 'Car rolled off the line!', loseText: 'The line jammed' }
    : { heartName: 'hearts', heartIcon: '♥', tagline: 'Pete the CPU walks across a circuit board to reach the goal chip. Each level is a stretch of the board: solve the challenges to move forward and outrun the bug that creeps up on every mistake.', winText: 'Reached the chip!', loseText: 'The bug got Pete' },
  levels: CPU_LEVELS, stage: cpuStage,
});

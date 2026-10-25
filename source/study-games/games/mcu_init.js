Kit.init({
  id: 'embedded-quest', title: 'Embedded Quest', hearts: 3,
  modes: { on: 'Smart house', off: 'Microcontroller chip' },
  skin: ana => ana
    ? { heartName: 'bulbs', heartIcon: '💡', tagline: 'You are the brain of a smart house. Each level is a job around the home: set the doors, timers and dimmers just right, and light up every room. Every puzzle is real microcontroller programming in smart-home clothes.', winText: 'The whole house is lit!', loseText: 'Blown fuse' }
    : { heartName: 'fuses', heartIcon: '▮', tagline: 'You program a microcontroller. Each level is a firmware job: set registers bit by bit, work out timer numbers, and power up the chip pin by pin. Tap the bits on a live register and get it right.', winText: 'Chip powered up!', loseText: 'Fuse blown' },
  levels: MCU_LEVELS, stage: mcuStage,
});

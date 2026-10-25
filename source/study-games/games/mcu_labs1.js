/* Workshop builds for Embedded Quest, levels 1-8 */
const ML = LABSET(MCU_LEVELS, 'mcu');
const SL = o => slot(Object.assign({}, o, { parts: shuffle(o.parts.slice()) }));
const srcB = (label, sub, info) => ({ kind: 'SRC', label, sub, info: info || '' });
const boxB = (label, sub, info) => ({ kind: 'BOX', label, sub, info: info || '' });
const bin8 = (v, n) => v.toString(2).padStart(n || 8, '0');
const pre2 = s => '<pre class="code">' + s.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
const ordRig = (n, prefix, fixedNote) => {
  const labs = Array.from({ length: n }, (_, i) => ({ id: 's' + i, label: (prefix || 'step ') + (i + 1) }));
  const fixed = fixedNote ? [fixedNote] : [];
  if (n <= 6) return rowRig({ sockets: labs, fixed });
  const a = labs.slice(0, Math.ceil(n / 2)), b = labs.slice(Math.ceil(n / 2));
  return gridRig({ rows: [a, b], fixed, start: { x: 5, y: 5 } });
};
const ordSlots = (items, prefix) => items.map((x, i) => ({ id: 's' + i, label: (prefix || 'step ') + (i + 1), want: x }));
const pairSlots = (pairs, w) => pairs.map((x, i) => ({ id: 's' + i, label: x[0].slice(0, w || 22), want: x[1] }));
const pairRig = (sl, fixed) => rowRig({ sockets: sl.map(s => ({ id: s.id, label: s.label })), fixed });
// an 8-bit register: set each bit with a 0 or a 1. meters show the register in binary as you build it.
function bitsLab(o) {
  const names = o.names || ['bit 7', 'bit 6', 'bit 5', 'bit 4', 'bit 3', 'bit 2', 'bit 1', 'bit 0'], tg = o.target;
  const sl = names.map((n, i) => ({ id: 'b' + i, label: n, want: tg[i] }));
  const top = sl.slice(0, 4).map(s => ({ id: s.id, label: s.label })), bot = sl.slice(4).map(s => ({ id: s.id, label: s.label }));
  const rig = gridRig({ rows: [top, bot], fixed: [{ x: 5, y: 5, kind: 'BOX', label: o.reg, sub: o.startText || 'your register', info: o.info || '' }], start: { x: 5, y: 4 } });
  return slot({ slots: sl, rig, parts: ['0', '1'], q: o.q, teach: o.teach, hint: o.hint, guide: o.guide, count: false, why: o.why, meters: p => [meterOf(o.reg, '0b' + sl.map(s => p[s.id].label).join(''))],
    note: (p, g) => g === 8 ? 'Every bit is right.' : 'Compare with what the code does to each bit.', fail: o.fail || 'Some bits are not what the code would produce.' });
}

/* ---- 1 ---- */
ML(1, 'Three Kinds of Chips', [
  { t: 'lab', tier: 1, hint: 'ASIC: fixed forever. Microcontroller: you write code, cheap. General CPU: runs a full OS, flexible, expensive.', q: '', gen() {
    const sl = pairSlots([['Wired for one job, never changes', 'ASIC'], ['You program it, tied to fixed pins', 'Microcontroller'], ['Runs a full operating system', 'General-purpose CPU']], 24);
    return SL({ slots: sl, rig: pairRig(sl, sl.map((s, i) => ({ x: [2, 5, 8][i], y: 3, kind: 'BOX', label: 'chip ' + (i + 1), sub: s.label.slice(0, 22), info: s.label }))), parts: ['ASIC', 'Microcontroller', 'General-purpose CPU'], guide: true, q: '<b>Build:</b> an <b>embedded system</b> is a small computer built into a product to do one job. Name the chip tier that each description fits.', teach: '<p>Three tiers: an <b>ASIC</b> is wired for one job and never changes (very cheap at volume). A <b>microcontroller</b> is reprogrammable but tied to fixed pins and a small memory: <b>this course programs this tier</b>. A <b>general-purpose CPU</b> runs a full operating system: flexible but expensive. (ASIC is about how a chip is <i>built</i>; RISC is about its instruction set. They are not opposites.)</p>', why: 'ASIC fixed, microcontroller reprogrammable, CPU full OS.' }); } },
  { t: 'lab', tier: 2, hint: 'Exact real-time control loops are the microcontroller’s job: no operating system in the way.', q: '', gen() {
    const sl = pairSlots([['Toaster oven timer', 'Microcontroller'], ['Laptop', 'General-purpose CPU'], ['Chip in millions of cheap toys', 'ASIC']], 24);
    return SL({ slots: sl, rig: pairRig(sl), parts: ['ASIC', 'Microcontroller', 'General-purpose CPU'], count: false, q: '<b>Build:</b> which tier of chip suits each product?', teach: '<p>Pick by the job: fixed and massive volume → ASIC. Reading a sensor and reacting in an exact, predictable time → microcontroller. Running many flexible programs → general-purpose CPU.</p>', why: 'Timer: microcontroller. Laptop: CPU. Millions of identical toys: ASIC.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'Speed and efficiency → ASIC. Exact real-time loop → microcontroller. Flexible big-picture software → CPU.', q: '', gen() {
    const sl = pairSlots([['Find lanes in camera images, fast and efficient', 'ASIC'], ['Control the brake motor in exact time', 'Microcontroller'], ['Plan the route, run the maps', 'General-purpose CPU']], 24);
    return SL({ slots: sl, rig: pairRig(sl, sl.map((s, i) => ({ x: [2, 5, 8][i], y: 3, kind: 'BOX', label: 'job ' + (i + 1), sub: s.label.slice(0, 22), info: s.label }))), parts: ['ASIC', 'Microcontroller', 'General-purpose CPU'], count: false, q: '<b>Build:</b> a self-driving car uses all three tiers at once. Match each job to the right tier (walk to a job box and press Space to read it).', teach: '<p>ASICs win where speed and power efficiency beat flexibility. Microcontrollers handle exact real-time loops. Full CPUs run flexible big-picture software.</p>', why: 'Vision ASIC, brake loop microcontroller, planning CPU.' }); } },
]);

/* ---- 2 ---- */
ML(2, 'The Memory Map and SFRs', [
  { t: 'lab', tier: 1, hint: 'Flash holds the program. SRAM holds variables. EEPROM keeps settings. I/O registers control the hardware.', q: '', gen() {
    const sl = pairSlots([['Flash (256 KB)', 'Your program'], ['SRAM (8 KB)', 'Variables while running'], ['EEPROM (4 KB)', 'Settings saved long term'], ['I/O registers', 'The hardware control panel']], 20);
    return SL({ slots: sl, rig: pairRig(sl), parts: ['Your program', 'Variables while running', 'Settings saved long term', 'The hardware control panel'], guide: true, q: '<b>Build:</b> match each memory region to what it holds.', teach: '<p>The chip keeps code and variables in <b>two separate memories</b> (a <b>Harvard</b> architecture), so it can fetch the next instruction <b>and</b> read a variable at the same time. Regions: <b>Flash</b> (program), <b>SRAM</b> (variables), <b>EEPROM</b> (saved settings), and the <b>I/O registers</b>. Every piece of hardware is controlled through a named address called an <b>SFR</b> (special function register): writing to it flips a real switch.</p>', why: 'Flash program, SRAM variables, EEPROM settings, I/O control panel.' }); } },
  { t: 'lab', tier: 2, hint: 'Flash and EEPROM survive power loss. SRAM and the I/O registers do not.', q: '', gen() {
    const sl = pairSlots([['Flash', 'Kept'], ['SRAM', 'Lost'], ['EEPROM', 'Kept'], ['I/O registers', 'Lost']], 20);
    return SL({ slots: sl, rig: pairRig(sl), parts: ['Kept', 'Lost'], count: false, q: '<b>Build:</b> power goes off, then comes back. Is each memory kept or lost?', teach: '<p>Non-volatile (kept): <b>Flash</b> and <b>EEPROM</b>. Volatile (lost): <b>SRAM</b> and the <b>I/O registers</b>.</p>', why: 'Flash and EEPROM are kept.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'tick = 1 ÷ clock frequency. 1 MHz → 1 µs = 1000 ns.', q: '', gen() { const f = pick([1, 2, 4, 8, 16]), tgt = 1000 / f;
    return dial({ rig: benchRig({ left: srcB('clock', 'choose the speed', 'The chip’s clock.'), right: boxB('tick', 'one clock tick', 'The time of one clock tick.'), sockets: [{ id: 'r', label: 'clock rate', x: 5 }] }),
      q: '<b>Build:</b> choose the clock rate so that one clock tick lasts <b>' + N2(tgt) + ' ns</b>.', teach: '<p>Every timer counts the same clock ticks, slowed down by different amounts. One tick lasts <b>1 ÷ f</b>: at 1 MHz that is 1 µs = 1000 ns.</p>', parts: [1, 2, 4, 8, 16].map(v => PT(v + ' MHz', v, 'BOX')), read: p => 1000 / p.v, target: tgt, tol: .001, label: 'Tick', show: x => N2(x) + ' ns', note: (p, x) => '1 ÷ ' + p.v + ' MHz = ' + N2(x) + ' ns.', why: f + ' MHz.' }); } },
]);

/* ---- 3 ---- */
ML(3, 'Digital I/O: DDR, PORT and PIN', [
  { t: 'lab', tier: 1, hint: 'DDR bit = 1 makes the pin an output. Only bit 5.', q: '', gen() { return bitsLab({ reg: 'DDRB', startText: 'starts at 00000000', names: ['PB7', 'PB6', 'PB5', 'PB4', 'PB3', 'PB2', 'PB1', 'PB0'], target: '00100000', guide: true, q: '<b>Build:</b> DDRB is all zeros (every pin is an input). Set the bits so that <b>only PB5</b> becomes an output.', teach: '<p>Every pin is controlled by three registers that share a letter. <b>DDRx</b> (data direction): <b>1 = output, 0 = input</b>: set this first. <b>PORTx</b>: drives an output high or low, or turns on an input’s pull-up. <b>PINx</b>: reads the live level (read only). In code: <code>DDRB |= (1&lt;&lt;DDB5);</code> sets just bit 5.</p>', why: 'DDRB = 00100000.' }); } },
  { t: 'lab', tier: 2, hint: 'Keep the bits that are already set (01010010) and also set bit 0 and bit 3.', q: '', gen() { return bitsLab({ reg: 'DDRB', startText: 'now 01010010', names: ['PB7', 'PB6', 'PB5', 'PB4', 'PB3', 'PB2', 'PB1', 'PB0'], target: '01011011', q: '<b>Build:</b> DDRB is currently <code>01010010</code>. Make PB0 and PB3 outputs <b>without changing any other pin</b>. What does DDRB become?', teach: '<p><code>DDRB |= (1&lt;&lt;DDB0)|(1&lt;&lt;DDB3);</code> ORs in just those two bits and keeps the other six. Never write the whole register: that would reset the other seven pins.</p>', why: '01010010 OR 00001001 = 01011011.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'PORTB: PB7 (an output) high = 1. PB1 and PB0 are inputs, so a 1 turns their pull-up on. The rest 0.', q: '', gen() { return bitsLab({ reg: 'PORTB', startText: 'PB7 out · PB6–0 in', names: ['PB7', 'PB6', 'PB5', 'PB4', 'PB3', 'PB2', 'PB1', 'PB0'], target: '10000011', q: '<b>Build:</b> DDRB makes PB7 an output and PB0–PB6 inputs. Set PORTB so that PB7 drives <b>high</b>, PB0 and PB1 have their <b>pull-ups on</b>, and everything else is low.', teach: '<p>For an <b>output</b>, a PORT bit of 1 drives the pin high. For an <b>input</b>, a PORT bit of 1 turns on the internal pull-up. To learn the real state of a pin, read <b>PINx</b>, never PORTx (PORTx is what you asked for; PINx is what it actually is).</p>', why: 'PORTB = 10000011.' }); } },
]);

/* ---- 4 ---- */
ML(4, 'Bit Surgery: Set, Clear, Toggle', [
  { t: 'lab', tier: 1, hint: 'OR sets, AND with NOT clears, XOR flips, AND tests.', q: '', gen() {
    const sl = pairSlots([['Set a bit', 'REG |= (1<<N)'], ['Clear a bit', 'REG &= ~(1<<N)'], ['Toggle a bit', 'REG ^= (1<<N)'], ['Test a bit', 'REG & (1<<N)']], 20);
    return SL({ slots: sl, rig: pairRig(sl), parts: sl.map(s => s.want), guide: true, q: '<b>Build:</b> match each goal to its code pattern.', teach: '<p>One register controls 8 pins at once; writing the whole register resets the other seven. Change <b>one bit at a time</b>: <b>set</b> <code>REG |= (1&lt;&lt;N)</code>, <b>clear</b> <code>REG &amp;= ~(1&lt;&lt;N)</code>, <b>toggle</b> <code>REG ^= (1&lt;&lt;N)</code>, and <b>test</b> <code>REG &amp; (1&lt;&lt;N)</code> (non-zero if the bit is 1).</p>', why: 'OR sets, AND with NOT clears, XOR toggles, AND tests.' }); } },
  { t: 'lab', tier: 2, hint: 'AND with ~(1<<4) clears bit 4 and keeps the others.', q: '', gen() { return bitsLab({ reg: 'PORTB', startText: 'now 00010110', target: '00000110', q: '<b>Build:</b> PORTB is <code>00010110</code>. Run <code>PORTB &amp;= ~(1&lt;&lt;4);</code>. What is PORTB afterwards?', teach: '<p><code>~(1&lt;&lt;4)</code> is <code>11101111</code>. ANDing with it forces bit 4 to 0 and keeps every other bit.</p>', why: '00010110 AND 11101111 = 00000110.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: '(1<<0)|(1<<5) is 00100001. OR sets both bits.', q: '', gen() { return bitsLab({ reg: 'PORTB', startText: 'now 10001110', target: '10101111', q: '<b>Build:</b> PORTB is <code>10001110</code>. Run <code>PORTB |= (1&lt;&lt;0)|(1&lt;&lt;5);</code>. What is PORTB afterwards?', teach: '<p>Combine masks with OR to set several bits at once. OR can set a bit but never clears one.</p>', why: '10001110 OR 00100001 = 10101111.' }); } },
]);

/* ---- 5 ---- */
ML(5, 'Masks and Nibbles', [
  { t: 'lab', tier: 1, hint: '0xF0 = 1111 0000 keeps the upper nibble. 0x0F keeps the lower nibble.', q: '', gen() {
    const sl = pairSlots([['0xF0', 'Keeps bits 7–4'], ['0x0F', 'Keeps bits 3–0']], 10);
    return SL({ slots: sl, rig: pairRig(sl), parts: ['Keeps bits 7–4', 'Keeps bits 3–0', 'Keeps every bit'], guide: true, q: '<b>Build:</b> a <b>nibble</b> is 4 bits. Which half of a byte does each mask keep?', teach: '<p>A <b>mask</b> is a pattern you AND with a value to force some bits to 0. <b>0xF0</b> = 1111 0000 keeps the <b>upper nibble</b> (bits 7–4). <b>0x0F</b> = 0000 1111 keeps the <b>lower nibble</b> (bits 3–0). Bits are numbered from 0 on the right. Bits have no meaning on their own: <code>65 &amp; 0x0F</code> = 1 whether you meant the number 65 or the letter ‘A’.</p>', why: '0xF0 keeps the top four, 0x0F keeps the bottom four.' }); } },
  { t: 'lab', tier: 2, hint: 'Upper nibble of PORTA stays (1010). Lower nibble comes from num (0000).', q: '', gen() { return bitsLab({ reg: 'PORTA', startText: 'was 10101110', target: '10100000', q: '<b>Build:</b> PORTA is <code>10101110</code> and num is <code>10000000</code>. Run <code>PORTA = (PORTA &amp; 0xF0) | (num &amp; 0x0F);</code>. What is PORTA afterwards?', teach: '<p>To write a 4-bit value to PA0–PA3 and <b>keep</b> PA4–PA7: <b>mask first, then OR</b>. <code>PORTA &amp; 0xF0</code> clears the lower nibble and keeps the upper. <code>num &amp; 0x0F</code> keeps only the bits you want. OR combines them.</p>', why: 'Upper nibble kept: 1010. Lower nibble from num: 0000. Result 10100000.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'Clear just the bits you replace, then OR in the new ones.', q: '', gen() {
    return slot({ slots: [{ id: 'a', label: 'the one-liner', want: 'PORTA = (PORTA & 0xF0) | (num & 0x0F);' }], rig: rowRig({ sockets: [{ id: 'a', label: 'the one-liner' }] }), parts: ['PORTA = (PORTA & 0xF0) | (num & 0x0F);', 'PORTA = num & 0x0F;', 'PORTA |= num;', 'PORTA &= num;'], count: false, q: '<b>Build:</b> which one-liner writes a 4-bit number to PA0–PA3 <b>without disturbing PA4–PA7</b>?', teach: '<p>OR alone cannot clear a bit, and AND alone cannot set one. Plain <code>PORTA = num &amp; 0x0F</code> stomps PA4–PA7 on every call. You need <b>both</b>: AND to clear the old bits, OR to bring in the new ones.</p>', why: 'Mask then OR keeps the upper nibble.' }); } },
]);

/* ---- 6 ---- */
ML(6, 'Pull-ups and Polling', [
  { t: 'lab', tier: 1, hint: 'Nothing connected = random. Pull-up with the switch open = 1. Switch pressed = 0 (active-low).', q: '', gen() {
    const sl = pairSlots([['Input with nothing connected', 'Random (floating)'], ['Pull-up on, button not pressed', '1'], ['Pull-up on, button pressed', '0']], 22);
    return SL({ slots: sl, rig: pairRig(sl), parts: ['Random (floating)', '1', '0'], guide: true, q: '<b>Build:</b> what does the pin read in each situation?', teach: '<p>An input with nothing connected <b>floats</b> and reads random noise. A <b>pull-up</b> resistor holds it at 1. A button to ground pulls it to <b>0</b> when pressed, so the logic is <b>active-low</b>: pressed = 0, released = 1.</p>', why: 'Floating is random; the pull-up gives 1; pressed gives 0.' }); } },
  { t: 'lab', tier: 2, hint: 'Direction first, then the pull-up, then read PIN. A 0 means pressed.', q: '', gen() { const items = ['Make the pin an input (DDR bit = 0)', 'Turn the pull-up on (PORT bit = 1)', 'Read PINx', 'A 0 means pressed'];
    return SL({ slots: ordSlots(items, 'step '), rig: ordRig(4, 'step '), parts: items, count: false, q: '<b>Build:</b> put the steps of reading a switch in order.', teach: '<p>Set the direction, enable the pull-up, then read <b>PINx</b>. <b>Polling</b> (re-checking in a loop) can miss a fast press: if your code is busy when a quick press-and-release happens, the pin is back to normal by the next check. That weakness is why <b>interrupts</b> exist.</p>', why: 'DDR input, pull-up, read PIN, 0 = pressed.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'PB6 is already an input. Only bit 6 changes to 1: PORTB |= (1<<PORTB6).', q: '', gen() { return bitsLab({ reg: 'PORTB', startText: 'now 00111000', target: '01111000', q: '<b>Build:</b> PB6 is an input (its DDRB bit is 0). PORTB is <code>00111000</code>. Turn the <b>pull-up on for PB6 only</b>. What is PORTB afterwards?', teach: '<p><code>PORTB |= (1&lt;&lt;PORTB6);</code> enables the pull-up on PB6 and changes nothing else.</p>', why: '00111000 OR 01000000 = 01111000.' }); } },
]);

/* ---- 7 ---- */
ML(7, 'Timer0: Normal and CTC Modes', [
  { t: 'lab', tier: 1, hint: 'TCNT0 is the counter, TCCR0 sets the mode and prescaler, OCR0A is the compare value, TIFR0 holds the flags.', q: '', gen() {
    const sl = pairSlots([['TCNT0', 'The counter itself'], ['TCCR0A/B', 'Control: mode and prescaler'], ['OCR0A', 'Compare value'], ['TIFR0', 'Flags']], 12);
    return SL({ slots: sl, rig: pairRig(sl), parts: sl.map(s => s.want), guide: true, q: '<b>Build:</b> match each Timer0 register to its role.', teach: '<p>Timer0 is a real counter that counts up <b>on its own</b>. <b>Normal</b> mode counts 0 to 255 then overflows. <b>CTC</b> (Clear Timer on Compare) mode counts to the number in <b>OCR0A</b> then restarts. The <b>prescaler</b> (CS bits) slows the count. If the CS bits are <b>000</b>, the timer is <b>off</b> (no clock source): the most common reason a timer never counts.</p>', why: 'TCNT0 counter, TCCR0 control, OCR0A compare, TIFR0 flags.' }); } },
  { t: 'lab', tier: 2, hint: 'tick = prescaler ÷ clock. 16 MHz: for 4 µs the prescaler is 64.', q: '', gen() { const tgt = 4;
    return dial({ rig: benchRig({ left: srcB('16 MHz', 'clock', 'The clock is 16 MHz.'), right: boxB('tick', 'one timer tick', 'One Timer0 tick.'), sockets: [{ id: 'r', label: 'prescaler', x: 5 }] }),
      q: '<b>Build:</b> the clock is 16 MHz. Choose the prescaler so one Timer0 tick lasts <b>4 µs</b>.', teach: '<p>A tick is not a fixed time. <b>tick = prescaler ÷ F<sub>clk</sub></b>.</p>', parts: [1, 8, 64, 256, 1024].map(v => PT('÷' + v, v, 'BOX')), read: p => p.v / 16, target: tgt, tol: .01, label: 'Tick', show: x => N2(x) + ' µs', note: (p, x) => p.v + ' ÷ 16 MHz = ' + N2(x) + ' µs.', why: 'prescaler 64.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'Td = count × prescaler ÷ Fclk. A full 0-to-255 count at ÷64 and 16 MHz is 255 × 4 µs.', q: '', gen() { const tgt = 1020;
    return dial({ rig: benchRig({ left: srcB('0 → 255', 'Normal mode', 'Timer0 in Normal mode counts 0 to 255.'), right: boxB('time', 'one full count', 'Time for one 0-to-255 count.'), sockets: [{ id: 'r', label: 'prescaler', x: 5 }] }),
      q: '<b>Build:</b> Timer0 in Normal mode on a 16 MHz clock. Choose the prescaler so one 0-to-255 count takes about <b>1 ms</b> (1020 µs).', teach: '<p><b>T<sub>d</sub> = count × prescaler ÷ F<sub>clk</sub></b>. At ÷64 and 16 MHz that is 255 × 4 µs = 1020 µs. At ÷1024 it would be about 16 ms.</p>', parts: [1, 8, 64, 256, 1024].map(v => PT('÷' + v, v, 'BOX')), read: p => 255 * p.v / 16, target: tgt, tol: .02, label: 'Count time', show: x => N2(x) + ' µs', note: (p, x) => '255 × ' + p.v + ' ÷ 16 MHz = ' + N2(x) + ' µs.', why: 'prescaler 64.' }); } },
]);

/* ---- 8 ---- */
ML(8, 'Timer Math and Timer1', [
  { t: 'lab', tier: 1, hint: 'OCR0A = (Td × Fclk ÷ prescaler) − 1. For 0.5 ms at ÷64, 16 MHz: 125 − 1 = 124.', q: '', gen() { const tgt = 500;
    return dial({ rig: benchRig({ left: srcB('÷64 · 16 MHz', 'CTC mode', 'Prescaler 64 on a 16 MHz clock.'), right: boxB('delay', 'compare match', 'The time until the compare match.'), sockets: [{ id: 'r', label: 'OCR0A', x: 5 }] }),
      q: '<b>Build:</b> a prescaler of 64 on a 16 MHz clock, CTC mode. Choose the value for OCR0A that gives a delay of <b>0.5 ms</b>.', teach: '<p>To make CTC ring after a delay: <b>OCR0A = (T<sub>d</sub> × F<sub>clk</sub> ÷ Prescaler) − 1</b>. The −1 is there because counting starts at 0. <b>Timer1</b> is the same idea but <b>16 bits</b> wide (counts to 65,535).</p>', parts: [62, 124, 249, 255, 500].map(v => PT('' + v, v, 'BOX')), read: p => (p.v + 1) * 4, target: tgt, tol: .003, guide: true, label: 'Delay', show: x => N2(x) + ' µs', note: (p, x) => '(' + p.v + ' + 1) × 4 µs = ' + N2(x) + ' µs.', why: '(0.0005 × 16,000,000 ÷ 64) − 1 = 124.' }); } },
  { t: 'lab', tier: 2, hint: 'OCR0A = Td ÷ tick − 1, with tick = 4 µs at ÷64.', q: '', gen() { const ms = pick([0.25, 0.5, 0.75, 1]), tgt = ms * 1000, ocr = ms * 250 - 1;
    return dial({ rig: benchRig({ left: srcB('÷64 · 16 MHz', 'CTC', 'A 4 µs tick.'), right: boxB('delay', 'compare match', 'Delay to the match.'), sockets: [{ id: 'r', label: 'OCR0A', x: 5 }] }),
      q: '<b>Build:</b> prescaler 64, 16 MHz (4 µs per tick). Choose OCR0A for a delay of <b>' + ms + ' ms</b>.', teach: '<p>OCR0A = (delay ÷ 4 µs) − 1.</p>', parts: pickR([61, 62, 124, 125, 187, 249, 250, 255], 5, ocr).map(v => PT('' + v, v, 'BOX')), read: p => (p.v + 1) * 4, target: tgt, tol: .003, label: 'Delay', show: x => N2(x) + ' µs', note: (p, x) => N2(x) + ' µs.', why: 'OCR0A = ' + ocr + '.' }); } },
  { t: 'lab', tier: 3, boss: true, hint: 'Timer1 is 16-bit: OCR1A = (0.01 × 16,000,000 ÷ 8) − 1 = 19999. Write the high byte first.', q: '', gen() { const tgt = 10000;
    return dial({ rig: benchRig({ left: srcB('÷8 · 16 MHz', 'Timer1 CTC', 'Timer1 with a prescaler of 8 on a 16 MHz clock.'), right: boxB('period', '10 ms wanted', 'Wanted: 10 ms.'), sockets: [{ id: 'r', label: 'OCR1A', x: 5 }] }),
      q: '<b>Build:</b> Timer1 in CTC mode, prescaler 8, 16 MHz. Choose OCR1A for an <b>exact 10 ms</b> period.', teach: '<p>Timer1’s 16-bit registers are moved 8 bits at a time. <b>Write: high byte first, then low byte. Read: low byte first, then high byte.</b> Do it backwards and you silently get the wrong number.</p>', parts: [1999, 19999, 20000, 39999, 65535].map(v => PT('' + v, v, 'BOX')), read: p => (p.v + 1) * 0.5, target: tgt, tol: .00001, label: 'Period', show: x => N2(x) + ' µs', note: (p, x) => '(' + p.v + ' + 1) × 0.5 µs = ' + N2(x) + ' µs.', why: '(0.01 × 16,000,000 ÷ 8) − 1 = 19999.' }); } },
]);

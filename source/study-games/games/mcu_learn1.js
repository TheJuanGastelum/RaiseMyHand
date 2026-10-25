/* Teaching pages for Embedded Quest, levels 1-8. Each level has three lessons (warm-up, challenge, hard). They show before the questions. */
const F = x => '<div class="formula">' + x + '</div>';
const EX = (t, x) => '<div class="example"><b class="eh">' + t + '</b>' + x + '</div>';
const TRAP = x => '<div class="trap"><b class="eh">Watch out</b>' + x + '</div>';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const C = s => '<code>' + esc(s) + '</code>';
const CB = s => '<pre class="code">' + esc(s) + '</pre>';
const LEARN = (idx, topic, ls) => {
  const L = MCU_LEVELS[idx - 1];
  if (!L || L.topic !== topic) throw new Error('lesson/level mismatch at ' + idx + ': ' + (L && L.topic) + ' vs ' + topic);
  L.learn = { 1: ls[0], 2: ls[1], 3: ls[2] };
};

LEARN(1, 'Three Kinds of Chips', [
 { t: 'What is an embedded system?', h:
  '<p>An <b>embedded system</b> is a small computer built into a product to do <b>one job</b>: wait for buttons, run a heater, spin a motor. You do not use it like a laptop. It just does its task.</p>' +
  '<p>Chips for such jobs come in three tiers.</p>',
  a: 'A doorbell with one fixed ring, a smart-home brain you can reprogram, and a laptop that runs any app. Three levels of flexibility.' },
 { t: 'The three tiers', h:
  '<ul><li><b>ASIC</b> (application-specific integrated circuit): wired for one job and <b>never changes</b>. Very cheap at high volume, but fixed forever.</li><li><b>Microcontroller</b>: you write code for it, cheap, reprogrammable, but tied to fixed pins and a small memory. <b>This course programs this tier.</b></li><li><b>General-purpose CPU</b>: runs a full operating system. Flexible, but expensive.</li></ul>' +
  TRAP('ASIC and RISC are not opposites. ASIC is about how the chip is <b>built</b>. RISC is about its <b>instruction set</b>. A microcontroller can be RISC-based and still not be an ASIC.'),
  a: 'The fixed doorbell rings one tune and never changes. The smart-home brain can be reprogrammed. The laptop can run anything but costs the most.' },
 { t: 'Why program the microcontroller directly?', h:
  '<p>This tier is for <b>real-time control loops</b>: read a sensor, react in an exact and predictable time. There is no operating system in the way to delay you.</p>' +
  EX('A self-driving car uses all three', '<b>ASICs</b> where speed and power efficiency beat flexibility (image processing). <b>Microcontrollers</b> for exact real-time loops (motor control, braking). <b>Full CPUs</b> for flexible big-picture software (navigation).'),
  a: 'Each device is picked for what it does best: the fixed ring where speed wins, the smart brain for exact timing, the laptop for flexibility.' }
]);

LEARN(2, 'The Memory Map and SFRs', [
 { t: 'The chip’s memories', h:
  '<p>The chip has several separate memories:</p>' +
  '<ul><li><b>Flash</b> (256 KB): holds your program. Survives power-off.</li><li><b>SRAM</b> (8 KB): holds variables while running. Erased when power goes off.</li><li><b>EEPROM</b> (4 KB): small storage for settings. Survives power-off.</li><li><b>I/O registers</b> (64 + 416 bytes): the control panel for the hardware. Not saved at power-off.</li></ul>' +
  EX('Ratio', 'Flash is 256 KB and EEPROM is 4 KB: 256 ÷ 4 = <b>64 times</b> bigger.'),
  a: 'The house has two notebooks (the manual for the program, the whiteboard for variables) and a control panel of labeled switches.' },
 { t: 'SFRs and the clock', h:
  '<p>Every piece of hardware is controlled through a named memory address called an <b>SFR</b> (special function register). Writing to an SFR is not saving a value in RAM. You are <b>flipping a physical switch</b> on the chip.</p>' +
  '<p>The chip runs on a clock. Each tick lasts the inverse of the clock frequency.</p>' + F('tick = 1 ÷ f') +
  EX('Example', 'At 1 MHz, one tick is 1 ÷ 1,000,000 s = 1 µs = <b>1000 ns</b>. Every timer counts these same ticks, slowed down by different amounts.'),
  a: 'Writing to the control panel moves a real switch. Writing to the whiteboard only changes a note.' },
 { t: 'Harvard architecture', h:
  '<p>Code and variables sit in two <b>physically separate</b> memories. This is a <b>Harvard architecture</b>.</p>' +
  '<p>Because of this, the CPU can fetch the next instruction <b>and</b> read a variable at the same time. It never waits in line for one shared memory. That is why timing on this chip is so predictable.</p>' +
  EX('Which survive power-off?', 'Flash and EEPROM: <b>yes</b>. SRAM and the I/O registers: <b>no</b>.'),
  a: 'One person reads the manual while another reads the whiteboard. Neither waits for the other.' }
]);

LEARN(3, 'Digital I/O: DDR, PORT and PIN', [
 { t: 'Three registers per port', h:
  '<p>Pins are grouped in <b>ports</b> of up to 8 pins (PORTB, PORTD, …). Every pin is controlled by three registers that share a letter (for port B):</p>' +
  '<ul><li><b>DDRB</b> (data direction): <b>1 = output, 0 = input</b>. Set this first.</li><li><b>PORTB</b>: for an output, drives the pin high (1) or low (0). For an input, a 1 turns on the <b>pull-up</b>.</li><li><b>PINB</b>: reads the live level on the pin. <b>Read only.</b></li></ul>' +
  '<p>Direction first, then the setting, then a way to check what is really happening.</p>',
  a: 'Every door needs three settings: in or out, open or shut, and what is really happening.' },
 { t: 'Making a pin an output', h:
  '<p>Bits are numbered from 0 on the right. Bit 5 of DDRB is PB5. To set a single bit, use OR with a shifted 1:</p>' +
  CB('DDRB |= (1<<DDB5);   // PB5 becomes an output') +
  '<p>To set two bits at once, OR them together:</p>' + CB('DDRB |= (1<<DDB0)|(1<<DDB3);   // PB0 and PB3 become outputs') +
  '<p>The OR sets only the named bits and keeps the other six exactly as they were.</p>',
  a: 'Flip only the doors you want, and leave the rest as they are.' },
 { t: 'Reading a button, and reading reality', h:
  '<p>To read a pushbutton, read <b>PINx</b>. PORTx is what you <i>asked</i> the pin to do. PINx is what it <i>actually</i> is. They can differ.</p>' +
  EX('Setting up pull-ups', 'DDRB makes PB7 an output and PB0–PB6 inputs. You want PB7 high and the pull-ups on PB0 and PB1. PORTB = 1000 0011 in binary: PB7 (output) high, PB1 and PB0 (inputs) pull-ups on, the rest 0.') +
  TRAP('To learn the real state of a pin, read PINx. Never read PORTx for that.'),
  a: 'The sign on the door says what you wanted. Looking through the keyhole says what is really happening.' }
]);

LEARN(4, 'Bit Surgery: Set, Clear, Toggle', [
 { t: 'Never write the whole register', h:
  '<p>One register controls 8 pins at once. If you write the whole register, you also reset the other seven pins.</p>' + CB('PORTB = 0b00100000;   // turns on PB5 but turns OFF all others!') +
  '<p>Always change <b>one bit at a time</b> and leave the rest alone.</p>',
  a: 'Flip one door without slamming the other seven.' },
 { t: 'Set, clear, toggle', h:
  '<p>Three patterns, using a mask that has a 1 in the position you want:</p>' +
  '<ul><li><b>Set</b> a bit to 1: ' + C('REG |= (1<<N);') + '</li><li><b>Clear</b> a bit to 0: ' + C('REG &= ~(1<<N);') + '</li><li><b>Toggle</b> (flip) a bit: ' + C('REG ^= (1<<N);') + '</li><li><b>Test</b> a bit: ' + C('REG & (1<<N)') + ' is non-zero if the bit is 1.</li></ul>' +
  EX('Set', 'PORTB = 01110010 and you run ' + C('PORTB |= (1<<0);') + '. OR with 0000 0001 forces bit 0 to 1: <b>01110011</b>.') +
  EX('Clear', 'PORTB = 00010110. ' + C('PORTB &= ~(1<<4);') + ' ANDs with 1110 1111, clearing bit 4: <b>00000110</b>.') +
  EX('Toggle', 'PORTB = 10111110. ' + C('PORTB ^= (1<<4);') + ' flips bit 4 (it was 1): <b>10101110</b>.'),
  a: 'One stencil per job: one that props a door open, one that slams it shut, and one that swaps its state.' },
 { t: 'Several bits at once', h:
  '<p>Combine masks with OR to change several bits in one statement:</p>' +
  CB('PORTB |= (1<<0)|(1<<5);   // set bit 0 and bit 5') +
  EX('Example', 'PORTB = 10001110. OR with 0010 0001 gives <b>10101111</b>.') +
  EX('Checking a bit', 'To check if bit 6 of PINB is set: ' + C('PINB & (1<<6)') + '. AND with a single-bit mask is non-zero only if that bit is 1.'),
  a: 'Use one stencil with two holes to flip two doors in one go.' }
]);

LEARN(5, 'Masks and Nibbles', [
 { t: 'Nibbles and masks', h:
  '<p>A <b>nibble</b> is 4 bits, half a byte. The <b>upper nibble</b> is bits 7–4. The <b>lower nibble</b> is bits 3–0. Two hex digits make a byte, one digit per nibble.</p>' +
  '<ul><li><b>0xF0</b> = 1111 0000: keeps the upper nibble.</li><li><b>0x0F</b> = 0000 1111: keeps the lower nibble.</li></ul>' +
  '<p>A <b>mask</b> is a pattern you AND with a value to force some bits to 0.</p>' +
  EX('Example', C('128 & 0xF0') + ' = 1000 0000 AND 1111 0000 = 1000 0000 = <b>128</b>.'),
  a: 'A stencil with the left four windows open and the right four covered keeps only the left four doors.' },
 { t: 'Bits have no meaning on their own', h:
  '<p>A <code>char</code> is just 8 bits. The letter <b>\'A\'</b> is ASCII 65 = 0100 0001. A function that does ' + C('num & 0x0F') + ' cannot tell whether you meant the number 65 or the letter A. It just keeps the low four bits.</p>' +
  EX('Example', C('65 & 0x0F') + ' = 0100 0001 AND 0000 1111 = 0000 0001 = <b>1</b>.'),
  a: 'The stencil does not read the label on the part. It only lets some spots through.' },
 { t: 'Writing four pins without touching the rest', h:
  '<p>To write a 4-bit number to PA0–PA3 and <b>keep</b> PA4–PA7: mask first, then OR.</p>' +
  CB('PORTA = (PORTA & 0xF0) | (num & 0x0F);') +
  '<ol><li><code>PORTA &amp; 0xF0</code> clears the lower nibble and keeps the upper one.</li><li><code>num &amp; 0x0F</code> keeps only the four bits you want to write.</li><li>OR combines them.</li></ol>' +
  EX('Example', 'PORTA = 10101110, num = 10000000. Upper nibble kept: 1010. Lower nibble from num: 0000. Result <b>10100000</b>.') +
  TRAP('Plain ' + C('PORTA = num & 0x0F;') + ' stomps PA4–PA7 every call. OR alone cannot clear a bit, and AND alone cannot set one. You need both.'),
  a: 'Cover the four doors you want to change, wipe them, then paint in the new settings. The other four are never touched.' }
]);

LEARN(6, 'Pull-ups and Polling', [
 { t: 'Floating inputs and pull-ups', h:
  '<p>An input pin with nothing connected <b>floats</b>. It reads random noise, sometimes 1, sometimes 0.</p>' +
  '<p>A <b>pull-up</b> resistor gently holds the pin at 1. A button wired to ground then pulls it to 0 when pressed. So the logic is <b>active-low</b>: pressed = 0, released = 1. That is backwards from what you might guess.</p>',
  a: 'A loose door swings in the wind. A spring pulls it shut until someone pushes it open.' },
 { t: 'Reading a switch step by step', h:
  '<p>The order:</p>' +
  '<ol><li>Make the pin an input: its DDR bit is 0.</li><li>Turn on the pull-up: write a 1 to its PORT bit.</li><li>Read PINx. A <b>0 means pressed</b>.</li></ol>' +
  CB('DDRB  &= ~(1<<DDB6);    // PB6 input\nPORTB |=  (1<<PORTB6);  // pull-up on\nif (!(PINB & (1<<PINB6))) { /* pressed */ }') +
  TRAP('With a pull-up, <b>1 = not pressed and 0 = pressed</b>. With no pull-up, the pin can float, so you cannot trust the reading.'),
  a: 'Set the door to swing in only, add the spring, then peek through the keyhole.' },
 { t: 'The weakness of polling', h:
  '<p><b>Polling</b> means re-checking the pin over and over in a loop. If the code is busy with a long calculation when a quick press-and-release happens, the pin is back to normal by the next check, and the press is <b>missed</b>.</p>' +
  '<p>That weakness is exactly why <b>interrupts</b> exist (coming up in level 9).</p>',
  a: 'If you only peek now and then, a visitor who knocks and leaves between peeks is never seen.' }
]);

LEARN(7, 'Timer0: Normal and CTC Modes', [
 { t: 'A timer is a real counter', h:
  '<p>Timer0 is a hardware counter that counts up <b>on its own</b>. Its count is the number in <b>TCNT0</b>, which goes up on every (slowed-down) clock tick, with no code running.</p>' +
  '<p>The <b>prescaler</b> slows the count: with a prescaler of 64, the timer ticks once for every 64 clock ticks. It is set by the <b>CS02:00</b> bits.</p>' +
  TRAP('If CS02:00 = 000, there is <b>no clock source</b>. The timer is off. This is the most common reason a timer never counts.'),
  a: 'A kitchen timer that counts by itself. The prescaler is the gear that makes the count slower.' },
 { t: 'Normal mode and CTC mode', h:
  '<ul><li><b>Normal</b> mode: counts 0 to 255, then overflows back to 0. The overflow sets a flag (TOV0).</li><li><b>CTC</b> (Clear Timer on Compare) mode: counts up to a number you put in <b>OCR0A</b>, then restarts. The match sets a flag (OCF0A).</li></ul>' +
  '<p>Both flags live in <b>TIFR0</b>. The four Timer0 registers: <b>TCNT0</b> (the counter), <b>TCCR0A/B</b> (control), <b>OCR0A</b> (compare value), <b>TIFR0</b> (flags).</p>',
  a: 'Normal always counts to the top before ringing. CTC lets you choose how high it counts before it rings.' },
 { t: 'How long is a tick?', h:
  '<p>A tick is not a fixed time. It depends on the prescaler and the clock.</p>' + F('tick = Prescaler ÷ F<sub>clk</sub>') +
  EX('One tick', 'Clock 16 MHz, prescaler 64: 64 ÷ 16,000,000 = <b>4 µs</b>.') +
  F('T<sub>d</sub> = count × Prescaler ÷ F<sub>clk</sub>') +
  EX('A full 0 to 255 count', '255 × 64 ÷ 16,000,000 ≈ <b>1020 µs</b>, about 1 ms. With a prescaler of 1024 it would be about 16 ms.'),
  a: 'Slow the gear down and each tick takes longer, so the same count rings later.' }
]);

LEARN(8, 'Timer Math and Timer1', [
 { t: 'Turning a delay into a number', h:
  '<p>To make CTC mode ring after a delay T<sub>d</sub>, solve for the number to put in OCR0A:</p>' + F('OCR0A = ( T<sub>d</sub> × F<sub>clk</sub> ÷ Prescaler ) − 1') +
  '<p>The <b>−1</b> is there because the counter starts at 0.</p>' +
  EX('Example', '16 MHz clock, prescaler 64, delay 0.5 ms: (0.0005 × 16,000,000 ÷ 64) − 1 = 125 − 1 = <b>124</b>.'),
  a: 'Turn “wait this long” into the number you set on the dial.' },
 { t: 'Timer1 is 16 bits wide', h:
  '<p>Timer0 is 8-bit (counts 0–255). <b>Timer1</b> is the same idea but <b>16-bit</b>: it counts 0 to <b>65,535</b>, so it can time much longer delays directly.</p>' +
  EX('Example', 'Prescaler 64, 16 MHz: 65,535 × 64 ÷ 16,000,000 = <b>262.14 ms</b> for a full count.') +
  '<p>If you need a delay longer than the counter can count in one pass, loop: poll the flag, or better, let an interrupt count the periods.</p>',
  a: 'A bigger kitchen timer with more digits can count a lot longer before it runs out.' },
 { t: 'Writing a 16-bit register', h:
  '<p>Timer1 registers are 16 bits wide, but the CPU moves only 8 bits at a time. A shared hidden byte makes it work, but you must use the right order:</p>' +
  '<ul><li><b>Write</b>: high byte first, then low byte.</li><li><b>Read</b>: low byte first, then high byte.</li></ul>' +
  TRAP('Do it backwards and you silently get the wrong number, with no error to warn you.') +
  EX('Full setup', 'Timer1 in CTC, prescaler 8, 10 ms at 16 MHz: OCR1A = (0.01 × 16,000,000 ÷ 8) − 1 = 20,000 − 1 = <b>19999</b>. Write the high byte first, then the low byte.'),
  a: 'Two half-notes go through the slot, and the order matters: high half first when writing.' }
]);

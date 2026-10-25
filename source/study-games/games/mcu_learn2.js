/* Teaching pages for Embedded Quest, levels 9-15. */

LEARN(9, 'Interrupts: the Three Switches', [
 { t: 'What an interrupt is', h:
  '<p>An <b>interrupt</b> runs a function automatically when something happens, with no checking by your code. The <b>hardware</b> watches every clock cycle. The instant the event happens, the chip pauses your code, runs your <b>interrupt service routine (ISR)</b>, then resumes where it left off.</p>' +
  '<p>Polling puts your code on watch duty. An interrupt moves that duty to the hardware.</p>',
  a: 'A doorbell that rings by itself, instead of you walking to the door every few seconds to look.' },
 { t: 'Three switches must all be on', h:
  '<p>For an interrupt to run, <b>all three</b> must be true:</p>' +
  '<ol><li><b>Global</b> interrupts are on: call ' + C('sei();') + ' (once, near the top of main). ' + C('cli();') + ' turns the master switch off.</li><li>That feature’s <b>own interrupt is enabled</b> (for example a bit in a mask register).</li><li>The <b>event actually happens</b>.</li></ol>' +
  TRAP('Miss any one and your code silently never runs. No error. This is the classic silent bug.'),
  a: 'Three switches must all be on before the bell rings the house.' },
 { t: 'The order of events', h:
  '<p>When an interrupt fires:</p>' +
  '<ol><li>The event happens.</li><li>The hardware sets a flag and checks that all three switches are on.</li><li>The hardware pauses the main code and jumps to the ISR.</li><li>The ISR runs.</li><li>Control returns to main, right where it left off.</li></ol>' +
  TRAP('Keep an ISR <b>short</b>. No long delays inside it.'),
  a: 'The bell rings, you answer quickly, then go back to what you were doing.' }
]);

LEARN(10, 'PCINT and Interrupt Bugs', [
 { t: 'Pin change interrupts', h:
  '<p>A <b>pin change interrupt (PCINT)</b> fires on <b>any change</b> (rising or falling) on an armed pin. Pins come in groups of 8 that share one vector. Each group has:</p>' +
  '<ul><li>an enable bit in <b>PCICR</b> (arms the whole group),</li><li>a mask register <b>PCMSK</b> (arms individual pins),</li><li>an ISR vector (for example <b>PCINT0_vect</b>).</li></ul>' +
  '<p>Three steps: arm the group, arm the pin, then turn on the master switch with ' + C('sei();') + '.</p>',
  a: 'Eight doors share one bell. Arm the bell, then pick which doors count.' },
 { t: 'Which pin changed?', h:
  '<p>A PCINT does <b>not</b> say which pin changed, or whether it went up or down. Inside the ISR, compare the new state with a saved <b>history byte</b>:</p>' +
  '<div class="formula">changedbits = PINB ^ portbhistory;</div>' +
  '<p>XOR leaves a 1 in every position that changed. Then test each bit with <code>changedbits &amp; (1&lt;&lt;PBn)</code>, and save the new state as the history.</p>' +
  EX('Example', 'History 00100110, PINB now 10111001. XOR: <b>10011111</b>. Those five bits changed.') +
  TRAP('It also fires on every flicker of switch bounce.'),
  a: 'Compare the picture of the doors now with the picture from last time. Any difference is the door that moved.' },
 { t: 'A bug: shared variables', h:
  '<p>If main code reads a <b>2-byte</b> variable that an interrupt can change, the interrupt could fire between the reading of the two bytes. You would read half-old, half-new data.</p>' +
  '<p>The fix: turn interrupts off around the read, then back on.</p>' +
  CB('cli();\nvalue = shared;   // safe read\nsei();'),
  a: 'Do not read a two-part note while someone is rewriting it. Lock the door for a moment first.' }
]);

LEARN(11, 'Timer Interrupts', [
 { t: 'Timers that ring the bell', h:
  '<p>Same idea as PCINT, for timers. Instead of polling the flag in <b>TIFR0</b>, you flip one bit in <b>TIMSK0</b> and let an ISR run.</p>' +
  '<ul><li><b>Normal</b> mode: enable <b>TOIE0</b>, ISR is <b>TIMER0_OVF_vect</b> (overflow).</li><li><b>CTC</b> mode: enable <b>OCIE0A</b>, ISR is <b>TIMER0_COMPA_vect</b> (compare match).</li></ul>' +
  EX('Enable the Normal-mode interrupt', C('TIMSK0 |= (1<<TOIE0);') + ' sets just bit 0 and leaves the rest alone.'),
  a: 'Let the kitchen timer ring the bell automatically when it finishes counting.' },
 { t: 'Always write the ISR, and use volatile', h:
  '<p>If you enable a timer interrupt but never write its ISR, the chip does something unwanted (such as reset). <b>Always write an ISR</b>, even an empty one, for anything you enable.</p>' +
  '<p>A variable changed in an ISR and read in main must be declared <b>volatile</b>.</p>' +
  CB('volatile uint8_t ticks = 0;\nISR(TIMER0_COMPA_vect) { ticks++; }') +
  '<p>Without <code>volatile</code>, the compiler may assume the variable never changes in main and remove your check. <code>volatile</code> means “always re-read it from memory”.</p>',
  a: 'If the notice on the fridge changes while you are away, you must re-read it every time, not trust your memory of it.' },
 { t: 'Setup recipe and period', h:
  '<p>To run an ISR every 1 ms with CTC:</p>' +
  '<ol><li>Set the <b>mode</b> (CTC).</li><li>Set the <b>prescaler</b> (starts the timer).</li><li>Set the <b>count</b> in OCR0A.</li><li>Enable the <b>feature switch</b> (OCIE0A).</li><li>Turn on the <b>master switch</b>: ' + C('sei();') + '.</li></ol>' +
  F('period = ( OCR0A × Prescaler ) ÷ F<sub>clk</sub>') +
  EX('Example', 'OCR0A = 125, prescaler 64, 16 MHz: period = 125 × 64 ÷ 16,000,000 = <b>0.5 ms</b>.'),
  a: 'Choose the style of timer, the gear, the count, the bell, and the main switch. Five steps.' }
]);

LEARN(12, 'State Machines and Switch Debounce', [
 { t: 'What is a state machine?', h:
  '<p>A <b>state machine</b> is one variable that remembers which step you are on, plus a <code>switch</code> statement that says what to do in each state.</p>' +
  '<p>Draw the states and the transitions on paper first. The code almost writes itself.</p>' +
  CB('switch (state) {\n  case WAIT:  if (go) state = RUN;  break;\n  case RUN:   ...                   break;\n}'),
  a: 'One note on the fridge says which room of the routine you are in.' },
 { t: 'Why buttons need debouncing', h:
  '<p>A mechanical switch <b>bounces</b>: for a few milliseconds the contact flickers, so one press looks like many presses. A raw PCINT fires on every flicker.</p>' +
  '<p>The fix is a four-state cycle that forces a pause so the pin can settle:</p>' +
  '<ol><li><b>waitPress</b>: wait for the pin to change to pressed.</li><li><b>debouncePress</b>: pause, then confirm it is still pressed.</li><li><b>waitRelease</b>: wait for the release.</li><li><b>debounceRelease</b>: pause, then confirm. Loop back to waitPress.</li></ol>',
  a: 'Ignore the first clicky bounces by waiting politely before trusting the switch.' },
 { t: 'ISR versus main', h:
  '<p>The ISR never blocks. It only decides <b>which state</b> you move to. The slow part, the short delay of about 100 µs, lives safely in <b>main()</b>.</p>' +
  '<ul><li><b>ISR</b>: conditional and transition logic (change state).</li><li><b>main()</b>: instant actions and the short delays.</li></ul>' +
  TRAP('Long delays inside an ISR stop other interrupts from being answered.'),
  a: 'The doorbell only tells you which room to go to. The slow knocking and waiting happens in the main room.' }
]);

LEARN(13, 'LCD Displays', [
 { t: 'The LCD has its own brain', h:
  '<p>The LCD has its own controller chip. Your job is to send it the right signals, in the right order, with the right delays. Go too fast and it <b>silently ignores</b> you.</p>' +
  '<ul><li><b>RS</b> (register select): 0 = a command, 1 = text to display.</li><li><b>E</b> (enable): a pulse that <b>latches</b> the data. The LCD reads the pins on the falling edge of E.</li><li><b>D4–D7</b>: the four data pins used in 4-bit mode.</li></ul>',
  a: 'A literal roommate who only reads what you slide through the slot and does exactly that, but only if you knock politely between notes.' },
 { t: 'Sending a byte in 4-bit mode', h:
  '<p>In 4-bit mode only D4–D7 are connected, so a byte goes out as <b>two nibbles</b>, high nibble first, each latched by an Enable pulse.</p>' +
  '<ol><li>Set RS (0 for a command, 1 for text).</li><li>Put the high nibble on D4–D7.</li><li>Pulse E high then low.</li><li>Put the low nibble on D4–D7.</li><li>Pulse E again.</li><li>Wait for the command’s delay.</li></ol>',
  a: 'Slide the first half of the note, knock. Slide the second half, knock. Then wait.' },
 { t: 'Commands, delays and cursor position', h:
  '<p>Every command in the datasheet lists its own delay. Skip them and the screen does nothing, quietly. <b>Clear display</b> (0x01) is the slowest command and needs the longest delay.</p>' +
  '<p>To move the cursor, send the command byte:</p>' + F('0x80 | (row &lt;&lt; 6) | col') +
  EX('Example', 'Row 1, column 12: 128 + (1 × 64) + 12 = <b>204</b>. The 0x80 is required by the command, row &lt;&lt; 6 picks row 0 or 1, and col picks the column.'),
  a: 'Each note needs its own waiting time before the next. The address tells the roommate where to write.' }
]);

LEARN(14, 'PWM Basics', [
 { t: 'Faking an analog voltage', h:
  '<p>A pin can only be fully high or fully low. <b>PWM</b> (pulse-width modulation) fakes an in-between voltage by switching very fast. The longer it stays high in each period, the higher the <b>average</b> voltage.</p>' +
  '<p>The timer does the switching for you.</p>',
  a: 'Flick the light on and off so fast it looks dimmer. Longer on means brighter.' },
 { t: 'Duty cycle and average voltage', h:
  '<p>The <b>duty cycle</b> D is the fraction of the period the signal is high.</p>' + F('D = T<sub>pulse</sub> ÷ T<sub>period</sub>') + F('V<sub>eff</sub> = D × (V<sub>high</sub> − V<sub>low</sub>) + V<sub>low</sub>') +
  EX('Example', 'High for 15 ms in every 20 ms: D = 15 ÷ 20 = 0.75 = <b>75%</b>.') +
  EX('Example', '0 V to 3.3 V swing at D = 80%: V<sub>eff</sub> = 0.8 × 3.3 = <b>2.64 V</b>.'),
  a: 'On for 75% of the time looks like 75% brightness.' },
 { t: 'PWM in code', h:
  '<p>Three things in order: (1) make the output pin an output (DDR), (2) set the mode in TCCR1A/B, (3) write the compare value in OCR1A.</p>' +
  '<p>In <b>non-inverting</b> mode the pin goes high at the bottom of the count and goes low when TCNT1 equals OCR1A. A bigger OCR1A means more time high.</p>' + F('OCR1A = D × TOP') +
  EX('Example', '10-bit Fast PWM has TOP = 0x3FF = 1023. For D = 25%: OCR1A = 0.25 × 1023 ≈ <b>255</b>. There are 1024 possible duty steps.'),
  a: 'The dial sets how long the light stays on in each flick.' }
]);

LEARN(15, 'PWM Frequency and DC Motors', [
 { t: 'Choosing the PWM frequency', h:
  '<p>In <b>variable-TOP Fast PWM</b>, TOP sets the frequency and a second compare register sets the duty.</p>' + F('TOP = F<sub>clk</sub> ÷ ( N × f ) − 1') +
  EX('Example', '16 MHz clock, prescaler N = 8, want 20 kHz: TOP = 16,000,000 ÷ (8 × 20,000) − 1 = 100 − 1 = <b>99</b>.') +
  '<p>A good starting PWM frequency for a DC motor is about 10 kHz.</p>',
  a: 'Set how fast the pulses repeat.' },
 { t: 'Duty from TOP', h:
  '<p>Once TOP is fixed, the duty register holds the fraction of TOP.</p>' + F('duty register = D × TOP') +
  EX('Example', 'TOP = 999 and D = 25%: 0.25 × 999 ≈ <b>249.75</b>, so about 249.'),
  a: 'How long each pulse stays on, out of the full period.' },
 { t: 'The H-bridge', h:
  '<p>An <b>H-bridge</b> has four switches around a motor. Close SW1 + SW4 for one direction, SW2 + SW3 for the other. A chip such as the <b>L293</b> contains it:</p>' +
  '<ul><li><b>A pins</b> pick the <b>direction</b>.</li><li><b>EN</b> pin takes the <b>PWM</b> and sets the speed.</li><li><b>VCC2</b> brings in the motor power.</li></ul>' +
  '<p>To spin the other way at half speed: swap the A pins and set the PWM duty to 50%. When EN is low the outputs are off.</p>',
  a: 'One control sets which way the fan spins. The pulse width sets how hard it spins.' }
]);

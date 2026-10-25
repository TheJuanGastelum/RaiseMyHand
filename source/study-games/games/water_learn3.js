LEARN(14, 'Node Voltage or Mesh Current?', [
 { t: 'Two methods, pick the cheaper one', h:
  '<p>Node analysis (NVA) and mesh analysis (MCA) both solve any flat circuit. Pick the one that needs <b>fewer equations</b>.</p>' +
  '<p><b>Step 1: deactivate the independent sources.</b> A voltage source becomes a <b>short circuit</b> (a plain wire). A current source becomes an <b>open circuit</b> (a break).</p>' +
  '<p><b>Step 2:</b> count what is left: the essential nodes <b>n</b> (junctions of three or more parts) and the essential meshes <b>m</b> (loops with no loop inside).</p>',
  a: 'First shut off the pumps: a pressure pump becomes a plain pipe, a flow pump becomes a capped pipe. Then count junctions and loops.' },
 { t: 'The rule', h:
  '<p>NVA needs <b>n − 1</b> equations. MCA needs <b>m</b> equations. Compare:</p>' +
  '<ul><li>If <b>n − 1 &lt; m</b>, use <b>NVA</b>.</li><li>If <b>m &lt; n − 1</b>, use <b>MCA</b>.</li><li>If they are equal, use whichever needs fewer <b>constraint</b> equations (this matters when there are dependent sources).</li></ul>' +
  EX('Worked example', 'A 10 A source, 30 Ω, 8 Ω, 5.2 Ω, 12 Ω, a 500 V source and a 1 V source. After deactivating, the 500 V and 1 V sources are wires and the 10 A source is open. That leaves n = 2 essential nodes, so n − 1 = 1 equation, and m = 3 meshes. Since 1 &lt; 3, use <b>NVA</b>.'),
  a: 'Junction equations versus loop equations. Take the shorter list.' },
 { t: 'Try it', h:
  '<p>Count carefully after deactivation: wires from shorted voltage sources can merge nodes together, and opened current sources remove branches.</p>' +
  '<p>The number of equations you actually write is the smaller of <b>n − 1</b> and <b>m</b>.</p>' + F('equations = min(n − 1, m)'),
  a: 'Count, compare, and choose.' }
]);

LEARN(15, 'Sinusoids and Phasors', [
 { t: 'Sine waves and their numbers', h:
  '<p>Wall power and signals are <b>sinusoids</b>: smooth waves that repeat. A wave is described by its <b>frequency f</b> (cycles per second, in hertz, Hz) and its <b>period T</b>, the time for one cycle.</p>' + F('T = 1/f') +
  '<p>The <b>angular frequency</b> ω (radians per second) counts how fast the wave spins around a circle:</p>' + F('ω = 2πf') +
  EX('Example', '60 Hz: T = 1/60 s = 16.7 ms and ω = 2π × 60 = 377 rad/s.'),
  a: 'AC is a piston pushing water back and forth. The frequency is how many pushes per second.' },
 { t: 'Phasors: a wave as an arrow', h:
  '<p>A wave <b>A cos(ωt + φ)</b> has an amplitude A and a phase (timing offset) φ. Once the frequency is fixed, those two numbers say everything. Write them as one complex number called a <b>phasor</b>:</p>' + F('A cos(ωt + φ)  →  A∠φ') +
  '<p>A complex number can be written two ways. <b>Polar</b>: A∠φ (size and angle). <b>Rectangular</b>: a + jb, where j = √(−1).</p>' + F('a = A cos φ      b = A sin φ') +
  EX('Example', '10∠30° has a = 10 cos 30° = 8.66 and b = 10 sin 30° = 5, so it is 8.66 + j5.'),
  a: 'A phasor is a snapshot: how big the wave is and how far its timing is shifted.' },
 { t: 'Back to polar', h:
  '<p>To go from rectangular a + jb to polar, use the Pythagorean rule for the size and the arctangent for the angle:</p>' + F('A = √(a² + b²)      φ = atan(b / a)') +
  EX('Example', '3 + j4: A = √(9 + 16) = <b>5</b>, φ = atan(4/3) = 53.1°.') +
  '<p>Sines convert to cosines by a 90° shift: sin x = cos(x − 90°).</p>',
  a: 'Combine the two sideways and upward pushes to get the real size of the push.' }
]);

LEARN(16, 'Impedance', [
 { t: 'Push-back that depends on speed', h:
  '<p><b>Impedance (Z)</b> is the AC version of resistance. It tells you how hard a part resists a sine wave at a given frequency. In phasor form, voltage and current obey <b>V = Z · I</b>.</p>' +
  '<ul><li>Resistor: <b>Z = R</b></li><li>Inductor (coil): <b>Z = jωL</b></li><li>Capacitor: <b>Z = 1/(jωC)</b></li></ul>' +
  '<p>Series impedances add. Parallel impedances combine like resistors.</p>',
  a: 'A narrow pipe resists the same at any speed. A heavy water wheel (inductor) resists fast wiggles more. A balloon tank (capacitor) lets fast wiggles through and blocks slow ones.' },
 { t: 'Sizes (magnitudes)', h:
  '<p>The magnitude of an inductor’s impedance rises with frequency, and a capacitor’s falls:</p>' + F('|Z_L| = ωL = 2πfL      |Z_C| = 1/(ωC) = 1/(2πfC)') +
  EX('Example', 'A 100 mH coil at 500 Hz: |Z_L| = 2π × 500 × 0.1 = <b>314 Ω</b>. A 10 μF capacitor at 1 kHz: |Z_C| = 1/(2π × 1000 × 10×10⁻⁶) = <b>15.9 Ω</b>.') +
  '<p>Remember to convert mH to H and μF to F.</p>',
  a: 'Faster wiggles push the wheel harder and slip past the balloon more easily.' },
 { t: 'A series pair', h:
  '<p>A resistor and an inductor in series: Z = R + jωL. The size of that complex number is:</p>' + F('|Z| = √(R² + X²)') +
  EX('Example', 'R = 3 Ω, inductor j4 Ω. |Z| = √(9 + 16) = <b>5 Ω</b>. A source of 10∠−45° V gives a current of magnitude 10/5 = <b>2 A</b> (angle −45° − 53.13° = −98.13°).'),
  a: 'The squeeze and the wheel add at right angles, so use the Pythagorean rule.' }
]);

LEARN(17, 'Source Transformations', [
 { t: 'Swap a battery for a current source', h:
  '<p>A voltage source <b>V</b> in series with a resistor <b>R</b> behaves, seen from the two terminals, exactly like a current source <b>I = V/R</b> in parallel with the same <b>R</b>.</p>' + F('I = V / R      V = I · R') +
  EX('Example', '12 V in series with 4 Ω becomes 3 A in parallel with 4 Ω. And 5 A in parallel with 2 Ω becomes 10 V in series with 2 Ω.') +
  '<p>Why they match: both give the same open-circuit voltage and the same short-circuit current.</p>',
  a: 'A pressure pump with a squeezing pipe in series acts like a flow pump with the same pipe beside it.' },
 { t: 'What does not stay the same', h:
  '<p>The terminals cannot tell the two forms apart, but the <b>power inside</b> is different. A transformation does not preserve the power in the part you transformed.</p>' +
  EX('Example', 'In a circuit with a 12 V source, 2 Ω, and then 4 Ω in parallel with a 6 A source, the 4 Ω dissipates 64 W (16 V across it). Turn the 6 A and 4 Ω into 24 V in series with 4 Ω: the voltage at the terminals is still 16 V, but now the 4 Ω dissipates only 16 W.') +
  '<p>Two special cases: a resistor in parallel with an ideal voltage source does nothing to the rest of the circuit, and a resistor in series with an ideal current source does nothing either.</p>',
  a: 'Same taps, different heating inside the box.' },
 { t: 'Reducing a ladder', h:
  '<p>Transform back and forth to reduce a circuit: turn a source and resistor into the other form, combine parallel currents or series voltages, repeat.</p>' +
  EX('Worked ladder', '360 V, 36 Ω series, 36 Ω shunt, 2 Ω series, then 20 Ω and 80 Ω shunts. 360/36 = 10 A in parallel with 36 Ω; 36 ∥ 36 = 18 Ω, giving 180 V in series with 18 + 2 = 20 Ω. The load 20 ∥ 80 = 16 Ω sees 180 × 16/36 = 80 V, so the current in the 80 Ω is <b>1 A</b>.') +
  '<p>Parallel current sources add. Series voltage sources add (subtract if opposed).</p>',
  a: 'Swap the pumps until the whole network collapses into one pump and one pipe.' }
]);

LEARN(18, 'Thevenin and Norton', [
 { t: 'A whole circuit as one source', h:
  '<p>Any two-terminal circuit made of sources and resistors acts like <b>one voltage source V_th in series with one resistor R_th</b> (the <b>Thévenin</b> equivalent), or equivalently <b>one current source I_N with R_th in parallel</b> (the <b>Norton</b> equivalent).</p>' +
  '<ul><li><b>V_th</b> = the open-circuit voltage (terminals left open).</li><li><b>I_N</b> = the short-circuit current (terminals shorted).</li></ul>' + F('R_th = V_oc / I_sc') +
  EX('Example', 'Open-circuit voltage 24 V, short-circuit current 4 A: R_th = 24/4 = <b>6 Ω</b>.'),
  a: 'Seen from two taps, a whole pump-and-pipe network looks like one pump with one narrow pipe.' },
 { t: 'Finding the equivalent', h:
  '<p><b>Method 1, direct:</b> find V_oc, find I_sc, divide.</p>' +
  '<p><b>Method 2, deactivate the sources:</b> turn off the independent sources (voltage source → short, current source → open), then find R_th by combining resistors. Find V_th with the sources on.</p>' +
  EX('Example', '200 V, 25 Ω series, 100 Ω to ground, 10 Ω to the terminal. Deactivate: R_th = 10 + (25 ∥ 100) = 10 + 20 = <b>30 Ω</b>. Source on, open terminals: V_th = 200 × 100/125 = <b>160 V</b>.'),
  a: 'Shut the pumps off and measure the squeeze, then turn them on and measure the open-tap pressure.' },
 { t: 'Method 3: the test source', h:
  '<p>If a circuit has <b>only dependent sources</b> and resistors (no independent source), then V_oc = 0 and I_sc = 0, so methods 1 and 2 fail. Use a <b>test source</b>: deactivate every independent source, connect a known test voltage V_T (or current I_T) to the terminals, and compute</p>' + F('R_th = V_T / I_T') +
  '<p>This method always works, and it is required when there are only dependent sources.</p>',
  a: 'If there is no real pump inside, push a known flow in from outside and read the pressure it makes.' }
]);

LEARN(19, 'Maximum Power Transfer', [
 { t: 'Matching the load', h:
  '<p>A source with Thévenin values V_th and R_th drives a load R_L. How much power does the load get?</p>' +
  '<ul><li>R_L = 0 (a wire): the voltage across the load is 0, so the power is 0.</li><li>R_L very large (open): no current, power 0.</li></ul>' +
  '<p>In between there is a peak. It happens when the load matches the source:</p>' + F('R_L = R_th'),
  a: 'A tap that is too wide has no pressure; one that is too narrow lets no water through. The best work is in the middle.' },
 { t: 'How much power', h:
  '<p>At the match, the load gets the most it can ever get:</p>' + F('P_max = V_th² / (4 R_th)') +
  EX('Example', 'V_th = 12 V, R_th = 4 Ω. P_max = 144/16 = <b>9 W</b>.') +
  '<p>Where it is used: impedance matching, such as an oscilloscope that expects a 50 Ω load, or a stereo amplifier with 8 Ω speakers. Power utilities do the opposite: they want small R to waste less (efficiency).</p>' +
  '<p>At the match, only half the total power reaches the load (50% efficiency).</p>',
  a: 'At the match, as much work is lost inside the pump as is delivered.' },
 { t: 'Not matched', h:
  '<p>If the load is not matched, find the current first, then the load power:</p>' + F('i = V_th/(R_th + R_L)      P_L = i² R_L') +
  EX('Example', 'V_th = 12 V, R_th = 6 Ω, R_L = 12 Ω. i = 12/18 = 0.667 A, P_L = 0.667² × 12 = <b>5.33 W</b>. The matched value would be 144/24 = 6 W.'),
  a: 'Any other tap size gives less work than the matched one.' }
]);

LEARN(20, 'Superposition', [
 { t: 'One source at a time', h:
  '<p>In a <b>linear</b> circuit (resistors, dependent sources), the effect of several independent sources is the sum of the effects of each one acting alone.</p>' +
  '<p>To find one source’s effect, <b>turn off all the others</b>: voltage source → <b>short</b>, current source → <b>open</b>. Dependent sources stay in the circuit.</p>' +
  EX('Example', 'Source A alone puts 3 V across a resistor, source B alone puts 2 V in the same direction. Together: 3 + 2 = <b>5 V</b>.'),
  a: 'Shut off all pumps but one, see what it does to a gauge, then repeat for each pump. The real reading is the sum.' },
 { t: 'A worked case', h:
  '<p>A 12 V source feeds 6 Ω in series then 4 Ω to ground. A 2 A source also pushes current into the junction.</p>' +
  EX('Voltage source alone', 'Current source open: divider gives 12 × 4/10 = 4.8 V.') +
  EX('Current source alone', 'Voltage source shorted: 6 Ω ∥ 4 Ω = 2.4 Ω, so 2 × 2.4 = 4.8 V.') + '<p>Total = 4.8 + 4.8 = <b>9.6 V</b>.</p>',
  a: 'Each pump’s effect is found as if it were alone, then the readings are added.' },
 { t: 'Power is different', h:
  '<p>Superposition works for voltages and currents. It does <b>not</b> work for power, because power depends on the square of the current.</p>' +
  EX('Example', 'Two sources alone each push 2 A and 3 A through a 2 Ω resistor in the same direction. Total current 5 A, so the power is 5² × 2 = <b>50 W</b>. Adding the separate powers (8 + 18 = 26 W) would be wrong.') +
  '<p>If every source is scaled by the same percentage, every response scales by that percentage too.</p>',
  a: 'Add the flows first, then work out the heating. Do not add the heatings.' }
]);

LEARN(21, 'Op Amp Basics and the Inverting Amp', [
 { t: 'What an op amp is', h:
  '<p>An <b>operational amplifier (op amp)</b> is a small chip with two inputs, one output and two power pins. The inputs are the <b>plus (non-inverting)</b> input, voltage v_p, and the <b>minus (inverting)</b> input, voltage v_n. The output is v_o.</p>' +
  '<p>It makes the output equal to a huge number A (the gain, often over 10,000) times the difference of the inputs, but it can never go beyond the power supply, called the <b>rails</b> (say ±15 V).</p>' + F('v_o = A (v_p − v_n)    (until it hits a rail)') +
  '<p>A real op amp draws almost no current into its inputs (the input resistance is huge), so i_p ≈ 0 and i_n ≈ 0.</p>',
  a: 'An op amp is a smart valve with two sensing taps. It opens a lot if one tap reads higher than the other. The pump (supply) limits how hard it can push.' },
 { t: 'Negative feedback and the two rules', h:
  '<p><b>Negative feedback</b> means a wire (often through a resistor) connects the output back to the inverting input. The op amp then adjusts its output until the two inputs are nearly equal. With feedback and the op amp not at a rail, two rules hold:</p>' +
  F('v_p = v_n      i_p = i_n = 0') +
  '<p>These are the <b>ideal op amp rules</b>. They are the key to every op amp circuit.</p>' +
  TRAP('If the output is stuck at a rail, the first rule fails. Always check the answer against the rails.'),
  a: 'The return pipe keeps the two sensor pressures level, and the sensors take no water.' },
 { t: 'The inverting amplifier', h:
  '<p>Source v_s through R_s into the minus input, feedback resistor R_f from output to the minus input, plus input to ground. Since v_p = 0, then v_n = 0 (a “virtual ground”). The current through R_s, v_s/R_s, has nowhere to go but through R_f:</p>' + F('v_o = −(R_f / R_s) · v_s') +
  EX('Example', 'R_s = 2 kΩ, R_f = 10 kΩ, v_s = 0.5 V. Gain = −5, so v_o = <b>−2.5 V</b>. The current in R_f is v_s/R_s = 0.25 mA.') +
  '<p>The minus sign means the output is upside down compared with the input.</p>',
  a: 'The input pipe leads to sea level. The valve sends whatever flows in out through the return pipe, flipped.' }
]);

LEARN(22, 'Op Amp Circuits: Follower, Non-Inverting, Summing, Difference', [
 { t: 'Which way does the sign go?', h:
  '<p>Same two rules, different wiring:</p>' +
  '<ul><li><b>Inverting amplifier</b> (input on the − side): output flips sign, gain −R_f/R_s.</li><li><b>Non-inverting amplifier</b> (input on the + side): output keeps the sign, gain <b>1 + R_f/R_s</b>.</li><li><b>Voltage follower (buffer)</b>: output wired straight to the − input; gain exactly 1.</li></ul>' +
  EX('Example', 'Non-inverting with R_f = 20 k and R_s = 5 k: gain = 1 + 4 = <b>5</b>.'),
  a: 'Feed the signal to the other tap and the valve scales without flipping.' },
 { t: 'Why a buffer, and summing', h:
  '<p>A follower copies a voltage while drawing <b>no current</b> from the source (i_p = 0). A weak source can drive a heavy load through it.</p>' +
  '<p>The <b>inverting summing amplifier</b> adds several inputs. Each input pushes a current v_k/R_k into the minus node, and all of it flows through R_f:</p>' + F('v_o = −R_f (v_a/R_a + v_b/R_b + …)') +
  EX('Example', 'R_f = 10 k, input 1 V through 5 k and 0.5 V through 10 k: v_o = −10 (1/5 + 0.5/10) = −10 (0.25) = <b>−2.5 V</b>.'),
  a: 'Several input pipes feed one junction; the return pipe carries the total.' },
 { t: 'The difference amplifier', h:
  '<p>A difference amplifier subtracts two inputs. If the resistors are matched (R_c = R_a and R_d = R_b):</p>' + F('v_o = (R_b/R_a) · (v_b − v_a)') +
  '<p>It only responds to the <b>difference</b> between the inputs. Anything both inputs share (the <b>common-mode</b> part, like noise) is cancelled.</p>' +
  EX('Example', 'Gain R_b/R_a = 5, v_a = 1 V, v_b = 1.5 V: v_o = 5 × 0.5 = <b>2.5 V</b>.'),
  a: 'The valve reacts only to the pressure gap between the two taps, and ignores shaking that is common to both.' }
]);

LEARN(23, 'Saturation, Comparators and CMRR', [
 { t: 'Hitting the rails', h:
  '<p>The output can never exceed the supply. If the formula asks for more, the output <b>saturates</b> (clips) at the rail.</p>' +
  EX('Example', 'Inverting amp, gain −5, supply ±10 V, input 3 V. The formula says −15 V, but the output stops at <b>−10 V</b>.') +
  '<p>To avoid saturation, keep the ideal output between the rails. Rails can be unequal, like +15 V and −10 V.</p>',
  a: 'Ask the valve for more than the pump can give and it just stays wide open.' },
 { t: 'No feedback: the comparator', h:
  '<p>With <b>no negative feedback</b>, v_p = v_n no longer holds. The op amp becomes a <b>comparator</b>: it just compares the inputs.</p>' +
  '<ul><li>v_p &gt; v_n → output goes to the + rail.</li><li>v_p &lt; v_n → output goes to the − rail.</li></ul>' +
  EX('Example', 'Rails ±5 V. v_p = 2 V and v_n = 1 V: output +5 V. v_p = −3 V and v_n = 0: output −5 V.'),
  a: 'With no return pipe, the valve slams fully open or fully shut, depending on which tap reads higher.' },
 { t: 'Rejecting what is shared', h:
  '<p>A difference amplifier ought to amplify only the difference of its inputs. The <b>common-mode rejection ratio (CMRR)</b> says how well it ignores the part both inputs share:</p>' + F('CMRR = |A_dm| / |A_cm|') +
  '<p>A <b>high</b> CMRR is good: strong gain for the difference signal, tiny gain for common noise.</p>',
  a: 'A good valve ignores pressure noise that shakes both taps the same way.' }
]);

LEARN(24, 'Op Amp Input and Output Properties', [
 { t: 'What the source sees', h:
  '<p>The <b>input resistance</b> is the resistance the source feels looking into the circuit: R_in = v/i drawn from the source.</p>' +
  '<ul><li>Inverting amp: the minus node is a virtual ground, so the source sees just <b>R_s</b>.</li><li>Non-inverting amp: the plus input draws no current, so the source sees <b>infinite</b> resistance.</li></ul>' +
  EX('Example', 'Inverting amp with R_s = 10 kΩ, R_f = 100 kΩ: the source sees 10 kΩ.'),
  a: 'An inverting valve looks like its input pipe leading to sea level. A non-inverting valve takes no water from its source.' },
 { t: 'What the load sees', h:
  '<p>Looking back from the load, an ideal op amp circuit is a perfect voltage source: its <b>Thévenin resistance is 0 Ω</b>, so the output voltage does not change when you change the load (as long as the op amp does not saturate or run out of current).</p>' +
  EX('Example', 'Inverting amp with gain −2.5 and v_s = 0.2 V gives v_o = −0.5 V. With a 5 kΩ load, the load current is −0.5/5 k = <b>−0.1 mA</b>. A different load changes the current, not v_o.'),
  a: 'The ideal valve holds its pressure no matter how thirsty the load is.' },
 { t: 'A trickier input resistance', h:
  '<p>For a difference amplifier, the source on the − side does not see just R_a. The other input sets v_n, so you must find the actual current. Use v_p = v_b R_d/(R_c + R_d), then v_n = v_p, and i_a = (v_a − v_n)/R_a, so R_ia = v_a / i_a.</p>' +
  EX('Example', 'R_a = 10 k, R_c = 33 k, R_d = 47 k, v_a = 670 mV, v_b = 800 mV. v_p = 0.8 × 47/80 = 0.47 V. i_a = (0.67 − 0.47)/10 k = 20 μA. R_ia = 0.67/20 μA = <b>33.5 kΩ</b>. The source on the + side sees R_c + R_d = 80 kΩ.') +
  '<p>A real op amp has finite input resistance, nonzero output resistance and finite gain A. These are the three imperfections of the realistic model.</p>',
  a: 'The other tap changes how much water flows in the first pipe.' }
]);

LEARN(25, 'Comparators and the Schmitt Trigger', [
 { t: 'Comparing to a reference', h:
  '<p>Put a fixed <b>reference voltage V_ref</b> on one input. Then the output tells you whether the signal is above or below V_ref.</p>' +
  EX('Example', 'Signal on +, 2 V on −, rails ±5 V. A 3 V signal gives +5 V. A 1 V signal gives −5 V. 2.5 V gives +5 V.') +
  TRAP('A noisy signal near V_ref makes the output chatter back and forth between the rails.'),
  a: 'The valve snaps open or shut when the signal crosses the reference level.' },
 { t: 'Hysteresis', h:
  '<p>A <b>Schmitt trigger</b> cures the chatter by adding <b>positive feedback</b>: part of the output is fed back to the + input, so the switching level moves depending on the current output. It has <b>two thresholds</b>, a gap called <b>hysteresis</b>. Once it flips, small noise cannot flip it back.</p>' +
  '<p>Layout: signal v_i through R₁ to the + input, R₂ from the output to the + input, − input at 0 V.</p>',
  a: 'Feed some of the output back so the valve needs a bigger push to flip back. Ripples in the water cannot make it flutter.' },
 { t: 'The thresholds', h:
  '<p>With supply rails ±V_s, the switching thresholds are ±T:</p>' + F('T = (R₁ / R₂) · V_s') +
  '<p>If the output is high, the input must fall below −T to flip it low. If the output is low, the input must rise above +T to flip it high. The window between −T and +T is 2T wide.</p>' +
  EX('Example', 'V_s = 10 V, R₁ = 2 k, R₂ = 20 k: T = 0.1 × 10 = <b>1 V</b>. Hysteresis window = 2 V.'),
  a: 'Two snap levels instead of one gives the water a dead zone to settle in.' }
]);

LEARN(26, 'Inductors', [
 { t: 'A coil that resists change', h:
  '<p>An <b>inductor</b> is a coil of wire. It stores energy in a magnetic field. Its size is the <b>inductance L</b>, in <b>henries (H)</b>.</p>' +
  '<p>The voltage across an inductor depends on how fast the current is <b>changing</b>:</p>' + F('v = L · di/dt') +
  EX('Example', 'A 2 H inductor’s current rises steadily by 4 A in 2 s: di/dt = 2 A/s, so v = 2 × 2 = <b>4 V</b>.') +
  '<p>Steady current (di/dt = 0) means v = 0. At DC an inductor acts like a <b>short circuit</b> (a plain wire).</p>',
  a: 'An inductor is a heavy water wheel in the pipe. It takes a push to speed it up or slow it down. Steady flow needs no push.' },
 { t: 'Energy and the memory of current', h:
  '<p>The energy stored depends on the current:</p>' + F('w = ½ · L · i²') +
  EX('Example', 'A 4 H inductor carrying 3 A stores ½ × 4 × 9 = <b>18 J</b>.') +
  '<p>The current through an inductor <b>cannot change instantly</b>. That would need infinite voltage. This is how switching problems later are solved: the inductor current just before and just after the switch is the same.</p>',
  a: 'A spinning wheel keeps spinning. It cannot stop in zero time.' },
 { t: 'Sudden changes make big voltages', h:
  '<p>If you cut the current quickly, di/dt is large and so is the voltage: v = L |di/dt|.</p>' +
  EX('Example', '50 mH, current drops from 2 A to 0 in 10 ms: |v| = 0.05 × 2 / 0.01 = <b>10 V</b>.') +
  '<p>Use henries (not mH) in the formulas. 50 mH = 0.05 H.</p>' +
  '<p>Phase memory: in an inductor the voltage leads the current (ELI: voltage E, inductor L, current I).</p>',
  a: 'Stop the wheel fast and it kicks back hard.' }
]);

LEARN(27, 'Capacitors', [
 { t: 'A tank that stores charge', h:
  '<p>A <b>capacitor</b> stores energy in an electric field between two plates. Its size is the <b>capacitance C</b>, in <b>farads (F)</b>. Typical values are μF (millionths of a farad).</p>' +
  '<p>The current through a capacitor depends on how fast the voltage is <b>changing</b>:</p>' + F('i = C · dv/dt') +
  '<p>Steady voltage (dv/dt = 0) means i = 0. At DC a capacitor acts like an <b>open circuit</b>.</p>',
  a: 'A capacitor is a stretchy balloon tank across the pipe. Changing pressure pushes water in and out. A full, steady balloon passes nothing.' },
 { t: 'Energy and continuity', h:
  '<p>Energy stored:</p>' + F('w = ½ · C · v²') +
  EX('Example', '100 μF charged to 12 V: ½ × 100×10⁻⁶ × 144 = 0.0072 J = <b>7.2 mJ</b>.') +
  EX('Current example', 'The voltage across a 10 μF capacitor rises 5 V in 10 ms. i = 10×10⁻⁶ × 5/0.01 = <b>5 mA</b>.') +
  '<p>The <b>voltage</b> across a capacitor cannot change instantly (that would need infinite current).</p>',
  a: 'A stretched balloon stores energy, and it cannot be stretched in zero time.' },
 { t: 'Inductor or capacitor?', h:
  '<p>The two parts mirror each other (they are <b>duals</b>):</p>' +
  '<ul><li>Inductor: current cannot jump, short at DC, v = L di/dt.</li><li>Capacitor: voltage cannot jump, open at DC, i = C dv/dt.</li></ul>' +
  '<p>Phase: ICE: in a capacitor the current leads the voltage.</p>',
  a: 'Wheel: flow cannot jump. Balloon: pressure cannot jump.' }
]);

LEARN(28, 'Combining Inductors and Capacitors', [
 { t: 'Inductors combine like resistors', h:
  '<p>Inductors in <b>series</b> add. Inductors in <b>parallel</b> combine with the product-over-sum rule:</p>' + F('L_series = L₁ + L₂      L_parallel = L₁L₂ / (L₁ + L₂)') +
  EX('Example', '2 mH + 3 mH in series = <b>5 mH</b>.'),
  a: 'Wheels in a row add their heaviness.' },
 { t: 'Capacitors combine the opposite way', h:
  '<p>Capacitors in <b>parallel</b> add (more plate area). In <b>series</b> they use the product-over-sum rule:</p>' + F('C_parallel = C₁ + C₂      C_series = C₁C₂ / (C₁ + C₂)') +
  EX('Example', '4 μF ∥ 6 μF = <b>10 μF</b>. 3 μF in series with 6 μF = 18/9 = <b>2 μF</b>.'),
  a: 'Balloons side by side add their room. Balloons in a row act like a stiffer, smaller balloon.' },
 { t: 'Mixed networks', h:
  '<p>Reduce step by step, like resistors, remembering which rule applies to which part.</p>' +
  EX('Example', '3 μF in series with 6 μF gives 2 μF. That sits in parallel with 4 μF, so C_eq = 2 + 4 = <b>6 μF</b>.'),
  a: 'Merge the in-a-row balloons first, then add the side-by-side ones.' }
]);

LEARN(29, 'Mutual Inductance', [
 { t: 'Two coils that talk', h:
  '<p>If two coils are close, the changing current in one makes a changing magnetic field that also passes through the other and induces a voltage there. This link is the <b>mutual inductance M</b> (in henries).</p>' +
  '<p>How well they are linked is the <b>coupling coefficient k</b>:</p>' + F('k = M / √(L₁ L₂)      0 ≤ k ≤ 1') +
  '<p>k = 1 means all the field links both coils (perfect coupling). k = 0 means no link.</p>',
  a: 'Two water wheels on shafts that nearly touch. Spin one and the other gets dragged along.' },
 { t: 'Using M and k', h:
  '<p>Rearranged: <b>M = k √(L₁ L₂)</b>.</p>' +
  EX('Example', 'L₁ = 4 mH, L₂ = 9 mH, k = 0.5: M = 0.5 × √36 = 0.5 × 6 = <b>3 mH</b>.') +
  '<p>The <b>dot convention</b> shows the sign. A current entering the dotted end of one coil induces a voltage that is positive at the dotted end of the other. The dots tell you whether the M terms add or subtract in KVL.</p>',
  a: 'The dots tell you which way the drag pushes.' },
 { t: 'Perfect coupling', h:
  '<p>Perfect coupling (k = 1) means M = √(L₁L₂), the largest possible value. k can never be greater than 1.</p>' +
  '<p>Transformers use tightly coupled coils to move energy between circuits.</p>',
  a: 'Locked shafts: the second wheel follows the first exactly.' }
]);

LEARN(30, 'First-Order Circuits and Time Constants', [
 { t: 'The time constant', h:
  '<p>A circuit with one resistor and one energy-storing part (a capacitor or an inductor) responds smoothly, not instantly. How slow it is, is set by the <b>time constant τ</b> (tau).</p>' +
  F('RC circuit: τ = R · C        RL circuit: τ = L / R') +
  EX('Example', '1 kΩ and 100 μF: τ = 1000 × 100×10⁻⁶ = 0.1 s = <b>100 ms</b>. A 50 mH coil with 10 Ω: τ = 0.05/10 = <b>5 ms</b>.') +
  '<p>R means the Thévenin resistance the storage part sees.</p>',
  a: 'A balloon filling through a narrow pipe is slow. Bigger balloon or narrower pipe means a larger τ.' },
 { t: 'The FIFE formula', h:
  '<p>Any voltage or current x(t) in a first-order circuit follows the FIFE formula:</p>' + F('x(t) = x(∞) + [x(0) − x(∞)] · e^(−t/τ)') +
  '<p><b>F</b>inal value, <b>I</b>nitial value, and <b>E</b>xponential decay. At t = τ the gap to the final value has shrunk to e⁻¹ ≈ 0.368 of its start.</p>' +
  EX('Example', 'Starts at 0 V and heads to 10 V with τ = 2 ms. At t = 2 ms: 10 + (0 − 10) × 0.368 = <b>6.32 V</b>.'),
  a: 'It fills fast at first, then slows as the balloon fills.' },
 { t: 'Filters', h:
  '<p>An RC low-pass filter passes slow signals and blocks fast ones. Its <b>cutoff frequency</b> is</p>' + F('f_c = 1 / (2π R C)') +
  EX('Example', 'R = 1.6 kΩ and C = 0.1 μF: f_c = 1 / (2π × 1600 × 10⁻⁷) = <b>995 Hz</b>.') +
  '<p>Steps for switching problems: find the initial value (inductor current or capacitor voltage), find the final value (inductor short, capacitor open at DC), find τ, then use FIFE.</p>',
  a: 'A slow-to-fill balloon smooths out fast wiggles.' }
]);

LEARN(31, 'Switching Time and 5τ', [
 { t: 'How long is “done”?', h:
  '<p>The exponential never quite reaches the final value. But after <b>5 time constants (5τ)</b> it is within 1% of the end.</p>' + F('e^(−5) ≈ 0.0067      so after 5τ the response is 99.3% finished') +
  EX('Example', 'τ = 4 ms. The circuit is essentially settled after 5 × 4 = <b>20 ms</b>.'),
  a: 'Five time constants and the balloon is practically full.' },
 { t: 'Switching before it settles', h:
  '<p>If a second switch flips before 5τ, the circuit has not reached its final value. The <b>new start</b> is wherever it got to.</p>' +
  EX('Example', 'A capacitor starts at 0 V and charges toward 10 V with τ = 2 ms. At t = 1 ms: v = 10 (1 − e^(−0.5)) = 10 × 0.393 = <b>3.93 V</b>. That is the starting value for the next interval.') +
  '<p>A capacitor’s voltage is continuous at a switch (and an inductor’s current), so the value just after equals the value just before. Other voltages and currents can jump.</p>',
  a: 'Flip the tap early and the balloon starts its next journey from the level it had reached.' },
 { t: 'Runaway circuits', h:
  '<p>Rarely (circuits with dependent sources that supply energy), the time constant can come out <b>negative</b>. Then e^(−t/τ) grows instead of shrinking, and the response grows without bound.</p>' +
  '<p>This does not happen with only resistors, capacitors and inductors.</p>',
  a: 'A pump that feeds back on itself can make the level run away.' }
]);

LEARN(32, 'RLC and Damping', [
 { t: 'Two storage parts together', h:
  '<p>With both an inductor and a capacitor (plus a resistor), the circuit can <b>oscillate</b>, like a swing. Two numbers describe it for a series RLC:</p>' + F('α = R / (2L)        ω₀ = 1 / √(L C)') +
  '<p>α measures the damping from the resistor. ω₀ is how fast it would swing with no damping.</p>' +
  EX('Example', 'R = 40 Ω, L = 0.2 H: α = 40/0.4 = <b>100 s⁻¹</b>. L = 0.4 H, C = 40 μF: ω₀ = 1/√(0.4 × 40×10⁻⁶) = <b>250 rad/s</b>.'),
  a: 'A wheel and a balloon in one pipe can slosh back and forth. The narrow pipe damps it.' },
 { t: 'Three behaviours', h:
  '<p>Compare α with ω₀:</p>' +
  '<ul><li><b>α &gt; ω₀: overdamped.</b> Two distinct real roots. Slow, no swinging.</li><li><b>α = ω₀: critically damped.</b> One repeated root. The fastest settling without swinging.</li><li><b>α &lt; ω₀: underdamped.</b> Complex roots. It rings at ω_d = √(ω₀² − α²) while dying out.</li></ul>' +
  '<p>The roots come from s² + (R/L)s + 1/(LC) = 0.</p>',
  a: 'A very narrow pipe smothers the sloshing. A wide pipe lets it ring.' },
 { t: 'What changes the type', h:
  '<p>Raising R raises α while ω₀ stays the same, so a bigger R pushes the circuit toward <b>overdamped</b>. Lowering R pushes it toward <b>underdamped</b>.</p>' +
  EX('Example', 'ω₀ = 250 rad/s. R = 200 Ω, L = 0.2 H gives α = 500 &gt; 250: overdamped. R = 50 Ω gives α = 125 &lt; 250: underdamped.'),
  a: 'Squeeze the pipe more and the sloshing dies.' }
]);

/* Teaching pages for Power Keeper, levels 1-8. Each level has three lessons (warm-up, challenge, hard). They show before the questions. */
const F = x => '<div class="formula">' + x + '</div>';
const EX = (t, x) => '<div class="example"><b class="eh">' + t + '</b>' + x + '</div>';
const TRAP = x => '<div class="trap"><b class="eh">Watch out</b>' + x + '</div>';
const LEARN = (idx, topic, ls) => {
  const L = GRID_LEVELS[idx - 1];
  if (!L || L.topic !== topic) throw new Error('lesson/level mismatch at ' + idx + ': ' + (L && L.topic) + ' vs ' + topic);
  L.learn = { 1: ls[0], 2: ls[1], 3: ls[2] };
};

LEARN(1, 'Power on the Wire', [
 { t: 'AC power wiggles', h:
  '<p>In an AC circuit the voltage and current both swing up and down. Power is still voltage times current, but now it changes from instant to instant.</p>' + F('p(t) = v(t) · i(t)') +
  '<p>The <b>average</b> of that wiggling power is the real work: heat, light and motion. Parts react differently:</p>' +
  '<ul><li><b>Resistor</b>: current and voltage are <b>in phase</b>. It uses all the power as heat, and p(t) never goes below zero.</li><li><b>Inductor</b> (coil): current <b>lags</b> the voltage. It borrows energy and gives it back.</li><li><b>Capacitor</b>: current <b>leads</b> the voltage. It also borrows and returns energy.</li></ul>',
  a: 'Mill water spins the wheel and gets used up. Sloshing water just rushes in and out of a tank and does no work. A resistor only has mill water. Coils and capacitors only have sloshing water.' },
 { t: 'rms: the equivalent DC value', h:
  '<p>An AC voltage with peak value V<sub>m</sub> delivers the same heating as a DC voltage called the <b>rms</b> (root mean square) value:</p>' + F('V<sub>rms</sub> = V<sub>m</sub> ÷ √2   (≈ 0.707 V<sub>m</sub>)') +
  EX('Example', 'A wall outlet with a 170 V peak is 170 ÷ 1.414 = <b>120 V rms</b>. A peak of 311 V is 311 ÷ 1.414 ≈ <b>220 V rms</b>.') +
  '<p>For power into a resistor, use rms in place of the DC value: <b>P = V<sub>rms</sub>² ÷ R</b>.</p>' +
  '<p>Because p(t) is a product of two waves at frequency ω, the power wave wiggles at <b>2ω</b>, twice the line frequency.</p>',
  a: 'The rms value is the steady flow that would turn the mill as hard as the swinging flow does on average.' },
 { t: 'Average power into a resistor', h:
  '<p>If v(t) = V<sub>m</sub> cos(ωt) is across a resistor R, the average power is:</p>' + F('P = V<sub>rms</sub>² ÷ R = V<sub>m</sub>² ÷ (2R)') +
  EX('Example', 'v(t) = 100 cos(ωt) V across 25 Ω: V<sub>rms</sub> = 100 ÷ 1.414 = 70.7 V. P = 70.7² ÷ 25 = <b>200 W</b>. Same as 100² ÷ (2 × 25) = 200 W.') +
  '<p>Two kinds of power to keep apart:</p>' +
  '<ul><li><b>Real power</b> (watts): used up as heat, light or motion.</li><li><b>Reactive power</b> (vars): energy that flows in and out of fields (coils and capacitors) and is never used up.</li></ul>',
  a: 'A resistor drinks the mill water completely. A coil or a capacitor only sloshes water back and forth.' }
]);

LEARN(2, 'Power Factor and the Phase Angle', [
 { t: 'Leading and lagging', h:
  '<p>The <b>phase angle</b> between voltage and current decides how much of the power is real. Memory trick: <b>“ELI the ICE man”</b>.</p>' +
  '<ul><li><b>ELI</b>: in an inductor (L), voltage (E) comes before current (I). The current <b>lags</b>.</li><li><b>ICE</b>: in a capacitor (C), current (I) comes before voltage (E). The current <b>leads</b>.</li></ul>' +
  '<p>Motors, fans and fridges are inductive (lagging). A resistive load is in phase. Some computer power supplies lead.</p>',
  a: 'A coil makes the push arrive before the flow. A capacitor makes the flow arrive before the push.' },
 { t: 'Power factor', h:
  '<p>The <b>power factor</b> is the share of the apparent push that does real work.</p>' + F('pf = cos( θ<sub>v</sub> − θ<sub>i</sub> )') +
  EX('Example', 'θ<sub>v</sub> = 15°, θ<sub>i</sub> = −30°. The difference is 45°, so pf = cos 45° = <b>0.707</b>.') +
  '<p>A resistor has pf = 1. A pure coil or capacitor has pf = 0.</p>' +
  TRAP('pf alone does not tell you lagging or leading. A pf of 0.5 could be either. You need the word “lagging” or “leading”, or the sign of Q.'),
  a: 'Pf is the fraction of the water that actually turns the mill. At pf = 1, all of it does.' },
 { t: 'Real power and cosine angles', h:
  '<p>For a load with v = V<sub>m</sub> cos(ωt + θ<sub>v</sub>) and i = I<sub>m</sub> cos(ωt + θ<sub>i</sub>):</p>' + F('P = ½ · V<sub>m</sub> · I<sub>m</sub> · cos( θ<sub>v</sub> − θ<sub>i</sub> )') +
  EX('Example', 'v = 120 cos(ωt + 20°), i = 5 cos(ωt + 50°). θ<sub>v</sub> − θ<sub>i</sub> = −30°. P = ½ × 120 × 5 × cos(−30°) = 300 × 0.866 = <b>259.8 W</b>.') +
  '<p>Convert sines to cosines before you read the angle: sin(x) = cos(x − 90°).</p>' +
  EX('Example', 'i = 4 sin(ωt + 135°) = 4 cos(ωt + 135° − 90°) = 4 cos(ωt + <b>45°</b>).'),
  a: 'Put every wave in the same language (cosine) before you compare how far apart they are.' }
]);

LEARN(3, 'Complex Power and the Power Triangle', [
 { t: 'P, Q and S', h:
  '<p>Bundle the two kinds of power into one complex number:</p>' + F('S = P + jQ') +
  '<ul><li><b>P</b>: real power, in <b>watts</b> (W).</li><li><b>Q</b>: reactive power, in <b>vars</b> (VAR).</li><li><b>S</b> and its size |S|: <b>apparent power</b>, in volt-amps (VA). It is what the wires must carry.</li></ul>' +
  F('|S| = √( P² + Q² )') +
  EX('Example', 'P = 100 W, Q = 240 VAR: |S| = √(100² + 240²) = √(10000 + 57600) = <b>260 VA</b>.'),
  a: 'The pipe must carry both the mill water and the sloshing water. Its size is set by the two together.' },
 { t: 'The power triangle', h:
  '<p>P, Q and |S| form a right triangle. The angle at the corner is the power-factor angle θ = θ<sub>v</sub> − θ<sub>i</sub>.</p>' + F('P = |S| cos θ,   Q = |S| sin θ,   pf = P ÷ |S|') +
  EX('Example', '|S| = 20 kVA at a lagging pf of 0.6: P = 20 × 0.6 = <b>12 kW</b>. Then Q = √(20² − 12²) = 16 kVAR.') +
  '<p>S also equals V<sub>rms</sub> · I<sub>rms</sub> ∠(θ<sub>v</sub> − θ<sub>i</sub>), so its angle is the power-factor angle.</p>',
  a: 'The long side of the triangle is the pipe. The mill side is the useful part. The sloshing side is the part that clogs the pipe.' },
 { t: 'Adding loads and line loss', h:
  '<p>When several loads share one source, add their <b>complex powers</b>:</p>' + F('S<sub>total</sub> = S<sub>1</sub> + S<sub>2</sub> + …') +
  TRAP('You cannot just add the |S| values unless the angles are the same. Add P with P and Q with Q.') +
  '<p>A line with resistance R carrying current I wastes <b>I² R</b> as heat.</p>' +
  EX('Example', 'A load draws |S| = 10 kVA at 100 V rms. Current = 10,000 ÷ 100 = 100 A. The line has 0.02 Ω, so loss = 100² × 0.02 = <b>200 W</b>.'),
  a: 'Total pipe flow is the sum of all mills’ mill water plus the sum of all sloshing. Bigger flow in the pipe means more friction loss, I² R.' }
]);

LEARN(4, 'Fix the Line: Power Factor Correction and Max Power', [
 { t: 'Why correct the power factor?', h:
  '<p>A motor-type load draws extra current just to slosh energy in and out. That extra current heats the line (I² R) without doing any work.</p>' +
  '<p>Fix: add a <b>capacitor in parallel</b> with the load. The capacitor supplies the sloshing energy locally, so the line carries less current and the source sees a pf near 1.</p>' +
  '<ul><li><b>Parallel</b> capacitor: load voltage and current unchanged, line current drops.</li><li><b>Series</b> capacitor: does not help, because the load current is unchanged.</li></ul>',
  a: 'Put a balloon tank beside the load. The tank takes the sloshing, so the main pipe carries only mill water.' },
 { t: 'How much loss do you save?', h:
  '<p>Loss is I² R. Cut the current, and the loss drops by the square.</p>' +
  EX('Example', 'Line current drops from 10 A to 6 A on a 2 Ω line. Before: 10² × 2 = 200 W. After: 6² × 2 = 72 W. Saved: <b>128 W</b>.') +
  '<p>To choose the capacitor, make the load’s <b>susceptance</b> (the imaginary part of its admittance) cancel.</p>' +
  EX('Example', 'Z<sub>L</sub> = 4 + j3 Ω at ω = 100 rad/s. Y = 1/Z = (4 − j3) ÷ 25 = 0.16 − j0.12 S. The capacitor adds +jωC, so set ωC = 0.12: C = 0.12 ÷ 100 = <b>1.2 mF</b>.'),
  a: 'Size the tank to hold exactly the sloshing the load would send into the pipe.' },
 { t: 'Maximum power transfer', h:
  '<p>A source with impedance Z<sub>s</sub> = R<sub>s</sub> + jX<sub>s</sub> delivers the most power to a load when:</p>' + F('Z<sub>L</sub> = Z<sub>s</sub>*   (R<sub>L</sub> = R<sub>s</sub>,  X<sub>L</sub> = −X<sub>s</sub>)') +
  '<p>The reactances cancel, and the resistances match.</p>' +
  F('P<sub>max</sub> = V<sub>s,rms</sub>² ÷ (4 R<sub>s</sub>)') +
  EX('Example', 'V<sub>s</sub> = 10 V rms, R<sub>s</sub> = 2 Ω: P<sub>max</sub> = 10² ÷ (4 × 2) = <b>12.5 W</b>.'),
  a: 'The mill takes the most water when its wheel is matched to the pump: same resistance, and no leftover sloshing.' }
]);

LEARN(5, 'Three-Phase Basics', [
 { t: 'Three waves, 120° apart', h:
  '<p><b>Three-phase</b> power is three AC waves of equal size, each shifted 120° from the next. In the usual <b>abc (positive) sequence</b> with V<sub>a</sub> = V<sub>m</sub>∠0°:</p>' +
  '<ul><li>V<sub>b</sub> = V<sub>m</sub>∠<b>−120°</b></li><li>V<sub>c</sub> = V<sub>m</sub>∠<b>+120°</b></li></ul>' +
  '<p>In the <b>acb (negative) sequence</b>, b and c swap angles. Note 240° is the same as −120°.</p>',
  a: 'Three pumps push in turn, each a third of a cycle after the last.' },
 { t: 'Why balanced sets are special', h:
  '<p>A set is <b>balanced</b> when the three waves have equal size, are 120° apart, and add up to zero.</p>' + F('V<sub>a</sub> + V<sub>b</sub> + V<sub>c</sub> = 0') +
  EX('Check with numbers', 'V<sub>a</sub> = 120∠0° has real part 120. V<sub>b</sub> = 120∠−120° has real part 120 cos 120° = −60. V<sub>c</sub> also −60. Sum: 120 − 60 − 60 = <b>0</b>.') +
  '<p>Because they cancel, there is nothing left to return through a neutral wire. Three wires carry three times the power of two.</p>',
  a: 'When one pump pushes hardest, the other two are partly pulling back. In total the water that must return is zero.' },
 { t: 'Where the three phases come from', h:
  '<p>A generator has a magnet that spins inside three coils (<b>stator windings</b>) placed 120° apart. The spinning field sweeps each coil at a different moment, so each produces its own sinusoid, 120° behind the previous.</p>' +
  '<p>That is why the grid uses three phases: they cancel at the neutral point, so no extra return wire is needed, and the generator makes them naturally.</p>',
  a: 'Three taps spaced around the wheel get pushed one after another as it turns.' }
]);

LEARN(6, 'The Real Grid and the Balanced Y-Y Circuit', [
 { t: 'Split-phase service at home', h:
  '<p>A neighborhood transformer feeds a home with <b>split-phase</b> power: two hot wires and a shared neutral. The hots are 180° apart.</p>' +
  '<ul><li>One hot to neutral: <b>120 V</b>.</li><li>Hot to hot: V∠0° − V∠180° = 2V = <b>240 V</b>.</li></ul>',
  a: 'Two taps on opposite sides of the pipe: each side to the middle is half the full pressure across both.' },
 { t: 'Y and Δ connections', h:
  '<p>Three-phase sources and loads connect in two shapes:</p>' +
  '<ul><li><b>Y</b> (wye): three branches meeting at a center point.</li><li><b>Δ</b> (delta): the three branches form a triangle.</li></ul>' +
  '<p>Y-Y is the most common. Big motors often use Δ loads. A Δ–Y transformer connection steps voltage up for transmission.</p>' +
  '<p>The path from generator to home: generator → step up to high voltage → transmission lines → step down in stages → neighborhood transformer (120/240 V) → home. High voltage means <b>less current and less loss</b> over the long haul.</p>',
  a: 'High pressure moves the same water through a thin pipe, so you lose less on the long trip.' },
 { t: 'The balanced Y-Y shortcut', h:
  '<p>In a balanced Y-Y circuit all three phases are identical in size, 120° apart. The three phase currents add to zero, so the <b>neutral wire carries zero current</b>. That means you can solve <b>one phase</b> and shift by ±120° for the others.</p>' +
  F('V<sub>line</sub> = √3 · V<sub>phase</sub>') +
  EX('Example', 'Phase voltage 277 V: line-to-line voltage = 1.732 × 277 ≈ <b>480 V</b>. A 120 V phase gives about 208 V line.'),
  a: 'The pushing and the pulling of the three pumps cancel at the center, so the return line has nothing to carry.' }
]);

LEARN(7, 'Y-Y and Y-Δ Analysis', [
 { t: 'Phase versus line', h:
  '<p>In a three-phase system the <b>line</b> values are measured between the wires going to the load. The <b>phase</b> values are across one branch.</p>' +
  '<ul><li><b>Y</b>: phase current = line current. Line voltage = √3 × phase voltage.</li><li><b>Δ</b>: phase voltage = line voltage. Line current = √3 × phase current.</li></ul>' +
  EX('Example', 'Y system, line-to-line 480 V: phase voltage = 480 ÷ 1.732 = <b>277 V</b>. Δ load drawing 25 A in each line: phase current = 25 ÷ 1.732 = <b>14.4 A</b>.'),
  a: 'Pressure across two pipes versus pressure from one pipe to the center: they differ by a factor of √3.' },
 { t: 'Turning a Δ into a Y', h:
  '<p>To analyze a Δ load with the one-phase shortcut, swap it for an equivalent Y. For a <b>balanced</b> load:</p>' + F('Z<sub>Y</sub> = Z<sub>Δ</sub> ÷ 3') +
  EX('Example', 'A balanced Δ load has 90 Ω in each leg. The equivalent Y has 90 ÷ 3 = <b>30 Ω</b> in each leg.') +
  '<p>For the abc sequence, the line voltage leads the phase voltage by 30°: V<sub>AB</sub> = √3 ∠+30° · V<sub>AN</sub>. For acb it is √3 ∠−30°.</p>',
  a: 'A triangle of pipes can be redrawn as a star of pipes, each a third as hard to flow through.' },
 { t: 'Solving one phase', h:
  '<p>For a balanced Y-Y circuit, draw the single-phase circuit: the source, the generator impedance Z<sub>g</sub>, the line impedance Z<sub>l</sub> and the load Z<sub>L</sub> in series. Add them and divide.</p>' + F('I<sub>aA</sub> = V<sub>a</sub> ÷ ( Z<sub>g</sub> + Z<sub>l</sub> + Z<sub>L</sub> )') +
  EX('Example', 'V<sub>a</sub> = 240∠0°. Z<sub>g</sub> = 0.5 + j1, Z<sub>l</sub> = 1.5 + j2, Z<sub>L</sub> = 38 + j27. Total = 40 + j30 Ω, size = √(40² + 30²) = 50 Ω. |I| = 240 ÷ 50 = <b>4.8 A</b>.') +
  '<p>The other two phases have the same size, shifted by −120° and +120°.</p>',
  a: 'Follow the water through one pipe from pump to mill and back. The other two pipes behave the same, just a third of a turn later.' }
]);

LEARN(8, 'Three-Phase Power', [
 { t: 'Smooth power', h:
  '<p>Each phase has a power wave that wiggles at 2ω. In a balanced set, the three wiggles are 120° apart and <b>cancel</b>, so the total instantaneous power is <b>constant</b>. That gives smooth motor torque.</p>' +
  '<p>Total real power is three times the power in one phase.</p>',
  a: 'Three pumps take turns. When one dips, the others fill the gap, so the water to the mill never pulses.' },
 { t: 'The three-phase power formula', h:
  '<p>In terms of line values (works for both Y and Δ):</p>' + F('P<sub>T</sub> = √3 · V<sub>line</sub> · I<sub>line</sub> · cos θ') +
  EX('Example', 'V<sub>line</sub> = 208 V, I<sub>line</sub> = 20 A, pf = 0.8. P<sub>T</sub> = 1.732 × 208 × 20 × 0.8 = <b>5.76 kW</b>. One phase gets a third: <b>1.92 kW</b>.'),
  a: 'Total mill power is the pressure and flow of all three pipes together, scaled by how much of it is not sloshing.' },
 { t: 'Reactive and apparent three-phase power', h:
  '<p>The same pattern gives reactive power, with sin θ in place of cos θ:</p>' + F('Q<sub>T</sub> = √3 · V<sub>line</sub> · I<sub>line</sub> · sin θ') + F('|S<sub>T</sub>| = √3 · V<sub>line</sub> · I<sub>line</sub>') +
  EX('Example', 'pf = 0.6 lagging means cos θ = 0.6, so sin θ = 0.8. With 208 V and 20 A: Q = 1.732 × 208 × 20 × 0.8 = <b>5.76 kVAR</b>.') +
  TRAP('Get sin θ from cos θ with sin θ = √(1 − cos²θ). A pf of 0.6 gives 0.8, not 0.4.'),
  a: 'The same triangle again: mill water on one side, sloshing on the other, pipe size on the long side.' }
]);

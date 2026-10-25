/* Teaching pages for Circuit Basics Quest. Each level has up to three lessons (warm-up, challenge, hard). They show before the questions. */
const F = x => '<div class="formula">' + x + '</div>';
const EX = (t, x) => '<div class="example"><b class="eh">' + t + '</b>' + x + '</div>';
const TRAP = x => '<div class="trap"><b class="eh">Watch out</b>' + x + '</div>';
const LEARN = (idx, topic, ls) => {
  const L = WATER_LEVELS[idx - 1];
  if (!L || L.topic !== topic) throw new Error('lesson/level mismatch at ' + idx + ': ' + (L && L.topic) + ' vs ' + topic);
  L.learn = { 1: ls[0], 2: ls[1], 3: ls[2] };
};

LEARN(1, 'Circuit Variables', [
 { t: 'What flows, what pushes, what it costs', h:
  '<p>A circuit is a path that electric <b>charge</b> can flow around. Charge is measured in <b>coulombs (C)</b>.</p>' +
  '<p><b>Current</b> is how fast the charge flows past a point. One <b>ampere (A)</b> means one coulomb passes every second.</p>' + F('i = dq/dt   (A = C/s)') +
  '<p><b>Voltage</b> is the push on the charge: how much energy each coulomb picks up or gives up. It is measured in <b>volts (V)</b>.</p>' +
  '<p><b>Power</b> is how fast energy is used, in <b>watts (W)</b>. <b>Energy</b> is measured in <b>joules (J)</b>.</p>' +
  '<p>Units to remember: current A, voltage V, power W, energy J, charge C.</p>' +
  EX('Example', 'A steady 5 A flows for 3 s. The charge that passed is q = i · t = 5 × 3 = <b>15 C</b>.'),
  a: 'Charge is the water. Current is gallons per second. Voltage is the pressure pushing the water. Power is how fast the water does work.' },
 { t: 'Power and energy', h:
  '<p>Power is voltage times current.</p>' + F('p = v · i      (W = V × A)') +
  '<p>Power is energy per second, so energy is power times time (when the power stays the same):</p>' + F('w = p · t      (J = W × s)') +
  EX('Example: energy', 'A 60 W lamp runs for 10 s. Energy = 60 × 10 = <b>600 J</b>.') +
  EX('Example: two very different events', 'A car starter draws 500 A for 2 s: q = 500 × 2 = 1,000 C. A lightning bolt carries 10,000 A for 0.1 s: q = 10,000 × 0.1 = 1,000 C. The charge is the <b>same</b>. The bolt just delivers it 20 times faster.'),
  a: 'A lightning bolt and a car starter move the same amount of water. The bolt pours it out in a tenth of a second.' },
 { t: 'When the current changes', h:
  '<p>If the current is not constant, split the time into pieces where it <b>is</b> constant. Find the charge in each piece with q = i · t, then add them up.</p>' +
  EX('Example', '2 A for 3 s, then 1 A for 4 s. Charge = (2 × 3) + (1 × 4) = 6 + 4 = <b>10 C</b>.') +
  '<p>The same trick works for energy when power changes: add up p · t for each piece.</p>',
  a: 'Count the gallons that went by during each stretch, then add the stretches together.' }
]);

LEARN(2, 'Power and the Passive Sign Convention', [
 { t: 'Does a part use power or give it?', h:
  '<p>Every part in a circuit either <b>absorbs</b> power (uses it up, like a lamp or a resistor) or <b>delivers</b> power (supplies it, like a battery).</p>' +
  '<p>To tell which, draw the current arrow so it <b>enters the + end</b> of the part. This is the <b>passive sign convention</b>. Then:</p>' + F('p = v · i') +
  '<ul><li>If <b>p is positive</b>, the part <b>absorbs</b> power.</li><li>If <b>p is negative</b>, the part <b>delivers</b> power.</li></ul>' +
  EX('Example', 'Current of 2 A enters the + end of a part with 4 V across it: p = 4 × 2 = +8 W. The part absorbs 8 W. If the current is −2 A instead, p = −8 W and the part is delivering power.'),
  a: 'A part that drinks water has positive power. A pump that pushes water out has negative power.' },
 { t: 'When the arrow points the other way', h:
  '<p>The rule p = v · i only works if the current arrow enters the <b>+</b> terminal.</p>' +
  '<p>If the current arrow enters the <b>− terminal</b> instead, write the formula with a minus sign:</p>' + F('p = −v · i') +
  EX('Example', 'v = 5 V and i = 3 A, but the arrow enters the − end. Then p = −(5)(3) = −15 W. The part delivers 15 W.') +
  TRAP('A negative answer is not a mistake. It tells you the part is delivering power.'),
  a: 'Check which way the water enters the part before deciding whether it is drinking or pumping.' },
 { t: 'Power always balances', h:
  '<p>In a whole circuit, the power delivered by the sources equals the power absorbed by everything else. Nothing is created or lost. This is a handy way to check your work.</p>' + F('power delivered = power absorbed') +
  EX('Example', 'Two parts absorb 20 W and 30 W. One source supplies all the power. It must deliver 20 + 30 = <b>50 W</b>.'),
  a: 'All the water pumped in is used somewhere. The total pumped equals the total drunk.' }
]);

LEARN(3, 'Sources and Ohm’s Law', [
 { t: 'Sources and resistors', h:
  '<p>A <b>voltage source</b> keeps its voltage fixed no matter what you connect. A <b>current source</b> keeps its current fixed. These are called <i>ideal</i> sources.</p>' +
  '<p>Some sources are <b>dependent</b>: their value is set by a voltage or current somewhere else in the circuit. There are four kinds, named by what controls them and what they make: <b>VCVS</b> (voltage controls a voltage source), <b>CCVS</b> (current controls a voltage source), <b>VCCS</b> (voltage controls a current source), <b>CCCS</b> (current controls a current source).</p>' +
  '<p>A <b>resistor</b> limits the current. <b>Ohm’s law</b> says the voltage across it equals the current times its resistance R (in ohms, Ω):</p>' + F('v = R · i') +
  EX('Example', 'A 470 Ω resistor carries 10 mA (0.01 A). v = 470 × 0.01 = <b>4.7 V</b>. Remember to change mA into A.') +
  TRAP('Two different ideal voltage sources cannot sit in parallel, and two different ideal current sources cannot sit in series. They would disagree with each other.'),
  a: 'A voltage source is a pump that holds the pressure steady. A current source is a pump that holds the flow steady. A resistor is a narrow pipe.' },
 { t: 'Resistor power and the color code', h:
  '<p>A resistor turns electrical energy into heat. Its power can be written three ways:</p>' + F('p = v·i = i²R = v²/R') +
  EX('Example', '12 V across a 100 Ω resistor: p = 12² / 100 = <b>1.44 W</b>.') +
  '<p><b>Resistor color code.</b> Bands tell you the value. For a 4-band resistor: the first two bands are digits, the third is the number of zeros (a power of ten), the last is the tolerance.</p>' +
  '<p>Digits: black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9. Gold tolerance is 5%.</p>' +
  EX('Example', 'brown, red, brown, gold = 1, 2, then ×10¹ = <b>120 Ω</b>, 5%.'),
  a: 'The narrow pipe warms up from the squeeze. A narrower pipe (higher R) wastes more pressure.' },
 { t: 'Power ratings', h:
  '<p>Every resistor has a <b>power rating</b>, the most power it can safely turn into heat (for example 0.25 W). If you pass the rating, it overheats.</p>' +
  '<p>Since p = v²/R, the largest safe voltage is found by solving for v:</p>' + F('v_max = √(P · R)') +
  EX('Example', 'A 100 Ω resistor rated 0.25 W: v_max = √(0.25 × 100) = √25 = <b>5 V</b>.'),
  a: 'A narrow pipe can only carry so much squeeze before it gets too hot. The rating is that limit.' }
]);

LEARN(4, 'Kirchhoff’s Laws', [
 { t: 'Two rules that always hold', h:
  '<p>A <b>node</b> is a point where parts join. A <b>loop</b> is a closed path around the circuit.</p>' +
  '<p><b>KCL (Kirchhoff’s Current Law):</b> the currents at any node add up to zero. In other words, what flows into a node flows out.</p>' +
  '<p><b>KVL (Kirchhoff’s Voltage Law):</b> go around any closed loop and the voltages add up to zero. Rises (like a battery) equal drops (like resistors).</p>' +
  EX('KCL example', 'At a node, 5 A and 2 A flow in, and 3 A flows out on one wire. The last wire must carry out 5 + 2 − 3 = <b>4 A</b>.'),
  a: 'KCL: water going into a pipe junction must come out. KVL: go all the way around a ring of pipe and the pressure you gain equals the pressure you lose.' },
 { t: 'Using KVL', h:
  '<p>To use KVL, pick a loop and add the voltage rises and drops. If a source rises by 12 V, the drops must total 12 V.</p>' +
  EX('Example', 'A 12 V source drives three resistors in series. The first two drop 4 V and 3 V. The third drops 12 − 4 − 3 = <b>5 V</b>.') +
  '<p>KVL works around <b>any</b> closed loop, even one that crosses a gap in the wire. If a wire is broken, no current flows, so the resistors drop 0 V, and the full source voltage appears across the gap.</p>',
  a: 'Even a gap in the pipe belongs to the ring. If no water flows, the whole pressure difference shows up across the gap.' },
 { t: 'Putting the laws together', h:
  '<p>Combine Ohm’s law with KVL to solve a single loop. In a series loop, the same current flows through everything.</p>' + F('i = V_source / (R₁ + R₂)') +
  EX('Example', '18 V source, 100 Ω and 200 Ω in series. i = 18 / 300 = 0.06 A. Voltage across the 200 Ω = 0.06 × 200 = <b>12 V</b>.'),
  a: 'One ring of pipe has one flow. Divide the pump pressure by the total squeeze to get the flow.' }
]);

LEARN(5, 'Kirchhoff with Dependent Sources', [
 { t: 'A source that reads a gauge', h:
  '<p>A <b>dependent source</b> has a value set by a voltage or current elsewhere. Example: a voltage source worth 3·i volts, where i is the current in the loop.</p>' +
  '<p>You use KVL and KCL exactly the same way. The only new step: write the dependent source’s value in terms of the control variable, then solve for that variable.</p>',
  a: 'A dependent source is a pump whose strength is set by a gauge somewhere else. The rules for junctions and rings do not change.' },
 { t: 'Example: one loop', h:
  '<p>A 12 V source drives a 2 Ω resistor, and a dependent voltage source of 3·i opposes it (i is the loop current).</p>' +
  EX('KVL', '12 = 2·i + 3·i = 5·i, so i = 12/5 = <b>2.4 A</b>.') +
  '<p>The opposing source acts just like a 3 Ω resistor here, because its voltage is proportional to the current.</p>',
  a: 'The controlled pump pushes back in proportion to the flow, like extra squeeze.' },
 { t: 'Example: KCL with a controlled current source', h:
  '<p>A node receives 9 A. It leaves through a resistor branch carrying i_x, and through a dependent current source of 2·i_x.</p>' +
  EX('KCL', '9 = i_x + 2 i_x = 3 i_x, so i_x = <b>3 A</b>.') +
  '<p>To find the power a part absorbs, find its voltage and current, then use p = v·i with the passive sign convention.</p>',
  a: 'Count the water in and out of the junction, including the controlled pump.' }
]);

LEARN(6, 'Combining Resistors', [
 { t: 'Series and parallel', h:
  '<p>Two parts are in <b>series</b> if the same current flows through both (one after the other). They are in <b>parallel</b> if they connect across the same two nodes (same voltage).</p>' +
  '<p><b>Series:</b> resistances add.</p>' + F('R_eq = R₁ + R₂ + …') +
  '<p><b>Parallel:</b> the reciprocals add. For two resistors:</p>' + F('R_eq = R₁R₂ / (R₁ + R₂)') +
  EX('Example', '30 Ω in parallel with 60 Ω: (30 × 60)/(30 + 60) = 1800/90 = <b>20 Ω</b>.'),
  a: 'Pipes in a row add their squeeze. Pipes side by side give the water extra paths, so the squeeze goes down.' },
 { t: 'Parallel is always smaller', h:
  '<p>More paths mean less total resistance. So the parallel combination is always <b>smaller than the smallest branch</b>.</p>' +
  EX('Check', '100 Ω ∥ 400 Ω = 40000/500 = 80 Ω, smaller than 100 Ω.') +
  '<p>Shortcut: N equal resistors R in parallel give R/N.</p>',
  a: 'Open another side pipe and the water finds it easier to get through.' },
 { t: 'Reduce step by step', h:
  '<p>For a bigger network, start at the far end from the source. Combine the parts that are clearly series or parallel, redraw, and repeat.</p>' +
  EX('Example', '10 Ω in series with the parallel pair 30 Ω and 60 Ω. First 30 ∥ 60 = 20 Ω. Then 10 + 20 = <b>30 Ω</b>.'),
  a: 'Merge the side pipes first, then add the pipes in a row.' }
]);

LEARN(7, 'Voltage and Current Dividers', [
 { t: 'Splitting the voltage', h:
  '<p>Two resistors in series share the source voltage in proportion to their size. The bigger resistor gets the bigger share.</p>' + F('v₂ = v_s · R₂ / (R₁ + R₂)') +
  EX('Example', '12 V across 1 kΩ and 3 kΩ in series. The voltage across the 3 kΩ is 12 × 3/(1 + 3) = <b>9 V</b>.') +
  '<p>A <b>potentiometer</b> is a divider you can slide. With the wiper at a fraction α of the way up, the output is α · v_s.</p>',
  a: 'Pressure is shared along a row of pipes in proportion to their squeeze.' },
 { t: 'Splitting the current, and loading', h:
  '<p>Two resistors in <b>parallel</b> share the current. The <b>smaller</b> resistor gets the <b>bigger</b> share:</p>' + F('i₁ = i · R₂ / (R₁ + R₂)') +
  '<p>Notice that R₂ is on top for i₁. The current through one branch uses the <i>other</i> resistor on top.</p>' +
  EX('Example', '12 A into 2 Ω ∥ 6 Ω. The current in the 2 Ω is 12 × 6/8 = <b>9 A</b>, and the 6 Ω gets 3 A.') +
  '<p><b>Loading:</b> if you connect a load across a divider’s output, the load is in parallel with the bottom resistor, so the output drops.</p>',
  a: 'Water prefers the wide pipe. A thirsty tap added at the output pulls pressure down.' },
 { t: 'A loaded divider', h:
  '<p>To find the output with a load R_L, first combine the bottom resistor with the load, then apply the divider formula.</p>' + F('R₂ ∥ R_L = R₂R_L / (R₂ + R_L)') +
  EX('Example', '10 V, R₁ = 10 kΩ, R₂ = 10 kΩ, load 10 kΩ. R₂ ∥ R_L = 5 kΩ. Output = 10 × 5/(10 + 5) = <b>3.33 V</b>, not the unloaded 5 V.'),
  a: 'Add the side pipe to the bottom pipe first, then split the pressure.' }
]);

LEARN(8, 'Bridges and Delta–Wye', [
 { t: 'The bridge', h:
  '<p>A <b>bridge</b> is two resistor legs side by side with a fifth resistor across the middle. The legs are R₁ (top) over R₂ (bottom) on the left, and R₃ over R₄ on the right.</p>' +
  '<p>The bridge is <b>balanced</b> when the two legs divide the voltage the same way:</p>' + F('R₁ R₄ = R₂ R₃') +
  '<p>If it is balanced, the two middle points sit at the same voltage, so <b>no current flows</b> through the middle resistor. You can delete it.</p>' +
  EX('Example', 'R₁ = 4k, R₂ = 3k, R₃ = 20k, R₄ = 15k. 4 × 15 = 60 and 3 × 20 = 60. Balanced!'),
  a: 'If both middle taps have the same pressure, no water crosses the bridge pipe.' },
 { t: 'Triangles and stars', h:
  '<p>A <b>Δ (delta)</b> is three resistors in a triangle. A <b>Y (wye)</b> is three resistors meeting at a hub. Seen from outside, a Δ and a Y can behave the same, so you can swap one for the other.</p>' +
  '<p><b>Δ to Y:</b> each Y resistor is the product of the two Δ resistors beside that corner, divided by the sum of all three:</p>' + F('R₁ = R_b R_c / (R_a + R_b + R_c)') +
  '<p>If all three are equal: <b>R_Y = R_Δ / 3</b> and <b>R_Δ = 3 R_Y</b>.</p>' +
  EX('Example', 'Three 60 Ω in a Δ become three 20 Ω in a Y.'),
  a: 'A triangle of pipes can be swapped for a star of pipes that feels the same from outside.' },
 { t: 'Solving a balanced bridge', h:
  '<p>With a balanced bridge, ignore the middle resistor. Two parallel legs are left: the <b>left leg</b> R₁ + R₂ and the <b>right leg</b> R₃ + R₄.</p>' + F('R_eq = (R₁ + R₂) ∥ (R₃ + R₄)') +
  EX('Example', 'R₁ = 10, R₂ = 20, R₃ = 20, R₄ = 40 (all Ω). Balanced: 10 × 40 = 400 and 20 × 20 = 400. Left leg = 30 Ω, right leg = 60 Ω, so R_eq = 30 ∥ 60 = <b>20 Ω</b>.') +
  '<p>If a current source feeds the bridge, split its current between the two legs with the current divider rule.</p>',
  a: 'With no flow in the middle pipe, you just have two pipe paths side by side.' }
]);

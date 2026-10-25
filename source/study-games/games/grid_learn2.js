/* Teaching pages for Power Keeper, levels 9-16. */

LEARN(9, 'Plugs, Grounding and Shock Safety', [
 { t: 'What is in a wall outlet', h:
  '<p>A standard outlet has three connections:</p>' +
  '<ul><li><b>Hot</b>: the live wire (about 120 V rms to ground). It carries current to the load.</li><li><b>Neutral</b>: the return path for the load’s current.</li><li><b>Ground</b>: a safety wire connected to the metal case of an appliance. It carries no current in normal use.</li></ul>' +
  '<p>If the hot wire ever touches a metal case, the fault current returns through the <b>ground wire</b> instead of through you, and the breaker trips.</p>',
  a: 'The ground wire is an emergency drain. If the pressure leaks onto the case, it runs down the drain, not through the person touching it.' },
 { t: 'Current, not voltage, hurts', h:
  '<p>The body is hurt by the <b>current</b> that flows through it. At 60 Hz, roughly:</p>' +
  '<ul><li>A few <b>mA</b>: a tingle.</li><li>Above the <b>let-go current</b> (about 10 to 20 mA): muscles lock and you cannot release the wire.</li><li><b>75 to 400 mA</b>: can cause ventricular fibrillation (the heart quivers instead of pumping).</li><li>Several <b>amps</b>: burns.</li></ul>' +
  EX('Example', 'Wet skin gives a hand-to-hand resistance of about 500 Ω. Touching 120 V: I = 120 ÷ 500 = 0.24 A = <b>240 mA</b>. That is inside the fibrillation range.') +
  F('I = V ÷ R'),
  a: 'It is the flow of water through the body that does the harm, not the height of the tank behind it. Wet skin opens the valve wide.' },
 { t: 'GFCI and breakers', h:
  '<p>Two different protectors:</p>' +
  '<ul><li><b>Circuit breaker</b>: senses total current and protects the <b>wires</b> from overheating.</li><li><b>GFCI</b> (ground-fault circuit interrupter): compares the hot current with the neutral current. If they differ by a few mA, the current is leaking somewhere (maybe through a person), and it trips. It protects <b>people</b>.</li></ul>' +
  TRAP('A GFCI has a blind spot. If you touch hot with one hand and neutral with the other, the current goes out the hot and back the neutral. The GFCI sees no leak and does not trip. Never rely on a GFCI alone.'),
  a: 'The GFCI counts the water leaving and the water returning. If they do not match, something is leaking, and it shuts the valve. Grabbing both pipes at once makes the water match, so it stays open.' }
]);

LEARN(10, 'Laplace Basics: Step, Impulse, Transform Pairs', [
 { t: 'Why Laplace?', h:
  '<p>The <b>Laplace transform</b> turns a hard calculus problem (differential equations) into easy algebra in a complex variable <b>s</b>. The method:</p>' +
  '<ol><li>Transform the problem to the s-domain.</li><li>Do algebra.</li><li>Transform back to time.</li></ol>' +
  '<p>It gives the <b>complete response</b> (transient plus steady state) in one go, with the starting conditions (values at t = 0⁻) built in.</p>',
  a: 'Instead of tracking the water second by second, you translate the whole problem to a simpler board game, play it, and translate the answer back.' },
 { t: 'The step and the impulse', h:
  '<p>Two special signals:</p>' +
  '<ul><li><b>Unit step u(t)</b>: 0 before t = 0, then 1. A switch flipping on.</li><li><b>Unit impulse δ(t)</b>: an instant spike with <b>area 1</b>, packed into no time at all.</li></ul>' +
  '<p>The impulse has a handy <b>sifting property</b>: it picks out the value of a function at the spike.</p>' + F('∫ f(t) δ(t − t₀) dt = f(t₀)') +
  EX('Example', '∫ (t² + 4) δ(t − 5) dt = 5² + 4 = <b>29</b>.'),
  a: 'The step is turning the tap on and leaving it. The impulse is a single hammer blow on the pipe.' },
 { t: 'The standard pairs', h:
  '<p>Memorise these time ↔ s-domain pairs (for t ≥ 0):</p>' +
  '<ul><li>u(t) ↔ <b>1/s</b></li><li>δ(t) ↔ <b>1</b></li><li>e<sup>−at</sup> u(t) ↔ <b>1/(s + a)</b></li><li>t · u(t) ↔ <b>1/s²</b></li><li>cos ωt ↔ s/(s² + ω²), sin ωt ↔ ω/(s² + ω²)</li></ul>' +
  EX('Example', 'F(s) is the transform of e<sup>−t</sup>u(t), so F(s) = 1/(s + 1). At s = 5: 1/6 = <b>0.1667</b>.') +
  EX('Time constant', 'A capacitor of 50 µF charging through 0.1 Ω: τ = RC = 5 µs. It settles in about 5τ = <b>25 µs</b>. That brief huge current is modeled as an impulse.'),
  a: 'A short table of translations: step ↔ 1/s, hammer blow ↔ 1, fading decay ↔ 1/(s + a).' }
]);

LEARN(11, 'Laplace Operations', [
 { t: 'Derivative and integral', h:
  '<p>Calculus turns into algebra:</p>' + F('df/dt ↔ s F(s) − f(0⁻)') + F('∫ f dt ↔ F(s) ÷ s') +
  '<p>So a derivative is <b>multiply by s</b> (with a correction for the starting value), and an integral is <b>divide by s</b>.</p>',
  a: 'Differentiating speeds the translation up by a factor of s. Integrating slows it down by 1/s.' },
 { t: 'Shifts and scales', h:
  '<ul><li><b>Delay</b> by a: f(t − a)u(t − a) ↔ <b>e<sup>−as</sup></b> F(s).</li><li><b>Decay factor</b>: e<sup>−at</sup> f(t) ↔ <b>F(s + a)</b>. It shifts s.</li><li><b>Speeding up time</b>: f(at) ↔ (1/a) F(s/a).</li></ul>' +
  EX('Example', 'Start with cos(ωt) ↔ s/(s² + ω²). Multiply by e<sup>−at</sup>: just replace s by (s + a). So e<sup>−at</sup> cos(ωt) ↔ (s + a)/((s + a)² + ω²). For a = 3, ω = 3, s = 0: 3 ÷ (9 + 9) = <b>0.1667</b>.'),
  a: 'Wait a bit before the water starts: multiply by e<sup>−as</sup>. Let the flow fade away: shift s.' },
 { t: 'Multiplying by t', h:
  '<p>Multiplying a time signal by <b>t</b> is the same as taking <b>−d/ds</b> of its transform:</p>' + F('t · f(t) ↔ − dF(s)/ds') +
  EX('Example', 't · cos(ωt) ↔ (s² − ω²) ÷ (s² + ω²)². At s = 4 with ω = 1: top = 16 − 1 = 15, bottom = 17² = 289, ratio = <b>0.0519</b>.') +
  '<p>A short list of rules turns one known pair into many more.</p>',
  a: 'Each rule is a small trick that turns a pair you know into a new pair for free.' }
]);

LEARN(12, 'Inverse Laplace by Partial Fractions', [
 { t: 'Splitting into pieces you know', h:
  '<p>To go back from F(s) to f(t), split a big fraction into small ones that match the standard pairs. This is <b>partial fraction expansion</b>.</p>' +
  '<ul><li><b>Simple poles</b>: A/(s + p).</li><li><b>Complex poles</b>: (Bs + C)/(quadratic).</li><li><b>Repeated poles</b>: also a B/(s + a)² term.</li><li><b>Improper fraction</b> (top degree ≥ bottom): do long division first.</li></ul>',
  a: 'Break one tangled pipe into simple straight pipes you already know how to handle.' },
 { t: 'The cover-up method', h:
  '<p>For a simple pole, find its coefficient by covering up that factor and plugging in the pole.</p>' +
  EX('Example', 'F(s) = 6 ÷ [(s + 1)(s + 3)] = A/(s + 1) + B/(s + 3). Cover (s + 1) and put s = −1 in the rest: A = 6 ÷ (−1 + 3) = <b>3</b>. Likewise B = 6 ÷ (−3 + 1) = −3.') +
  EX('Time domain', 'f(t) = 3e<sup>−t</sup> − 3e<sup>−3t</sup>.') +
  TRAP('Always check afterwards: plug the coefficients back in and confirm the pieces recombine into F(s).'),
  a: 'Cover one pipe with your thumb and read the flow through the rest.' },
 { t: 'Repeated poles, impulses and the final value', h:
  '<p>A repeated pole (s + a)² adds a <b>t · e<sup>−at</sup></b> term, besides the usual e<sup>−at</sup>.</p>' +
  '<p>An improper fraction gives <b>impulses</b> (δ and its derivative) for the polynomial part. For example 4s − 1 gives 4δ′(t) − δ(t).</p>' +
  '<p>The steps: (1) make it proper, (2) factor the bottom, (3) write the partial-fraction form, (4) find the coefficients, (5) invert each piece.</p>' +
  EX('Long-term value', 'F(s) = 6(s + 1) ÷ [s(s + 2)]. The pole at s = 0 gives a constant A = 6(0 + 1) ÷ (0 + 2) = <b>3</b>. The e<sup>−2t</sup> piece dies out, so f(t) settles to 3.'),
  a: 'After the fast-fading pipes close, only the steady one is left running. Its coefficient is the final flow.' }
]);

LEARN(13, 'Circuits in the s-Domain', [
 { t: 'Impedances in s', h:
  '<p>Turn every part into an s-domain impedance:</p>' +
  '<ul><li>Resistor: <b>R</b>.</li><li>Inductor: <b>sL</b>.</li><li>Capacitor: <b>1/(sC)</b>.</li></ul>' +
  '<p>Then use the ordinary tools (KVL, KCL, dividers, Thevenin) with these impedances. The answer comes out as a function of s, and you invert it for the time response.</p>',
  a: 'Each part gets a flow-resistance label that depends on s. Then it is ordinary pipe arithmetic.' },
 { t: 'Initial conditions as extra sources', h:
  '<p>Parts that start with stored energy get a small extra source:</p>' +
  '<ul><li><b>Inductor</b> starting at current I₀: series form has a voltage source <b>L · I₀</b>. Parallel form has a current source I₀/s.</li><li><b>Capacitor</b> starting at voltage V₀: series form has a voltage source <b>V₀/s</b>. Parallel form has a current source C · V₀.</li></ul>' +
  '<p>Series and parallel forms give the same answer.</p>' +
  '<p>The recipe: (1) transform the sources, (2) transform the parts, (3) add initial-condition sources, (4) solve in s, (5) invert.</p>',
  a: 'A tank that starts with water in it or a pipe that is already flowing becomes a small extra pump in the s-domain picture.' },
 { t: 'Total, zero-input and zero-state responses', h:
  '<p>The total response splits in two:</p>' +
  '<ul><li><b>Zero-input</b>: the response to the starting energy alone, with the source off.</li><li><b>Zero-state</b>: the response to the source alone, with everything starting at rest. This is the same as the convolution result.</li></ul>' +
  F('total = zero-input + zero-state') +
  EX('Example: a discharging capacitor', 'A capacitor at 24 V discharges through 4 kΩ, C = 0.5 mF. τ = RC = 4000 × 0.0005 = 2 s. v(t) = 24 e<sup>−t/2</sup>. At t = 2 s: 24 e<sup>−1</sup> = <b>8.83 V</b>.'),
  a: 'The water already in the tank drains out on its own. New water from the pump adds to it.' }
]);

LEARN(14, 'Laplace Circuit Examples', [
 { t: 'Picking the right tool', h:
  '<p>Once a circuit is in the s-domain, it is just algebra. Pick the easiest solver:</p>' +
  '<ul><li><b>Loop equations with Cramer’s rule</b> when you have several loops.</li><li><b>Thevenin</b> to shrink a part of the circuit.</li><li>A <b>T-equivalent</b> circuit for coupled inductors. If the dots are on <b>opposite</b> sides, replace each M with −M.</li></ul>' +
  '<p>Finish with a partial-fraction inverse.</p>',
  a: 'Choose the simplest way to solve the pipe network, then translate back.' },
 { t: 'Cramer’s rule', h:
  '<p>For two equations a<sub>1</sub>x + b<sub>1</sub>y = c<sub>1</sub> and a<sub>2</sub>x + b<sub>2</sub>y = c<sub>2</sub>:</p>' + F('det = a₁b₂ − a₂b₁,   x = (c₁b₂ − c₂b₁) ÷ det,   y = (a₁c₂ − a₂c₁) ÷ det') +
  EX('Example', '3x + 3y = 9 and 4x + 2y = 8. det = 3·2 − 3·4 = −6. y = (3·8 − 4·9) ÷ (−6) = (24 − 36) ÷ (−6) = <b>2</b>.'),
  a: 'A fixed recipe of cross-multiplying that always gives the answer for a pair of loops.' },
 { t: 'Starting values and the t = 0 check', h:
  '<p>Before a switch moves at t = 0, find the circuit’s steady state. Inductors act like wires then, so the starting currents are just DC values.</p>' +
  EX('Example', '60 V across 9 Ω + 4 Ω in series: i<sub>1</sub>(0) = 60 ÷ 13 = <b>4.62 A</b>.') +
  '<p>After you invert, <b>always check the answer at t = 0⁺</b>. For i₂(t) = 7 − 8.4e<sup>−2t</sup> + 1.4e<sup>−12t</sup>: i₂(0⁺) = 7 − 8.4 + 1.4 = 0, which matches a loop that started with zero current.</p>' +
  EX('Evaluate', 'At t = 0.1 s: 7 − 8.4e<sup>−0.2</sup> + 1.4e<sup>−1.2</sup> = 7 − 6.877 + 0.422 = <b>0.544 A</b>. As t grows it settles to 7 A.'),
  a: 'A quick sanity check at the moment the valve first opens tells you if the translation back was right.' }
]);

LEARN(15, 'Signals and Systems', [
 { t: 'A circuit is a system', h:
  '<p>A <b>system</b> takes an <b>input</b> signal x(t) and produces an <b>output</b> signal y(t). A circuit is a system: a source goes in, a voltage or current comes out.</p>' +
  '<p>The nicest systems are <b>LTI</b>: <b>L</b>inear and <b>T</b>ime-<b>I</b>nvariant. For these, one function describes everything.</p>',
  a: 'Water goes into the machine and something else comes out. The machine is the system.' },
 { t: 'Linear and time-invariant', h:
  '<p><b>Linear</b>: superposition works. Scaling and adding inputs scales and adds outputs.</p>' + F('S{ a·x₁ + b·x₂ } = a·y₁ + b·y₂') +
  '<p>Squaring, absolute value and adding a constant offset all break linearity.</p>' +
  '<p><b>Time invariant</b>: a delayed input gives the same output, just delayed. For y = t · x(t), a delay also changes the amplitude, so it fails.</p>' +
  EX('Example', 'y = x/2 scales its input (linear) and does not care when the input arrives (time invariant). It is LTI.'),
  a: 'Double the water, double the output. Start the water later, get the same output later.' },
 { t: 'The impulse response', h:
  '<p>The <b>impulse response</b> h(t) is the output when the input is an impulse δ(t), starting from rest.</p>' + F('h(t) = T{ δ(t) }') +
  '<p>For an LTI system, h(t) describes the whole circuit.</p>' +
  EX('Example', 'A series RLC circuit has h(t) = ⅔ (e<sup>−t/2</sup> − e<sup>−2t</sup>) u(t). At t = 1 s: ⅔ (0.6065 − 0.1353) = <b>0.314</b>.'),
  a: 'Hit the pipe once with the hammer. How the sound rings out tells you everything about the pipe.' }
]);

LEARN(16, 'Convolution', [
 { t: 'Why convolution works', h:
  '<p>If the system is LTI and starts with <b>no initial energy</b>, any input can be seen as a stream of tiny impulses. Each impulse produces a delayed, scaled copy of h(t). Adding them all up is the <b>convolution integral</b>:</p>' + F('y(t) = x(t) * h(t) = ∫ x(τ) h(t − τ) dτ'),
  a: 'A long flow is just a stream of tiny hammer blows. The machine rings once for each, and the ringing adds up.' },
 { t: 'The shortcut: multiply in s', h:
  '<p>The convolution integral is tedious. The <b>convolution theorem</b> says that, with no initial energy, convolution in time is multiplication in the s-domain.</p>' + F('Y(s) = X(s) · H(s)') +
  EX('Example', 'x(t) = e<sup>−t</sup>u(t) and h(t) = e<sup>−2t</sup>u(t). X(s)H(s) = 1 ÷ ((s + 1)(s + 2)) = 1/(s + 1) − 1/(s + 2). So y(t) = e<sup>−t</sup> − e<sup>−2t</sup>. At t = 2 s: 0.1353 − 0.0183 = <b>0.117</b>.'),
  a: 'Instead of adding up every ring, multiply the two translations and translate back.' },
 { t: 'Graphical convolution', h:
  '<p>For pulse-shaped signals, convolve graphically: flip h, slide it across x, and find the overlap area at each position. Each time an edge of one function crosses an edge of the other, a <b>new case</b> starts.</p>' +
  '<p>Steps: flip h(τ) to h(−τ), shift it by t, find where the two overlap, integrate the product over the overlap, then repeat for each range of t.</p>' +
  EX('Example', 'x(t) = e<sup>t</sup> from t = 1 to 3, h(t) a pulse of width 1. The overlap changes at t = 1, 2, 3, 4. The output is zero before 1 and after 4. For 2 ≤ t ≤ 3 the pulse is fully inside: y(t) = ∫ e<sup>τ</sup> dτ from t − 1 to t = e<sup>t</sup> − e<sup>t−1</sup>. At t = 2: e² − e = 7.389 − 2.718 = <b>4.67</b>.'),
  a: 'Slide a window along the long flow and measure what is under the window at each step.' }
]);

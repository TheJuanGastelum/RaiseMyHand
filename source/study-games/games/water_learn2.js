LEARN(9, 'Measuring Voltage and Current', [
 { t: 'Meters and how to connect them', h:
  '<p>A <b>voltmeter</b> measures the voltage <i>across</i> a part, so you connect it <b>in parallel</b> with that part. A good voltmeter draws almost no current, so an ideal one has <b>infinite resistance</b>.</p>' +
  '<p>An <b>ammeter</b> measures the current <i>through</i> a part, so you connect it <b>in series</b>, in the path of the current. A good ammeter drops almost no voltage, so an ideal one has <b>zero resistance</b>.</p>' +
  '<p>Real analog meters use a small coil (a d’Arsonval movement). It has an internal resistance R_m and a full-scale current i_m, the current that swings the needle all the way.</p>' + F('R_m = v_m / i_m') +
  EX('Example', 'A movement that reads full scale at 163 mV and 1 mA has R_m = 0.163 V / 0.001 A = <b>163 Ω</b>.') +
  TRAP('A real voltmeter with finite resistance sits in parallel with the part and pulls the reading down. This is called loading.'),
  a: 'A pressure gauge taps across a pipe and should take no water. A flow meter sits in the pipe and should not squeeze it.' },
 { t: 'Making a bigger voltmeter or ammeter', h:
  '<p><b>Bigger voltage range:</b> add a resistor R_v <b>in series</b> with the movement so that only i_m flows at the new full-scale voltage V:</p>' + F('R_v = V / i_m − R_m') +
  EX('Example', 'Movement 1 mA, 100 Ω, want 10 V full scale. Total resistance = 10 V / 1 mA = 10,000 Ω. Subtract 100 Ω: R_v = <b>9,900 Ω</b>.') +
  '<p><b>Bigger current range:</b> add a <b>shunt</b> resistor R_A <b>in parallel</b> with the movement. Most of the current goes through the shunt. The movement and shunt share the same voltage (v_m = i_m × R_m).</p>' + F('R_A = v_m / (I − i_m)') +
  EX('Example', 'Movement 100 mV and 2 mA. To read 50 mA full scale, the shunt carries 48 mA at 0.1 V: R_A = 0.1/0.048 = <b>2.08 Ω</b>.'),
  a: 'To read bigger flow, add a bypass pipe beside the meter so most of the water goes around it.' },
 { t: 'What a meter really reads', h:
  '<p>When a voltmeter with resistance R_V is placed across a resistor R, they are in parallel. Combine them first, then use the divider formula to find what the meter reads.</p>' +
  EX('Example', '10 V source, two 10 kΩ resistors in series, a 20 kΩ voltmeter across the second. R ∥ R_V = 10 × 20 / 30 = 6.67 kΩ. Reading = 10 × 6.67/(10 + 6.67) = <b>4.0 V</b>, below the true 5 V.') +
  '<p>Shunt check: the largest current an ammeter reads is i_m plus the current in the shunt. Movement 1 mA, 100 Ω, shunt 5 Ω: the movement drops 0.1 V, the shunt carries 0.1/5 = 20 mA, total <b>21 mA</b>.</p>',
  a: 'The meter drinks a little water, so the reading is slightly off.' }
]);

LEARN(10, 'Node Voltage Analysis', [
 { t: 'Naming the pressure at every junction', h:
  '<p>A <b>node</b> is a point where parts join. An <b>essential node</b> is one where <b>three or more</b> parts join.</p>' +
  '<p>In <b>node voltage analysis (NVA)</b> you choose one node as the <b>reference</b> (0 V, like sea level). Every other essential node gets a voltage name. Then you write KCL at each of them.</p>' +
  '<p>If a circuit has N essential nodes, you write <b>N − 1</b> equations (the reference needs none).</p>' +
  '<p>The current from node A to node B through a resistor R is:</p>' + F('i = (v_A − v_B) / R'),
  a: 'Pick one junction as sea level. Give every other junction a pressure number. Flow goes from high pressure to low pressure.' },
 { t: 'Writing and solving KCL', h:
  '<p>At each node, add the currents leaving through every resistor and set the total equal to the sources.</p>' +
  EX('Example', 'A node v connects to a 10 V source through 2 Ω, to ground through 4 Ω, and has a 4 A source pushing in. KCL (currents leaving = currents arriving): (v − 10)/2 + v/4 = 4. Multiply by 4: 2v − 20 + v = 16, so 3v = 36 and <b>v = 12 V</b>.') +
  '<p>Steps: choose the reference, label the node voltages, write KCL at each essential node, solve, then compute whatever else you need (currents, power).</p>',
  a: 'At each junction the water in equals the water out.' },
 { t: 'A node held by a source', h:
  '<p>If a voltage source connects a node straight to the reference, that node’s voltage is simply known. You do not need a KCL equation for it. That saves work.</p>' +
  EX('Example', 'The middle node is held at 10 V by a source. It connects through 2 Ω to a right node with 3 Ω to ground and a 4 A source pushing in. KCL at the right node: (10 − v)/2 + 4 = v/3. Multiply by 6: 30 − 3v + 24 = 2v, so v = 54/5 = <b>10.8 V</b>.') +
  '<p>For several nodes, write the equations as a matrix <b>G·V = I</b>: G holds conductances (1/R), V the unknown voltages, I the source currents. Pick the reference at the node with the most sources attached to shorten the work.</p>',
  a: 'A pump that fixes the pressure at a junction means you already know that pressure.' }
]);

LEARN(11, 'Supernodes', [
 { t: 'A voltage source between two nodes', h:
  '<p>Sometimes a voltage source sits between two nodes and neither is the reference. The current through the source is unknown, so you cannot write KCL at either node on its own.</p>' +
  '<p>The fix is a <b>supernode</b>: draw one boundary around both nodes and the source. Write one KCL for the whole supernode (current leaving = 0). Then use the source as the second equation, the <b>constraint</b>:</p>' + F('v_A − v_B = V_s') +
  '<p>This works for dependent voltage sources too.</p>',
  a: 'A pump that holds a fixed pressure gap between two junctions ties them together. Circle both and balance the water into the whole circle.' },
 { t: 'Reading the constraint', h:
  '<p>Look at the source polarity. If the + terminal faces node A and the − terminal faces node B, then v_A is higher than v_B by the source value.</p>' +
  EX('Example', 'A 6 V source with + at node a and − at node b. Node b is at 2 V. Then v_a = 2 + 6 = <b>8 V</b>.') +
  '<p>When to use a supernode: a floating voltage source between two non-reference nodes. If the source is between a node and the reference, that node’s voltage is just known and no supernode is needed.</p>',
  a: 'The pump’s direction tells you which junction has the higher pressure.' },
 { t: 'Solving a supernode circuit', h:
  '<p>Steps: (1) box the supernode, (2) write KCL for the box, (3) write the constraint, (4) solve both equations.</p>' +
  EX('Example', 'Node a goes to ground through 2 Ω, node b through 4 Ω, a 2 V source has + at a, and a 6 A source pushes into node a. Constraint: v_a = v_b + 2. KCL on the box: v_a/2 + v_b/4 = 6. Substitute: (v_b + 2)/2 + v_b/4 = 6, so 0.75 v_b = 5, v_b = <b>6.67 V</b>.'),
  a: 'One flow balance for the circle, and the pump gives the extra rule.' }
]);

LEARN(12, 'Mesh Current Analysis', [
 { t: 'A stream around each loop', h:
  '<p>A <b>mesh</b> is a loop with no other loop inside it. In <b>mesh current analysis (MCA)</b>, you imagine a current going <b>clockwise</b> around each mesh. Then you write KVL around each mesh.</p>' +
  '<p>If a resistor is shared by two meshes, its current is the <b>difference</b> of the two mesh currents, because they run in opposite directions through it.</p>' + F('v across shared R = R · (i₁ − i₂)') +
  '<p>Number of meshes in a flat circuit: <b>branches − nodes + 1</b>.</p>',
  a: 'Picture a separate stream running clockwise around each loop. A pipe shared by two loops carries the difference of the two streams.' },
 { t: 'Writing the equations', h:
  '<p>For each mesh: add the resistor drops (own current times each resistor, plus the shared resistor times the difference) and set them equal to the source rises.</p>' +
  EX('Example', 'Mesh a: 1 V source, 3 Ω, and a shared 3 Ω. Mesh b: 6 Ω, a shared 3 Ω, and a 3 V source opposing. The equations are 6 i_a − 3 i_b = 1 and −3 i_a + 9 i_b = −3. Solving gives i_b = −1/3 A and <b>i_a = 0</b>.') +
  '<p>A negative answer just means the real current runs counter-clockwise.</p>',
  a: 'Each loop gets its own stream and its own pressure-lap rule.' },
 { t: 'A current source on the edge', h:
  '<p>If a current source is on an outside edge of a mesh (it belongs to only that one mesh), the mesh current is simply that source’s value. You get one answer for free and skip the KVL for that mesh.</p>' +
  EX('Example', 'Two meshes. The right mesh has a 2 A source on its outer edge, so i_b = 2 A (or −2 A, depending on its arrow). Only the left mesh needs a KVL equation.') +
  '<p>Elimination: 3 meshes with two known mesh currents leaves just one KVL equation to solve.</p>' +
  '<p>Mesh vs node: the mesh current equals the branch current only in a branch that belongs to one mesh.</p>',
  a: 'A flow pump on the outside pipe fixes the stream in that loop.' }
]);

LEARN(13, 'Supermeshes', [
 { t: 'A current source shared by two meshes', h:
  '<p>If a current source sits on the wall shared by two meshes, you do not know the voltage across it, so you cannot write KVL around either mesh alone.</p>' +
  '<p>Merge the two meshes into a <b>supermesh</b>. Write KVL around the outer edge of the merged loop, skipping the source branch. Then add one <b>constraint</b> equation from the source:</p>' + F('i₂ − i₁ = I_s') +
  '<p>The sign comes from which way the source arrow points.</p>',
  a: 'A flow pump on the shared pipe holds a fixed flow difference. Run the pressure lap around the outer edge and use the fixed flow as the extra rule.' },
 { t: 'The steps', h:
  '<ol><li>Spot the current source shared by two meshes.</li><li>Write the constraint (mesh current difference = source value).</li><li>Write KVL around the outside of the supermesh.</li><li>Write KVL for any other meshes.</li><li>Solve.</li></ol>' +
  EX('Example', 'Left mesh: 12 V source and 2 Ω. Right mesh: 4 Ω. A 3 A source on the shared wall gives i₂ = i₁ + 3. Supermesh KVL: 12 = 2 i₁ + 4 i₂. Substitute: 12 = 2 i₁ + 4 i₁ + 12, so i₁ = <b>0</b> and i₂ = 3 A.'),
  a: 'Merge the loops, lap the outside, and let the pump supply the second rule.' },
 { t: 'Which tool when', h:
  '<p>A quick map:</p><ul><li>Current source on an <b>outer</b> branch of one mesh: that mesh current equals the source. No supermesh.</li><li>Current source <b>shared</b> by two meshes: supermesh.</li><li>Voltage source between two non-reference nodes (in node analysis): supernode.</li></ul>' +
  '<p>The supermesh and the supernode solve the same kind of problem from opposite sides.</p>',
  a: 'A flow pump in the middle merges two loops. A pressure pump between two junctions merges those junctions.' }
]);

/* Teaching pages for CPU Quest, levels 15-22. */

LEARN(15, 'The 5-Stage Pipeline', [
 { t: 'Five stages', h:
  '<p>Pipelining chops the datapath into <b>5 stages</b>. Each instruction moves through them in order:</p>' +
  '<ol><li><b>IF</b> (instruction fetch): read the instruction from memory.</li><li><b>ID</b> (instruction decode): read registers and set the control signals.</li><li><b>EX</b> (execute): the ALU does its work or computes an address.</li><li><b>MEM</b>: read or write data memory (only lw and sw really use it, but every instruction still passes through).</li><li><b>WB</b> (write back): write the result into a register.</li></ol>',
  a: 'A five-station assembly line: fetch the order, read the parts list, assemble, move the car, and sign it off.' },
 { t: 'Five cars at once', h:
  '<p>While one instruction is in EX, the next is in ID and the one after is in IF. Up to 5 instructions are in flight, one per stage. Between the stages sit <b>pipeline registers</b> (IF/ID, ID/EX, EX/MEM, MEM/WB) that carry each instruction’s data and control signals along.</p>' +
  '<p>With no stalls, instruction number <b>n</b> starts in cycle n and finishes in cycle <b>n + 4</b>.</p>' +
  EX('Example', 'Instruction 3 starts in cycle 3 and finishes in cycle 3 + 4 = <b>7</b>.'),
  a: 'Five cars on the line at once, each at a different station. When the whistle blows, every car moves forward one station.' },
 { t: 'What pipelining does and does not do', h:
  '<p>Pipelining overlaps instructions. It does <b>not</b> make any single instruction faster: one still takes 5 cycles. What improves is <b>throughput</b>, how many finish per second.</p>' +
  F('total cycles = N + 4 (for N instructions, no stalls)') +
  EX('Example', '20 instructions, clock period 2 ns: (20 + 4) × 2 = <b>48 ns</b>. The first takes 5 cycles. Each later one adds just 1.') +
  TRAP('Latency (time for one instruction) stays the same. Throughput (instructions per second) goes up.'),
  a: 'The first car takes five whistles to come out. After that, a finished car rolls out every whistle.' }
]);

LEARN(16, 'Hazard Types: Structural, Data and Control', [
 { t: 'Three kinds of hazard', h:
  '<p>A <b>hazard</b> is a reason the next instruction cannot safely start in the next cycle.</p>' +
  '<ul><li><b>Structural</b>: two instructions need the same hardware resource at once.</li><li><b>Data</b>: an instruction needs a value that an earlier instruction has not produced yet.</li><li><b>Control</b>: the pipeline does not yet know which instruction comes next, because a branch has not been decided.</li></ul>',
  a: 'Three kinds of jam on the line: two cars need the same tool, a car needs a part that is not ready, or nobody knows which way the next car should go.' },
 { t: 'Data hazards: only RAW is real here', h:
  '<p>There are three data-hazard patterns, named by the order of the read (R) and write (W):</p>' +
  '<ul><li><b>RAW</b> (read after write): an instruction reads a register that an earlier one has not yet written. <b>This can happen.</b></li><li><b>WAR</b> (write after read) and <b>WAW</b> (write after write): <b>cannot</b> happen in this pipeline.</li></ul>' +
  '<p>Why: every instruction takes exactly 5 stages, reads in ID and writes in WB. An earlier instruction always reaches those stages first, so order is preserved.</p>' +
  EX('Spot the RAW', pre('add $8, $5, $5\nadd $2, $5, $8   ; reads $8 just written: RAW\nsub $3, $8, $4   ; reads $8: RAW')),
  a: 'Only one kind of data jam is possible on this line: a car asks for a part that the car ahead has not finished making.' },
 { t: 'Fixes and control hazards', h:
  '<p>Two ways to fix a RAW hazard:</p>' +
  '<ul><li><b>Insert nops</b> (empty instructions). They waste cycles every time.</li><li><b>Forwarding</b>: extra wiring that sends the value along early. It costs no cycles and is the real fix.</li></ul>' +
  '<p>A <b>control hazard</b> comes from a branch. <code>beq $1,$2,L1</code> is only decided when it reaches EX/MEM, but the pipeline already needed to fetch the next instruction 2 or 3 cycles earlier.</p>' +
  EX('Counting RAWs', 'Count every register read that depends on an earlier write. An instruction that reads two registers can contribute two RAWs.'),
  a: 'Waiting (nops) works but wastes time. Handing the part sideways (forwarding) is faster, and the fix for the branch jam comes in the next lessons.' }
]);

LEARN(17, 'Tracing RAW Hazards Cycle by Cycle', [
 { t: 'When is the value written, and when is it read?', h:
  '<p>An instruction <b>writes</b> its result in <b>WB</b> (stage 5) and the next instruction <b>reads</b> its operands in <b>ID</b> (stage 2). That is a timing question.</p>' +
  EX('Example', '<code>sub $2,$1,$3</code> writes $2 in cycle 5. An instruction right after it reads $2 in its ID, which is cycle 3. That read is <b>2 cycles too early</b>.') +
  '<p>An instruction 2 places after reads in cycle 4 (1 early). 3 places after reads in cycle 5 (same cycle as the write). 4 places after reads in cycle 6 (late enough).</p>',
  a: 'Trace each part tick by tick: when is it ready, and when does the next station reach for it?' },
 { t: 'The same-cycle trick', h:
  '<p>The register file <b>writes in the first half</b> of a clock cycle and <b>reads in the second half</b>. So a read in the same cycle as the write already sees the new value, with no extra hardware.</p>' +
  EX('Which instructions after sub $2,… (write in cycle 5) are fine without forwarding?', 'Reads in cycles 3 and 4: <b>too early</b>. Cycle 5: fine, thanks to the half-cycle trick. Cycle 6 and later: fine.') +
  '<p>With no stalls, instruction n finishes in cycle <b>n + 4</b>. For instruction 3 that is 7.</p>',
  a: 'The helper puts the new part in the tray at the start of the whistle. The next station checks the tray at the end of the same whistle, so it already sees it.' },
 { t: 'The load-use hazard and counting cycles', h:
  '<p>A <code>lw</code> only has its value at the end of MEM. If the very next instruction needs it in EX, even <b>forwarding cannot help</b>: the value does not exist yet. This is the <b>load-use hazard</b>. It always needs <b>one stall cycle</b>.</p>' +
  F('last instruction finishes in cycle = N + 4 + (number of load-use stalls)') +
  EX('Example', pre('add $1,$1,$1\nadd $1,$1,$1\nlw  $1,0($1)\nlw  $1,0($1)') + 'N = 4 gives cycle 8. The second lw reads $1 from the first lw right away: 1 load-use stall. Last finish: 8 + 1 = <b>9</b>.') +
  TRAP('A load-use stall is only counted when the instruction <b>immediately after</b> a lw reads the lw’s destination.'),
  a: 'You cannot hand over a part that is still being made. The next station has to wait one whistle.' }
]);

LEARN(18, 'Forwarding: the Hardware Fix', [
 { t: 'Sending the value sideways', h:
  '<p><b>Forwarding</b> sends a result straight from where it sits in the pipeline to the ALU input that needs it, without waiting for it to reach the register file.</p>' +
  '<p>A <b>forwarding unit</b> watches the EX/MEM and MEM/WB pipeline registers. If one holds the register the current instruction needs, it steers that value into the ALU input.</p>',
  a: 'A helper who watches the trays and hands each part to the next station directly, without going through the stockroom.' },
 { t: 'The two mux controls', h:
  '<p>Each ALU input has a mux. <b>A</b> controls the first input, <b>B</b> the second. Each can choose:</p>' +
  '<ul><li><b>0</b>: the register file (normal).</li><li><b>1</b>: EX/MEM (the result of the instruction one ahead). An <b>EX hazard</b>.</li><li><b>2</b>: MEM/WB (the result of the instruction two ahead). A <b>MEM hazard</b>.</li></ul>' +
  EX('Example', pre('add $1,$2,$3\nsub $4,$1,$5   ; $1 is the first operand, from EX/MEM: A = 1')),
  a: 'Three places to take a part from: the main stockroom, the tray right ahead, or the tray two ahead.' },
 { t: 'Two writers, loads and stores', h:
  '<p>If <b>both</b> EX/MEM and MEM/WB hold a value for the register you need, forward the <b>more recent</b> one (EX/MEM). Check the MEM hazard only if the EX hazard condition is false (an else-if).</p>' +
  EX('Example', pre('sub $2,$5,$1\nand $2,$2,$5\nor  $13,$6,$2   ; both earlier instructions wrote $2') + 'The or uses the value from the <b>and</b> (EX/MEM), not the older sub.') +
  EX('sw', '<code>add $1,$4,$5</code> then <code>sw $1,4($7)</code>. The sw stores $1 (its rt), so mux B takes it from EX/MEM: B = 1. The base register $7 is untouched: A = 0.') +
  '<p>Two hazards on two different operands do not conflict. The existing logic handles both at once.</p>',
  a: 'If two parts ahead have the right label, you take the newer one. A different part on each hand is no problem.' }
]);

LEARN(19, 'Hazard Detection: Stalling the One Case Forwarding Cannot Fix', [
 { t: 'Why forwarding falls short', h:
  '<p>Forwarding can route a value sideways, but it cannot hand over something that has <b>not been produced yet</b>.</p>' +
  '<p>A <code>lw</code> produces its value at the <b>end of MEM</b>. The next instruction wants it at the <b>start of EX</b>, one cycle too early. Only a one-cycle wait fixes it.</p>',
  a: 'You cannot pass on a part that has not come off the machine yet. The next station has to pause.' },
 { t: 'The hazard detection unit', h:
  '<p>A <b>hazard detection unit</b> in ID spots the load-use case. The condition: the instruction ahead (in EX) is a load, and its destination register is one the instruction in ID needs.</p>' +
  '<p>To stall for one cycle it does three things:</p>' +
  '<ul><li>Freeze the <b>PC</b> so the same instruction is fetched again.</li><li>Freeze <b>IF/ID</b> so the instruction in ID stays put.</li><li>Zero the control signals going into EX, which makes a <b>bubble</b>, a harmless nop.</li></ul>' +
  '<p>Instructions behind are delayed one cycle, but nothing is lost or re-fetched.</p>',
  a: 'The supervisor calls freeze for one whistle: the early stations hold, and an empty slot moves forward so nothing is damaged.' },
 { t: 'Hardware stall versus compiler nop', h:
  '<p>Both give the same effect, one wasted cycle.</p>' +
  '<ul><li><b>Compiler nop</b>: the compiler inserts a real nop instruction into the program. It makes the program longer.</li><li><b>Hardware stall</b>: the hardware makes the bubble itself. The program does not grow.</li></ul>' +
  EX('Counting', 'Four instructions with 1 load-use stall: 4 + 4 + 1 = <b>9</b>. Four lw in a row, each using the previous destination: 3 stalls, so 4 + 4 + 3 = <b>11</b>.') +
  F('finish cycle = N + 4 + stalls'),
  a: 'The same empty slot, but made by the supervisor on demand rather than written into every work order in advance.' }
]);

LEARN(20, 'Branch Hazards: Resolve Earlier', [
 { t: 'Where the branch is decided', h:
  '<p>Until a branch is decided, the pipeline keeps fetching the next instructions in order. If the branch turns out to be <b>taken</b>, those instructions are wrong and are thrown away as <b>bubbles</b>.</p>' +
  '<p>The later the decision, the more bubbles:</p>' +
  '<ul><li>Decided in <b>MEM</b>: <b>3</b> bubbles.</li><li>Decided in <b>EX</b>: <b>2</b> bubbles.</li><li>Decided in <b>ID</b>: <b>1</b> bubble.</li></ul>' +
  EX('Example', 'A loop’s branch is taken 10 times and is decided in MEM: 3 × 10 = <b>30</b> cycles lost.'),
  a: 'Check the ticket at the last gate and every wrong car must turn around from far down the line. Check at the first gate and only one car turns back.' },
 { t: 'Loops and the last iteration', h:
  '<p>A loop with <b>n</b> iterations usually branches back <b>n − 1</b> times. The last pass falls through, so the branch is not taken.</p>' + F('bubble cycles = (n − 1) × bubbles per taken branch') +
  EX('Example', '20 iterations, branch resolved in MEM: (20 − 1) × 3 = <b>57</b> cycles.'),
  a: 'Every time the loop sends cars back round, you pay the turn-around cost. The final pass does not turn around.' },
 { t: 'The catch with deciding in ID', h:
  '<p>If you decide in ID, the two registers being compared must already hold the right values. Nearby instructions can still be writing them.</p>' +
  '<ul><li>The value was written 3 or more instructions earlier: already in the register file, <b>0 stalls</b>.</li><li>An ALU instruction right before the branch: forward into ID, <b>1 stall</b>.</li><li>A <code>lw</code> <b>right before</b> the branch: <b>2 stalls</b>. Forwarding cannot help.</li><li>A <code>lw</code> with one instruction between: <b>1 stall</b>.</li></ul>' +
  EX('Example', pre('lw  $1, 0($5)\nbeq $1, $4, L   ; lw immediately before') + '2 stall cycles.') +
  EX('Example', pre('add $1,...\nadd $4,...\nsub $3,...\nbeq $1,$4,L') + '$1 and $4 were written long enough ago: <b>0 stalls</b>.'),
  a: 'Deciding early means you must be sure the ticket is already ready. If the last part has not been made yet, the gate keeper has to wait.' }
]);

LEARN(21, 'Branch Delay Slots and Jump Hazards', [
 { t: 'Filling the wasted slot', h:
  '<p>Even when a branch is decided in ID, a taken branch still wastes <b>1</b> cycle (the instruction fetched behind it is flushed).</p>' +
  '<p>A <b>branch delay slot</b> turns that wasted slot into useful work. The instruction right after the branch <b>always runs</b>, taken or not. The compiler finds an instruction that has to happen anyway and moves it there.</p>' +
  '<p>A <b>flag</b> in the branch tells the hardware: do not flush the slot.</p>',
  a: 'Put a job in the gap that has to happen either way, so no slot is scrapped.' },
 { t: 'What can go in the slot?', h:
  '<p>The slot runs whether or not the branch is taken. So the instruction you move in must:</p>' +
  '<ul><li>Not depend on the branch outcome.</li><li>Not change anything the branch itself compares.</li></ul>' +
  EX('Example', pre('add $4,$5,$6      ; independent of the branch\nbeq $1,$2,L') + 'The add does not touch $1 or $2, so it can be moved into the delay slot after the beq.') +
  EX('Counting', 'A loop’s branch is taken 10 times. With the slot filled, each taken branch wastes nothing: <b>10</b> cycles saved. A taken branch with a well-filled slot costs <b>0</b> wasted cycles.'),
  a: 'Only a job that does not depend on the ticket outcome can go in the gap.' },
 { t: 'Jumps are also resolved in ID', h:
  '<p><code>j</code>, <code>jal</code> and <code>jr</code> are all resolved in <b>ID</b>:</p>' +
  '<ul><li>The jump-target adder sits in ID.</li><li><code>jr</code> reads its register in ID.</li></ul>' +
  '<p>So only the one instruction fetched behind the jump is wrong. A jump costs <b>1 flushed cycle</b>.</p>' +
  EX('Example', '5 jumps at 1 flushed cycle each = <b>5</b> cycles lost.'),
  a: 'The last inspection of the line: stores, loads and jumps.' }
]);

LEARN(22, 'Hazard Practice: Loads, Stores and Jumps', [
 { t: 'Registers matter, not memory addresses', h:
  '<p>A pipeline hazard through registers only exists if an instruction <b>writes a register</b> that a later one reads.</p>' +
  EX('Store then load', pre('sw $t0,0($a0)\nlw $t1,0($a0)') + 'The sw writes no register, so there is no register dependency. Both touch the same memory word, but the store reaches memory first. <b>No hazard</b>.') +
  '<p>For a stall count: find where the value is <b>produced</b> (a load makes it at the end of MEM) and where it is <b>needed</b> (EX for ALU math and addresses, ID for a jump’s register). The gap is the stall.</p>',
  a: 'Only a part going through a bin can cause a jam. Two cars that just use the same warehouse shelf in the right order do not.' },
 { t: 'Loads feeding stores', h:
  '<p>A load followed by a store can be a load-use hazard, depending on which register the store uses.</p>' +
  EX('Data being stored', pre('lw $t0,0($a0)\nsw $t0,0($a1)') + 'The value goes through the EX-stage mux, so it needs a 1-cycle stall, then forwarding. <b>1 stall</b>.') +
  EX('Used as the address', pre('lw $t0,0($a0)\nsw $t1,4($t0)') + '$t0 is the base address, needed in EX to compute 4 + $t0. Same load-use case: <b>1 stall</b>.'),
  a: 'Whether the loaded part is the thing being stored or the address where it goes, the next station still needs it one whistle too early.' },
 { t: 'Jumps and the boss', h:
  '<p>A jump is known at the end of ID, so it costs <b>1 flushed</b> instruction (the one fetched in IF behind it).</p>' +
  '<p>Now combine with a load. <code>jr</code> needs its register in ID, but a <code>lw</code> only makes the value at the end of MEM.</p>' +
  EX('Boss pattern', pre('lw   $ra, 0($s0)\naddi $s0, $s0, 4\njr   $ra') + 'The lw is two ahead of the jr, but the jr wants $ra in ID, earlier than EX. The jr waits <b>1 stall</b>. Then, since it is a jump, the instruction fetched behind it is <b>flushed (1)</b>. Full forwarding cannot send a value that has not been produced yet.'),
  a: 'The gate needs the ticket before the part is finished. It waits a whistle, and then the one car that sneaked behind it is turned back.' }
]);

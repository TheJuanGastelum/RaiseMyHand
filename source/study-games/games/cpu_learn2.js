/* Teaching pages for CPU Quest, levels 9-14. */

LEARN(9, 'CPU Time and Amdahl’s Law', [
 { t: 'How long does a program take?', h:
  '<p>Three things decide how long a program runs:</p>' +
  '<ul><li><b>IC</b>: instruction count, how many instructions the program executes.</li><li><b>CPI</b>: average clock cycles per instruction.</li><li><b>Clock cycle time</b>: seconds per cycle. The clock rate is its inverse (1 GHz means 1 ns per cycle).</li></ul>' +
  F('CPU time = IC × CPI × clock cycle time = IC × CPI ÷ clock rate') +
  EX('Example', '2 billion instructions, CPI 1.5, on a 3 GHz clock: time = 2×10<sup>9</sup> × 1.5 ÷ 3×10<sup>9</sup> = <b>1 s</b>.') +
  '<p>Fewer instructions per loop pass lowers IC. That is why a loop that just increments a <b>pointer</b> usually beats one that rebuilds an array address every pass.</p>',
  a: 'Total time = number of orders × whistles per order × length of a whistle. Shrink any one of the three and the job finishes sooner.' },
 { t: 'Amdahl’s Law', h:
  '<p>Speeding up part of a program does not speed up the whole thing by the same amount. If a fraction <b>f</b> of the time is sped up by a factor <b>n</b>:</p>' + F('Speedup = 1 ÷ ( f/n + (1 − f) )') +
  EX('Example', 'f = 0.5, n = 2: Speedup = 1 ÷ (0.5/2 + 0.5) = 1 ÷ 0.75 = <b>1.33×</b>.') +
  EX('Which upgrade is better?', 'A: square root is 20% of time, made 10× faster: 1 ÷ (0.2/10 + 0.8) = 1.22×.<br>B: all floating point is 50% of time, made 2× faster: 1 ÷ (0.5/2 + 0.5) = <b>1.33×</b>. B wins.') +
  '<p>How much of the program you touch matters more than how much you speed up a small piece.</p>',
  a: 'If one slow step takes half the time, even an infinitely fast machine for the other half cannot make the job more than twice as fast.' },
 { t: 'The ceiling', h:
  '<p>Even if the sped-up part became <b>instant</b> (n → ∞), the untouched part (1 − f) remains. So the best you can ever get is:</p>' + F('maximum speedup = 1 ÷ (1 − f)') +
  EX('Example', 'A program is 80% parallelizable. With unlimited processors the best speedup is 1 ÷ (1 − 0.8) = 1 ÷ 0.2 = <b>5×</b>.') +
  TRAP('The serial part is a hard ceiling. At 95% parallel, the limit is 20×, no matter how many processors you buy.'),
  a: 'The part of the job you did not speed up is still waiting at the end of the line. It sets the minimum time.' }
]);

LEARN(10, 'CPI from Instruction Mix and the MIPS Trap', [
 { t: 'Why “MIPS” misleads', h:
  '<p><b>MIPS</b> here means “millions of instructions per second”. It sounds fair but it is a trap:</p>' +
  '<ul><li>Instructions do different amounts of work. One chip’s instruction may do what another needs three for.</li><li>The number changes from program to program on the same chip.</li></ul>' +
  '<p>A higher MIPS number does not mean a faster computer. The only reliable measure is <b>total time</b> on the same program.</p>',
  a: 'Orders per second sounds fair, but a factory that runs a thousand tiny orders per second may still finish the whole job later than one that does fewer big orders.' },
 { t: 'Averaging CPI by instruction mix', h:
  '<p>Different instruction types take different numbers of cycles. Weight each CPI by how often that type appears.</p>' + F('CPI = Σ ( CPI<sub>i</sub> × fraction of instructions of type i )') +
  EX('Example', 'ALU 50% at 1 cycle, Load/Store 30% at 2, Branch 20% at 3: CPI = 0.5×1 + 0.3×2 + 0.2×3 = 0.5 + 0.6 + 0.6 = <b>1.7</b>.') +
  EX('After an improvement', 'If stores drop from 2 cycles to 1: new CPI = (ALU 0.43×1) + (Load 0.21×1) + (Store 0.12×1) + (Branch 0.24×2) = 0.43 + 0.21 + 0.12 + 0.48 = <b>1.24</b>.'),
  a: 'Count the whistles each kind of order takes and weigh them by how often each kind comes in. That is the average.' },
 { t: 'Trade-offs: CPI versus clock', h:
  '<p>A change can lower CPI but slow the clock. Compare using the whole formula (IC stays the same here, so it cancels):</p>' + F('speedup = old CPI × old cycle time ÷ ( new CPI × new cycle time )') +
  EX('Example', 'CPI drops from 1.38 to 1.24 but the clock is 15% slower (cycle time × 1.15): speedup = 1.38 ÷ (1.24 × 1.15) = 1.38 ÷ 1.426 ≈ <b>0.97</b>. It is slightly <b>slower</b>.') +
  TRAP('A speedup below 1 means slower. Never judge CPI or clock speed by itself.'),
  a: 'Fewer whistles per order is not a win if each whistle now takes longer. Multiply them together before you decide.' }
]);

LEARN(11, 'From C to Machine Code', [
 { t: 'One word, three layouts', h:
  '<p>Every instruction becomes one 32-bit word. The two shapes you need now:</p>' +
  '<ul><li><b>R-type</b>: op (6) | rs (5) | rt (5) | rd (5) | shamt (5) | funct (6). Total 6+5+5+5+5+6 = <b>32</b>.</li><li><b>I-type</b>: op (6) | rs (5) | rt (5) | immediate (16).</li></ul>' +
  '<p>For R-type, the op is always <b>000000</b>. The real operation (add, sub, slt, …) is chosen by the 6-bit <b>funct</b> field at the far right.</p>',
  a: 'Each order is a barcode with 32 boxes. The boxes are grouped into labelled fields, and the scanner reads the same fields in the same places every time.' },
 { t: 'Loops and branch offsets', h:
  '<p>A <code>for</code> loop compiles to: body, update the counter, test with <code>slt</code>, and branch back while the test is true.</p>' +
  EX('for (i = 0; i < 3; i++) k = k + i + 1;', pre('      add  $t0,$zero,$zero   ; i = 0\nloop: add  $s0,$s0,$t0         ; k += i\n      addi $s0,$s0,1           ; k += 1\n      addi $t0,$t0,1           ; i++\n      slti $t1,$t0,3           ; t1 = (i < 3)\n      bne  $t1,$zero,loop      ; repeat while true')) +
  '<p>The branch’s 16-bit offset counts <b>instructions</b>, not bytes, relative to the next instruction. It is a <b>two’s complement</b> number, so a leading 1 means negative.</p>' +
  EX('Reading an offset', '1111111111111110 means −2 (all ones is −1, one less is −2). The branch goes back 2 instructions.'),
  a: 'A skip order says “go back two orders”, not “go to line 40”. The offset is how many places to move from here.' },
 { t: 'A real use: finding the best match', h:
  '<p>Video compression finds where a small window of pixels best matches a larger frame. One way to score a match is <b>SAD</b>, the sum of absolute differences:</p>' + F('SAD = |w1 − f1| + |w2 − f2| + … ') +
  EX('Example', 'Window: 10, 20, 30, 40. Frame region: 12, 18, 33, 40. Differences: 2 + 2 + 3 + 0 = <b>7</b>.') +
  '<p>The <b>lowest</b> SAD is the best match (0 would be a perfect match).</p>',
  a: 'Lay the stencil over each spot on the sheet. Count how far off each point is. The spot with the smallest total is where it fits best.' }
]);

LEARN(12, 'The Single-Cycle Datapath', [
 { t: 'The building blocks', h:
  '<p>The <b>datapath</b> is the set of parts an instruction travels through. A CPU is built from a few reusable blocks:</p>' +
  '<ul><li><b>PC</b>: holds the address of the current instruction.</li><li><b>Instruction memory</b>: gives back the instruction at that address.</li><li><b>Adder</b>: computes PC + 4 (the next instruction) and branch targets.</li><li><b>Register file</b>: the 32 registers. Two reads and one write.</li><li><b>Sign-extend</b>: turns a 16-bit immediate into a 32-bit number with the same value.</li><li><b>ALU</b>: does the arithmetic and logic.</li><li><b>Data memory</b>: for lw and sw.</li></ul>' +
  '<p>In a <b>single-cycle</b> design, each instruction starts and finishes within <b>one</b> clock cycle.</p>',
  a: 'The factory floor plan: stations, conveyor belts and bins laid out once. Every order uses the same floor plan.' },
 { t: 'Why sign-extend, and the PC adder', h:
  '<p>Immediates are 16 bits, but registers are 32 bits. <b>Sign-extend</b> copies the top bit into the new upper bits, so a negative number stays negative (−1 is 1111…1 in both).</p>' +
  EX('Example', '16-bit 1111111111111100 (−4) becomes 32-bit 11111111111111111111111111111100 (still −4).') +
  '<p>The adder next to the PC computes <b>PC + 4</b>, the next instruction in memory (each instruction is 4 bytes). A similar adder computes the branch target.</p>',
  a: 'A short barcode is padded so that the bigger machine still reads the same number.' },
 { t: 'Wiring lw and sw', h:
  '<p>Follow the data from block to block:</p>' +
  EX('lw', 'PC → instruction memory → register file (base register) and sign-extend (offset) → ALU (adds base + offset to get the address) → data memory (read) → back into the register file (write the loaded value).') +
  EX('sw', 'Same up to the ALU. The ALU gives the address. The register file’s <b>second</b> value is the data to store. It goes into data memory (write). Nothing is written back to a register.') +
  TRAP('A store writes memory and writes <b>no register</b>.'),
  a: 'A fetch order walks from the filing cabinet to the bins to the warehouse and brings a part back. A store order takes a part from the bin and leaves it in the warehouse with nothing coming back.' }
]);

LEARN(13, 'Control Signals and the ALU Controller', [
 { t: 'Switches on the datapath', h:
  '<p>The same datapath serves every instruction. <b>Control signals</b> are wires set to 0 or 1 that act like light switches:</p>' +
  '<ul><li><b>RegDst</b>: which field names the destination register.</li><li><b>ALUSrc</b>: is the ALU’s second input a register (0) or the immediate (1)?</li><li><b>MemtoReg</b>: write the ALU result (0) or the memory data (1)?</li><li><b>RegWrite</b>: write a register?</li><li><b>MemRead / MemWrite</b>: read / write data memory.</li><li><b>Branch</b>: this is a branch.</li><li><b>ALUOp</b>: a 2-bit hint to the ALU controller.</li></ul>' +
  '<p>An <b>x</b> means “don’t care”: that signal makes no difference for this instruction, so either value works.</p>',
  a: 'The foreman’s switch board: each order flips a particular set of switches to route the part through the stations it needs.' },
 { t: 'The signal table', h:
  '<p>Learn what each instruction needs:</p>' +
  EX('lw', 'RegDst 0, ALUSrc 1, MemtoReg 1, RegWrite 1, MemRead 1, MemWrite 0, Branch 0, ALUOp 00') +
  EX('sw', 'RegDst x, ALUSrc 1, MemtoReg x, RegWrite 0, MemRead 0, MemWrite 1, Branch 0, ALUOp 00') +
  EX('beq', 'RegDst x, ALUSrc 0, MemtoReg x, RegWrite 0, MemRead 0, MemWrite 0, Branch 1, ALUOp 01') +
  EX('R-format (add, sub, …)', 'RegDst 1, ALUSrc 0, MemtoReg 0, RegWrite 1, MemRead 0, MemWrite 0, Branch 0, ALUOp 10') +
  '<p>For sw, nothing is written to a register, so RegDst and MemtoReg are x.</p>',
  a: 'Every kind of order has its own pattern of switches. You can memorise four patterns.' },
 { t: 'ALUOp and what breaks when a wire sticks', h:
  '<p>The 2-bit <b>ALUOp</b> tells the ALU controller what to do:</p>' +
  '<ul><li><b>00</b>: add (lw and sw use the ALU to compute an address).</li><li><b>01</b>: subtract (beq subtracts to test for zero).</li><li><b>10</b>: look at the <b>funct</b> field (R-format: add, sub, slt, …).</li></ul>' +
  EX('Stuck-wire reasoning', 'If <b>RegWrite is stuck at 1</b>, sw and beq (which should write nothing) would overwrite some register with garbage.') +
  EX('Another one', 'beq needs ALUOp = 01. If ALUOp0 is stuck at 0, beq gets 00 (add) instead, and the zero-result test is wrong.'),
  a: 'If one switch jams in the “on” position, the orders that needed it off start doing things they were never meant to do.' }
]);

LEARN(14, 'Timing and the Critical Path', [
 { t: 'The slowest path sets the clock', h:
  '<p>A signal takes time to pass through each block. In a single-cycle design, the clock period must be long enough for the <b>slowest</b> instruction to finish. This longest path is the <b>critical path</b>.</p>' +
  '<p>Delays used in these problems: memory (instruction or data) <b>2 ns</b>, ALU and adders <b>2 ns</b>, register file read or write <b>1 ns</b>. Multiplexers, sign-extend and wires count as zero.</p>' +
  '<p>Because one slow instruction sets the clock for all of them, every other instruction spends part of each cycle waiting.</p>',
  a: 'The whistle must wait for the slowest job. Every job, even a quick one, waits for the whole whistle.' },
 { t: 'Adding up a path', h:
  '<p>Add the delays of the blocks the instruction passes through.</p>' +
  EX('lw', 'instruction memory 2 + register read 1 + ALU 2 + data memory 2 + register write 1 = <b>8 ns</b>.') +
  EX('R-type (add)', 'instruction memory 2 + register read 1 + ALU 2 + register write 1 = <b>6 ns</b>. No data memory.') +
  '<p>Since the clock is 8 ns, every add wastes 8 − 6 = <b>2 ns</b> each cycle.</p>',
  a: 'Add up the time at each station on the route. The longest route is the length of the whistle.' },
 { t: 'How pipelining shortens the clock', h:
  '<p>Split the datapath into stages. Now the clock only has to fit the <b>slowest stage</b>, not the whole path.</p>' +
  EX('Example', 'Single-cycle path: 1 + 1 + 1 + 2 + 1 = <b>6 ns</b>. Five stages (IF, ID, EX, MEM, WB) with those delays: the slowest stage is 2 ns, so the new clock period is 2 ns. The clock rate improves by 6 ÷ 2 = <b>3×</b>.') +
  TRAP('3× is a limit set by the unbalanced stages. Balanced stages would do better. And one instruction still needs several cycles. What gets faster is the stream of results.'),
  a: 'Cut the long job into five short steps on a line. The whistle now only has to fit the slowest step, and a finished car rolls out every whistle.' }
]);

/* Teaching pages for CPU Quest, levels 1-8. Each level has three lessons (warm-up, challenge, hard). They show before the questions. */
const F = x => '<div class="formula">' + x + '</div>';
const EX = (t, x) => '<div class="example"><b class="eh">' + t + '</b>' + x + '</div>';
const TRAP = x => '<div class="trap"><b class="eh">Watch out</b>' + x + '</div>';
const LEARN = (idx, topic, ls) => {
  const L = CPU_LEVELS[idx - 1];
  if (!L || L.topic !== topic) throw new Error('lesson/level mismatch at ' + idx + ': ' + (L && L.topic) + ' vs ' + topic);
  L.learn = { 1: ls[0], 2: ls[1], 3: ls[2] };
};

LEARN(1, 'Processor History and the Big Picture', [
 { t: 'Four chips that tell the story', h:
  '<p>A <b>processor</b> (CPU) is the chip that follows a program one instruction at a time. Four landmarks show how fast things changed:</p>' +
  '<ul><li><b>DYSEAC (1954)</b>: the first mobile computer. It was carried in <b>two tractor trailers</b>.</li>' +
  '<li><b>Intel 4004 (1971)</b>: the first microprocessor, a whole CPU on one chip with <b>2,300 transistors</b>.</li>' +
  '<li><b>Intel 8086 (1978)</b>: eight 16-bit registers. Its family name gave us the word <b>x86</b>.</li>' +
  '<li><b>Intel Core i7-8086K (2018)</b>: runs at up to <b>5 GHz</b>, forty years after the 8086.</li></ul>' +
  '<p>The order, oldest to newest: 1954, 1971, 1978, 2018.</p>' +
  EX('Today', 'The NVIDIA V100 graphics processor (GPU) has <b>21 billion transistors</b> and <b>5,120 cores</b> on one chip.'),
  a: 'The first factory filled two delivery trucks just to exist. Each new plant was smaller and could make more per hour.' },
 { t: 'Why chips shrank, and why we got many cores', h:
  '<p><b>Moore’s Law</b> is the observation that the number of transistors on a chip keeps growing, by roughly 35% a year, because transistors keep getting smaller.</p>' +
  '<p>Transistor size over time (the length of the smallest feature): <b>250 nm</b> (1997), 130, 65, 14, 7, then about <b>3 nm</b> around 2021.</p>' +
  '<p>To find how much it shrank, divide old by new:</p>' + F('shrink factor = old size ÷ new size') +
  EX('Example', 'From 130 nm to 65 nm: 130 ÷ 65 = <b>2×</b>. From 250 nm to 14 nm: 250 ÷ 14 ≈ <b>17.9×</b>.') +
  '<p>Once you can fit that many transistors, the best use is not one giant processor but <b>many cores</b> on the same chip. That is why phones, laptops and GPUs all have several.</p>',
  a: 'Each year the machines at the station get smaller, so the same floor space holds more of them. Instead of one huge worker, you hire many.' },
 { t: 'Three ways to look at a computer', h:
  '<p>This course studies the same machine from <b>three angles</b>:</p>' +
  '<ul><li><b>Compiler</b>: how code you write becomes machine language.</li>' +
  '<li><b>Software engineer</b>: writing programs that fit one specific piece of hardware.</li>' +
  '<li><b>Hardware architect</b>: designing the datapath and reasoning about performance. This is the main angle.</li></ul>' +
  '<p>What you will design is <b>one simple core</b>. A GPU with 5,120 cores is that same idea copied thousands of times (80 groups of 64 cores).</p>' +
  EX('Check yourself', '“How fast does it run if we change the design?” is a hardware architect question. “How does <code>x = y + z</code> turn into bits?” is a compiler question.'),
  a: 'You will learn to design one worker and one station. A giant plant is that same station repeated thousands of times.' }
]);

LEARN(2, 'Registers and the 3-Operand Rule', [
 { t: 'Registers: the 32 fast bins', h:
  '<p>An <b>ISA</b> (instruction set architecture) is the contract between software and hardware: the list of instructions the chip understands. The one we use is <b>MIPS</b>.</p>' +
  '<p>MIPS has <b>32 registers</b>. Each holds one <b>32-bit word</b>. Registers are the only place arithmetic can read from and write to. They have names and numbers:</p>' +
  '<ul><li><code>$zero</code> = register <b>0</b>. It always holds 0.</li><li><code>$v0–$v1</code> = 2–3: return values.</li><li><code>$a0–$a3</code> = 4–7: arguments.</li><li><code>$t0–$t7</code> = 8–15: temporaries.</li><li><code>$s0–$s7</code> = 16–23: saved.</li><li><code>$t8–$t9</code> = 24–25: more temporaries.</li><li><code>$sp</code> = <b>29</b>: stack pointer.</li><li><code>$ra</code> = <b>31</b>: return address.</li></ul>' +
  EX('Example', '<code>$s0</code> is 16 and <code>$s3</code> is 16 + 3 = <b>19</b>. <code>$t2</code> is 8 + 2 = <b>10</b>.'),
  a: 'Your station has 32 labelled parts bins, each holding one part. All the work happens on parts taken from these bins.' },
 { t: 'The 3-operand rule', h:
  '<p>MIPS is rigid on purpose: every arithmetic instruction has <b>exactly three operands</b>, and the <b>destination comes first</b>.</p>' + F('add rd, rs, rt      means      rd = rs + rt') +
  EX('Example', '<code>add $s0, $s1, $s2</code> puts $s1 + $s2 into $s0.') +
  '<p>Since an add only has two sources, adding three things takes two instructions.</p>' +
  EX('Example: a = b + c + d', pre('add a, b, c\nadd a, a, d')) +
  '<p>A bit more code buys much simpler hardware. That trade is a theme of the whole course.</p>',
  a: 'Every work order has exactly three lines: where to put the result, then the two bins to take parts from. A job with three inputs needs two work orders.' },
 { t: 'Temporary or saved?', h:
  '<p>Two registers can look identical but come with a promise:</p>' +
  '<ul><li><b>$t registers</b> are <b>temporary</b>. Any function may overwrite them freely.</li>' +
  '<li><b>$s registers</b> are <b>saved</b>. If a function wants to use one, it must save the old value first and <b>restore</b> it before returning.</li></ul>' +
  EX('Example', 'A function wants to use <code>$t0</code>, <code>$s0</code> and <code>$a0</code>. Only <b>$s0</b> must be saved and restored, because the caller expects its saved registers back unchanged.') +
  TRAP('Do not confuse the number with the group. “Register number” means the number (like 16 for $s0). “Register name” means the label.'),
  a: 'Scratch bins can be emptied by anyone. Reserved bins belong to the caller, so if you borrow one you must put the original part back.' }
]);

LEARN(3, 'Memory Operands: lw, sw and Byte Addressing', [
 { t: 'Memory is outside the registers', h:
  '<p>Registers are few. Big data (arrays, variables) lives in <b>memory</b>. The ALU only works on registers, so we move values with two instructions:</p>' +
  '<ul><li><code>lw</code> (load word): memory → register.</li><li><code>sw</code> (store word): register → memory.</li></ul>' +
  F('lw  $t0, offset($s2)      t0 = Memory[ $s2 + offset ]') +
  '<p>Memory is addressed by the <b>byte</b>, not the word. A 32-bit word is 4 bytes, so a word’s address is always a multiple of 4.</p>' +
  EX('Example', 'Can <code>g = h + A[3]</code> be done in one instruction? No. First <code>lw</code> A[3] into a register, then <code>add</code>.'),
  a: 'The warehouse across the lot is where big parts live. You cannot work on a part in the warehouse. You fetch it to a bin, work on it, and send it back.' },
 { t: 'Why array steps are 4 apart', h:
  '<p>Elements of an <code>int</code> array are 4 bytes each, so the next element is 4 bytes away, not 1.</p>' + F('address of A[k] = base + 4 × k') +
  EX('Example', 'Array A starts at byte 2000. A[5] is at 2000 + 4 × 5 = <b>2020</b>.') +
  '<p>Going the other way, an <b>offset in bytes</b> divided by 4 gives the element number.</p>' +
  EX('Example', '<code>lw $s1, 12($s2)</code> with $s2 holding A’s start loads element 12 ÷ 4 = <b>A[3]</b>.') +
  TRAP('The offset in <code>lw</code> is in <b>bytes</b>. Writing 3 would not give you A[3].'),
  a: 'Every part in the warehouse takes four slots on the shelf. To reach the 5th part, skip 5 × 4 slots.' },
 { t: 'Looking up a computed index', h:
  '<p>When the index is in a register (<code>A[k]</code>), the hardware cannot multiply for you inside <code>lw</code>. You build the address in three steps:</p>' +
  '<ol><li>Multiply the index by 4: <code>sll $t1, $a2, 2</code> (shifting left by 2 is ×4).</li><li>Add the base address: <code>add $t2, $t1, $a0</code>.</li><li>Load from that address: <code>lw $t3, 0($t2)</code>.</li></ol>' +
  EX('Example: f = A[B[k]]', 'Do the three steps for B[k] to get its value. Then do the three steps again using that value as the index into A. That is <b>6 instructions</b>.') +
  EX('Reading code', pre('lw $t0, 4($s0)\nlw $t1, 12($s0)\nadd $t2, $t0, $t1') + 'Offsets 4 and 12 mean A[1] and A[3]. $t2 = A[1] + A[3].'),
  a: 'To fetch the part named by a ticket: multiply the ticket number by four to find the shelf slot, add where the shelf starts, then go and get it. If the part itself is another ticket, repeat.' }
]);

LEARN(4, 'Bits and Immediates', [
 { t: 'Constants inside the instruction', h:
  '<p>An <b>immediate</b> is a constant written right inside the instruction. It saves a trip to memory.</p>' + F('addi rt, rs, imm      rt = rs + imm') +
  '<p>The immediate is a 16-bit <b>signed</b> number, so it can be negative. MIPS has no <code>subi</code>. To subtract a constant, add a negative one.</p>' +
  EX('Example', 'Subtract 1 from $s1 into $s2: <code>addi $s2, $s1, -1</code>.'),
  a: 'Some work orders have the number already printed on them, so nobody has to fetch it from a bin.' },
 { t: 'Shifting: multiply and divide by 2', h:
  '<p>Shifting moves all the bits sideways. Each step left <b>doubles</b> the number. Each step right <b>halves</b> it.</p>' +
  '<ul><li><code>sll rd, rt, n</code>: shift left logical = multiply by 2<sup>n</sup>.</li><li><code>srl rd, rt, n</code>: shift right logical = divide by 2<sup>n</sup>.</li></ul>' +
  EX('Example', '$t1 = 3. After <code>sll $t0, $t1, 2</code>, $t0 = 3 × 2² = <b>12</b>. In binary, 0011 shifted left twice is 1100.') +
  '<p>A shift is cheaper in hardware than an add, which is why array indexing uses <code>sll</code> to multiply by 4.</p>',
  a: 'A slide rule: slide the number one notch left and it doubles. Slide two notches and it quadruples.' },
 { t: 'and, or, nor: working bit by bit', h:
  '<p>These compare two numbers <b>one bit at a time</b>.</p>' +
  '<ul><li><code>and</code>: the result bit is 1 only if <b>both</b> are 1. Use it as a <b>mask</b> to keep some bits and clear the rest.</li><li><code>or</code>: 1 if <b>either</b> is 1. Use it to <b>set</b> bits without disturbing others.</li><li><code>nor</code>: NOT of or. Since MIPS has no <code>not</code>, use <code>nor rd, rs, $zero</code>, which flips every bit.</li></ul>' +
  EX('Example: and', '1100 <b>and</b> 1010 = 1000. In decimal, 12 and 10 = <b>8</b>.') +
  EX('Example: or', '1100 <b>or</b> 1010 = 1110. In decimal, 12 or 10 = <b>14</b>.') +
  EX('Example: NOT in 8 bits', 'v = 00001101 (13). nor with $zero flips every bit: 11110010 = 242, which is <b>255 − 13</b>.'),
  a: 'A stencil laid over a part lets only certain spots through (and). A stamp adds marks without touching the others (or). A flip switch turns every mark to its opposite (nor).' }
]);

LEARN(5, 'Branches and Instruction Formats', [
 { t: 'Making decisions', h:
  '<p>Normally the CPU runs instructions one after another. A <b>branch</b> changes that.</p>' +
  '<ul><li><code>beq rs, rt, Label</code>: branch to Label if rs <b>equals</b> rt.</li><li><code>bne rs, rt, Label</code>: branch if they are <b>not equal</b>.</li><li><code>j Label</code>: always jump.</li></ul>' +
  '<p>If the branch is not taken, the CPU just runs the next line. These three build every <code>if</code> and every loop.</p>' +
  EX('Example', '<code>beq $s1, $s2, L1</code> goes to L1 when $s1 and $s2 hold the same value.'),
  a: 'A skip-ahead work order says: if these two bins match, jump to order number X. Otherwise carry on with the next one.' },
 { t: 'Compiling if / else', h:
  '<p>Compilers write the test <b>inverted</b>: branch away when the condition is false, so the “then” block simply falls through.</p>' +
  EX('Example: if (i == j) f = g + h; else f = g − h;', pre('      bne $s3, $s4, Else\n      add $s0, $s1, $s2\n      j   Exit\nElse: sub $s0, $s1, $s2\nExit: ...') + 'The <code>j Exit</code> ends the “then” block so it skips the else block.') +
  '<p>Counting instructions run: if $s3 equals $s4, the bne is not taken, so <b>bne, add, j</b> run = 3. If they differ, the bne is taken and runs <b>bne, sub</b> = 2.</p>',
  a: 'To handle “if the tickets match, do A, otherwise B”, the order says: if they do NOT match, skip over A and go to B. After A, a jump skips over B.' },
 { t: 'The three instruction shapes', h:
  '<p>Every MIPS instruction is exactly <b>32 bits</b>, and it has one of three shapes. The first 6 bits are always the <b>op</b> code.</p>' +
  '<ul><li><b>R-type</b> (register math): op, rs, rt, rd, shamt, funct. Examples: add, sub, slt.</li><li><b>I-type</b> (immediate or memory): op, rs, rt, 16-bit constant or address. Examples: lw, sw, addi, beq, bne.</li><li><b>J-type</b> (jump): op, 26-bit address. Example: j.</li></ul>' +
  '<p>Because every instruction is the same width and shaped like one of three templates, the hardware can decode any of them quickly.</p>' +
  TRAP('<code>beq</code> and <code>bne</code> are I-type, not J-type. <code>j</code> is the only plain jump format here.'),
  a: 'All the barcode stickers are the same size. There are only three layouts for what is printed on them, so the scanner never has to guess.' }
]);

LEARN(6, 'Reverse-Engineer tomato()', [
 { t: 'What each kind of line is for', h:
  '<p>To read compiled code, sort each line into a job:</p>' +
  '<ul><li><b>Build an address</b>: <code>sll</code> (scale an index by 4) and <code>add</code> (add the base), or <code>addi</code> applied to an address.</li><li><b>Read memory</b>: <code>lw</code>.</li><li><b>Write memory</b>: <code>sw</code>.</li><li><b>Do math</b>: <code>add</code> on values.</li></ul>' +
  EX('Example', pre('sll $t0, $a2, 2    ; i × 4\nadd $t0, $a0, $t0  ; &amp;A[i]  (an address)') + 'After these two lines <code>$t0</code> holds the <b>address</b> of A[i], not a value.'),
  a: 'Some lines figure out which shelf to go to. Some fetch from the shelf. Some put something back. Some just combine parts.' },
 { t: 'Offsets are bytes: turn them into elements', h:
  '<p>Any constant added to a base address is in <b>bytes</b>. Divide by 4 to get how many elements away it is.</p>' + F('element offset = byte offset ÷ 4') +
  EX('Example', '$t0 holds &amp;A[i]. Then <code>lw $s0, 12($t0)</code> loads A[i + 12÷4] = <b>A[i+3]</b>. And <code>lw $s0, -8($t0)</code> loads <b>A[i−2]</b>.') +
  EX('Address arithmetic', '<code>addi $t2, $t0, -16</code> moves the address back 16 bytes = 4 elements. $t2 now holds <b>&amp;A[i−4]</b>, an address, not A[i−4] itself.'),
  a: 'The sheet says to go 12 slots further. Each part takes 4 slots, so that is 3 parts further down the shelf.' },
 { t: 'Writing the C line from the code', h:
  '<p>Follow it step by step and track what each register holds:</p>' +
  EX('Example', pre('sll  $t0,$a2,2     ; t0 = 4i\nadd  $t0,$a0,$t0   ; t0 = &amp;A[i]\nsll  $t1,$a3,2\nadd  $t1,$a1,$t1   ; t1 = &B[j]\nlw   $s0,12($t0)   ; s0 = A[i+3]\naddi $t2,$t0,-16   ; t2 = &amp;A[i-4]\nlw   $t0,4($t2)    ; t0 = A[i-4+1] = A[i-3]\nadd  $t0,$t0,$s0   ; t0 = A[i-3] + A[i+3]\nsw   $t0,8($t1)    ; B[j+2] = ...') + 'The whole thing is <b>B[j+2] = A[i-3] + A[i+3];</b>') +
  TRAP('Chained offsets add up. A −16 byte move (−4 elements) followed by a +4 byte load (+1 element) lands on A[i−3].'),
  a: 'Retrace the worker’s steps one at a time: where did he walk, what did he pick up, where did he put the result. The final note tells you the one-line order that made it.' }
]);

LEARN(7, 'Procedure Calls and the Stack', [
 { t: 'Calling and returning', h:
  '<p>A <b>procedure</b> (function) is a piece of code you jump to and then come back from. Two instructions make that work:</p>' +
  '<ul><li><code>jal Label</code> (jump and link): saves the address of the <b>next instruction</b> in <code>$ra</code>, then jumps to Label.</li><li><code>jr $ra</code> (jump register): copies $ra into the PC, so execution continues right after the original call.</li></ul>' +
  EX('Example', pre('jal  tomato   ; $ra = address of the next line\nadd  $s0,$v0,$zero  ; runs after tomato returns')),
  a: 'To send a job to a sub-assembly, leave a note saying where to come back to. When the sub-assembly finishes, it reads the note and returns there.' },
 { t: 'Why one $ra is not enough', h:
  '<p>There is only <b>one</b> <code>$ra</code>. If <code>main</code> calls <code>tomato</code>, which calls <code>potato</code>, the second <code>jal</code> overwrites main’s return address. Tomato can never find its way back.</p>' +
  '<p>The fix: before making a call, a function saves its own <code>$ra</code> in memory. That memory area is the <b>stack</b>.</p>' +
  '<p>The stack grows toward <b>lower addresses</b>. <code>$sp</code> points at the top.</p>' +
  TRAP('Only functions that <b>call others</b> need to save $ra. A function that never calls anything can leave it alone.'),
  a: 'If a sub-assembly sends its own job further down the line, its note would overwrite yours. So it first parks your note on a pile of trays.' },
 { t: 'Push and pop', h:
  '<p><b>Push</b> = make room, then store. <b>Pop</b> = load, then free the room. Each saved register is one 4-byte word.</p>' +
  EX('A function using $s0 that calls another function', pre('addi $sp,$sp,-8   ; make room\nsw   $ra,4($sp)\nsw   $s0,0($sp)\n   ...work, including the call...\nlw   $s0,0($sp)\nlw   $ra,4($sp)\naddi $sp,$sp,8    ; free the room\njr   $ra')) +
  '<p>Bytes to push: <b>4 × (number of saved registers) + 4 if you call another function</b> (for $ra).</p>' +
  EX('Stack pointer', '$sp = 2000. Pushing 3 words runs <code>addi $sp,$sp,-12</code>, so $sp = <b>1988</b>. After the matching pop it is back at 2000.'),
  a: 'Put notes on the pile before the job, take them back in reverse order after. When the pile is back to its original height, you are done.' }
]);

LEARN(8, 'Name That Function', [
 { t: 'Comparing with slt', h:
  '<p>MIPS can only branch on equal or not equal. To compare sizes it first makes a 0 or 1 with <b>slt</b> (set on less than):</p>' + F('slt rd, rs, rt      rd = 1 if rs < rt, else 0') +
  '<p><code>slti</code> compares with a constant. Then <code>beq</code> or <code>bne</code> with $zero branches on that 0 or 1.</p>' +
  EX('Example: a ≤ b', 'a ≤ b is the same as NOT (b &lt; a). So <code>slt $t0,$s1,$s0</code> (t0 = b &lt; a) and then <code>beq $t0,$zero,LtEq</code>: when t0 is 0, a ≤ b is true.'),
  a: 'To ask “which part is smaller?”, the checker stamps a 1 or a 0 on a card. Then the next order skips ahead depending on the card.' },
 { t: 'Reading short routines', h:
  '<p>Learn to recognise common patterns:</p>' +
  '<ul><li><b>Three xors in a row</b> swap two registers with no temporary.</li></ul>' +
  EX('XOR swap', pre('xor $t0,$t0,$t1\nxor $t1,$t0,$t1\nxor $t0,$t0,$t1') + 'Afterwards $t0 and $t1 have traded values. The first xor stores both in $t0, the second extracts the old $t0 into $t1, the third extracts the old $t1 into $t0.') +
  '<ul><li><b>Adding 1, 3, 5, … n terms</b> gives <b>n²</b>. For n = 4: 1 + 3 + 5 + 7 = 16.</li></ul>',
  a: 'Some station layouts are famous. Three identical swaps that trade two bins without a spare bin. A counter that adds the next odd number each time makes a perfect square.' },
 { t: 'Searching an array', h:
  '<p>A <b>linear search</b> checks each element in turn.</p>' +
  pre('loop: slt $t3,$t0,$a1     ; t3 = (i < size)\n      beq $t3,$0,exit    ; i reached the size: stop\n      ...load A[i], compare with 42...\n      ...found: return i...\n      addi $t0,$t0,1\n      j loop\nexit: addi $v0,$0,-1       ; not found') +
  '<p>If the value is not in the array, the loop runs until i reaches the size and returns <b>−1</b> as the “not found” signal.</p>' +
  TRAP('The slt tells you whether to <b>keep going</b>. When it becomes 0, you have run out of elements.'),
  a: 'Walk down the shelf checking each part. If you reach the end without finding it, write −1 on the form.' }
]);

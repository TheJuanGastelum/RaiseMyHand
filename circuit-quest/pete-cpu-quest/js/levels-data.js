// Pete's CPU Quest — level content, built from the ECE 369A lecture
// material (Lectures 1-12, 15-17) and the practice midterm exam.
//
// ===========================================================================
// LEVEL SCHEMA
// ===========================================================================
// {
//   id, order, lecture ("L3" etc.), world: "memory"|"debug"|"datapath"|"gauntlet",
//   title, concept: plain-English explanation shown ONLY when the player taps
//     the "?" button — keep it short, no assumed background,
//   puzzleType: "intro"|"match"|"memory-walk"|"stack-sim"|"wire-connect"|
//     "formula"|"numeric"|"gauntlet",
//   config: puzzle-type-specific (see each js/puzzle-*.js file's header),
// }
// ===========================================================================

window.PETE_LEVELS = [
  {
    id: "l1",
    order: 0,
    lecture: "L1",
    world: "memory",
    title: "Meet Pete",
    concept:
      "This course teaches how a computer actually works, from the instructions you write down to the circuit that runs them. No quiz here — just walk Pete over to the flag to get moving.",
    puzzleType: "intro",
    config: {},
  },

  {
    id: "l2",
    order: 1,
    lecture: "L2",
    world: "memory",
    title: "The Register File",
    concept:
      "MIPS has 32 numbered registers, and by convention each range is used for a specific job: $zero is always 0, $v0-$v1 hold return values, $a0-$a3 hold a function's arguments, $t0-$t7 are scratch space anyone can clobber, $s0-$s7 must be preserved across a call, $sp tracks the stack, $ra holds a return address.\n\nWhy each answer is what it is: $zero→0 and $ra→31 are the two registers with fixed, memorable numbers at the very ends of the file. $v0→2 and $a0→4 are the first register in their range ($v0-$v1 starts at 2, $a0-$a3 starts at 4). $t0→8 is the first temporary (8-15). $s0→16 is the first saved register (16-23). $sp→29 is just memorized — it's the second-to-last register, right before $ra. Knowing these cold is the foundation for everything else in the course.",
    puzzleType: "match",
    config: {
      mode: "slots",
      prompt: "Drag each register name onto the number it corresponds to.",
      slots: [
        { id: "0", label: "register 0" },
        { id: "2", label: "register 2" },
        { id: "4", label: "register 4" },
        { id: "8", label: "register 8" },
        { id: "16", label: "register 16" },
        { id: "29", label: "register 29" },
        { id: "31", label: "register 31" },
      ],
      chips: [
        { id: "zero", label: "$zero", correct: "0" },
        { id: "v0", label: "$v0", correct: "2" },
        { id: "a0", label: "$a0", correct: "4" },
        { id: "t0", label: "$t0", correct: "8" },
        { id: "s0", label: "$s0", correct: "16" },
        { id: "sp", label: "$sp", correct: "29" },
        { id: "ra", label: "$ra", correct: "31" },
      ],
    },
    hint: "$zero=0, $v0-v1=2-3, $a0-a3=4-7, $t0-t7=8-15, $s0-s7=16-23, $sp=29, $ra=31.",
  },

  {
    id: "l3",
    order: 2,
    lecture: "L3",
    world: "memory",
    title: "Byte Addresses, Word Steps",
    concept:
      "Memory addresses count bytes, not words — but every value you load or store is a 4-byte word. So array element A[i] sits at address (A's base) + 4×i, not + i. Forgetting the ×4 is the single most common array bug in this course.\n\nWhy A[3] is at 112: A starts at address 100. Element A[3] is 3 elements past the start, and each element is 4 bytes, so that's 100 + 3×4 = 100 + 12 = 112. A[0] would be 100 (0 elements past the start), A[1] would be 104, A[2] would be 108 — each step is +4, not +1.",
    puzzleType: "memory-walk",
    config: {
      arrayLabel: "Walk Pete to A[3]  (A starts at address 100)",
      startAddr: 100,
      count: 6,
      correctAddr: 112,
    },
    hint: "A[3] is at 100 + 3×4 = 112.",
  },

  {
    id: "l4",
    order: 3,
    lecture: "L4",
    world: "memory",
    title: "Shift Instead of Add",
    concept:
      "addi adds a constant without a separate load. sll shifts bits left — shifting left by 2 multiplies by 4, which is exactly the ×4 that array indexing needs, and it's cheaper in hardware than two add instructions. This is the same f=A[B[k]] example from Lecture 3, rewritten with sll.\n\nWhy each blank is what it is: both sll instructions are converting an array index into a byte offset, and that conversion is always ×4 — which in binary is the same as shifting left by 2 places (2² = 4), so both b1 and b2 are 2. The final lw reads straight from the address already computed in $t6 (which is exactly &A[B[k]]) — there's nothing left to add, so its offset (b3) is 0.",
    puzzleType: "match",
    config: {
      mode: "code",
      prompt: "Drag the correct value from the bank into each blank below.",
      codeLines: [
        "sll $t1, $a2, {{b1|shift amount}}    # t1 = k*4",
        "add $t2, $t1, $a1        # t2 = &B[k]",
        "lw  $t3, 0($t2)          # t3 = B[k]",
        "sll $t5, $t3, {{b2|shift amount}}    # t5 = B[k]*4",
        "add $t6, $t5, $a0        # t6 = &A[B[k]]",
        "lw  $s0, {{b3|byte offset}}($t6)      # s0 = A[B[k]]",
      ],
      chips: [
        { id: "c1", label: "2", correct: "b1" },
        { id: "c2", label: "2", correct: "b2" },
        { id: "c3", label: "0", correct: "b3" },
        { id: "c4", label: "4", correct: null },
        { id: "c5", label: "1", correct: null },
      ],
    },
    hint: "Multiplying by 4 is a left-shift by 2 (2^2=4). The second lw has no extra offset, so it's 0.",
  },

  {
    id: "l5a",
    order: 4,
    lecture: "L5",
    world: "memory",
    title: "Sort the Instruction Formats",
    concept:
      "Every MIPS instruction is 32 bits wide and fits one of 3 fixed shapes: R-type (register-only math, like add), I-type (an instruction with a 16-bit immediate or branch offset, like addi or lw), or J-type (a 26-bit jump address). That rigid shape is what lets hardware decode any instruction the same way.\n\nWhy each one belongs where it does: add, sub, and slt only ever operate on three registers — no immediate, no address — so they're R-type. lw, sw, addi, and beq all carry one extra 16-bit value (an address/offset or a constant) beyond their registers, which is exactly what the I-type format's extra field is for. j carries nothing but a destination address, which is what makes it J-type.",
    puzzleType: "match",
    config: {
      mode: "bins",
      prompt: "Drag each instruction into the bin for its format: R, I, or J.",
      bins: [
        { id: "R", label: "R-type" },
        { id: "I", label: "I-type" },
        { id: "J", label: "J-type" },
      ],
      chips: [
        { id: "add", label: "add", correct: "R" },
        { id: "sub", label: "sub", correct: "R" },
        { id: "slt", label: "slt", correct: "R" },
        { id: "lw", label: "lw", correct: "I" },
        { id: "sw", label: "sw", correct: "I" },
        { id: "addi", label: "addi", correct: "I" },
        { id: "beq", label: "beq", correct: "I" },
        { id: "j", label: "j", correct: "J" },
      ],
    },
    hint: "R-type: pure register math. I-type: has an immediate or branch offset. J-type: just an address.",
  },
  {
    id: "l5b",
    order: 5,
    lecture: "L5",
    world: "memory",
    title: "Reverse-Engineer tomato()",
    concept:
      "Reading assembly backward into C is the same skill as writing it forward: translate each instruction's byte offset back into an array index (divide by 4), then read off what's being computed.\n\nWhy B[j+2] = A[i-3] + A[i+3] is correct: $t0 = &A[i], and lw $s0,12($t0) reads 12 bytes past that — 12÷4 = 3 elements past A[i], so that's A[i+3]. $t2 = $t0-16 = &A[i-4] (16÷4 = 4 elements back), and lw $t0,4($t2) reads 4 bytes (1 element) past A[i-4], landing on A[i-3]. Those two values get added, then sw $t0,8($t1) stores the sum 8 bytes (2 elements) past &B[j], i.e. into B[j+2]. Every other option changes one of those offsets (wrong element) or the base being offset from, which is exactly what each wrong answer here tests whether you confused.",
    puzzleType: "match",
    config: {
      mode: "slots",
      slots: [{ id: "answer", label: "your answer" }],
      chips: [
        { id: "right", label: "B[j+2] = A[i-3] + A[i+3];", correct: "answer" },
        { id: "wrong1", label: "B[j+2] = A[i+3] + A[i+3];", correct: null },
        { id: "wrong2", label: "B[j] = A[i-3] + A[i+3];", correct: null },
        { id: "wrong3", label: "B[j+2] = A[i-4] + A[i+4];", correct: null },
      ],
      prompt:
        "tomato(int* A, int* B, int i, int j): A=$a0, B=$a1, i=$a2, j=$a3\n" +
        "sll  $t0,$a2,2       # t0 = 4i\n" +
        "add  $t0,$a0,$t0     # t0 = &A[i]\n" +
        "sll  $t1,$a3,2       # t1 = 4j\n" +
        "add  $t1,$a1,$t1     # t1 = &B[j]\n" +
        "lw   $s0,12($t0)     # s0 = A[i+3]   (12 bytes = 3 words)\n" +
        "addi $t2,$t0,-16     # t2 = &A[i-4]\n" +
        "lw   $t0,4($t2)      # t0 = A[i-3]   (4 bytes = 1 word past &A[i-4])\n" +
        "add  $t0,$t0,$s0     # t0 = A[i-3] + A[i+3]\n" +
        "sw   $t0,8($t1)      # B[j+2] = ...  (8 bytes = 2 words)\n\nWhat single line of C does this compute?",
    },
    hint: "Any constant offset in lw/sw is in bytes — divide by 4 to get the array-index offset.",
  },

  {
    id: "l6a",
    order: 6,
    lecture: "L6",
    world: "memory",
    title: "Nested Calls Need a Stack",
    concept:
      "jal saves the return address into $ra and jumps; jr $ra jumps back. There's only ONE $ra register — if main() calls tomato() (which sets $ra to return into main), and tomato() then calls potato(), potato()'s own jal overwrites $ra with the address back into tomato, destroying what main needed. The fix: push $ra onto the stack before making another call, pop it back right before returning.\n\nWhy the order is Push $ra, Push $s0, Pop $s0, Pop $ra: both need saving before tomato() does anything that could clobber them, so both get pushed on entry — $ra first here just because it's the one in danger from the upcoming call. The stack is last-in-first-out, so whatever went on last must come off first: $s0 (pushed last) is popped first, then $ra (pushed first) is popped last, right before jr $ra actually uses it to return.",
    puzzleType: "stack-sim",
    config: {
      actions: [
        { id: "push_ra", label: "Push $ra", kind: "push" },
        { id: "push_s0", label: "Push $s0", kind: "push" },
        { id: "pop_s0", label: "Pop $s0", kind: "pop" },
        { id: "pop_ra", label: "Pop $ra", kind: "pop" },
      ],
      correctSequence: ["push_ra", "push_s0", "pop_s0", "pop_ra"],
      prompt:
        "tomato() uses $s0 AND calls potato() (clobbering $ra). Push everything that needs saving on entry, then pop it all back in reverse order right before tomato() returns.",
    },
    hint: "Push $ra first (entry), then $s0. Pop in reverse: $s0 first, then $ra, right before jr $ra.",
  },
  {
    id: "l6b",
    order: 7,
    lecture: "L6",
    world: "memory",
    title: "Name That Function",
    concept:
      "slt gives you <, which combined with beq/bne builds every other comparison. Reading short MIPS snippets and recognizing the pattern (a swap, a sum, a search) is a core exam skill.\n\nWhy each snippet matches: snippet A is 3 XORs in a row between the same two registers — a XOR b XOR a always equals b, so each line toggles the pair until they've traded values, with no temp register needed. Snippet B counts down from n, adding 1 then 3 then 5... (the running total $t1 increases by 2 each loop) — that running sum of odd numbers 1+3+5+...+(2n-1) always equals n². Snippet C walks the array with a loop counter, loads each element, and compares it to 42 — stopping and returning the index the moment it matches (or -1 if the loop runs off the end) is exactly a linear search.",
    puzzleType: "match",
    config: {
      mode: "slots",
      prompt: "Read each code snippet below, then drag the description that matches what it actually does.",
      slots: [
        { id: "snipA", label: "xor $t0,$t0,$t1\nxor $t1,$t0,$t1\nxor $t0,$t0,$t1" },
        {
          id: "snipB",
          label:
            "addi $t0,$0,0\naddi $t1,$0,1\nloop: slti $t2,$a0,1\n bne $t2,$0,finish\n add $t0,$t0,$t1\n addi $t1,$t1,2\n addi $a0,$a0,-1\n j loop\nfinish: add $v0,$t0,$0",
        },
        {
          id: "snipC",
          label:
            "addi $t0,$0,0\naddi $t1,$0,42\nloop: slt $t3,$t0,$a1\n beq $t3,$0,exit\n sll $t2,$t0,2\n add $t2,$t2,$a0\n lw $t2,0($t2)\n beq $t2,$t1,done\n addi $t0,$t0,1\n j loop\ndone: jr $ra\nexit: addi $v0,$0,-1\n jr $ra",
        },
      ],
      chips: [
        { id: "swap", label: "Swaps $t0 and $t1 with no temp register", correct: "snipA" },
        { id: "sumodd", label: "Returns n² (sum of first n odd numbers)", correct: "snipB" },
        { id: "search", label: "Linear search for the value 42", correct: "snipC" },
      ],
    },
    hint: "a XOR b XOR a = b — three XORs in a row swap two values without a temp.",
  },

  {
    id: "l7",
    order: 8,
    lecture: "L7",
    world: "debug",
    title: "The CPU-Time Formula",
    concept:
      "CPU time = Instruction Count × Cycles Per Instruction × Clock Cycle Time. Every performance question in this course — comparing designs, judging a hardware change, computing speedup — is this same formula asked a different way.\n\nWhy the formula's blanks are IC, CPI, Clock Cycle Time (and not MIPS or Speedup): those two are separate metrics computed from this formula's result, not inputs to it — they don't belong in the formula itself. Why the number is 200,000ns: CPUtime = IC × CPI × cycle time = 50,000 × 2 × 2ns. 50,000 × 2 = 100,000 cycles total, and each cycle takes 2ns, so 100,000 × 2ns = 200,000ns.",
    puzzleType: "formula",
    config: {
      prompt:
        "Drag IC, CPI, and Clock Cycle Time into the formula's blanks. Then: a program runs 50,000 instructions at CPI=2, on a 2ns clock. Move the slider to the total CPU time.",
      formulaLines: ["CPUtime = {{a|term}} × {{b|term}} × {{c|term}}"],
      chips: [
        { id: "ic", label: "IC", correct: "a" },
        { id: "cpi", label: "CPI", correct: "b" },
        { id: "cct", label: "Clock Cycle Time", correct: "c" },
        { id: "mips", label: "MIPS", correct: null },
        { id: "speedup", label: "Speedup", correct: null },
      ],
      numeric: {
        min: 0,
        max: 400000,
        step: 1000,
        unit: "ns",
        answer: 200000,
        tolerance: 0.02,
      },
    },
    hint: "CPUtime = IC × CPI × cycle time = 50000 × 2 × 2ns.",
  },

  {
    id: "l8",
    order: 9,
    lecture: "L8",
    world: "debug",
    title: "Weighted-Average CPI",
    concept:
      "\"MIPS\" (millions of instructions/sec) is a misleading speed metric — it ignores that different instructions cost different numbers of cycles. The reliable move: weight each instruction type's cycle cost by how often it actually occurs (its share of the instruction mix), and add them up into one overall CPI.\n\nWhy the answer is 1.38: multiply each instruction type's share by its own cycle count, then add: ALU 0.43×1 = 0.43, Load 0.21×1 = 0.21, Store 0.12×2 = 0.24, Branch 0.24×2 = 0.48. Adding those four: 0.43+0.21+0.24+0.48 = 1.38. That's the weighted average — it's higher than the all-1-cycle types alone because Store and Branch cost 2 cycles and together make up over a third of the mix.",
    puzzleType: "numeric",
    config: {
      min: 0,
      max: 3,
      step: 0.01,
      unit: "cycles/instr",
      answer: 1.38,
      tolerance: 0.01,
      prompt:
        "Instruction mix: ALU 43% (1 cycle), Load 21% (1 cycle), Store 12% (2 cycles), Branch 24% (2 cycles).\nWhat is the overall CPI?",
    },
    hint: "CPI = 0.43(1) + 0.21(1) + 0.12(2) + 0.24(2).",
  },

  {
    id: "l9",
    order: 10,
    lecture: "L9",
    world: "debug",
    title: "Hand-Translate a Loop",
    concept:
      "Every MIPS instruction becomes one 32-bit pattern — and there are only 2 shapes it can take (R-type or I-type). Writing a short loop in assembly, by hand, is the bridge between \"code you write\" and \"bits the hardware reads.\"\n\nWhy each blank is what it is: the C code does k=k+i+1, and the add $t0,$t0,$t1 line already handles the \"+i\" part — so the next line only needs to add the remaining +1 (b1=1). Likewise i++ means add exactly 1 to $t1 (b2=1). The last line divides k by 2 for integer k/2 — shifting right by one bit throws away the low bit and halves the value, which is srl, not sll (which would double it) (b3=srl).",
    puzzleType: "match",
    config: {
      mode: "code",
      prompt: "Fill in the blanks to complete this loop (drag from the bank below).",
      codeLines: [
        "add   $t0,$zero,$zero    # k = 0",
        "add   $t1,$zero,$zero    # i = 0",
        "addi  $t2,$zero,3        # $t2 = 3",
        "loop: add $t0,$t0,$t1    # k = k + i",
        "addi  $t0,$t0,{{b1|value}}        # k = k + 1",
        "addi  $t1,$t1,{{b2|value}}        # i = i + 1",
        "slt   $t3,$t1,$t2        # t3 = (i < 3)",
        "bne   $t3,$zero,loop     # if (i<3) goto loop",
        "{{b3|shift op}}   $t0,$t0,1        # k = k / 2",
      ],
      chips: [
        { id: "c1", label: "1", correct: "b1" },
        { id: "c2", label: "1", correct: "b2" },
        { id: "c3", label: "srl", correct: "b3" },
        { id: "c4", label: "sll", correct: null },
        { id: "c5", label: "2", correct: null },
      ],
    },
    hint: "Shifting right by 1 bit divides by 2 (srl) — cheaper in hardware than a real divide.",
  },

  {
    id: "l10",
    order: 11,
    lecture: "L10",
    world: "datapath",
    title: "Wire the Datapath",
    concept:
      "A CPU is a handful of reusable building blocks wired together: the PC points at the current instruction, Instruction Memory hands it back, the Register File supplies operands, the ALU does the math, Data Memory serves lw/sw, and an Adder computes PC+4. Every instruction just flows through this same fixed wiring.\n\nWhy these 8 wires: PC feeds both Instruction Memory (to fetch the current instruction) and the Adder (to compute PC+4 for the next one) — that's every cycle, for every instruction. Once fetched, the instruction's register fields go to the Register File, and its immediate field goes to Sign-Extend. For lw specifically: the Register File's output feeds the ALU (base register), Sign-Extend's output also feeds the ALU (the offset), the ALU's sum (an address) feeds Data Memory, and what Data Memory reads back feeds into the Register File to be written — that's the full fetch → compute address → read memory → write back chain.",
    puzzleType: "wire-connect",
    config: {
      prompt: "Connect the components so data can flow correctly through a lw instruction (fetch → read register → compute address → read memory → write back).",
      w: 400,
      h: 200,
      nodes: [
        { id: "pc", label: "PC", x: 40, y: 100 },
        { id: "adder", label: "Adder (+4)", x: 40, y: 40 },
        { id: "imem", label: "Instr. Mem.", x: 130, y: 100 },
        { id: "regfile", label: "Reg. File", x: 220, y: 60 },
        { id: "alu", label: "ALU", x: 300, y: 100 },
        { id: "signext", label: "Sign-Extend", x: 220, y: 150 },
        { id: "dmem", label: "Data Mem.", x: 370, y: 100 },
      ],
      correctPairs: [
        ["pc", "imem"],
        ["pc", "adder"],
        ["imem", "regfile"],
        ["regfile", "alu"],
        ["imem", "signext"],
        ["signext", "alu"],
        ["alu", "dmem"],
        ["dmem", "regfile"],
      ],
    },
    hint: "Follow lw's path: PC → fetch → read base register → ALU adds the offset → read memory → write back to a register.",
  },

  {
    id: "l11",
    order: 12,
    lecture: "L11",
    world: "datapath",
    title: "Set the Control Signals for lw",
    concept:
      "The datapath has light-switch wires (RegDst, ALUSrc, MemtoReg, RegWrite, MemRead, MemWrite, Branch, ALUOp) that must be set exactly right per instruction.\n\nWhy each one is what it is for lw: it DOES write a register, so RegWrite=1; what it writes comes from memory, not the ALU, so MemtoReg=1; it does read memory, so MemRead=1, and it does NOT write memory, so MemWrite=0; its destination register is the rt field (not rd, which R-type uses), so RegDst=0; its second ALU input is the sign-extended immediate offset, not a register, so ALUSrc=1; it's not a branch, so Branch=0; and the ALU just needs to add (base + offset), which is the simplest ALUOp code, 00.",
    puzzleType: "match",
    config: {
      mode: "slots",
      prompt: "Drag each 0/1 (or 00) value onto the control signal it belongs to, for the lw instruction.",
      slots: [
        { id: "RegDst", label: "RegDst" },
        { id: "ALUSrc", label: "ALUSrc" },
        { id: "MemtoReg", label: "MemtoReg" },
        { id: "RegWrite", label: "RegWrite" },
        { id: "MemRead", label: "MemRead" },
        { id: "MemWrite", label: "MemWrite" },
        { id: "Branch", label: "Branch" },
        { id: "ALUOp", label: "ALUOp" },
      ],
      chips: [
        { id: "a", label: "0", correct: "RegDst" },
        { id: "b", label: "1", correct: "ALUSrc" },
        { id: "c", label: "1", correct: "MemtoReg" },
        { id: "d", label: "1", correct: "RegWrite" },
        { id: "e", label: "1", correct: "MemRead" },
        { id: "f", label: "0", correct: "MemWrite" },
        { id: "g", label: "0", correct: "Branch" },
        { id: "h", label: "00", correct: "ALUOp" },
      ],
    },
    hint: "lw: RegDst=0, ALUSrc=1, MemtoReg=1, RegWrite=1, MemRead=1, MemWrite=0, Branch=0, ALUOp=00.",
  },

  {
    id: "l12",
    order: 13,
    lecture: "L12",
    world: "datapath",
    title: "Find the Critical Path",
    concept:
      "A single-cycle clock must be slow enough for the SLOWEST instruction to finish completely, every cycle — even for simpler instructions that didn't need all that time. The rule: trace the longest chain of component delays any instruction needs, add them up, and that total is your minimum cycle time.\n\nWhy the answer is 8ns: lw's path touches 5 components in sequence — fetch the instruction (Memory, 2ns), read the base register (Register, 1ns), compute the address (ALU, 2ns), read the data at that address (Memory, 2ns), then write it into a register (Register, 1ns). Add every delay on that path: 2+1+2+2+1 = 8ns. Nothing runs in parallel here because each step needs the previous step's result.",
    puzzleType: "numeric",
    config: {
      min: 0,
      max: 15,
      step: 0.5,
      unit: "ns",
      answer: 8,
      tolerance: 0.01,
      prompt:
        "Delays: Memory = 2ns, ALU = 2ns, Register file access = 1ns.\n" +
        "lw's path: fetch instruction (Memory) → read base register (Register) → compute address (ALU) → read data (Memory) → write result (Register).\nMinimum cycle time?",
    },
    hint: "2 (instr. mem) + 1 (reg read) + 2 (ALU) + 2 (data mem) + 1 (reg write) = 8ns.",
  },

  {
    id: "l15",
    order: 14,
    lecture: "L15",
    world: "datapath",
    title: "The 5-Stage Staircase",
    concept:
      "Split the datapath into 5 stages (IF, ID, EX, MEM, WB) with a small register between each. Every cycle, one instruction finishes and a new one starts — up to 5 instructions are in flight at once, each one stage behind the previous. With no hazards, instruction n is in stage n during cycle n.\n\nWhy each instruction lands where it does during cycle 5: the 1st instruction (lw) entered the pipeline in cycle 1, so by cycle 5 it has advanced 4 extra stages past IF — IF(1)→ID(2)→EX(3)→MEM(4)→WB(5) — landing in WB. The 2nd instruction is always exactly one stage behind the 1st, so it's in MEM. The 3rd is one stage behind that, in EX. The 4th is in ID. The 5th instruction only just entered the pipeline this very cycle, so it's still in IF.",
    puzzleType: "match",
    config: {
      mode: "slots",
      slots: [
        { id: "IF", label: "IF (cycle 5)" },
        { id: "ID", label: "ID (cycle 5)" },
        { id: "EX", label: "EX (cycle 5)" },
        { id: "MEM", label: "MEM (cycle 5)" },
        { id: "WB", label: "WB (cycle 5)" },
      ],
      chips: [
        { id: "i1", label: "lw $10,20($1)", correct: "WB" },
        { id: "i2", label: "sub $2,$2,$3", correct: "MEM" },
        { id: "i3", label: "and $12,$3,$4", correct: "EX" },
        { id: "i4", label: "lw $13,24($1)", correct: "ID" },
        { id: "i5", label: "add $14,$5,$6", correct: "IF" },
      ],
      prompt: "These 5 instructions issue one per cycle, no hazards. Where is each one during cycle 5?",
    },
    hint: "Instruction n is in pipeline stage n during cycle n — the 1st instruction is in its 5th stage (WB) during cycle 5.",
  },

  {
    id: "l16",
    order: 15,
    lecture: "L16",
    world: "datapath",
    title: "Add the Forwarding Path",
    concept:
      "A data hazard happens when an instruction needs a value a still-in-flight instruction hasn't written yet. Forwarding fixes it without stalling: wire the value straight from where it already sits in the pipeline (e.g. the EX/MEM register) to wherever it's needed next, instead of waiting for the formal register-file write.\n\nWhy EX/MEM is the right source here: sub computes $2 in its EX stage, and that result is sitting in the EX/MEM pipeline register exactly one cycle later — which is precisely when and immediately needs it, in and's own EX stage. MEM/WB is one cycle too late (that's where the value would be the cycle AFTER this), and the Register File hasn't been written yet at all, so neither of those would deliver the value in time.",
    puzzleType: "wire-connect",
    config: {
      w: 360,
      h: 160,
      nodes: [
        { id: "exmem", label: "EX/MEM result", x: 80, y: 40 },
        { id: "memwb", label: "MEM/WB result", x: 80, y: 120 },
        { id: "aluA", label: "next ALU input", x: 280, y: 80 },
        { id: "regfile", label: "Register File", x: 280, y: 140 },
      ],
      correctPairs: [["exmem", "aluA"]],
      prompt: "sub $2,$1,$3   then immediately   and $12,$2,$5\n$2 is needed right away — wire the fastest available source to the next ALU input.",
    },
    hint: "The value sub just computed is sitting in EX/MEM one cycle before and needs it — forward from there, not from the slower MEM/WB or the register file.",
  },

  {
    id: "l17",
    order: 16,
    lecture: "L17",
    world: "datapath",
    title: "Stale or Correct?",
    concept:
      "Trace a real RAW hazard cycle by cycle. sub $2,$1,$3 writes $2 back in its WB stage (cycle 5). Any instruction reading $2 in ID before cycle 5 gets the stale old value (a real hazard); reading it in cycle 5 or later gets the correct value — cycle 5 exactly works because the register file writes in the first half of the clock cycle and reads in the second half of the SAME cycle.\n\nWhy each one is stale or correct: and reads $2 in cycle 3 and or reads it in cycle 4 — both are before cycle 5, so the write hasn't happened yet and they get the old, stale value. add reads $2 in cycle 5, the exact same cycle sub writes it — thanks to the write-first-half/read-second-half trick, that's correct, not stale. sw reads $2 in cycle 6, a full cycle after the write already landed, so it's also correct.",
    puzzleType: "match",
    config: {
      mode: "bins",
      bins: [
        { id: "stale", label: "Gets the STALE value" },
        { id: "correct", label: "Gets the CORRECT value" },
      ],
      chips: [
        { id: "and", label: "and $12,$2,$5  (reads $2 in cycle 3)", correct: "stale" },
        { id: "or", label: "or $13,$6,$2  (reads $2 in cycle 4)", correct: "stale" },
        { id: "add", label: "add $14,$2,$2  (reads $2 in cycle 5)", correct: "correct" },
        { id: "sw", label: "sw $15,100($2)  (reads $2 in cycle 6)", correct: "correct" },
      ],
      prompt:
        "No forwarding hardware in this scenario. sub $2,$1,$3 writes $2 back in cycle 5.\nSort each instruction below into the correct bin.",
    },
    hint: "Cycle 5 or later = correct (same-cycle write-then-read trick, or already written). Earlier = stale.",
  },

  {
    id: "gauntlet",
    order: 17,
    lecture: "Midterm",
    world: "gauntlet",
    title: "The Midterm Gauntlet",
    concept:
      "Straight from the real practice midterm — the train() function, a brand-new \"ece369\" instruction, and a full pipeline trace. IMPORTANT: Problem 3's pipeline trace assumes NO forwarding hardware — the compiler inserts nop bubbles instead. That's a different assumption than the Lecture 17 levels you just played, which assumed forwarding existed. Don't mix them up.\n\nWhy each part's answer is what it is:\n1a) $s0 starts at 12 and the loop keeps going while $s0<300, adding 4 each time — it runs for every multiple-of-4 value from 12 up to 296 inclusive, which is (296-12)/4+1 = 72 trips.\n1b) train() only uses $s0 and never calls another function, so only $s0 (4 bytes) needs saving — no $ra save needed since there's no nested call to clobber it.\n1c) Counting instructions from right after bne back to the fun: label gives 11 instructions to step back over, so the offset is -11.\n1d) Data-memory ops are about 46% of the runtime (f≈0.46); plugging f and the target 1.5× into Speedup=1/(f/n+(1-f)) and solving for n gives about 3.6×.\n2b) ece369 writes $sp (RegWrite=1) using an ALU-computed immediate subtraction (ALUSrc=1), reads the return address from memory (MemRead=1), writes nothing to memory (MemWrite=0), and gets its next PC from that memory read, not from PC+4 or a branch (PCSrc=Memory).\n2c) The path is Inst. Memory(3) + Register Read(2) + ALU(5) + Data Memory Read(6) + PC Write(2) = 18ns.\n3) With no forwarding, the compiler must insert nops so each instruction's register read lands no earlier than the cycle its dependency was written — tracing that through cycle 6 puts lw in WB, the first nop in MEM, addi in EX, sub in ID, and the second nop just entering IF.",
    puzzleType: "gauntlet",
    config: {
      parts: [
        {
          type: "numeric",
          title: "Part 1a — Loop Trip Count",
          prompt:
            "train(int* A,int* B,int* C,int k): $s0 starts at 12, loops while $s0 < $a3 (=k), adding 4 to $s0 each iteration.\nCalled as train(arr1,arr2,arr3,300) — how many times does the loop body execute?",
          config: { min: 0, max: 150, step: 1, unit: "times", answer: 72, tolerance: 0.001 },
        },
        {
          type: "numeric",
          title: "Part 1b — Stack Bytes Needed",
          prompt:
            "train() uses $s0 but never calls another function itself (no jal inside it).\nHow many bytes must it save on the stack to run safely, without corrupting the caller's data?",
          config: { min: 0, max: 16, step: 1, unit: "bytes", answer: 4, tolerance: 0.001 },
        },
        {
          type: "numeric",
          title: "Part 1c — Branch Offset Field",
          prompt:
            "\"bne $t5,$0,fun\" branches back to the loop's first instruction (sll $t4,$s0,2). Counting in words from the instruction right after bne back to fun, what value sits in the 16-bit offset field?",
          config: { min: -20, max: 0, step: 1, unit: "words", answer: -11, tolerance: 0.001 },
        },
        {
          type: "numeric",
          title: "Part 1d — Required Speedup (Amdahl's Law)",
          prompt:
            "Data-memory-access instructions (lw/sw) make up about 46% of train()'s total cycle time (f ≈ 0.46).\nSolving Speedup = 1/(f/n + (1−f)) for n: how much faster must JUST the data-memory operations get to reach an overall 1.5× speedup?",
          config: { min: 0, max: 10, step: 0.1, unit: "×", answer: 3.6, tolerance: 0.06 },
        },
        {
          type: "match",
          title: "Part 2b — The \"ece369\" Instruction's Control Signals",
          prompt:
            "ece369 $sp: R[$sp] = R[$sp]-4 ;  PC = Memory[R[$sp]-4]\n(it pops a return address off the stack and jumps to it — like jr, but reading the address from memory instead of a register, and moving $sp itself)\nDrag each value into the control signal it belongs to.",
          config: {
            mode: "slots",
            slots: [
              { id: "RegWrite", label: "RegWrite" },
              { id: "ALUSrc", label: "ALUSrc" },
              { id: "MemRead", label: "MemRead" },
              { id: "MemWrite", label: "MemWrite" },
              { id: "PCSrc", label: "PC comes from" },
            ],
            chips: [
              { id: "a", label: "1", correct: "RegWrite" },
              { id: "b", label: "1", correct: "ALUSrc" },
              { id: "c", label: "1", correct: "MemRead" },
              { id: "d", label: "0", correct: "MemWrite" },
              { id: "e", label: "Memory", correct: "PCSrc" },
              { id: "f", label: "0", correct: null },
              { id: "g", label: "PC+4", correct: null },
            ],
          },
        },
        {
          type: "numeric",
          title: "Part 2c — Critical Path for ece369",
          prompt:
            "Delays: Inst. Memory 3ns, Data Memory Read 6ns, ALU 5ns, Register Read 2ns, Register Write 3ns, PC Write 2ns.\nPath: fetch instruction → read $sp → ALU computes $sp-4 → read that memory address → write the new PC.\nMinimum cycle time?",
          config: { min: 0, max: 30, step: 1, unit: "ns", answer: 18, tolerance: 0.01 },
        },
        {
          type: "match",
          title: "Part 3 — Pipeline Snapshot, Cycle 6 (NO forwarding)",
          prompt:
            "add $3,$5,$6 / lw $2,4($2) / addi $5,$3,9 / sub $4,$2,$3 / add $2,$3,$4\n" +
            "The compiler inserts nop bubbles wherever a RAW hazard needs one (no forwarding hardware exists). Drag each instruction (or nop) into the stage it occupies during cycle 6.",
          config: {
            mode: "slots",
            slots: [
              { id: "IF", label: "IF" },
              { id: "ID", label: "ID" },
              { id: "EX", label: "EX" },
              { id: "MEM", label: "MEM" },
              { id: "WB", label: "WB" },
            ],
            chips: [
              { id: "lw", label: "lw $2,4($2)", correct: "WB" },
              { id: "nop1", label: "nop (after lw)", correct: "MEM" },
              { id: "addi", label: "addi $5,$3,9", correct: "EX" },
              { id: "sub", label: "sub $4,$2,$3", correct: "ID" },
              { id: "nop2", label: "nop (before final add)", correct: "IF" },
            ],
          },
        },
      ],
    },
  },
];

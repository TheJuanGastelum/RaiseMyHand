# Analogy mode content, one world per class. Short sentences, simple words.
# Each lecture: key (the idea), covers (one line), map (real thing -> analogy thing).

A369 = dict(
    name="a car factory",
    cast_title="The car factory in one glance",
    intro=("Think of a chip as a car factory. Work orders come in, and the factory builds something from each one."),
    cast=[
        ("CPU", "The whole factory."),
        ("Program", "A stack of work orders."),
        ("Instruction", "One work order."),
        ("ISA (MIPS)", "The catalog of jobs the factory can do."),
        ("Registers", "Parts bins at your station. Tiny and instant."),
        ("Memory", "The warehouse across the lot."),
        ("ALU", "The robot arm that welds, cuts and measures."),
        ("PC", "The clipboard showing which order is next."),
        ("Control unit", "The foreman telling each station what to do."),
        ("Clock", "The shift whistle. Everyone moves on each blast."),
        ("Datapath", "The factory floor plan and its conveyor belts."),
        ("Pipeline", "An assembly line with five stations."),
        ("Hazard", "A jam on the line. A part is not ready."),
        ("Cycle time", "Time between whistles."),
    ],
)
L369 = {}
L369[1] = dict(
    key="The first computers were like a factory that filled a whole warehouse. Then someone built a tiny workshop on a cart. Today's graphics chips are giant plants with thousands of workers. This class teaches you to design one good factory. Once you get one, the giant plants are just copies.",
    covers="How grading and labs work, plus a quick history of factories shrinking.",
    map=[("DYSEAC (1954)", "A factory that needed two trucks to move."), ("Intel 4004", "A workshop on a cart."), ("Modern GPU", "A plant with thousands of workers."), ("This class's MIPS core", "One simple, well-run factory.")],
)
L369[2] = dict(
    key="The ISA is the factory's job catalog. MIPS is strict: every work order has three lines. Line 1 says where the result goes. Lines 2 and 3 name the two parts bins to use. Workers only touch parts in the 32 bins at their station. Each bin has a job.",
    covers="The job catalog, the three-line order, and what each group of bins is for.",
    map=[("ISA", "The job catalog."), ("Register", "One parts bin."), ("<code>$a0</code>-<code>$a3</code>", "Bins for parts handed in."), ("<code>$t0</code>-<code>$t7</code>", "Scratch bins. Anyone can empty them."), ("<code>$s0</code>-<code>$s7</code>", "Borrowed bins. Put things back as you found them."), ("<code>$zero</code>", "A bin that always holds a zero."), ("<code>$ra</code>", "A note: where to go back to.")],
)
L369[3] = dict(
    key="Bins are small and fast. The warehouse is huge and far away. Workers can only build with parts in a bin. So <code>lw</code> means bring a part from the warehouse to a bin, and <code>sw</code> means send it back. A full part needs four warehouse slots in a row. So the next part is 4 slots over, not 1.",
    covers="Moving parts between the warehouse and the bins, and why parts sit 4 slots apart.",
    map=[("<code>lw</code>", "Bring a part from the warehouse to a bin."), ("<code>sw</code>", "Send a part back."), ("Byte", "One warehouse slot."), ("Word", "One full part. It takes 4 slots."), ("Address", "The slot number."), ("Index &times; 4", "How many slots to walk to part number k.")],
)
L369[4] = dict(
    key="<code>addi</code> is an order with the amount printed on it, so nobody walks to a bin to look it up. <code>sll</code> is the speed trick: slide the digits left. Sliding once doubles a number. Slide twice and you have multiplied by 4, exactly how far you walk down the warehouse shelf. <code>and</code>, <code>or</code> and <code>nor</code> work like stencils.",
    covers="Adding a number straight from the order, and the stencil-style bit tools.",
    map=[("<code>addi</code>", "An order with the number printed on it."), ("<code>sll</code>", "Slide digits left. Each slide doubles."), ("<code>srl</code>", "Slide digits right. Each slide halves."), ("<code>and</code>", "A switch stays on only if it is on in both bins."), ("<code>or</code>", "A switch stays on if it is on in either bin."), ("<code>nor</code> with <code>$zero</code>", "Flip every switch.")],
)
L369[5] = dict(
    key="Normally the factory works through orders top to bottom. A branch order says: if these two bins match, skip ahead to order X. That is all an if-statement or a loop is. <code>j</code> always skips. There are only three order forms. R names three bins. I names two bins and a number. J is just a destination.",
    covers="Skip-ahead orders, how if/else is built from them, and the three order forms.",
    map=[("<code>beq</code>", "If the bins match, skip to order X."), ("<code>bne</code>", "If they do not match, skip."), ("<code>j</code>", "Skip, no questions asked."), ("Label", "A bookmark on an order."), ("R / I / J type", "The three order forms.")],
)
L369[6] = dict(
    key="<code>slt</code> asks: is bin A smaller than bin B? It writes 1 for yes, 0 for no. <code>jal</code> means go build this sub-assembly, and leave a note saying where to come back. <code>$ra</code> is that note. If the sub-assembly starts another one, the new note covers the old one. The fix is the stack, a pile of trays. Park your note on the pile first, then take it back.",
    covers="Less-than checks, calling and returning, and why nested calls need a stack.",
    map=[("<code>slt</code>", "Is A smaller than B? Write 1 or 0."), ("<code>jal</code>", "Go build this, leave a note to return."), ("<code>jr $ra</code>", "Go back to the note."), ("Stack", "A pile of trays. Top only."), ("<code>$sp</code>", "A finger on the top tray."), ("Push / pop", "Add a tray / remove one.")],
)
L369[7] = dict(
    key="Two workers can do the same job differently. One recalculates the shelf spot every time (array). The other keeps a finger on the current shelf and slides it along (pointer). To compare factories fairly, count time: orders times ticks per order times length of one tick. Amdahl's Law is the reality check. If painting is 90% of the work, hiring 100 painters still leaves the other 10%.",
    covers="Array style versus pointer style, the CPU-time formula, and Amdahl's Law.",
    map=[("Instruction count", "How many orders."), ("CPI", "Whistle blasts per order."), ("Clock cycle time", "Time between blasts."), ("CPU time", "Total time for the whole stack."), ("Amdahl's Law", "The slow step you did not touch caps your speedup.")],
)
L369[8] = dict(
    key="Orders per second is not a fair way to compare factories. One makes bolts and another makes engines. Fair comparison uses average ticks per order, counted by how often each order type shows up. Then multiply by the tick length. A faster way to make one part sounds great. But if the whistle has to slow down 15%, every order gets slower and you lose.",
    covers="Why the MIPS speed number misleads, and how to average CPI from an order mix.",
    map=[("MIPS (the metric)", "Orders per second. Ignores order size."), ("Instruction mix", "How often each order type comes in."), ("Weighted CPI", "Average ticks per order."), ("Slower clock", "A longer tick that slows everything."), ("Speedup", "Old time divided by new time.")],
)
L369[9] = dict(
    key="Every order must end up in the one language the machines read: 32 ones and zeros. Think of three versions of one order. Plain English is C code. The shorthand on the ticket is assembly. The barcode the machines scan is machine code. The barcode has fixed boxes: which job, which bins, which number.",
    covers="Turning a small loop into assembly, then into bits, plus a Lab 3 preview.",
    map=[("C code", "The order in plain English."), ("Assembly", "Shorthand on the ticket."), ("Machine code", "The barcode."), ("<code>op</code> / <code>funct</code>", "Boxes for which job."), ("<code>rs</code> / <code>rt</code> / <code>rd</code>", "Boxes naming the bins."), ("SAD", "Add up how different two parts are.")],
)
L369[10] = dict(
    key="The datapath is the factory floor plan: a few standard stations joined by conveyor belts. There is the order board, a clipboard for the next order, the 32 bins, the robot arm, the warehouse, and a stretcher that widens a small number. Every order uses the same floor plan. Single-cycle means one worker finishes a whole order before the next starts.",
    covers="The stations one at a time, then the full floor plan.",
    map=[("Instruction memory", "The order board."), ("PC", "The clipboard."), ("Adder (+4)", "Moves the clipboard to the next order."), ("Register file", "The 32 bins."), ("ALU", "The robot arm."), ("Data memory", "The warehouse."), ("Sign-extend", "Widen a number to fit.")],
)
L369[11] = dict(
    key="The foreman (control unit) reads each order and flips a row of switches so every station does the right thing for that order. An add needs one pattern. A warehouse fetch needs another. The robot arm gets a two-step instruction: a rough hint from the foreman, then a helper reads the order's function box for the exact move.",
    covers="The switch table for each order type, the two-step ALU trick, and stuck switches.",
    map=[("Control unit", "The foreman."), ("Control signal", "One switch."), ("<code>RegDst</code>", "Which bin gets the result."), ("<code>ALUSrc</code>", "Second part from a bin or from the order."), ("<code>MemtoReg</code>", "Result from the arm or the warehouse."), ("<code>ALUOp</code>", "The foreman's rough hint."), ("Stuck-at fault", "A switch jammed on or off.")],
)
L369[12] = dict(
    key="In a single-cycle factory, the whistle blows at the same rate for every order. So it must be slow enough for the slowest one. A bolt takes seconds, an engine takes an hour, so every bolt waits an hour. To find the tick length, trace the longest path through the stations and add up the times. That path is the critical path.",
    covers="Adding up station times to find the shortest allowed tick.",
    map=[("Critical path", "The longest route through the stations."), ("Clock cycle time", "Time between whistles."), ("Component delay", "How long one station takes."), ("Pipelining (preview)", "Split the work so each tick is shorter.")],
)
L369[15] = dict(
    key="Turn the factory into an assembly line with five stations. Grab the order (IF). Read it and fetch parts (ID). Build (EX). Visit the warehouse (MEM). Drop the result in a bin (WB). Trays between stations hold the job for one tick. Now five cars are in progress at once. One car still takes five steps. But once the line is full, a finished car rolls out every tick.",
    covers="The five stations, the trays between them, and a timing example.",
    map=[("IF", "Grab the order."), ("ID", "Read it, fetch parts."), ("EX", "Build."), ("MEM", "Visit the warehouse."), ("WB", "Drop the result in a bin."), ("Pipeline register", "The tray between stations."), ("Latency", "One car start to finish. Does not shrink."), ("Throughput", "Cars finished per tick. Improves.")],
)
L369[16] = dict(
    key="An assembly line is only as good as its hand-offs. Three kinds of jam can happen. Structural: two stations need the same machine at once. Data: a station needs a part the one ahead has not finished. Control: an order says maybe switch models, but the line already started the next car. WAR and WAW jams cannot happen here. Everyone reads at station 2 and writes at station 5, in order.",
    covers="The three hazard types and which ones MIPS can actually have.",
    map=[("Structural hazard", "Two stations, one machine."), ("Data hazard (RAW)", "A part is not finished yet."), ("Control hazard", "Started the wrong car before the branch was decided."), ("WAR / WAW", "Cannot happen. No cutting in line."), ("<code>nop</code>", "A do-nothing slot that gives the part time.")],
)
L369[17] = dict(
    key="This is practice, and the question never changes. When is the part ready, and when does the next station need it? If it is needed first, someone waits. Bins refill at the start of a tick and get read at the end, so a same-tick hand-off still works. The nasty case is a part from the warehouse (<code>lw</code>). It arrives too late even for a sideways hand-off. One wait tick is unavoidable.",
    covers="Tracing a data jam tick by tick, and the load-use case.",
    map=[("RAW hazard", "Needs a part before it is made."), ("Stale value", "The old part still in the bin."), ("Write first half, read second half", "Refill at the start of a tick, read at the end."), ("Load-use hazard", "A warehouse part arrives too late."), ("Stall", "Everyone behind waits a tick.")],
)
L369[18] = dict(
    key="Instead of waiting for a finished part to reach a bin, the station ahead hands it sideways to the next station. A small helper watches the trays and decides where each part comes from: the bin (0), the tray just ahead (1), or the tray two ahead (2). If two trays hold the same part, take the freshest one. No waiting, and no do-nothing slots.",
    covers="How the forwarding helper picks 0, 1 or 2.",
    map=[("Forwarding unit", "A helper watching the trays."), ("Mux value 0", "Take it from the bin."), ("Mux value 1", "Take it from the tray just ahead."), ("Mux value 2", "Take it from the tray two ahead."), ("Priority rule", "The freshest wins.")],
)
L369[19] = dict(
    key="Passing sideways fixes almost everything, but not a warehouse part. It arrives one station too late, and you cannot hand over something that does not exist yet. So a supervisor (the hazard detection unit) watches for that case. When she spots it, she calls freeze for one tick. The order board stops, and an empty slot (a bubble) slides down the line.",
    covers="The one case forwarding cannot fix, and the one-tick freeze.",
    map=[("Hazard detection unit", "The supervisor."), ("Stall", "Freeze for one tick."), ("Bubble", "An empty slot on the line."), ("Compiler <code>nop</code>", "A permanent do-nothing order."), ("Hardware stall", "A pause only when needed.")],
)
L369[20] = dict(
    key="A branch order is a fork: maybe build model X instead. But the line already started the next car before anyone knew. The later you decide, the more wrong cars you scrap. Deciding at station 4 scraps 3. Station 3 scraps 2. Station 2 scraps 1. So decide early. The catch: the bins being compared must already be filled.",
    covers="Where a branch gets decided and what each choice costs.",
    map=[("Branch", "A fork in the line."), ("Flush", "Scrap a car started the wrong way."), ("Resolved in MEM / EX / ID", "Decide at station 4 / 3 / 2. Scrap 3 / 2 / 1."), ("Early compare", "New risk: the numbers may not be ready.")],
)
L369[21] = dict(
    key="When a branch is taken, the line normally scraps the one car it started behind it. That wastes a slot. A delay slot says: do not waste it. Put a job there that has to happen either way, like cleaning a machine. The planner (compiler) picks a job that does not depend on the branch. A flag tells the line not to scrap it.",
    covers="The delay slot trick and how jumps are handled.",
    map=[("Delay slot", "A slot used for a job needed either way."), ("Compiler's job", "Pick a job that does not depend on the branch."), ("Slot flag", "Tells the line not to scrap it."), ("Flush", "Scrapping the wrongly started car.")],
)
L369[22] = dict(
    key="Two questions answer everything. When is the part ready, and when does the next station need it? The gap is the number of waiting ticks. A store then a fetch from the same shelf is fine. A fetch then a store that needs it is a one-tick wait. A jump that needs a note fetched from the warehouse is worst: wait a tick, then scrap the car started behind the jump.",
    covers="Practice questions on loads, stores and jumps, answered.",
    map=[("Ready versus needed", "When the part arrives versus when it is wanted."), ("Stall", "Wait one tick."), ("Flush", "Scrap the wrong car."), ("<code>lw $ra</code> then <code>jr $ra</code>", "1 wait plus 1 scrap.")],
)
T369 = {
    "CPU time": "Total time to finish the whole stack of orders.",
    "CPI": "Whistle blasts one order needs, on average.",
    "Instruction mix": "How many of each order type are in the stack.",
    "Speedup": "Old time divided by new time. 2 means half the time.",
    "Amdahl's Law": "Speeding up one station only helps as much as its share of the work.",
    "Datapath": "The factory floor plan and its conveyor belts.",
    "Control signal": "One switch the foreman flips.",
    "MUX": "A track switch. It picks which belt gets through.",
    "Sign extension": "Widening a small number to fit a bigger label without changing its value.",
    "Single-cycle design": "One worker does a whole order before the next starts.",
    "Pipelining": "An assembly line: five cars in progress at once.",
    "Pipeline register": "The tray between two stations.",
    "Throughput": "Cars finished per tick.",
    "Latency": "How long one car takes start to finish.",
    "Critical path": "The longest route through the stations. It sets the tick length.",
    "Two's complement": "The way negative numbers are written with the same 32 switches.",
    "SAD": "A spot-the-difference score. Smaller means more alike.",
    "Hazard (pipeline)": "A jam on the line. The next order cannot safely start.",
    "Structural hazard": "Two stations need the same machine in the same tick.",
    "Data hazard": "A station needs a part the one ahead has not finished.",
    "Control hazard": "The line started a car before the branch was decided.",
    "Forwarding": "Hand the part sideways instead of waiting for the bin.",
    "Dependence": "True dependence: you need what someone else makes. The other two are just name clashes and break nothing here.",
    "Pipeline bubble": "An empty slot on the line.",
    "Load-use hazard": "A warehouse part arrives one station too late. One wait tick is unavoidable.",
    "Write-first-half": "Refill the bin at the start of a tick and read it at the end.",
}

A372 = dict(
    name="a smart house",
    cast_title="The smart house in one glance",
    intro="Think of the chip as the brain of a smart house. It runs lights, doors, sensors and a display, and it has to react to the doorbell on time.",
    cast=[
        ("Microcontroller", "The smart house's brain."),
        ("Pin", "One door or wall switch."),
        ("Input pin", "A doorbell button."),
        ("Output pin", "A lamp or a motor."),
        ("Register (SFR)", "A labeled switch on the control panel."),
        ("Timer", "An oven timer that counts on its own."),
        ("Interrupt", "The doorbell. It rings when something happens."),
        ("Polling", "Walking to the door every few seconds to look."),
        ("ISR", "What you do when the doorbell rings."),
        ("Flag bit", "A note card: someone rang."),
        ("PWM", "A dimmer switch. Flicker fast to fake in-between."),
        ("State machine", "A washing machine cycle. Always in one step."),
        ("LCD", "A sign board that reads notes through a mail slot."),
        ("Motor driver", "The power box for a garage door motor."),
    ],
)
L372 = {}
L372[1] = dict(
    key="An embedded system is the brain inside one gadget, like the brain in a smart oven. It does one job. There are three kinds of chip. One is wired for a single job and never changes (ASIC). One is a reprogrammable brain with fixed doors and switches (microcontroller, this class). One is a laptop brain that runs anything (CPU).",
    covers="What embedded means and the three kinds of chip.",
    map=[("ASIC", "A doorbell with one fixed ring. Never changes."), ("Microcontroller", "A smart-home brain you can reprogram."), ("General CPU", "A laptop. Runs any app."), ("Embedded", "A brain built into one gadget.")],
)
L372[2] = dict(
    key="The brain has two separate notebooks. One holds the instructions and never changes while running. The other holds notes that change constantly. A control panel of labeled switches runs the house. Those switches are SFRs, names like <code>DDRB</code> and <code>TCNT0</code>. Write to one and you flip a real switch.",
    covers="The memory map and what an SFR is.",
    map=[("Program Flash", "The instruction manual."), ("SRAM", "A whiteboard, wiped when the power goes out."), ("EEPROM", "A sticky note that stays."), ("SFR", "A labeled switch on the control panel."), ("Harvard design", "Two notebooks, read at the same time."), ("16 MHz clock", "A heartbeat: 16 million per second.")],
)
L372[3] = dict(
    key="Each pin needs three settings, like a door. <code>DDR</code>: is it a doorbell button (input) or a lamp (output)? <code>PORT</code>: if it is a lamp, on or off. If it is a button, add a spring. <code>PIN</code>: look and see what the door is actually doing right now.",
    covers="The three registers behind every pin.",
    map=[("<code>DDRx</code>", "Input or output."), ("<code>PORTx</code>", "On or off (or a spring)."), ("<code>PINx</code>", "What is really happening."), ("One bit", "One door. A port has 8.")],
)
L372[4] = dict(
    key="One register controls eight doors at once. If you write the whole register, you accidentally reset the other seven doors. So change one door at a time. OR turns it on. AND with NOT turns it off. XOR flips it. A shift picks which door.",
    covers="One-bit-at-a-time patterns.",
    map=[("<code>|= (1&lt;&lt;N)</code>", "Turn door N on, leave the rest."), ("<code>&amp;= ~(1&lt;&lt;N)</code>", "Turn door N off."), ("<code>^= (1&lt;&lt;N)</code>", "Flip door N."), ("Mask", "A stencil covering doors you do not want to touch."), ("Nibble", "Half a row: 4 doors.")],
)
L372[5] = dict(
    key="A pin with nothing connected is like a loose door swinging in the wind. It reads random things. A pull-up is a gentle spring that holds it shut (reads 1). Pressing the button pulls it open (reads 0). That is backwards from what you would guess. Polling means checking the door every so often. If someone rings and leaves while you are busy, you miss it.",
    covers="Pull-ups, active-low buttons, and how polling misses things.",
    map=[("Floating pin", "A loose door in the wind."), ("Pull-up", "A spring holding the door shut."), ("Active-low", "Pressed is 0. Not pressed is 1."), ("Polling", "Walking to the door to look."), ("Missed press", "Someone rang and left while you were busy.")],
)
L372[6] = dict(
    key="Timer0 is the oven timer inside the brain. It counts up by itself, forever. In Normal mode it always counts to 255, then starts over. In CTC mode you pick the number it counts to. Every timer shares the same 16 MHz heartbeat. The prescaler just slows how often it counts. Prescaler 000 means unplugged.",
    covers="Normal mode versus CTC mode and the Timer0 registers.",
    map=[("<code>TCNT0</code>", "The oven timer's display."), ("Normal mode", "Always counts to 255."), ("CTC mode", "Counts to the number you set."), ("Prescaler", "A gear that slows the counting."), ("Flag (TOV0 / OCF0A)", "The timer's ding."), ("CS bits = 000", "Timer unplugged.")],
)
L372[7] = dict(
    key="One formula turns I want this delay into put this number in the register. It is like turning bake 20 minutes into the timer's setting. Timer1 is the same idea with a bigger dial. It has 16 bits instead of 8, so it counts to 65,535 instead of 255. Longer delays fit in one pass.",
    covers="The delay formula and Timer1.",
    map=[("Delay formula", "Turns minutes into a dial setting."), ("Timer0 (8-bit)", "A small dial. Max 255."), ("Timer1 (16-bit)", "A big dial. Max 65,535."), ("High byte first", "Write the big digits before the small ones."), ("Loop + flag", "Set 1 minute and count the dings.")],
)
L372[8] = dict(
    key="Polling is walking to the door every few seconds. An interrupt is a doorbell. You keep doing chores and the bell tells you. But the bell only works if three things are on: the main breaker for bells (<code>sei</code>), that doorbell's own switch, and someone actually pressing it. PCINT is one bell that rings for any of 8 doors in a group, and it does not say which.",
    covers="The three switches and pin change interrupts.",
    map=[("Interrupt", "A doorbell."), ("ISR", "What you do when it rings."), ("<code>sei()</code>", "The main breaker for all bells."), ("<code>PCICR</code> / <code>PCMSK</code>", "This bell's group and door switches."), ("PCINT", "One bell for 8 doors."), ("<code>volatile</code>", "A note that may change while you are away. Re-read it.")],
)
L372[9] = dict(
    key="Same doorbell idea, now for the oven timer. Instead of checking its ding yourself, flip one switch (a bit in <code>TIMSK0</code>) and the oven rings the doorbell when it is done. Normal mode uses the overflow bell. CTC mode uses the compare-match bell. If you enable a bell but never write what to do when it rings, the house freezes.",
    covers="Which bit and which function name for each timer mode.",
    map=[("<code>TIMSK0</code>", "Connects the oven's ding to the doorbell."), ("<code>TOIE0</code> / OVF", "The overflow bell."), ("<code>OCIE0A</code> / COMPA", "The compare-match bell."), ("No ISR written", "The bell rings and nobody answers.")],
)
L372[10] = dict(
    key="A state machine is a washing machine cycle. It is always in exactly one step: fill, wash, rinse or spin. Certain events move it to the next step. A mechanical button is like a flickery doorbell. One push can ring 10 times. Debounce states pause briefly after each ring so the flicker settles.",
    covers="The three rules, enum and switch, and the four-state debounce cycle.",
    map=[("State", "The washer's current step."), ("Transition", "The event that moves to the next step."), ("Bounce", "A flickery doorbell button."), ("Debounce", "Wait a moment before trusting it."), ("enum + switch", "A list of step names and what to do in each.")],
)
L372[11] = dict(
    key="The LCD is a sign board with its own tiny brain. You never draw pixels. You slide it notes through a mail slot, four letters at a time, and knock (the Enable pulse). Slide too fast and it ignores you. No error, it just does not change. Waking it up needs an exact routine.",
    covers="The pins, 4-bit mode, and the startup routine.",
    map=[("RS", "Note type: text or command."), ("R/W", "Always write here."), ("E (Enable)", "The knock."), ("D4-D7", "The four-letter mail slot."), ("Delays", "Wait for the board to finish reading."), ("4-bit mode", "Send half a note, knock, send the other half.")],
)
L372[12] = dict(
    key="A pin cannot give an in-between voltage. So flip a lamp on and off super fast, like a dimmer switch. The longer it stays on in each flicker, the brighter it looks. Duty cycle is the fraction of time it is on. The timer counts up like a ramp, and a line (<code>OCR1x</code>) says when to switch off.",
    covers="Duty cycle and the Timer1 setup for Fast PWM.",
    map=[("PWM", "A dimmer. Flicker fast."), ("Duty cycle", "Fraction of time on."), ("TOP", "Length of one flicker."), ("<code>OCR1x</code>", "When in the flicker the lamp goes off."), ("Effective voltage", "How bright it looks.")],
)
L372[13] = dict(
    key="Two numbers run the show. How fast the flicker repeats (TOP), and how long each flicker is on (duty). Send that to a motor driver chip (L293). On-time is the speed. Two direction pins pick forward or reverse, like a garage door going up or down. The H-bridge is four switches that swap which wire gets power.",
    covers="Setting an exact frequency and driving a DC motor.",
    map=[("TOP / frequency", "How fast flickers repeat."), ("Duty", "Motor speed."), ("L293", "The motor's power box."), ("EN pin", "Takes the flicker (speed)."), ("A pins", "Direction."), ("H-bridge", "Four switches that reverse the motor.")],
)
T372 = {
    "Polling": "Walking to the door every few seconds. Simple, but you can miss quick visitors.",
    "Interrupt": "A doorbell. It pauses what you are doing, you answer, then go back.",
    "ISR": "What you do when the doorbell rings. Keep it quick.",
    "Flag bit": "A note card: someone rang. The hardware flips it.",
    "Register": "A labeled switch on the control panel, not a normal note.",
    "Pull-up": "A spring that holds a door shut until someone pushes it.",
    "Prescaler": "A gear that makes the timer count slower, so it can time longer things.",
    "Switch bounce": "A flickery button. One press rings many times.",
    "Debounce": "Wait a moment after a ring before trusting the button.",
    "State machine": "A washing machine cycle. Always in one step. Events move it forward.",
    "volatile": "A sticky note: this may change while you are away. Always re-read it.",
    "Harvard": "Two notebooks, one for instructions and one for notes, read at the same time.",
    "Mask": "A stencil that covers the doors you do not want to touch.",
    "Nibble": "Half a row of doors: 4 of the 8.",
    "ASCII": "A code that turns letters into numbers, like a decoder ring.",
}

A320 = dict(
    name="water pipes",
    cast_title="Water pipes in one glance",
    intro="Picture electricity as water in pipes. Voltage is the pressure, current is the flow, and circuit parts are pipe fittings.",
    cast=[
        ("Voltage", "Water pressure."),
        ("Current", "How much water flows past."),
        ("Resistor", "A narrow pipe. The squeeze wastes energy as heat."),
        ("Capacitor", "A stretchy balloon tank. Stores water, gives it back."),
        ("Inductor", "A heavy water wheel. Resists changes in flow."),
        ("AC", "A piston pushing water back and forth."),
        ("Real power", "Water that spins the mill wheel."),
        ("Reactive power", "Water sloshing in and out of the tank."),
        ("Power factor", "How much of the pushing spins the wheel."),
        ("Three-phase", "Three pistons taking turns. The flow never stops."),
        ("Laplace transform", "A translator that turns hard calculus into easy algebra."),
        ("Impulse", "A hammer tap on the pipe."),
        ("Convolution", "Every tap leaves ripples. The ripples add up."),
    ],
)
L320 = {}
L320[1] = dict(
    key="AC is a piston pushing water back and forth. A resistor is a narrow pipe: the push turns into heat. A capacitor or coil is a balloon tank or a water wheel: it takes the push and gives it back. The power wiggles up and down. The average of that wiggle, the real power, is what does work.",
    covers="Power right now, average power, rms, and how R, L and C behave.",
    map=[("p(t)", "Push times flow, right now."), ("P (real power)", "Water that spins the mill."), ("Q (reactive power)", "Water sloshing in and out of the tank."), ("rms", "The steady push that heats the same as AC."), ("Resistor", "A narrow pipe."), ("Capacitor", "A balloon tank."), ("Inductor", "A heavy water wheel.")],
)
L320[2] = dict(
    key="Some of the water spins the mill (P). Some just sloshes in and out of the tank (Q). The pipe has to carry both (S). Power factor is the share that actually spins the wheel. If the push and the flow are out of step, less of it does work. ELI the ICE man helps you remember who leads.",
    covers="Power factor, complex power and apparent power.",
    map=[("P", "Water spinning the mill."), ("Q", "Water sloshing."), ("S (complex)", "P and Q packed into one number."), ("|S| (apparent)", "Everything the pipe must carry."), ("Power factor", "Share that spins the wheel."), ("Lagging / leading", "Flow trails the push / runs ahead.")],
)
L320[3] = dict(
    key="A motor makes the pipe carry extra sloshing water that does no work, and the pipe heats up. Add a balloon tank right next to the motor (a capacitor in parallel). Now the sloshing stays local and the long pipe carries less. For maximum power, match the load to the pump. Three-phase starts here: three pistons, evenly spaced.",
    covers="Power factor correction, maximum power transfer and three-phase basics.",
    map=[("PF correction", "A balloon tank beside the motor."), ("Parallel capacitor", "The tank next to the load. The right fix."), ("Series capacitor", "Wrong spot. The main pipe still carries it."), ("Max power transfer", "Match the load to the pump."), ("Three-phase set", "Three pistons, a third of a turn apart.")],
)
L320[4] = dict(
    key="The grid is a big water system. A power plant pumps at high pressure. Big mains carry it across town. Smaller pipes step the pressure down for your house. A Y connection is three pipes meeting at a hub. A Δ is three pipes in a triangle. If all three pipes are identical, no water returns through the hub. So solve one pipe and copy the answer to the other two.",
    covers="Y and Δ, Tucson's grid, and the balanced Y-Y shortcut.",
    map=[("Y connection", "Three pipes meeting at a hub."), ("Δ connection", "Three pipes in a triangle."), ("Neutral", "The return pipe at the hub. Carries nothing when balanced."), ("Transformer", "A valve that changes the pressure."), ("Balanced", "Three identical pipes."), ("One-phase shortcut", "Solve one pipe, copy it.")],
)
L320[5] = dict(
    key="A triangle load is awkward. So swap it for a hub load where each pipe is one third as squeezy. Solve the easy version, then convert back. The pressure between two mains is about 1.7 times (√3) the pressure from a main to the hub, tilted 30 degrees. It is like the side of a triangle compared to the distance from the center to a corner.",
    covers="Line versus phase values, Δ to Y conversion, and worked examples.",
    map=[("Δ to Y", "Swap triangle for hub: divide by 3."), ("Line voltage", "Pressure between two mains."), ("Phase voltage", "Pressure across one branch."), ("√3∠30°", "Triangle side versus center-to-corner."), ("abc vs acb", "Which piston fires next.")],
)
L320[6] = dict(
    key="Three pistons taking turns means the water never stops. Total power is constant. Safety half: the flow (current) hurts you, not the pressure (volts). A few milliamps is a tingle. Around 20 can lock your muscles. 75 and up can scramble the heart. Ground is an emergency drain to earth. A GFCI is a leak detector that shuts off if water leaves the pipe somewhere it should not.",
    covers="Three-phase power, plugs and grounding, shock, and GFCIs.",
    map=[("Three-phase power", "Three pistons. Steady flow."), ("Ground", "An emergency drain to earth."), ("Hot / neutral", "Supply pipe / return pipe."), ("GFCI", "A leak detector."), ("Breaker", "An overflow valve protecting the pipes."), ("Let-go current", "Flow too strong to release.")],
)
L320[7] = dict(
    key="Differential equations are hard in time land. The Laplace transform is a translator. Send the problem to s land, where it is just algebra. Solve it. Translate back. A step is turning a faucet on and leaving it on. An impulse is a hammer tap on the pipe: huge, instant, and with a total punch of exactly 1.",
    covers="The transform, the step and impulse, and the sifting property.",
    map=[("Laplace transform", "A translator to easy algebra."), ("s", "A map coordinate in s land."), ("Unit step", "A faucet turned on."), ("Unit impulse", "A hammer tap."), ("Sifting", "The tap picks out the value at its moment.")],
)
L320[8] = dict(
    key="A rulebook lets you tweak known translations instead of starting over (shift, scale, derivative). Going back is the other half. Split a big messy fraction into small ones you recognize, like breaking a bill into coins. Look each coin up in the table. Each pole is one way the pipe drains: a plain decay or a wiggle.",
    covers="Laplace rules and partial fractions for the inverse.",
    map=[("Operations", "Quick conversions of known pairs."), ("Partial fractions", "Break the bill into coins."), ("Pole", "One way the pipe drains."), ("Repeated pole", "Two drains in a row. Adds a t·e bump."), ("Improper fraction", "Divide first. Impulses appear.")],
)
L320[9] = dict(
    key="Redraw the circuit in s land, where every part acts like a pipe fitting: resistor R, coil sL, capacitor 1/(sC). If the tank started full or the wheel started spinning, add a small extra source for it. Then solve it like any pipe network. The starting conditions are already built in.",
    covers="The four kinds of response and the s land version of R, L and C.",
    map=[("<code>sL</code>", "The water wheel in s land."), ("<code>1/(sC)</code>", "The balloon tank in s land."), ("Initial condition", "Tank already full, wheel already spinning."), ("Zero-input", "What leftover water does alone."), ("Zero-state", "What the pump does from empty."), ("Total", "Both together.")],
)
L320[10] = dict(
    key="Four worked examples practice the method. Redraw in s land. Solve with Cramer's rule (all the loops together) or Thevenin (shrink the network first). Convert back. Then check the value at time zero. Coupled coils are two water wheels on one shaft. The T-equivalent redraws them as separate wheels.",
    covers="Parallel RLC, Cramer's rule, Thevenin and mutual inductance.",
    map=[("Cramer's rule", "Solve all the loops together."), ("Thevenin", "Replace the network with one pump and one pipe."), ("Mutual inductance", "Two wheels on one shaft."), ("T-equivalent", "Redraw as separate wheels."), ("Check t = 0", "Does the water level at the start match?")],
)
L320[11] = dict(
    key="A circuit is a box. A signal goes in and a signal comes out, like a water filter. If doubling what goes in doubles what comes out, and two inputs just add, it is linear. If delaying the input just delays the output, it is time invariant. Hit it with one hammer tap and record the splash. That is the impulse response.",
    covers="Linearity, time invariance and the impulse response.",
    map=[("System", "A pipe network."), ("Linear", "Double in, double out."), ("Time invariant", "Same shape, just delayed."), ("Impulse response h(t)", "The splash from one tap."), ("Transfer function", "How the network treats each frequency.")],
)
L320[12] = dict(
    key="If you know the splash from one tap, you know it for every input. Any signal is a pile of taps of different sizes at different times. Each tap makes its own scaled, delayed splash. The splashes add up. That adding-up is convolution. In s land it is just multiplication: Y = X times H.",
    covers="Where convolution comes from, how to compute it, and the shortcut.",
    map=[("Convolution", "Adding up all the delayed splashes."), ("Impulse response", "The splash of one tap."), ("Flip and slide", "Line up each tap's splash with now."), ("Y(s) = X(s)H(s)", "The shortcut."), ("LTI", "A predictable pipe network.")],
)
T320 = {
    "Instantaneous power": "Push times flow, right now. It wiggles.",
    "Average (real) power": "The steady average. Water that spins the mill.",
    "Reactive power": "Water sloshing in and out of the tank. No work, but the pipes carry it.",
    "Complex power": "One number holding the mill water and the sloshing water.",
    "Apparent power": "How big the pipe must be for everything it carries.",
    "Root-mean-square": "The steady push that heats the same as the wiggly one.",
    "Phasor": "A wave drawn as an arrow: length is size, angle is timing.",
    "Complex conjugate": "The mirror image of the arrow: same size, angle flipped.",
    "Power factor": "The share of the pushing that really spins the wheel.",
    "Lagging": "Flow trails the push (coil-like) or runs ahead (tank-like).",
    "Impedance": "How much any fitting resists AC flow, including the timing shift.",
    "Admittance": "How easily a fitting lets flow through. The opposite of impedance.",
    "Susceptance": "How easily a tank or wheel lets the sloshing through.",
    "Power factor correction": "A balloon tank beside the motor so the sloshing stays local.",
    "Maximum power transfer": "Match the load to the pump so the most water reaches the load.",
    "Three-phase voltages": "Three pistons, same size, each a third of a turn behind the last.",
    "Balanced set": "Three identical pistons. Together they add to zero.",
    "Phase sequence": "Which piston fires after which.",
    "Wye": "Three pipes meeting at a hub.",
    "Delta": "Three pipes in a triangle. No hub.",
    "Neutral": "The return pipe to the hub. Carries nothing when balanced.",
    "Phase vs line": "One branch's pressure and flow, versus the pressure between two mains.",
    "Split-phase": "Two 120 V halves, pushing opposite ways, sharing one return pipe.",
    "One-phase equivalent": "Solve one pipe, then copy the answer to the other two.",
    "Δ-Y transformation": "Swap a triangle for a hub. Balanced: each pipe one third as squeezy.",
    "Hot, neutral, ground": "Supply pipe, return pipe, and an emergency drain to earth.",
    "Let-go current": "How much flow your muscles can fight. Above it, your hand clamps shut.",
    "Ventricular fibrillation": "The heart's pump twitching instead of pumping.",
    "Arc flash": "A burst of heat and light when current jumps through air.",
    "Complex frequency": "A coordinate in s land: one part for decay, one for wiggle.",
    "Unit step": "A faucet turned on and left on.",
    "Unit impulse": "A hammer tap: instant, with a total punch of 1.",
    "Sifting property": "The tap picks out the value at its exact moment.",
    "Pole": "One way the pipe drains. Each pole gives a decay or a wiggle.",
    "Proper fraction": "Top smaller than bottom. If not, divide first.",
    "Partial fraction expansion": "Break a bill into coins you can look up.",
    "Inverse Laplace transform": "Translate back from s land to time.",
    "Zero-input solution": "What leftover water does by itself with the pump off.",
    "Zero-state solution": "What the pump does starting from empty.",
    "Total solution": "Leftover water plus the pump's effect.",
    "Impulse response": "The splash from one hammer tap.",
    "s-domain equivalent circuit": "The same pipes redrawn in s land.",
    "Initial condition": "How full the tank was, or how fast the wheel was spinning, at the start.",
}

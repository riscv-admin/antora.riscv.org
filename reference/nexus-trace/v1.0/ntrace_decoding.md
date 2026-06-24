# 11.1. N-Trace Decoding Guidelines

## [](#11-1-n-trace-decoding-guidelines)11.1\. N-Trace Decoding Guidelines

To reconstruct the program control flow using the N-Trace encoded stream of messages (as any other compressed trace) access to opcodes of instructions which were executed is necessary. This is usually done by providing an ELF file of a program being executed, but it can also be read-out from the target. Three types of information are needed:

1. Size of each instruction (16-bit or 32-bit).
2. Types of all instructions (corresponding to 'itype' signal on trace ingress port - based on analysis of opcodes).
3. For direct unconditional jumps and direct conditional branches an offset (to jump/branch destination) encoded in an opcode.

Decoding must start from a [synchronizing message](#Synchronizing Messages). The synchronizing message provides the complete PC in the [F-ADDR](#field%5FF-ADDR) field. Transfers relative to this PC may then be inferred using subsequent messages till a new PC is transmitted in a subsequent synchronizing message.

| |  To provide partial decoding of big trace, messages with [F-ADDR](#field%5FF-ADDR) are transmitted periodically. Periodic [F-ADDR](#field%5FF-ADDR) transmission is also needed to decode trace from small, circular buffers. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#11-1-1-decoding-algorithm-principles)11.1.1\. Decoding Algorithm Principles

To reconstruct the control flow of the program from N-Trace messages do the following:

* Copy **HIST** and **I-CNT** fields (if available) to corresponding registers.
* Handle [HIST](#field%5FHIST) register (while not empty):  
   * Analyze code from the current PC through direct (inferable) unconditional jumps (all types) and direct conditional branches (each direct conditional branch will 'consume' a single bit from the **HIST** register).  
   * Each encountered instruction should subtract 1 or 2 (INST\_LEN/16) from I-CNT (depending on the size of that instruction).  
   * At the end (after the least significant bit from **HIST** is processed), the PC will be of the instruction executed after the last conditional branch (either taken or not-taken).
* Handle [I-CNT](#field%5FI-CNT) register (while greater than 0x0):  
   * Analyze code from current PC through direct (inferable) unconditional jumps (all types) - each encountered direct conditional branch must be treated as not-taken.  
   * Each encountered instruction should subtract 1 or 2 (INST\_LEN/16) from I-CNT (depending on the size of that instruction).
* It will reach either indirect, unconditional jump or I-CNT will become 0 to denote that some other 'event' (like exception, interrupt, trace off, trigger etc.) happened.  
   * In BTM mode, direct conditional branch may be reached as last instruction. Next PC should be the destination address of that taken branch.
* At the last step the [F-ADDR](#field%5FF-ADDR) or [U-ADDR](#field%5FU-ADDR) field (if available) should be applied.  
   * This is either a destination address of indirect unconditional jump or an address of an exception/interrupt handler.  
   * This will be the next PC where analysis of the next trace message should start.
* Handle the [B-CNT](#field%5FB-CNT) or [RCODE](#field%5FRCODE) fields by repeating processing of the fields from previous trace message.

| |  Phrase **inferable unconditional jumps (all types)** include indirect unconditional jumps, which may be inferable. Extra fields like [SYNC](#field%5FSYNC)/[B-TYPE](#field%5FB-TYPE) only provide extra details, but are NOT essential for a decoder to reconstruct the PC flow. See [N-Trace Reference Code](https://github.com/riscv-non-isa/tg-nexus-trace/tree/main/refcode/c) for simple but fully functional implementation. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#11-1-2-decoding-trace-from-multiple-harts)11.1.2\. Decoding trace from multiple harts

Decoder assigned to a specific hart should process only those messages tagged with a [SRC](#field%5FSRC) value corresponding to that hart. To facilitate this, all encoders operating within the same trace stream must configure the `trTeSrcBits` field identically to ensure a consistent source identifier bit width, and must each be assigned a unique `trTeSrcID` field value. This arrangement ensures that messages can be accurately attributed to their originating hart, allowing for precise and isolated trace analysis per hart.

### [](#11-1-3-decoding-trace-of-operating-systems)11.1.3\. Decoding trace of operating systems

In case of complex operating systems (Linux etc.), where code consists of several independently built programs and libraries, decoders must be aware of different program images (e.g., ELF files) at different locations. [Ownership](#msg%5FOwnership) messages should provide enough context. Decoders must be also aware of assignment of **scontext/hcontext** values for programs and processes being traced.

Operating systems may decide to migrate single process to different cores/harts. It may also be the case, when different threads from the same process (sharing code …​) will run in the same time on more than one core/hart.

### [](#11-1-4-decoding-self-modifying-or-jit-just-in-time-compiled-code)11.1.4\. Decoding self-modifying or JIT (Just In Time compiled) code

Trace encoder is just encoding a stream of instructions passed by ingress port from the hart running it, but decoder must be aware of types of all instructions being executed. In case of self-modifying code (or JIT code), binary image (at moment of execution) must be available to decoder. How this can be done is not in the scope of this specification.

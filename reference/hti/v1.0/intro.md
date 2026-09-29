# Introduction

## [](#intro)Introduction

The RISC-V Hart to Trace Encoder Interface (RHTI) was originally developed (and ratified) as part of the [Efficient Trace for RISC-V (E-Trace) Specification](https://github.com/riscv-non-isa/riscv-trace-spec/releases/latest/). However, the interface itself is not E-Trace specific, and is suitable for use with any instruction and data trace encoding protocol. As such, this document makes it available as a standalone specification.

This specification also includes a normative change related to the handling of multi-memory access instructions - see [\[sec:MMAInst\]](#sec:MMAInst).

### [](#sec:terminology)Terminology

The following terms have a specific meaning in this specification.

* **branch**: an instruction which conditionally changes the execution flow
* **CSR**: control/status register
* **decoder**: a piece of software that takes the trace packets emitted by the encoder and reconstructs the execution flow of the code executed by the RISC-V hart
* **discontinuity**: a change in the program counter that is anything other than an automatic increment to the next instruction located contiguously in memory  
   * **inferable discontinuity**: a discontinuity in the program counter resulting from a branch or **direct jump**  
   * **uninferable discontinuity**: a discontinuity in the program counter that is not inferable (see above)  
   * **updiscon**: contraction of ’uninferable PC discontinuity’
* **E-Trace**: Abbreviation of _Efficient Trace for RISC-V_
* **ELF**: executable and linkable format
* **encoder**: a piece of hardware that takes in instruction execution information from a RISC-V hart and transforms it into trace packets
* **exception**: an unusual condition occurring at run time associated with an instruction in a RISC-V hart
* **hart**: a RISC-V hardware thread
* **final instruction**: the instruction retired immediately before tracing stops.
* **last instruction**: in a block of sequentially retired instructions, the instruction at the end of the sequence
* **interrupt**: an external asynchronous event that may cause a RISC-V hart to experience an unexpected transfer of control
* **ISA**: instruction set architecture
* **jump**: an instruction which unconditionally changes the execution flow  
   * **direct jump**: an instruction which unconditionally changes the execution flow by changing the PC by a constant value  
   * **indirect jump**: an instruction which unconditionally changes the execution flow by changing the PC to a computed value  
   * **inferable jump**: a jump where the target address is supplied via a constant embedded within the jump opcode  
   * **uninferable jump**: a jump which is not inferable (see above)
* **LSB**: least significant bit
* **MSB**: most significant bit
* **Multi-memory access (MMA) instruction**: An instruction such as those introduced by the Zcmp and Vector extensions that results in multiple loads or stores
* **packet**: the atomic unit of encoded trace information emitted by the encoder
* **PC**: program counter
* **program counter**: a register containing the address of the instruction being executed
* **retire**: the final stage of executing an instruction, when the machine state is updated and the `minstret` CSR is updated (sometimes referred to as ’commit’ or ’graduate’)
* **RHTI** RISC-V Hart to Trace Encoder Interface (this specification)
* **trace decoder**: see **decoder**
* **trace encoder**: seee **encoder**
* **trap**: the transfer of control to a trap handler caused by either an exception or an interrupt

### [](#nomenclature)Nomenclature

In the following sections items in **bold** are signals or fields within a packet.

Items in **_bold italics_** are mnemonics for instructions defined in the RISC-V ISA

Items `lowlighted` are CSRs or other registers defined in the RISC-V ISA

Items in _italics_ with names ending _’\_p’_ refer to parameters either built into the hardware or configurable hardware values.

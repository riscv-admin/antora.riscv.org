# 28.1. "C" Extension for Compressed Instructions, Version 2.0

## [](#compressed)28.1\. "C" Extension for Compressed Instructions, Version 2.0

This chapter describes the RISC-V standard compressed instruction-set extension, named "C", which reduces static and dynamic code size by adding short 16-bit instruction encodings for common operations. The C extension can be added to any of the base ISAs (RV32I, RV32E, RV64I, RV64E), and we use the generic term "RVC" to cover any of these. Typically, 50%-60% of the RISC-V instructions in a program can be replaced with RVC instructions, resulting in a 25%-30% code-size reduction.

### [](#28-1-1-overview)28.1.1\. Overview

RVC uses a simple compression scheme that offers shorter 16-bit versions of common 32-bit RISC-V instructions when:

* the immediate or address offset is small, or
* one of the registers is the zero register (`x0`), the ABI link register (`x1`), or the ABI stack pointer (`x2`), or
* the destination register and the first source register are identical, or
* the registers used are the 8 most popular ones.

The C extension is compatible with all other standard instruction extensions. The C extension allows 16-bit instructions to be freely intermixed with 32-bit instructions, with the latter now able to start on any 16-bit boundary, i.e., IALIGN=16. With the addition of the C extension, no instructions can raise instruction-address-misaligned exceptions.

| |  Removing the 32-bit alignment constraint on the original 32-bit instructions allows significantly greater code density. |
| -------------------------------------------------------------------------------------------------------------------------- |

The compressed instruction encodings are mostly common across RV32C and RV64C, but as shown in [Figure 1](#rvc-instr-table0), a few opcodes are used for different purposes depending on base ISA. For example, the wider address-space RV64C variant requires additional opcodes to compress loads and stores of 64-bit integer values, while RV32C uses the same opcodes to compress loads and stores of single-precision floating-point values. If the C extension is implemented, the appropriate compressed floating-point load and store instructions must be provided whenever the relevant standard floating-point extension (F and/or D) is also implemented. In addition, RV32C includes a compressed jump and link instruction to compress short-range subroutine calls, where the same opcode is used to compress ADDIW for RV64C.

| |  Double-precision loads and stores are a significant fraction of static and dynamic instructions, hence the motivation to include them in the RV32C and RV64C encoding. Although single-precision loads and stores are not a significant source of static or dynamic compression for benchmarks compiled for the currently supported ABIs, for microcontrollers that only provide hardware single-precision floating-point units and have an ABI that only supports single-precision floating-point numbers, the single-precision loads and stores will be used at least as frequently as double-precision loads and stores in the measured benchmarks. Hence, the motivation to provide compressed support for these in RV32C. Short-range subroutine calls are more likely in small binaries for microcontrollers, hence the motivation to include these in RV32C. Although reusing opcodes for different purposes for different base ISAs adds some complexity to documentation, the impact on implementation complexity is small even for designs that support multiple base ISAs. The compressed floating-point load and store variants use the same instruction format with the same register specifiers as the wider integer loads and stores. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

RVC was designed under the constraint that each RVC instruction expands into a single 32-bit instruction in either the base ISA (RV32I/E or RV64I/E) or the F and D standard extensions where present. Adopting this constraint has two main benefits:

* Hardware designs can simply expand RVC instructions during decode, simplifying verification and minimizing modifications to existing microarchitectures.
* Compilers can be unaware of the RVC extension and leave code compression to the assembler and linker, although a compression-aware compiler will generally be able to produce better results.

| |  We felt the multiple complexity reductions of a simple one-one mapping between C and base IFD instructions far outweighed the potential gains of a slightly denser encoding that added additional instructions only supported in the C extension, or that allowed encoding of multiple IFD instructions in one C instruction. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

It is important to note that the C extension is not designed to be a stand-alone ISA, and is meant to be used alongside a base ISA.

| |  Variable-length instruction sets have long been used to improve code density. For example, the IBM Stretch \[[22](../biblio/bibliography.html#bib-stretch)\], developed in the late 1950s, had an ISA with 32-bit and 64-bit instructions, where some of the 32-bit instructions were compressed versions of the full 64-bit instructions. Stretch also employed the concept of limiting the set of registers that were addressable in some of the shorter instruction formats, with short branch instructions that could only refer to one of the index registers. The later IBM 360 architecture \[[23](../biblio/bibliography.html#bib-ibm360)\] supported a simple variable-length instruction encoding with 16-bit, 32-bit, or 48-bit instruction formats. In 1963, CDC introduced the Cray-designed CDC 6600 \[[24](../biblio/bibliography.html#bib-cdc6600)\], a precursor to RISC architectures, that introduced a register-rich load-store architecture with instructions of two lengths, 15-bits and 30-bits. The later Cray-1 design used a very similar instruction format, with 16-bit and 32-bit instruction lengths. The initial RISC ISAs from the 1980s all picked performance over code size, which was reasonable for a workstation environment, but not for embedded systems. Hence, both ARM and MIPS subsequently made versions of the ISAs that offered smaller code size by offering an alternative 16-bit wide instruction set instead of the standard 32-bit wide instructions. The compressed RISC ISAs reduced code size relative to their starting points by about 25-30%, yielding code that was significantly smaller than 80x86\. This result surprised some, as their intuition was that the variable-length CISC ISA should be smaller than RISC ISAs that offered only 16-bit and 32-bit formats. Since the original RISC ISAs did not leave sufficient opcode space free to include these unplanned compressed instructions, they were instead developed as complete new ISAs. This meant compilers needed different code generators for the separate compressed ISAs. The first compressed RISC ISA extensions (e.g., ARM Thumb and MIPS16) used only a fixed 16-bit instruction size, which gave good reductions in static code size but caused an increase in dynamic instruction count, which led to lower performance compared to the original fixed-width 32-bit instruction size. This led to the development of a second generation of compressed RISC ISA designs with mixed 16-bit and 32-bit instruction lengths (e.g., ARM Thumb2, microMIPS, PowerPC VLE), so that performance was similar to pure 32-bit instructions but with significant code size savings. Unfortunately, these different generations of compressed ISAs are incompatible with each other and with the original uncompressed ISA, leading to significant complexity in documentation, implementations, and software tools support. Of the commonly used 64-bit ISAs, only PowerPC and microMIPS currently supports a compressed instruction format. It is surprising that the most popular 64-bit ISA for mobile platforms (ARM v8) does not include a compressed instruction format given that static code size and dynamic instruction fetch bandwidth are important metrics. Although static code size is not a major concern in larger systems, instruction fetch bandwidth can be a major bottleneck in servers running commercial workloads, which often have a large instruction working set. Benefiting from 25 years of hindsight, RISC-V was designed to support compressed instructions from the outset, leaving enough opcode space for RVC to be added as a simple extension on top of the base ISA (along with many other extensions). The philosophy of RVC is to reduce code size for embedded applications _and_ to improve performance and energy-efficiency for all applications due to fewer misses in the instruction cache. Waterman shows that RVC fetches 25%-30% fewer instruction bits, which reduces instruction cache misses by 20%-25%, or roughly the same performance impact as doubling the instruction cache size. \[[25](../biblio/bibliography.html#bib-waterman-ms)\] |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#28-1-2-compressed-instruction-formats)28.1.2\. Compressed Instruction Formats

[Table 1](#rvc-form) shows the nine compressed instruction formats. CR, CI, and CSS can use any of the 32 RVI registers, but CIW, CL, CS, CA, and CB are limited to just 8 of them.[Table 2](#registers) lists these popular registers, which correspond to registers `x8` to `x15`. Note that there is a separate version of load and store instructions that use the stack pointer as the base address register, since saving to and restoring from the stack are so prevalent, and that they use the CI and CSS formats to allow access to all 32 data registers. CIW supplies an 8-bit immediate for the ADDI4SPN instruction.

| |  The RISC-V ABI was changed to make the frequently used registers map to registers 'x8-x15'. This simplifies the decompression decoder by having a contiguous naturally aligned set of register numbers, and is also compatible with the RV32E and RV64E base ISAs, which only have 16 integer registers. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Compressed register-based floating-point loads and stores also use the CL and CS formats respectively, with the eight registers mapping to `f8` to `f15`. 

| |  _The standard RISC-V calling convention maps the most frequently used floating-point registers to registers f8 to f15, which allows the same register decompression decoding as for integer register numbers._ |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The formats were designed to keep bits for the two register source specifiers in the same place in all instructions, while the destination register field can move. When the full 5-bit destination register specifier is present, it is in the same place as in the 32-bit RISC-V encoding. Where immediates are sign-extended, the sign extension is always from bit 12\. Immediate fields have been scrambled, as in the base specification, to reduce the number of immediate multiplexers required.

| |  The immediate fields are scrambled in the instruction formats instead of in sequential order so that as many bits as possible are in the same position in every instruction, thereby simplifying implementations. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

For many RVC instructions, zero-valued immediates are disallowed and`x0` is not a valid 5-bit register specifier. These restrictions free up encoding space for other instructions requiring fewer operand bits.

__Table 1\. Compressed 16-bit RVC instruction formats__
| Format Meaning CR Register CI Immediate CSS Stack-relative Store CIW Wide Immediate CL Load CS Store CA Arithmetic CB Branch/Arithmetic CJ Jump | 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1 0 funct4 rd/rs1 rs2 op funct3 imm rd/rs1 imm op funct3 imm rs2 op funct3 imm rd′ op funct3 imm rs1′ imm rd′ op funct3 imm rs1′ imm rs2′ op funct6 rd′/rs1′ funct2 rs2′ op funct3 offset rd′/rs1′ offset op funct3 jump target op |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

__Table 2\. Registers specified by the three-bit _rs1_′, _rs2_′, and _rd_′ fields of the CIW, CL, CS, CA, and CB formats.__
| RVC Register Number Integer Register Number Integer Register ABI Name Floating-Point Register Number Floating-Point Register ABI Name | 000 001 010 011 100 101 110 111 x8 x9 x10 x11 x12 x13 x14 x15 s0 s1 a0 a1 a2 a3 a4 a5 f8 f9 f10 f11 f12 f13 f14 f15 fs0 fs1 fa0 fa1 fa2 fa3 fa4 fa5 |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#28-1-3-load-and-store-instructions)28.1.3\. Load and Store Instructions

To increase the reach of 16-bit instructions, data-transfer instructions use zero-extended immediates that are scaled by the size of the data in bytes: ×4 for words, ×8 for double words, and ×16 for quad words.

RVC provides two variants of loads and stores. One uses the ABI stack pointer, `x2`, as the base address and can target any data register. The other can reference one of 8 base address registers and one of 8 data registers.

#### [](#28-1-3-1-stack-pointer-based-loads-and-stores)28.1.3.1\. Stack-Pointer-Based Loads and Stores

![svg](_images/svg-e18f1e1e5092d13a44025b07aad9b6da08b9b32f.svg) 

These instructions use the CI format.

C.LWSP loads a 32-bit value from memory into register _rd_. It computes an effective address by adding the _zero_\-extended offset, scaled by 4, to the stack pointer, `x2`. It expands to `lw rd, offset(x2)`. C.LWSP is valid only when _rd_≠`x0`; the code points with _rd_\=`x0` are reserved.

C.LDSP is an RV64C-only instruction that loads a 64-bit value from memory into register _rd_. It computes its effective address by adding the zero-extended offset, scaled by 8, to the stack pointer,`x2`. It expands to `ld rd, offset(x2)`. C.LDSP is valid only when_rd_≠`x0`; the code points with_rd_\=`x0` are reserved.

C.FLWSP is an RV32FC-only instruction that loads a single-precision floating-point value from memory into floating-point register _rd_. It computes its effective address by adding the _zero_\-extended offset, scaled by 4, to the stack pointer, `x2`. It expands to`flw rd, offset(x2)`.

C.FLDSP is an RV32DC/RV64DC-only instruction that loads a double-precision floating-point value from memory into floating-point register _rd_. It computes its effective address by adding the_zero_\-extended offset, scaled by 8, to the stack pointer, `x2`. It expands to `fld rd, offset(x2)`.

![svg](_images/svg-b48d94bf6f0d97e8165edd4f1a2bcfde7aafd511.svg) 

These instructions use the CSS format.

C.SWSP stores a 32-bit value in register _rs2_ to memory. It computes an effective address by adding the _zero_\-extended offset, scaled by 4, to the stack pointer, `x2`. It expands to `sw rs2, offset(x2)`.

C.SDSP is an RV64C-only instruction that stores a 64-bit value in register _rs2_ to memory. It computes an effective address by adding the_zero_\-extended offset, scaled by 8, to the stack pointer, `x2`. It expands to `sd rs2, offset(x2)`.

C.FSWSP is an RV32FC-only instruction that stores a single-precision floating-point value in floating-point register _rs2_ to memory. It computes an effective address by adding the _zero_\-extended offset, scaled by 4, to the stack pointer, `x2`. It expands to`fsw rs2, offset(x2)`.

C.FSDSP is an RV32DC/RV64DC-only instruction that stores a double-precision floating-point value in floating-point register _rs2_to memory. It computes an effective address by adding the_zero_\-extended offset, scaled by 8, to the stack pointer, `x2`. It expands to `fsd rs2, offset(x2)`.

| |  Register save/restore code at function entry/exit represents a significant portion of static code size. The stack-pointer-based compressed loads and stores in RVC are effective at reducing the save/restore static code size by a factor of 2 while improving performance by reducing dynamic instruction bandwidth. A common mechanism used in other ISAs to further reduce save/restore code size is load-multiple and store-multiple instructions. We considered adopting these for RISC-V but noted the following drawbacks to these instructions: These instructions complicate processor implementations. For virtual memory systems, some data accesses could be resident in physical memory and some could not, which requires a new restart mechanism for partially executed instructions. Unlike the rest of the RVC instructions, there is no IFD equivalent to Load Multiple and Store Multiple. Unlike the rest of the RVC instructions, the compiler would have to be aware of these load-multiple and store-multiple instructions to both allocate registers in the expected order and also to schedule the loads and stores contiguously and in the proper order, to maximize the chances of them being detected and replaced by an assembler or linker with the equivalent load-multiple or store-multiple compressed instruction. Simple microarchitectural implementations will constrain how other instructions can be scheduled around the load and store multiple instructions, leading to a potential performance loss. The desire for sequential register allocation might conflict with the featured registers selected for the CIW, CL, CS, CA, and CB formats. Furthermore, much of the gains can be realized in software by replacing prologue and epilogue code with subroutine calls to common prologue and epilogue code, a technique described in Section 5.6 of \[[26](../biblio/bibliography.html#bib-waterman-phd)\]. While reasonable architects might come to different conclusions, we decided to omit load and store multiple and instead use the software-only approach of calling save/restore millicode routines to attain the greatest code size reduction. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#28-1-3-2-register-based-loads-and-stores)28.1.3.2\. Register-Based Loads and Stores

![svg](_images/svg-a6c6023cddbfc673ff34f9d8b654c3fd6e2449a0.svg) 

These instructions use the CL format.

C.LW loads a 32-bit value from memory into register`_rd′_`. It computes an effective address by adding the_zero_\-extended offset, scaled by 4, to the base address in register`_rs1′_`. It expands to `lw rd′, offset(rs1′)`.

C.LD is an RV64C-only instruction that loads a 64-bit value from memory into register `_rd′_`. It computes an effective address by adding the _zero_\-extended offset, scaled by 8, to the base address in register `_rs1′_`. It expands to`ld rd′, offset(rs1′)`.

C.FLW is an RV32FC-only instruction that loads a single-precision floating-point value from memory into floating-point register`_rd′_`. It computes an effective address by adding the_zero_\-extended offset, scaled by 4, to the base address in register`_rs1′_`. It expands to`flw rd′, offset(rs1′)`.

C.FLD is an RV32DC/RV64DC-only instruction that loads a double-precision floating-point value from memory into floating-point register`_rd′_`. It computes an effective address by adding the_zero_\-extended offset, scaled by 8, to the base address in register`_rs1′_`. It expands to`fld rd′, offset(rs1′)`.

![svg](_images/svg-95a4adb6faa0b91163a7ca7355571d48945968c1.svg) 

These instructions use the CS format.

C.SW stores a 32-bit value in register `_rs2′_` to memory. It computes an effective address by adding the _zero_\-extended offset, scaled by 4, to the base address in register `_rs1′_`. It expands to `sw rs2′, offset(rs1′)`.

C.SD is an RV64C-only instruction that stores a 64-bit value in register `_rs2′_` to memory. It computes an effective address by adding the _zero_\-extended offset, scaled by 8, to the base address in register `_rs1′_`. It expands to`sd rs2′, offset(rs1′)`.

C.FSW is an RV32FC-only instruction that stores a single-precision floating-point value in floating-point register `_rs2′_` to memory. It computes an effective address by adding the _zero_\-extended offset, scaled by 4, to the base address in register`_rs1′_`. It expands to`fsw rs2′, offset(rs1′)`.

C.FSD is an RV32DC/RV64DC-only instruction that stores a double-precision floating-point value in floating-point register`_rs2′_` to memory. It computes an effective address by adding the _zero_\-extended offset, scaled by 8, to the base address in register `_rs1′_`. It expands to`fsd rs2′, offset(rs1′)`.

### [](#28-1-4-control-transfer-instructions)28.1.4\. Control Transfer Instructions

RVC provides unconditional jump instructions and conditional branch instructions. As with base RVI instructions, the offsets of all RVC control transfer instructions are in multiples of 2 bytes.

![svg](_images/svg-1d6d90ff75a468d006ca9343b224bb7d7de17b44.svg) 

These instructions use the CJ format.

C.J performs an unconditional control transfer. The offset is sign-extended and added to the `pc` to form the jump target address. C.J can therefore target a ±2 KiB range. C.J expands to`jal x0, offset`.

C.JAL is an RV32C-only instruction that performs the same operation as C.J, but additionally writes the address of the instruction following the jump (`pc+2`) to the link register, `x1`. C.JAL expands to`jal x1, offset`.

![svg](_images/svg-ca378d779bca23f7bbbf5ada7e62f7c987cf1546.svg) 

These instructions use the CR format.

C.JR (jump register) performs an unconditional control transfer to the address in register _rs1_. C.JR expands to `jalr x0, 0(rs1)`. C.JR is valid only when _rs1_≠`x0`; the code point with _rs1_\=`x0` is reserved.

C.JALR (jump and link register) performs the same operation as C.JR, but additionally writes the address of the instruction following the jump (`pc`+2) to the link register, `x1`. C.JALR expands to`jalr x1, 0(rs1)`. C.JALR is valid only when_rs1_≠`x0`; the code point with_rs1_\=`x0` corresponds to the C.EBREAK instruction.

| |  Strictly speaking, C.JALR does not expand exactly to a base RVI instruction as the value added to the PC to form the link address is 2 rather than 4 as in the base ISA, but supporting both offsets of 2 and 4 bytes is only a very minor change to the base microarchitecture. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

![svg](_images/svg-386882b890f10d93eee7c836feee88331e5c9bb6.svg) 

These instructions use the CB format.

C.BEQZ performs conditional control transfers. The offset is sign-extended and added to the `pc` to form the branch target address. It can therefore target a ±256 B range. C.BEQZ takes the branch if the value in register _rs1′_ is zero. It expands to `beq rs1′, x0, offset`.

C.BNEZ is defined analogously, but it takes the branch if_rs1′_ contains a nonzero value. It expands to`bne rs1′, x0, offset`.

### [](#28-1-5-integer-computational-instructions)28.1.5\. Integer Computational Instructions

RVC provides several instructions for integer arithmetic and constant generation.

#### [](#28-1-5-1-integer-constant-generation-instructions)28.1.5.1\. Integer Constant-Generation Instructions

The two constant-generation instructions both use the CI instruction format and can target any integer register.

![svg](_images/svg-db6d70581f491dfca4c6c2607b7bef9077753246.svg) 

C.LI loads the sign-extended 6-bit immediate, _imm_, into register _rd_. C.LI expands into `addi rd, x0, imm`. The C.LI code points with _rd_\=`x0` are HINTs.

C.LUI loads the non-zero 6-bit immediate field into bits 17–12 of the destination register, clears the bottom 12 bits, and sign-extends bit 17 into all higher bits of the destination. C.LUI expands into`lui rd, imm`. C.LUI is valid only when_rd_≠`x2`, and when the immediate is not equal to zero. The code points with_imm_\=0 are reserved. The code points with _rd_\=`x2` and _imm_≠0 correspond to the C.ADDI16SP instruction. The code points with _rd_\=`x0` and _imm_≠0 are HINTs.

#### [](#28-1-5-2-integer-register-immediate-operations)28.1.5.2\. Integer Register-Immediate Operations

These integer register-immediate operations are encoded in the CI format and perform operations on an integer register and a 6-bit immediate.

![svg](_images/svg-bbb362623c0f88d5dbb743ebfc933be4e36eb4a2.svg) 

C.ADDI adds the non-zero sign-extended 6-bit immediate to the value in register _rd_ then writes the result to _rd_. C.ADDI expands into`addi rd, rd, imm`. The code points with _rd_≠0 and _imm_\=0 are HINTs. The code points with _rd_\=`x0` encode the C.NOP instruction, of which the code points with _imm_≠0 are HINTs.

C.ADDIW is an RV64C-only instruction that performs the same computation but produces a 32-bit result, then sign-extends result to 64 bits. C.ADDIW expands into `addiw rd, rd, imm`. The immediate can be zero for C.ADDIW, where this corresponds to `sext.w rd`. C.ADDIW is valid only when _rd_≠`x0`; the code points with_rd_\=`x0` are reserved.

C.ADDI16SP (add immediate to stack pointer) shares the opcode with C.LUI, but has a destination field of`x2`. C.ADDI16SP adds the non-zero sign-extended 6-bit immediate to the value in the stack pointer (`sp=x2`), where the immediate is scaled to represent multiples of 16 in the range \[-512, 496\]. C.ADDI16SP is used to adjust the stack pointer in procedure prologues and epilogues. It expands into `addi x2, x2, nzimm[9:4]`. C.ADDI16SP is valid only when_nzimm_≠0; the code point with _nzimm_\=0 is reserved.

| |  In the standard RISC-V calling convention, the stack pointer sp is always 16-byte aligned. |
| --------------------------------------------------------------------------------------------- |

![svg](_images/svg-bf986cd7521109161e78530931e222b3c637ae50.svg) 

C.ADDI4SPN (add immediate to stack pointer, non-destructive) is a CIW-format instruction that adds a _zero_\-extended non-zero immediate, scaled by 4, to the stack pointer, `x2`, and writes the result to `rd′`. This instruction is used to generate pointers to stack-allocated variables, and expands to`addi rd′, x2, nzuimm[9:2]`. C.ADDI4SPN is valid only when_nzuimm_≠0; the code points with _nzuimm_\=0 are reserved.

![svg](_images/svg-4ceb865372085f49cea50da520cc223645c46d2d.svg) 

C.SLLI is a CI-format instruction that performs a logical left shift of the value in register _rd_ then writes the result to _rd_. The shift amount is encoded in the _shamt_ field. C.SLLI expands into `slli rd, rd, shamt[5:0]`.

The C.SLLI code points with _shamt_\=0 or with _rd_\=`x0` are HINTs.

For RV32C, _shamt\[5\]_ must be zero; the code points with _shamt\[5\]_\=1 are designated for custom extensions.

![svg](_images/svg-e63605912406813e686938b80b8f5e76981efe04.svg) 

C.SRLI is a CB-format instruction that performs a logical right shift of the value in register _rd′_ then writes the result to_rd′_. The shift amount is encoded in the _shamt_ field. C.SRLI expands into `srli rd′, rd′, shamt`.

The C.SRLI code points with _shamt_\=0 are HINTs.

For RV32C, _shamt\[5\]_ must be zero; the code points with _shamt\[5\]_\=1 are designated for custom extensions.

C.SRAI is defined analogously to C.SRLI, but instead performs an arithmetic right shift. C.SRAI expands to`srai rd′, rd′, shamt`.

| |  Left shifts are usually more frequent than right shifts, as left shifts are frequently used to scale address values. Right shifts have therefore been granted less encoding space and are placed in an encoding quadrant where all other immediates are sign-extended. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

![svg](_images/svg-96adf533629add3edd308ef7105a8aecbfe20bf1.svg) 

C.ANDI is a CB-format instruction that computes the bitwise AND of the value in register _rd′_ and the sign-extended 6-bit immediate, then writes the result to _rd′_. C.ANDI expands to `andi rd′, rd′, imm`.

#### [](#28-1-5-3-integer-register-register-operations)28.1.5.3\. Integer Register-Register Operations

![svg](_images/svg-0522b2220c99b36c1e028b418dc079fa0b55d25c.svg) 

These instructions use the CR format.

C.MV copies the value in register _rs2_ into register _rd_. C.MV expands into `add rd, x0, rs2`. C.MV is valid only when_rs2_≠`x0`; the code points with _rs2_\=`x0` correspond to the C.JR instruction. The code points with _rs2_≠`x0` and _rd_\=`x0` are HINTs.

| |  _C.MV expands to a different instruction than the canonical MV pseudoinstruction, which instead uses ADDI. Implementations that handle MV specially, e.g. using register-renaming hardware, may find it more convenient to expand C.MV to MV instead of ADD, at slight additional hardware cost._ |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

C.ADD adds the values in registers _rd_ and _rs2_ and writes the result to register _rd_. C.ADD expands into `add rd, rd, rs2`. C.ADD is only valid when _rs2_≠`x0`; the code points with _rs2_\=`x0` correspond to the C.JALR and C.EBREAK instructions. The code points with _rs2_≠`x0` and _rd_\=`x0` are HINTs.

![svg](_images/svg-0ccc2817794606823407179191eb0fd1147858d9.svg) 

These instructions use the CA format.

`C.AND` computes the bitwise `AND` of the values in registers_rd′_ and _rs2′_, then writes the result to register _rd′_. `C.AND` expands into`and rd′, rd′, rs2′`.

`C.OR` computes the bitwise `OR` of the values in registers_rd′_ and _rs2′_, then writes the result to register _rd′_. `C.OR` expands into`or rd′, rd′, rs2′`.

`C.XOR` computes the bitwise `XOR` of the values in registers_rd′_ and _rs2′_, then writes the result to register _rd′_. `C.XOR` expands into`xor rd′, rd′, rs2′`.

`C.SUB` subtracts the value in register _rs2′_ from the value in register _rd′_, then writes the result to register _rd′_. `C.SUB` expands into`sub rd′, rd′, rs2′`.

`C.ADDW` is an RV64C-only instruction that adds the values in registers _rd′_ and _rs2′_, then sign-extends the lower 32 bits of the sum before writing the result to register _rd′_. `C.ADDW` expands into`addw rd′, rd′, rs2′`.

`C.SUBW` is an RV64C-only instruction that subtracts the value in register _rs2′_ from the value in register_rd′_, then sign-extends the lower 32 bits of the difference before writing the result to register _rd′_.`C.SUBW` expands into `subw rd′, rd′, rs2′`.

| |  This group of six instructions do not provide large savings individually, but do not occupy much encoding space and are straightforward to implement, and as a group provide a worthwhile improvement in static and dynamic compression. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#28-1-5-4-defined-illegal-instruction)28.1.5.4\. Defined Illegal Instruction

![svg](_images/svg-9cde54c08660055fa18c338b2e96302b49cb7a98.svg) 

A 16-bit instruction with all bits zero is permanently reserved as an illegal instruction.

| |  We reserve all-zero instructions to be illegal instructions to help trap attempts to execute zero-ed or non-existent portions of the memory space. The all-zero value should not be redefined in any non-standard extension. Similarly, we reserve instructions with all bits set to 1 (corresponding to very long instructions in the RISC-V variable-length encoding scheme) as illegal to capture another common value seen in non-existent memory regions. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#28-1-5-5-nop-instruction)28.1.5.5\. NOP Instruction

![svg](_images/svg-434d6eda5829ad04680d0622689ab6b207218d23.svg) 

`C.NOP` is a CI-format instruction that does not change any user-visible state, except for advancing the `pc` and incrementing any applicable performance counters. `C.NOP` expands to `nop`. The `C.NOP` code points with _imm_≠0 encode HINTs.

#### [](#28-1-5-6-breakpoint-instruction)28.1.5.6\. Breakpoint Instruction

![svg](_images/svg-27922b9dac22e8a5762388dc50030c283177d2db.svg) 

Debuggers can use the `C.EBREAK` instruction, which expands to `ebreak`, to cause control to be transferred back to the debugging environment.`C.EBREAK` shares the opcode with the `C.ADD` instruction, but with _rd_ and_rs2_ both zero, thus can also use the `CR` format.

### [](#28-1-6-usage-of-c-instructions-in-lrsc-sequences)28.1.6\. Usage of C Instructions in LR/SC Sequences

On implementations that support the C extension, compressed forms of the I instructions permitted inside constrained LR/SC sequences, as described in [HINT Instructions](rv32.html#rv32i-hints), are also permitted inside constrained LR/SC sequences.

| |  The implication is that any implementation that claims to support both the A and C extensions must ensure that LR/SC sequences containing valid C instructions will eventually complete. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#rvc-hints)28.1.7\. HINT Instructions

A portion of the RVC encoding space is reserved for microarchitectural HINTs. Like the HINTs in the RV32I base ISA (see[HINT Instructions](rv32.html#rv32i-hints)), these instructions do not modify any architectural state, except for advancing the `pc` and any applicable performance counters. HINTs are executed as no-ops on implementations that ignore them.

RVC HINTs are encoded as computational instructions that do not modify the architectural state, either because _rd_\=`x0` (e.g.`C.ADD _x0_, _t0_`), or because _rd_ is overwritten with a copy of itself (e.g. `C.ADDI _t0_, 0`).

| |  This HINT encoding has been chosen so that simple implementations can ignore HINTs altogether, and instead execute a HINT as a regular computational instruction that happens not to mutate the architectural state. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

RVC HINTs do not necessarily expand to their RVI HINT counterparts. For example, `C.ADD` _x0_, _a0_ might not encode the same HINT as`ADD` _x0_, _x0_, _a0_.

| |  The primary reason to not require an RVC HINT to expand to an RVI HINT is that HINTs are unlikely to be compressible in the same manner as the underlying computational instruction. Also, decoupling the RVC and RVI HINT mappings allows the scarce RVC HINT space to be allocated to the most popular HINTs, and in particular, to HINTs that are amenable to macro-op fusion. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

[Table 3](#rvc-t-hints) lists all RVC HINT code points. For RV32C, 78% of the HINT space is reserved for standard HINTs. The remainder of the HINT space is designated for custom HINTs; no standard HINTs will ever be defined in this subspace.

__Table 3\. RVC HINT instructions.__
| Instruction | Constraints                     | Code Points          | Purpose                                                                    |
| ----------- | ------------------------------- | -------------------- | -------------------------------------------------------------------------- |
| C.NOP       | _imm_≠0                         | 63                   | _Designated for future standard use_                                       |
| C.ADDI      | _rd_≠x0, _imm_\=0               | 31                   |                                                                            |
| C.LI        | _rd_\=x0                        | 64                   |                                                                            |
| C.LUI       | _rd_\=x0, _imm_≠0               | 63                   |                                                                            |
| C.MV        | _rd_\=x0, _rs2_≠x0              | 31                   |                                                                            |
| C.ADD       | _rd_\=x0, _rs2_≠x0, _rs2_≠x2-x5 | 27                   |                                                                            |
| C.ADD       | _rd_\=x0, _rs2_\=x2-x5          | 4                    | (rs2=x2) C.NTL.P1 (rs2=x3) C.NTL.PALL (rs2=x4) C.NTL.S1 (rs2=x5) C.NTL.ALL |
| C.SLLI      | _rd_\=x0 or _imm_\=0            | 63 (RV32), 95 (RV64) | _Designated for custom use_                                                |
| C.SRLI      | _imm_\=0                        | 8                    |                                                                            |
| C.SRAI      | _imm_\=0                        | 8                    |                                                                            |

### [](#28-1-8-rvc-instruction-set-listings)28.1.8\. RVC Instruction Set Listings

[Table 4](#rvcopcodemap) shows a map of the major opcodes for RVC. Each row of the table corresponds to one quadrant of the encoding space. The last quadrant, which has the two least-significant bits set, corresponds to instructions wider than 16 bits, including those in the base ISAs. Several instructions are only valid for certain operands; when invalid, they are marked either _RES_to indicate that the opcode is reserved for future standard extensions;_Custom_ to indicate that the opcode is designated for custom extensions; or _HINT_ to indicate that the opcode is reserved for microarchitectural hints (see [28.1.7\. HINT Instructions](#rvc-hints)).

__Table 4\. RVC opcode map instructions.__
| inst\[15:13\]inst\[1:0\] | **000**  | **001**    | **010** | **011**      | **100**         | **101**    | **110** | **111**   |          |
| ------------------------ | -------- | ---------- | ------- | ------------ | --------------- | ---------- | ------- | --------- | -------- |
| 00                       | ADDI4SPN | FLDFLD     | LW      | FLWLD        | _Reserved_      | FSDFSD     | SW      | FSWSD     | RV32RV64 |
| 01                       | ADDI     | JALADDIW   | LI      | LUI/ADDI16SP | MISC-ALU        | J          | BEQZ    | BNEZ      | RV32RV64 |
| 10                       | SLLI     | FLDSPFLDSP | LWSP    | FLWSPLDSP    | J\[AL\]R/MV/ADD | FSDSPFSDSP | SWSP    | FSWSPSDSP | RV32RV64 |
| 11                       | \>16b    |            |         |              |                 |            |         |           |          |

[Figure 1](#rvc-instr-table0), [Figure 2](#rvc-instr-table1), and [Figure 3](#rvc-instr-table2) list the RVC instructions.

![Instruction listing for RVC, Quadrant 0](_images/diag-1f91aa9c4226801a769871aec6df542e2f647a16.svg) 

Figure 1\. Instruction listing for RVC, Quadrant 0

![Instruction listing for RVC, Quadrant 1](_images/diag-ac100c399208ef3eb92487b098c395e35d378dbf.svg) 

Figure 2\. Instruction listing for RVC, Quadrant 1

![Instruction listing for RVC, Quadrant 2](_images/diag-8418563ff7fdb02d02c93d904f77a522a33c22e2.svg) 

Figure 3\. Instruction listing for RVC, Quadrant 2

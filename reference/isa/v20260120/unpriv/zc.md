# 29.1. "Zc*" Extension for Code Size Reduction, Version 1.0.0

## [](#Zc)29.1\. "Zc\*" Extension for Code Size Reduction, Version 1.0.0

### [](#29-1-1-zc-overview)29.1.1\. Zc\* Overview

Zc\* is a group of extensions that define subsets of the existing C extension (Zca, Zcd, Zcf) and new extensions which only contain 16-bit encodings.

Zcm\* all reuse the encodings for _c.fld_, _c.fsd_, _c.fldsp_, _c.fsdsp_.

__Table 1\. Zc\* extension overview__
| Instruction                                                                                                                               | Zca  | Zcf | Zcd | Zcb | Zcmp | Zcmt |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---- | --- | --- | --- | ---- | ---- |
| **The Zca extension is added as way to refer to instructions in the C extension that do not include the floating-point loads and stores** |      |     |     |     |      |      |
| C excl. c.f\*                                                                                                                             | yes  |     |     |     |      |      |
| **The Zcf extension is added as a way to refer to compressed single-precision floating-point load/stores**                                |      |     |     |     |      |      |
| c.flw                                                                                                                                     | rv32 |     |     |     |      |      |
| c.flwsp                                                                                                                                   | rv32 |     |     |     |      |      |
| c.fsw                                                                                                                                     | rv32 |     |     |     |      |      |
| c.fswsp                                                                                                                                   | rv32 |     |     |     |      |      |
| **The Zcd extension is added as a way to refer to compressed double-precision floating-point load/stores**                                |      |     |     |     |      |      |
| c.fld                                                                                                                                     | yes  |     |     |     |      |      |
| c.fldsp                                                                                                                                   | yes  |     |     |     |      |      |
| c.fsd                                                                                                                                     | yes  |     |     |     |      |      |
| c.fsdsp                                                                                                                                   | yes  |     |     |     |      |      |
| **Simple operations for use on all architectures**                                                                                        |      |     |     |     |      |      |
| c.lbu                                                                                                                                     | yes  |     |     |     |      |      |
| c.lh                                                                                                                                      | yes  |     |     |     |      |      |
| c.lhu                                                                                                                                     | yes  |     |     |     |      |      |
| c.sb                                                                                                                                      | yes  |     |     |     |      |      |
| c.sh                                                                                                                                      | yes  |     |     |     |      |      |
| c.zext.b                                                                                                                                  | yes  |     |     |     |      |      |
| c.sext.b                                                                                                                                  | yes  |     |     |     |      |      |
| c.zext.h                                                                                                                                  | yes  |     |     |     |      |      |
| c.sext.h                                                                                                                                  | yes  |     |     |     |      |      |
| c.zext.w                                                                                                                                  | yes  |     |     |     |      |      |
| c.mul                                                                                                                                     | yes  |     |     |     |      |      |
| c.not                                                                                                                                     | yes  |     |     |     |      |      |
| **PUSH/POP and double move which overlap with _c.fsdsp_. Complex operations intended for embedded CPUs**                                  |      |     |     |     |      |      |
| cm.push                                                                                                                                   | yes  |     |     |     |      |      |
| cm.pop                                                                                                                                    | yes  |     |     |     |      |      |
| cm.popret                                                                                                                                 | yes  |     |     |     |      |      |
| cm.popretz                                                                                                                                | yes  |     |     |     |      |      |
| cm.mva01s                                                                                                                                 | yes  |     |     |     |      |      |
| cm.mvsa01                                                                                                                                 | yes  |     |     |     |      |      |
| **Table jump which overlaps with _c.fsdsp_. Complex operations intended for embedded CPUs**                                               |      |     |     |     |      |      |
| cm.jt                                                                                                                                     | yes  |     |     |     |      |      |
| cm.jalt                                                                                                                                   | yes  |     |     |     |      |      |

### [](#C)29.1.2\. C

The C extension is the superset of the following extensions:

* Zca
* Zcf if F is specified (RV32 only)
* Zcd if D is specified

As C defines the same instructions as Zca, Zcf, and Zcd, the rule is that:

* C always implies Zca
* C+F implies Zcf (RV32 only)
* C+D implies Zcd

### [](#29-1-3-zce)29.1.3\. Zce

The Zce extension is intended to be used for microcontrollers, and includes all relevant Zc extensions.

* Specifying Zce on RV32 without F includes Zca, Zcb, Zcmp, Zcmt
* Specifying Zce on RV32 with F includes Zca, Zcb, Zcmp, Zcmt _and_ Zcf
* Specifying Zce on RV64 always includes Zca, Zcb, Zcmp, Zcmt  
   * Zcf doesn’t exist for RV64

Therefore common ISA strings can be updated as follows to include the relevant Zc extensions, for example:

* RV32IMC becomes RV32IM\_Zce
* RV32IMCF becomes RV32IMF\_Zce

### [](#misaC)29.1.4\. MISA.C

MISA.C is set if the following extensions are selected:

* Zca and not F
* Zca, Zcf and F (but not D) is specified (RV32 only)
* Zca, Zcf and Zcd if D is specified (RV32 only)  
   * this configuration excludes Zcmp, Zcmt
* Zca, Zcd if D is specified (RV64 only)  
   * this configuration excludes Zcmp, Zcmt

### [](#29-1-5-zca)29.1.5\. Zca

The Zca extension is added as way to refer to instructions in the C extension that do not include the floating-point loads and stores.

Therefore it _excluded_ all 16-bit floating point loads and stores: _c.flw_, _c.flwsp_, _c.fsw_, _c.fswsp_, _c.fld_, _c.fldsp_, _c.fsd_, _c.fsdsp_.

| |  the C extension only includes F/D instructions when D and F are also specified |
| --------------------------------------------------------------------------------- |

### [](#29-1-6-zcf-rv32-only)29.1.6\. Zcf (RV32 only)

Zcf is the existing set of compressed single precision floating point loads and stores: _c.flw_, _c.flwsp_, _c.fsw_, _c.fswsp_.

Zcf is only relevant to RV32, it cannot be specified for RV64.

The Zcf extension depends on the [Zca](#29-1-5-zca) and F extensions.

### [](#29-1-7-zcd)29.1.7\. Zcd

Zcd is the existing set of compressed double precision floating point loads and stores: _c.fld_, _c.fldsp_, _c.fsd_, _c.fsdsp_.

The Zcd extension depends on the [Zca](#29-1-5-zca) and D extensions.

### [](#29-1-8-zcb)29.1.8\. Zcb

Zcb has simple code-size saving instructions which are easy to implement on all CPUs.

All encodings are currently reserved for all architectures, and have no conflicts with any existing extensions.

| |  Zcb can be implemented on _any_ CPU as the instructions are 16-bit versions of existing 32-bit instructions from the application class profile. |
| -------------------------------------------------------------------------------------------------------------------------------------------------- |

The Zcb extension depends on the [Zca](#29-1-5-zca) extension.

As shown on the individual instruction pages, many of the instructions in Zcb depend upon another extension being implemented. For example, _c.mul_ is only implemented if M or Zmmul is implemented, and _c.sext.b_ is only implemented if Zbb is implemented.

The _c.mul_ encoding uses the CA register format along with other instructions such as _c.sub_, _c.xor_ etc.

| |  _c.sext.w_ is a pseudoinstruction for _c.addiw rd, 0_ (RV64) |
| --------------------------------------------------------------- |

| RV32 | RV64            | Mnemonic                                                 | Instruction                                                  |
| ---- | --------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| yes  | yes             | c.lbu _rd'_, uimm(_rs1'_)                                | [Load unsigned byte, 16-bit encoding](#insns-c%5Flbu)        |
| yes  | yes             | c.lhu _rd'_, uimm(_rs1'_)                                | [Load unsigned halfword, 16-bit encoding](#insns-c%5Flhu)    |
| yes  | yes             | c.lh _rd'_, uimm(_rs1'_)                                 | [Load signed halfword, 16-bit encoding](#insns-c%5Flh)       |
| yes  | yes             | c.sb _rs2'_, uimm(_rs1'_)                                | [Store byte, 16-bit encoding](#insns-c%5Fsb)                 |
| yes  | yes             | c.sh _rs2'_, uimm(_rs1'_)                                | [Store halfword, 16-bit encoding](#insns-c%5Fsh)             |
| yes  | yes             | c.zext.b _rsd'_                                          | [Zero extend byte, 16-bit encoding](#insns-c%5Fzext%5Fb)     |
| yes  | yes             | c.sext.b _rsd'_                                          | [Sign extend byte, 16-bit encoding](#insns-c%5Fsext%5Fb)     |
| yes  | yes             | c.zext.h _rsd'_                                          | [Zero extend halfword, 16-bit encoding](#insns-c%5Fzext%5Fh) |
| yes  | yes             | c.sext.h _rsd'_                                          | [Sign extend halfword, 16-bit encoding](#insns-c%5Fsext%5Fh) |
| yes  | c.zext.w _rsd'_ | [Zero extend word, 16-bit encoding](#insns-c%5Fzext%5Fw) |                                                              |
| yes  | yes             | c.not _rsd'_                                             | [Bitwise not, 16-bit encoding](#insns-c%5Fnot)               |
| yes  | yes             | c.mul _rsd'_, _rs2'_                                     | [Multiply, 16-bit encoding](#insns-c%5Fmul)                  |

### [](#Zcmp)29.1.9\. Zcmp

The Zcmp extension is a set of instructions which may be executed as a series of existing 32-bit RISC-V instructions.

This extension reuses some encodings from _c.fsdsp_. Therefore it is _incompatible_ with [Zcd](#29-1-7-zcd), which is included when C and D extensions are both present.

| |  Zcmp is primarily targeted at embedded class CPUs due to implementation complexity. Additionally, it is not compatible with application class profiles. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- |

The Zcmp extension depends on the [Zca](#29-1-5-zca) extension.

The PUSH/POP assembly syntax uses several variables, the meaning of which are:

* _reg\_list_ is a list containing 1 to 13 registers (ra and 0 to 12 s registers)  
   * valid values: {ra}, \\{ra, s0}, \\{ra, s0-s1}, \\{ra, s0-s2}, …​, \\{ra, s0-s8}, \\{ra, s0-s9}, \\{ra, s0-s11}  
   * note that \\{ra, s0-s10} is _not_ valid, giving 12 lists not 13 for better encoding
* _stack\_adj_ is the total size of the stack frame.  
   * valid values vary with register list length and the specific encoding, see the instruction pages for details.

| RV32 | RV64 | Mnemonic                             | Instruction                                                         |
| ---- | ---- | ------------------------------------ | ------------------------------------------------------------------- |
| yes  | yes  | cm.push _{reg\_list}, -stack\_adj_   | [cm.push](#insns-cm%5Fpush)                                         |
| yes  | yes  | cm.pop _{reg\_list}, stack\_adj_     | [cm.pop](#insns-cm%5Fpop)                                           |
| yes  | yes  | cm.popret _{reg\_list}, stack\_adj_  | [cm.popret](#insns-cm%5Fpopret)                                     |
| yes  | yes  | cm.popretz _{reg\_list}, stack\_adj_ | [cm.popretz](#insns-cm%5Fpopretz)                                   |
| yes  | yes  | cm.mva01s _rs1', rs2'_               | [Move two s0-s7 registers into a0-a1](#insns-cm%5Fmva01s)           |
| yes  | yes  | cm.mvsa01 _r1s', r2s'_               | [Move a0-a1 into two different s0-s7 registers](#insns-cm%5Fmvsa01) |

### [](#Zcmt)29.1.10\. Zcmt

Zcmt adds the table jump instructions and also adds the jvt CSR. The jvt CSR requires a state enable if Smstateen is implemented. See [jvt CSR, table jump base vector and control register](#csrs-jvt) for details.

This extension reuses some encodings from _c.fsdsp_. Therefore it is _incompatible_ with [Zcd](#29-1-7-zcd), which is included when C and D extensions are both present.

| |  Zcmt is primarily targeted at embedded class CPUs due to implementation complexity. Additionally, it is not compatible with RVA profiles. |
| -------------------------------------------------------------------------------------------------------------------------------------------- |

The Zcmt extension depends on the [Zca](#29-1-5-zca) and Zicsr extensions.

| RV32 | RV64 | Mnemonic        | Instruction                                 |
| ---- | ---- | --------------- | ------------------------------------------- |
| yes  | yes  | cm.jt _index_   | [Jump via table](#insns-cm%5Fjt)            |
| yes  | yes  | cm.jalt _index_ | [Jump and link via table](#insns-cm%5Fjalt) |

### [](#Zc%5Fformats)29.1.11\. Zc instruction formats

Several instructions in this specification use the following new instruction formats.

| Format | instructions          | 15:10  | 9        | 8      | 7     | 6    | 5  | 4 | 3 | 2 | 1 | 0 |
| ------ | --------------------- | ------ | -------- | ------ | ----- | ---- | -- | - | - | - | - | - |
| CLB    | c.lbu                 | funct6 | rs1'     | uimm   | rd'   | op   |    |   |   |   |   |   |
| CSB    | c.sb                  | funct6 | rs1'     | uimm   | rs2'  | op   |    |   |   |   |   |   |
| CLH    | c.lhu, c.lh           | funct6 | rs1'     | funct1 | uimm  | rd'  | op |   |   |   |   |   |
| CSH    | c.sh                  | funct6 | rs1'     | funct1 | uimm  | rs2' | op |   |   |   |   |   |
| CU     | c.\[sz\]ext.\*, c.not | funct6 | rd'/rs1' | funct5 | op    |      |    |   |   |   |   |   |
| CMMV   | cm.mvsa01 cm.mva01s   | funct6 | r1s'     | funct2 | r2s'  | op   |    |   |   |   |   |   |
| CMJT   | cm.jt cm.jalt         | funct6 | index    | op     |       |      |    |   |   |   |   |   |
| CMPP   | cm.push\*, cm.pop\*   | funct6 | funct2   | urlist | spimm | op   |    |   |   |   |   |   |

| |  c.mul uses the existing CA format. |
| ------------------------------------- |

### [](#Zcb%5Finstructions)29.1.12\. Zcb instructions

#### [](#insns-c%5Flbu)29.1.12.1\. c.lbu

Synopsis

Load unsigned byte, 16-bit encoding

Mnemonic

c.lbu _rd'_, _uimm_(_rs1'_)

Encoding (RV32, RV64):

![svg](_images/svg-1945561bbf8fdcbce6e5b815ad424f2cca0a4ee2.svg) 

The immediate offset is formed as follows:

```sail
  uimm[31:2] = 0;
  uimm[1]    = encoding[5];
  uimm[0]    = encoding[6];
```

Description

This instruction loads a byte from the memory address formed by adding _rs1'_ to the zero extended immediate _uimm_. The resulting byte is zero extended to XLEN bits and is written to _rd'_.

| |  _rd'_ and _rs1'_ are from the standard 8-register set x8-x15. |
| ---------------------------------------------------------------- |

Prerequisites

None

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

X(rdc) = EXTZ(mem[X(rs1c)+EXTZ(uimm)][7..0]);
```

#### [](#insns-c%5Flhu)29.1.12.2\. c.lhu

Synopsis

Load unsigned halfword, 16-bit encoding

Mnemonic

c.lhu _rd'_, _uimm_(_rs1'_)

Encoding (RV32, RV64):

![svg](_images/svg-8e462ffff47c5aa82fa19f1f397053723b490172.svg) 

The immediate offset is formed as follows:

```sail
  uimm[31:2] = 0;
  uimm[1]    = encoding[5];
  uimm[0]    = 0;
```

Description

This instruction loads a halfword from the memory address formed by adding _rs1'_ to the zero extended immediate _uimm_. The resulting halfword is zero extended to XLEN bits and is written to _rd'_.

| |  _rd'_ and _rs1'_ are from the standard 8-register set x8-x15. |
| ---------------------------------------------------------------- |

Prerequisites

None

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

X(rdc) = EXTZ(load_mem[X(rs1c)+EXTZ(uimm)][15..0]);
```

#### [](#insns-c%5Flh)29.1.12.3\. c.lh

Synopsis

Load signed halfword, 16-bit encoding

Mnemonic

c.lh _rd'_, _uimm_(_rs1'_)

Encoding (RV32, RV64):

![svg](_images/svg-c6a953d9d2f7d4ec2703dcfa1c5db61495bb75b8.svg) 

The immediate offset is formed as follows:

```sail
  uimm[31:2] = 0;
  uimm[1]    = encoding[5];
  uimm[0]    = 0;
```

Description

This instruction loads a halfword from the memory address formed by adding _rs1'_ to the zero extended immediate _uimm_. The resulting halfword is sign extended to XLEN bits and is written to _rd'_.

| |  _rd'_ and _rs1'_ are from the standard 8-register set x8-x15. |
| ---------------------------------------------------------------- |

Prerequisites

None

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

X(rdc) = EXTS(load_mem[X(rs1c)+EXTZ(uimm)][15..0]);
```

#### [](#insns-c%5Fsb)29.1.12.4\. c.sb

Synopsis

Store byte, 16-bit encoding

Mnemonic

c.sb _rs2'_, _uimm_(_rs1'_)

Encoding (RV32, RV64):

![svg](_images/svg-35484c3bc40f2c9b43e4d742c5fb67421231517c.svg) 

The immediate offset is formed as follows:

```sail
  uimm[31:2] = 0;
  uimm[1]    = encoding[5];
  uimm[0]    = encoding[6];
```

Description

This instruction stores the least significant byte of _rs2'_ to the memory address formed by adding _rs1'_ to the zero extended immediate _uimm_.

| |  _rs1'_ and _rs2'_ are from the standard 8-register set x8-x15. |
| ----------------------------------------------------------------- |

Prerequisites

None

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

mem[X(rs1c)+EXTZ(uimm)][7..0] = X(rs2c)
```

#### [](#insns-c%5Fsh)29.1.12.5\. c.sh

Synopsis

Store halfword, 16-bit encoding

Mnemonic

c.sh _rs2'_, _uimm_(_rs1'_)

Encoding (RV32, RV64):

![svg](_images/svg-38fe08f2617944263157fae83dc1e8ee853420c7.svg) 

The immediate offset is formed as follows:

```sail
  uimm[31:2] = 0;
  uimm[1]    = encoding[5];
  uimm[0]    = 0;
```

Description

This instruction stores the least significant halfword of _rs2'_ to the memory address formed by adding _rs1'_ to the zero extended immediate _uimm_.

| |  _rs1'_ and _rs2'_ are from the standard 8-register set x8-x15. |
| ----------------------------------------------------------------- |

Prerequisites

None

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

mem[X(rs1c)+EXTZ(uimm)][15..0] = X(rs2c)
```

#### [](#insns-c%5Fzext%5Fb)29.1.12.6\. c.zext.b

Synopsis

Zero extend byte, 16-bit encoding

Mnemonic

c.zext.b _rd'/rs1'_

Encoding (RV32, RV64):

![svg](_images/svg-b57fb9f9a30874c8ef6d75c48a2bfcd91a0f2007.svg) 

Description

This instruction takes a single source/destination operand. It zero-extends the least-significant byte of the operand to XLEN bits by inserting zeros into all of the bits more significant than 7.

| |  _rd'/rs1'_ is from the standard 8-register set x8-x15. |
| --------------------------------------------------------- |

Prerequisites

None

32-bit equivalent:

```asm
andi rd'/rs1', rd'/rs1', 0xff
```

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_. |
| ------------------------------------------------------------ |

Operation

```sail
X(rsdc) = EXTZ(X(rsdc)[7..0]);
```

#### [](#insns-c%5Fsext%5Fb)29.1.12.7\. c.sext.b

Synopsis

Sign extend byte, 16-bit encoding

Mnemonic

c.sext.b _rd'/rs1'_

Encoding (RV32, RV64):

![svg](_images/svg-96ae5e4b8055be3253586a7f7a62bc755050d552.svg) 

Description

This instruction takes a single source/destination operand. It sign-extends the least-significant byte in the operand to XLEN bits by copying the most-significant bit in the byte (i.e., bit 7) to all of the more-significant bits.

| |  _rd'/rs1'_ is from the standard 8-register set x8-x15. |
| --------------------------------------------------------- |

Prerequisites

Zbb is also required.

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_. |
| ------------------------------------------------------------ |

Operation

```sail
X(rsdc) = EXTS(X(rsdc)[7..0]);
```

#### [](#insns-c%5Fzext%5Fh)29.1.12.8\. c.zext.h

Synopsis

Zero extend halfword, 16-bit encoding

Mnemonic

c.zext.h _rd'/rs1'_

Encoding (RV32, RV64):

![svg](_images/svg-0254a498086bad21900c5c3c260e1f8acd534fa7.svg) 

Description

This instruction takes a single source/destination operand. It zero-extends the least-significant halfword of the operand to XLEN bits by inserting zeros into all of the bits more significant than 15.

| |  _rd'/rs1'_ is from the standard 8-register set x8-x15. |
| --------------------------------------------------------- |

Prerequisites

Zbb is also required.

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_. |
| ------------------------------------------------------------ |

Operation

```sail
X(rsdc) = EXTZ(X(rsdc)[15..0]);
```

#### [](#insns-c%5Fsext%5Fh)29.1.12.9\. c.sext.h

Synopsis

Sign extend halfword, 16-bit encoding

Mnemonic

c.sext.h _rd'/rs1'_

Encoding (RV32, RV64):

![svg](_images/svg-8aad6996bcbe2ed79da5157ab38508348bb34780.svg) 

Description

This instruction takes a single source/destination operand. It sign-extends the least-significant halfword in the operand to XLEN bits by copying the most-significant bit in the halfword (i.e., bit 15) to all of the more-significant bits.

| |  _rd'/rs1'_ is from the standard 8-register set x8-x15. |
| --------------------------------------------------------- |

Prerequisites

Zbb is also required.

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_. |
| ------------------------------------------------------------ |

Operation

```sail
X(rsdc) = EXTS(X(rsdc)[15..0]);
```

#### [](#insns-c%5Fzext%5Fw)29.1.12.10\. c.zext.w

Synopsis

Zero extend word, 16-bit encoding

Mnemonic

c.zext.w _rd'/rs1'_

Encoding (RV64):

![svg](_images/svg-b31a255d898b564936ece4f75f0f59e0d87a5a93.svg) 

Description

This instruction takes a single source/destination operand. It zero-extends the least-significant word of the operand to XLEN bits by inserting zeros into all of the bits more significant than 31.

| |  _rd'/rs1'_ is from the standard 8-register set x8-x15. |
| --------------------------------------------------------- |

Prerequisites

Zba is also required.

32-bit equivalent:

```asm
add.uw rd'/rs1', rd'/rs1', zero
```

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_. |
| ------------------------------------------------------------ |

Operation

```sail
X(rsdc) = EXTZ(X(rsdc)[31..0]);
```

#### [](#insns-c%5Fnot)29.1.12.11\. c.not

Synopsis

Bitwise not, 16-bit encoding

Mnemonic

c.not _rd'/rs1'_

Encoding (RV32, RV64):

![svg](_images/svg-1a774fc4390f2953c585722873d64db545ce71f4.svg) 

Description

This instruction takes the one’s complement of _rd'/rs1'_ and writes the result to the same register.

| |  rd'/rs1' is from the standard 8-register set x8-x15. |
| ------------------------------------------------------- |

Prerequisites

None

32-bit equivalent:

```asm
xori rd'/rs1', rd'/rs1', -1
```

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_. |
| ------------------------------------------------------------ |

Operation

```sail
X(rsdc) = X(rsdc) XOR -1;
```

#### [](#insns-c%5Fmul)29.1.12.12\. c.mul

Synopsis

Multiply, 16-bit encoding

Mnemonic

c.mul _rsd'_, _rs2'_

Encoding (RV32, RV64):

![svg](_images/svg-32f838dcac9e0e4e1a9c58f4f1188cd9eed05c19.svg) 

Description

This instruction multiplies XLEN bits of the source operands from _rsd'_ and _rs2'_ and writes the lowest XLEN bits of the result to _rsd'_.

| |  _rd'/rs1'_ and _rs2'_ are from the standard 8-register set x8-x15. |
| --------------------------------------------------------------------- |

Prerequisites

M or Zmmul must be configured.

| |  The SAIL module variable for _rd'/rs1'_ is called _rsdc_, and for _rs2'_ is called _rs2c_. |
| --------------------------------------------------------------------------------------------- |

Operation

```sail
let result_wide = to_bits(2 * sizeof(xlen), signed(X(rsdc)) * signed(X(rs2c)));
X(rsdc) = result_wide[(sizeof(xlen) - 1) .. 0];
```

### [](#insns-pushpop)29.1.13\. PUSH/POP register instructions

These instructions are collectively referred to as PUSH/POP:

* [cm.push](#insns-cm%5Fpush)
* [cm.pop](#insns-cm%5Fpop)
* [cm.popret](#insns-cm%5Fpopret)
* [cm.popretz](#insns-cm%5Fpopretz)

The term PUSH refers to _cm.push_.

The term POP refers to _cm.pop_.

The term POPRET refers to _cm.popret and cm.popretz_.

Common details for these instructions are in this section.

#### [](#29-1-13-1-pushpop-functional-overview)29.1.13.1\. PUSH/POP functional overview

PUSH, POP, POPRET are used to reduce the size of function prologues and epilogues.

1. The PUSH instruction  
   * adjusts the stack pointer to create the stack frame  
   * pushes (stores) the registers specified in the register list to the stack frame
2. The POP instruction  
   * pops (loads) the registers in the register list from the stack frame  
   * adjusts the stack pointer to destroy the stack frame
3. The POPRET instructions  
   * pop (load) the registers in the register list from the stack frame  
   * _cm.popretz_ also moves zero into _a0_ as the return value  
   * adjust the stack pointer to destroy the stack frame  
   * execute a _ret_ instruction to return from the function

#### [](#29-1-13-2-example-usage)29.1.13.2\. Example usage

This example gives an illustration of the use of PUSH and POPRET.

The function _processMarkers_ in the EMBench benchmark picojpeg in the following file on github: [libpicojpeg.c](https://github.com/embench/embench-iot/blob/master/src/picojpeg/libpicojpeg.c)

The prologue and epilogue compile with GCC10 to:

```asm
   0001098a <processMarkers>:
   1098a:       711d                    addi    sp,sp,-96 ;#cm.push(1)
   1098c:       c8ca                    sw      s2,80(sp) ;#cm.push(2)
   1098e:       c6ce                    sw      s3,76(sp) ;#cm.push(3)
   10990:       c4d2                    sw      s4,72(sp) ;#cm.push(4)
   10992:       ce86                    sw      ra,92(sp) ;#cm.push(5)
   10994:       cca2                    sw      s0,88(sp) ;#cm.push(6)
   10996:       caa6                    sw      s1,84(sp) ;#cm.push(7)
   10998:       c2d6                    sw      s5,68(sp) ;#cm.push(8)
   1099a:       c0da                    sw      s6,64(sp) ;#cm.push(9)
   1099c:       de5e                    sw      s7,60(sp) ;#cm.push(10)
   1099e:       dc62                    sw      s8,56(sp) ;#cm.push(11)
   109a0:       da66                    sw      s9,52(sp) ;#cm.push(12)
   109a2:       d86a                    sw      s10,48(sp);#cm.push(13)
   109a4:       d66e                    sw      s11,44(sp);#cm.push(14)
...
   109f4:       4501                    li      a0,0      ;#cm.popretz(1)
   109f6:       40f6                    lw      ra,92(sp) ;#cm.popretz(2)
   109f8:       4466                    lw      s0,88(sp) ;#cm.popretz(3)
   109fa:       44d6                    lw      s1,84(sp) ;#cm.popretz(4)
   109fc:       4946                    lw      s2,80(sp) ;#cm.popretz(5)
   109fe:       49b6                    lw      s3,76(sp) ;#cm.popretz(6)
   10a00:       4a26                    lw      s4,72(sp) ;#cm.popretz(7)
   10a02:       4a96                    lw      s5,68(sp) ;#cm.popretz(8)
   10a04:       4b06                    lw      s6,64(sp) ;#cm.popretz(9)
   10a06:       5bf2                    lw      s7,60(sp) ;#cm.popretz(10)
   10a08:       5c62                    lw      s8,56(sp) ;#cm.popretz(11)
   10a0a:       5cd2                    lw      s9,52(sp) ;#cm.popretz(12)
   10a0c:       5d42                    lw      s10,48(sp);#cm.popretz(13)
   10a0e:       5db2                    lw      s11,44(sp);#cm.popretz(14)
   10a10:       6125                    addi    sp,sp,96  ;#cm.popretz(15)
   10a12:       8082                    ret               ;#cm.popretz(16)
```

with the GCC option _\-msave-restore_ the output is the following:

```asm
0001080e <processMarkers>:
   1080e:       73a012ef                jal     t0,11f48 <__riscv_save_12>
   10812:       1101                    addi    sp,sp,-32
...
   10862:       4501                    li      a0,0
   10864:       6105                    addi    sp,sp,32
   10866:       71e0106f                j       11f84 <__riscv_restore_12>
```

with PUSH/POPRET this reduces to

```asm
0001080e <processMarkers>:
   1080e:       b8fa                    cm.push    \{ra,s0-s11},-96
...
   10866:       bcfa                    cm.popretz \{ra,s0-s11}, 96
```

The prologue / epilogue reduce from 60-bytes in the original code, to 14-bytes with _\-msave-restore_, and to 4-bytes with PUSH and POPRET. As well as reducing the code-size PUSH and POPRET eliminate the branches from calling the millicode _save/restore_ routines and so may also perform better.

| |  The calls to _<riscv\_save\_0>/<riscv\_restore\_0>_ become 64-bit when the target functions are out of the ±1 MB range, increasing the prologue/epilogue size to 22-bytes. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  POP is typically used in tail-calling sequences where _ret_ is not used to return to _ra_ after destroying the stack frame. |
| ------------------------------------------------------------------------------------------------------------------------------ |

##### [](#pushpop-areg-list)29.1.13.2.1\. Stack pointer adjustment handling

The instructions all automatically adjust the stack pointer by enough to cover the memory required for the registers being saved or restored. Additionally the _spimm_ field in the encoding allows the stack pointer to be adjusted in additional increments of 16-bytes. There is only a small restricted range available in the encoding; if the range is insufficient then a separate _c.addi16sp_ can be used to increase the range.

##### [](#29-1-13-2-2-register-list-handling)29.1.13.2.2\. Register list handling

There is no support for the _\\{ra, s0-s10}_ register list without also adding _s11_. Therefore the _\\{ra, s0-s11}_ register list must be used in this case.

#### [](#pushpop-idempotent-memory)29.1.13.3\. PUSH/POP Fault handling

Correct execution requires that _sp_ refers to idempotent memory (also see [Non-idempotent memory handling](#pushpop%5Fnon-idem-mem)), because the core must be able to handle traps detected during the sequence. The entire PUSH/POP sequence is re-executed after returning from the trap handler, and multiple traps are possible during the sequence.

If a trap occurs during the sequence then _xEPC_ is updated with the PC of the instruction, _xTVAL_ (if not read-only-zero) updated with the bad address if it was an access fault and _xCAUSE_ updated with the type of trap.

| |  It is implementation defined whether interrupts can also be taken during the sequence execution. |
| --------------------------------------------------------------------------------------------------- |

#### [](#pushpop-software-view)29.1.13.4\. Software view of execution

##### [](#29-1-13-4-1-software-view-of-the-push-sequence)29.1.13.4.1\. Software view of the PUSH sequence

From a software perspective the PUSH sequence appears as:

* A sequence of stores writing the bytes required by the pseudocode  
   * The bytes may be written in any order.  
   * The bytes may be grouped into larger accesses.  
   * Any of the bytes may be written multiple times.
* A stack pointer adjustment

| |  If an implementation allows interrupts during the sequence, and the interrupt handler uses _sp_ to allocate stack memory, then any stores which were executed before the interrupt may be overwritten by the handler. This is safe because the memory is idempotent and the stores will be re-executed when execution resumes. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The stack pointer adjustment must only be committed only when it is certain that the entire PUSH instruction will commit.

Stores may also return imprecise faults from the bus. It is platform defined whether the core implementation waits for the bus responses before continuing to the final stage of the sequence, or handles errors responses after completing the PUSH instruction.

For example:

```asm
cm.push  \{ra, s0-s5}, -64
```

Appears to software as:

```asm
# any bytes from sp-1 to sp-28 may be written multiple times before
# the instruction completes therefore these updates may be visible in
# the interrupt/exception handler below the stack pointer
sw  s5, -4(sp)
sw  s4, -8(sp)
sw  s3,-12(sp)
sw  s2,-16(sp)
sw  s1,-20(sp)
sw  s0,-24(sp)
sw  ra,-28(sp)

# this must only execute once, and will only execute after all stores
# completed without any precise faults, therefore this update is only
# visible in the interrupt/exception handler if cm.push has completed
addi sp, sp, -64
```

##### [](#29-1-13-4-2-software-view-of-the-poppopret-sequence)29.1.13.4.2\. Software view of the POP/POPRET sequence

From a software perspective the POP/POPRET sequence appears as:

* A sequence of loads reading the bytes required by the pseudocode.  
   * The bytes may be loaded in any order.  
   * The bytes may be grouped into larger accesses.  
   * Any of the bytes may be loaded multiple times.
* A stack pointer adjustment
* An optional `li a0, 0`
* An optional `ret`

If a trap occurs during the sequence, then any loads which were executed before the trap may update architectural state. The loads will be re-executed once the trap handler completes, so the values will be overwritten. Therefore it is permitted for an implementation to update some of the destination registers before taking a fault.

The optional `li a0, 0`, stack pointer adjustment and optional `ret` must only be committed only when it is certain that the entire POP/POPRET instruction will commit.

For POPRET once the stack pointer adjustment has been committed the `ret` must execute.

For example:

```asm
cm.popretz \{ra, s0-s3}, 32;
```

Appears to software as:

```asm
# any or all of these load instructions may execute multiple times
# therefore these updates may be visible in the interrupt/exception handler
lw   s3, 28(sp)
lw   s2, 24(sp)
lw   s1, 20(sp)
lw   s0, 16(sp)
lw   ra, 12(sp)

# these must only execute once, will only execute after all loads
# complete successfully all instructions must execute atomically
# therefore these updates are not visible in the interrupt/exception handler
li a0, 0
addi sp, sp, 32
ret
```

#### [](#pushpop%5Fnon-idem-mem)29.1.13.5\. Non-idempotent memory handling

An implementation may have a requirement to issue a PUSH/POP instruction to non-idempotent memory.

If the core implementation does not support PUSH/POP to non-idempotent memories, the core may use an idempotency PMA to detect it and take a load (POP/POPRET) or store (PUSH) access-fault exception in order to avoid unpredictable results.

Software should only use these instructions on non-idempotent memory regions when software can tolerate the required memory accesses being issued repeatedly in the case that they cause exceptions.

#### [](#29-1-13-6-example-rv32i-pushpop-sequences)29.1.13.6\. Example RV32I PUSH/POP sequences

The examples are included show the load/store series expansion and the stack adjustment. Examples of _cm.popret_ and _cm.popretz_ are not included, as the difference in the expanded sequence from _cm.pop_ is trivial in all cases.

##### [](#29-1-13-6-1-cm-push-ra-s0-s2-64)29.1.13.6.1\. cm.push \\{ra, s0-s2}, -64

Encoding: _rlist_\=7, _spimm_\=3

expands to:

```asm
sw  s2,  -4(sp);
sw  s1,  -8(sp);
sw  s0, -12(sp);
sw  ra, -16(sp);
addi sp, sp, -64;
```

##### [](#29-1-13-6-2-cm-push-ra-s0-s11-112)29.1.13.6.2\. cm.push \\{ra, s0-s11}, -112

Encoding: _rlist_\=15, _spimm_\=3

expands to:

```asm
sw  s11,  -4(sp);
sw  s10,  -8(sp);
sw  s9,  -12(sp);
sw  s8,  -16(sp);
sw  s7,  -20(sp);
sw  s6,  -24(sp);
sw  s5,  -28(sp);
sw  s4,  -32(sp);
sw  s3,  -36(sp);
sw  s2,  -40(sp);
sw  s1,  -44(sp);
sw  s0,  -48(sp);
sw  ra,  -52(sp);
addi sp, sp, -112;
```

##### [](#29-1-13-6-3-cm-pop-ra-16)29.1.13.6.3\. cm.pop {ra}, 16

Encoding: _rlist_\=4, _spimm_\=0

expands to:

```asm
lw   ra, 12(sp);
addi sp, sp, 16;
```

##### [](#29-1-13-6-4-cm-pop-ra-s0-s3-48)29.1.13.6.4\. cm.pop \\{ra, s0-s3}, 48

Encoding: _rlist_\=8, _spimm_\=1

expands to:

```asm
lw   s3, 44(sp);
lw   s2, 40(sp);
lw   s1, 36(sp);
lw   s0, 32(sp);
lw   ra, 28(sp);
addi sp, sp, 48;
```

##### [](#29-1-13-6-5-cm-pop-ra-s0-s4-64)29.1.13.6.5\. cm.pop \\{ra, s0-s4}, 64

Encoding: _rlist_\=9, _spimm_\=2

expands to:

```asm
lw   s4, 60(sp);
lw   s3, 56(sp);
lw   s2, 52(sp);
lw   s1, 48(sp);
lw   s0, 44(sp);
lw   ra, 40(sp);
addi sp, sp, 64;
```

#### [](#insns-cm%5Fpush)29.1.13.7\. cm.push

Synopsis

Create stack frame: store ra and 0 to 12 saved registers to the stack frame, optionally allocate additional stack space.

Mnemonic

cm.push _{reg\_list}, -stack\_adj_

Encoding (RV32, RV64):

![svg](_images/svg-533cc80019c6a1cb3c65758f651a2fe237302279.svg) 

| |  _rlist_ values 0 to 3 are reserved for a future EABI variant called _cm.push.e_ |
| ---------------------------------------------------------------------------------- |

Assembly Syntax:

```asm
cm.push \{reg_list},  -stack_adj
cm.push {xreg_list}, -stack_adj
```

The variables used in the assembly syntax are defined below.

```sail
RV32E:

switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32I, RV64:
switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  case  7: \{reg_list="ra, s0-s2";  xreg_list="x1, x8-x9, x18";}
  case  8: \{reg_list="ra, s0-s3";  xreg_list="x1, x8-x9, x18-x19";}
  case  9: \{reg_list="ra, s0-s4";  xreg_list="x1, x8-x9, x18-x20";}
  case 10: \{reg_list="ra, s0-s5";  xreg_list="x1, x8-x9, x18-x21";}
  case 11: \{reg_list="ra, s0-s6";  xreg_list="x1, x8-x9, x18-x22";}
  case 12: \{reg_list="ra, s0-s7";  xreg_list="x1, x8-x9, x18-x23";}
  case 13: \{reg_list="ra, s0-s8";  xreg_list="x1, x8-x9, x18-x24";}
  case 14: \{reg_list="ra, s0-s9";  xreg_list="x1, x8-x9, x18-x25";}
  //note - to include s10, s11 must also be included
  case 15: \{reg_list="ra, s0-s11"; xreg_list="x1, x8-x9, x18-x27";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32E:

stack_adj_base = 16;
Valid values:
stack_adj      = [16|32|48|64];
```

```sail
RV32I:

switch (rlist) {
  case  4.. 7: stack_adj_base = 16;
  case  8..11: stack_adj_base = 32;
  case 12..14: stack_adj_base = 48;
  case     15: stack_adj_base = 64;
}

Valid values:
switch (rlist) {
  case  4.. 7: stack_adj = [16|32|48| 64];
  case  8..11: stack_adj = [32|48|64| 80];
  case 12..14: stack_adj = [48|64|80| 96];
  case     15: stack_adj = [64|80|96|112];
}
```

```sail
RV64:

switch (rlist) {
  case  4.. 5: stack_adj_base =  16;
  case  6.. 7: stack_adj_base =  32;
  case  8.. 9: stack_adj_base =  48;
  case 10..11: stack_adj_base =  64;
  case 12..13: stack_adj_base =  80;
  case     14: stack_adj_base =  96;
  case     15: stack_adj_base = 112;
}

Valid values:
switch (rlist) {
  case  4.. 5: stack_adj = [ 16| 32| 48| 64];
  case  6.. 7: stack_adj = [ 32| 48| 64| 80];
  case  8.. 9: stack_adj = [ 48| 64| 80| 96];
  case 10..11: stack_adj = [ 64| 80| 96|112];
  case 12..13: stack_adj = [ 80| 96|112|128];
  case     14: stack_adj = [ 96|112|128|144];
  case     15: stack_adj = [112|128|144|160];
}
```

Description

This instruction pushes (stores) the registers in _reg\_list_ to the memory below the stack pointer, and then creates the stack frame by decrementing the stack pointer by _stack\_adj_, including any additional stack space requested by the value of _spimm_.

| |  All ABI register mappings are for the UABI. An EABI version is planned once the EABI is frozen. |
| -------------------------------------------------------------------------------------------------- |

For further information see [PUSH/POP Register Instructions](#insns-pushpop).

Stack Adjustment Calculation:

_stack\_adj\_base_ is the minimum number of bytes, in multiples of 16-byte address increments, required to cover the registers in the list.

_spimm_ is the number of additional 16-byte address increments allocated for the stack frame.

The total stack adjustment represents the total size of the stack frame, which is _stack\_adj\_base_ added to _spimm_ scaled by 16, as defined above.

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists

Operation

The first section of pseudocode may be executed multiple times before the instruction successfully completes.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

if (XLEN==32) bytes=4; else bytes=8;

addr=sp-bytes;
for(i in 27,26,25,24,23,22,21,20,19,18,9,8,1)  {
  //if register i is in xreg_list
  if (xreg_list[i]) {
    switch(bytes) {
      4:  asm("sw x[i], 0(addr)");
      8:  asm("sd x[i], 0(addr)");
    }
    addr-=bytes;
  }
}
```

The final section of pseudocode executes atomically, and only executes if the section above completes without any exceptions or interrupts.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

sp-=stack_adj;
```

#### [](#insns-cm%5Fpop)29.1.13.8\. cm.pop

Synopsis

Destroy stack frame: load ra and 0 to 12 saved registers from the stack frame, deallocate the stack frame.

Mnemonic

cm.pop _{reg\_list}, stack\_adj_

Encoding (RV32, RV64):

![svg](_images/svg-e341cebc191f49bdedf0edde18b625cef6add4ff.svg) 

| |  _rlist_ values 0 to 3 are reserved for a future EABI variant called _cm.pop.e_ |
| --------------------------------------------------------------------------------- |

Assembly Syntax:

```asm
cm.pop \{reg_list},  stack_adj
cm.pop {xreg_list}, stack_adj
```

The variables used in the assembly syntax are defined below.

```sail
RV32E:
switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32I, RV64:
switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  case  7: \{reg_list="ra, s0-s2";  xreg_list="x1, x8-x9, x18";}
  case  8: \{reg_list="ra, s0-s3";  xreg_list="x1, x8-x9, x18-x19";}
  case  9: \{reg_list="ra, s0-s4";  xreg_list="x1, x8-x9, x18-x20";}
  case 10: \{reg_list="ra, s0-s5";  xreg_list="x1, x8-x9, x18-x21";}
  case 11: \{reg_list="ra, s0-s6";  xreg_list="x1, x8-x9, x18-x22";}
  case 12: \{reg_list="ra, s0-s7";  xreg_list="x1, x8-x9, x18-x23";}
  case 13: \{reg_list="ra, s0-s8";  xreg_list="x1, x8-x9, x18-x24";}
  case 14: \{reg_list="ra, s0-s9";  xreg_list="x1, x8-x9, x18-x25";}
  //note - to include s10, s11 must also be included
  case 15: \{reg_list="ra, s0-s11"; xreg_list="x1, x8-x9, x18-x27";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32E:

stack_adj_base = 16;
Valid values:
stack_adj      = [16|32|48|64];
```

```sail
RV32I:

switch (rlist) {
  case  4.. 7: stack_adj_base = 16;
  case  8..11: stack_adj_base = 32;
  case 12..14: stack_adj_base = 48;
  case     15: stack_adj_base = 64;
}

Valid values:
switch (rlist) {
  case  4.. 7: stack_adj = [16|32|48| 64];
  case  8..11: stack_adj = [32|48|64| 80];
  case 12..14: stack_adj = [48|64|80| 96];
  case     15: stack_adj = [64|80|96|112];
}
```

```sail
RV64:

switch (rlist) {
  case  4.. 5: stack_adj_base =  16;
  case  6.. 7: stack_adj_base =  32;
  case  8.. 9: stack_adj_base =  48;
  case 10..11: stack_adj_base =  64;
  case 12..13: stack_adj_base =  80;
  case     14: stack_adj_base =  96;
  case     15: stack_adj_base = 112;
}

Valid values:
switch (rlist) {
  case  4.. 5: stack_adj = [ 16| 32| 48| 64];
  case  6.. 7: stack_adj = [ 32| 48| 64| 80];
  case  8.. 9: stack_adj = [ 48| 64| 80| 96];
  case 10..11: stack_adj = [ 64| 80| 96|112];
  case 12..13: stack_adj = [ 80| 96|112|128];
  case     14: stack_adj = [ 96|112|128|144];
  case     15: stack_adj = [112|128|144|160];
}
```

Description

This instruction pops (loads) the registers in _reg\_list_ from stack memory, and then adjusts the stack pointer by _stack\_adj_.

| |  All ABI register mappings are for the UABI. An EABI version is planned once the EABI is frozen. |
| -------------------------------------------------------------------------------------------------- |

For further information see [PUSH/POP Register Instructions](#insns-pushpop).

Stack Adjustment Calculation:

_stack\_adj\_base_ is the minimum number of bytes, in multiples of 16-byte address increments, required to cover the registers in the list.

_spimm_ is the number of additional 16-byte address increments allocated for the stack frame.

The total stack adjustment represents the total size of the stack frame, which is _stack\_adj\_base_ added to _spimm_ scaled by 16, as defined above.

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists

Operation

The first section of pseudocode may be executed multiple times before the instruction successfully completes.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

if (XLEN==32) bytes=4; else bytes=8;

addr=sp+stack_adj-bytes;
for(i in 27,26,25,24,23,22,21,20,19,18,9,8,1)  {
  //if register i is in xreg_list
  if (xreg_list[i]) {
    switch(bytes) {
      4:  asm("lw x[i], 0(addr)");
      8:  asm("ld x[i], 0(addr)");
    }
    addr-=bytes;
  }
}
```

The final section of pseudocode executes atomically, and only executes if the section above completes without any exceptions or interrupts.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

sp+=stack_adj;
```

#### [](#insns-cm%5Fpopretz)29.1.13.9\. cm.popretz

Synopsis

Destroy stack frame: load ra and 0 to 12 saved registers from the stack frame, deallocate the stack frame, move zero into a0, return to ra.

Mnemonic

cm.popretz _{reg\_list}, stack\_adj_

Encoding (RV32, RV64):

![svg](_images/svg-b3689d303951881df175b71d8b7ec23cbe4dbb3f.svg) 

| |  _rlist_ values 0 to 3 are reserved for a future EABI variant called _cm.popretz.e_ |
| ------------------------------------------------------------------------------------- |

Assembly Syntax:

```sail
cm.popretz \{reg_list},  stack_adj
cm.popretz {xreg_list}, stack_adj
```

```sail
RV32E:
switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32I, RV64:

switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  case  7: \{reg_list="ra, s0-s2";  xreg_list="x1, x8-x9, x18";}
  case  8: \{reg_list="ra, s0-s3";  xreg_list="x1, x8-x9, x18-x19";}
  case  9: \{reg_list="ra, s0-s4";  xreg_list="x1, x8-x9, x18-x20";}
  case 10: \{reg_list="ra, s0-s5";  xreg_list="x1, x8-x9, x18-x21";}
  case 11: \{reg_list="ra, s0-s6";  xreg_list="x1, x8-x9, x18-x22";}
  case 12: \{reg_list="ra, s0-s7";  xreg_list="x1, x8-x9, x18-x23";}
  case 13: \{reg_list="ra, s0-s8";  xreg_list="x1, x8-x9, x18-x24";}
  case 14: \{reg_list="ra, s0-s9";  xreg_list="x1, x8-x9, x18-x25";}
  //note - to include s10, s11 must also be included
  case 15: \{reg_list="ra, s0-s11"; xreg_list="x1, x8-x9, x18-x27";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32E:

stack_adj_base = 16;
Valid values:
stack_adj      = [16|32|48|64];
```

```sail
RV32I:

switch (rlist) {
  case  4.. 7: stack_adj_base = 16;
  case  8..11: stack_adj_base = 32;
  case 12..14: stack_adj_base = 48;
  case     15: stack_adj_base = 64;
}

Valid values:
switch (rlist) {
  case  4.. 7: stack_adj = [16|32|48| 64];
  case  8..11: stack_adj = [32|48|64| 80];
  case 12..14: stack_adj = [48|64|80| 96];
  case     15: stack_adj = [64|80|96|112];
}
```

```sail
RV64:

switch (rlist) {
  case  4.. 5: stack_adj_base =  16;
  case  6.. 7: stack_adj_base =  32;
  case  8.. 9: stack_adj_base =  48;
  case 10..11: stack_adj_base =  64;
  case 12..13: stack_adj_base =  80;
  case     14: stack_adj_base =  96;
  case     15: stack_adj_base = 112;
}

Valid values:
switch (rlist) {
  case  4.. 5: stack_adj = [ 16| 32| 48| 64];
  case  6.. 7: stack_adj = [ 32| 48| 64| 80];
  case  8.. 9: stack_adj = [ 48| 64| 80| 96];
  case 10..11: stack_adj = [ 64| 80| 96|112];
  case 12..13: stack_adj = [ 80| 96|112|128];
  case     14: stack_adj = [ 96|112|128|144];
  case     15: stack_adj = [112|128|144|160];
}
```

Description

This instruction pops (loads) the registers in _reg\_list_ from stack memory, adjusts the stack pointer by _stack\_adj_, moves zero into a0 and then returns to _ra_.

| |  All ABI register mappings are for the UABI. An EABI version is planned once the EABI is frozen. |
| -------------------------------------------------------------------------------------------------- |

For further information see [PUSH/POP Register Instructions](#insns-pushpop).

Stack Adjustment Calculation:

_stack\_adj\_base_ is the minimum number of bytes, in multiples of 16-byte address increments, required to cover the registers in the list.

_spimm_ is the number of additional 16-byte address increments allocated for the stack frame.

The total stack adjustment represents the total size of the stack frame, which is _stack\_adj\_base_ added to _spimm_ scaled by 16, as defined above.

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists

Operation

The first section of pseudocode may be executed multiple times before the instruction successfully completes.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

if (XLEN==32) bytes=4; else bytes=8;

addr=sp+stack_adj-bytes;
for(i in 27,26,25,24,23,22,21,20,19,18,9,8,1)  {
  //if register i is in xreg_list
  if (xreg_list[i]) {
    switch(bytes) {
      4:  asm("lw x[i], 0(addr)");
      8:  asm("ld x[i], 0(addr)");
    }
    addr-=bytes;
  }
}
```

The final section of pseudocode executes atomically, and only executes if the section above completes without any exceptions or interrupts.

| |  The _li a0, 0_ **could** be executed more than once, but is included in the atomic section for convenience. |
| -------------------------------------------------------------------------------------------------------------- |

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

asm("li a0, 0");
sp+=stack_adj;
asm("ret");
```

#### [](#insns-cm%5Fpopret)29.1.13.10\. cm.popret

Synopsis

Destroy stack frame: load ra and 0 to 12 saved registers from the stack frame, deallocate the stack frame, return to ra.

Mnemonic

cm.popret _{reg\_list}, stack\_adj_

Encoding (RV32, RV64):

![svg](_images/svg-6486253fa6b237777186c1b1f2db258728379c24.svg) 

| |  _rlist_ values 0 to 3 are reserved for a future EABI variant called _cm.popret.e_ |
| ------------------------------------------------------------------------------------ |

Assembly Syntax:

```sail
cm.popret \{reg_list},  stack_adj
cm.popret {xreg_list}, stack_adj
```

The variables used in the assembly syntax are defined below.

```sail
RV32E:

switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32I, RV64:

switch (rlist){
  case  4: \{reg_list="ra";         xreg_list="x1";}
  case  5: \{reg_list="ra, s0";     xreg_list="x1, x8";}
  case  6: \{reg_list="ra, s0-s1";  xreg_list="x1, x8-x9";}
  case  7: \{reg_list="ra, s0-s2";  xreg_list="x1, x8-x9, x18";}
  case  8: \{reg_list="ra, s0-s3";  xreg_list="x1, x8-x9, x18-x19";}
  case  9: \{reg_list="ra, s0-s4";  xreg_list="x1, x8-x9, x18-x20";}
  case 10: \{reg_list="ra, s0-s5";  xreg_list="x1, x8-x9, x18-x21";}
  case 11: \{reg_list="ra, s0-s6";  xreg_list="x1, x8-x9, x18-x22";}
  case 12: \{reg_list="ra, s0-s7";  xreg_list="x1, x8-x9, x18-x23";}
  case 13: \{reg_list="ra, s0-s8";  xreg_list="x1, x8-x9, x18-x24";}
  case 14: \{reg_list="ra, s0-s9";  xreg_list="x1, x8-x9, x18-x25";}
  //note - to include s10, s11 must also be included
  case 15: \{reg_list="ra, s0-s11"; xreg_list="x1, x8-x9, x18-x27";}
  default: reserved();
}
stack_adj      = stack_adj_base + spimm * 16;
```

```sail
RV32E:

stack_adj_base = 16;
Valid values:
stack_adj      = [16|32|48|64];
```

```sail
RV32I:

switch (rlist) {
  case  4.. 7: stack_adj_base = 16;
  case  8..11: stack_adj_base = 32;
  case 12..14: stack_adj_base = 48;
  case     15: stack_adj_base = 64;
}

Valid values:
switch (rlist) {
  case  4.. 7: stack_adj = [16|32|48| 64];
  case  8..11: stack_adj = [32|48|64| 80];
  case 12..14: stack_adj = [48|64|80| 96];
  case     15: stack_adj = [64|80|96|112];
}
```

```sail
RV64:

switch (rlist) {
  case  4.. 5: stack_adj_base =  16;
  case  6.. 7: stack_adj_base =  32;
  case  8.. 9: stack_adj_base =  48;
  case 10..11: stack_adj_base =  64;
  case 12..13: stack_adj_base =  80;
  case     14: stack_adj_base =  96;
  case     15: stack_adj_base = 112;
}

Valid values:
switch (rlist) {
  case  4.. 5: stack_adj = [ 16| 32| 48| 64];
  case  6.. 7: stack_adj = [ 32| 48| 64| 80];
  case  8.. 9: stack_adj = [ 48| 64| 80| 96];
  case 10..11: stack_adj = [ 64| 80| 96|112];
  case 12..13: stack_adj = [ 80| 96|112|128];
  case     14: stack_adj = [ 96|112|128|144];
  case     15: stack_adj = [112|128|144|160];
}
```

Description

This instruction pops (loads) the registers in _reg\_list_ from stack memory, adjusts the stack pointer by _stack\_adj_ and then returns to _ra_.

| |  All ABI register mappings are for the UABI. An EABI version is planned once the EABI is frozen. |
| -------------------------------------------------------------------------------------------------- |

For further information see [PUSH/POP Register Instructions](#insns-pushpop).

Stack Adjustment Calculation:

_stack\_adj\_base_ is the minimum number of bytes, in multiples of 16-byte address increments, required to cover the registers in the list.

_spimm_ is the number of additional 16-byte address increments allocated for the stack frame.

The total stack adjustment represents the total size of the stack frame, which is _stack\_adj\_base_ added to _spimm_ scaled by 16, as defined above.

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists

Operation

The first section of pseudocode may be executed multiple times before the instruction successfully completes.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

if (XLEN==32) bytes=4; else bytes=8;

addr=sp+stack_adj-bytes;
for(i in 27,26,25,24,23,22,21,20,19,18,9,8,1)  {
  //if register i is in xreg_list
  if (xreg_list[i]) {
    switch(bytes) {
      4:  asm("lw x[i], 0(addr)");
      8:  asm("ld x[i], 0(addr)");
    }
    addr-=bytes;
  }
}
```

The final section of pseudocode executes atomically, and only executes if the section above completes without any exceptions or interrupts.

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

sp+=stack_adj;
asm("ret");
```

#### [](#insns-cm%5Fmvsa01)29.1.13.11\. cm.mvsa01

Synopsis

Move a0-a1 into two registers of s0-s7

Mnemonic

cm.mvsa01 _r1s'_, _r2s'_

Encoding (RV32, RV64):

![svg](_images/svg-574e9410060980afe1a40696abb82242bf391af8.svg) 

| |  For the encoding to be legal _r1s'_ != _r2s'_. |
| ------------------------------------------------- |

Assembly Syntax:

```asm
cm.mvsa01 r1s', r2s'
```

Description

This instruction moves _a0_ into _r1s'_ and _a1_ into _r2s'_. _r1s'_ and _r2s'_ must be different.The execution is atomic, so it is not possible to observe state where only one of _r1s'_ or _r2s'_ has been updated.

The encoding uses _sreg_ number specifiers instead of _xreg_ number specifiers to save encoding space.The mapping between them is specified in the pseudocode below.

| |  The _s_ register mapping is taken from the UABI, and may not match the currently unratified EABI. _cm.mvsa01.e_ may be included in the future. |
| ------------------------------------------------------------------------------------------------------------------------------------------------- |

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists.

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.
if (RV32E && (r1sc>1 || r2sc>1)) {
  reserved();
}
xreg1 = {r1sc[2:1]>0,r1sc[2:1]==0,r1sc[2:0]};
xreg2 = {r2sc[2:1]>0,r2sc[2:1]==0,r2sc[2:0]};
X[xreg1] = X[10];
X[xreg2] = X[11];
```

#### [](#insns-cm%5Fmva01s)29.1.13.12\. cm.mva01s

Synopsis

Move two s0-s7 registers into a0-a1

Mnemonic

cm.mva01s _r1s'_, _r2s'_

Encoding (RV32, RV64):

![svg](_images/svg-9d9662a432d9c46953c886ebe0772a518e778737.svg) 

Assembly Syntax:

```asm
cm.mva01s r1s', r2s'
```

Description

This instruction moves _r1s'_ into _a0_ and _r2s'_ into _a1_.The execution is atomic, so it is not possible to observe state where only one of _a0_ or _a1_ have been updated.

The encoding uses _sreg_ number specifiers instead of _xreg_ number specifiers to save encoding space.The mapping between them is specified in the pseudocode below.

| |  The _s_ register mapping is taken from the UABI, and may not match the currently unratified EABI. _cm.mva01s.e_ may be included in the future. |
| ------------------------------------------------------------------------------------------------------------------------------------------------- |

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists.

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.
if (RV32E && (r1sc>1 || r2sc>1)) {
  reserved();
}
xreg1 = {r1sc[2:1]>0,r1sc[2:1]==0,r1sc[2:0]};
xreg2 = {r2sc[2:1]>0,r2sc[2:1]==0,r2sc[2:0]};
X[10] = X[xreg1];
X[11] = X[xreg2];
```

### [](#insns-tablejump)29.1.14\. Table Jump Overview

_cm.jt_ ([Jump via table](#insns-cm%5Fjt)) and _cm.jalt_ ([Jump and link via table](#insns-cm%5Fjalt)) are referred to as table jump.

Table jump uses a 256-entry XLEN wide table in instruction memory to contain function addresses. The table must be a minimum of 64-byte aligned.

Table entries follow the current data endianness. This is different from normal instruction fetch which is always little-endian.

_cm.jt_ and _cm.jalt_ encodings index the table, giving access to functions within the full XLEN wide address space.

This is used as a form of dictionary compression to reduce the code size of _jal_ / _auipc+jalr_ / _jr_ / _auipc+jr_ instructions.

Table jump allows the linker to replace the following instruction sequences with a _cm.jt_ or _cm.jalt_ encoding, and an entry in the table:

* 32-bit _j_ calls
* 32-bit _jal_ ra calls
* 64-bit _auipc+jr_ calls to fixed locations
* 64-bit _auipc+jalr ra_ calls to fixed locations  
   * The _auipc+jr/jalr_ sequence is used because the offset from the PC is out of the ±1 MB range.

If a return address stack is implemented, then as _cm.jalt_ is equivalent to _jal ra_, it pushes to the stack.

#### [](#29-1-14-1-jvt)29.1.14.1\. jvt

The base of the table is in the jvt CSR (see [jvt CSR, table jump base vector and control register](#csrs-jvt)), each table entry is XLEN bits.

If the same function is called with and without linking then it must have two entries in the table. This is typically caused by the same function being called with and without tail calling.

#### [](#tablejump-fault-handling)29.1.14.2\. Table Jump Fault handling

For a table jump instruction, the table entry that the instruction selects is considered an extension of the instruction itself. Hence, the execution of a table jump instruction involves two instruction fetches, the first to read the instruction (_cm.jt_/_cm.jalt_) and the second to read from the jump vector table (JVT). Both instruction fetches are _implicit_ reads, and both require execute permission; read permission is irrelevant. It is recommended that the second fetch be ignored for hardware triggers and breakpoints.

Memory writes to the jump vector table require an instruction barrier (_fence.i_) to guarantee that they are visible to the instruction fetch.

Multiple contexts may have different jump vector tables. JVT may be switched between them without an instruction barrier if the tables have not been updated in memory since the last _fence.i_.

If an exception occurs on either instruction fetch, xEPC is set to the PC of the table jump instruction, xCAUSE is set as expected for the type of fault and xTVAL (if not set to zero) contains the fetch address which caused the fault.

#### [](#csrs-jvt)29.1.14.3\. jvt CSR

Synopsis

Table jump base vector and control register

Address:

0x017

Permissions:

URW

Format (RV32):

![svg](_images/svg-f52d7f22ac9cc7a7a4b770c35ab6318f1a1e76aa.svg) 

Format (RV64):

![svg](_images/svg-37d77d1b494eeccc692acc07d7fecc744d801b35.svg) 

Description

The _jvt_ register is an XLEN-bit **WARL** read/write register that holds the jump table configuration, consisting of the jump table base address (BASE) and the jump table mode (MODE).

If [29.1.10\. Zcmt](#Zcmt) is implemented then _jvt_ must also be implemented, but can contain a read-only value. If _jvt_ is writable, the set of values the register may hold can vary by implementation. The value in the BASE field must always be aligned on a 64-byte boundary. Note that the CSR contains only bits XLEN-1 through 6 of the address _base_. When computing jump-table accesses, the lower six bits of _base_ are filled with zeroes to obtain an XLEN-bit jump-table base address _jvt.base_ that is always aligned on a 64-byte boundary.

_jvt.base_ is a virtual address, whenever virtual memory is enabled.

The memory pointed to by _jvt.base_ is treated as instruction memory for the purpose of executing table jump instructions, implying execute access permission.

__Table 2\. _jvt.mode_ definition__
| jvt.mode | Comment                              |
| -------- | ------------------------------------ |
| 000000   | Jump table mode                      |
| others   | **reserved for future standard use** |

_jvt.mode_ is a **WARL** field, so can only be programmed to modes which are implemented. Therefore the discovery mechanism is to attempt to program different modes and read back the values to see which are available. Jump table mode _must_ be implemented.

| |  in future the RISC-V Unified Discovery method will report the available modes. |
| --------------------------------------------------------------------------------- |

Architectural State:

_jvt_ CSR adds architectural state to the system software context (such as an OS process), therefore must be saved/restored on context switches. <<<

#### [](#insns-cm%5Fjt)29.1.14.4\. cm.jt

Synopsis

jump via table

Mnemonic

cm.jt _index_

Encoding (RV32, RV64):

![svg](_images/svg-1071503e2d1f9a15172c6b55a3bf17c42dd2d62d.svg) 

| |  For this encoding to decode as _cm.jt_, _index<32_, otherwise it decodes as _cm.jalt_, see [Jump and link via table](#insns-cm%5Fjalt). |
| ------------------------------------------------------------------------------------------------------------------------------------------ |

| |  If jvt.mode = 0 (Jump Table Mode) then _cm.jt_ behaves as specified here. If jvt.mode is a reserved value, then _cm.jt_ is also reserved. In the future other defined values of jvt.mode may change the behaviour of _cm.jt_. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Assembly Syntax:

```asm
cm.jt index
```

Description

_cm.jt_ reads an entry from the jump vector table in memory and jumps to the address that was read.

For further information see [Table Jump Overview](#insns-tablejump).

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists.

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

# table_address is temporary internal state, it doesn't represent a real register
# InstMemory is byte indexed

switch(XLEN) {
  32:  table_address[XLEN-1:0] = jvt.base + (index<<2);
  64:  table_address[XLEN-1:0] = jvt.base + (index<<3);
}

//fetch from the jump table
pc = InstMemory[table_address][XLEN-1:0]&~0x1;  // Clear bit 0.
```

#### [](#insns-cm%5Fjalt)29.1.14.5\. cm.jalt

Synopsis

jump via table with optional link

Mnemonic

cm.jalt _index_

Encoding (RV32, RV64):

![svg](_images/svg-1071503e2d1f9a15172c6b55a3bf17c42dd2d62d.svg) 

| |  For this encoding to decode as _cm.jalt_, _index>=32_, otherwise it decodes as _cm.jt_, see [Jump via table](#insns-cm%5Fjt). |
| -------------------------------------------------------------------------------------------------------------------------------- |

| |  If jvt.mode = 0 (Jump Table Mode) then _cm.jalt_ behaves as specified here. If jvt.mode is a reserved value, then _cm.jalt_ is also reserved. In the future other defined values of jvt.mode may change the behaviour of _cm.jalt_. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Assembly Syntax:

```asm
cm.jalt index
```

Description

_cm.jalt_ reads an entry from the jump vector table in memory and jumps to the address that was read, linking to _ra_.

For further information see [Table Jump Overview](#insns-tablejump).

Prerequisites

None

32-bit equivalent:

No direct equivalent encoding exists.

Operation

```sail
//This is not SAIL, it's pseudocode. The SAIL hasn't been written yet.

# table_address is temporary internal state, it doesn't represent a real register
# InstMemory is byte indexed

switch(XLEN) {
  32:  table_address[XLEN-1:0] = jvt.base + (index<<2);
  64:  table_address[XLEN-1:0] = jvt.base + (index<<3);
}

//fetch from the jump table

ra = pc+2;
pc = InstMemory[table_address][XLEN-1:0]&~0x1;  // Clear bit 0.
```

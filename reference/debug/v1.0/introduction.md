# 1.1. Introduction

## [](#intro)1.1\. Introduction

When a design progresses from simulation to hardware implementation, a user’s control and understanding of the system’s current state drops dramatically. To help bring up and debug low level software and hardware, it is critical to have good debugging support built into the hardware. When a robust OS is running on a core, software can handle many debugging tasks. However, in many scenarios, hardware support is essential.

This document outlines a standard architecture for debug support on RISC-V hardware platforms. This architecture allows a variety of implementations and tradeoffs, which is complementary to the wide range of RISC-V implementations. At the same time, this specification defines common interfaces to allow debugging tools and components to target a variety of hardware platforms based on the RISC-V ISA.

System designers may choose to add additional hardware debug support, but this specification defines a standard interface for common functionality.

### [](#1-1-1-terminology)1.1.1\. Terminology

**advanced feature**

An advanced feature for advanced users. Most users will not be able to take advantage of it.

**AMO**

Atomic Memory Operation.

**BYPASS**

JTAG instruction that selects a single bit data register, also called BYPASS.

**component**

A RISC-V core, or other part of a hardware platform. Typically all components will be connected to a single system bus.

**CSR**

Control and Status Register.

**DM**

Debug Module (see [debug\_module.adoc#dm](debug%5Fmodule.html#dm)).

**DMI**

Debug Module Interface (see [debug\_module.adoc#dmi](debug%5Fmodule.html#dmi)).

**DR**

JTAG Data Register.

**DTM**

Debug Transport Module (see [dtm.adoc#dtm](dtm.html#dtm)).

**DXLEN**

Debug XLEN, which is the widest XLEN a hart supports, ignoring the current value of `mxl` in `misa`.

**ELP**

Expected landing pad state, define by the Zicfilp extension.

**essential feature**

An essential feature must be present in order for debug to work correctly.

**GPR**

General Purpose Register.

**hardware platform**

A single system consisting of one or more _components_.

**hart**

A hardware thread in a RISC-V core.

**IDCODE**

32-bit Identification CODE, and a JTAG instruction that returns the IDCODE value.

**IR**

JTAG Instruction Register.

**JTAG**

Refers to work done by IEEE’s Joint Test Action Group, described in IEEE 1149.1.

**legacy feature**

A legacy feature should only be implemented to support legacy hardware that is present in a system.

**Minimal RISC-V Debug Specification**

A subset of the full Debug Specification that allows for very small implementations. See [debug\_module.adoc#dm](debug%5Fmodule.html#dm).

**NAPOT**

Naturally Aligned Power-Of-Two.

**NMI**

Non-Maskable Interrupt.

**physical address**

address that is directly usable on the system bus.

**recommended feature**

A recommended feature is not required for debug to work correctly, but it is so useful that it should not be omitted without good reason.

**SBA**

System Bus Access (see [debug\_module.adoc#systembusaccess](debug%5Fmodule.html#systembusaccess)).

**specialized feature**

A specialized feature, that only makes sense in the context of some specific hardware.

**TAP**

Test Access Port, defined in IEEE 1149.1.

**TM**

Trigger Module (see [Sdtrig.adoc#trigger](Sdtrig.html#trigger)).

**virtual address**

An address as a hart sees it. If the hart is using address translation this may be different from the physical address. If there is no translation then it will be the same.

**xepc**

The exception program counter CSR (e.g. `mepc`) that is appropriate for the mode being trapped to.

### [](#1-1-2-context)1.1.2\. Context

This specification attempts to support all RISC-V ISA extensions that have, roughly, been ratified through the first half of 2023\. In particular, though, this specification specifically addresses features in the following extensions:

1. A
2. C
3. D
4. F
5. H
6. Sm1p13
7. Smstateen
8. Ss1p13
9. V
10. Zawrs
11. Zcmp
12. Zicbom
13. Zicbop
14. Zicboz
15. Zicsr

#### [](#1-1-2-1-versions)1.1.2.1\. Versions

Version 0.13 of this document was ratified by the RISC-V Foundation’s board. Versions 0.13.  are bug fix releases to that ratified specification.

Version 0.14 was a working version that was never officially ratified.

Version 1.0 is almost entirely forwards and backwards compatible with Version 0.13.

##### [](#1-1-2-1-1-bugfixes-from-0-13-to-1-0)1.1.2.1.1\. Bugfixes from 0.13 to 1.0

Changes that fix a bug in the spec:

1. Fix order of operations described in [sbdata0](debug%5Fmodule.html#dm-sbdata0).[#392](https://github.com/riscv/riscv-debug-spec/pull/392)
2. Resume ack is set after resume, in [debug\_module.adoc#runcontrol](debug%5Fmodule.html#runcontrol).[#400](https://github.com/riscv/riscv-debug-spec/pull/400)
3. [sselect](Sdtrig.html#textra32-sselect) applies to [svalue](Sdtrig.html#textra32-svalue) . [#402](https://github.com/riscv/riscv-debug-spec/pull/402)
4. [mte](Sdtrig.html#tcontrol-mte) only applies when action=0.[#411](https://github.com/riscv/riscv-debug-spec/pull/411)
5. [aamsize](debug%5Fmodule.html#accessmemory-aamsize) does not affect Argument Width.[#420](https://github.com/riscv/riscv-debug-spec/pull/420)
6. Clarify that harts halt out of reset if [haltreq](debug%5Fmodule.html#dmcontrol-haltreq) \=1.[#419](https://github.com/riscv/riscv-debug-spec/pull/419)

##### [](#1-1-2-1-2-incompatible-changes-from-0-13-to-1-0)1.1.2.1.2\. Incompatible Changes from 0.13 to 1.0

Changes that are not backwards-compatible. Debuggers or hardware implementations that implement 0.13 will have to change something in order to implement 1.0:

1. Make haltsum0 optional if there is only one hart.[#505](https://github.com/riscv/riscv-debug-spec/pull/505)
2. System bus autoincrement only happens if an access actually takes place. ([sbdata0](debug%5Fmodule.html#dm-sbdata0)) [#507](https://github.com/riscv/riscv-debug-spec/pull/507)
3. Bump [version](Sdtrig.html#tinfo-version) to 3\. [#512](https://github.com/riscv/riscv-debug-spec/pull/512)
4. Require debugger to poll [dmactive](debug%5Fmodule.html#dmcontrol-dmactive) after lowering it.[#566](https://github.com/riscv/riscv-debug-spec/pull/566)
5. Add [pending](Sdtrig.html#icount-pending) to [icount](Sdtrig.html#csr-icount) . [#574](https://github.com/riscv/riscv-debug-spec/pull/574)
6. When a selected trigger is disabled, [tdata2](Sdtrig.html#csr-tdata2) and [tdata3](Sdtrig.html#csr-tdata3) can be written with any value supported by any of the types this trigger supports.[#721](https://github.com/riscv/riscv-debug-spec/pull/721)
7. [tcontrol](Sdtrig.html#csr-tcontrol) fields only apply to breakpoint traps, not any trap.[#723](https://github.com/riscv/riscv-debug-spec/pull/723)
8. If [version](Sdtrig.html#tinfo-version) is greater than 0, then [hit0](Sdtrig.html#mcontrol6-hit0) (previously called [mcontrol6](Sdtrig.html#csr-mcontrol6).`hit`) now contains 0 when a trigger fires more than one instruction after the instruction that matched. (This information is now reflected in [hit1](Sdtrig.html#mcontrol6-hit1).)[#795](https://github.com/riscv/riscv-debug-spec/pull/795)
9. If [version](Sdtrig.html#tinfo-version) is greater than 0, then bit 20 of [mcontrol6](Sdtrig.html#csr-mcontrol6) is no longer used for timing information. (Previously the bit was called [mcontrol6](Sdtrig.html#csr-mcontrol6).`timing`.)[#807](https://github.com/riscv/riscv-debug-spec/pull/807)
10. If [version](Sdtrig.html#tinfo-version) is greater than 0, then the encodings of [size](Sdtrig.html#mcontrol6-size) for sizes greater than 64 bit have changed.[#807](https://github.com/riscv/riscv-debug-spec/pull/807)

##### [](#1-1-2-1-3-minor-changes-from-0-13-to-1-0)1.1.2.1.3\. Minor Changes from 0.13 to 1.0

Changes that slightly modify defined behavior. Technically backwards incompatible, but unlikely to be noticeable:

1. [stopcount](Sdext.html#dcsr-stopcount) only applies to hart-local counters.[#405](https://github.com/riscv/riscv-debug-spec/pull/405)
2. [version](debug%5Fmodule.html#dmstatus-version) may be invalid when [dmactive](debug%5Fmodule.html#dmcontrol-dmactive)\=0.[#414](https://github.com/riscv/riscv-debug-spec/pull/414)
3. Address triggers ([mcontrol](Sdtrig.html#csr-mcontrol)) may fire on any accessed address.[#421](https://github.com/riscv/riscv-debug-spec/pull/421)
4. All Trigger Module registers ([\[tab:trigger\]](#tab:trigger)) are optional. [#431](https://github.com/riscv/riscv-debug-spec/pull/431)
5. When extending IR, [bypass](dtm.html#dtm-bypass) still is all ones.[#437](https://github.com/riscv/riscv-debug-spec/pull/437)
6. [ebreaks](Sdext.html#dcsr-ebreaks) and [ebreaku](Sdext.html#dcsr-ebreaku) are WARL. [#458](https://github.com/riscv/riscv-debug-spec/pull/458)
7. NMIs are disabled by [stepie](Sdext.html#dcsr-stepie).[#465](https://github.com/riscv/riscv-debug-spec/pull/465)
8. R/W1C fields should be cleared by writing every bit high.[#472](https://github.com/riscv/riscv-debug-spec/pull/472)
9. Specify trigger priorities in [Sdtrig.adoc#tab:priority](Sdtrig.html#tab:priority) relative to exceptions.[#478](https://github.com/riscv/riscv-debug-spec/pull/478)
10. Time may pass before [dmactive](debug%5Fmodule.html#dmcontrol-dmactive) becomes high.[#500](https://github.com/riscv/riscv-debug-spec/pull/500)
11. Clear MPRV when resuming into lower privilege mode.[#503](https://github.com/riscv/riscv-debug-spec/pull/503)
12. Halt state may not be preserved across reset.[#504](https://github.com/riscv/riscv-debug-spec/pull/504)
13. Hardware should clear trigger action when [dmode](Sdtrig.html#tdata1-dmode) is cleared and action is 1.[#501](https://github.com/riscv/riscv-debug-spec/pull/501)
14. Change quick access exceptions to halt the target in [\[ac-quickaccess\]](#ac-quickaccess).[#585](https://github.com/riscv/riscv-debug-spec/pull/585)
15. Writing 0 to [tdata1](Sdtrig.html#csr-tdata1) forces a state where [tdata2](Sdtrig.html#csr-tdata2) and [tdata3](Sdtrig.html#csr-tdata3) are writable.[#598](https://github.com/riscv/riscv-debug-spec/pull/598)
16. Solutions to deal with reentrancy in [Sdtrig.adoc#nativetrigger](Sdtrig.html#nativetrigger) prevent triggers from_matching_, not merely _firing_. This primarily affects [icount](Sdtrig.html#csr-icount) behavior.[#722](https://github.com/riscv/riscv-debug-spec/pull/722)
17. Attempts to access an unimplemented CSR raise an illegal instruction exception. [#791](https://github.com/riscv/riscv-debug-spec/pull/791)

##### [](#1-1-2-1-4-new-features-from-0-13-to-1-0)1.1.2.1.4\. New Features from 0.13 to 1.0

New backwards-compatible feature that did not exist before:

1. Add halt groups and external triggers in [debug\_module.adoc#hrgroups](debug%5Fmodule.html#hrgroups).[#404](https://github.com/riscv/riscv-debug-spec/pull/404)
2. Reserve some DMI space for non-standard use. See [custom](debug%5Fmodule.html#dm-custom), and [custom0](debug%5Fmodule.html#dm-custom0) through `custom15`.[#406](https://github.com/riscv/riscv-debug-spec/pull/406)
3. Reserve trigger [type](Sdtrig.html#tdata1-type) values for non-standard use.[#417](https://github.com/riscv/riscv-debug-spec/pull/417)
4. Add [nmi](Sdtrig.html#itrigger-nmi) bit to [itrigger](Sdtrig.html#csr-itrigger). [#408](https://github.com/riscv/riscv-debug-spec/pull/408)and [#709](https://github.com/riscv/riscv-debug-spec/pull/709)
5. Recommend matching on every accessed address.[#449](https://github.com/riscv/riscv-debug-spec/pull/449)
6. Add resume groups in [debug\_module.adoc#hrgroups](debug%5Fmodule.html#hrgroups).[#506](https://github.com/riscv/riscv-debug-spec/pull/506)
7. Add [relaxedpriv](debug%5Fmodule.html#abstractcs-relaxedpriv) . [#536](https://github.com/riscv/riscv-debug-spec/pull/536)
8. Move [scontext](Sdtrig.html#csr-scontext), renaming original to [mscontext](Sdtrig.html#csr-mscontext), and create [hcontext](Sdtrig.html#csr-hcontext).[#535](https://github.com/riscv/riscv-debug-spec/pull/535)
9. Add [mcontrol6](Sdtrig.html#csr-mcontrol6), deprecating [mcontrol](Sdtrig.html#csr-mcontrol).[#538](https://github.com/riscv/riscv-debug-spec/pull/538)
10. Add hypervisor support: [ebreakvs](Sdext.html#dcsr-ebreakvs), [ebreakvu](Sdext.html#dcsr-ebreakvu), [v](Sdext.html#dcsr-v), [hcontext](Sdtrig.html#csr-hcontext), [mcontrol](Sdtrig.html#csr-mcontrol), [mcontrol6](Sdtrig.html#csr-mcontrol6), and [priv](Sdext.html#virt-priv).[#549](https://github.com/riscv/riscv-debug-spec/pull/549)
11. Optionally make [anyunavail](debug%5Fmodule.html#dmstatus-anyunavail) and [allunavail](debug%5Fmodule.html#dmstatus-allunavail) sticky, controlled by [stickyunavail](debug%5Fmodule.html#dmstatus-stickyunavail).[#520](https://github.com/riscv/riscv-debug-spec/pull/520)
12. Add [tmexttrigger](Sdtrig.html#csr-tmexttrigger) to support trigger module external trigger inputs.[#543](https://github.com/riscv/riscv-debug-spec/pull/543)
13. Describe [mcontrol](Sdtrig.html#csr-mcontrol) and [mcontrol6](Sdtrig.html#csr-mcontrol6) behavior with atomic instructions.[#561](https://github.com/riscv/riscv-debug-spec/pull/561)
14. Trigger hit bits must be set on fire, may be set on match.[#593](https://github.com/riscv/riscv-debug-spec/pull/593)
15. Add [sbytemask](Sdtrig.html#textra32-sbytemask) and [sbytemask](Sdtrig.html#textra32-sbytemask) to [textra32](Sdtrig.html#csr-textra32) and [textra64](Sdtrig.html#csr-textra64).[#588](https://github.com/riscv/riscv-debug-spec/pull/588)
16. Allow debugger to request harts stay alive with keepalive bit in[setkeepalive](debug%5Fmodule.html#dmcontrol-setkeepalive).[#592](https://github.com/riscv/riscv-debug-spec/pull/592)
17. Add [ndmresetpending](debug%5Fmodule.html#dmstatus-ndmresetpending) to allow a debugger to determine when ndmreset is complete.[#594](https://github.com/riscv/riscv-debug-spec/pull/594)
18. Add [intctl](Sdtrig.html#tmexttrigger-intctl) to support triggers from an interrupt controller.[#599](https://github.com/riscv/riscv-debug-spec/pull/599)

##### [](#1-1-2-1-5-incompatible-changes-during-1-0-stable)1.1.2.1.5\. Incompatible Changes During 1.0 Stable

Backwards-incompatible changes between two versions that are both called 1.0 stable.

1. [nmi](Sdtrig.html#itrigger-nmi) was moved from [etrigger](Sdtrig.html#csr-etrigger) to [itrigger](Sdtrig.html#csr-itrigger), and is now subject to the mode bits in that trigger.
2. [#728](https://github.com/riscv/riscv-debug-spec/pull/728) introduced Message Registers, which were later removed in[#878](https://github.com/riscv/riscv-debug-spec/pull/878).
3. It may not be possible to read the contents of the Program Buffer using the `progbuf` registers.[#731](https://github.com/riscv/riscv-debug-spec/pull/731)
4. [tcontrol](Sdtrig.html#csr-tcontrol) fields apply to all traps, not just breakpoint traps. This reverts[#723](https://github.com/riscv/riscv-debug-spec/pull/723).[#880](https://github.com/riscv/riscv-debug-spec/pull/880)

##### [](#1-1-2-1-6-incompatible-changes-between-1-0-0-rc1-and-1-0-0-rc2)1.1.2.1.6\. Incompatible Changes Between 1.0.0-rc1 and 1.0.0-rc2

Backwards-incompatible changes between 1.0.0-rc1 and 1.0.0-rc2.

1. [#981](https://github.com/riscv/riscv-debug-spec/pull/981) made[scontext](Sdtrig.html#csr-scontext).[data](Sdtrig.html#scontext-data), [mcontext](Sdtrig.html#csr-mcontext).[hcontext](Sdtrig.html#mcontext-hcontext),[sbytemask](Sdtrig.html#textra64-sbytemask), and [textra64](Sdtrig.html#csr-textra64).`svalue` narrower. This avoids confusion about the contents of [scontext](Sdtrig.html#csr-scontext) and [mcontext](Sdtrig.html#csr-mcontext) when XLEN is reduced and increased again.

### [](#1-1-3-about-this-document)1.1.3\. About This Document

#### [](#1-1-3-1-structure)1.1.3.1\. Structure

This document contains two parts. The main part of the document is the specification, which is given in the numbered chapters. The second part of the document is a set of appendices. The information in the appendices is intended to clarify and provide examples, but is not part of the actual specification.

#### [](#1-1-3-2-isa-vs-non-isa)1.1.3.2\. ISA vs. non-ISA

This specification contains both ISA and non-ISA parts. The ISA parts define self-contained ISA extensions. The other parts of the document describe the non-ISA external debug extension. Chapters whose contents are solely one or the other are labeled as such in their title. Chapters without such a label apply to both ISA and non-ISA.

#### [](#1-1-3-3-register-definition-format)1.1.3.3\. Register Definition Format

All register definitions in this document follow the format shown below. A simple graphic shows which fields are in the register. The upper and lower bit indices are shown to the top left and top right of each field. The total number of bits in the field are shown below it.

After the graphic follows a table which for each field lists its name, description, allowed accesses, and reset value. The allowed accesses are listed in [Table 1](#tab:access). The reset value is either a constant or "Preset." The latter means it is an implementation-specific legal value.

Parts of the register which are currently unused are labeled with the number 0\. Software must only write 0 to those fields, and ignore their value while reading. Hardware must return 0 when those fields are read, and ignore the value written to them.

| |  This behavior enables us to use those fields later without having to increase the values in the version fields. |
| ------------------------------------------------------------------------------------------------------------------ |

Names of registers and their fields are hyperlinks to their definition, and are also listed in the [\[index\]](#index).

##### [](#shortname)Long Name (shortname, at 0x123)

![Diagram](_images/diag-308495061acf103c26ff9e0b21b6ae8d4bcabb4f.svg) 

| Field | Description                                 | Access  | Reset |
| ----- | ------------------------------------------- | ------- | ----- |
| field | Description of what this field is used for. | **R/W** | 15    |

__Table 1\. Register Access Abbreviations__
| R     | Read-only.                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R/W   | Read/Write.                                                                                                                                       |
| R/W1C | Read/Write Ones to Clear. Writing 0 to every bit has no effect. Writing 1 to every bit clears the field. The result of other writes is undefined. |
| WARZ  | Write any, read zero. A debugger may write any value. When read this field returns 0.                                                             |
| W1    | Write-only. Only writing 1 has an effect. When read the returned value should be 0.                                                               |
| WARL  | Write any, read legal. A debugger may write any value. If a value is unsupported, the implementation converts the value to one that is supported. |

### [](#1-1-4-background)1.1.4\. Background

There are several use cases for dedicated debugging hardware, both in native debug and external debug. Native debug (sometimes called self-hosted debug) refers to debug software running on a RISC-V platform which debugs the same platform. The optional Trigger Module provides features that are useful for native debug. External debug refers to debug software running somewhere else, debugging the RISC-V platform via a debug transport like JTAG. The entire document provides features that are useful for external debug.

This specification addresses the use cases listed below. Implementations can choose not to implement every feature, which means some use cases might not be supported.

* Accessing hardware on a hardware platform without a working CPU. (External debug.)
* Bootstrapping a hardware platform to test, configure, and program components before there is any executable code path in the hardware platform. (External debug.)
* Debugging low-level software in the absence of an OS or other software. (External debug.)
* Debugging issues in the OS itself. (External or native debug.)
* Debugging processes running on an OS. (Native or external debug.)

### [](#1-1-5-supported-features)1.1.5\. Supported Features

The debug interface described in this specification supports the following features:

1. All hart registers (including CSRs) can be read/written.
2. Memory can be accessed either from the hart’s point of view, through the system bus directly, or both.
3. RV32, RV64, and future RV128 are all supported.
4. Any hart in the hardware platform can be independently debugged.
5. A debugger can discover almost \[[1](#%5Ffootnotedef%5F1 "View footnote.")\] everything it needs to know itself, without user configuration.
6. Each hart can be debugged from the very first instruction executed.
7. A RISC-V hart can be halted when a software breakpoint instruction is executed.
8. Hardware single-step can execute one instruction at a time.
9. Debug functionality is independent of the debug transport used.
10. The debugger does not need to know anything about the microarchitecture of the harts it is debugging.
11. Arbitrary subsets of harts can be halted and resumed simultaneously. (Optional)
12. Arbitrary instructions can be executed on a halted hart. That means no new debug functionality is needed when a core has additional or custom instructions or state, as long as there exist programs that can move that state into GPRs. (Optional)
13. Registers can be accessed without halting. (Optional)
14. A running hart can be directed to execute a short sequence of instructions, with little overhead. (Optional)
15. A system bus manager allows memory access without involving any hart. (Optional)
16. A RISC-V hart can be halted when a trigger matches the PC, read/write address/data, or an instruction opcode. (Optional)
17. Harts can be grouped, and harts in the same group will all halt when any of them halts. These groups can also react to or notify external triggers. (Optional)

This document does not suggest a strategy or implementation for hardware test, debugging or error detection techniques. Scan, built-in self test (BIST), etc. are out of scope of this specification, but this specification does not intend to limit their use in RISC-V systems.

It is possible to debug code that uses software threads, but there is no special debug support for it.

---

[1](#%5Ffootnoteref%5F1). Notable exceptions include information about the memory map and peripherals.

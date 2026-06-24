# 5.1. RVI20 Profiles

## [](#5-1-rvi20-profiles)5.1\. RVI20 Profiles

The RVI20 profiles document the initial set of unprivileged instructions. These provide a generic target for software toolchains and represent the minimum level of compatibility with RISC-V ratified standards. The two profiles RVI20U32 and RVI20U64 correspond to the RV32I and RV64I base ISAs respectively.

| |  These are designed as _unprivileged_ profiles as opposed to_user_\-_mode_ profiles. Code using this profile can run in any privilege mode, and so requested and fatal traps may be horizontal traps into an execution environment running in the same privilege mode. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

### [](#5-1-1-rvi20u32)5.1.1\. RVI20U32

RVI20U32 specifies the ISA features available to generic unprivileged execution environments.

#### [](#5-1-1-1-rvi20u32-mandatory-base)5.1.1.1\. RVI20U32 Mandatory Base

RV32I is the mandatory base ISA for RVI20U32, and is little-endian.

As per the unprivileged architecture specification, the `ecall`instruction causes a requested trap to the execution environment.

Misaligned loads and stores might not be supported.

The `fence.tso` instruction is mandatory.

| |  The fence.tso instruction was incorrectly described as optional in the 2019 ratified specifications. However, fence.tso is encoded within the standard fence encoding such that implementations must treat it as a simple global fence if they do not natively support TSO-ordering optimizations. As software can always assume without any penalty that fence.tso is being exploited by a hardware implementation, there is no advantage to making the instruction an option. Later versions of the unprivileged ISA specifications correctly indicate that fence.tso is mandatory. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#5-1-1-2-rvi20u32-mandatory-extensions)5.1.1.2\. RVI20U32 Mandatory Extensions

There are no mandatory extensions for RVI20U32.

#### [](#5-1-1-3-rvi20u32-optional-extensions)5.1.1.3\. RVI20U32 Optional Extensions

* **M** Integer multiplication and division.
* **A** Atomic instructions.
* **F** Single-precision floating-point instructions.
* **D** Double-precision floating-point instructions.

| |  The rationale to not include Q as an optional extension is that quad-precision floating-point is unlikely to be implemented in hardware, and so we do not require or expect software to expend effort optimizing use of Q instructions in case they are present. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

* **C** Compressed Instructions.
* **Zifencei** Instruction-fetch fence instruction.
* Misaligned loads and stores may be supported.
* **Zicntr** Basic counters.

| |  The Zicsr extension is not supported independent of the Zicntr or F extensions. |
| ---------------------------------------------------------------------------------- |

* **Zihpm** Hardware performance counters.

### [](#5-1-2-rvi20u64)5.1.2\. RVI20U64

RVI20U64 specifies the ISA features available to generic unprivileged execution environments.

#### [](#5-1-2-1-rvi20u64-mandatory-base)5.1.2.1\. RVI20U64 Mandatory Base

RV64I is the mandatory base ISA for RVI20U64, and is little-endian.

As per the unprivileged architecture specification, the `ecall`instruction causes a requested trap to the execution environment.

Misaligned loads and stores might not be supported.

The `fence.tso` instruction is mandatory.

| |  The fence.tso instruction was incorrectly described as optional in the 2019 ratified specifications. However, fence.tso is encoded within the standard fence encoding such that implementations must treat it as a simple global fence if they do not natively support TSO-ordering optimizations. As software can always assume without any penalty that fence.tso is being exploited by a hardware implementation, there is no advantage to making the instruction a profile option. Later versions of the unprivileged ISA specifications correctly indicate that fence.tso is mandatory. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#5-1-2-2-rvi20u64-mandatory-extensions)5.1.2.2\. RVI20U64 Mandatory Extensions

There are no mandatory extensions for RVI20U64.

#### [](#5-1-2-3-rvi20u64-optional-extensions)5.1.2.3\. RVI20U64 Optional Extensions

* **M** Integer multiplication and division.
* **A** Atomic instructions.
* **F** Single-precision floating-point instructions.
* **D** Double-precision floating-point instructions.

| |  The rationale to not include Q as a profile option is that quad-precision floating-point is unlikely to be implemented in hardware, and so we do not require or expect software to expend effort optimizing use of Q instructions in case they are present. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

* **C** Compressed Instructions.
* **Zifencei** Instruction-fetch fence instruction.
* Misaligned loads and stores may be supported.
* **Zicntr** Basic counters.

| |  The Zicsr extension is not supported independent of the Zicntr or F extensions. |
| ---------------------------------------------------------------------------------- |

* **Zihpm** Hardware performance counters.

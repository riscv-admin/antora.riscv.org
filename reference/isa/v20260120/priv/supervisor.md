# 12.1. Supervisor-Level ISA, Version 1.13

## [](#supervisor)12.1\. Supervisor-Level ISA, Version 1.13

This chapter describes the RISC-V supervisor-level architecture, which contains a common core that is used with various supervisor-level address translation and protection schemes.

| |  Supervisor mode is deliberately restricted in terms of interactions with underlying physical hardware, such as physical memory and device interrupts, to support clean virtualization. In this spirit, certain supervisor-level facilities, including requests for timer and interprocessor interrupts, are provided by implementation-specific mechanisms. In some systems, a supervisor execution environment (SEE) provides these facilities in a manner specified by a supervisor binary interface (SBI). Other systems supply these facilities directly, through some other implementation-defined mechanism. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#12-1-1-supervisor-csrs)12.1.1\. Supervisor CSRs

A number of CSRs are provided for the supervisor.

| |  The supervisor should only view CSR state that should be visible to a supervisor-level operating system. In particular, there is no information about the existence (or non-existence) of higher privilege levels (machine level or other) visible in the CSRs accessible by the supervisor. Many supervisor CSRs are a subset of the equivalent machine-mode CSR, and the machine-mode chapter should be read first to help understand the supervisor-level CSR descriptions. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#sstatus)12.1.1.1\. Supervisor Status (`sstatus`) Register

The `sstatus` register is an SXLEN-bit read/write register formatted as shown in [Figure 1](#sstatusreg-rv32) when SXLEN=32 and [Figure 2](#sstatusreg) when SXLEN=64\. The `sstatus`register keeps track of the processor’s current operating state.

![Supervisor-mode status (`sstatus`) register when SXLEN=32.](_images/svg-b6248fe153c498faef45742cc9949e46c7f7bd33.svg) 

Figure 1\. Supervisor-mode status (`sstatus`) register when SXLEN=32.

![Supervisor-mode status (`sstatus`) register when SXLEN=64.](_images/svg-f96a49ba3c356808d7a18da0f227529f7dde5569.svg) 

Figure 2\. Supervisor-mode status (`sstatus`) register when SXLEN=64.

The SPP bit indicates the privilege level at which a hart was executing before entering supervisor mode. When a trap is taken, SPP is set to 0 if the trap originated from user mode, or 1 otherwise. When an SRET instruction (see [Other Privileged Instructions](machine.html#otherpriv)) is executed to return from the trap handler, the privilege level is set to user mode if the SPP bit is 0, or supervisor mode if the SPP bit is 1; SPP is then set to 0.

The SIE bit enables or disables all interrupts in supervisor mode. When SIE is clear, interrupts are not taken while in supervisor mode. When the hart is running in user-mode, the value in SIE is ignored, and supervisor-level interrupts are enabled. The supervisor can disable individual interrupt sources using the `sie` CSR.

The SPIE bit indicates whether supervisor interrupts were enabled prior to trapping into supervisor mode. When a trap is taken into supervisor mode, SPIE is set to SIE, and SIE is set to 0\. When an SRET instruction is executed, SIE is set to SPIE, then SPIE is set to 1.

The `sstatus` register is a subset of the `mstatus` register.

| |  In a straightforward implementation, reading or writing any field insstatus is equivalent to reading or writing the homonymous field inmstatus. |
| -------------------------------------------------------------------------------------------------------------------------------------------------- |

##### [](#12-1-1-1-1-base-isa-control-in-sstatus-register)12.1.1.1.1\. Base ISA Control in `sstatus` Register

The UXL field controls the value of XLEN for U-mode, termed _UXLEN_, which may differ from the value of XLEN for S-mode, termed _SXLEN_. The encoding of UXL is the same as that of the MXL field of `misa`, shown in[Encoding of UXL field in misa](machine.html#norm:misa%5Fmxl%5Fenc).

When SXLEN=32, the UXL field does not exist, and UXLEN=32\. When SXLEN=64, it is a **WARL** field that encodes the current value of UXLEN. In particular, an implementation may make UXL be a read-only field whose value always ensures that UXLEN=SXLEN.

If UXLEN≠SXLEN, instructions executed in the narrower mode must ignore source register operand bits above the configured XLEN, and must sign-extend results to fill the widest supported XLEN in the destination register.

If UXLEN < SXLEN, user-mode instruction-fetch addresses and load and store effective addresses are taken modulo 2UXLEN. For example, when UXLEN=32 and SXLEN=64, user-mode memory accesses reference the lowest 4 GiB of the address space.

Some HINT instructions are encoded as integer computational instructions that overwrite their destination register with its current value, e.g.,`c.addi x8, 0`. When such a HINT is executed with XLEN < SXLEN and bits SXLEN..XLEN of the destination register not all equal to bit XLEN-1, it is implementation-defined whether bits SXLEN..XLEN of the destination register are unchanged or are overwritten with copies of bit XLEN-1.

| |  This definition allows implementations to elide register write-back for some HINTs, while allowing them to execute other HINTs in the same manner as other integer computational instructions. The implementation choice is observable only by S-mode with SXLEN > UXLEN; it is invisible to U-mode. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

##### [](#sum)12.1.1.1.2\. Memory Privilege in `sstatus` Register

The MXR (Make eXecutable Readable) bit modifies the privilege with which loads access virtual memory. When MXR=0, only loads from pages marked readable (R=1 in [Figure 19](#sv32pte)) will succeed. When MXR=1, loads from pages marked either readable or executable (R=1 or X=1) will succeed. MXR has no effect when page-based virtual memory is not in effect.

The SUM (permit Supervisor User Memory access) bit modifies the privilege with which S-mode loads and stores access virtual memory. When SUM=0, S-mode memory accesses to pages that are accessible by U-mode (U=1 in [Figure 19](#sv32pte)) will fault. When SUM=1, these accesses are permitted. SUM has no effect when page-based virtual memory is not in effect, nor when executing in U-mode. Note that S-mode can never execute instructions from user pages, regardless of the state of SUM.

SUM is read-only 0 if `satp`.MODE is read-only 0.

| |  The SUM mechanism prevents supervisor software from inadvertently accessing user memory. Operating systems can execute the majority of code with SUM clear; the few code segments that should access user memory can temporarily set SUM. The SUM mechanism does not avail S-mode software of permission to execute instructions in user code pages. Legitimate use cases for execution from user memory in supervisor context are rare in general and nonexistent in POSIX environments. However, bugs in supervisors that lead to arbitrary code execution are much easier to exploit if the supervisor exploit code can be stored in a user buffer at a virtual address chosen by an attacker. Some non-POSIX single address space operating systems do allow certain privileged software to partially execute in supervisor mode, while most programs run in user mode, all in a shared address space. This use case can be realized by mapping the physical code pages at multiple virtual addresses with different permissions, possibly with the assistance of the instruction page-fault handler to direct supervisor software to use the alternate mapping. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

##### [](#12-1-1-1-3-endianness-control-in-sstatus-register)12.1.1.1.3\. Endianness Control in `sstatus` Register

The UBE bit is a **WARL** field that controls the endianness of explicit memory accesses made from U-mode, which may differ from the endianness of memory accesses in S-mode. An implementation may make UBE be a read-only field that always specifies the same endianness as for S-mode.

UBE controls whether explicit load and store memory accesses made from U-mode are little-endian (UBE=0) or big-endian (UBE=1).

UBE has no effect on instruction fetches, which are _implicit_ memory accesses that are always little-endian.

For _implicit_ accesses to supervisor-level memory management data structures, such as page tables, S-mode endianness always applies and UBE is ignored.

| |  Standard RISC-V ABIs are expected to be purely little-endian-only or big-endian-only, with no accommodation for mixing endianness. Nevertheless, endianness control has been defined so as to permit an OS of one endianness to execute user-mode programs of the opposite endianness. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

##### [](#12-1-1-1-4-previous-expected-landing-pad-elp-state-in-sstatus-register)12.1.1.1.4\. Previous Expected Landing Pad (ELP) State in `sstatus` Register

Access to the `SPELP` field, added by Zicfilp, accesses the homonymous fields of `mstatus` when `V=0`, and the homonymous fields of `vsstatus`when `V=1`.

##### [](#supv-double-trap)12.1.1.1.5\. Double Trap Control in `sstatus` Register

The S-mode-disable-trap (`SDT`) bit is a WARL field introduced by the Ssdbltrp extension to address double trap (See [Double Trap Control in mstatus Register](machine.html#machine-double-trap)) at privilege modes lower than M.

When the `SDT` bit is set to 1 by an explicit CSR write, the `SIE` (Supervisor Interrupt Enable) bit is cleared to 0\. This clearing occurs regardless of the value written, if any, to the `SIE` bit by the same write. The `SIE` bit can only be set to 1 by an explicit CSR write if the `SDT` bit is being set to 0 by the same write or is already 0.

When a trap is to be taken into S-mode, if the `SDT` bit is currently 0, it is then set to 1, and the trap is delivered as expected. However, if `SDT` is already set to 1, then this is an _unexpected trap_. In the event of an_unexpected trap_, a double-trap exception trap is delivered into M-mode. To deliver this trap, the hart writes registers, except `mcause` and `mtval2`, with the same information that the _unexpected trap_ would have written if it was taken into M-mode. The `mtval2` register is then set to what would be otherwise written into the `mcause` register by the _unexpected trap_. The `mcause`register is set to 16, the double-trap exception code.

An `SRET` instruction sets the `SDT` bit to 0.

| |  After a trap handler has saved the state, such as scause, sepc, and stval, needed for resuming from the trap and is reentrant, it should clear the SDT bit. Resetting the SDT by an SRET enables the trap handler to detect a double trap that may occur during the tail phase, where it restores critical state to return from a trap. The consequence of this specification is that if a critical error condition was caused by a guest-page fault, then the GPA will not be available in mtval2when the double trap is delivered to M-mode. This condition arises if the HS-mode invokes a hypervisor virtual-machine load or store instruction whenSDT is 1 and the instruction raises a guest-page fault. The use of such an instruction in this phase of trap handling is not common. However, not recording the GPA is considered benign because, if required, it can still be obtained — albeit with added effort — through the process of walking the page tables. For a double trap that originates in VS-mode, M-mode should redirect the exception to HS-mode by copying the values of M-mode CSRs updated by the trap to HS-mode CSRs and should use an MRET to resume execution at the address in stvec. Supervisor Software Events (SSE), an extension to the SBI, provide a mechanism for supervisor software to register and service system events emanating from an SBI implementation, such as firmware or a hypervisor. In the event of a double trap, HS-mode and M-mode can utilize the SSE mechanism to invoke a critical-error handler in VS-mode or S/HS-mode, respectively. Additionally, the implementation of an SSE protocol can be considered as an optional measure to aid in the recovery from such critical errors. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#12-1-1-2-supervisor-trap-vector-base-address-stvec-register)12.1.1.2\. Supervisor Trap Vector Base Address (`stvec`) Register

The `stvec` register is an SXLEN-bit read/write register that holds trap vector configuration, consisting of a vector base address (BASE) and a vector mode (MODE).

![Supervisor trap vector base address (`stvec`) register.](_images/diag-efe1113b8cf503c82d16fdf049c4d92c5c01cdb6.svg) 

Figure 3\. Supervisor trap vector base address (`stvec`) register.

The BASE field in `stvec` is a field that can hold any valid virtual or physical address, subject to the following alignment constraints: the address must be 4-byte aligned, and MODE settings other than Direct might impose additional alignment constraints on the value in the BASE field.

Note that the CSR contains only bits XLEN-1 through 2 of the address BASE. When used as an address, the lower two bits are filled with zeroes to obtain an XLEN-bit address that is always aligned on a 4-byte boundary.

__Table 1\. Encoding of stvec MODE field.__
| Value | Name           | Description                                                                              |
| ----- | -------------- | ---------------------------------------------------------------------------------------- |
| 01≥2  | DirectVectored | All exceptions set pc to BASE.Asynchronous interrupts set pc to BASE+4×cause. _Reserved_ |

The encoding of the MODE field is shown in[Table 1](#stvec-mode). When MODE=Direct, all traps into supervisor mode cause the `pc` to be set to the address in the BASE field. When MODE=Vectored, all synchronous exceptions into supervisor mode cause the `pc` to be set to the address in the BASE field, whereas interrupts cause the `pc` to be set to the address in the BASE field plus four times the interrupt cause number. For example, a supervisor-mode timer interrupt (see [Table 2](#scauses)) causes the `pc` to be set to BASE+`0x14`. Setting MODE=Vectored may impose a stricter alignment constraint on BASE.

#### [](#12-1-1-3-supervisor-interrupt-sip-and-sie-registers)12.1.1.3\. Supervisor Interrupt (`sip` and `sie`) Registers

The `sip` register is an SXLEN-bit read/write register containing information on pending interrupts, while `sie` is the corresponding SXLEN-bit read/write register containing interrupt enable bits. Interrupt cause number _i_ (as reported in CSR `scause`,[12.1.1.8\. Supervisor Cause (scause) Register](#scause)) corresponds with bit _i_ in both `sip` and`sie`. Bits 15:0 are allocated to standard interrupt causes only, while bits 16 and above are designated for platform use.

![Supervisor interrupt-pending register (`sip`).](_images/diag-b33254286a615a4c40783f32b57dae1d76549bb4.svg) 

Figure 4\. Supervisor interrupt-pending register (`sip`).

![Supervisor interrupt-enable register (`sie`).](_images/diag-b33254286a615a4c40783f32b57dae1d76549bb4.svg) 

Figure 5\. Supervisor interrupt-enable register (`sie`).

An interrupt _i_ will trap to S-mode if both of the following are true: (a) either the current privilege mode is S and the SIE bit in the`sstatus` register is set, or the current privilege mode has less privilege than S-mode; and (b) bit _i_ is set in both `sip` and `sie`.

These conditions for an interrupt trap to occur must be evaluated in a bounded amount of time from when an interrupt becomes, or ceases to be, pending in `sip`, and must also be evaluated immediately following the execution of an SRET instruction or an explicit write to a CSR on which these interrupt trap conditions expressly depend (including `sip`, `sie`and `sstatus`).

Interrupts to S-mode take priority over any interrupts to lower privilege modes.

Each individual bit in register `sip` may be writable or may be read-only. When bit _i_ in `sip` is writable, a pending interrupt _i_can be cleared by writing 0 to this bit. If interrupt _i_ can become pending but bit _i_ in `sip` is read-only, the implementation must provide some other mechanism for clearing the pending interrupt (which may involve a call to the execution environment).

A bit in `sie` must be writable if the corresponding interrupt can ever become pending. Bits of `sie` that are not writable are read-only zero.

The standard portions (bits 15:0) of registers `sip` and `sie` are formatted as shown in Figures [Figure 6](#sipreg-standard)and [Figure 7](#siereg-standard) respectively.

![Standard portion (bits 15:0) of `sip`.](_images/diag-d4ff8af3924ac6455f101b40509ed274c3bbf7cc.svg) 

Figure 6\. Standard portion (bits 15:0) of `sip`.

![Standard portion (bits 15:0) of `sie`.](_images/diag-bdd8f9144ff139ccde485f890014176740dbd614.svg) 

Figure 7\. Standard portion (bits 15:0) of `sie`.

Bits `sip`.SEIP and `sie`.SEIE are the interrupt-pending and interrupt-enable bits for supervisor-level external interrupts. If implemented, SEIP is read-only in `sip`, and is set and cleared by the execution environment, typically through a platform-specific interrupt controller.

Bits `sip`.STIP and `sie`.STIE are the interrupt-pending and interrupt-enable bits for supervisor-level timer interrupts. If implemented, STIP is read-only in`sip`. When the Sstc extension is not implemented, STIP is set and cleared by the execution environment. When the Sstc extension is implemented, STIP reflects the timer interrupt signal resulting from `stimecmp`. The `sip`.STIP bit, in response to timer interrupts generated by `stimecmp`, is set by writing`stimecmp` with a value that is less than or equal to `time`, and is cleared by writing `stimecmp` with a value greater than `time`.

Bits `sip`.SSIP and `sie`.SSIE are the interrupt-pending and interrupt-enable bits for supervisor-level software interrupts. If implemented, SSIP is writable in `sip` and may also be set to 1 by a platform-specific interrupt controller.

If the Sscofpmf extension is implemented, bits `sip`.LCOFIP and `sie`.LCOFIE are the interrupt-pending and interrupt-enable bits for local-counter-overflow interrupts. LCOFIP is read-write in `sip` and reflects the occurrence of a local counter-overflow overflow interrupt request resulting from any of the`mhpmevent_n_`.OF bits being set. If the Sscofpmf extension is not implemented, `sip`.LCOFIP and `sie`.LCOFIE are read-only zeros.

| |  Interprocessor interrupts are sent to other harts by implementation-specific means, which will ultimately cause the SSIP bit to be set in the recipient hart’s sip register. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Each standard interrupt type (SEI, STI, SSI, or LCOFI) may not be implemented, in which case the corresponding interrupt-pending and interrupt-enable bits are read-only zeros. All bits in `sip` and `sie` are **WARL** fields. The implemented interrupts may be found by writing one to every bit location in `sie`, then reading back to see which bit positions hold a one.

| |  The sip and sie registers are subsets of the mip and mieregisters. Reading any implemented field, or writing any writable field, of sip/sie effects a read or write of the homonymous field ofmip/mie. Bits 3, 7, and 11 of sip and sie correspond to the machine-mode software, timer, and external interrupts, respectively. Since most platforms will choose not to make these interrupts delegatable from M-mode to S-mode, they are shown as 0 in[Figure 6](#sipreg-standard) and [Figure 7](#siereg-standard). |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Multiple simultaneous interrupts destined for supervisor mode are handled in the following decreasing priority order: SEI, SSI, STI, LCOFI.

#### [](#12-1-1-4-supervisor-timers-and-performance-counters)12.1.1.4\. Supervisor Timers and Performance Counters

Supervisor software uses the same hardware performance monitoring facility as user-mode software, including the `time`, `cycle`, and`instret` CSRs. The implementation should provide a mechanism to modify the counter values.

The implementation must provide a facility for scheduling timer interrupts in terms of the real-time counter, `time`.

#### [](#12-1-1-5-counter-enable-scounteren-register)12.1.1.5\. Counter-Enable (`scounteren`) Register

![Counter-enable (`scounteren`) register](_images/diag-4f3e88c89fe616d4c5c6fead328f65267e7bbf37.svg) 

Figure 8\. Counter-enable (`scounteren`) register

The counter-enable (`scounteren`) CSR is a 32-bit register that controls the availability of the hardware performance monitoring counters to U-mode.

When the CY, TM, IR, or HPM_n_ bit in the `scounteren` register is clear, attempts to read the `cycle`, `time`, `instret`, or `hpmcountern`register while executing in U-mode will cause an illegal-instruction exception. When one of these bits is set, access to the corresponding register is permitted.

`scounteren` must be implemented. However, any of the bits may be read-only zero, indicating reads to the corresponding counter will cause an exception when executing in U-mode. Hence, they are effectively**WARL** fields.

| |  The setting of a bit in mcounteren does not affect whether the corresponding bit in scounteren is writable. However, U-mode may only access a counter if the corresponding bits in scounteren andmcounteren are both set. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#12-1-1-6-supervisor-scratch-sscratch-register)12.1.1.6\. Supervisor Scratch (`sscratch`) Register

The `sscratch` CSR is an SXLEN-bit read/write register, dedicated for use by the supervisor. Typically, `sscratch` is used to hold a pointer to the hart-local supervisor context while the hart is executing user code. At the beginning of a trap handler, software normally uses a CSRRW instruction to swap `sscratch` with an integer register to obtain an initial working register.

![Supervisor Scratch Register](_images/diag-34cfa3adb3a239400e2c15dbf150614b44e17cf5.svg) 

Figure 9\. Supervisor Scratch Register

#### [](#12-1-1-7-supervisor-exception-program-counter-sepc-register)12.1.1.7\. Supervisor Exception Program Counter (`sepc`) Register

`sepc` is an SXLEN-bit read/write CSR formatted as shown in[Figure 10](#epcreg). The low bit of `sepc` (`sepc[0]`) is always zero. On implementations that support only IALIGN=32, the two low bits (`sepc[1:0]`) are always zero.

If an implementation allows IALIGN to be either 16 or 32 (by changing CSR `misa`, for example), then, whenever IALIGN=32, bit `sepc[1]` is masked on reads so that it appears to be 0\. This masking occurs also for the implicit read by the SRET instruction. Though masked, `sepc[1]`remains writable when IALIGN=32.

`sepc` is a **WARL** register that must be able to hold all valid virtual addresses. It need not be capable of holding all possible invalid addresses. Prior to writing `sepc`, implementations may convert an invalid address into some other invalid address that `sepc` is capable of holding.

When a trap is taken into S-mode, `sepc` is written with the virtual address of the instruction that was interrupted or that encountered the exception. Otherwise, `sepc` is never written by the implementation, though it may be explicitly written by software.

![Supervisor exception program counter register.](_images/diag-770d37cd4c46dfb59cb1d81b0b7b7cc8d673c7b7.svg) 

Figure 10\. Supervisor exception program counter register.

#### [](#scause)12.1.1.8\. Supervisor Cause (`scause`) Register

The `scause` CSR is an SXLEN-bit read-write register formatted as shown in [Figure 11](#scausereg). When a trap is taken into S-mode, `scause` is written with a code indicating the event that caused the trap. Otherwise, `scause` is never written by the implementation, though it may be explicitly written by software.

The Interrupt bit in the `scause` register is set if the trap was caused by an interrupt. The Exception Code field contains a code identifying the last exception or interrupt. [Table 2](#scauses) lists the possible exception codes for the current supervisor ISAs. The Exception Code is a **WLRL** field. It is required to hold the values 0–31 (i.e., bits 4–0 must be implemented), but otherwise it is only guaranteed to hold supported exception codes.

![Supervisor Cause (`scause`) register.](_images/diag-4a4b41b5284beb2d109d680b16f80bb7dd7b4ab0.svg) 

Figure 11\. Supervisor Cause (`scause`) register.

__Table 2\. Supervisor cause (scause) register values after trap. Synchronous exception priorities are given by [Table: Synchronous exception priority in decreasing priority order](machine.html#norm:exc%5Fpriority).__
| Interrupt               | Exception Code                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1111111111              | 012-456-8910-121314-15≥16                               | _Reserved_Supervisor software interrupt _Reserved_Supervisor timer interrupt _Reserved_Supervisor external interrupt _Reserved_Counter-overflow interrupt _Reserved_ _Designated for platform use_                                                                                                                                                                                                                                                   |
| 00000000000000000000000 | 012345678910-111213141516-17181920-2324-3132-4748-63≥64 | Instruction address misalignedInstruction access faultIllegal instructionBreakpointLoad address misalignedLoad access faultStore/AMO address misalignedStore/AMO access faultEnvironment call from U-modeEnvironment call from S-mode _Reserved_Instruction page faultLoad page fault _Reserved_Store/AMO page fault _Reserved_Software checkHardware error _Reserved_ _Designated for custom use_ _Reserved_ _Designated for custom use_ _Reserved_ |

#### [](#12-1-1-9-supervisor-trap-value-stval-register)12.1.1.9\. Supervisor Trap Value (`stval`) Register

The `stval` CSR is an SXLEN-bit read-write register formatted as shown in [Figure 12](#stvalreg). When a trap is taken into S-mode, `stval` is written with exception-specific information to assist software in handling the trap. Otherwise, `stval` is never written by the implementation, though it may be explicitly written by software. The hardware platform will specify which exceptions must set `stval`informatively, which may unconditionally set it to zero, and which may exhibit either behavior, depending on the underlying event that caused the exception.

If `stval` is written with a nonzero value when a breakpoint, address-misaligned, access-fault, page-fault, or hardware-error exception occurs on an instruction fetch, load, or store, then `stval` will contain the faulting virtual address.

On a breakpoint exception raised by an EBREAK or C.EBREAK instruction, `stval`is written with either zero or the virtual address of the instruction.

![Supervisor Trap Value register.](_images/diag-9c289a0641ce933ae2952c317b4ad77c3916d086.svg) 

Figure 12\. Supervisor Trap Value register.

If `stval` is written with a nonzero value when a misaligned load or store causes an access-fault, page-fault, or hardware-error exception, then `stval` will contain the virtual address of the portion of the access that caused the fault.

If `stval` is written with a nonzero value when an instruction access-fault, page-fault, or hardware-error exception occurs on a hart with variable-length instructions, then `stval` will contain the virtual address of the portion of the instruction that caused the fault, while`sepc` will point to the beginning of the instruction.

The `stval` register can optionally also be used to return the faulting instruction bits on an illegal-instruction exception (`sepc` points to the faulting instruction in memory). If `stval` is written with a nonzero value when an illegal-instruction exception occurs, then `stval`will contain the shortest of:

* the actual faulting instruction
* the first ILEN bits of the faulting instruction
* the first SXLEN bits of the faulting instruction

The value loaded into `stval` on an illegal-instruction exception is right-justified and all unused upper bits are cleared to zero.

On a trap caused by a software-check exception, the `stval` register holds the cause for the exception. The following encodings are defined:

* 0 - No information provided.
* 2 - Landing Pad Fault. Defined by the Zicfilp extension ([Landing Pad (Zicfilp)](priv-cfi.html#priv-forward)).
* 3 - Shadow Stack Fault. Defined by the Zicfiss extension ([Shadow Stack (Zicfiss)](priv-cfi.html#priv-backward)).

For other traps, `stval` is set to zero, but a future standard may redefine `stval`’s setting for other traps.

`stval` is a **WARL** register that must be able to hold all valid virtual addresses and the value 0\. It need not be capable of holding all possible invalid addresses. Prior to writing `stval`, implementations may convert an invalid address into some other invalid address that`stval` is capable of holding. If the feature to return the faulting instruction bits is implemented, `stval` must also be able to hold all values less than 2_N_, where _N_ is the smaller of SXLEN and ILEN.

#### [](#sec:senvcfg)12.1.1.10\. Supervisor Environment Configuration (`senvcfg`) Register

The `senvcfg` CSR is an SXLEN-bit read/write register, formatted as shown in [Figure 13](#senvcfg), that controls certain characteristics of the U-mode execution environment.

![Supervisor environment configuration register (`senvcfg`) for RV64.](_images/svg-e86891e9384d8ce0f4bc2f23bc472535422cfa78.svg) 

Figure 13\. Supervisor environment configuration register (`senvcfg`) for RV64.

![Supervisor environment configuration register (`senvcfg`) for RV32.](_images/svg-bcc87728447213cd09f2797ec3b3d2fcfac80d5f.svg) 

Figure 14\. Supervisor environment configuration register (`senvcfg`) for RV32.

If bit FIOM (Fence of I/O implies Memory) is set to one in `senvcfg`, FENCE instructions executed in U-mode are modified so the requirement to order accesses to device I/O implies also the requirement to order main memory accesses. [Table 3](#senvcfg-FIOM) details the modified interpretation of FENCE instruction bits PI, PO, SI, and SO in U-mode when FIOM=1.

Similarly, for U-mode when FIOM=1, if an atomic instruction that accesses a region ordered as device I/O has its _aq_ and/or _rl_ bit set, then that instruction is ordered as though it accesses both device I/O and memory.

If `satp`.MODE is read-only zero (always Bare), the implementation may make FIOM read-only zero.

__Table 3\. Modified interpretation of FENCE predecessor and successor sets in U-mode when FIOM=1.__
| Instruction bit | Meaning when set                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| PIPO            | Predecessor device input and memory reads (PR implied)Predecessor device output and memory writes (PW implied) |
| SISO            | Successor device input and memory reads (SR implied)Successor device output and memory writes (SW implied)     |

| |  Bit FIOM exists for a specific circumstance when an I/O device is being emulated for U-mode and both of the following are true: (a) the emulated device has a memory buffer that should be I/O space but is actually mapped to main memory via address translation, and (b) multiple physical harts are involved in accessing this emulated device from U-mode. A hypervisor running in S-mode without the benefit of the hypervisor extension of ["H" Extension for Hypervisor Support](hypervisor.html#hypervisor) may need to emulate a device for U-mode if paravirtualization cannot be employed. If the same hypervisor provides a virtual machine (VM) with multiple virtual harts, mapped one-to-one to real harts, then multiple harts may concurrently access the emulated device, perhaps because: (a) the guest OS within the VM assigns device interrupt handling to one hart while the device is also accessed by a different hart outside of an interrupt handler, or (b) control of the device (or partial control) is being migrated from one hart to another, such as for interrupt load balancing within the VM. For such cases, guest software within the VM is expected to properly coordinate access to the (emulated) device across multiple harts using mutex locks and/or interprocessor interrupts as usual, which in part entails executing I/O fences. But those I/O fences may not be sufficient if some of the device \`\`I/O'' is actually main memory, unknown to the guest. Setting FIOM=1 modifies those fences (and all other I/O fences executed in U-mode) to include main memory, too. Software can always avoid the need to set FIOM by never using main memory to emulate a device memory buffer that should be I/O space. However, this choice usually requires trapping all U-mode accesses to the emulated buffer, which might have a noticeable impact on performance. The alternative offered by FIOM is sufficiently inexpensive to implement that we consider it worth supporting even if only rarely enabled. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The Zicboz extension adds the `CBZE` (Cache Block Zero instruction enable) field to `senvcfg`. The `CBZE` field controls execution of the cache block zero instruction (`CBO.ZERO`) in U-mode. Execution of `CBO.ZERO` in U-mode is enabled only if execution of the instruction is enabled for use in S-mode and `CBZE` is set to 1; otherwise, an illegal-instruction exception is raised. When the Zicboz extension is not implemented, `CBZE` is read-only zero.

The Zicbom extension adds the `CBCFE` (Cache Block Clean and Flush instruction Enable) field to `senvcfg` to control execution of the `CBO.CLEAN` and`CBO.FLUSH` instructions in U-mode. Execution of these instructions in U-mode is enabled only if execution of these instructions is enabled for use in S-mode and`CBCFE` is set to 1; otherwise, an illegal-instruction exception is raised. When the Zicbom extension is not implemented, `CBCFE` is read-only zero.

The Zicbom extension adds the `CBIE` (Cache Block Invalidate instruction Enable) WARL field to `senvcfg` to control execution of the `CBO.INVAL` instruction in U-mode. The encoding `10b` is reserved. When the Zicbom extension is not implemented, `CBIE` is read-only zero. Execution of `CBO.INVAL` in U-mode is enabled only if execution of the instruction is enabled for use in S-mode and`CBIE` is set to `01b` or `11b`; otherwise, an illegal-instruction exception is raised.

If `CBO.INVAL` is enabled in S-mode to perform a flush operation, then when the instruction is enabled in U-mode it performs a flush operation, even if `CBIE`is set to `11b`. Otherwise, the instruction behaves as follows, depending on the`CBIE` encoding:

* `01b` — The instruction is executed and performs a flush operation.
* `11b` — The instruction is executed and performs an invalidate operation.

If the Ssnpm extension is implemented, the `PMM` field enables or disables pointer masking (see [Pointer Masking Extensions](zpm.html)) for the next-lower privilege mode (U/VU), according to the values in [Table 4](#senvcfg-pmm-values). If Ssnpm is not implemented, `PMM` is read-only zero. The `PMM` field is read-only zero for RV32.

__Table 4\. Legal values of PMM WARL field__
| Value | Description                                                            |
| ----- | ---------------------------------------------------------------------- |
| 00    | Pointer masking is disabled (PMLEN = 0)                                |
| 01    | Reserved                                                               |
| 10    | Pointer masking is enabled with PMLEN = XLEN - 57 (PMLEN = 7 on RV64)  |
| 11    | Pointer masking is enabled with PMLEN = XLEN - 48 (PMLEN = 16 on RV64) |

The Zicfilp extension adds the `LPE` field in `senvcfg`. When the `LPE` field is set to 1, the Zicfilp extension is enabled in VU/U-mode. When the `LPE` field is 0, the Zicfilp extension is not enabled in VU/U-mode and the following rules apply to VU/U-mode:

* The hart does not update the `ELP` state; it remains as `NO_LP_EXPECTED`.
* The `LPAD` instruction operates as a no-op.

The Zicfiss extension adds the `SSE` field in `senvcfg`. When the `SSE` field is set to 1, the Zicfiss extension is activated in VU/U-mode. When the `SSE` field is 0, the Zicfiss extension remains inactive in VU/U-mode, and the following rules apply:

* 32-bit Zicfiss instructions will revert to their behavior as defined by Zimop.
* 16-bit Zicfiss instructions will revert to their behavior as defined by Zcmop.
* When `menvcfg.SSE` is one, `SSAMOSWAP.W/D` raises an illegal-instruction exception in U-mode and a virtual-instruction exception in VU-mode.

#### [](#satp)12.1.1.11\. Supervisor Address Translation and Protection (`satp`) Register

The `satp` CSR is an SXLEN-bit read/write register, formatted as shown in [Figure 15](#rv32satp) for SXLEN=32 and[Figure 16](#rv64satp) for SXLEN=64, which controls supervisor-mode address translation and protection. This register holds the physical page number (PPN) of the root page table, i.e., its supervisor physical address divided by 4 KiB; an address space identifier (ASID), which facilitates address-translation fences on a per-address-space basis; and the MODE field, which selects the current address-translation scheme. Further details on the access to this register are described in [Virtualization Support in mstatus Register](machine.html#virt-control).

![Supervisor address translation and protection (`satp`) register when SXLEN=32.](_images/diag-cf2342eda91ed518cf259a8b38fa84ecda4ac327.svg) 

Figure 15\. Supervisor address translation and protection (`satp`) register when SXLEN=32.

| |  Storing a PPN in satp, rather than a physical address, supports a physical address space larger than 4 GiB for RV32. The satp.PPN field might not be capable of holding all physical page numbers. Some platform standards might place constraints on the valuessatp.PPN may assume, e.g., by requiring that all physical page numbers corresponding to main memory be representable. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

![Supervisor address translation and protection (`satp`) register when SXLEN=64, for MODE values Bare, Sv39, Sv48, and Sv57.](_images/diag-074dc5fbd1ea1c221bf077c8cfa6f508fbbb791c.svg) 

Figure 16\. Supervisor address translation and protection (`satp`) register when SXLEN=64, for MODE values Bare, Sv39, Sv48, and Sv57.

| |  We store the ASID and the page table base address in the same CSR to allow the pair to be changed atomically on a context switch. Swapping them non-atomically could pollute the old virtual address space with new translations, or vice-versa. This approach also slightly reduces the cost of a context switch. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

[Table 5](#satp-mode) shows the encodings of the MODE field when SXLEN=32 and SXLEN=64\. When MODE=Bare, supervisor virtual addresses are equal to supervisor physical addresses, and there is no additional memory protection beyond the physical memory protection scheme described in [Physical Memory Protection](machine.html#pmp). To select MODE=Bare, software must write zero to the remaining fields of `satp` (bits 30–0 when SXLEN=32, or bits 59–0 when SXLEN=64). Attempting to select MODE=Bare with a nonzero pattern in the remaining fields has an UNSPECIFIED effect on the value that the remaining fields assume and an UNSPECIFIED effect on address translation and protection behavior.

When SXLEN=32, the `satp` encodings corresponding to MODE=Bare and ASID\[8:7\]=3 are designated for custom use, whereas the encodings corresponding to MODE=Bare and ASID\[8:7\]≠3 are reserved for future standard use. When SXLEN=64, all `satp` encodings corresponding to MODE=Bare are reserved for future standard use.

| |  Version 1.11 of this standard stated that the remaining fields in satphad no effect when MODE=Bare. Making these fields reserved facilitates future definition of additional translation and protection modes, particularly in RV32, for which all patterns of the existing MODE field have already been allocated. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

When SXLEN=32, the only other valid setting for MODE is Sv32, a paged virtual-memory scheme described in [12.1.3\. Sv32: Page-Based 32-bit Virtual-Memory Systems](#sv32).

When SXLEN=64, three paged virtual-memory schemes are defined: Sv39, Sv48, and Sv57, described in [12.1.4\. Sv39: Page-Based 39-bit Virtual-Memory System](#sv39), [12.1.5\. Sv48: Page-Based 48-bit Virtual-Memory System](#sv48), and [12.1.6\. Sv57: Page-Based 57-bit Virtual-Memory System](#sv57), respectively. One additional scheme, Sv64, will be defined in a later version of this specification. The remaining MODE settings are reserved for future use and may define different interpretations of the other fields in `satp`.

Implementations are not required to support all MODE settings, and if`satp` is written with an unsupported MODE, the entire write has no effect; no fields in `satp` are modified.

The number of ASID bits is UNSPECIFIED and may be zero. The number of implemented ASID bits, termed _ASIDLEN_, may be determined by writing one to every bit position in the ASID field, then reading back the value in `satp` to see which bit positions in the ASID field hold a one. The least-significant bits of ASID are implemented first: that is, if ASIDLEN > 0, ASID\[ASIDLEN-1:0\] is writable. The maximal value of ASIDLEN, termed ASIDMAX, is 9 for Sv32 or 16 for Sv39, Sv48, and Sv57.

__Table 5\. Encoding of satp MODE field.__
| SXLEN=32             |                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Value                | Name                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 01                   | BareSv32                   | No translation or protection.Page-based 32-bit virtual addressing (see [12.1.3\. Sv32: Page-Based 32-bit Virtual-Memory Systems](#sv32)).                                                                                                                                                                                                                                                                                                                                                               |
| **SXLEN=64**         |                            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Value                | Name                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 01-789101112-1314-15 | Bare\-Sv39Sv48Sv57Sv64\-\- | No translation or protection. _Reserved for standard use_Page-based 39-bit virtual addressing (see [12.1.4\. Sv39: Page-Based 39-bit Virtual-Memory System](#sv39)).Page-based 48-bit virtual addressing (see [12.1.5\. Sv48: Page-Based 48-bit Virtual-Memory System](#sv48)).Page-based 57-bit virtual addressing (see [12.1.6\. Sv57: Page-Based 57-bit Virtual-Memory System](#sv57)). _Reserved for page-based 64-bit virtual addressing._ _Reserved for standard use_ _Designated for custom use_ |

| |  For many applications, the choice of page size has a substantial performance impact. A large page size increases TLB reach and loosens the associativity constraints on virtually indexed, physically tagged caches. At the same time, large pages exacerbate internal fragmentation, wasting physical memory and possibly cache capacity. After much deliberation, we have settled on a conventional page size of 4 KiB for both RV32 and RV64\. We expect this decision to ease the porting of low-level runtime software and device drivers. The TLB reach problem is ameliorated by transparent superpage support in modern operating systems. \[[92](../biblio/bibliography.html#bib-transparent-superpages)\] Additionally, multi-level TLB hierarchies are quite inexpensive relative to the multi-level cache hierarchies whose address space they map. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

The `satp` CSR is considered _active_ when the effective privilege mode is S-mode or U-mode. Executions of the address-translation algorithm may only begin using a given value of `satp` when `satp` is active.

| |  Translations that began while satp was active are not required to complete or terminate when satp is no longer active, unless an SFENCE.VMA instruction matching the address and ASID is executed. The SFENCE.VMA instruction must be used to ensure that updates to the address-translation data structures are observed by subsequent implicit reads to those structures by a hart. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Note that writing `satp` does not imply any ordering constraints between page-table updates and subsequent address translations, nor does it imply any invalidation of address-translation caches. If the new address space’s page tables have been modified, or if an ASID is reused, it may be necessary to execute an SFENCE.VMA instruction (see[12.1.2.1\. Supervisor Memory-Management Fence Instruction](#sfence.vma)) after, or in some cases before, writing`satp`.

| |  Not imposing upon implementations to flush address-translation caches upon satp writes reduces the cost of context switches, provided a sufficiently large ASID space. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#stimecmp)12.1.1.12\. Supervisor Timer (`stimecmp`) Register

The `stimecmp` CSR is a 64-bit register and has 64-bit precision on all RV32 and RV64 systems. In RV32 only, accesses to the `stimecmp` CSR access the low 32 bits, while accesses to the `stimecmph` CSR access the high 32 bits of `stimecmp`.

A supervisor timer interrupt becomes pending, as reflected in the STIP bit in the `mip` and `sip` registers whenever `time` contains a value greater than or equal to `stimecmp`, treating the values as unsigned integers. If the result of this comparison changes, it is guaranteed to be reflected in STIP eventually, but not necessarily immediately. The interrupt remains posted until `stimecmp` becomes greater than `time`, typically as a result of writing `stimecmp`. The interrupt will be taken based on the standard interrupt enable and delegation rules.

| |  A spurious timer interrupt might occur if an interrupt handler advancesstimecmp then immediately returns, because STIP might not yet have fallen in the interim. All software should be written to assume this event is possible, but most software should assume this event is extremely unlikely. It is almost always more performant to incur an occasional spurious timer interrupt than to poll STIP until it falls. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  In systems in which a supervisor execution environment (SEE) provides timer facilities via an SBI function call, this SBI call will continue to support requests to schedule a timer interrupt. The SEE will simply make use of stimecmp, changing its value as appropriate. This ensures compatibility with existing S-mode software that uses this SEE facility, while new S-mode software takes advantage of stimecmp directly.) |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#12-1-2-supervisor-instructions)12.1.2\. Supervisor Instructions

In addition to the SRET instruction defined in [Trap-Return Instructions](machine.html#otherpriv), one new supervisor-level instruction is provided.

#### [](#sfence.vma)12.1.2.1\. Supervisor Memory-Management Fence Instruction

![svg](_images/svg-923a12c8951e1924fa31f2b0e7f04f2135dee632.svg) 

The supervisor memory-management fence instruction SFENCE.VMA is used to synchronize updates to in-memory memory-management data structures with current execution. Instruction execution causes implicit reads and writes to these data structures; however, these implicit references are ordinarily not ordered with respect to explicit loads and stores.Executing an SFENCE.VMA instruction guarantees that any previous stores already visible to the current RISC-V hart are ordered before certain implicit references by subsequent instructions in that hart to the memory-management data structures. The specific set of operations ordered by SFENCE.VMA is determined by _rs1_ and _rs2_, as described below. SFENCE.VMA is also used to invalidate entries in the address-translation cache associated with a hart (see [12.1.3.2\. Virtual Address Translation Process](#sv32algorithm)). Further details on the behavior of this instruction are described in [Virtualization Support in mstatus Register](machine.html#virt-control) and [Physical Memory Protection and Paging](machine.html#pmp-vmem).

| |  The SFENCE.VMA is used to flush any local hardware caches related to address translation. It is specified as a fence rather than a TLB flush to provide cleaner semantics with respect to which instructions are affected by the flush operation and to support a wider variety of dynamic caching structures and memory-management schemes. SFENCE.VMA is also used by higher privilege levels to synchronize page table writes and the address translation hardware. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

SFENCE.VMA orders only the local hart’s implicit references to the memory-management data structures.

| |  Consequently, other harts must be notified separately when the memory-management data structures have been modified. One approach is to use 1) a local data fence to ensure local writes are visible globally, then 2) an interprocessor interrupt to the other thread, then 3) a local SFENCE.VMA in the interrupt handler of the remote thread, and finally 4) signal back to originating thread that operation is complete. This is, of course, the RISC-V analog to a TLB shootdown. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

For the common case that the translation data structures have only been modified for a single address mapping (i.e., one page or superpage),_rs1_ can specify a virtual address within that mapping to effect a translation fence for that mapping only. Furthermore, for the common case that the translation data structures have only been modified for a single address-space identifier, _rs2_ can specify the address space. The behavior of SFENCE.VMA depends on _rs1_ and _rs2_ as follows:

* If _rs1_\=`x0` and _rs2_\=`x0`, the fence orders all reads and writes made to any level of the page tables, for all address spaces. The fence also invalidates all address-translation cache entries, for all address spaces.
* If _rs1_\=`x0` and _rs2_≠`x0`, the fence orders all reads and writes made to any level of the page tables, but only for the address space identified by integer register _rs2_. Accesses to _global_mappings (see [12.1.3.1\. Addressing and Memory Protection](#translation)) are not ordered. The fence also invalidates all address-translation cache entries matching the address space identified by integer register _rs2_, except for entries containing global mappings.
* If _rs1_≠`x0` and _rs2_\=`x0`, the fence orders only reads and writes made to leaf page table entries corresponding to the virtual address in _rs1_, for all address spaces. The fence also invalidates all address-translation cache entries that contain leaf page table entries corresponding to the virtual address in _rs1_, for all address spaces.
* If _rs1_≠`x0` and _rs2_≠`x0`, the fence orders only reads and writes made to leaf page table entries corresponding to the virtual address in _rs1_, for the address space identified by integer register _rs2_. Accesses to global mappings are not ordered. The fence also invalidates all address-translation cache entries that contain leaf page table entries corresponding to the virtual address in _rs1_ and that match the address space identified by integer register _rs2_, except for entries containing global mappings.

If the value held in _rs1_ is not a valid virtual address, then the SFENCE.VMA instruction has no effect. No exception is raised in this case.

| |  It is always legal to over-fence, e.g., by fencing only based on a subset of the bits in _rs1_ and/or _rs2_, and/or by simply treating all SFENCE.VMA instructions as having _rs1_\=x0 and/or _rs2_\=x0. For example, simpler implementations can ignore the virtual address in _rs1_and the ASID value in _rs2_ and always perform a global fence. The choice not to raise an exception when an invalid virtual address is held in _rs1_ facilitates this type of simplification. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

When _rs2_≠`x0`, bits SXLEN-1:ASIDMAX of the value held in _rs2_ are reserved for future standard use. Until their use is defined by a standard extension, they should be zeroed by software and ignored by current implementations. Furthermore, if ASIDLEN<ASIDMAX, the implementation shall ignore bits ASIDMAX-1:ASIDLEN of the value held in _rs2_.

An implicit read of the memory-management data structures may return any translation for an address that was valid at any time since the most recent SFENCE.VMA that subsumes that address. The ordering implied by SFENCE.VMA does not place implicit reads and writes to the memory-management data structures into the global memory order in a way that interacts cleanly with the standard RVWMO ordering rules. In particular, even though an SFENCE.VMA orders prior explicit accesses before subsequent implicit accesses, and those implicit accesses are ordered before their associated explicit accesses, SFENCE.VMA does not necessarily place prior explicit accesses before subsequent explicit accesses in the global memory order. These implicit loads also need not otherwise obey normal program order semantics with respect to prior loads or stores to the same address.

| |  A consequence of this specification is that an implementation may use any translation for an address that was valid at any time since the most recent SFENCE.VMA that subsumes that address. For example, if a leaf PTE is modified and the corresponding virtual address is accessed without a subsuming SFENCE.VMA having been executed in between, then either the new translation or any older translation since the last subsuming SFENCE.VMA was executed will be used. It is unpredictable which translation will be chosen from that set, and subsequent accesses to the same virtual address might use different translations from that set. But the behavior of such accesses is otherwise well defined. This property applies even if the virtual-address width for that translation differs from the width currently specified by satp.MODE. For a given virtual address and ASID, any translation since the last subsuming SFENCE.VMA might be used, even if that translation used a virtual address of a different width. Similarly, for a given virtual address, any global translation since the last subsuming SFENCE.VMA might be used, regardless of both ASID and virtual-address width. In a conventional TLB design, it is possible for multiple entries to match a single address if, for example, a page is upgraded to a superpage without first clearing the original non-leaf PTE’s valid bit and executing an SFENCE.VMA with _rs1_\=x0. In this case, a similar remark applies: it is unpredictable whether the old non-leaf PTE or the new leaf PTE is used, but the behavior is otherwise well defined. Another consequence of this specification is that it is generally unsafe to update a PTE using a set of stores of a width less than the width of the PTE, as it is legal for the implementation to read the PTE at any time, including when only some of the partial stores have taken effect. This specification permits the caching of PTEs whose V (Valid) bit is clear. Operating systems must be written to cope with this possibility, but implementers are reminded that eagerly caching invalid PTEs will reduce performance by causing additional page faults. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Implementations must only perform implicit reads of the translation data structures pointed to by the current contents of the `satp` register or a subsequent valid (V=1) translation data structure entry, and must only raise exceptions for implicit accesses that are generated as a result of instruction execution, not those that are performed speculatively.

Changes to the `sstatus` fields SUM and MXR take effect immediately, without the need to execute an SFENCE.VMA instruction. Changing`satp`.MODE from Bare to other modes and vice versa also takes effect immediately, without the need to execute an SFENCE.VMA instruction. Likewise, changes to `satp`.ASID take effect immediately.

| |  The following common situations typically require executing an SFENCE.VMA instruction: When software recycles an ASID (i.e., reassociates it with a different page table), it should _first_ change satp to point to the new page table using the recycled ASID, _then_ execute SFENCE.VMA with _rs1_\=x0and _rs2_ set to the recycled ASID. Alternatively, software can execute the same SFENCE.VMA instruction while a different ASID is loaded intosatp, provided the next time satp is loaded with the recycled ASID, it is simultaneously loaded with the new page table. If the implementation does not provide ASIDs, or software chooses to always use ASID 0, then after every satp write, software should execute SFENCE.VMA with _rs1_\=x0. In the common case that no global translations have been modified, _rs2_ should be set to a register other than x0 but which contains the value zero, so that global translations are not flushed. If software modifies a non-leaf PTE, it should execute SFENCE.VMA with_rs1_\=x0. If any PTE along the traversal path had its G bit set, _rs2_must be x0; otherwise, _rs2_ should be set to the ASID for which the translation is being modified. If software modifies a leaf PTE, it should execute SFENCE.VMA with_rs1_ set to a virtual address within the page. If any PTE along the traversal path had its G bit set, _rs2_ must be x0; otherwise, _rs2_should be set to the ASID for which the translation is being modified. For the special cases of increasing the permissions on a leaf PTE and changing an invalid PTE to a valid leaf, software may choose to execute the SFENCE.VMA lazily. After modifying the PTE but before executing SFENCE.VMA, either the new or old permissions will be used. In the latter case, a page-fault exception might occur, at which point software should execute SFENCE.VMA in accordance with the previous bullet point. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If a hart employs an address-translation cache, that cache must appear to be private to that hart. In particular, the meaning of an ASID is local to a hart; software may choose to use the same ASID to refer to different address spaces on different harts.

| |  A future extension could redefine ASIDs to be global across the SEE, enabling such options as shared translation caches and hardware support for broadcast TLB shootdown. However, as OSes have evolved to significantly reduce the scope of TLB shootdowns using novel ASID-management techniques, we expect the local-ASID scheme to remain attractive for its simplicity and possibly better scalability. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

For implementations that make `satp`.MODE read-only zero (always Bare), attempts to execute an SFENCE.VMA instruction might raise an illegal-instruction exception.

No SFENCE.VMA is required after enabling or disabling pointer masking (see [Pointer Masking Extensions](zpm.html)), as pointer masking applies to the effective address only and does not affect any memory-management data structures.

### [](#sv32)12.1.3\. Sv32: Page-Based 32-bit Virtual-Memory Systems

When Sv32 is written to the MODE field in the `satp` register (see[12.1.1.11\. Supervisor Address Translation and Protection (satp) Register](#satp)), the supervisor operates in a 32-bit paged virtual-memory system. In this mode, supervisor and user virtual addresses are translated into supervisor physical addresses by traversing a radix-tree page table. Sv32 is supported when SXLEN=32 and is designed to include mechanisms sufficient for supporting modern Unix-based operating systems.

| |  The initial RISC-V paged virtual-memory architectures have been designed as straightforward implementations to support existing operating systems. We have architected page table layouts to support a hardware page-table walker. Software TLB refills are a performance bottleneck on high-performance systems, and are especially troublesome with decoupled specialized coprocessors. An implementation can choose to implement software TLB refills using a machine-mode trap handler as an extension to M-mode. Some ISAs architecturally expose _virtually indexed, physically tagged_caches, in that accesses to the same physical address via different virtual addresses might not be coherent unless the virtual addresses lie within the same cache set. Implicitly, this specification does not permit such behavior to be architecturally exposed. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#translation)12.1.3.1\. Addressing and Memory Protection

Sv32 implementations support a 32-bit virtual address space, divided into pages. An Sv32 virtual address is partitioned into a virtual page number (VPN) and page offset, as shown in [Figure 17](#sv32va). When Sv32 virtual memory mode is selected in the MODE field of the`satp` register, supervisor virtual addresses are translated into supervisor physical addresses via a two-level page table. The 20-bit VPN is translated into a 22-bit physical page number (PPN), while the 12-bit page offset is untranslated. The resulting supervisor-level physical addresses are then checked using any physical memory protection structures ([Physical Memory Protection](machine.html#pmp)), before being directly converted to machine-level physical addresses. If necessary, supervisor-level physical addresses are zero-extended to the number of physical address bits found in the implementation.

| |  For example, consider an RV32 system supporting 34 bits of physical address. When the value of satp.MODE is Sv32, a 34-bit physical address is produced directly, and therefore no zero extension is needed. When the value of satp.MODE is Bare, the 32-bit virtual address is translated (unmodified) into a 32-bit physical address, and then that physical address is zero-extended into a 34-bit machine-level physical address. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

![Sv32 virtual address.](_images/diag-0b0370ea601159a45ba879d869b04ba6d96d6e06.svg) 

Figure 17\. Sv32 virtual address.

Sv32 page tables consist of 210 page-table entries (PTEs), each of four bytes. A page table is exactly the size of a page and must always be aligned to a page boundary. The physical page number of the root page table is stored in the `satp` register.

![SV32 physical address.](_images/diag-56ce50f06ec4156b2f5f13100e1b507fc55df492.svg) 

Figure 18\. SV32 physical address.

![Sv32 page table entry.](_images/diag-3dd6ef2c9e888da040f3307d258ac488edc07bb0.svg) 

Figure 19\. Sv32 page table entry.

The PTE format for Sv32 is shown in [Figure 19](#sv32pte). The V bit indicates whether the PTE is valid; if it is 0, all other bits in the PTE are don’t-cares and may be used freely by software. The permission bits, R, W, and X, indicate whether the page is readable, writable, and executable, respectively. When all three are zero, the PTE is a pointer to the next level of the page table; otherwise, it is a leaf PTE. Writable pages must also be marked readable; the contrary combinations are reserved for future use. [Table 6](#pteperm)summarizes the encoding of the permission bits.

__Table 6\. Encoding of PTE R/W/X fields.__
| X        | W        | R        | Meaning                                                                                                                                                                               |
| -------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00001111 | 00110011 | 01010101 | Pointer to next level of page table.Read-only page. _Reserved for future use._Read-write page.Execute-only page.Read-execute page. _Reserved for future use._Read-write-execute page. |

Attempting to fetch an instruction from a page that does not have execute permissions raises a fetch page-fault exception. Attempting to execute a load, load-reserved, or cache-block management instruction whose effective address lies within a page without read permissions raises a load page-fault exception. Attempting to execute a store, store-conditional, AMO, or cache-block zero instruction instruction whose effective address lies within a page without write permissions raises a store page-fault exception.

| |  AMOs never raise load page-fault exceptions. Since any unreadable page is also unwritable, attempting to perform an AMO on an unreadable page always raises a store page-fault exception. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The U bit indicates whether the page is accessible to user mode. U-mode software may only access the page when U=1\. If the SUM bit in the`sstatus` register is set, supervisor mode software may also access pages with U=1\. However, supervisor code normally operates with the SUM bit clear, in which case, supervisor code will fault on accesses to user-mode pages. Irrespective of SUM, the supervisor may not execute code on pages with U=1.

| |  An alternative PTE format would support different permissions for supervisor and user. We omitted this feature because it would be largely redundant with the SUM mechanism (see [12.1.1.1.2\. Memory Privilege in sstatus Register](#sum)) and would require more encoding space in the PTE. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

The G bit designates a _global_ mapping. Global mappings are those that exist in all address spaces. For non-leaf PTEs, the global setting implies that all mappings in the subsequent levels of the page table are global. Note that failing to mark a global mapping as global merely reduces performance, whereas marking a non-global mapping as global is a software bug that, after switching to an address space with a different non-global mapping for that address range, can unpredictably result in either mapping being used.

| |  Global mappings need not be stored redundantly in address-translation caches for multiple ASIDs. Additionally, they need not be flushed from local address-translation caches when an SFENCE.VMA instruction is executed with _rs2_≠x0. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

The RSW field is reserved for use by supervisor software; the implementation shall ignore this field.

Each leaf PTE contains an accessed (A) and dirty (D) bit. The A bit indicates the virtual page has been read, written, or fetched from since the last time the A bit was cleared. The D bit indicates the virtual page has been written since the last time the D bit was cleared.

Two schemes to manage the A and D bits are defined:

* The _Svade_ extension: when a virtual page is accessed and the A bit is clear, or is written and the D bit is clear, a page-fault exception is raised.
* When the Svade extension is not implemented, the following scheme applies.  
    
When a virtual page is accessed and the A bit is clear, the PTE is updated to set the A bit. When the virtual page is written and the D bit is clear, the PTE is updated to set the D bit. When G-stage address translation is in use and is not Bare, the G-stage virtual pages may be accessed or written by implicit accesses to VS-level memory management data structures, such as page tables.  
    
When two-stage address translation is in use, an explicit access may cause both VS-stage and G-stage PTEs to be updated. The following rules apply to all PTE updates caused by an explicit or an implicit memory accesses.  
    
The PTE update must be atomic with respect to other accesses to the PTE, and must atomically perform all page-table walk checks for that leaf PTE as part of, and before, conditionally updating the PTE value. Updates of the A bit may be performed as a result of speculation, even if the associated memory access ultimately is not performed architecturally. However, updates to the D bit, resulting from an explicit store, must be exact (i.e., non-speculative), and observed in program order by the local hart. When two-stage address translation is active, updates to the D bit in G-stage PTEs may be performed by an implicit access to a VS-stage PTE, if the G-stage PTE provides write permission, before any speculative access to the VS-stage PTE.  
    
The PTE update must appear in the global memory order before the memory access that caused the PTE update and before any subsequent explicit memory access to that virtual page by the local hart. The ordering on loads and stores provided by FENCE instructions and the acquire/release bits on atomic instructions also orders the PTE updates associated with those loads and stores as observed by remote harts.  
    
The PTE update is not required to be atomic with respect to the memory access that caused the update and a trap may occur between the PTE update and the memory access that caused the PTE update. If a trap occurs then the A and/or D bit may be updated but the memory access that caused the PTE update might not occur. The hart must not perform the memory access that caused the PTE update before the PTE update is globally visible.  
    
The page tables must be located in memory with hardware page-table write access and _RsrvEventual_ PMA.

All harts in a system must employ the same PTE-update scheme as each other.

| |  The PTE updates due to memory accesses ordered-after a FENCE are not themselves ordered by the FENCE. Simpler implementations may order the Page Table Entry (PTE) update to precede all subsequent explicit memory accesses, as opposed to ensuring that the PTE update is precisely sequenced before subsequent explicit memory accesses to the associated virtual page. Prior versions of this specification required PTE A bit updates to be exact, but allowing the A bit to be updated as a result of speculation simplifies the implementation of address translation prefetchers. System software typically uses the A bit as a page replacement policy hint, but does not require exactness for functional correctness. On the other hand, D bit updates are still required to be exact and performed in program order, as the D bit affects the functional correctness of page eviction. Implementations are of course still permitted to perform both A and D bit updates only in an exact manner. In both cases, requiring atomicity ensures that the PTE update will not be interrupted by other intervening writes to the page table, as such interruptions could lead to A/D bits being set on PTEs that have been reused for other purposes, on memory that has been reclaimed for other purposes, and so on. Simple implementations may instead generate page-fault exceptions. The A and D bits are never cleared by the implementation. If the supervisor software does not rely on accessed and/or dirty bits, e.g. if it does not swap memory pages to secondary storage or if the pages are being used to map I/O space, it should always set them to 1 in the PTE to improve performance. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Any level of PTE may be a leaf PTE, so in addition to 4 KiB pages, Sv32 supports 4 MiB _megapages_. A megapage must be virtually and physically aligned to a 4 MiB boundary; a page-fault exception is raised if the physical address is insufficiently aligned.

For non-leaf PTEs, the D, A, and U bits are reserved for future standard use. Until their use is defined by a standard extension, they must be cleared by software for forward compatibility.

For implementations with both page-based virtual memory and the "A" standard extension, the LR/SC reservation set must lie completely within a single base physical page (i.e., a naturally aligned 4 KiB physical-memory region).

On some implementations, misaligned loads, stores, and instruction fetches may also be decomposed into multiple accesses, some of which may succeed before a page-fault exception occurs. In particular, a portion of a misaligned store that passes the exception check may become visible, even if another portion fails the exception check. The same behavior may manifest for stores wider than XLEN bits (e.g., the FSD instruction in RV32D), even when the store address is naturally aligned.

#### [](#sv32algorithm)12.1.3.2\. Virtual Address Translation Process

A virtual address _va_ is translated into a physical address _pa_ as follows:

1. Let _a_ be `satp`._ppn_×PAGESIZE, and let _i_\=LEVELS-1\. (For Sv32, PAGESIZE=212 and LEVELS=2.) The `satp` register must be_active_, i.e., the effective privilege mode must be S-mode or U-mode.
2. Let _pte_ be the value of the PTE at address _a_+_va_._vpn_\[_i_\]×PTESIZE. (For Sv32, PTESIZE=4.) If accessing _pte_ violates a PMA or PMP check, raise an access-fault exception corresponding to the original access type.
3. If _pte_._v_\=0, or if _pte_._r_\=0 and _pte_._w_\=1, or if any bits or encodings that are reserved for future standard use are set within _pte_, stop and raise a page-fault exception corresponding to the original access type.
4. Otherwise, the PTE is valid. If _pte_._r_\=1 or _pte_._x_\=1, go to step 5\. Otherwise, this PTE is a pointer to the next level of the page table. Let _i=i_\-1\. If _i_<0, stop and raise a page-fault exception corresponding to the original access type. Otherwise, let_a_\=_pte_._ppn_×PAGESIZE and go to step 2.
5. A leaf PTE has been reached. If _i>0_ and _pte_._ppn_\[_i_\-1:0\] ≠ 0, this is a misaligned superpage; stop and raise a page-fault exception corresponding to the original access type.
6. Determine if the requested memory access is allowed by the _pte_._u_ bit, given the current privilege mode and the value of the SUM and MXR fields of the **mstatus** register. If not, stop and raise a page-fault exception corresponding to the original access type.
7. Determine if the requested memory access is allowed by the _pte_._r_, _pte_._w_, and _pte_._x_ bits, given the Shadow Stack Memory Protection rules. If not, stop and raise an access-fault exception.
8. Determine if the requested memory access is allowed by the _pte_._r_, _pte_._w_, and _pte_._x_ bits. If not, stop and raise a page-fault exception corresponding to the original access type.
9. If _pte_._a_\=0, or if the original memory access is a store and _pte_._d_\=0:  
   * If the Svade extension is implemented, stop and raise a page-fault exception corresponding to the original access type.  
   * If a store to the PTE at address _a_+_va.vpn_\[_i_\]×PTESIZE would violate a PMA or PMP check, raise an access-fault exception corresponding to the original access type.  
   * Perform the following steps atomically:  
         * Compare _pte_ to the value of the PTE at address _a_+_va.vpn_\[_i_\]×PTESIZE.  
         * If the values match, set _pte_._a_ to 1 and, if the original memory access is a store, also set _pte_._d_ to 1\. Then store _pte_ to the PTE at address _a_+_va.vpn_\[_i_\]×PTESIZE.  
         * If the comparison fails, return to step 2.
10. The translation is successful. The translated physical address is given as follows:  
   * _pa.pgoff_ \= _va.pgoff_.  
   * If _i_\>0, then this is a superpage translation and _pa.ppn_\[_i_\-1:0\] = _va.vpn_\[_i_\-1:0\].  
   * _pa.ppn_\[LEVELS-1:_i_\] = _pte_._ppn_\[LEVELS-1:_i_\].

All implicit accesses to the address-translation data structures in this algorithm are performed using width PTESIZE.

| |  This implies, for example, that an Sv48 implementation may not use two separate 4 B reads to non-atomically access a single 8 B PTE, and that A/D bit updates performed by the implementation are treated as atomically updating the entire PTE, rather than just the A and/or D bit alone (even though the PTE value does not otherwise change). |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The results of implicit address-translation reads in step 2 may be held in a read-only, incoherent _address-translation cache_ but not shared with other harts. The address-translation cache may hold an arbitrary number of entries, including an arbitrary number of entries for the same address and ASID. Entries in the address-translation cache may then satisfy subsequent step 2 reads if the ASID associated with the entry matches the ASID loaded in step 0 or if the entry is associated with a_global_ mapping. To ensure that implicit reads observe writes to the same memory locations, an SFENCE.VMA instruction must be executed after the writes to flush the relevant cached translations.

The address-translation cache cannot be used in step 9; accessed and dirty bits may only be updated in memory directly.

| |  It is permitted for multiple address-translation cache entries to co-exist for the same address. This represents the fact that in a conventional TLB hierarchy, it is possible for multiple entries to match a single address if, for example, a page is upgraded to a superpage without first clearing the original non-leaf PTE’s valid bit and executing an SFENCE.VMA with _rs1_\=x0, or if multiple TLBs exist in parallel at a given level of the hierarchy. In this case, just as if an SFENCE.VMA is not executed between a write to the memory-management tables and subsequent implicit read of the same address: it is unpredictable whether the old non-leaf PTE or the new leaf PTE is used, but the behavior is otherwise well defined. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Implementations may also execute the address-translation algorithm speculatively at any time, for any virtual address, as long as `satp` is active (as defined in [12.1.1.11\. Supervisor Address Translation and Protection (satp) Register](#satp)). Such speculative executions have the effect of pre-populating the address-translation cache.

Speculative executions of the address-translation algorithm behave as non-speculative executions of the algorithm do, except that they must not set the dirty bit for a PTE, they must not trigger an exception, and they must not create address-translation cache entries if those entries would have been invalidated by any SFENCE.VMA instruction executed by the hart since the speculative execution of the algorithm began.

| |  For instance, it is illegal for both non-speculative and speculative executions of the translation algorithm to begin, read the level 2 page table, pause while the hart executes an SFENCE.VMA with_rs1_\=_rs2_\=x0, then resume using the now-stale level 2 PTE, as subsequent implicit reads could populate the address-translation cache with stale PTEs. In many implementations, an SFENCE.VMA instruction with _rs1_\=x0 will therefore either terminate all previously-launched speculative executions of the address-translation algorithm (for the specified ASID, if applicable), or simply wait for them to complete (in which case any address-translation cache entries created will be invalidated by the SFENCE.VMA as appropriate). Likewise, an SFENCE.VMA instruction with_rs1_≠x0 generally must either ensure that previously-launched speculative executions of the address-translation algorithm (for the specified ASID, if applicable) are prevented from creating new address-translation cache entries mapping leaf PTEs, or wait for them to complete. A consequence of implementations being permitted to read the translation data structures arbitrarily early and speculatively is that at any time, all page table entries reachable by executing the algorithm may be loaded into the address-translation cache. Although it would be uncommon to place page tables in non-idempotent memory, there is no explicit prohibition against doing so. Since the algorithm may only touch page tables reachable from the root page table indicated in satp, the range of addresses that an implementation’s page-table walker will touch is fully under supervisor control. The algorithm does not admit the possibility of ignoring high-order PPN bits for implementations with narrower physical addresses. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#sv39)12.1.4\. Sv39: Page-Based 39-bit Virtual-Memory System

This section describes a simple paged virtual-memory system for SXLEN=64, which supports 39-bit virtual address spaces. The design of Sv39 follows the overall scheme of Sv32, and this section details only the differences between the schemes.

| |  We specified multiple virtual memory systems for RV64 to relieve the tension between providing a large address space and minimizing address-translation cost. For many systems, 39 bits of virtual-address space is ample, and so Sv39 suffices. Sv48 increases the virtual address space to 48 bits, but increases the physical memory capacity dedicated to page tables, the latency of page-table traversals, and the size of hardware structures that store virtual addresses. Sv57 increases the virtual address space, page table capacity requirement, and translation latency even further. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

#### [](#addressing-and-memory-protection)12.1.4.1\. Addressing and Memory Protection

Sv39 implementations support a 39-bit virtual address space, divided into pages. An Sv39 address is partitioned as shown in[Figure 20](#sv39va). Instruction fetch addresses and load and store effective addresses, which are 64 bits,must have bits 63–39 all equal to bit 38, or else a page-fault exception will occur. The 27-bit VPN is translated into a44-bit PPN via athree-level page table, while the12-bit page offset is untranslated.

| |  When mapping between narrower and wider addresses, RISC-V zero-extends a narrower physical address to a wider size. The mapping between 64-bit virtual addresses and the 39-bit usable address space of Sv39 is not based on zero extension but instead follows an entrenched convention that allows an OS to use one or a few of the most-significant bits of a full-size (64-bit) virtual address to quickly distinguish user and supervisor address regions. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

![Sv39 virtual address.](_images/diag-1abc9a2fed5d17636919fb7e458b6ce8b3ba4073.svg) 

Figure 20\. Sv39 virtual address.

![Sv39 physical address.](_images/diag-30f0b3822fd96cece4635639eca58633f7b7138e.svg) 

Figure 21\. Sv39 physical address.

![Sv39 page table entry.](_images/diag-beed6ade106087e4449846ecba47afe435ea5c8f.svg) 

Figure 22\. Sv39 page table entry.

Sv39 page tables contain 29 page table entries (PTEs), eight bytes each. A page table is exactly the size of a page andmust always be aligned to a page boundary. The physical page number of the root page table is stored in the `satp`register’s PPN field.

The PTE format for Sv39 is shown in [Figure 22](#sv39pte). Bits 9-0 have the same meaning as for Sv32\. Bit 63 is reserved for use by the Svnapot extension in [12.1.7\. "Svnapot" Extension for NAPOT Translation Contiguity, Version 1.0](#svnapot).If Svnapot is not implemented, bit 63 remains reserved and must be zeroed by software for forward compatibility, or else a page-fault exception is raised. Bits 62-61 are reserved for use by the Svpbmt extension in [12.1.8\. "Svpbmt" Extension for Page-Based Memory Types, Version 1.0](#svpbmt).If Svpbmt is not implemented, bits 62-61 remain reserved and must be zeroed by software for forward compatibility, or else a page-fault exception is raised. Bits 60-54 are reserved for future standard use and, until their use is defined by some standard extension,must be zeroed by software for forward compatibility. If any of these bits are set, a page-fault exception is raised.

| |  We reserved several PTE bits for a possible extension that improves support for sparse address spaces by allowing page-table levels to be skipped, reducing memory usage and TLB refill latency. These reserved bits may also be used to facilitate research experimentation. The cost is reducing the physical address space, but is presently ample. When it no longer suffices, the reserved bits that remain unallocated could be used to expand the physical address space. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Any level of PTE may be a leaf PTE, so in addition to 4 KiB pages, Sv39 supports2 MiB megapages and 1 GiB gigapages, each of which must be virtually and physically aligned to a boundary equal to its size.A page-fault exception is raised if the physical address is insufficiently aligned.

The algorithm for virtual-to-physical address translation is the same as in [12.1.3.2\. Virtual Address Translation Process](#sv32algorithm), exceptLEVELS equals 3 andPTESIZE equals 8.

### [](#sv48)12.1.5\. Sv48: Page-Based 48-bit Virtual-Memory System

This section describes a simple paged virtual-memory system forSXLEN=64, which supports48-bit virtual address spaces. Sv48 is intended for systems for which a 39-bit virtual address space is insufficient. It closely follows the design of Sv39, simply adding an additional level of page table, and so this chapter only details the differences between the two schemes.

Implementations that support Sv48 must also support Sv39.

| |  Systems that support Sv48 can also support Sv39 at essentially no cost, and so should do so to maintain compatibility with supervisor software that assumes Sv39. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#addressing-and-memory-protection-1)12.1.5.1\. Addressing and Memory Protection

Sv48 implementations support a 48-bit virtual address space, divided into pages. An Sv48 address is partitioned as shown in[Figure 23](#sv48va). Instruction fetch addresses and load and store effective addresses, which are 64 bits,must have bits 63–48 all equal to bit 47, or else a page-fault exception will occur. The 36-bit VPN is translated into a44-bit PPN via afour-level page table, while the12-bit page offset is untranslated.

![Sv48 virtual address.](_images/diag-78365ce07def203a46c5d41e86fe44b2b82fee68.svg) 

Figure 23\. Sv48 virtual address.

![Sv48 physical address.](_images/diag-90d0c94fee3eaf80b936cf9ee110021c4b79f4a0.svg) 

Figure 24\. Sv48 physical address.

![Sv48 page table entry.](_images/diag-cf758c77a8c18632ce647d2932269d694a5c030d.svg) 

Figure 25\. Sv48 page table entry.

The PTE format for Sv48 is shown in [Figure 25](#sv48pte). Bits 63-54 and 9-0 have the same meaning as for Sv39.Any level of PTE may be a leaf PTE, so in addition to 4 KiB pages, Sv48 supports2 MiB megapages, 1 GiB gigapages, and 512 GiB terapages, each of whichmust be virtually and physically aligned to a boundary equal to its size.A page-fault exception is raised if the physical address is insufficiently aligned.

The algorithm for virtual-to-physical address translation is the same as in [12.1.3.2\. Virtual Address Translation Process](#sv32algorithm), exceptLEVELS equals 4 andPTESIZE equals 8.

### [](#sv57)12.1.6\. Sv57: Page-Based 57-bit Virtual-Memory System

This section describes a simple paged virtual-memory system designed forRV64 systems, which supports57-bit virtual address spaces. Sv57 is intended for systems for which a 48-bit virtual address space is insufficient. It closely follows the design of Sv48, simply adding an additional level of page table, and so this chapter only details the differences between the two schemes.

Implementations that support Sv57 must also support Sv48.

| |  Systems that support Sv57 can also support Sv48 at essentially no cost, and so should do so to maintain compatibility with supervisor software that assumes Sv48. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

#### [](#addressing-and-memory-protection-2)12.1.6.1\. Addressing and Memory Protection

Sv57 implementations support a 57-bit virtual address space, divided into pages. An Sv57 address is partitioned as shown in[Figure 26](#sv57va). Instruction fetch addresses and load and store effective addresses, which are 64 bits,must have bits 63–57 all equal to bit 56, or else a page-fault exception will occur. The 45-bit VPN is translated into a44-bit PPN via afive-level page table, while the12-bit page offset is untranslated.

![Sv57 virtual address.](_images/diag-974886df6158fc60f28ef5296c6420d172094f4c.svg) 

Figure 26\. Sv57 virtual address.

![Sv57 physical address.](_images/diag-fd261849fbb4176194c52fd8848cae2f0a6e2e34.svg) 

Figure 27\. Sv57 physical address.

![Sv57 page table entry.](_images/diag-b4890c1ecb7d8e0dfdf4aa235ff3950218acb682.svg) 

Figure 28\. Sv57 page table entry.

The PTE format for Sv57 is shown in [Figure 28](#sv57pte). Bits 63–54 and 9–0 have the same meaning as for Sv39.Any level of PTE may be a leaf PTE, so in addition to 4 KiB pages, Sv57 supports2 MiB megapages, 1 GiB gigapages, 512 GiB terapages, and 256 TiB petapages, each of whichmust be virtually and physically aligned to a boundary equal to its size.A page-fault exception is raised if the physical address is insufficiently aligned.

The algorithm for virtual-to-physical address translation is the same as in [12.1.3.2\. Virtual Address Translation Process](#sv32algorithm), exceptLEVELS equals 5 andPTESIZE equals 8.

### [](#svnapot)12.1.7\. "Svnapot" Extension for NAPOT Translation Contiguity, Version 1.0

In Sv39, Sv48, and Sv57, when a PTE hasN=1, the PTE represents a translation that is part of a range of contiguous virtual-to-physical translations with the same values for PTE bits 5–0.Such ranges must be of a naturally aligned power-of-2 (NAPOT) granularity larger than the base page size.

The Svnapot extension depends on the Sv39 extension.

__Table 7\. Page table entry encodings when _pte_.N=1__
| i       | _pte_._ppn_\[_i_\]                                                      | Description                                                                    | _pte_._napot\_bits_ |
| ------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------- |
| 00000≥1 | x xxxx xxx1 x xxxx xx1x x xxxx x1xx x xxxx 1000 x xxxx 0xxx x xxxx xxxx | _Reserved_ _Reserved_ _Reserved_64 KiB contiguous region _Reserved_ _Reserved_ | \-\-\-4\-\-         |

NAPOT PTEs behave identically to non-NAPOT PTEs within the address-translation algorithm in [12.1.3.2\. Virtual Address Translation Process](#sv32algorithm), except that:

* If the encoding in _pte_ isvalid according to [Table 7](#ptenapot), then instead of returning the original value of _pte_,implicit reads of a NAPOT PTE return a copy of _pte_ in which _pte_._ppn_\[_i_\]\[_pte_._napot\_bits_\-1:0\] is replaced by _vpn_\[_i_\]\[_pte_._napot\_bits_\-1:0\]. If the encoding in _pte_ isreserved according to[Table 7](#ptenapot), then a page-fault exception must be raised.
* Implicit reads of NAPOT page table entries may create address-translation cache entries mapping_a_ \+ _j_×PTESIZE to a copy of _pte_ in which_pte_._ppn_\[_i_\]\[_pte_._napot\_bits_\-1:0\] is replaced by_vpn\[i\]\[pte.napot\_bits_\-1:0\], for any or all _j_ such that_j_ \>> _napot\_bits_ \= _vpn_\[_i_\] >> _napot\_bits_, all for the address space identified in _satp_ as loaded by step 1.

| |  The motivation for a NAPOT PTE is that it can be cached in a TLB as one or more entries representing the contiguous region as if it were a single (large) page covered by a single translation. This compaction can help relieve TLB pressure in some scenarios. The encoding is designed to fit within the pre-existing Sv39, Sv48, and Sv57 PTE formats so as not to disrupt existing implementations or designs that choose not to implement the scheme. It is also designed so as not to complicate the definition of the address-translation algorithm. The address translation cache abstraction captures the behavior that would result from the creation of a single TLB entry covering the entire NAPOT region. It is also designed to be consistent with implementations that support NAPOT PTEs by splitting the NAPOT region into TLB entries covering any smaller power-of-two region sizes. For example, a 64 KiB NAPOT PTE might trigger the creation of 16 standard 4 KiB TLB entries, all with contents generated from the NAPOT PTE (even if the PTEs for the other 4 KiB regions have different contents). In typical usage scenarios, NAPOT PTEs in the same region will have the same attributes, same PPNs, and same values for bits 5-0\. RSW remains reserved for supervisor software control. It is the responsibility of the OS and/or hypervisor to configure the page tables in such a way that there are no inconsistencies between NAPOT PTEs and other NAPOT or non-NAPOT PTEs that overlap the same address range. If an update needs to be made, the OS generally should first mark all of the PTEs invalid, then issue SFENCE.VMA instruction(s) covering all 4 KiB regions within the range (either via a single SFENCE.VMA with _rs1_\=x0, or with multiple SFENCE.VMA instructions with _rs1_≠x0), then update the PTE(s), as described in [12.1.2.1\. Supervisor Memory-Management Fence Instruction](#sfence.vma), unless any inconsistencies are known to be benign. If any inconsistencies do exist, then the effect is the same as when SFENCE.VMA is used incorrectly: one of the translations will be chosen, but the choice is unpredictable. If an implementation chooses to use a NAPOT PTE (or cached version thereof), it might not consult the PTE directly specified by the algorithm in [12.1.3.2\. Virtual Address Translation Process](#sv32algorithm) at all. Therefore, the D and A bits may not be identical across all mappings of the same address range even in typical use cases The operating system must query all NAPOT aliases of a page to determine whether that page has been accessed and/or is dirty. If the OS manually sets the A and/or D bits for a page, it is recommended that the OS also set the A and/or D bits for other NAPOT aliases as appropriate in order to avoid unnecessary traps. Just as with normal PTEs, TLBs are permitted to cache NAPOT PTEs whose V (Valid) bit is clear. Depending on need, the NAPOT scheme may be extended to other intermediate page sizes and/or to other levels of the page table in the future. The encoding is designed to accommodate other NAPOT sizes should that need arise. For example: \_\_ i _pte_._ppn_\[_i_\] Description _pte_._napot\_bits_ 00000…​11…​ x xxxx xxx1 x xxxx xx10 x xxxx x100 x xxxx 1000 x xxx1 0000…​ x xxxx xxx1 x xxxx xx10…​ 8 KiB contiguous region16 KiB contiguous region32 KiB contiguous region64 KiB contiguous region128 KiB contiguous region…​4 MiB contiguous region8 MiB contiguous region…​ 12345…​12…​ In such a case, an implementation may or may not support all options. The discoverability mechanism for this extension would be extended to allow system software to determine which sizes are supported. Other sizes may remain deliberately excluded, so that PPN bits not being used to indicate a valid NAPOT region size (e.g., the least-significant bit of _pte_._ppn_\[_i_\]) may be repurposed for other uses in the future. However, in case finer-grained intermediate page size support proves not to be useful, we have chosen to standardize only 64 KiB support as a first step. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If the hypervisor extension is also implemented,Svnapot is also supported in G-stage translation.

### [](#svpbmt)12.1.8\. "Svpbmt" Extension for Page-Based Memory Types, Version 1.0

In Sv39, Sv48, and Sv57, bits 62-61 of a leaf page table entry indicate the use of page-based memory types that override the PMA(s) for the associated memory pages. The encoding for the PBMT bits is captured in[Table 8](#pbmt).

The Svpbmt extension depends on the Sv39 extension.

__Table 8\. Encodings for PBMT field in Sv39, Sv48, and Sv57 PTEs.__
| Mode      | Value | Requested Memory Attributes                                                                                                                                              |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PMANCIO\- | 0123  | NoneNon-cacheable, idempotent, weakly-ordered (RVWMO), main memoryNon-cacheable, non-idempotent, strongly-ordered (I/O ordering), I/O _Reserved for future standard use_ |

Implementations may override additional PMAs not explicitly listed in[Table 8](#pbmt).For example, to be consistent with the characteristics of a typical I/O region, a misaligned memory access to a page with PBMT=IO might raise an exception, even if the underlying region were main memory and the same access would have succeeded for PBMT=PMA.

| |  Future extensions may provide more and/or finer-grained control over which PMAs can be overridden. |
| ----------------------------------------------------------------------------------------------------- |

For non-leaf PTEs, bits 62-61 are reserved for future standard use.Until their use is defined by a standard extension, they must be cleared by software for forward compatibility, or else a page-fault exception is raised.

For leaf PTEs, setting bits 62-61 to the value 3 is reserved for future standard use.Until this value is defined by a standard extension, using this reserved value in a leaf PTE raises a page-fault exception.

When PBMT settings override a main memory page into I/O or vice versa,memory accesses to such pages obey the memory ordering rules of the final effective attribute, as follows.

If the underlying physical memory attribute for a page is I/O, and the page has PBMT=NC, then accesses to that page obey RVWMO. However,accesses to such pages are considered to be _both_ I/O and main memory accesses for the purposes of FENCE, _.aq_, and _.rl_.

If the underlying physical memory attribute for a page is main memory, and the page has PBMT=IO, thenaccesses to that page obey strong channel 0 I/O ordering rules. However,accesses to such pages are considered to be _both_ I/O and main memory accesses for the purposes of FENCE, _.aq_, and _.rl_.

| |  A device driver written to rely on I/O strong ordering rules will not operate correctly if the address range is mapped with PBMT=NC. As such, this configuration is discouraged. It will often still be useful to map physical I/O regions using PBMT=NC so that write combining and speculative accesses can be performed. Such optimizations will likely improve performance when applied with adequate care. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

When Svpbmt is used with non-zero PBMT encodings, it is possible for multiple virtual aliases of the same physical page to exist simultaneously with different memory attributes. It is also possible for a U-mode or S-mode mapping through a PTE with Svpbmt enabled to observe different memory attributes for a given region of physical memory than a concurrent access to the same page performed by M-mode or when MODE=Bare. In such cases, the behaviors dictated by the attributes (including coherence, which is otherwise unaffected) may be violated.

Accessing the same location using different attributes that are both non-cacheable (e.g., NC and IO) does not cause loss of coherence, butmight result in weaker memory ordering than the stricter attribute ordinarily guarantees. Executing a`fence iorw, iorw` instruction between such accesses suffices to prevent loss of memory ordering.

Accessing the same location using different cacheability attributesmay cause loss of coherence. Executing the following sequence between such accessesprevents both loss of coherence and loss of memory ordering: `fence iorw, iorw`, followed by `cbo.flush` to an address of that location, followed by a `fence iorw, iorw`.

| |  It follows that, if the same location might later be referenced using the original attributes, then this sequence must be repeated beforehand. In certain cases, a weaker sequence might suffice to prevent loss of coherence. These situations will be detailed following the forthcoming formalization of the interaction of the RVWMO memory model with the instructions in the Zicbom extension. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

When two-stage address translation is enabled within the H extension, the page-based memory types are also applied in two stages. First,if `hgatp`.MODE is not equal to zero, non-zero G-stage PTE PBMT bits override the attributes in the PMA to produce an intermediate set of attributes. Otherwise, the PMAs serve as the intermediate attributes. Second,if `vsatp`.MODE is not equal to zero, non-zero VS-stage PTE PBMT bits override the intermediate attributes to produce the final set of attributes used by accesses to the page in question. Otherwise, the intermediate attributes are used as the final set of attributes.

| |  These final attributes apply to implicit and explicit accesses that are subject to both stages of address translation. For accesses that are not subject to the first stage of address translation, e.g. VS-stage page-table accesses, the intermediate attributes apply instead. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

### [](#svinval)12.1.9\. "Svinval" Extension for Fine-Grained Address-Translation Cache Invalidation, Version 1.0

The Svinval extension splits SFENCE.VMA, HFENCE.VVMA, and HFENCE.GVMA instructions into finer-grained invalidation and ordering operationsthat can be more efficiently batched or pipelined on certain classes of high-performance implementation.

![svg](_images/svg-03c79275ea03b9beabaf26303346b02d6ee9891e.svg) 

The SINVAL.VMA instruction invalidates any address-translation cache entries that an SFENCE.VMA instruction with the same values of _rs1_ and_rs2_ would invalidate.However, unlike SFENCE.VMA, SINVAL.VMA instructions are only ordered with respect to SFENCE.VMA, SFENCE.W.INVAL, and SFENCE.INVAL.IR instructions as defined below.

![svg](_images/svg-28f9eec40a4604917037e4435f14062f317554d2.svg) 

![svg](_images/svg-0cdda65c316d98d1125b620c96b7f7fdc517d1a2.svg) 

The SFENCE.W.INVAL instruction guarantees that any previous stores already visible to the current RISC-V hart are ordered before subsequent SINVAL.VMA instructions executed by the same hart.The SFENCE.INVAL.IR instruction guarantees that any previous SINVAL.VMA instructions executed by the current hart are ordered before subsequent implicit references by that hart to the memory-management data structures.

When executed in order (but not necessarily consecutively) by a single hart, the sequence SFENCE.W.INVAL, SINVAL.VMA, and SFENCE.INVAL.IR has the same effect as a hypothetical SFENCE.VMA instruction in which:

* the values of _rs1_ and _rs2_ for the SFENCE.VMA are the same as those used in the SINVAL.VMA,
* reads and writes prior to the SFENCE.W.INVAL are considered to be those prior to the SFENCE.VMA, and
* reads and writes following the SFENCE.INVAL.IR are considered to be those subsequent to the SFENCE.VMA.

![svg](_images/svg-a70bc08a5f47d87340d758f102dcf52a71ebd8d6.svg) 

![svg](_images/svg-792388fd5f74d87efe04f819cf8c98fb726d2a6f.svg) 

If the hypervisor extension is implemented, the Svinval extension also provides two additional instructions: HINVAL.VVMA and HINVAL.GVMA.These have the same semantics as SINVAL.VMA, except that they combine with SFENCE.W.INVAL and SFENCE.INVAL.IR to replace HFENCE.VVMA and HFENCE.GVMA, respectively, instead of SFENCE.VMA. In addition,HINVAL.GVMA uses VMIDs instead of ASIDs.

SINVAL.VMA, HINVAL.VVMA, and HINVAL.GVMA require the same permissions and raise the same exceptions as SFENCE.VMA, HFENCE.VVMA, and HFENCE.GVMA, respectively.In particular, an attempt to execute any of these instructions in U-mode always raises an illegal-instruction exception. An attempt to execute SINVAL.VMA or HINVAL.GVMA in S-mode or HS-mode when`mstatus`.TVM=1 also raises an illegal-instruction exception. An attempt to execute HINVAL.VVMA or HINVAL.GVMA in VS-mode or VU-mode, or to execute SINVAL.VMA in VU-mode, raises a virtual-instruction exception. When `hstatus`.VTVM=1, an attempt to execute SINVAL.VMA in VS-mode also raises a virtual-instruction exception.

Attempting to execute SFENCE.W.INVAL or SFENCE.INVAL.IR in U-moderaises an illegal-instruction exception. Doing so in VU-mode raises a virtual-instruction exception. SFENCE.W.INVAL and SFENCE.INVAL.IR are unaffected by the `mstatus`.TVM and`hstatus`.VTVM fields and hence are always permitted in S-mode and VS-mode.

| |  SFENCE.W.INVAL and SFENCE.INVAL.IR instructions do not need to be trapped when mstatus.TVM=1 or when hstatus.VTVM=1, as they only have ordering effects but no visible side effects. Trapping of the SINVAL.VMA instruction is sufficient to enable emulation of the intended overall TLB maintenance functionality. In typical usage, software will invalidate a range of virtual addresses in the address-translation caches by executing an SFENCE.W.INVAL instruction, executing a series of SINVAL.VMA, HINVAL.VVMA, or HINVAL.GVMA instructions to the addresses (and optionally ASIDs or VMIDs) in question, and then executing an SFENCE.INVAL.IR instruction. High-performance implementations will be able to pipeline the address-translation cache invalidation operations, and will defer any pipeline stalls or other memory ordering enforcement until an SFENCE.W.INVAL, SFENCE.INVAL.IR, SFENCE.VMA, HFENCE.GVMA, or HFENCE.VVMA instruction is executed. Simpler implementations may implement SINVAL.VMA, HINVAL.VVMA, and HINVAL.GVMA identically to SFENCE.VMA, HFENCE.VVMA, and HFENCE.GVMA, respectively, while implementing SFENCE.W.INVAL and SFENCE.INVAL.IR instructions as no-ops. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#sec:svadu)12.1.10\. "Svadu" Extension for Hardware Updating of A/D Bits, Version 1.0

The Svadu extension adds support and CSR controls for hardware updating of PTE A/D bits.

If the Svadu extension is implemented, the `menvcfg`.ADUE field is writable. If the hypervisor extension is additionally implemented, the `henvcfg`.ADUE field is also writable.See [Machine Environment Configuration (menvcfg) Register](machine.html#sec:menvcfg) and [Hypervisor Environment Configuration Register (henvcfg)](hypervisor.html#sec:henvcfg) for the definitions of those fields.

[12.1.3.1\. Addressing and Memory Protection](#translation) defines the semantics of hardware updating of A/D bits.When hardware updating of A/D bits is disabled, the Svade extension, which mandates exceptions when A/D bits need be set, instead takes effect.The Svade extension is also defined in [12.1.3.1\. Addressing and Memory Protection](#translation).

### [](#sec:svvptc)12.1.11\. "Svvptc" Extension for Obviating Memory-Management Instructions after Marking PTEs Valid, Version 1.0

When the Svvptc extension is implemented, explicit stores by a hart that update the Valid bit of leaf and/or non-leaf PTEs from 0 to 1 and are visible to a hart will eventually become visible within a bounded timeframe to subsequent implicit accesses by that hart to such PTEs.

| |  Svvptc relieves an operating system from executing certain memory-management instructions, such as SFENCE.VMA or SINVAL.VMA, which would normally be used to synchronize the hart’s address-translation caches when a memory-resident PTE is changed from Invalid to Valid. Synchronizing the hart’s address-translation caches with other forms of updates to a memory-resident PTE, including when a PTE is changed from Valid to Invalid, requires the use of suitable memory-management instructions. Svvptc guarantees that a change to a PTE from Invalid to Valid is made visible within a bounded time, thereby making the execution of these memory-management instructions redundant. The performance benefit of eliding these instructions outweighs the cost of an occasional gratuitous additional page fault that may occur. Depending on the microarchitecture, some possible ways to facilitate implementation of Svvptc include: not having any address-translation caches, not storing Invalid PTEs in the address-translation caches, automatically evicting Invalid PTEs using a bounded timer, or making address-translation caches coherent with store instructions that modify PTEs. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#sec:svrsw60t59b)12.1.12\. "Svrsw60t59b" Extension for PTE Reserved-for-Software Bits 60-59, Version 1.0

If the Svrsw60t59b extension is implemented, then bits 60-59 of the page table entries (PTEs) are reserved for use by supervisor software and are ignored by the implementation.

If the Hypervisor (H) extension is also implemented, then bits 60-59 of the G-stage PTEs are reserved for use by supervisor software and are ignored by the implementation.

The Svrsw60t59b extension depends on Sv39.

| |  Operating systems frequently use reserved bits within PTEs to store metadata for advanced memory management features. Embedding these metadata bits directly within the PTEs allows for fast access with minimal overhead, avoiding costly lookups in auxiliary data structures. By default, Sv39 and Sv39x4 require a page fault and a guest-page fault exception, respectively, to be raised if bits 60–59 are not zero. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#ssqosid)12.1.13\. "Ssqosid" Extension for Quality-of-Service (QoS) Identifiers, Version 1.0

Quality of Service (QoS) is defined as the minimal end-to-end performance guaranteed in advance by a service level agreement (SLA) to a workload. Performance metrics might include measures such as instructions per cycle (IPC), latency of service, etc.

When multiple workloads execute concurrently on modern processors—equipped with large core counts, multiple cache hierarchies, and multiple memory controllers— the performance of any given workload becomes less deterministic, or even non-deterministic, due to shared resource contention.

To manage performance variability, system software needs resource allocation and monitoring capabilities. These capabilities allow for the reservation of resources like cache and bandwidth, thus meeting individual performance targets while minimizing interference. For resource management, hardware should provide monitoring features that allow system software to profile workload resource consumption and allocate resources accordingly.

To facilitate this, the QoS Identifiers extension (Ssqosid) introduces the`srmcfg` register, which configures a hart with two identifiers: a Resource Control ID (`RCID`) and a Monitoring Counter ID (`MCID`). These identifiers accompany each request issued by the hart to shared resource controllers.

Additional metadata, like the nature of the memory access and the ID of the originating supervisor domain, can accompany `RCID` and `MCID`. Resource controllers may use this metadata for differentiated service such as a different capacity allocation for code storage vs. data storage. Resource controllers can use this data for security policies such as not exposing statistics of one security domain to another.

These identifiers are crucial for the RISC-V Capacity and Bandwidth Controller QoS Register Interface (CBQRI) specification, which provides methods for setting resource usage limits and monitoring resource consumption. The `RCID`controls resource allocations, while the `MCID` is used for tracking resource usage.

| |  The Ssqosid extension does not require that S-mode mode be implemented. |
| -------------------------------------------------------------------------- |

#### [](#12-1-13-1-supervisor-resource-management-configuration-srmcfg-register)12.1.13.1\. Supervisor Resource Management Configuration (`srmcfg`) register

The `srmcfg` register is an SXLEN-bit read/write register used to configure a Resource Control ID (`RCID`) and a Monitoring Counter ID (`MCID`). Both `RCID`and `MCID` are WARL fields. The register is formatted as shown in [Figure 29](#SRMCFG64)when SXLEN=64 and [Figure 30](#SRMCFG32) when SXLEN=32.

The `RCID` and `MCID` accompany each request made by the hart to shared resource controllers. The `RCID` is used to determine the resource allocations (e.g., cache occupancy limits, memory bandwidth limits, etc.) to enforce. The `MCID`is used to identify a counter to monitor resource usage.

![Supervisor Resource Management Configuration (`srmcfg`) register for SXLEN=64](_images/diag-d5884a89e022bf008ca81070262a1f03c154befa.svg) 

Figure 29\. Supervisor Resource Management Configuration (`srmcfg`) register for SXLEN=64

![Supervisor Resource Management Configuration (`srmcfg`) register for SXLEN=32](_images/diag-126fd69e59ba4cdba93a7ecfe8c76bcaf1aaacb8.svg) 

Figure 30\. Supervisor Resource Management Configuration (`srmcfg`) register for SXLEN=32

The `RCID` and `MCID` configured in the `srmcfg` CSR apply to all privilege modes of software execution on that hart by default, but this behavior may be overridden by future extensions.

If extension Smstateen is implemented together with Ssqosid, then Ssqosid also requires the SRMCFG bit in `mstateen0` to be implemented. If `mstateen0`.SRMCFG is 0, attempts to access `srmcfg` in privilege modes less privileged than M-mode raise an illegal-instruction exception. If `mstateen0`.SRMCFG is 1 or if extension Smstateen is not implemented, attempts to access `srmcfg` when `V=1` raise a virtual-instruction exception.

| |  A reset value of 0 is suggested for the RCID field matching resource controllers' default behavior of associating all capacity with RCID=0. TheMCID reset value does not affect functionality and may be implementation-defined. Typically, fewer bits are allocated for RCID (e.g., to support tens of RCIDs) than for MCID (e.g., to support hundreds of MCIDs). A common RCID is usually used to group apps or VMs, pooling resource allocations to meet collective SLAs. If an SLA breach occurs, unique MCIDs enable granular monitoring, aiding decisions on resource adjustment, associating a different RCID with a subset of members, or migrating members to other machines. The larger pool of MCIDs speeds up this analysis. The RCID and MCID in srmcfg apply across all privilege levels on the hart. Typically, higher-privilege modes don’t modify srmcfg, as they often serve lower-privileged tasks. If differentiation is needed, higher privilege code can update srmcfg and restore it before returning to a lower privilege level. In VM environments, hypervisors usually manage resource allocations, keeping the Guest OS out of QoS flows. If needed, the hypervisor can virtualizesrmcfg CSR for a VM using the virtual-instruction exceptions triggered upon Guest access. If the direct selection of RCID and MCID by the VM becomes common and emulation overhead is an issue, future extensions may allow VS-mode to use a selector for a hypervisor-configured set of CSRs holding RCID andMCID values designated for that Guest OS use. During context switches, the supervisor may choose to execute with the srmcfgof the outgoing context to attribute the execution to it. Prior to restoring the new context, it switches to the new VM’s srmcfg. The supervisor can also use a separate configuration for execution not to be attributed to either contexts. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

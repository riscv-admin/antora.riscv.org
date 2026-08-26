# 4.1. Sdext (ISA Extension)

## [](#core%5Fdebug)4.1\. Sdext (ISA Extension)

This chapter describes the Sdext ISA extension. It must be implemented to make external debug work, and is only useful in conjunction with external debug.

Modifications to the RISC-V core to support debug are kept to a minimum. There is a special execution mode (Debug Mode) and a few extra CSRs. The DM takes care of the rest.

In order to be compatible with this specification an implementation must implement everything described in this chapter that is not explicitly listed as optional.

If Sdext is implemented and Sdtrig is not implemented, then accessing any of the Sdtrig CSRs must raise an illegal instruction exception.

### [](#debugmode)4.1.1\. Debug Mode

Debug Mode is a special processor mode used only when a hart is halted for external debugging. Because the hart is halted, there is no forward progress in the normal instruction stream. How Debug Mode is implemented is not specified here.

When executing code due to an abstract command, the hart stays in Debug Mode and the following apply:

1. All implemented instructions operate just as they do in M-mode, unless an exception is mentioned in this list.
2. All operations are executed with machine mode privilege, except that additional Debug Mode CSRs are accessible and `mprv` in `mstatus` may be ignored according to [mprven](#dcsr-mprven). Full permission checks, or a relaxed set of permission checks, will apply according to [relaxedpriv](debug%5Fmodule.html#abstractcs-relaxedpriv).
3. All interrupts (including NMI) are masked.
4. Traps don’t take place. Instead, they end execution of the program buffer and the hart remains in Debug Mode. Because they do not trap to M-mode, they do not update registers such as , `mepc`, `mcause`,`mtval`, `mtval2`, and `mtinst`. The same is true for the equivalent privileged registers that are updated when trapping to other modes. Registers that may be updated as part of execution before the exception are allowed to be updated. For example, vector load/store instructions which raise exceptions may partially update the destination register and set `vstart` appropriately.
5. Triggers don’t match or fire.
6. If [stopcount](#dcsr-stopcount) is 0 then counters continue. If it is 1 then counters are stopped.
7. If [stoptime](#dcsr-stoptime) is 0 then `time` continues to update. If it is 1 then `time` will not update. It will resynchronize with `time` after leaving Debug Mode.
8. Instructions that place the hart into a stalled state act as a `nop`. This includes `wfi`, `wrs.sto`, and `wrs.nto`.
9. Almost all instructions that change the privilege mode have UNSPECIFIED behavior. This includes `ecall`, `mret`, `sret`, and `uret`. (To change the privilege mode, the debugger can write [prv](#dcsr-prv) and [v](#dcsr-v) in [dcsr](#csr-dcsr)). The only exception is`ebreak`, which ends execution of the Program Buffer when executed.
10. All control transfer instructions may act as illegal instructions if their destination is in the Program Buffer. If one such instruction acts as an illegal instruction, all such instructions must act as illegal instructions.
11. All control transfer instructions may act as illegal instructions if their destination is outside the Program Buffer. If one such instruction acts as an illegal instruction, all such instructions must act as illegal instructions.
12. Instructions that depend on the value of the PC (e.g. `auipc`) may act as illegal instructions.
13. When the Zicfilp extension is implemented, the `ELP` state is`NO_LP_EXPECTED` and is not updated by any instructions. LPAD instruction executes as a no-op.
14. Effective XLEN is DXLEN.
15. Forward progress is guaranteed.

| |  When [mprven](#dcsr-mprven), the external debugger can set MPRV and MPP appropriately to have hardware perform memory accesses with the appropriate endianness, address translation, permission checks, and PMP/PMA checks (subject to [relaxedpriv](debug%5Fmodule.html#abstractcs-relaxedpriv)). This is also the only way to access all of physical memory when 34-bit physical addresses are supported on a Sv32 hart. If hardware ties [mprven](#dcsr-mprven) to 0 then the external debugger is expected to simulate all the effects of MPRV, including any extensions that affect memory accesses. For these reasons it is recommended to tie [mprven](#dcsr-mprven) to 1. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

### [](#4-1-2-load-reservedstore-conditional-instructions)4.1.2\. Load-Reserved/Store-Conditional Instructions

The reservation registered by an `lr` instruction on a memory address may be lost when entering Debug Mode or while in Debug Mode. This means that there may be no forward progress if Debug Mode is entered between`lr` and `sc` pairs.

| |  This is a behavior that debug users must be aware of. If they have a breakpoint set between a lr and sc pair, or are stepping through such code, the sc may never succeed. Fortunately in general use there will be very few instructions in such a sequence, and anybody debugging it will quickly notice that the reservation is not occurring. The solution in that case is to set a breakpoint on the first instruction after the sc and run to it. A higher level debugger may choose to automate this. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

### [](#4-1-3-wait-for-interrupt-instruction)4.1.3\. Wait for Interrupt Instruction

If halt is requested while `wfi` is executing, then the hart must leave the stalled state, completing this instruction’s execution, and then enter Debug Mode.

### [](#4-1-4-wait-on-reservation-set-instructions)4.1.4\. Wait-on-Reservation-Set Instructions

If halt is requested while `wrs.sto` or `wrs.nto` is executing, then the hart must leave the stalled state, completing this instruction’s execution, and then enter Debug Mode.

### [](#4-1-5-single-step)4.1.5\. Single Step

#### [](#stepbit)4.1.5.1\. Step Bit In Dcsr

This method is only available to external debuggers, and is the preferred way to single step.

An external debugger can cause a halted hart to execute a single instruction or trap and then re-enter Debug Mode by setting [step](#dcsr-step) before resuming. If [step](#dcsr-step) is set when a hart resumes then it will single step, regardless of the reason for resuming.

If control is transferred to a trap handler while executing the instruction, then Debug Mode is re-entered immediately after the PC is changed to the trap handler, and the appropriate `tval` and `cause`registers are updated. In this case none of the trap handler is executed, and if the cause was a pending interrupt no instructions might be executed at all.

If executing or fetching the instruction causes a trigger to fire with action=1, Debug Mode is re-entered immediately after that trigger has fired. In that case [cause](#dcsr-cause) is set to 2 (trigger) instead of 4 (single step). Whether the instruction is executed or not depends on the specific configuration of the trigger.

If the instruction that is executed causes the PC to change to an address where an instruction fetch causes an exception, that exception does not occur until the next time the hart is resumed. Similarly, a trigger at the new address does not fire until the hart actually attempts to execute that instruction.

If the instruction being stepped over would normally stall the hart, then instead the instruction is treated as a `nop`. This includes `wfi`,`wrs.sto`, and `wrs.nto`.

#### [](#stepicount)4.1.5.2\. Icount Trigger

Native debuggers won’t have access to [dcsr](#csr-dcsr), but can use the [icount](Sdtrig.html#csr-icount) trigger by setting [count](Sdtrig.html#icount-count) to 1.

This approach does have some limitations:

1. Interrupts will fire as usual. Debuggers that want to disable interrupts while stepping must disable them by changing `mstatus`, and specially handle instructions that read `mstatus`.
2. `wfi` instructions are not treated specially and might take a very long time to complete.

This mechanism cleanly supports a system which supports multiple privilege levels, where the OS or a debug stub runs in M-Mode while the program being debugged runs in a less privileged mode. Systems that only support M-Mode can use [icount](Sdtrig.html#csr-icount) as well, but [count](Sdtrig.html#icount-count) must be able to count several instructions (depending on the software implementation). See[\[nativestep\]](#nativestep).

### [](#4-1-6-reset)4.1.6\. Reset

If the halt signal (driven by the hart’s halt request bit in the Debug Module) or [hasresethaltreq](debug%5Fmodule.html#dmstatus-hasresethaltreq) are asserted when a hart comes out of reset, the hart must enter Debug Mode before executing any instructions, but after performing any initialization that would usually happen before the first instruction is executed.

### [](#4-1-7-halt)4.1.7\. Halt

When a hart halts:

1. [cause](#dcsr-cause) is updated.
2. [prv](#dcsr-prv) and [v](#dcsr-v) are set to reflect current privilege mode and virtualization mode.
3. If the Zicfilp extension is implemented, [pelp](#dcsr-pelp) is set to the current`ELP` state and `ELP` is set to `NO_LP_EXPECTED`
4. [dpc](#csr-dpc) is set to the next instruction that should be executed.
5. If the current instruction can be partially executed and should be restarted to complete, then the relevant state for that is updated. E.g. if a halt occurs during a partially executed vector instruction, then`vstart` is updated, and [dpc](#csr-dpc) is updated to the address of the partially executed instruction. This is analogous to how vector instructions behave for exceptions.
6. The hart enters Debug Mode.

### [](#4-1-8-resume)4.1.8\. Resume

When a hart resumes:

1. `pc` changes to the value stored in [dpc](#csr-dpc).
2. The current privilege mode and virtualization mode are changed to that specified by [prv](#dcsr-prv) and [v](#dcsr-v).
3. If the Zicfilp extension is enabled at the new privilege mode, the current`ELP` state is changed to that specified by [pelp](#dcsr-pelp) else it is set to`NO_LP_EXPECTED`. [pelp](#dcsr-pelp) is set to `NO_LP_EXPECTED`.
4. If the new privilege mode is less privileged than M-mode, `MPRV` in `mstatus` is cleared.
5. If the Smdbltrp extension is implemented and the new privilege mode is not M, then the `MDT` bit is set to 0.
6. If the Ssdbltrp extension is implemented and the new privilege mode is U, VS, or VU, then `sstatus.SDT` is set to 0\. Additionally, if it is VU, then`vsstatus.SDT` is also set to 0.
7. The hart is no longer in debug mode.

### [](#debreg)4.1.9\. Core Debug Registers

The supported Core Debug Registers must be implemented for each hart that can be debugged. They are CSRs, accessible using the RISC-V `csr`opcodes and optionally also using abstract debug commands.

Attempts to access an unimplemented Core Debug Register raise an illegal instruction exception.

These registers are only accessible from Debug Mode.

__Table 1\. Core Debug Registers__
| Address | Name                                                   | Section                                                          |
| ------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| 0x7b0   | Debug Control and Status ([dcsr](#csr-dcsr))           | [Debug Control and Status (dcsr, at 0x7b0)](#csr-dcsr)           |
| 0x7b1   | Debug PC ([dpc](#csr-dpc))                             | [Debug PC (dpc, at 0x7b1)](#csr-dpc)                             |
| 0x7b2   | Debug Scratch Register 0 ([dscratch0](#csr-dscratch0)) | [Debug Scratch Register 0 (dscratch0, at 0x7b2)](#csr-dscratch0) |
| 0x7b3   | Debug Scratch Register 1 ([dscratch1](#csr-dscratch1)) | [Debug Scratch Register 1 (dscratch1, at 0x7b3)](#csr-dscratch1) |

#### [](#csr-dcsr)Debug Control and Status (dcsr, at 0x7b0)

Upon entry into Debug Mode, [v](#dcsr-v) and [prv](#dcsr-prv) are updated with the privilege level the hart was previously in, and [cause](#dcsr-cause)is updated with the reason for Debug Mode entry. Other than these fields and [nmip](#dcsr-nmip), the other fields of [dcsr](#csr-dcsr) are only writable by the external debugger.

[Table 2](#tab:dcsrcausepriority) shows the priorities of reasons for entering Debug Mode. Implementations should implement priorities as shown in the table. For compatibility with old versions of this spec, resethaltreq and haltreq are allowed to be at different positions than shown as long as:

1. resethaltreq is higher priority than haltreq
2. the relative order of the other four causes is maintained

__Table 2\. Priority of reasons for entering Debug Mode from highest to lowest.__
| [cause](#dcsr-cause) encoding | Cause                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| 5                             | resethaltreq                                                          |
| 6                             | halt group                                                            |
| 3                             | haltreq                                                               |
| 2                             | trigger (See [\[tab:priority\]](#tab:priority) for detailed priority) |
| 1                             | ebreak                                                                |
| 4                             | step                                                                  |

| |  Note that mcontrol/mcontrol6 triggers which fire after the instruction which hit the trigger are considered to be high priority causes on the subsequent instruction. Therefore, an execute trigger with timing=after on an ebreak instruction is lower priority than the ebreak itself because the trigger will fire after the ebreak instruction. For the same reason, if a single instruction is stepped with both icount and [step](#dcsr-step) then the [step](#dcsr-step) has priority. See [\[tab:priority\]](#tab:priority) for the relative priorities of triggers with respect to the ebreak instruction. Most multi-hart implementations will probably hardwire [stoptime](#dcsr-stoptime)to 0, as the implementation can get complicated and the benefit is small. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

This CSR is read/write.

![Diagram](_images/diag-e8e0e041c424fb631a3d64f836cea68d767b7c5a.svg) 

![Diagram](_images/diag-fc38fb790946fa50a681d5e00797b6a7a30198f3.svg) 

| Field     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Access   | Reset  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------ |
| debugver  | 0 (none): There is no debug support. 4 (1.0): Debug support exists as it is described in this document. 15 (custom): There is debug support, but it does not conform to any available version of this spec.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **R**    | Preset |
| extcause  | When [cause](#dcsr-cause) is 7, this optional field contains the value of a more specific halt reason than "other." Otherwise it contains 0. 0 (critical error): The hart entered a critical error state, as defined in the Smdbltrp extension. All other values are reserved for future versions of this spec, or for use by other RISC-V extensions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **R**    | 0      |
| cetrig    | This bit is part of Smdbltrp and only exists when that extension is implemented. 0 (disabled): A hart in a critical error state does not enter Debug Mode but instead asserts the critical-error signal to the platform. 1 (enabled): A hart in a critical error state enters Debug Mode instead of asserting the critical-error signal to the platform. Upon such entry into Debug Mode, the cause field is set to 7, and the extcause field is set to 0, indicating a critical error triggered the Debug Mode entry. This cause has the highest priority among all reasons for entering Debug Mode. Resuming from Debug Mode following an entry from the critical error state returns the hart to the critical error state. When [cetrig](#dcsr-cetrig) is 1, resuming from Debug Mode following an entry due to a critical error will result in an immediate re-entry into Debug Mode due to the critical error. The debugger may resume with [cetrig](#dcsr-cetrig) set to 0 to allow the platform defined actions on critical-error signal to occur. Other possible actions include initiating a hart or platform reset using the Debug Module reset control. | **WARL** | 0      |
| pelp      | This bit is part of Zicfilp and only exists when that extension is implemented. 0 (NO\_LP\_EXPECTED): No landing pad instruction expected. 1 (LP\_EXPECTED): A landing pad instruction is expected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | **WARL** | 0      |
| ebreakvs  | 0 (exception): ebreak instructions in VS-mode behave as described in the Privileged Spec. 1 (debug mode): ebreak instructions in VS-mode enter Debug Mode. This bit is hardwired to 0 if the hart does not support virtualization mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **WARL** | 0      |
| ebreakvu  | 0 (exception): ebreak instructions in VU-mode behave as described in the Privileged Spec. 1 (debug mode): ebreak instructions in VU-mode enter Debug Mode. This bit is hardwired to 0 if the hart does not support virtualization mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **WARL** | 0      |
| ebreakm   | 0 (exception): ebreak instructions in M-mode behave as described in the Privileged Spec. 1 (debug mode): ebreak instructions in M-mode enter Debug Mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **R/W**  | 0      |
| ebreaks   | 0 (exception): ebreak instructions in S-mode behave as described in the Privileged Spec. 1 (debug mode): ebreak instructions in S-mode enter Debug Mode. This bit is hardwired to 0 if the hart does not support S-mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **WARL** | 0      |
| ebreaku   | 0 (exception): ebreak instructions in U-mode behave as described in the Privileged Spec. 1 (debug mode): ebreak instructions in U-mode enter Debug Mode. This bit is hardwired to 0 if the hart does not support U-mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **WARL** | 0      |
| stepie    | 0 (interrupts disabled): Interrupts (including NMI) are disabled during single stepping with [step](#dcsr-step) set. This value should be supported. 1 (interrupts enabled): Interrupts (including NMI) are enabled during single stepping with [step](#dcsr-step) set. Implementations may hard wire this bit to 0\. In that case interrupt behavior can be emulated by the debugger. The debugger must not change the value of this bit while the hart is running.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **WARL** | 0      |
| stopcount | 0 (normal): Increment counters as usual. 1 (freeze): Don’t increment any hart-local counters while in Debug Mode or on ebreak instructions that cause entry into Debug Mode. These counters include the instret CSR. On single-hart corescycle should be stopped, but on multi-hart cores it must keep incrementing. An implementation may hardwire this bit to 0 or 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **WARL** | Preset |
| stoptime  | 0 (normal): time continues to reflect mtime. 1 (freeze): time is frozen at the time that Debug Mode was entered. When leaving Debug Mode, time will reflect the latest value of mtime again. While all harts have [stoptime](#dcsr-stoptime)\=1 and are in Debug Mode,mtime is allowed to stop incrementing. An implementation may hardwire this bit to 0 or 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **WARL** | Preset |
| cause     | Explains why Debug Mode was entered. When there are multiple reasons to enter Debug Mode in a single cycle, hardware should set [cause](#dcsr-cause) to the cause with the highest priority. See [Table 2](#tab:dcsrcausepriority) for priorities. 1 (ebreak): An ebreak instruction was executed. 2 (trigger): A Trigger Module trigger fired with action=1. 3 (haltreq): The debugger requested entry to Debug Mode using [haltreq](debug%5Fmodule.html#dmcontrol-haltreq). 4 (step): The hart single stepped because [step](#dcsr-step) was set. 5 (resethaltreq): The hart halted directly out of reset due to \`resethaltreq\` It is also acceptable to report 3 when this happens. 6 (group): The hart halted because it’s part of a halt group. Harts may report 3 for this cause instead. 7 (other): The hart halted for a reason other than the ones mentioned above.[extcause](#dcsr-extcause) may contain a more specific reason.                                                                                                                                                                                                                       | **R**    | 0      |
| v         | Extends the prv field with the virtualization mode the hart was operating in when Debug Mode was entered. The encoding is described in [Table 5](#tab:privmode). A debugger can change this value to change the hart’s virtualization mode when exiting Debug Mode. This bit is hardwired to 0 on harts that do not support virtualization mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | **WARL** | 0      |
| mprven    | 0 (disabled): mprv in mstatus is ignored in Debug Mode. 1 (enabled): mprv in mstatus takes effect in Debug Mode. Implementing this bit is optional. It may be tied to either 0 or 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **WARL** | Preset |
| nmip      | When set, there is a Non-Maskable-Interrupt (NMI) pending for the hart. Since an NMI can indicate a hardware error condition, reliable debugging may no longer be possible once this bit becomes set. This is implementation-dependent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **R**    | 0      |
| step      | When set and not in Debug Mode, the hart will only execute a single instruction and then enter Debug Mode. See [4.1.5.1\. Step Bit In Dcsr](#stepbit)for details. The debugger must not change the value of this bit while the hart is running.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **R/W**  | 0      |
| prv       | Contains the privilege mode the hart was operating in when Debug Mode was entered. The encoding is described in [Table 5](#tab:privmode). A debugger can change this value to change the hart’s privilege mode when exiting Debug Mode. Not all privilege modes are supported on all harts. If the encoding written is not supported or the debugger is not allowed to change to it, the hart may change to any supported privilege mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | **WARL** | 3      |

#### [](#csr-dpc)Debug PC (dpc, at 0x7b1)

Upon entry to debug mode, [dpc](#csr-dpc) is updated with the virtual address of the next instruction to be executed. The behavior is described in more detail in [Table 3](#tab:dpc).

__Table 3\. Virtual address in DPC.__
| Cause          | Virtual Address in DPC                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ebreak         | Address of the ebreak instruction                                                                                                                                                                                                                                                                                                                                |
| single step    | Address of the instruction that would be executed next if no debugging was going on. Ie. pc \+ 4 for 32-bit instructions that don’t change program flow, the destination PC on taken jumps/branches, etc.                                                                                                                                                        |
| trigger module | The address of the next instruction to be executed at the time that debug mode was entered. If the trigger is [mcontrol](Sdtrig.html#csr-mcontrol) and [timing](Sdtrig.html#mcontrol-timing) is 0 or if the trigger is[mcontrol6](Sdtrig.html#csr-mcontrol6) and hit1 is 0, this corresponds to the address of the instruction which caused the trigger to fire. |
| halt request   | Address of the next instruction to be executed at the time that debug mode was entered.                                                                                                                                                                                                                                                                          |

Executing the Program Buffer may cause the value of [dpc](#csr-dpc) to become UNSPECIFIED. If that is the case, it must be possible to read/write[dpc](#csr-dpc) using an abstract command with [postexec](debug%5Fmodule.html#accessregister-postexec) not set. The debugger must attempt to save [dpc](#csr-dpc) between halting and executing a Program Buffer, and then restore [dpc](#csr-dpc) before leaving Debug Mode.

| |  Allowing [dpc](#csr-dpc) to become UNSPECIFIED upon Program Buffer execution allows for direct implementations that don’t have a separate PC register, and do need to use the PC when executing the Program Buffer. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If the Access Register abstract command supports reading [dpc](#csr-dpc) while the hart is running, then the value read should be the address of a recently executed instruction.

If the Access Register abstract command supports writing [dpc](#csr-dpc) while the hart is running, then the executing program should jump to the written address shortly after the write occurs.

The writability of [dpc](#csr-dpc) follows the same rules as `mepc` as defined in the Privileged Spec. In particular, [dpc](#csr-dpc) must be able to hold all valid virtual addresses and the writability of the low bits depends on IALIGN.

When resuming, the hart’s PC is updated to the virtual address stored in[dpc](#csr-dpc). A debugger may write [dpc](#csr-dpc) to change where the hart resumes.

This CSR is read/write.

![Diagram](_images/diag-6de3af4b6e5c401fae75e901c91b6bbb84e8e6b6.svg) 

#### [](#csr-dscratch0)Debug Scratch Register 0 (dscratch0, at 0x7b2)

Optional scratch register that can be used by implementations that need it. A debugger must not write to this register unless [hartinfo](debug%5Fmodule.html#dm-hartinfo)explicitly mentions it (the Debug Module may use this register internally).

This CSR is read/write.

![Diagram](_images/diag-9303aeb8c1e4714d323a0a68125effd4bb96b35c.svg) 

#### [](#csr-dscratch1)Debug Scratch Register 1 (dscratch1, at 0x7b3)

Optional scratch register that can be used by implementations that need it. A debugger must not write to this register unless [hartinfo](debug%5Fmodule.html#dm-hartinfo)explicitly mentions it (the Debug Module may use this register internally).

This CSR is read/write.

![Diagram](_images/diag-dce304802bfb65ef5cfccd27ab0431dad6cde921.svg) 

### [](#virtreg)4.1.10\. Virtual Debug Registers

A virtual register is one that doesn’t exist directly in the hardware, but that the debugger exposes as if it does. Debug software should implement them, but hardware can skip this section. Virtual registers exist to give users access to functionality that’s not part of standard debuggers without requiring them to carefully modify debug registers while the debugger is also accessing those same registers.

__Table 4\. Virtual Core Debug Registers__
| Address | Name                                | Section                                         |
| ------- | ----------------------------------- | ----------------------------------------------- |
| virtual | Privilege Mode ([priv](#virt-priv)) | [Privilege Mode (priv, at virtual)](#virt-priv) |

#### [](#virt-priv)Privilege Mode (priv, at virtual)

Users can read this register to inspect the privilege mode that the hart was running in when the hart halted. Users can write this register to change the privilege mode that the hart will run in when it resumes.

This register contains [prv](#dcsr-prv) and [v](#dcsr-v) from [dcsr](#csr-dcsr), but in a place that the user is expected to access. The user should not access [dcsr](#csr-dcsr) directly, because doing so might interfere with the debugger.

__Table 5\. Privilege Mode and Virtualization Mode Encoding__
| H extension supported | v | prv | Abbreviation | Name                               |
| --------------------- | - | --- | ------------ | ---------------------------------- |
| No                    | 0 | 0   | U-mode       | User mode                          |
| No                    | 0 | 1   | S-mode       | Supervisor mode                    |
| No                    | 0 | 3   | M-mode       | Machine mode                       |
| Yes                   | 0 | 0   | U-mode       | User mode                          |
| Yes                   | 0 | 1   | HS-mode      | Hypervisor-enabled supervisor mode |
| Yes                   | 0 | 3   | M-mode       | Machine mode                       |
| Yes                   | 1 | 0   | VU-mode      | Virtual user mode                  |
| Yes                   | 1 | 1   | VS-mode      | Virtual supervisor mode            |

![Diagram](_images/diag-783580259a36aeb92c9e6129f0218b3043c685f5.svg) 

| Field | Description                                                                                                                                                                                                                                                                                                         | Access   | Reset |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----- |
| v     | Contains the virtualization mode the hart was operating in when Debug Mode was entered. The encoding is described in [Table 5](#tab:privmode), and matches the virtualization mode encoding from the Privileged Spec. A user can write this value to change the hart’s virtualization mode when exiting Debug Mode. | **WARL** | 0     |
| prv   | Contains the privilege mode the hart was operating in when Debug Mode was entered. The encoding is described in [Table 5](#tab:privmode), and matches the privilege mode encoding from the Privileged Spec. A user can write this value to change the hart’s privilege mode when exiting Debug Mode.                | **R/W**  | 0     |

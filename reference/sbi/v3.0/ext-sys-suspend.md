# 13.1. System Suspend Extension (EID #0x53555350 "SUSP")

## [](#13-1-system-suspend-extension-eid-0x53555350-susp)13.1\. System Suspend Extension (EID #0x53555350 "SUSP")

The system suspend extension defines a set of system-level sleep states and a function which allows the supervisor-mode software to request that the system transitions to a sleep state. Sleep states are identified with 32-bit wide identifiers (`sleep_type`). The possible values for the identifiers are shown in [Table 1](#table%5Fsusp%5Fsleep%5Ftypes).

The term "system" refers to the world-view of the supervisor software domain invoking the call. System suspend may only suspend the part of the overall system which is visible to the invoking supervisor software domain.

The system suspend extension does not provide any way for supported sleep types to be probed. Platforms are expected to specify their supported system sleep types and per-type wake up devices in their hardware descriptions. The`SUSPEND_TO_RAM` sleep type is the one exception, and its presence is implied by that of the extension.

__Table 1\. SUSP System Sleep Types__
| Type                    | Name                                 | Description                                                                                                                                                                           |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0                       | SUSPEND\_TO\_RAM                     | This is a “suspend to RAM” sleep type, similar to ACPI’s S2 or S3\. Entry requires all but the calling hart be in the HSM STOPPED state and all hart registers and CSRs saved to RAM. |
| 0x00000001 - 0x7fffffff | Reserved for future use              |                                                                                                                                                                                       |
| 0x80000000 - 0xffffffff | Platform-specific system sleep types |                                                                                                                                                                                       |

### [](#13-1-1-function-system-suspend-fid-0)13.1.1\. Function: System Suspend (FID #0)

```C
struct sbiret sbi_system_suspend(uint32_t sleep_type,
                                 unsigned long resume_addr,
                                 unsigned long opaque)
```

A return from a `sbi_system_suspend()` call implies an error and an error code from [Table 3](#table%5Fsusp%5Ferrors) will be in `sbiret.error`. A successful suspend and wake up, results in the hart which initiated the suspend, resuming from the`STOPPED` state. To resume, the hart will jump to supervisor-mode, at the address specified by `resume_addr`, with the specific register values described in [Table 2](#table%5Fsusp%5Fresume%5Fstate).

__Table 2\. SUSP System Resume Register State__
| Register Name                                     | Register Value   |
| ------------------------------------------------- | ---------------- |
| satp                                              | 0                |
| sstatus.SIE                                       | 0                |
| a0                                                | hartid           |
| a1                                                | opaque parameter |
| All other registers remain in an undefined state. |                  |

| |  A single unsigned long parameter is sufficient for resume\_addr, because the hart will resume execution in supervisor-mode with the MMU off, hence resume\_addr must be less than XLEN bits wide. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The `resume_addr` parameter points to a runtime-specified physical address, where the hart can resume execution in supervisor-mode after a system suspend.

The `opaque` parameter is an XLEN-bit value which will be set in the `a1`register when the hart resumes execution at `resume_addr` after a system suspend.

Besides ensuring all entry criteria for the selected sleep type are met, such as ensuring other harts are in the `STOPPED` state, the caller must ensure all power units and domains are in a state compatible with the selected sleep type. The preparation of the power units, power domains, and wake-up devices used for resumption from the system sleep state is platform specific and beyond the scope of this specification.

When supervisor software is running inside a virtual machine, the SBI implementation is provided by a hypervisor. System suspend will behave similarly to the native case from the point of view of the supervisor software.

The possible error codes returned in `sbiret.error` are shown in[Table 3](#table%5Fsusp%5Ferrors).

__Table 3\. SUSP System Suspend Errors__
| Error code                 | Description                                                                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SBI\_ERR\_INVALID\_PARAM   | sleep\_type is reserved or is platform-specific and unimplemented.                                                                                                                                                                               |
| SBI\_ERR\_NOT\_SUPPORTED   | sleep\_type is not reserved and is implemented, but the platform does not support it due to one or more missing dependencies.                                                                                                                    |
| SBI\_ERR\_INVALID\_ADDRESS | resume\_addr is not valid, possibly due to the following reasons: \* It is not a valid physical address. \* Executable access to the address is prohibited by a physical memory protection mechanism or H-extension G-stage for supervisor mode. |
| SBI\_ERR\_DENIED           | The suspend request failed due to unsatisfied entry criteria.                                                                                                                                                                                    |
| SBI\_ERR\_FAILED           | The suspend request failed for unspecified or unknown other reasons.                                                                                                                                                                             |

### [](#13-1-2-function-listing)13.1.2\. Function Listing

__Table 4\. SUSP Function List__
| Function Name        | SBI Version | FID | EID        |
| -------------------- | ----------- | --- | ---------- |
| sbi\_system\_suspend | 2.0         | 0   | 0x53555350 |

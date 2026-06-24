# 16.1. Steal-time Accounting Extension (EID #0x535441 "STA")

## [](#16-1-steal-time-accounting-extension-eid-0x535441-sta)16.1\. Steal-time Accounting Extension (EID #0x535441 "STA")

SBI implementations may encounter situations where virtual harts are ready to run, but must be withheld from running. These situations may be, for example, when multiple SBI domains share processors or when an SBI implementation is a hypervisor and guest contexts share processors with other guest contexts or host tasks. When virtual harts are at times withheld from running, observers within the contexts of the virtual harts may need a way to account for less progress than would otherwise be expected. The time a virtual hart was ready, but had to wait, is called "stolen time" and the tracking of it is referred to as steal-time accounting. The Steal-time Accounting (STA) extension defines the mechanism in which an SBI implementation provides steal-time and preemption information, for each virtual hart, to supervisor-mode software.

### [](#16-1-1-function-set-steal-time-shared-memory-address-fid-0)16.1.1\. Function: Set Steal-time Shared Memory Address (FID #0)

```C
struct sbiret sbi_steal_time_set_shmem(unsigned long shmem_phys_lo,
                                       unsigned long shmem_phys_hi,
                                       unsigned long flags)
```

Set the shared memory physical base address for steal-time accounting of the calling virtual hart and enable the SBI implementation’s steal-time information reporting.

If `shmem_phys_lo` and `shmem_phys_hi` are not all-ones bitwise, then`shmem_phys_lo` specifies the lower XLEN bits and `shmem_phys_hi` specifies the upper XLEN bits of the shared memory physical base address. `shmem_phys_lo`MUST be 64-byte aligned. The size of the shared memory must be at least 64 bytes. The SBI implementation MUST zero the first 64 bytes of the shared memory before returning from the SBI call.

If `shmem_phys_lo` and `shmem_phys_hi` are all-ones bitwise, the SBI implementation will stop reporting steal-time information for the virtual hart.

The `flags` parameter is reserved for future use and MUST be zero.

It is not expected for the shared memory to be written by the supervisor-mode software while it is in use for steal-time accounting. However, the SBI implementation MUST not misbehave if a write from supervisor-mode software occurs, however, in that case, it MAY leave the shared memory filled with inconsistent data.

The SBI implementation MUST stop writing to the shared memory when the supervisor-mode software is not runnable, such as upon system reset or system suspend.

| |  Not writing to the shared memory when the supervisor-mode software is not runnable avoids unnecessary work and supports repeatable capture of a system image while the supervisor-mode software is suspended. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The shared memory layout is defined in [Table 1](#table%5Fsta%5Fshmem%5Fstructure)

__Table 1\. STA Shared Memory Structure__
| Name      | Offset | Size | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | ------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sequence  | 0      | 4    | The SBI implementation MUST increment this field to an odd value before writing the steal field, and increment it again to an even value after writing steal (i.e. an odd sequence number indicates an in-progress update). The SBI implementation SHOULD ensure that the sequence field remains odd for only very short periods of time.  The supervisor-mode software MUST check this field before and after reading the steal field, and repeat the read if it is different or odd. _This sequence field enables the value of the steal field to be read by supervisor-mode software executing in a 32-bit environment._ |
| flags     | 4      | 4    | Always zero. _Future extensions of the SBI call might allow the supervisor-mode software to write to some of the fields of the shared memory. Such extensions will not be enabled as long as a zero value is used for the flags argument to the SBI call._                                                                                                                                                                                                                                                                                                                                                                  |
| steal     | 8      | 8    | The amount of time in which this virtual hart was not idle and scheduled out, in nanoseconds. The time during which the virtual hart is idle will not be reported as steal-time.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| preempted | 16     | 1    | An advisory flag indicating whether the virtual hart which registered this structure is running or not. A non-zero value MAY be written by the SBI implementation if the virtual hart has been preempted (i.e. while the steal field is increasing), while a zero value MUST be written before the virtual hart starts to run again. _This preempted field can, for example, be used by the supervisor-mode software to check if a lock holder has been preempted, and, in that case, disable optimistic spinning._                                                                                                         |
| pad       | 17     | 47   | Pad with zeros to a 64 byte boundary.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

`sbiret.value` is set to zero and the possible error codes returned in `sbiret.error` are shown in [Table 2](#table%5Fsta%5Fsteal%5Ftime%5Fset%5Fshmem%5Ferrors)below.

__Table 2\. STA Set Steal-time Shared Memory Address Errors__
| Error code                 | Description                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | The steal-time shared memory physical base address was set or cleared successfully.                                                                                                                                                                                    |
| SBI\_ERR\_INVALID\_PARAM   | The flags parameter is not zero or theshmem\_phys\_lo is not 64-byte aligned.                                                                                                                                                                                          |
| SBI\_ERR\_INVALID\_ADDRESS | The shared memory pointed to by the shmem\_phys\_lo and shmem\_phys\_hi parameters is not writable or does not satisfy other requirements of[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter). |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                                                                                           |

### [](#16-1-2-function-listing)16.1.2\. Function Listing

__Table 3\. STA Function List__
| Function Name                | SBI Version | FID | EID      |
| ---------------------------- | ----------- | --- | -------- |
| sbi\_steal\_time\_set\_shmem | 2.0         | 0   | 0x535441 |

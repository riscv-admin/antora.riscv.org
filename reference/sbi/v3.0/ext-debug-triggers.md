# 19.1. Debug Triggers Extension (EID #0x44425452 "DBTR")

## [](#19-1-debug-triggers-extension-eid-0x44425452-dbtr)19.1\. Debug Triggers Extension (EID #0x44425452 "DBTR")

The RISC-V Sdtrig extension cite:\[debug\_v1\_0\] allows machine-mode software to directly configure debug triggers which in-turn allows native (or hosted) debugging in machine-mode without any external debugger. Unfortunately, the debug triggers are only accessible to machine-mode.

The SBI debug trigger extension defines a SBI based abstraction to provide native debugging for supervisor-mode software such that it is:

1. Suitable for the rich operating systems and hypervisors running in supervisor-mode.
2. Allows Guest (VS-mode) and Hypervisor (HS-mode) to share debug triggers on a hart.

Each hart on a RISC-V platform has a fixed number of debug triggers which is referred to as `trig_max` in this SBI extension. Each debug trigger is assigned a logical index called `trig_idx` by the SBI implementation where `-1 < trig_idx < trig_max`.

| |  The trig\_max may vary across harts on a platform with asymmetric harts. |
| --------------------------------------------------------------------------- |

The configuration of each debug trigger is expressed by three parameters `trig_tdata1`,`trig_tdata2`, and `trig_tdata3` which are encoded in the same way as the `tdata1`,`tdata2`, and `tdata3` CSRs defined by the RISC-V Sdtrig extension cite:\[debug\_v1\_0\] but with the following additional constraints:

1. The `trig_tdata1.dmode` bit must always be zero.
2. The `trig_tdata1.m` bit must always be zero.

The SBI implementation MUST also maintain an additional software state for each debug trigger called `trig_state` which is encoded as shown in [Table 1](#table%5Fdbtr%5Ftrig%5Fstate) below.

__Table 1\. Debug Trigger State Fields__
| Field Name     | Bits                    | Description                                                                                                        |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| hw\_trig\_idx  | trig\_state\[XLEN-1:8\] | hardware (or physical) index of the debug trigger. This field must be ignored whentrig\_state.have\_hw\_trig == 0. |
| reserved       | trig\_state\[7:6\]      | Reserved for future use and must be zero.                                                                          |
| have\_hw\_trig | trig\_state\[5:5\]      | When set, the hardware (or physical) debug trigger details are available.                                          |
| vs             | trig\_state\[4:4\]      | Saved copy of the trig\_tdata1.vs bit.                                                                             |
| vu             | trig\_state\[3:3\]      | Saved copy of the trig\_tdata1.vu bit.                                                                             |
| s              | trig\_state\[2:2\]      | Saved copy of the trig\_tdata1.s bit.                                                                              |
| u              | trig\_state\[1:1\]      | Saved copy of the trig\_tdata1.u bit.                                                                              |
| mapped         | trig\_state\[0:0\]      | When set, the trigger has been mapped to some HW debug trigger.                                                    |

### [](#19-1-1-function-get-number-of-triggers-fid-0)19.1.1\. Function: Get number of triggers (FID #0)

```C
struct sbiret sbi_debug_num_triggers(unsigned long trig_tdata1)
```

Get the number of debug triggers on the calling hart which can support the trigger configuration specified by `trig_tdata1` parameter.

This function always returns SBI\_SUCCESS in `sbiret.error`. It will return `trig_max`in `sbiret.value` when `trig_tdata1 == 0` otherwise it will return the number of matching debug triggers in `sbiret.value`.

### [](#19-1-2-function-set-trigger-shared-memory-fid-1)19.1.2\. Function: Set trigger shared memory (FID #1)

```C
struct sbiret sbi_debug_set_shmem(unsigned long shmem_phys_lo,
                                  unsigned long shmem_phys_hi,
                                  unsigned long flags)
```

Set and enable the shared memory for debug trigger configuration on the calling hart.

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are not all-ones bitwise then`shmem_phys_lo` specifies the lower XLEN bits and `shmem_phys_hi` specifies the upper XLEN bits of the shared memory physical base address. The `shmem_phys_lo` MUST be`(XLEN / 8)` bytes aligned and the size of shared memory is assumed to be`trig_max * (XLEN / 2)` bytes.

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are all-ones bitwise then shared memory for debug trigger configuration is disabled.

The `flags` parameter is reserved for future use and MUST be zero.

The possible error codes returned in `sbiret.error` are shown in[Table 2](#table%5Fdbtr%5Fset%5Fshmem%5Ferrors).

__Table 2\. Debug Triggers Set Shared Memory Errors__
| Error code                 | Description                                                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | Shared memory was set or cleared successfully.                                                                                                                                                                                                              |
| SBI\_ERR\_INVALID\_PARAM   | The flags parameter is not zero or the shmem\_phys\_lo parameter is not (XLEN / 8) bytes aligned.                                                                                                                                                           |
| SBI\_ERR\_INVALID\_ADDRESS | The shared memory pointed to by the shmem\_phys\_lo and shmem\_phys\_hi parameters does not satisfy the requirements described in[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter). |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                                                                                |

### [](#19-1-3-function-read-triggers-fid-2)19.1.3\. Function: Read triggers (FID #2)

```C
struct sbiret sbi_debug_read_triggers(unsigned long trig_idx_base,
                                      unsigned long trig_count)
```

Read the debug trigger state and configuration into shared memory for a range of debug triggers specified by the `trig_idx_base` and `trig_count` parameters on the calling hart.

For each debug trigger with index `trig_idx_base + i` where `-1 < i < trig_count`, the debug trigger state and configuration consisting of four XLEN-bit words are written in little-endian format at `offset = i * (XLEN / 2)` of the shared memory as follows:

```C
    word[0] = `trig_state` written by the SBI implementation
    word[1] = `trig_tdata1` written by the SBI implementation
    word[2] = `trig_tdata2` written by the SBI implementation
    word[3] = `trig_tdata3` written by the SBI implementation
```

The possible error codes returned in `sbiret.error` are shown in[Table 3](#table%5Fdbtr%5Fread%5Ftriggers%5Ferrors).

__Table 3\. Debug Triggers Read Errors__
| Error code           | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| SBI\_SUCCESS         | State and configuration of triggers read successfully.                           |
| SBI\_ERR\_NO\_SHMEM  | Shared memory for debug triggers is disabled.                                    |
| SBI\_ERR\_BAD\_RANGE | Either trig\_idx\_base >= trig\_max ortrig\_idx\_base + trig\_count >= trig\_max |

### [](#19-1-4-function-install-triggers-fid-3)19.1.4\. Function: Install triggers (FID #3)

```C
struct sbiret sbi_debug_install_triggers(unsigned long trig_count)
```

Install debug triggers based on an array of trigger configurations in the shared memory of the calling hart. The `trig_idx` assigned to each installed trigger configuration is written back in the shared memory.

The `trig_count` parameter represents the number of trigger configuration entries in the shared memory at offset `0x0`.

The i’th trigger configuration at `offset = i * (XLEN / 2)` in the shared memory consists of four consecutive XLEN-bit words in little-endian format which are organized as follows:

```C
    word[0] = `trig_idx` written back by the SBI implementation
    word[1] = `trig_tdata1` read by the SBI implementation
    word[2] = `trig_tdata2` read by the SBI implementation
    word[3] = `trig_tdata3` read by the SBI implementation
```

The SBI implementation MUST consider trigger configurations in the increasing order of the array index and starting with array index `0`. To install a debug trigger for the trigger configuration at array index `i` in the shared memory, the SBI implementation MUST do the following:

1. Map an unused HW debug trigger which matches the trigger configuration to an an unused `trig_idx`.
2. Save a copy of the `trig_tdata1.vs`, `trig_tdata1.vu`, `trig_tdata1.s`, and`trig_tdata.u` bits in `trig_state`.
3. Update the `tdata1`, `tdata2`, and `tdata3` CSRs of the HW debug trigger.
4. Write `trig_idx` at `offset = i * (XLEN / 2)` in the shared memory.

Additionally for each trigger configuration chain in the shared memory, the SBI implementation MUST assign contiguous `trig_idx` values and contiguous HW debug triggers when installing the trigger configuration chain.

The last trigger configuration in the shared memory MUST not have `trig_tdata1.chain == 1`for `trig_tdata1.type = 2 or 6` to prevent incomplete trigger configuration chain in the shared memory.

The `sbiret.value` is set to zero upon success or if shared memory is disabled whereas`sbiret.value` is set to the array index `i` of the failing trigger configuration upon other failures.

The possible error codes returned in `sbiret.error` are shown in[Table 4](#table%5Fdbtr%5Finstall%5Ftriggers%5Ferrors).

__Table 4\. Debug Triggers Install Errors__
| Error code               | Description                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Triggers installed successfully.                                                                                           |
| SBI\_ERR\_NO\_SHMEM      | Shared memory for debug triggers is disabled.                                                                              |
| SBI\_ERR\_BAD\_RANGE     | trig\_count >= trig\_max                                                                                                   |
| SBI\_ERR\_INVALID\_PARAM | One of the trigger configuration words trig\_tdata1, trig\_tdata2, or trig\_tdata3 has an invalid value.                   |
| SBI\_ERR\_FAILED         | Failed to assign trig\_idx or HW debug trigger for one of the trigger configurations.                                      |
| SBI\_ERR\_NOT\_SUPPORTED | One of the trigger configuration can’t be programmed due to unimplemented optional bits in tdata1, tdata2, or tdata3 CSRs. |

### [](#19-1-5-function-update-triggers-fid-4)19.1.5\. Function: Update triggers (FID #4)

```C
struct sbiret sbi_debug_update_triggers(unsigned long trig_count)
```

Update already installed debug triggers based on a trigger configuration array in the shared memory of the calling hart.

The `trig_count` parameter represents the number of trigger configuration entries in the shared memory at offset `0x0`.

The i’th trigger configuration at `offset = i * (XLEN / 2)` in the shared memory consists of four consecutive XLEN-bit words in little-endian format as follows:

```C
    word[0] = `trig_idx` read by the SBI implementation
    word[1] = `trig_tdata1` read by the SBI implementation
    word[2] = `trig_tdata2` read by the SBI implementation
    word[3] = `trig_tdata3` read by the SBI implementation
```

The SBI implementation MUST consider trigger configurations in the increasing order of array index and starting with array index `0`. To update a debug trigger based on trigger configuration at array index `i` in the shared memory, the SBI implementation MUST do the following:

1. Check and fail if any of the following constraints are not satisfied:  
   1. `trig_idx` represents logical index of a installed debug trigger  
   2. `trig_tdata1.type` matches with original installed debug trigger  
   3. `trig_tdata1.chain` matches with original installed debug trigger
2. Save a copy of the `trig_tdata1.vs`, `trig_tdata1.vu`, `trig_tdata1.s`, and`trig_tdata.u` bits in `trig_state`.
3. Update the `tdata1`, `tdata2`, and `tdata3` CSRs of the HW debug trigger.

The `sbiret.value` is set to zero upon success or if shared memory is disabled whereas`sbiret.value` is set to the array index `i` of the failing trigger configuration upon other failures.

The possible error codes returned in `sbiret.error` are shown in[Table 5](#table%5Fdbtr%5Fupdate%5Ftriggers%5Ferrors).

__Table 5\. Debug Triggers Update Errors__
| Error code               | Description                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SBI\_SUCCESS             | Triggers updated successfully.                                                                                                                               |
| SBI\_ERR\_NO\_SHMEM      | Shared memory for debug triggers is disabled.                                                                                                                |
| SBI\_ERR\_BAD\_RANGE     | trig\_count >= trig\_max                                                                                                                                     |
| SBI\_ERR\_INVALID\_PARAM | One of the trigger configuration in the shared memory has an invalid of trig\_idx (i.e. trig\_idx >= trig\_max), trig\_tdata1,trig\_tdata2, or trig\_tdata3. |
| SBI\_ERR\_FAILED         | One of the trigger configurations has valid trig\_idx but the corresponding debug trigger is not mapped to any HW debug trigger.                             |
| SBI\_ERR\_NOT\_SUPPORTED | One of the trigger configuration can’t be programmed due to unimplemented optional bits in tdata1, tdata2, or tdata3 CSRs.                                   |

### [](#19-1-6-function-uninstall-a-set-of-triggers-fid-5)19.1.6\. Function: Uninstall a set of triggers (FID #5)

```C
struct sbiret sbi_debug_uninstall_triggers(unsigned long trig_idx_base,
                                           unsigned long trig_idx_mask)
```

Uninstall a set of debug triggers specified by the `trig_idx_base` and `trig_idx_mask`parameters on the calling hart. The `trig_idx_base` specifies the starting trigger index, while the `trig_idx_mask` is a bitmask indicating which triggers, relative to the base, are to be uninstalled. Each bit in the mask corresponds to a specific trigger, allowing for batch operations on multiple triggers simultaneously.

For each debug trigger in the specified set of debug triggers, the SBI implementation MUST:

1. Clear the `tdata1`, `tdata2`, and `tdata3` CSRs of the mapped HW debug trigger.
2. Clear the `trig_state` of the debug trigger.
3. Unmap and free the HW debug trigger and corresponding `trig_idx` for re-use in the future trigger installations.

The possible error codes returned in `sbiret.error` are shown in[Table 6](#table%5Fdbtr%5Funinstall%5Ftriggers%5Ferrors).

__Table 6\. Debug Triggers Uninstall Errors__
| Error code               | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Triggers uninstalled successfully.                                                                                                                              |
| SBI\_ERR\_INVALID\_PARAM | One of the debug triggers with index trig\_idx in the specified set of debug triggers either not mapped to any HW debug trigger OR has trig\_idx \>= trig\_max. |

### [](#19-1-7-function-enable-a-set-of-triggers-fid-6)19.1.7\. Function: Enable a set of triggers (FID #6)

```C
struct sbiret sbi_debug_enable_triggers(unsigned long trig_idx_base,
                                        unsigned long trig_idx_mask)
```

Enable a set of debug triggers specified by the `trig_idx_base` and `trig_idx_mask`parameters on the calling hart. The `trig_idx_base` specifies the starting trigger index, while the `trig_idx_mask` is a bitmask indicating which triggers, relative to the base, are to be enabled. Each bit in the mask corresponds to a specific trigger, allowing for batch operations on multiple triggers simultaneously.

To enable a debug trigger in the specified set of debug triggers, the SBI implementation MUST restore the `vs`, `vu`, `s`, and `u` bits of the mapped HW debug trigger from their saved copy in `trig_state`.

The possible error codes returned in `sbiret.error` are shown in[Table 7](#table%5Fdbtr%5Fenable%5Ftriggers%5Ferrors).

__Table 7\. Debug Triggers Enable Errors__
| Error code               | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Triggers enabled successfully.                                                                                                                                  |
| SBI\_ERR\_INVALID\_PARAM | One of the debug triggers with index trig\_idx in the specified set of debug triggers either not mapped to any HW debug trigger OR has trig\_idx \>= trig\_max. |

### [](#19-1-8-function-disable-a-set-of-triggers-fid-7)19.1.8\. Function: Disable a set of triggers (FID #7)

```C
struct sbiret sbi_debug_disable_triggers(unsigned long trig_idx_base,
                                         unsigned long trig_idx_mask)
```

Disable a set of debug triggers specified by the `trig_idx_base` and `trig_idx_mask`parameters on the calling hart. The `trig_idx_base` specifies the starting trigger index, while the `trig_idx_mask` is a bitmask indicating which triggers, relative to the base, are to be disabled. Each bit in the mask corresponds to a specific trigger, allowing for batch operations on multiple triggers simultaneously.

To disable a debug trigger in the specified set of debug triggers, the SBI implementation MUST clear the `vs`, `vu`, `s`, and `u` bits of the mapped HW debug trigger.

The possible error codes returned in `sbiret.error` are shown in[Table 8](#table%5Fdbtr%5Fdisable%5Ftriggers%5Ferrors).

__Table 8\. Debug Triggers Disable Errors__
| Error code               | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Triggers disabled successfully.                                                                                                                                 |
| SBI\_ERR\_INVALID\_PARAM | One of the debug triggers with index trig\_idx in the specified set of debug triggers either not mapped to any HW debug trigger OR has trig\_idx \>= trig\_max. |

### [](#19-1-9-function-listing)19.1.9\. Function Listing

__Table 9\. Debug Triggers Function List__
| Function Name                   | SBI Version | FID | EID        |
| ------------------------------- | ----------- | --- | ---------- |
| sbi\_debug\_num\_triggers       | 3.0         | 0   | 0x44425452 |
| sbi\_debug\_set\_shmem          | 3.0         | 1   | 0x44425452 |
| sbi\_debug\_read\_triggers      | 3.0         | 2   | 0x44425452 |
| sbi\_debug\_install\_triggers   | 3.0         | 3   | 0x44425452 |
| sbi\_debug\_update\_triggers    | 3.0         | 4   | 0x44425452 |
| sbi\_debug\_uninstall\_triggers | 3.0         | 5   | 0x44425452 |
| sbi\_debug\_enable\_triggers    | 3.0         | 6   | 0x44425452 |
| sbi\_debug\_disable\_triggers   | 3.0         | 7   | 0x44425452 |

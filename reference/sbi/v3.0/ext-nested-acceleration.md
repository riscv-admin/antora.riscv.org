# 15.1. Nested Acceleration Extension (EID #0x4E41434C "NACL")

## [](#15-1-nested-acceleration-extension-eid-0x4e41434c-nacl)15.1\. Nested Acceleration Extension (EID #0x4E41434C "NACL")

Nested virtualization is the ability of a hypervisor to run another hypervisor as a guest. RISC-V nested virtualization requires an L0 hypervisor (running in hypervisor-mode) to trap-and-emulate the RISC-V H-extension cite:\[priv\_v1\_12\] functionality (such as CSR accesses, HFENCE instructions, HLV/HSV instructions, etc.) for the L1 hypervisor (running in virtualized supervisor-mode).

The SBI nested acceleration extension defines a shared memory based interface between the SBI implementation (or L0 hypervisor) and the supervisor software (or L1 hypervisor) which allows both to collaboratively reduce traps taken by the L0 hypervisor for emulating RISC-V H-extension functionality. The nested acceleration shared memory allows the L1 hypervisor to batch multiple RISC-V H-extension CSR accesses and HFENCE requests which are then emulated by the L0 hypervisor upon an explicit synchronization SBI call.

| |  The M-mode firmware should not implement the SBI nested acceleration extension if the underlying platform has the RISC-V H-extension implemented in hardware. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |

This SBI extension defines optional features which MUST be discovered by the supervisor software (or L1 hypervisor) before using the corresponding SBI functions. Each nested acceleration feature is assigned a unique ID which is an unsigned 32-bit integer. The [Table 1](#table%5Fnacl%5Ffeatures) below provides a list of all nested acceleration features.

__Table 1\. Nested acceleration features__
| Feature ID    | Feature Name                   | Description             |
| ------------- | ------------------------------ | ----------------------- |
| 0x00000000    | SBI\_NACL\_FEAT\_SYNC\_CSR     | Synchronize CSR         |
| 0x00000001    | SBI\_NACL\_FEAT\_SYNC\_HFENCE  | Synchronize HFENCE      |
| 0x00000002    | SBI\_NACL\_FEAT\_SYNC\_SRET    | Synchronize SRET        |
| 0x00000003    | SBI\_NACL\_FEAT\_AUTOSWAP\_CSR | Autoswap CSR            |
| \> 0x00000003 | RESERVED                       | Reserved for future use |

To use the SBI nested acceleration extension, the supervisor software (or L1 hypervisor) MUST set up a nested acceleration shared memory physical address for each virtual hart at boot-time. The physical base address of the nested acceleration shared memory MUST be 4096 bytes (i.e. page) aligned and the size of the nested acceleration shared memory must be `4096 + (1024 * (XLEN / 8))` bytes. The[Table 2](#table%5Fnacl%5Fshmem%5Flayout) below shows the layout of nested acceleration shared memory.

__Table 2\. Nested acceleration shared memory layout__
| Name          | Offset     | Size (bytes) | Description                                                                                                                                                                             |
| ------------- | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scratch space | 0x00000000 | 4096         | Nested acceleration feature specific data.                                                                                                                                              |
| CSR space     | 0x00001000 | XLEN \* 128  | An array of 1024 XLEN-bit words where each word corresponds to a possible RISC-V H-extension CSR defined in the Table 2.1 of the RISC-V privileged specification cite:\[priv\_v1\_12\]. |

Any nested acceleration feature may define the contents of the scratch space shown in the [Table 2](#table%5Fnacl%5Fshmem%5Flayout) above if required.

The contents of the CSR space shown in the [Table 2](#table%5Fnacl%5Fshmem%5Flayout)above is an array of RISC-V H-extension CSR values where CSR `<x>` is at index `<i> = ((<x> & 0xc00) >> 2) | (<x> & 0xff)`. The SBI implementation (or L0 hypervisor) MUST update the CSR space whenever the state of any RISC-V H-extension CSR changes unless some nested acceleration feature defines a different behaviour. The [Table 3](#table%5Fnacl%5Fhext%5Fcsr%5Findex%5Franges)below shows CSR space index ranges for all possible 1024 RISC-V H-extension CSRs.

__Table 3\. Nested acceleration H-extension CSR index ranges__
| H-extension CSR address | SBI NACL CSR space index |         |               |               |
| ----------------------- | ------------------------ | ------- | ------------- | ------------- |
| \[11:10\]               | \[9:8\]                  | \[7:4\] | Hex Range     | Hex Range     |
| 00                      | 10                       | xxxx    | 0x200 - 0x2ff | 0x000 - 0x0ff |
| 01                      | 10                       | 0xxx    | 0x600 - 0x67f | 0x100 - 0x17f |
| 01                      | 10                       | 10xx    | 0x680 - 0x6bf | 0x180 - 0x1bf |
| 01                      | 10                       | 11xx    | 0x6c0 - 0x6ff | 0x1c0 - 0x1ff |
| 10                      | 10                       | 0xxx    | 0xa00 - 0xa7f | 0x200 - 0x27f |
| 10                      | 10                       | 10xx    | 0xa80 - 0xabf | 0x280 - 0x2bf |
| 10                      | 10                       | 11xx    | 0xac0 - 0xaff | 0x2c0 - 0x2ff |
| 11                      | 10                       | 0xxx    | 0xe00 - 0xe7f | 0x300 - 0x37f |
| 11                      | 10                       | 10xx    | 0xe80 - 0xebf | 0x380 - 0x3bf |
| 11                      | 10                       | 11xx    | 0xec0 - 0xeff | 0x3c0 - 0x3ff |

### [](#15-1-1-feature-synchronize-csr-id-0)15.1.1\. Feature: Synchronize CSR (ID #0)

The synchronize CSR feature describes the ability of the SBI implementation (or L0 hypervisor) to allow supervisor software (or L1 hypervisor) to write RISC-V H-extension CSRs using the CSR space.

This nested acceleration feature defines the scratch space offset range`0x0F80 - 0x0FFF` (128 bytes) as nested CSR dirty bitmap. The nested CSR dirty bitmap contains 1-bit for each possible RISC-V H-extension CSR.

To write a CSR `<x>` in nested acceleration shared memory, the supervisor software (or L1 hypervisor) MUST do the following:

1. Compute `<i> = ((<x> & 0xc00) >> 2) | (<x> & 0xff)`
2. Write a new CSR value at word with index `<i>` in the CSR space
3. Set the `<i>` bit in the nested CSR dirty bitmap

To synchronize a CSR `<x>`, the SBI implementation (or L0 hypervisor) MUST do the following:

1. Compute `<i> = ((<x> & 0xc00) >> 2) | (<x> & 0xff)`
2. If bit `<i>` is not set in the nested CSR dirty bitmap then goto step 5
3. Emulate write to CSR `<x>` with the new CSR value taken from the word with index `<i>` in the CSR space
4. Clear the `<i>` bit in the nested CSR dirty bitmap
5. Write back the latest CSR value of CSR `<x>` to the word with index`<i>` in the CSR space

When synchronizing multiple CSRs, if the value of a CSR `<y>` depends on the value of some other CSR `<x>` then the SBI implementation (or L0 hypervisor) MUST synchronize CSR `<x>` before CSR `<y>`. For example, the value of CSR`hip` depends on the value of the CSR `hvip`, which means `hvip` is emulated and written first, followed by `hip`.

### [](#15-1-2-feature-synchronize-hfence-id-1)15.1.2\. Feature: Synchronize HFENCE (ID #1)

The synchronize HFENCE feature describes the ability of the SBI implementation (or L0 hypervisor) to allow supervisor software (or L1 hypervisor) to issue HFENCE using the scratch space.

This nested acceleration feature defines the scratch space offset range`0x0800 - 0x0F7F` (1920 bytes) as an array of nested HFENCE entries. The total number of nested HFENCE entries are `3840 / XLEN` where each nested HFENCE entry consists of four XLEN-bit words.

A nested HFENCE entry is equivalent to an HFENCE over a range of guest addresses. The [Table 4](#table%5Fnacl%5Fhfence%5Fentry%5Fformat) below shows the nested HFENCE entry format whereas [Table 5](#table%5Fnacl%5Fhfence%5Fentry%5Ftypes) below provides a list of nested HFENCE entry types. Upon an explicit synchronize HFENCE request from supervisor software (or L1 hypervisor), the SBI implementation (or L0 hypervisor) will process nested HFENCE entries with the `Config.Pending`bit set. After processing pending nested HFENCE entries, the SBI implementation (or L0 hypervisor) will clear the `Config.Pending` bit of these entries.

__Table 4\. Nested HFENCE entry format__
| Word | Name         | Encoding                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Config       | Config information about the nested HFENCE entry  BIT\[XLEN-1:XLEN-1\] - Pending BIT\[XLEN-2:XLEN-4\] - Reserved and must be zero BIT\[XLEN-5:XLEN-8\] - Type BIT\[XLEN-9:XLEN-9\] - Reserved and must be zero BIT\[XLEN-10:XLEN-16\] - Order if XLEN == 32 then BIT\[15:9\] - VMID BIT\[8:0\] - ASID else BIT\[29:16\] - VMID BIT\[15:0\] - ASID  The page size for invalidation must be 1 << (Config.Order + 12) bytes. |
| 1    | Page\_Number | Page address right shifted by Config.Order + 12                                                                                                                                                                                                                                                                                                                                                                           |
| 2    | Reserved     | Reserved for future use and must be zero                                                                                                                                                                                                                                                                                                                                                                                  |
| 3    | Page\_Count  | Number of pages to invalidate                                                                                                                                                                                                                                                                                                                                                                                             |

__Table 5\. Nested HFENCE entry types__
| Type | Name            | Description                                                                                                                                                                                                     |
| ---- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | GVMA            | Invalidate a guest physical address range across all VMIDs. The VMID and ASID fields of theConfig word are ignored and MUST be zero.                                                                            |
| 1    | GVMA\_ALL       | Invalidate all guest physical addresses across all VMIDs. The Order, VMID and ASID fields of the Config word are ignored and MUST be zero. The Page\_Number and Page\_Count words are ignored and MUST be zero. |
| 2    | GVMA\_VMID      | Invalidate a guest physical address range for a particular VMID. The ASID field of the Config word is ignored and MUST be zero.                                                                                 |
| 3    | GVMA\_VMID\_ALL | Invalidate all guest physical addresses for a particular VMID. The Order and ASID fields of the Config word are ignored and MUST be zero. The Page\_Number and Page\_Count words are ignored and MUST be zero.  |
| 4    | VVMA            | Invalidate a guest virtual address range for a particular VMID. The ASID field of the Config word is ignored and MUST be zero.                                                                                  |
| 5    | VVMA\_ALL       | Invalidate all guest virtual addresses for a particular VMID. The Order and ASID fields of the Config word are ignored and MUST be zero. The Page\_Number and Page\_Count words are ignored and MUST be zero.   |
| 6    | VVMA\_ASID      | Invalidate a guest virtual address range for a particular VMID and ASID.                                                                                                                                        |
| 7    | VVMA\_ASID\_ALL | Invalidate all guest virtual addresses for a particular VMID and ASID. The Order field of the Config word is ignored and MUST be zero. The Page\_Number and Page\_Count words are ignored and MUST be zero.     |
| \> 7 | Reserved        | Reserved for future use.                                                                                                                                                                                        |

To add a nested HFENCE entry, the supervisor software (or L1 hypervisor) MUST do the following:

1. Find an unused nested HFENCE entry with `Config.Pending == 0`
2. Update the `Page_Number` and `Page_Count` words in the nested HFENCE entry
3. Update the `Config` word in the nested HFENCE entry such that`Config.Pending` bit is set

To synchronize a nested HFENCE entry, the SBI implementation (or L0 hypervisor) MUST do the following:

1. If `Config.Pending == 0` then do nothing and skip below steps
2. Process HFENCE based on details in the nested HFENCE entry
3. Clear the `Config.Pending` bit in the nested HFENCE entry

### [](#15-1-3-feature-synchronize-sret-id-2)15.1.3\. Feature: Synchronize SRET (ID #2)

The synchronize SRET feature describes the ability of the SBI implementation (or L0 hypervisor) to do synchronization of CSRs and HFENCEs in the nested acceleration shared memory for the supervisor software (or L1 hypervisor) along with SRET emulation.

This nested acceleration feature defines the scratch space offset range`0x0000 - 0x01FF` (512 bytes) as nested SRET context. The[Table 6](#table%5Fnacl%5Fsret%5Fcontext) below shows contents of the nested SRET context.

__Table 6\. Nested SRET context__
| Offset                    | Name     | Encoding                                 |
| ------------------------- | -------- | ---------------------------------------- |
| 0 \* (XLEN / 8)           | Reserved | Reserved for future use and must be zero |
| 1 \* (XLEN / 8)           | X1       | Value to be restored in GPR X1           |
| 2 \* (XLEN / 8)           | X2       | Value to be restored in GPR X2           |
| 3 \* (XLEN / 8)           | X3       | Value to be restored in GPR X3           |
| 4 \* (XLEN / 8)           | X4       | Value to be restored in GPR X4           |
| 5 \* (XLEN / 8)           | X5       | Value to be restored in GPR X5           |
| 6 \* (XLEN / 8)           | X6       | Value to be restored in GPR X6           |
| 7 \* (XLEN / 8)           | X7       | Value to be restored in GPR X7           |
| 8 \* (XLEN / 8)           | X8       | Value to be restored in GPR X8           |
| 9 \* (XLEN / 8)           | X9       | Value to be restored in GPR X9           |
| 10 \* (XLEN / 8)          | X10      | Value to be restored in GPR X10          |
| 11 \* (XLEN / 8)          | X11      | Value to be restored in GPR X11          |
| 12 \* (XLEN / 8)          | X12      | Value to be restored in GPR X12          |
| 13 \* (XLEN / 8)          | X13      | Value to be restored in GPR X13          |
| 14 \* (XLEN / 8)          | X14      | Value to be restored in GPR X14          |
| 15 \* (XLEN / 8)          | X15      | Value to be restored in GPR X15          |
| 16 \* (XLEN / 8)          | X16      | Value to be restored in GPR X16          |
| 17 \* (XLEN / 8)          | X17      | Value to be restored in GPR X17          |
| 18 \* (XLEN / 8)          | X18      | Value to be restored in GPR X18          |
| 19 \* (XLEN / 8)          | X19      | Value to be restored in GPR X19          |
| 20 \* (XLEN / 8)          | X20      | Value to be restored in GPR X20          |
| 21 \* (XLEN / 8)          | X21      | Value to be restored in GPR X21          |
| 22 \* (XLEN / 8)          | X22      | Value to be restored in GPR X22          |
| 23 \* (XLEN / 8)          | X23      | Value to be restored in GPR X23          |
| 24 \* (XLEN / 8)          | X24      | Value to be restored in GPR X24          |
| 25 \* (XLEN / 8)          | X25      | Value to be restored in GPR X25          |
| 26 \* (XLEN / 8)          | X26      | Value to be restored in GPR X26          |
| 27 \* (XLEN / 8)          | X27      | Value to be restored in GPR X27          |
| 28 \* (XLEN / 8)          | X28      | Value to be restored in GPR X28          |
| 29 \* (XLEN / 8)          | X29      | Value to be restored in GPR X29          |
| 30 \* (XLEN / 8)          | X30      | Value to be restored in GPR X30          |
| 31 \* (XLEN / 8)          | X31      | Value to be restored in GPR X31          |
| 32 \* (XLEN / 8) \- 0x1FF | Reserved | Reserved for future use                  |

Before sending a synchronize SRET request to the SBI implementation (or L0 hypervisor), the supervisor software (or L1 hypervisor) MUST write the GPR `X<i>` values to be restored at offset `<i> * (XLEN / 8)` of the nested SRET context.

Upon a synchronize SRET request from the supervisor software (or L1 hypervisor), the SBI implementation (or L0 hypervisor) MUST do the following:

1. If SBI\_NACL\_FEAT\_SYNC\_CSR feature is available then  
   1. All RISC-V H-extension CSRs implemented by the SBI implementation (or L0 hypervisor) are synchronized as described in the[\[\_feature\_synchronize\_csr\_id\_0\]](#%5Ffeature%5Fsynchronize%5Fcsr%5Fid%5F0). This is equivalent to the SBI call `sbi_nacl_sync_csr(-1UL)`.
2. If SBI\_NACL\_FEAT\_SYNC\_HFENCE feature is available then  
   1. All nested HFENCE entries are synchronized as described in the[\[\_feature\_synchronize\_hfence\_id\_1\]](#%5Ffeature%5Fsynchronize%5Fhfence%5Fid%5F1). This is equivalent to the SBI call `sbi_nacl_sync_hfence(-1UL)`.
3. Restore GPR `X<i>` registers from the nested SRET context.
4. Emulate the SRET instruction as defined by the RISC-V Privilege specification cite:\[priv\_v1\_12\].

### [](#15-1-4-feature-autoswap-csr-id-3)15.1.4\. Feature: Autoswap CSR (ID #3)

The autoswap CSR feature describes the ability of the SBI implementation (or L0 hypervisor) to automatically swap certain RISC-V H-extension CSR values from the nested acceleration shared memory in the following situations:

* Before emulating the SRET instruction for a synchronized SRET request from the supervisor software (or L1 hypervisor).
* After supervisor (or L1) virtualization state changes from ON to OFF.

| |  The supervisor software (or L1 hypervisor) should use the autoswap CSR feature in conjunction with the synchronize SRET feature. |
| ----------------------------------------------------------------------------------------------------------------------------------- |

This nested acceleration feature defines the scratch space offset range `0x0200 - 0x027F` (128 bytes) as nested autoswap context. The[Table 7](#table%5Fnacl%5Fautoswap%5Fcontext) below shows contents of the nested autoswap context.

__Table 7\. Nested autoswap context__
| Offset                  | Name            | Encoding                                                                                        |
| ----------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| 0 \* (XLEN / 8)         | Autoswap\_Flags | Autoswap flags  BIT\[XLEN-1:1\] - Reserved for future use and must be zero BIT\[0:0\] - HSTATUS |
| 1 \* (XLEN / 8)         | HSTATUS         | Value to be swapped with HSTATUS CSR                                                            |
| 2 \* (XLEN / 8) \- 0x7F | Reserved        | Reserved for future use.                                                                        |

To enable automatic swapping of CSRs from the nested autoswap context, the supervisor software (or L1 hypervisor) MUST do the following:

1. Write the `HSTATUS` swap value in the nested autoswap context.
2. Set `Autoswap_Flags.HSTATUS` bit in the nested autoswap context.

To swap CSRs from the nested autoswap context, the SBI implementation (or L0 hypervisor) MUST do the following:

1. If `Autoswap_Flags.HSTATUS` bit is set in the nested autoswap context then swap the supervisor `HSTATUS` CSR value with the `HSTATUS` value in the nested autoswap context.

### [](#15-1-5-function-probe-nested-acceleration-feature-fid-0)15.1.5\. Function: Probe nested acceleration feature (FID #0)

```C
struct sbiret sbi_nacl_probe_feature(uint32_t feature_id)
```

Probe a nested acceleration feature. This is a mandatory function of the SBI nested acceleration extension. The `feature_id` parameter specifies the nested acceleration feature to probe. [Table 1](#table%5Fnacl%5Ffeatures) provides a list of possible feature IDs.

This function always returns SBI\_SUCCESS in `sbiret.error`. It returns `0`in `sbiret.value` if the given `feature_id` is not available, or `1` in`sbiret.value` if it is available.

### [](#15-1-6-function-set-nested-acceleration-shared-memory-fid-1)15.1.6\. Function: Set nested acceleration shared memory (FID #1)

```C
struct sbiret sbi_nacl_set_shmem(unsigned long shmem_phys_lo,
                                 unsigned long shmem_phys_hi,
                                 unsigned long flags)
```

Set and enable the shared memory for nested acceleration on the calling hart. This is a mandatory function of the SBI nested acceleration extension.

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are not all-ones bitwise then `shmem_phys_lo` specifies the lower XLEN bits and `shmem_phys_hi`specifies the upper XLEN bits of the shared memory physical base address.`shmem_phys_lo` MUST be 4096 bytes (i.e. page) aligned and the size of the shared memory must be `4096 + (XLEN * 128)` bytes.

If both `shmem_phys_lo` and `shmem_phys_hi` parameters are all-ones bitwise then the nested acceleration features are disabled.

The `flags` parameter is reserved for future use and must be zero.

The possible error codes returned in `sbiret.error` are shown in[Table 8](#table%5Fnacl%5Fset%5Fshmem%5Ferrors).

__Table 8\. NACL Set Shared Memory Errors__
| Error code                 | Description                                                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | Shared memory was set or cleared successfully.                                                                                                                                                                                                              |
| SBI\_ERR\_INVALID\_PARAM   | The flags parameter is not zero or or theshmem\_phys\_lo parameter is not 4096 bytes aligned.                                                                                                                                                               |
| SBI\_ERR\_INVALID\_ADDRESS | The shared memory pointed to by the shmem\_phys\_lo and shmem\_phys\_hi parameters does not satisfy the requirements described in[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter). |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                                                                                |

### [](#15-1-7-function-synchronize-shared-memory-csrs-fid-2)15.1.7\. Function: Synchronize shared memory CSRs (FID #2)

```C
struct sbiret sbi_nacl_sync_csr(unsigned long csr_num)
```

Synchronize CSRs in the nested acceleration shared memory. This is an optional function which is only available if the SBI\_NACL\_FEAT\_SYNC\_CSR feature is available. The parameter `csr_num` specifies the set of RISC-V H-extension CSRs to be synchronized.

If `csr_num` is all-ones bitwise then all RISC-V H-extension CSRs implemented by the SBI implementation (or L0 hypervisor) are synchronized as described in the [\[\_feature\_synchronize\_csr\_id\_0\]](#%5Ffeature%5Fsynchronize%5Fcsr%5Fid%5F0).

If `(csr_num & 0x300) == 0x200` and `csr_num < 0x1000` then only a single RISC-V H-extension CSR specified by the `csr_num` parameter is synchronized as described in the [\[\_feature\_synchronize\_csr\_id\_0\]](#%5Ffeature%5Fsynchronize%5Fcsr%5Fid%5F0).

The possible error codes returned in `sbiret.error` are shown in[Table 9](#table%5Fnacl%5Fsync%5Fcsr%5Ferrors).

__Table 9\. NACL Synchronize CSR Errors__
| Error code               | Description                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | CSRs synchronized successfully.                                                                                                                                  |
| SBI\_ERR\_NOT\_SUPPORTED | SBI\_NACL\_FEAT\_SYNC\_CSR feature is not available.                                                                                                             |
| SBI\_ERR\_INVALID\_PARAM | csr\_num is not all-ones bitwise and either: \* (csr\_num & 0x300) != 0x200 or \* csr\_num >= 0x1000 or \* csr\_num is not implemented by the SBI implementation |
| SBI\_ERR\_NO\_SHMEM      | Nested acceleration shared memory not available.                                                                                                                 |

### [](#15-1-8-function-synchronize-shared-memory-hfences-fid-3)15.1.8\. Function: Synchronize shared memory HFENCEs (FID #3)

```C
struct sbiret sbi_nacl_sync_hfence(unsigned long entry_index)
```

Synchronize HFENCEs in the nested acceleration shared memory. This is an optional function which is only available if the SBI\_NACL\_FEAT\_SYNC\_HFENCE feature is available. The parameter `entry_index` specifies the set of nested HFENCE entries to be synchronized.

If `entry_index` is all-ones bitwise then all nested HFENCE entries are synchronized as described in the [\[\_feature\_synchronize\_hfence\_id\_1\]](#%5Ffeature%5Fsynchronize%5Fhfence%5Fid%5F1).

If `entry_index < (3840 / XLEN)` then only a single nested HFENCE entry specified by the `entry_index` parameter is synchronized as described in the [\[\_feature\_synchronize\_hfence\_id\_1\]](#%5Ffeature%5Fsynchronize%5Fhfence%5Fid%5F1).

The possible error codes returned in `sbiret.error` are shown in[Table 10](#table%5Fnacl%5Fsync%5Fhfence%5Ferrors).

__Table 10\. NACL Synchronize HFENCE Errors__
| Error code               | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| SBI\_SUCCESS             | HFENCEs synchronized successfully.                                      |
| SBI\_ERR\_NOT\_SUPPORTED | SBI\_NACL\_FEAT\_SYNC\_HFENCE feature is not available.                 |
| SBI\_ERR\_INVALID\_PARAM | entry\_index is not all-ones bitwise and entry\_index >= (3840 / XLEN). |
| SBI\_ERR\_NO\_SHMEM      | Nested acceleration shared memory not available.                        |

### [](#15-1-9-function-synchronize-shared-memory-and-emulate-sret-fid-4)15.1.9\. Function: Synchronize shared memory and emulate SRET (FID #4)

```C
struct sbiret sbi_nacl_sync_sret(void)
```

Synchronize CSRs and HFENCEs in the nested acceleration shared memory and emulate the SRET instruction. This is an optional function which is only available if the SBI\_NACL\_FEAT\_SYNC\_SRET feature is available.

This function is used by supervisor software (or L1 hypervisor) to do a synchronize SRET request and the SBI implementation (or L0 hypervisor) MUST handle it as described in the [\[\_feature\_synchronize\_sret\_id\_2\]](#%5Ffeature%5Fsynchronize%5Fsret%5Fid%5F2).

This function does not return upon success and the possible error codes returned in `sbiret.error` upon failure are shown in[Table 11](#table%5Fnacl%5Fsync%5Fsret%5Ferrors).

__Table 11\. NACL Synchronize SRET Errors__
| Error code               | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| SBI\_ERR\_NOT\_SUPPORTED | SBI\_NACL\_FEAT\_SYNC\_SRET feature is not available. |
| SBI\_ERR\_NO\_SHMEM      | Nested acceleration shared memory not available.      |

### [](#15-1-10-function-listing)15.1.10\. Function Listing

__Table 12\. NACL Function List__
| Function Name             | SBI Version | FID | EID        |
| ------------------------- | ----------- | --- | ---------- |
| sbi\_nacl\_probe\_feature | 2.0         | 0   | 0x4E41434C |
| sbi\_nacl\_set\_shmem     | 2.0         | 1   | 0x4E41434C |
| sbi\_nacl\_sync\_csr      | 2.0         | 2   | 0x4E41434C |
| sbi\_nacl\_sync\_hfence   | 2.0         | 3   | 0x4E41434C |
| sbi\_nacl\_sync\_sret     | 2.0         | 4   | 0x4E41434C |

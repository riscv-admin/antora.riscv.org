# 8.1. RFENCE Extension (EID #0x52464E43 "RFNC")

## [](#8-1-rfence-extension-eid-0x52464e43-rfnc)8.1\. RFENCE Extension (EID #0x52464E43 "RFNC")

This extension defines all remote fence related functions and replaces the legacy extensions (EIDs #0x05 - #0x07). All the functions follow the`hart_mask` as defined in binary encoding section. Any function which accepts a range of addresses (i.e. `start_addr` and `size`) must abide by the below constraints on range parameters.

The remote fence operation applies to the entire address space if either:

* `start_addr` and `size` are both 0, or
* `size` is equal to 2^XLEN-1.

### [](#8-1-1-function-remote-fence-i-fid-0)8.1.1\. Function: Remote FENCE.I (FID #0)

```C
struct sbiret sbi_remote_fence_i(unsigned long hart_mask,
                                 unsigned long hart_mask_base)
```

Instructs remote harts to execute `FENCE.I` instruction.

The possible error codes returned in `sbiret.error` are shown in the[Table 1](#table%5Frfence%5Fremote%5Ffence%5Fi%5Ferrors) below.

__Table 1\. RFENCE Remote FENCE.I Errors__
| Error code               | Description                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | IPI was sent to all the targeted harts successfully.                                                                                                                             |
| SBI\_ERR\_INVALID\_PARAM | At least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED         | The request failed for unspecified or unknown other reasons.                                                                                                                     |

### [](#8-1-2-function-remote-sfence-vma-fid-1)8.1.2\. Function: Remote SFENCE.VMA (FID #1)

```C
struct sbiret sbi_remote_sfence_vma(unsigned long hart_mask,
                                    unsigned long hart_mask_base,
                                    unsigned long start_addr,
                                    unsigned long size)
```

Instructs the remote harts to execute one or more `SFENCE.VMA` instructions, covering the range of virtual addresses between `start_addr` and`start_addr + size`.

The possible error codes returned in `sbiret.error` are shown in the[Table 2](#table%5Frfence%5Fremote%5Fsfence%5Fvma%5Ferrors) below.

__Table 2\. RFENCE Remote SFENCE.VMA Errors__
| Error code                 | Description                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | IPI was sent to all the targeted harts successfully.                                                                                                                             |
| SBI\_ERR\_INVALID\_ADDRESS | start\_addr or size is not valid.                                                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM   | At least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                     |

### [](#8-1-3-function-remote-sfence-vma-with-asid-fid-2)8.1.3\. Function: Remote SFENCE.VMA with ASID (FID #2)

```C
struct sbiret sbi_remote_sfence_vma_asid(unsigned long hart_mask,
                                         unsigned long hart_mask_base,
                                         unsigned long start_addr,
                                         unsigned long size,
                                         unsigned long asid)
```

Instruct the remote harts to execute one or more `SFENCE.VMA` instructions, covering the range of virtual addresses between `start_addr` and`start_addr + size`. This covers only the given `ASID`.

The possible error codes returned in `sbiret.error` are shown in the[Table 3](#table%5Frfence%5Fremote%5Fsfence%5Fvma%5Fasid%5Ferrors) below.

__Table 3\. RFENCE Remote SFENCE.VMA with ASID Errors__
| Error code                 | Description                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SBI\_SUCCESS               | IPI was sent to all the targeted harts successfully.                                                                                                                                             |
| SBI\_ERR\_INVALID\_ADDRESS | start\_addr or size is not valid.                                                                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM   | Either asid, or at least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                     |

### [](#8-1-4-function-remote-hfence-gvma-with-vmid-fid-3)8.1.4\. Function: Remote HFENCE.GVMA with VMID (FID #3)

```C
struct sbiret sbi_remote_hfence_gvma_vmid(unsigned long hart_mask,
                                          unsigned long hart_mask_base,
                                          unsigned long start_addr,
                                          unsigned long size,
                                          unsigned long vmid)
```

Instruct the remote harts to execute one or more `HFENCE.GVMA` instructions, covering the range of guest physical addresses between `start_addr` and`start_addr + size` only for the given `VMID`. This function call is only valid for harts implementing hypervisor extension.

The possible error codes returned in `sbiret.error` are shown in the[Table 4](#table%5Frfence%5Fremote%5Fhfence%5Fgvma%5Fvmid%5Ferrors) below.

__Table 4\. RFENCE Remote HFENCE.GVMA with VMID Errors__
| Error code                 | Description                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SBI\_SUCCESS               | IPI was sent to all the targeted harts successfully.                                                                                                                                             |
| SBI\_ERR\_NOT\_SUPPORTED   | This function is not supported as it is not implemented or one of the target hart doesn’t support hypervisor extension.                                                                          |
| SBI\_ERR\_INVALID\_ADDRESS | start\_addr or size is not valid.                                                                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM   | Either vmid, or at least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                     |

### [](#8-1-5-function-remote-hfence-gvma-fid-4)8.1.5\. Function: Remote HFENCE.GVMA (FID #4)

```C
struct sbiret sbi_remote_hfence_gvma(unsigned long hart_mask,
                                     unsigned long hart_mask_base,
                                     unsigned long start_addr,
                                     unsigned long size)
```

Instruct the remote harts to execute one or more `HFENCE.GVMA` instructions, covering the range of guest physical addresses between `start_addr` and`start_addr + size` for all the guests. This function call is only valid for harts implementing hypervisor extension.

The possible error codes returned in `sbiret.error` are shown in the[Table 5](#table%5Frfence%5Fremote%5Fhfence%5Fgvma%5Ferrors) below.

__Table 5\. RFENCE Remote HFENCE.GVMA Errors__
| Error code                 | Description                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | IPI was sent to all the targeted harts successfully.                                                                                                                             |
| SBI\_ERR\_NOT\_SUPPORTED   | This function is not supported as it is not implemented or one of the target hart doesn’t support hypervisor extension.                                                          |
| SBI\_ERR\_INVALID\_ADDRESS | start\_addr or size is not valid.                                                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM   | At least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                     |

### [](#8-1-6-function-remote-hfence-vvma-with-asid-fid-5)8.1.6\. Function: Remote HFENCE.VVMA with ASID (FID #5)

```C
struct sbiret sbi_remote_hfence_vvma_asid(unsigned long hart_mask,
                                          unsigned long hart_mask_base,
                                          unsigned long start_addr,
                                          unsigned long size,
                                          unsigned long asid)
```

Instruct the remote harts to execute one or more `HFENCE.VVMA` instructions, covering the range of guest virtual addresses between `start_addr` and`start_addr + size` for the given `ASID` and current `VMID` (in `hgatp` CSR) of calling hart. This function call is only valid for harts implementing hypervisor extension.

The possible error codes returned in `sbiret.error` are shown in the[Table 6](#table%5Frfence%5Fremote%5Fhfence%5Fvvma%5Fasid%5Ferrors) below.

__Table 6\. RFENCE Remote HFENCE.VVMA with ASID Errors__
| Error code                 | Description                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SBI\_SUCCESS               | IPI was sent to all the targeted harts successfully.                                                                                                                                             |
| SBI\_ERR\_NOT\_SUPPORTED   | This function is not supported as it is not implemented or one of the target hart doesn’t support hypervisor extension.                                                                          |
| SBI\_ERR\_INVALID\_ADDRESS | start\_addr or size is not valid.                                                                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM   | Either asid, or at least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                                     |

### [](#8-1-7-function-remote-hfence-vvma-fid-6)8.1.7\. Function: Remote HFENCE.VVMA (FID #6)

```C
struct sbiret sbi_remote_hfence_vvma(unsigned long hart_mask,
                                     unsigned long hart_mask_base,
                                     unsigned long start_addr,
                                     unsigned long size)
```

Instruct the remote harts to execute one or more `HFENCE.VVMA` instructions, covering the range of guest virtual addresses between `start_addr` and`start_addr + size` for current `VMID` (in `hgatp` CSR) of calling hart. This function call is only valid for harts implementing hypervisor extension.

The possible error codes returned in `sbiret.error` are shown in the[Table 7](#table%5Frfence%5Fremote%5Fhfence%5Fvvma%5Ferrors) below.

__Table 7\. RFENCE Remote HFENCE.VVMA Errors__
| Error code                 | Description                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS               | IPI was sent to all the targeted harts successfully.                                                                                                                             |
| SBI\_ERR\_NOT\_SUPPORTED   | This function is not supported as it is not implemented or one of the target hart doesn’t support hypervisor extension.                                                          |
| SBI\_ERR\_INVALID\_ADDRESS | start\_addr or size is not valid.                                                                                                                                                |
| SBI\_ERR\_INVALID\_PARAM   | At least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED           | The request failed for unspecified or unknown other reasons.                                                                                                                     |

### [](#8-1-8-function-listing)8.1.8\. Function Listing

__Table 8\. RFENCE Function List__
| Function Name                   | SBI Version | FID | EID        |
| ------------------------------- | ----------- | --- | ---------- |
| sbi\_remote\_fence\_i           | 0.2         | 0   | 0x52464E43 |
| sbi\_remote\_sfence\_vma        | 0.2         | 1   | 0x52464E43 |
| sbi\_remote\_sfence\_vma\_asid  | 0.2         | 2   | 0x52464E43 |
| sbi\_remote\_hfence\_gvma\_vmid | 0.2         | 3   | 0x52464E43 |
| sbi\_remote\_hfence\_gvma       | 0.2         | 4   | 0x52464E43 |
| sbi\_remote\_hfence\_vvma\_asid | 0.2         | 5   | 0x52464E43 |
| sbi\_remote\_hfence\_vvma       | 0.2         | 6   | 0x52464E43 |

# 3.1. Binary Encoding

## [](#3-1-binary-encoding)3.1\. Binary Encoding

All SBI functions share a single binary encoding, which facilitates the mixing of SBI extensions. The SBI specification follows the below calling convention.

* An `ECALL` is used as the control transfer instruction between the supervisor and the SEE.
* `a7` encodes the SBI extension ID (**EID**).
* `a6` encodes the SBI function ID (**FID**) for a given extension ID encoded in `a7` for any SBI extension defined in or after SBI v0.2.
* `a0` through `a5` contain the arguments for the SBI function call. Registers that are not defined in the SBI function call are not reserved.
* All registers except `a0` & `a1` must be preserved across an SBI call by the callee.
* SBI functions must return a pair of values in `a0` and `a1`, with `a0`returning an error code. This is analogous to returning the C structure

```C
    struct sbiret {
        long error;
        union {
            long value;
            unsigned long uvalue;
        };
    };
```

Data type `long` in C pseudocode is XLEN bits wide.

In the name of compatibility, SBI extension IDs (**EIDs**) and SBI function IDs (**FIDs**) are encoded as signed 32-bit integers. When passed in registers these follow the standard above calling convention rules.

The [Table 1](#table%5Fstandard%5Fsbi%5Ferrors) below provides a list of Standard SBI error codes.

__Table 1\. Standard SBI Errors__
| Error Type                   | Value | Description                              |
| ---------------------------- | ----- | ---------------------------------------- |
| SBI\_SUCCESS                 | 0     | Completed successfully                   |
| SBI\_ERR\_FAILED             | \-1   | Failed                                   |
| SBI\_ERR\_NOT\_SUPPORTED     | \-2   | Not supported                            |
| SBI\_ERR\_INVALID\_PARAM     | \-3   | Invalid parameter(s)                     |
| SBI\_ERR\_DENIED             | \-4   | Denied or not allowed                    |
| SBI\_ERR\_INVALID\_ADDRESS   | \-5   | Invalid address(s)                       |
| SBI\_ERR\_ALREADY\_AVAILABLE | \-6   | Already available                        |
| SBI\_ERR\_ALREADY\_STARTED   | \-7   | Already started                          |
| SBI\_ERR\_ALREADY\_STOPPED   | \-8   | Already stopped                          |
| SBI\_ERR\_NO\_SHMEM          | \-9   | Shared memory not available              |
| SBI\_ERR\_INVALID\_STATE     | \-10  | Invalid state                            |
| SBI\_ERR\_BAD\_RANGE         | \-11  | Bad (or invalid) range                   |
| SBI\_ERR\_TIMEOUT            | \-12  | Failed due to timeout                    |
| SBI\_ERR\_IO                 | \-13  | Input/Output error                       |
| SBI\_ERR\_DENIED\_LOCKED     | \-14  | Denied or not allowed due to lock status |

An `ECALL` with an unsupported SBI extension ID (**EID**) or an unsupported SBI function ID (**FID**) must return the error code `SBI_ERR_NOT_SUPPORTED`.

If an SBI function call returns an error code other than `SBI_SUCCESS`, the value returned in `a1` is unspecified unless explicitly defined for that SBI function.

Every SBI function should prefer `unsigned long` as the data type. It keeps the specification simple and easily adaptable for all RISC-V ISA types. In case the data is defined as 32bit wide, higher privilege software must ensure that it only uses 32 bit data. Parameters that are 2×XLEN bits wide are passed in a pair of argument registers, with the low-order XLEN bits in the lower-numbered register and the high-order XLEN bits in the higher-numbered register.

### [](#3-1-1-hart-list-parameter)3.1.1\. Hart list parameter

If an SBI function caller needs to pass a list of harts to the higher privilege mode, it must use a hart mask as defined below. This is applicable to any extensions defined in or after v0.2.

Any SBI function, requiring a hart mask, must take the following two arguments:

* `unsigned long hart_mask` is a scalar bit-vector containing hartids
* `unsigned long hart_mask_base` is the starting hartid from which the bit-vector must be computed.

| |  hart\_mask\_base does not need to be an enabled or supervisor available hartid unless the zeroth bit of hart\_mask is set. |
| ----------------------------------------------------------------------------------------------------------------------------- |

In a single SBI function call, the maximum number of harts that can be set is always XLEN. If a lower privilege mode needs to pass information about more than XLEN harts, it must invoke the SBI function multiple times.`hart_mask_base` can be set to `-1` to indicate that `hart_mask` shall be ignored and all available harts must be considered.

Any SBI function taking hart mask arguments may return the error values listed in the [Table 2](#table%5Fhart%5Fmask%5Ferrors) below which are in addition to function specific error values.

__Table 2\. Hart Mask Errors__
| Error code               | Description                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_ERR\_INVALID\_PARAM | At least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |

### [](#3-1-2-shared-memory-physical-address-range-parameter)3.1.2\. Shared memory physical address range parameter

If an SBI function needs to pass a shared memory physical address range to the SBI implementation (or higher privilege mode), then this physical memory address range MUST satisfy the following requirements:

* The SBI implementation MUST check that the specified physical memory range is composed of accessible physical addresses and return SBI\_ERR\_INVALID\_ADDRESS when any address in the range is not accessible.

| |  An accessible address is one that S-mode could reasonably expect to access per its description of the platform’s physical memory layout. As an SBI implementation may further restrict the allowed range, it may return a generic SBI\_ERR\_FAILED (instead of SBI\_ERR\_INVALID\_ADDRESS) when input is inaccessible with respect to its specific limits. Returning SBI\_ERR\_FAILED instead of SBI\_ERR\_INVALID\_ADDRESS, in this case, is not a violation of the above specification because the SBI implementation should detect the distinct case of violating the more strict range first, making it appropriate to return the error associated with the stricter range case immediately. |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

* The SBI implementation MUST check that the supervisor-mode software is allowed to access the specified physical memory range with the access type requested (read and/or write).
* The SBI implementation MUST access the specified physical memory range using the PMA attributes.

| |  If the supervisor-mode software accesses the same physical memory range using a memory type different than the PMA, then a loss of coherence or unexpected memory ordering may occur. The invoking software should follow the rules and sequences defined in the RISC-V Svpbmt specification to prevent the loss of coherence and memory ordering. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

* The data in the shared memory MUST follow little-endian byte ordering.

It is recommended that a memory physical address passed to an SBI function should use at least two `unsigned long` parameters to support platforms which have memory physical addresses wider than XLEN bits.

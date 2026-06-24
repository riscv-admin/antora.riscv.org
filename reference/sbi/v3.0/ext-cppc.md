# 14.1. CPPC Extension (EID #0x43505043 "CPPC")

## [](#14-1-cppc-extension-eid-0x43505043-cppc)14.1\. CPPC Extension (EID #0x43505043 "CPPC")

ACPI defines the Collaborative Processor Performance Control (CPPC) mechanism, which is an abstract and flexible mechanism for the supervisor-mode power-management software to collaborate with an entity in the platform to manage the performance of the processors.

The SBI CPPC extension provides an abstraction to access the CPPC registers through SBI calls. The CPPC registers can be memory locations shared with a separate platform entity such as a BMC. Even though CPPC is defined in the ACPI specification, it may be possible to implement a CPPC driver based on Device Tree.

[Table 1](#table%5Fcppc%5Fregisters) defines 32-bit identifiers for all CPPC registers to be used by the SBI CPPC functions. The first half of the 32-bit register space corresponds to the registers as defined by the ACPI specification. The second half provides the information not defined in the ACPI specification, but is additionally required by the supervisor-mode power-management software.

__Table 1\. CPPC Registers__
| Register ID             | Register                              | Bit Width | Attribute    | Description                                                                            |
| ----------------------- | ------------------------------------- | --------- | ------------ | -------------------------------------------------------------------------------------- |
| 0x00000000              | HighestPerformance                    | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.1                                                             |
| 0x00000001              | NominalPerformance                    | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.2                                                             |
| 0x00000002              | LowestNonlinearPerformance            | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.4                                                             |
| 0x00000003              | LowestPerformance                     | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.5                                                             |
| 0x00000004              | GuaranteedPerformanceRegister         | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.6                                                             |
| 0x00000005              | DesiredPerformanceRegister            | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.2.3                                                             |
| 0x00000006              | MinimumPerformanceRegister            | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.2.2                                                             |
| 0x00000007              | MaximumPerformanceRegister            | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.2.1                                                             |
| 0x00000008              | PerformanceReductionToleranceRegister | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.2.4                                                             |
| 0x00000009              | TimeWindowRegister                    | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.2.5                                                             |
| 0x0000000A              | CounterWraparoundTime                 | 32 / 64   | Read-only    | ACPI Spec 6.5: 8.4.6.1.3.1                                                             |
| 0x0000000B              | ReferencePerformanceCounterRegister   | 32 / 64   | Read-only    | ACPI Spec 6.5: 8.4.6.1.3.1                                                             |
| 0x0000000C              | DeliveredPerformanceCounterRegister   | 32 / 64   | Read-only    | ACPI Spec 6.5: 8.4.6.1.3.1                                                             |
| 0x0000000D              | PerformanceLimitedRegister            | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.3.2                                                             |
| 0x0000000E              | CPPCEnableRegister                    | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.4                                                               |
| 0x0000000F              | AutonomousSelectionEnable             | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.5                                                               |
| 0x00000010              | AutonomousActivityWindowRegister      | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.6                                                               |
| 0x00000011              | EnergyPerformancePreferenceRegister   | 32        | Read / Write | ACPI Spec 6.5: 8.4.6.1.7                                                               |
| 0x00000012              | ReferencePerformance                  | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.3                                                             |
| 0x00000013              | LowestFrequency                       | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.7                                                             |
| 0x00000014              | NominalFrequency                      | 32        | Read-only    | ACPI Spec 6.5: 8.4.6.1.1.7                                                             |
| 0x00000015 - 0x7FFFFFFF | Reserved for future use.              |           |              |                                                                                        |
| 0x80000000              | TransitionLatency                     | 32        | Read-only    | Provides the maximum (worst-case) performance state transition latency in nanoseconds. |
| 0x80000001 - 0xFFFFFFFF | Reserved for future use.              |           |              |                                                                                        |

### [](#14-1-1-function-probe-cppc-register-fid-0)14.1.1\. Function: Probe CPPC register (FID #0)

```C
struct sbiret sbi_cppc_probe(uint32_t cppc_reg_id)
```

Probe whether the CPPC register as specified by the `cppc_reg_id` parameter is implemented or not by the platform.

If the register is implemented, `sbiret.value` will contain the register width. If the register is not implemented, `sbiret.value` will be set to 0.

The possible error codes returned in `sbiret.error` are shown in[Table 2](#table%5Fcppc%5Fprobe%5Ferrors).

__Table 2\. CPPC Probe Errors__
| Error code               | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| SBI\_SUCCESS             | Probe completed successfully.                                      |
| SBI\_ERR\_INVALID\_PARAM | cppc\_reg\_id is reserved.                                         |
| SBI\_ERR\_FAILED         | The probe request failed for unspecified or unknown other reasons. |

### [](#14-1-2-function-read-cppc-register-fid-1)14.1.2\. Function: Read CPPC register (FID #1)

```C
struct sbiret sbi_cppc_read(uint32_t cppc_reg_id)
```

Reads the register as specified in the `cppc_reg_id` parameter and returns the value in `sbiret.value`. When supervisor mode XLEN is 32, the `sbiret.value`will only contain the lower 32 bits of the CPPC register value.

The possible error codes returned in `sbiret.error` are shown in[Table 3](#table%5Fcppc%5Fread%5Ferrors).

__Table 3\. CPPC Read Errors__
| Error code               | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| SBI\_SUCCESS             | Read completed successfully.                                      |
| SBI\_ERR\_INVALID\_PARAM | cppc\_reg\_id is reserved.                                        |
| SBI\_ERR\_NOT\_SUPPORTED | cppc\_reg\_id is not implemented by the platform.                 |
| SBI\_ERR\_DENIED         | cppc\_reg\_id is a write-only register.                           |
| SBI\_ERR\_FAILED         | The read request failed for unspecified or unknown other reasons. |

### [](#14-1-3-function-read-cppc-register-high-bits-fid-2)14.1.3\. Function: Read CPPC register high bits (FID #2)

```C
struct sbiret sbi_cppc_read_hi(uint32_t cppc_reg_id)
```

Reads the upper 32-bit value of the register specified in the `cppc_reg_id`parameter and returns the value in `sbiret.value`. This function always returns zero in `sbiret.value` when supervisor mode XLEN is 64 or higher.

The possible error codes returned in `sbiret.error` are shown in[Table 4](#table%5Fcppc%5Fread%5Fhi%5Ferrors).

__Table 4\. CPPC Read Hi Errors__
| Error code               | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| SBI\_SUCCESS             | Read completed successfully.                                      |
| SBI\_ERR\_INVALID\_PARAM | cppc\_reg\_id is reserved.                                        |
| SBI\_ERR\_NOT\_SUPPORTED | cppc\_reg\_id is not implemented by the platform.                 |
| SBI\_ERR\_DENIED         | cppc\_reg\_id is a write-only register.                           |
| SBI\_ERR\_FAILED         | The read request failed for unspecified or unknown other reasons. |

### [](#14-1-4-function-write-to-cppc-register-fid-3)14.1.4\. Function: Write to CPPC register (FID #3)

```C
struct sbiret sbi_cppc_write(uint32_t cppc_reg_id, uint64_t val)
```

Writes the value passed in the `val` parameter to the register as specified in the `cppc_reg_id` parameter.

The possible error codes returned in `sbiret.error` are shown in[Table 5](#table%5Fcppc%5Fwrite%5Ferrors).

__Table 5\. CPPC Write Errors__
| Error code               | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| SBI\_SUCCESS             | Write completed successfully.                                      |
| SBI\_ERR\_INVALID\_PARAM | cppc\_reg\_id is reserved.                                         |
| SBI\_ERR\_NOT\_SUPPORTED | cppc\_reg\_id is not implemented by the platform.                  |
| SBI\_ERR\_DENIED         | cppc\_reg\_id is a read-only register.                             |
| SBI\_ERR\_FAILED         | The write request failed for unspecified or unknown other reasons. |

### [](#14-1-5-function-listing)14.1.5\. Function Listing

__Table 6\. CPPC Function List__
| Function Name       | SBI Version | FID | EID        |
| ------------------- | ----------- | --- | ---------- |
| sbi\_cppc\_probe    | 2.0         | 0   | 0x43505043 |
| sbi\_cppc\_read     | 2.0         | 1   | 0x43505043 |
| sbi\_cppc\_read\_hi | 2.0         | 2   | 0x43505043 |
| sbi\_cppc\_write    | 2.0         | 3   | 0x43505043 |

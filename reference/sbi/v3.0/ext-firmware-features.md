# 18.1. SBI Firmware Features Extension (EID #0x46574654 "FWFT")

## [](#sbi%5Ffirmware%5Ffeatures%5Fextension)18.1\. SBI Firmware Features Extension (EID #0x46574654 "FWFT")

The Firmware Features extension enables supervisor-mode software to manage and control specific hardware capabilities or SBI implementation features.[Table 1](#table%5Ffw%5Ffeatures%5Ftypes) defines 32-bit identifiers for the features which supervisor-mode software may request to set or get.

__Table 1\. FWFT Feature Types__
| Value                   | Name                                          | Description                                                       |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| 0x00000000              | MISALIGNED\_EXC\_DELEG                        | Control misaligned access exception delegation to supervisor-mode |
| 0x00000001              | LANDING\_PAD                                  | Control landing pad support for supervisor-mode.                  |
| 0x00000002              | SHADOW\_STACK                                 | Control shadow stack support for supervisor-mode.                 |
| 0x00000003              | DOUBLE\_TRAP                                  | Control double trap support.                                      |
| 0x00000004              | PTE\_AD\_HW\_UPDATING                         | Control hardware updating of PTE A/D bits.                        |
| 0x00000005              | POINTER\_MASKING\_PMLEN                       | Control the pointer masking length for supervisor-mode.           |
| 0x00000006 - 0x3fffffff | Local feature types reserved for future use.  |                                                                   |
| 0x40000000 - 0x7fffffff | Platform specific local feature types.        |                                                                   |
| 0x80000000 - 0xbfffffff | Global feature types reserved for future use. |                                                                   |
| 0xc0000000 - 0xffffffff | Platform specific global feature types.       |                                                                   |

These features have some attributes that define their behavior and are described in [Table 2](#table%5Ffw%5Ffeatures%5Fattributes). The attribute values are defined for each feature in [Table 3](#table%5Ffw%5Ffeatures%5Fattribute%5Fvalues).

__Table 2\. FWFT Feature Attributes__
| Attribute   | Description                                                                                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope       | Defines if a feature is local (per-hart) or global. Global features only need to be enabled/disabled by a single hart, whereas local features need to be enabled/disabled by each hart. The status and flags of local features can be different from one hart to another. |
| Reset value | Reset value of the feature. Might be implementation defined.                                                                                                                                                                                                              |
| Values      | Per feature values that can be set.                                                                                                                                                                                                                                       |

During non-retentive suspend, feature values are retained and restored by the SBI when resuming operations. Upon hart reset, local feature values are not retained and reset to their default reset values according to the feature description. Upon system reset, global and local feature values are reset.

__Table 3\. FWFT Feature Attribute Values__
| Feature Name            | Reset                  | Scope | Values                                                                                                                           |
| ----------------------- | ---------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| MISALIGNED\_EXC\_DELEG  | Implementation-defined | Local | 0 Disable misaligned exception delegation. 1 Enable misaligned exception delegation.                                             |
| LANDING\_PAD            | 0                      | Local | 0 Disable landing pad for supervisor-mode. 1 Enable landing pad for supervisor-mode.                                             |
| SHADOW\_STACK           | 0                      | Local | 0 Disable shadow-stack for supervisor-mode. 1 Enable shadow-stack for supervisor-mode.                                           |
| DOUBLE\_TRAP            | 0                      | Local | 0 Disable double trap 1 Enable double trap                                                                                       |
| PTE\_AD\_HW\_UPDATING   | 0                      | Local | 0 Disable hardware updating of PTE A/D bits for supervisor-mode. 1 Enable hardware updating of PTE A/D bits for supervisor-mode. |
| POINTER\_MASKING\_PMLEN | 0                      | Local | 0 Disable pointer masking for supervisor-mode. N Enable pointer masking for supervisor-mode with PMLEN = N.                      |

### [](#18-1-1-function-firmware-features-set-fid-0)18.1.1\. Function: Firmware Features Set (FID #0)

```C
struct sbiret sbi_fwft_set(uint32_t feature,
                           unsigned long value,
                           unsigned long flags)
```

A successful return from `sbi_fwft_set()` results in the requested firmware feature to be set according to the `value` and `flags` parameters for which per feature supported values are described in[Table 3](#table%5Ffw%5Ffeatures%5Fattribute%5Fvalues) and flags in [Table 4](#table%5Ffw%5Ffeatures%5Fflags).

| |  The set operation will succeed if requested value matches the existing value. |
| -------------------------------------------------------------------------------- |

__Table 4\. FWFT Firmware Features Set Flags__
| Name            | Encoding                                  | Description                                                                                                                                                        |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LOCK            | BIT\[0\]                                  | If provided, once set, the feature value can no longer be modified until: \- hart reset for feature with local scope \- system reset for feature with global scope |
| BIT\[XLEN-1:1\] | Reserved for future use and must be zero. |                                                                                                                                                                    |

In case of failure, `feature` value is not modified and the possible error codes returned in `sbiret.error` are shown in [Table 5](#table%5Ffw%5Ffeatures%5Fset%5Ferrors) below.

__Table 5\. FWFT Firmware Features Set Errors__
| Error code               | Description                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | feature was set successfully.                                                                                                                            |
| SBI\_ERR\_NOT\_SUPPORTED | feature is not reserved and valid, but the platform does not support it due to one or more missing dependencies (Hardware or SBI implementation).        |
| SBI\_ERR\_INVALID\_PARAM | Provided value or flags parameter is invalid.                                                                                                            |
| SBI\_ERR\_DENIED         | feature set operation failed because either: \- it was denied by the SBI implementation \- feature is reserved or is platform-specific and unimplemented |
| SBI\_ERR\_DENIED\_LOCKED | feature set operation failed because the feature is locked                                                                                               |
| SBI\_ERR\_FAILED         | The set operation failed for unspecified or unknown other reasons.                                                                                       |

| |  The rationale for an SBI implementation to return SBI\_ERR\_DENIED is for instance to allow some hypervisors to simply passthrough the misaligned delegation state to the Guest/VM and deny any changes to that delegation state from the Guest/VM. If authorized, an SBI call would be required at each Guest/VM switch if delegation choices are different between Host and Guest/VM. |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |

### [](#18-1-2-function-firmware-features-get-fid-1)18.1.2\. Function: Firmware Features Get (FID #1)

```C
struct sbiret sbi_fwft_get(uint32_t feature)
```

A successful return from `sbi_fwft_get()` results in the firmware feature configuration value to be returned in `sbiret.value`. Possible`sbiret.value` values are described in [Table 3](#table%5Ffw%5Ffeatures%5Fattribute%5Fvalues) for each feature ID.

In case of failure, the content of `sbiret.value` is zero and the possible error codes returned in `sbiret.error` are shown in [Table 6](#table%5Ffw%5Ffeatures%5Fget%5Ferrors).

__Table 6\. FWFT Firmware Features Get Errors__
| Error code               | Description                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Feature status was retrieved successfully.                                                                                                        |
| SBI\_ERR\_NOT\_SUPPORTED | feature is not reserved and valid, but the platform does not support it due to one or more missing dependencies (Hardware or SBI implementation). |
| SBI\_ERR\_DENIED         | feature is reserved or is platform-specific and unimplemented.                                                                                    |
| SBI\_ERR\_FAILED         | The get operation failed for unspecified or unknown other reasons.                                                                                |

### [](#18-1-3-function-listing)18.1.3\. Function Listing

__Table 7\. FWFT Function List__
| Function Name  | SBI Version | FID | EID        |
| -------------- | ----------- | --- | ---------- |
| sbi\_fwft\_set | 3.0         | 0   | 0x46574654 |
| sbi\_fwft\_get | 3.0         | 1   | 0x46574654 |

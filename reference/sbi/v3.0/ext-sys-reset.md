# 10.1. System Reset Extension (EID #0x53525354 "SRST")

## [](#10-1-system-reset-extension-eid-0x53525354-srst)10.1\. System Reset Extension (EID #0x53525354 "SRST")

The System Reset Extension provides a function that allow the supervisor software to request system-level reboot or shutdown. The term "system" refers to the world-view of supervisor software and the underlying SBI implementation could be provided by machine mode firmware or a hypervisor.

### [](#10-1-1-function-system-reset-fid-0)10.1.1\. Function: System reset (FID #0)

```C
struct sbiret sbi_system_reset(uint32_t reset_type, uint32_t reset_reason)
```

Reset the system based on provided `reset_type` and `reset_reason`. This is a synchronous call and does not return if it succeeds.

The `reset_type` parameter is 32 bits wide and it’s possible values are shown in the [Table 1](#table%5Fsrst%5Fsystem%5Freset%5Ftypes) below.

__Table 1\. SRST System Reset Types__
| Value                   | Description                            |
| ----------------------- | -------------------------------------- |
| 0x00000000              | Shutdown                               |
| 0x00000001              | Cold reboot                            |
| 0x00000002              | Warm reboot                            |
| 0x00000003 - 0xEFFFFFFF | Reserved for future use                |
| 0xF0000000 - 0xFFFFFFFF | Vendor or platform specific reset type |

The `reset_reason` is an optional parameter representing the reason for system reset. This parameter is 32 bits wide with possible values shown in the [Table 2](#table%5Fsrst%5Fsystem%5Freset%5Freasons) below

__Table 2\. SRST System Reset Reasons__
| Value                   | Description                              |
| ----------------------- | ---------------------------------------- |
| 0x00000000              | No reason                                |
| 0x00000001              | System failure                           |
| 0x00000002 - 0xDFFFFFFF | Reserved for future use                  |
| 0xE0000000 - 0xEFFFFFFF | SBI implementation specific reset reason |
| 0xF0000000 - 0xFFFFFFFF | Vendor or platform specific reset reason |

When supervisor software is running natively, the SBI implementation is provided by machine mode firmware. In this case, shutdown is equivalent to a physical power down of the entire system and cold reboot is equivalent to a physical power cycle of the entire system. Further, warm reboot is equivalent to a power cycle of the main processor and parts of the system, but not the entire system. For example, on a server class system with a BMC (board management controller), a warm reboot will not power cycle the BMC whereas a cold reboot will definitely power cycle the BMC.

When supervisor software is running inside a virtual machine, the SBI implementation is provided by a hypervisor. Shutdown, cold reboot and warm reboot will behave functionally the same as the native case, but might not result in any physical power changes.

The possible error codes returned in `sbiret.error` are shown in the[Table 3](#table%5Fsrst%5Fsystem%5Freset%5Ferrors) below.

__Table 3\. SRST System Reset Errors__
| Error code               | Description                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| SBI\_ERR\_INVALID\_PARAM | At least one of reset\_type or reset\_reason is reserved or is platform-specific and unimplemented.                           |
| SBI\_ERR\_NOT\_SUPPORTED | reset\_type is not reserved and is implemented, but the platform does not support it due to one or more missing dependencies. |
| SBI\_ERR\_FAILED         | The reset request failed for unspecified or unknown other reasons.                                                            |

### [](#10-1-2-function-listing)10.1.2\. Function Listing

__Table 4\. SRST Function List__
| Function Name      | SBI Version | FID | EID        |
| ------------------ | ----------- | --- | ---------- |
| sbi\_system\_reset | 0.3         | 0   | 0x53525354 |

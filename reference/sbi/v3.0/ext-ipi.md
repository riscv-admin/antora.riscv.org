# 7.1. IPI Extension (EID #0x735049 "sPI: s-mode IPI")

## [](#7-1-ipi-extension-eid-0x735049-spi-s-mode-ipi)7.1\. IPI Extension (EID #0x735049 "sPI: s-mode IPI")

This extension replaces the legacy extension (EID #0x04). The other IPI related legacy extension(0x3) is deprecated now. All the functions in this extension follow the `hart_mask` as defined in the binary encoding section.

### [](#7-1-1-function-send-ipi-fid-0)7.1.1\. Function: Send IPI (FID #0)

```C
struct sbiret sbi_send_ipi(unsigned long hart_mask,
                           unsigned long hart_mask_base)
```

Send an inter-processor interrupt to all the harts defined in hart\_mask. Interprocessor interrupts manifest at the receiving harts as the supervisor software interrupts.

The possible error codes returned in `sbiret.error` are shown in the[Table 1](#table%5Fipi%5Fsend%5Ferrors) below.

__Table 1\. IPI Send Errors__
| Error code               | Description                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | IPI was sent to all the targeted harts successfully.                                                                                                                             |
| SBI\_ERR\_INVALID\_PARAM | At least one hartid constructed from hart\_mask\_base and hart\_mask, is not valid, i.e. either the hartid is not enabled by the platform or is not available to the supervisor. |
| SBI\_ERR\_FAILED         | The request failed for unspecified or unknown other reasons.                                                                                                                     |

### [](#7-1-2-function-listing)7.1.2\. Function Listing

__Table 2\. IPI Function List__
| Function Name  | SBI Version | FID | EID      |
| -------------- | ----------- | --- | -------- |
| sbi\_send\_ipi | 0.2         | 0   | 0x735049 |

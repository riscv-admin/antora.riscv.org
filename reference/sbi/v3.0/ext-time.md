# 6.1. Timer Extension (EID #0x54494D45 "TIME")

## [](#6-1-timer-extension-eid-0x54494d45-time)6.1\. Timer Extension (EID #0x54494D45 "TIME")

This replaces legacy timer extension (EID #0x00). It follows the new calling convention defined in v0.2.

### [](#6-1-1-function-set-timer-fid-0)6.1.1\. Function: Set Timer (FID #0)

```C
struct sbiret sbi_set_timer(uint64_t stime_value)
```

Programs the clock for next event after **stime\_value** time. **stime\_value**is in absolute time.

If the supervisor wishes to clear the timer interrupt without scheduling the next timer event, it may request a timer interrupt infinitely far into the future (i.e., (uint64\_t)-1). Alternatively, to not receive timer interrupts, it may mask timer interrupts by clearing the `sie.STIE` CSR bit.

This function must clear the pending timer interrupt bit when**stime\_value** is set to some time in the future, regardless of whether timer interrupts are masked or not.

This function always returns SBI\_SUCCESS in `sbiret.error`.

### [](#6-1-2-function-listing)6.1.2\. Function Listing

__Table 1\. TIME Function List__
| Function Name   | SBI Version | FID | EID        |
| --------------- | ----------- | --- | ---------- |
| sbi\_set\_timer | 0.2         | 0   | 0x54494D45 |

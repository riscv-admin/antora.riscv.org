# 5.1. Legacy Extensions (EIDs #0x00 - #0x0F)

## [](#5-1-legacy-extensions-eids-0x00-0x0f)5.1\. Legacy Extensions (EIDs #0x00 - #0x0F)

The legacy SBI extensions follow a slightly different calling convention as compared to the SBI v0.2 (or higher) specification where:

* The SBI function ID field in `a6` register is ignored because these are encoded as multiple SBI extension IDs.
* Nothing is returned in `a1` register.
* All registers except `a0` must be preserved across an SBI call by the callee.
* The value returned in `a0` register is SBI legacy extension specific.

The page and access faults taken by the SBI implementation while accessing memory on behalf of the supervisor are redirected back to the supervisor with `sepc` CSR pointing to the faulting `ECALL` instruction.

The legacy SBI extensions are deprecated in favor of the TIME, IPI, RFENCE, SRST, and DBCN extensions.

### [](#5-1-1-extension-set-timer-eid-0x00)5.1.1\. Extension: Set Timer (EID #0x00)

```C
long sbi_set_timer(uint64_t stime_value)
```

Programs the clock for next event after **stime\_value** time. This function also clears the pending timer interrupt bit.

If the supervisor wishes to clear the timer interrupt without scheduling the next timer event, it can either request a timer interrupt infinitely far into the future (i.e., (uint64\_t)-1), or it can instead mask the timer interrupt by clearing `sie.STIE` CSR bit.

This SBI call returns 0 upon success or an implementation specific negative error code.

### [](#5-1-2-extension-console-putchar-eid-0x01)5.1.2\. Extension: Console Putchar (EID #0x01)

```C
long sbi_console_putchar(int ch)
```

Write data present in **ch** to debug console.

Unlike `sbi_console_getchar()`, this SBI call **will block** if there remain any pending characters to be transmitted or if the receiving terminal is not yet ready to receive the byte. However, if the console doesn’t exist at all, then the character is thrown away.

This SBI call returns 0 upon success or an implementation specific negative error code.

### [](#5-1-3-extension-console-getchar-eid-0x02)5.1.3\. Extension: Console Getchar (EID #0x02)

```C
long sbi_console_getchar(void)
```

Read a byte from debug console.

The SBI call returns the byte on success, or -1 for failure.

### [](#5-1-4-extension-clear-ipi-eid-0x03)5.1.4\. Extension: Clear IPI (EID #0x03)

```C
long sbi_clear_ipi(void)
```

Clears the pending IPIs if any. The IPI is cleared only in the hart for which this SBI call is invoked. `sbi_clear_ipi()` is deprecated because S-mode code can clear `sip.SSIP` CSR bit directly.

This SBI call returns 0 if no IPI had been pending, or an implementation specific positive value if an IPI had been pending.

### [](#5-1-5-extension-send-ipi-eid-0x04)5.1.5\. Extension: Send IPI (EID #0x04)

```C
long sbi_send_ipi(const unsigned long *hart_mask)
```

Send an inter-processor interrupt to all the harts defined in hart\_mask. Interprocessor interrupts manifest at the receiving harts as Supervisor Software Interrupts.

hart\_mask is a virtual address that points to a bit-vector of harts. The bit vector is represented as a sequence of unsigned longs whose length equals the number of harts in the system divided by the number of bits in an unsigned long, rounded up to the next integer.

This SBI call returns 0 upon success or an implementation specific negative error code.

### [](#5-1-6-extension-remote-fence-i-eid-0x05)5.1.6\. Extension: Remote FENCE.I (EID #0x05)

```C
long sbi_remote_fence_i(const unsigned long *hart_mask)
```

Instructs remote harts to execute `FENCE.I` instruction. The `hart_mask`is same as described in `sbi_send_ipi()`.

This SBI call returns 0 upon success or an implementation specific negative error code.

### [](#5-1-7-extension-remote-sfence-vma-eid-0x06)5.1.7\. Extension: Remote SFENCE.VMA (EID #0x06)

```C
long sbi_remote_sfence_vma(const unsigned long *hart_mask,
                           unsigned long start,
                           unsigned long size)
```

Instructs the remote harts to execute one or more `SFENCE.VMA` instructions, covering the range of virtual addresses between `start` and `start + size`.

The remote fence operation applies to the entire address space if either:

* `start` and `size` are both 0, or
* `size` is equal to 2^XLEN-1.

This SBI call returns 0 upon success or an implementation specific negative error code.

### [](#5-1-8-extension-remote-sfence-vma-with-asid-eid-0x07)5.1.8\. Extension: Remote SFENCE.VMA with ASID (EID #0x07)

```C
long sbi_remote_sfence_vma_asid(const unsigned long *hart_mask,
                                unsigned long start,
                                unsigned long size,
                                unsigned long asid)
```

Instruct the remote harts to execute one or more `SFENCE.VMA` instructions, covering the range of virtual addresses between `start` and `start + size`. This covers only the given `ASID`.

The remote fence operation applies to the entire address space if either:

* `start` and `size` are both 0, or
* `size` is equal to 2^XLEN-1.

This SBI call returns 0 upon success or an implementation specific negative error code.

### [](#5-1-9-extension-system-shutdown-eid-0x08)5.1.9\. Extension: System Shutdown (EID #0x08)

```C
void sbi_shutdown(void)
```

Puts all the harts to shutdown state from supervisor point of view.

This SBI call doesn’t return irrespective whether it succeeds or fails.

### [](#5-1-10-function-listing)5.1.10\. Function Listing

__Table 1\. Legacy Function List__
| Function Name                  | SBI Version | FID | EID  | Replacement EID |
| ------------------------------ | ----------- | --- | ---- | --------------- |
| sbi\_set\_timer                | 0.1         | 0   | 0x00 | 0x54494D45      |
| sbi\_console\_putchar          | 0.1         | 0   | 0x01 | 0x4442434E      |
| sbi\_console\_getchar          | 0.1         | 0   | 0x02 | 0x4442434E      |
| sbi\_clear\_ipi                | 0.1         | 0   | 0x03 | N/A             |
| sbi\_send\_ipi                 | 0.1         | 0   | 0x04 | 0x735049        |
| sbi\_remote\_fence\_i          | 0.1         | 0   | 0x05 | 0x52464E43      |
| sbi\_remote\_sfence\_vma       | 0.1         | 0   | 0x06 | 0x52464E43      |
| sbi\_remote\_sfence\_vma\_asid | 0.1         | 0   | 0x07 | 0x52464E43      |
| sbi\_shutdown                  | 0.1         | 0   | 0x08 | 0x53525354      |
| **RESERVED**                   | 0x09-0x0F   |     |      |                 |

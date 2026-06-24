# 12.1. Debug Console Extension (EID #0x4442434E "DBCN")

## [](#12-1-debug-console-extension-eid-0x4442434e-dbcn)12.1\. Debug Console Extension (EID #0x4442434E "DBCN")

The debug console extension defines a generic mechanism for debugging and boot-time early prints from supervisor-mode software.

This extension replaces the legacy console putchar (EID #0x01) and console getchar (EID #0x02) extensions. The debug console extension allows supervisor-mode software to write or read multiple bytes in a single SBI call.

If the underlying physical console has extra bits for error checking (or correction) then these extra bits should be handled by the SBI implementation.

| |  It is recommended that bytes sent/received using the debug console extension follow UTF-8 character encoding. |
| ---------------------------------------------------------------------------------------------------------------- |

### [](#12-1-1-function-console-write-fid-0)12.1.1\. Function: Console Write (FID #0)

```C
struct sbiret sbi_debug_console_write(unsigned long num_bytes,
                                      unsigned long base_addr_lo,
                                      unsigned long base_addr_hi)
```

Write bytes to the debug console from input memory.

The `num_bytes` parameter specifies the number of bytes in the input memory. The physical base address of the input memory is represented by two XLEN bits wide parameters. The `base_addr_lo` parameter specifies the lower XLEN bits and the `base_addr_hi` parameter specifies the upper XLEN bits of the input memory physical base address.

This is a non-blocking SBI call and it may do partial/no writes if the debug console is not able to accept more bytes.

The number of bytes written is returned in `sbiret.uvalue` and the possible error codes returned in `sbiret.error` are shown in[Table 1](#table%5Fdebug%5Fconsole%5Fwrite%5Ferrors) below.

__Table 1\. Debug Console Write Errors__
| Error code               | Description                                                                                                                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Bytes written successfully.                                                                                                                                                                                                                                       |
| SBI\_ERR\_INVALID\_PARAM | The memory pointed to by the num\_bytes,base\_addr\_lo, and base\_addr\_hi parameters does not satisfy the requirements described in the[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter) |
| SBI\_ERR\_DENIED         | Writes to the debug console is not allowed.                                                                                                                                                                                                                       |
| SBI\_ERR\_FAILED         | Failed to write due to I/O errors.                                                                                                                                                                                                                                |

### [](#12-1-2-function-console-read-fid-1)12.1.2\. Function: Console Read (FID #1)

```C
struct sbiret sbi_debug_console_read(unsigned long num_bytes,
                                      unsigned long base_addr_lo,
                                      unsigned long base_addr_hi)
```

Read bytes from the debug console into an output memory.

The `num_bytes` parameter specifies the maximum number of bytes which can be written into the output memory. The physical base address of the output memory is represented by two XLEN bits wide parameters. The `base_addr_lo` parameter specifies the lower XLEN bits and the`base_addr_hi` parameter specifies the upper XLEN bits of the output memory physical base address.

This is a non-blocking SBI call and it will not write anything into the output memory if there are no bytes to be read in the debug console.

The number of bytes read is returned in `sbiret.uvalue` and the possible error codes returned in `sbiret.error` are shown in[Table 2](#table%5Fdebug%5Fconsole%5Fread%5Ferrors) below.

__Table 2\. Debug Console Read Errors__
| Error code               | Description                                                                                                                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SBI\_SUCCESS             | Bytes read successfully.                                                                                                                                                                                                                                          |
| SBI\_ERR\_INVALID\_PARAM | The memory pointed to by the num\_bytes,base\_addr\_lo, and base\_addr\_hi parameters does not satisfy the requirements described in the[\[\_shared\_memory\_physical\_address\_range\_parameter\]](#%5Fshared%5Fmemory%5Fphysical%5Faddress%5Frange%5Fparameter) |
| SBI\_ERR\_DENIED         | Reads from the debug console is not allowed.                                                                                                                                                                                                                      |
| SBI\_ERR\_FAILED         | Failed to read due to I/O errors.                                                                                                                                                                                                                                 |

### [](#12-1-3-function-console-write-byte-fid-2)12.1.3\. Function: Console Write Byte (FID #2)

```C
struct sbiret sbi_debug_console_write_byte(uint8_t byte)
```

Write a single byte to the debug console.

This is a blocking SBI call and it will only return after writing the specified byte to the debug console. It will also return, with SBI\_ERR\_FAILED, if there are I/O errors.

The `sbiret.uvalue` is set to zero and the possible error codes returned in `sbiret.error` are shown in [Table 3](#table%5Fdebug%5Fconsole%5Fwrite%5Fbyte%5Ferrors)below.

__Table 3\. Debug Console Write Byte Errors__
| Error code       | Description                                 |
| ---------------- | ------------------------------------------- |
| SBI\_SUCCESS     | Byte written successfully.                  |
| SBI\_ERR\_DENIED | Write to the debug console is not allowed.  |
| SBI\_ERR\_FAILED | Failed to write the byte due to I/O errors. |

### [](#12-1-4-function-listing)12.1.4\. Function Listing

__Table 4\. DBCN Function List__
| Function Name                    | SBI Version | FID | EID        |
| -------------------------------- | ----------- | --- | ---------- |
| sbi\_debug\_console\_write       | 2.0         | 0   | 0x4442434E |
| sbi\_debug\_console\_read        | 2.0         | 1   | 0x4442434E |
| sbi\_debug\_console\_write\_byte | 2.0         | 2   | 0x4442434E |

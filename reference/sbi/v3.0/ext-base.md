# 4.1. Base Extension (EID #0x10)

## [](#4-1-base-extension-eid-0x10)4.1\. Base Extension (EID #0x10)

The base extension is designed to be as small as possible. As such, it only contains functionality for probing which SBI extensions are available and for querying the version of the SBI. All functions in the base extension must be supported by all SBI implementations, so there are no error returns defined.

### [](#4-1-1-function-get-sbi-specification-version-fid-0)4.1.1\. Function: Get SBI specification version (FID #0)

```C
struct sbiret sbi_get_spec_version(void);
```

Returns the current SBI specification version. This function must always succeed. The minor number of the SBI specification is encoded in the low 24 bits, with the major number encoded in the next 7 bits. Bit 31 must be 0 and is reserved for future expansion. When XLEN is greater than 32, bits 32 and above are also reserved and must be 0.

### [](#4-1-2-function-get-sbi-implementation-id-fid-1)4.1.2\. Function: Get SBI implementation ID (FID #1)

```C
struct sbiret sbi_get_impl_id(void);
```

Returns the current SBI implementation ID, which is different for every SBI implementation. It is intended that this implementation ID allows software to probe for SBI implementation quirks.

### [](#4-1-3-function-get-sbi-implementation-version-fid-2)4.1.3\. Function: Get SBI implementation version (FID #2)

```C
struct sbiret sbi_get_impl_version(void);
```

Returns the current SBI implementation version. The encoding of this version number is specific to the SBI implementation.

### [](#4-1-4-function-probe-sbi-extension-fid-3)4.1.4\. Function: Probe SBI extension (FID #3)

```C
struct sbiret sbi_probe_extension(long extension_id);
```

Returns 0 if the given SBI extension ID (EID) is not available, or 1 if it is available unless defined as any other non-zero value by the implementation.

### [](#4-1-5-function-get-machine-vendor-id-fid-4)4.1.5\. Function: Get machine vendor ID (FID #4)

```C
struct sbiret sbi_get_mvendorid(void);
```

Return a value that is legal for the `mvendorid` CSR and 0 is always a legal value for this CSR.

### [](#4-1-6-function-get-machine-architecture-id-fid-5)4.1.6\. Function: Get machine architecture ID (FID #5)

```C
struct sbiret sbi_get_marchid(void);
```

Return a value that is legal for the `marchid` CSR and 0 is always a legal value for this CSR.

### [](#4-1-7-function-get-machine-implementation-id-fid-6)4.1.7\. Function: Get machine implementation ID (FID #6)

```C
struct sbiret sbi_get_mimpid(void);
```

Return a value that is legal for the `mimpid` CSR and 0 is always a legal value for this CSR.

### [](#4-1-8-function-listing)4.1.8\. Function Listing

__Table 1\. Base Function List__
| Function Name           | SBI Version | FID | EID  |
| ----------------------- | ----------- | --- | ---- |
| sbi\_get\_spec\_version | 0.2         | 0   | 0x10 |
| sbi\_get\_impl\_id      | 0.2         | 1   | 0x10 |
| sbi\_get\_impl\_version | 0.2         | 2   | 0x10 |
| sbi\_probe\_extension   | 0.2         | 3   | 0x10 |
| sbi\_get\_mvendorid     | 0.2         | 4   | 0x10 |
| sbi\_get\_marchid       | 0.2         | 5   | 0x10 |
| sbi\_get\_mimpid        | 0.2         | 6   | 0x10 |

### [](#4-1-9-sbi-implementation-ids)4.1.9\. SBI Implementation IDs

__Table 2\. SBI Implementation IDs__
| Implementation ID | Name                             |
| ----------------- | -------------------------------- |
| 0                 | Berkeley Boot Loader (BBL)       |
| 1                 | OpenSBI                          |
| 2                 | Xvisor                           |
| 3                 | KVM                              |
| 4                 | RustSBI                          |
| 5                 | Diosix                           |
| 6                 | Coffer                           |
| 7                 | Xen Project                      |
| 8                 | PolarFire Hart Software Services |
| 9                 | coreboot                         |
| 10                | oreboot                          |
| 11                | bhyve                            |

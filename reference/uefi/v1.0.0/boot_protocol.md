# RISCV_EFI_BOOT_PROTOCOL

## [](#boot%5Fprotocol)RISCV\_EFI\_BOOT\_PROTOCOL

Either Device Tree (DT) or Advanced Configuration and Power Interface (ACPI) configuration tables are used to convey the information about hardware to the Operating Systems. Some of the information are known only at boot time and needed very early before the Operating Systems/boot loaders can parse the firmware tables.

One example is the boot hartid on RISC-V systems. On non-UEFI systems, this is typically passed as an argument to the kernel (in a0). However, UEFI systems need to follow UEFI application calling conventions and hence it can not be passed in a0\. There is an existing solution which uses the /chosen node in DT based systems to pass this information. However, this solution doesn’t work for ACPI based systems. Hence, a UEFI protocol is preferred for both DT and ACPI based systems.

This UEFI protocol for RISC-V systems provides early information to the bootloaders or Operating Systems. Firmwares like EDK2 and u-boot need to implement this protocol on RISC-V UEFI systems.

This protocol is typically called by the bootloaders before invoking**ExitBootServices()**. They then pass the information to the Operating Systems.

The version of RISCV\_EFI\_BOOT\_PROTOCOL specified by this specification is 0x00010000\. All future revisions must be backwards compatible. If a new version of the specification breaks backwards compatibility, a new GUID must be defined.

### [](#guid)GUID

```C
#define RISCV_EFI_BOOT_PROTOCOL_GUID \
    { 0xccd15fec, 0x6f73, 0x4eec, \
    { 0x83, 0x95, 0x3e, 0x69, 0xe4, 0xb9, 0x40, 0xbf } }
```

### [](#revision-number)Revision Number

```C
#define RISCV_EFI_BOOT_PROTOCOL_REVISION 0x00010000
#define RISCV_EFI_BOOT_PROTOCOL_LATEST_VERSION \
        RISCV_EFI_BOOT_PROTOCOL_REVISION
```

### [](#protocol-interface-structure)Protocol Interface Structure

```C
typedef struct _RISCV_EFI_BOOT_PROTOCOL {
    UINT64                Revision;
    EFI_GET_BOOT_HARTID   GetBootHartId;
} RISCV_EFI_BOOT_PROTOCOL;
```

#### [](#riscv%5Fefi%5Fboot%5Fprotocol-getboothartid)RISCV\_EFI\_BOOT\_PROTOCOL.GetBootHartId

This interface provides the hartid of the boot cpu.

##### [](#prototype)Prototype

```C
typedef EFI_STATUS
(EFIAPI *EFI_GET_BOOT_HARTID) (
    IN RISCV_EFI_BOOT_PROTOCOL *This,
    OUT UINTN                  *BootHartId
    );
```

##### [](#parameters)Parameters

__Table 1\. GetBootHartId Parameters__
| Parameter      | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| **This**       | Pointer to the protocol                                       |
| **BootHartId** | Pointer to the variable receiving the hartid of the boot cpu. |

##### [](#status-codes-returned)Status Codes Returned

__Table 2\. GetBootHartId Return Value__
| Return Value                | Description                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| **EFI\_SUCCESS**            | The boot hart id could be returned.                                                                |
| **EFI\_INVALID\_PARAMETER** | **This** parameter is NULL or does not point to a valid RISCV\_EFI\_BOOT\_PROTOCOL implementation. |
| **EFI\_INVALID\_PARAMETER** | **BootHartId** parameter is NULL.                                                                  |

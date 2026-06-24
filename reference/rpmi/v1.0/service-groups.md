# 4.1. Service Groups

## [](#4-1-service-groups)4.1\. Service Groups

An RPMI service group is a collection of RPMI services that are logically grouped based on functionality. For example, all the voltage related services are grouped into a voltage service group. The functionality implemented by certain RPMI service groups may impact the architectural state of application processors due to this each RPMI service group specifies the RISC-V privilege levels of the application processor which can be access it. For example, the clock service groups can be accessed from M-mode and S-mode but the HSM service group can be only accessed from M-mode.

All RPMI service groups except the BASE service group are optional. If the `BASE_PROBE_SERVICE_GROUP` service indicates that a service group is implemented then the RPMI service group version must conform to the RPMI specification version returned by the `BASE_GET_SPEC_VERSION` service. All implemented RPMI service groups must satisfy the following requirements:

1. The RPMI service group must be accessible from the RISC-V privilege level associated with the RPMI context which includes it.
2. All RPMI services of the RPMI service groups must be supported except the dedicated notification service (`SERVICE_ID = 0x00`) which is reserved for RPMI notification messages. A RPMI service group may implement its RPMI services partially only if it also defines a mechanism to discover supported RPMI services.
3. The RPMI service group must implement a dedicated RPMI service with`SERVICE_ID = 0x01` to subscribe for event notifications.

| |  The RPMI services listed within each RPMI service group do not have a specific order. Additionally, the sequence in which services are defined in the specification does not necessarily reflect the order in which they should be invoked. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

This specification defines standard RPMI service groups and RPMI services with the provision to add more service groups as required in the future. The RPMI specification also provides experimental service group IDs space for development of service group until a standard service group ID is allocated. The platform vendors can provide implementation specific RPMI service groups. The [Table 1](#table%5Fservice%5Fgroups) table below lists all standard RPMI service groups defined by this specification.

__Table 1\. RPMI Service Groups__
| Service Group ID | RPMI Version (Major:Minor)               | Service Group Name      | Allowed RISC-V Privilege Levels on Application Processors |
| ---------------- | ---------------------------------------- | ----------------------- | --------------------------------------------------------- |
| 0x0001           | 1.0                                      | BASE                    | M-mode, S-mode                                            |
| 0x0002           | 1.0                                      | SYSTEM\_MSI             | M-mode, S-mode                                            |
| 0x0003           | 1.0                                      | SYSTEM\_RESET           | M-mode                                                    |
| 0x0004           | 1.0                                      | SYSTEM\_SUSPEND         | M-mode                                                    |
| 0x0005           | 1.0                                      | HART\_STATE\_MANAGEMENT | M-mode                                                    |
| 0x0006           | 1.0                                      | CPPC                    | M-mode, S-mode                                            |
| 0x0007           | 1.0                                      | VOLTAGE                 | M-mode, S-mode                                            |
| 0x0008           | 1.0                                      | CLOCK                   | M-mode, S-mode                                            |
| 0x0009           | 1.0                                      | DEVICE\_POWER           | M-mode, S-mode                                            |
| 0x000A           | 1.0                                      | PERFORMANCE             | M-mode, S-mode                                            |
| 0x000B           | 1.0                                      | MANAGEMENT\_MODE        | M-mode, S-mode                                            |
| 0x000C           | 1.0                                      | RAS\_AGENT              | M-mode, S-mode                                            |
| 0x000D           | 1.0                                      | REQUEST\_FORWARD        | M-mode, S-mode                                            |
| 0x000E - 0x7BFF  | _Reserved for Future Use_                |                         |                                                           |
| 0x7C00 - 0x7FFF  | _Experimental Service Groups_            |                         |                                                           |
| 0x8000 - 0xFFFF  | _Implementation Specific Service Groups_ |                         |                                                           |

### [](#service-group-base-servicegroup%5Fid-0x0001)Service Group: BASE (SERVICEGROUP\_ID: 0x0001)

The BASE service group is mandatory and provides the following services:

* Initial handshaking between the application processor and the platform microcontroller.
* Discovering the RPMI implementation version information.
* Discovering the implementation of a service group.
* Discovering platform specific information.

The following table lists the services in the BASE service group:

__Table 2\. BASE Services__
| Service ID | Service Name                       | Request Type    |
| ---------- | ---------------------------------- | --------------- |
| 0x01       | BASE\_ENABLE\_NOTIFICATION         | NORMAL\_REQUEST |
| 0x02       | BASE\_GET\_IMPLEMENTATION\_VERSION | NORMAL\_REQUEST |
| 0x03       | BASE\_GET\_IMPLEMENTATION\_ID      | NORMAL\_REQUEST |
| 0x04       | BASE\_GET\_SPEC\_VERSION           | NORMAL\_REQUEST |
| 0x05       | BASE\_GET\_PLATFORM\_INFO          | NORMAL\_REQUEST |
| 0x06       | BASE\_PROBE\_SERVICE\_GROUP        | NORMAL\_REQUEST |
| 0x07       | BASE\_GET\_ATTRIBUTES              | NORMAL\_REQUEST |

#### [](#rpmi-implementation-ids)RPMI Implementation IDs

The RPMI specification defines space for standard implementation IDs and for experimental implementation IDs. The experimental implementation IDs can be used by the implementations until a standard implementation ID is assigned to it.

The RPMI implementations that have been assigned a standard implementation ID are listed in the table below.

__Table 3\. RPMI Implementation IDs__
| Implementation ID       | Name                                           |
| ----------------------- | ---------------------------------------------- |
| 0x00000000              | libRPMI \[[2](bibliography.html#bib-librpmi)\] |
| 0x00000001 - 0x7FFFFFFF | _Reserved for Future Use_                      |
| 0x80000000 - 0xFFFFFFFF | _Experimental Implementation IDs_              |

#### [](#base-notifications)Notifications

This service is used by the platform microcontroller to send the asynchronous message of type notification to the application processor. The message transfers the events defined by this service group. The events defined are listed in the below table.

__Table 4\. BASE Service Group Events__
| Event ID | Event Name             | Event Data | Description                                                                                                                             |
| -------- | ---------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0x01     | REQUEST\_HANDLE\_ERROR | NA         | This event indicates that the platform microcontroller is unable to serve the message requests and acknowledgements are not guaranteed. |

#### [](#service-base%5Fenable%5Fnotification-service%5Fid-0x01)Service: BASE\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `BASE`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#base-notifications).

__Table 5\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 6\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-base%5Fget%5Fimplementation%5Fversion-service%5Fid-0x02)Service: BASE\_GET\_IMPLEMENTATION\_VERSION (SERVICE\_ID: 0x02)

This service is used to get the RPMI implementation version of the platform microcontroller. The version returned is a 32-bit composite number containing the `MAJOR` and `MINOR` version numbers.

__Table 7\. Request Data__
| NA |
| -- |

__Table 8\. Response Data__
| Word | Name          | Type   | Description                                                                                                                                                                |
| ---- | ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS        | int32  | Return error code. Error Code Description RPMI\_SUCCESS RPMI implementation version returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | IMPL\_VERSION | uint32 | Implementation version. Bits Description \[31:16\] MAJOR number. \[15:0\] MINOR number.                                                                                    |

#### [](#service-base%5Fget%5Fimplementation%5Fid-service%5Fid-0x03)Service: BASE\_GET\_IMPLEMENTATION\_ID (SERVICE\_ID: 0x03)

This service is used to get a 32-bit RPMI implementation ID assigned to the software that implements the RPMI specification. Every implementation ID is unique and listed in the [Table 3](#table%5Fbase%5Frpmi%5Fimpl%5Fid).

__Table 9\. Request Data__
| NA |
| -- |

__Table 10\. Response Data__
| Word | Name     | Type   | Description                                                                                                                                                           |
| ---- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS   | int32  | Return error code. Error Code Description RPMI\_SUCCESS RPMI implementation ID returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | IMPL\_ID | uint32 | Implementation ID.                                                                                                                                                    |

#### [](#service-base%5Fget%5Fspec%5Fversion-service%5Fid-0x04)Service: BASE\_GET\_SPEC\_VERSION (SERVICE\_ID: 0x04)

This service is used to get the implemented RPMI specification version. The version returned is a 32-bit composite number containing the `MAJOR` and`MINOR` version numbers.

__Table 11\. Request Data__
| NA |
| -- |

__Table 12\. Response Data__
| Word | Name          | Type   | Description                                                                                                                                                              |
| ---- | ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS        | int32  | Return error code. Error Code Description RPMI\_SUCCESS RPMI specification version returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes) |
| 1    | SPEC\_VERSION | uint32 | RPMI specification version. Bits Description \[31:16\] MAJOR number. \[15:0\] MINOR number.                                                                              |

#### [](#service-base%5Fget%5Fplatform%5Finfo-service%5Fid-0x05)Service: BASE\_GET\_PLATFORM\_INFO (SERVICE\_ID: 0x05)

This service is used to get additional platform information if available.

__Table 13\. Request Data__
| NA |
| -- |

__Table 14\. Response Data__
| Word | Name              | Type                       | Description                                                                                                                                                                                                                                                                                  |
| ---- | ----------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS            | int32                      | Return error code. Error Code Description RPMI\_SUCCESS Platform information returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                                                                                                          |
| 1    | PLATFORM\_ID\_LEN | uint32                     | Platform Identifier field length in bytes.                                                                                                                                                                                                                                                   |
| 2    | PLATFORM\_ID      | uint8\[PLATFORM\_ID\_LEN\] | Platform Identifier.Up to PLATFORM\_ID\_LEN bytes NULL terminated ASCII string. The use and interpretation of this field is implementation-defined. It can be used to convey details such as the vendor ID, vendor name, specific product model, revision, or configuration of the hardware. |

#### [](#service-base%5Fprobe%5Fservice%5Fgroup-service%5Fid-0x06)Service: BASE\_PROBE\_SERVICE\_GROUP (SERVICE\_ID: 0x06)

This service is used to probe the implementation of a service group and to obtain the implemented service group version. The service group version is a 32-bit composite number containing the `MAJOR` and `MINOR` numbers.

If the service group is successfully probed then the implemented service group version is returned in the `SERVICE_GROUP_VERSION` field. Otherwise it returns`0`.

__Table 15\. Request Data__
| Word | Name             | Type   | Description       |
| ---- | ---------------- | ------ | ----------------- |
| 0    | SERVICEGROUP\_ID | uint32 | Service group ID. |

__Table 16\. Response Data__
| Word | Name                    | Type   | Description                                                                                                                                         |
| ---- | ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS                  | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service probed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes) |
| 1    | SERVICE\_GROUP\_VERSION | uint32 | Service group version. Bits Description \[31:16\] MAJOR number. \[15:0\] MINOR number.                                                              |

#### [](#service-base%5Fget%5Fattributes-service%5Fid-0x07)Service: BASE\_GET\_ATTRIBUTES (SERVICE\_ID: 0x07)

This service is used to discover additional features supported by the BASE service group.

__Table 17\. Request Data__
| NA |
| -- |

__Table 18\. Response Data__
| Word | Name   | Type   | Description                                                                                                                                                                                         |
| ---- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32  | Return error code. Error Code Description RPMI\_SUCCESS Attributes returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                           |
| 1    | FLAGS0 | uint32 | Bits Description \[31:2\] _Reserved_ and must be 0. \[1\] RPMI context privilege level. 0b1: M-mode. 0b0: S-mode. \[0\] Event notification support in platform. 0b1: Supported. 0b0: Not supported. |
| 2    | FLAGS1 | uint32 | _Reserved_ and must be 0.                                                                                                                                                                           |
| 3    | FLAGS2 | uint32 | _Reserved_ and must be 0.                                                                                                                                                                           |
| 4    | FLAGS3 | uint32 | _Reserved_ and must be 0.                                                                                                                                                                           |

### [](#service-group-system%5Fmsi-servicegroup%5Fid-0x0002)Service Group - SYSTEM\_MSI (SERVICEGROUP\_ID: 0x0002)

The SYSTEM\_MSI service group defines services to allow application processors to receive MSIs upon system events such as P2A doorbell, graceful shutdown/reboot request, CPU hotplug event, memory hotplug event, etc.

The number of system MSIs supported by this service group is fixed and referred to as `SYS_NUM_MSI`. Each system MSI is associated with a unique index which is also referred to as `SYS_MSI_INDEX` where `0 <​= SYS_MSI_INDEX < SYS_NUM_MSI`.

The association between system events and system MSI index (aka `SYS_MSI_INDEX`) is platform specific and must be discovered using hardware description mechanisms such as device tree or ACPI.

The system MSI state is 32-bit word also referred to as `SYS_MSI_STATE` which includes whether the system MSI is enabled/disabled and whether system MSI is currently pending at the platform microcontroller. The [Table 19](#table%5Fsysmsi%5Fstate)below shows the encoding of `SYS_MSI_STATE`.

| |  A system MSI can be pending for several reasons. For example, if the MSI target address and data are not configured, or if the configured MSI target address is not valid. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

__Table 19\. System MSI State__
| Bits     | Permission | Description                                                      |
| -------- | ---------- | ---------------------------------------------------------------- |
| \[31:2\] | NA         | _Reserved_ and must be 0.                                        |
| \[1\]    | Read-Only  | MSI pending state. 0b1: MSI is pending. 0b0: MSI is not pending. |
| \[0\]    | Read-Write | MSI enable state. 0b1: MSI enabled. 0b0: MSI disabled.           |

The platform microcontroller can only send a pending system MSI if it is enabled and the configured with a valid MSI target address. The system MSI can be enabled/disabled using the `SYSMSI_SET_MSI_STATE` service whereas the system MSI target configuration can be done using the `SYSMSI_SET_MSI_TARGET`service.

| |  If the system MSI target address is IMSIC, then the application processors will directly receive the system MSI whereas if the system MSI target address is setipnum register of a APLIC domain then the application processors receive it as wired interrupt. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The [Table 20](#table%5Fsysmsi%5Fservices) below lists the services in the SYSTEM\_MSI service group:

__Table 20\. SYSTEM\_MSI Services__
| Service ID | Service Name                 | Request Type    |
| ---------- | ---------------------------- | --------------- |
| 0x01       | SYSMSI\_ENABLE\_NOTIFICATION | NORMAL\_REQUEST |
| 0x02       | SYSMSI\_GET\_ATTRIBUTES      | NORMAL\_REQUEST |
| 0x03       | SYSMSI\_GET\_MSI\_ATTRIBUTES | NORMAL\_REQUEST |
| 0x04       | SYSMSI\_SET\_MSI\_STATE      | NORMAL\_REQUEST |
| 0x05       | SYSMSI\_GET\_MSI\_STATE      | NORMAL\_REQUEST |
| 0x06       | SYSMSI\_SET\_MSI\_TARGET     | NORMAL\_REQUEST |
| 0x07       | SYSMSI\_GET\_MSI\_TARGET     | NORMAL\_REQUEST |

#### [](#system-msi-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-sysmsi%5Fenable%5Fnotification-service%5Fid-0x01)Service: SYSMSI\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `SYSTEM_MSI`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#system-msi-notifications).

__Table 21\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 22\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-sysmsi%5Fget%5Fattributes-service%5Fid-0x02)Service: SYSMSI\_GET\_ATTRIBUTES (SERVICE\_ID: 0x02)

This service is used to discover attributes of the system MSI service group.

__Table 23\. Request Data__
| NA |
| -- |

__Table 24\. Response Data__
| Word | Name          | Type   | Description                                                                                                                                             |
| ---- | ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS        | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | SYS\_NUM\_MSI | uint32 | Number of system MSIs.                                                                                                                                  |
| 2    | FLAGS0        | uint32 | _Reserved_ and must be 0.                                                                                                                               |
| 3    | FLAGS1        | uint32 | _Reserved_ and must be 0.                                                                                                                               |

#### [](#service-sysmsi%5Fget%5Fmsi%5Fattributes-service%5Fid-0x03)Service: SYSMSI\_GET\_MSI\_ATTRIBUTES (SERVICE\_ID: 0x03)

This service is used to discover attributes of a particular system MSI.

__Table 25\. Request Data__
| Word | Name            | Type   | Description              |
| ---- | --------------- | ------ | ------------------------ |
| 0    | SYS\_MSI\_INDEX | uint32 | Index of the system MSI. |

__Table 26\. Response Data__
| Word | Name           | Type        | Description                                                                                                                                                                                                                            |
| ---- | -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM SYS\_MSI\_INDEX value is greater than SYS\_NUM\_MSI. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS0         | uint32      | Bits Description \[31:1\] _Reserved_ and must be 0. \[0\] Preferred privilege level for MSI handling. 0b1: M-mode. 0b0: M-mode or S-mode.                                                                                              |
| 2    | FLAGS1         | uint32      | _Reserved_ and must be 0.                                                                                                                                                                                                              |
| 3:6  | SYS\_MSI\_NAME | uint8\[16\] | System MSI name, a NULL-terminated ASCII string up to 16-bytes.                                                                                                                                                                        |

#### [](#srvgrp%5Fsysmsi%5Fset%5Fmsi%5Fstate)Service: SYSMSI\_SET\_MSI\_STATE (SERVICE\_ID: 0x04)

This service is used to update the state of a system MSI. Specifically, it allows application processors to enable or disable a system MSI. The read-only bits of the system MSI state are not updated by this service.

__Table 27\. Request Data__
| Word | Name            | Type   | Description                                                         |
| ---- | --------------- | ------ | ------------------------------------------------------------------- |
| 0    | SYS\_MSI\_INDEX | uint32 | Index of the system MSI.                                            |
| 1    | SYS\_MSI\_STATE | uint32 | System MSI state as defined in [Table 19](#table%5Fsysmsi%5Fstate). |

__Table 28\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                    |
| ---- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS MSI is enabled or disabled successfully. RPMI\_ERR\_INVALID\_PARAM SYS\_MSI\_INDEX value is greater than SYS\_NUM\_MSI orSYS\_MSI\_STATE value is reserved or invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#srvgrp%5Fsysmsi%5Fget%5Fmsi%5Fstate)Service: SYSMSI\_GET\_MSI\_STATE (SERVICE\_ID: 0x05)

This service is used to get the current state of a system MSI.

__Table 29\. Request Data__
| Word | Name            | Type   | Description              |
| ---- | --------------- | ------ | ------------------------ |
| 0    | SYS\_MSI\_INDEX | uint32 | Index of the system MSI. |

__Table 30\. Response Data__
| Word | Name            | Type   | Description                                                                                                                                                                                                                                |
| ---- | --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS          | int32  | Return error code. Error Code Description RPMI\_SUCCESS MSI state is returned successfully. RPMI\_ERR\_INVALID\_PARAM SYS\_MSI\_INDEX value is greater than SYS\_NUM\_MSI. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | SYS\_MSI\_STATE | uint32 | System MSI state as defined in [Table 19](#table%5Fsysmsi%5Fstate).                                                                                                                                                                        |

#### [](#srvgrp%5Fsysmsi%5Fset%5Fmsi%5Ftarget)Service: SYSMSI\_SET\_MSI\_TARGET (SERVICE\_ID: 0x06)

This service is used to configure the target address and data of a system MSI.

__Table 31\. Request Data__
| Word | Name                    | Type   | Description                      |
| ---- | ----------------------- | ------ | -------------------------------- |
| 0    | SYS\_MSI\_INDEX         | uint32 | Index of the system MSI.         |
| 1    | SYS\_MSI\_ADDRESS\_LOW  | uint32 | Lower 32-bit of the MSI address. |
| 2    | SYS\_MSI\_ADDRESS\_HIGH | uint32 | Upper 32-bit of the MSI address. |
| 3    | SYS\_MSI\_DATA          | uint32 | 32-bit MSI data.                 |

__Table 32\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS MSI address and data are configured successfully. RPMI\_ERR\_INVALID\_PARAM SYS\_MSI\_INDEX value is greater than SYS\_NUM\_MSI. RPMI\_ERR\_INVALID\_ADDR MSI target address is invalid or it is not 4-byte aligned. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#srvgrp%5Fsysmsi%5Fget%5Fmsi%5Ftarget)Service: SYSMSI\_GET\_MSI\_TARGET (SERVICE\_ID: 0x07)

This service is used to get the current target address and data of a system MSI.

__Table 33\. Request Data__
| Word | Name            | Type   | Description              |
| ---- | --------------- | ------ | ------------------------ |
| 0    | SYS\_MSI\_INDEX | uint32 | Index of the system MSI. |

__Table 34\. Response Data__
| Word | Name                    | Type   | Description                                                                                                                                                                                                                                      |
| ---- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS                  | int32  | Return error code. Error Code Description RPMI\_SUCCESS MSI target details returned successfully. RPMI\_ERR\_INVALID\_PARAM SYS\_MSI\_INDEX value is greater than SYS\_NUM\_MSI. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | SYS\_MSI\_ADDRESS\_LOW  | uint32 | Lower 32-bit of the MSI address.                                                                                                                                                                                                                 |
| 2    | SYS\_MSI\_ADDRESS\_HIGH | uint32 | Upper 32-bit of the MSI address.                                                                                                                                                                                                                 |
| 3    | SYS\_MSI\_DATA          | uint32 | 32-bit MSI data.                                                                                                                                                                                                                                 |

### [](#service-group-system%5Freset-servicegroup%5Fid-0x0003)Service Group - SYSTEM\_RESET (SERVICEGROUP\_ID: 0x0003)

This service group defines services for system-level reset or shutdown.

The architectural reset types that are supported by default are System Cold Reset and System Shutdown.

System Cold Reset, also known as power-on-reset, involves power cycling the entire system. Upon a successful system cold reset, all devices undergo power cycling in an implementation-defined sequence similar to the initial power-on sequence of the system.

System Shutdown results in all components/devices in the system losing power. Currently, the application processor is the only entity that can request the system shutdown, which means that for the platform microcontroller, it is not necessary to categorize it as a graceful or forceful shutdown. In the case of a shutdown request, it is implicit for the platform microcontroller that the application processor has prepared itself for a successful shutdown.

The following table lists the services in the SYSTEM\_RESET service group:

__Table 35\. SYSTEM\_RESET Services__
| Service ID | Service Name                 | Request Type    |
| ---------- | ---------------------------- | --------------- |
| 0x01       | SYSRST\_ENABLE\_NOTIFICATION | NORMAL\_REQUEST |
| 0x02       | SYSRST\_GET\_ATTRIBUTES      | NORMAL\_REQUEST |
| 0x03       | SYSRST\_RESET                | POSTED\_REQUEST |

#### [](#section-reset-types)Reset Types

RPMI supports reset types and their values as defined by SBI specification. Refer to [**SRST System Reset Types**](https://github.com/riscv-non-isa/riscv-sbi-doc/blob/master/src/ext-sys-reset.adoc#table%5Fsrst%5Fsystem%5Freset%5Ftypes)in the RISC-V SBI Specification \[[1](bibliography.html#bib-sbi)\] for the `RESET_TYPE`.

#### [](#system-reset-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-sysrst%5Fenable%5Fnotification-service%5Fid-0x01)Service: SYSRST\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `SYSTEM_RESET`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#system-reset-notifications).

__Table 36\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 37\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-sysrst%5Fget%5Fattributes-service%5Fid-0x02)Service: SYSRST\_GET\_ATTRIBUTES (SERVICE\_ID: 0x02)

This service is used to discover the attributes of a reset type. The attribute flags indicates if a `RESET_TYPE` is supported or not apart from the System Shutdown and System Cold Reset which are mandatory and supported by default. System Warm Reset support can be discovered with this service.

__Table 38\. Request Data__
| Word | Name        | Type   | Description                                                            |
| ---- | ----------- | ------ | ---------------------------------------------------------------------- |
| 0    | RESET\_TYPE | uint32 | Reset type.Refer [Reset Types](#section-reset-types) for more details. |

__Table 39\. Response Data__
| Word | Name   | Type   | Description                                                                                                                                               |
| ---- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32  | Return error code. Error Code Description RPMI\_SUCCESS Attributes returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS  | uint32 | Reset type attributes. Bits Description \[31:1\] _Reserved_ and must be 0. \[0\] Reset type support. 0b1: Supported. 0b0: Not supported.                  |

#### [](#service-sysrst%5Freset-service%5Fid-0x03)Service: SYSRST\_RESET (SERVICE\_ID: 0x03)

This service is used to initiate the system reset or system shutdown. The application processor must only request supported reset types, discovered using the `SYSRST_GET_ATTRIBUTES` service except for System Shutdown and System Cold Reset which are supported by default. This service does not return a response. If an invalid reset type is provided, the reset request is ignored. If the system reset fails, the resulting system state is unspecified.

__Table 40\. Request Data__
| Word | Name        | Type   | Description                                                            |
| ---- | ----------- | ------ | ---------------------------------------------------------------------- |
| 0    | RESET\_TYPE | uint32 | Reset type.Refer [Reset Types](#section-reset-types) for more details. |

__Table 41\. Response Data__
| NA |
| -- |

### [](#service-group-system%5Fsuspend-servicegroup%5Fid-0x0004)Service Group - SYSTEM\_SUSPEND (SERVICEGROUP\_ID: 0x0004)

This service group defines services used to request platform microcontroller to transition the system into a suspend state, also called a sleep state. The suspend state `SUSPEND_TO_RAM` is supported by default by the platform and if the application processor requests for `SUSPEND_TO_RAM`, it’s implicit for the platform microcontroller that all the application processors except the one requesting are in `STOPPED` state and necessary state saving in the RAM has been complete.

The following table lists the services in the SYSTEM\_SUSPEND service group:

__Table 42\. SYSTEM\_SUSPEND Services__
| Service ID | Service Name                  | Request Type    |
| ---------- | ----------------------------- | --------------- |
| 0x01       | SYSSUSP\_ENABLE\_NOTIFICATION | NORMAL\_REQUEST |
| 0x02       | SYSSUSP\_GET\_ATTRIBUTES      | NORMAL\_REQUEST |
| 0x03       | SYSSUSP\_SUSPEND              | NORMAL\_REQUEST |

#### [](#section-suspend-types)Suspend Types

RPMI supports suspend types and their values as defined by SBI specification. Refer to [**SBI System Sleep Types**](https://github.com/riscv-non-isa/riscv-sbi-doc/blob/master/src/ext-sys-suspend.adoc#table%5Fsusp%5Fsleep%5Ftypes)in the RISC-V SBI Specification \[[1](bibliography.html#bib-sbi)\] for the `SUSPEND_TYPE` definition.

#### [](#system-suspend-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-syssusp%5Fenable%5Fnotification-service%5Fid-0x01)Service: SYSSUSP\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `SYSTEM_SUSPEND`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#system-suspend-notifications).

__Table 43\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 44\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-syssusp%5Fget%5Fattributes-service%5Fid-0x02)Service: SYSSUSP\_GET\_ATTRIBUTES (SERVICE\_ID: 0x02)

This service is used to discover the attributes of a suspend type. The attribute flags for a suspend type indicate whether a `SUSPEND_TYPE` is supported. Additionally, the flags specify whether a `SUSPEND_TYPE` supports a resume address.

__Table 45\. Request Data__
| Word | Name          | Type   | Description                                                                  |
| ---- | ------------- | ------ | ---------------------------------------------------------------------------- |
| 0    | SUSPEND\_TYPE | uint32 | Suspend type.Refer [Suspend Types](#section-suspend-types) for more details. |

__Table 46\. Response Data__
| Word | Name   | Type   | Description                                                                                                                                                                                                                                                                                                                           |
| ---- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32  | Return error code. Error Code Description RPMI\_SUCCESS Attributes returned successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                                                                                                                                                             |
| 1    | FLAGS  | uint32 | Suspend type attributes. Bits Description \[31:2\] _Reserved_ and must be 0. \[1\] Resume Address Support.If a SUSPEND\_TYPE supports custom resume address which platform must configure for the resuming application processor. 0b1: Supported. 0b0: Not supported. \[0\] Suspend type Support. 0b1: Supported. 0b0: Not supported. |

#### [](#service-syssusp%5Fsuspend-service%5Fid-0x03)Service: SYSSUSP\_SUSPEND (SERVICE\_ID: 0x03)

This service is used to request the platform microcontroller to transition the system in a suspend state. This service returns successfully when the platform microcontroller accepts the system suspend request. The application processor which called this service must then enter into a quiesced state such as WFI. The platform microcontroller will transition the system to the requested`SUSPEND_TYPE` upon the successful transition of the application processor into the supported quiesced state. The mechanism for detecting the quiesced state of the application processor is platform specific.

The application processor must only request supported suspend types, discovered using the `SYSSUSP_GET_ATTRIBUTES` service.

If a suspend type does not support the custom resume address that the application processor can discover through the `SYSSUSP_GET_ATTRIBUTES` service then the `RESUME_ADDR_LOW` and `RESUME_ADDR_HIGH` will be ignored and the application processor will resume from the `pc` (program counter) after the instruction that put the application processor in the quiesced state, such as the `WFI` instruction.

__Table 47\. Request Data__
| Word | Name               | Type   | Description                                                                  |
| ---- | ------------------ | ------ | ---------------------------------------------------------------------------- |
| 0    | HART\_ID           | uint32 | Hart ID of the calling hart.                                                 |
| 1    | SUSPEND\_TYPE      | uint32 | Suspend type.Refer [Suspend Types](#section-suspend-types) for more details. |
| 2    | RESUME\_ADDR\_LOW  | uint32 | Lower 32-bit address.                                                        |
| 3    | RESUME\_ADDR\_HIGH | uint32 | Upper 32-bit address.                                                        |

__Table 48\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                    |
| ---- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Suspend request has been accepted. RPMI\_ERR\_INVALID\_PARAM HART\_ID or SUSPEND\_TYPE is invalid. RPMI\_ERR\_INVALID\_ADDR Resume address is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

### [](#service-group-hart%5Fstate%5Fmanagement-servicegroup%5Fid-0x0005)Service Group - HART\_STATE\_MANAGEMENT (SERVICEGROUP\_ID: 0x0005)

This service group defines services to control and manage the application processor (hart) power states. Hart power states include power on, power off, suspend modes, etc. A hart is identified by a 32-bit identifier called `HART_ID`.

In a platform, depending on the sharing of power controls and common resources, the harts can be grouped in a hierarchical topology to form cores, clusters, nodes, etc. In such cases the power state change for a hart can affect the entire hierarchical group in which the hart is located, requiring coordination for the power state change. RPMI supports the coordination mechanisms and hart power states defined by the RISC-V SBI Specification \[[1](bibliography.html#bib-sbi)\].

The following table lists the services in the HART\_STATE\_MANAGEMENT service group:

__Table 49\. HART\_STATE\_MANAGEMENT Services__
| Service ID | Service Name              | Request Type    |
| ---------- | ------------------------- | --------------- |
| 0x01       | HSM\_ENABLE\_NOTIFICATION | NORMAL\_REQUEST |
| 0x02       | HSM\_GET\_HART\_STATUS    | NORMAL\_REQUEST |
| 0x03       | HSM\_GET\_HART\_LIST      | NORMAL\_REQUEST |
| 0x04       | HSM\_GET\_SUSPEND\_TYPES  | NORMAL\_REQUEST |
| 0x05       | HSM\_GET\_SUSPEND\_INFO   | NORMAL\_REQUEST |
| 0x06       | HSM\_HART\_START          | NORMAL\_REQUEST |
| 0x07       | HSM\_HART\_STOP           | NORMAL\_REQUEST |
| 0x08       | HSM\_HART\_SUSPEND        | NORMAL\_REQUEST |

#### [](#section-hart-states)Hart States

Hart HSM states and the HSM state machine supported by the RPMI are defined in the RISC-V SBI Specification \[[1](bibliography.html#bib-sbi)\]. Refer to[**HSM States**](https://github.com/riscv-non-isa/riscv-sbi-doc/blob/master/src/ext-hsm.adoc#table%5Fhsm%5Fstates).

From a hart perspective a start state means hart has started execution of instructions and stop state means that hart is not executing the instructions. The platform can implement the stop state either by powering down the hart or just putting the hart in a platform supported low-power state.

#### [](#section-hart-suspend-types)Hart Suspend Types

The RPMI supports the hart suspend types encoding as defined in RISC-V SBI Specification \[[1](bibliography.html#bib-sbi)\]. Refer to [**HSM Suspend Types**](https://github.com/riscv-non-isa/riscv-sbi-doc/blob/master/src/ext-hsm.adoc#table%5Fhsm%5Fhart%5Fsuspend%5Ftypes). The values for the platform supported suspend types are discovered through a service defined in this service group.

#### [](#hsm-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-hsm%5Fenable%5Fnotification-service%5Fid-0x01)Service: HSM\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `HART_STATE_MANAGEMENT`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#hsm-notifications).

__Table 50\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 51\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-hsm%5Fget%5Fhart%5Fstatus-service%5Fid-0x02)Service: HSM\_GET\_HART\_STATUS (SERVICE\_ID: 0x02)

This service returns the current HSM state of a hart. If a hart is in an invalid state that is not a defined HSM state, an error code will be set in the `STATUS` field.

__Table 52\. Request Data__
| Word | Name     | Type   | Description |
| ---- | -------- | ------ | ----------- |
| 0    | HART\_ID | uint32 | Hart ID.    |

__Table 53\. Response Data__
| Word | Name        | Type   | Description                                                                                                                                                                                                                                                |
| ---- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS      | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM HART\_ID is invalid. RPMI\_ERR\_INVALID\_STATE Hart is in invalid state. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | HART\_STATE | uint32 | Hart state.Refer [Hart States](#section-hart-states) for more details.                                                                                                                                                                                     |

#### [](#service-hsm%5Fget%5Fhart%5Flist-service%5Fid-0x03)Service: HSM\_GET\_HART\_LIST (SERVICE\_ID: 0x03)

This service retrieves the list of Hart IDs managed by this service group.

If the number of words required for all available Hart IDs exceeds the number of words that can be returned in one acknowledgement message then the platform microcontroller will set the `REMAINING` and `RETURNED` fields accordingly and only return the Hart IDs which can be accommodated. The application processor may need to call this service again with the appropriate `START_INDEX` until the`REMAINING` field returns `0`.

__Table 54\. Request Data__
| Word | Name         | Type   | Description                 |
| ---- | ------------ | ------ | --------------------------- |
| 0    | START\_INDEX | uint32 | Start index of the Hart ID. |

__Table 55\. Response Data__
| Word | Name          | Type   | Description                                                                                                                                                                                                |
| ---- | ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS        | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM START\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | REMAINING     | uint32 | Remaining number of Hart IDs to be returned.                                                                                                                                                               |
| 2    | RETURNED      | uint32 | Number of Hart IDs returned in this request.                                                                                                                                                               |
| 3    | HART\_ID\[N\] | uint32 | Hart IDs list.                                                                                                                                                                                             |

#### [](#service-hsm%5Fget%5Fsuspend%5Ftypes-service%5Fid-0x04)Service: HSM\_GET\_SUSPEND\_TYPES (SERVICE\_ID: 0x04)

This service gets the list of all supported suspend types for a hart. The suspend types in the list must be ordered based on increasing power savings.

If the number of words required for all available suspend types exceeds the number of words that can be returned in one acknowledgement message then the platform microcontroller will set the `REMAINING` and `RETURNED` fields accordingly and only return the suspend types which can be accommodated. The application processor may need to call this service again with the appropriate `START_INDEX` until the `REMAINING` field returns `0`.

The attributes and details of each suspend type can be discovered using the`HSM_GET_SUSPEND_INFO` service.

__Table 56\. Request Data__
| Word | Name         | Type   | Description                                                                                                        |
| ---- | ------------ | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 0    | START\_INDEX | uint32 | Start index of the Hart ID. 0 for the first call, subsequent calls will use the next index of the remaining items. |

__Table 57\. Response Data__
| Word | Name               | Type   | Description                                                                                                                                                                                                |
| ---- | ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS             | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM START\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | REMAINING          | uint32 | Remaining number of suspend types to be returned.                                                                                                                                                          |
| 2    | RETURNED           | uint32 | Number of suspend types returned in this request.                                                                                                                                                          |
| 3    | SUSPEND\_TYPE\[N\] | uint32 | Suspend types.Refer [Hart Suspend Types](#section-hart-suspend-types) for more details.                                                                                                                    |

#### [](#service-hsm%5Fget%5Fsuspend%5Finfo-service%5Fid-0x05)Service: HSM\_GET\_SUSPEND\_INFO (SERVICE\_ID: 0x05)

This service is used to get the attributes of a suspend type. The attributes of a suspend type include various associated latencies. The entry latency for a suspend type is the maximum amount of time that the hart requires to transition from the execution state to the low-power suspend state when the hart invokes an quiesced state entry mechanism such as WFI. The exit latency is the time required by the hart to transition from the suspend state to execution state after the wakeup event.

For each suspend state there is a point of no return after which the suspend state transition cannot be reversed. The wakeup latency is the maximum time required by the hart to transition from the point of no return to the execution state. If the platform returns `0` in `WAKEUP_LATENCY` then the application processor can use the `(ENTRY_LATENCY + EXIT_LATENCY)` as the wakeup latency.

The minimum residency of a suspend state is the minimum time the application processor must remain in that suspend state to become energy efficient compared to the shallower suspend state.

| |  The energy is also consumed while entering and exiting a suspend state. The application processor must spend time equal to or more than minimum residency to justify the energy cost of entering and exiting that suspend state. |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| |  The application processor entering into a deeper suspend state with a high minimum residency will incur a longer wakeup latency due to more time required to exit that suspend state. If the predicted idle time by the application processor is less than the minimum residency of a suspend state, it should select the shallower suspend state to minimize the wakeup latency to achieve energy savings. |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

__Table 58\. Request Data__
| Word | Name          | Type   | Description                                                                            |
| ---- | ------------- | ------ | -------------------------------------------------------------------------------------- |
| 0    | SUSPEND\_TYPE | uint32 | Suspend type.Refer [Hart Suspend Types](#section-hart-suspend-types) for more details. |

__Table 59\. Response Data__
| Word | Name            | Type   | Description                                                                                                                                                                                                 |
| ---- | --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS          | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM SUSPEND\_TYPE is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS           | uint32 | Bits Description \[31: 1\] _Reserved_ and must be 0. \[0\] Local timer running status. 0b1: Local timer stops when the hart is suspended. 0b0: Local timer does not stop when hart is suspended.            |
| 2    | ENTRY\_LATENCY  | uint32 | Entry latency in microseconds.                                                                                                                                                                              |
| 3    | EXIT\_LATENCY   | uint32 | Exit latency in microseconds.                                                                                                                                                                               |
| 4    | WAKEUP\_LATENCY | uint32 | Wakeup latency in microseconds.                                                                                                                                                                             |
| 5    | MIN\_RESIDENCY  | uint32 | Minimum residency time in microseconds.                                                                                                                                                                     |

#### [](#service-hsm%5Fhart%5Fstart-service%5Fid-0x06)Service: HSM\_HART\_START (SERVICE\_ID: 0x06)

This service is used to start the execution on a hart identified by `HART_ID`. This service requires a start address which is the physical address from which the target hart will start execution. Successful completion of this service means that the hart has started execution from the specified start address.

__Table 60\. Request Data__
| Word | Name              | Type   | Description                               |
| ---- | ----------------- | ------ | ----------------------------------------- |
| 0    | HART\_ID          | uint32 | Hart ID of the target hart to be started. |
| 1    | START\_ADDR\_LOW  | uint32 | Lower 32-bit of the start address.        |
| 2    | START\_ADDR\_HIGH | uint32 | Upper 32-bit of the start address.        |

__Table 61\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully and hart has started. RPMI\_ERR\_INVALID\_PARAM HART\_ID or start address is invalid. RPMI\_ERR\_ALREADY Hart is already in transition to start state or has already started. RPMI\_ERR\_DENIED Hart is not in stopped state. RPMI\_ERR\_HW\_FAULT Failed due to hardware fault. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-hsm%5Fhart%5Fstop-service%5Fid-0x07)Service: HSM\_HART\_STOP (SERVICE\_ID: 0x07)

This service stops the execution on the calling hart. The mechanism for stopping the hart is platform specific. The hart can be powered down, if supported, or put into the deepest available sleep state.

This service returns successful if the platform microcontroller has successfully acknowledged that the target hart can be stopped. The hart upon successful acknowledgement can perform the final context saving if required and must enter into a quiesced state such as WFI which can be detected and allow the platform microcontroller to proceed to stop the hart. The mechanism to detect the hart quiesced state by the platform microcontroller is platform specific.

Once the hart is stopped, it can only be restarted by explicitly invoking the`HSM_HART_START` service call explicitly by any other hart.

__Table 62\. Request Data__
| Word | Name     | Type   | Description                  |
| ---- | -------- | ------ | ---------------------------- |
| 0    | HART\_ID | uint32 | Hart ID of the calling hart. |

__Table 63\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully and hart is stopped. RPMI\_ERR\_ALREADY Hart is already in transition to stop state or has already stopped. RPMI\_ERR\_DENIED Hart is not in start state. RPMI\_ERR\_HW\_FAULT Failed due to hardware failure. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-hsm%5Fhart%5Fsuspend-service%5Fid-0x08)Service: HSM\_HART\_SUSPEND (SERVICE\_ID: 0x08)

This service is used to put a hart in a low-power suspend state supported by the platform. Each suspend type is a 32-bit value which is discovered through the`HSM_GET_SUSPEND_TYPES` service.

This service returns successful if the platform microcontroller has successfully acknowledged that the target hart can be put into the requested `SUSPEND_TYPE`state. The target hart after the successful acknowledgement must enter into a quiesced state such as WFI which can be detected and allow the platform microcontroller complete the suspend state transition. The mechanism to detect the hart quiesced state by the platform microcontroller is platform specific.

For non-retentive suspend state the hart will resume its execution from the provided resume address.

__Table 64\. Request Data__
| Word | Name               | Type   | Description                                                                            |
| ---- | ------------------ | ------ | -------------------------------------------------------------------------------------- |
| 0    | HART\_ID           | uint32 | Hart ID of the calling hart.                                                           |
| 1    | SUSPEND\_TYPE      | uint32 | Suspend type.Refer [Hart Suspend Types](#section-hart-suspend-types) for more details. |
| 2    | RESUME\_ADDR\_LOW  | uint32 | Lower 32-bit of the resume address.Only used for non-retentive suspend types.          |
| 3    | RESUME\_ADDR\_HIGH | uint32 | Upper 32-bit of the resume address.Only used for non-retentive suspend types.          |

__Table 65\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                             |
| ---- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM HART\_ID or SUSPEND\_TYPE is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

### [](#service-group-cppc-servicegroup%5Fid-0x0006)Service Group - CPPC (SERVICEGROUP\_ID: 0x0006)

This service group defines the services to control application processor performance by managing a set of registers per application processor that are used for performance management and control. The ACPI CPPC (Collaborative Processor Performance Control) is an abstract and flexible mechanism that allows application processor to collaborate with the platform microcontroller to control the performance.

The CPPC extension defined in the RISC-V SBI specification \[[1](bibliography.html#bib-sbi)\] defines the register IDs for the standard CPPC registers, along with additional registers also required by the application processor.

The ACPI CPPC specification \[[3](bibliography.html#bib-acpi)\] provides the details of the CPPC registers and also provides details on the performance control mechanism through CPPC.

This service group works with the abstract performance scale defined by the ACPI CPPC and is managed by the platform which is responsible for the conversion between the abstract performance level and the internal performance operating point.

The platform may have multiple application processors that share the actual performance controls like clock, voltage regulator and others depending on the platform. In such cases a performance level change for one application processor will affect the entire the group sharing the controls. Its the responsibility of the power and performance management software running on the application processor and the platform to coordinate and manage the group level performance changes.

The following table lists the services in the CPPC service group:

__Table 66\. CPPC Services__
| Service ID | Service Name                     | Request Type    |
| ---------- | -------------------------------- | --------------- |
| 0x01       | CPPC\_ENABLE\_NOTIFICATION       | NORMAL\_REQUEST |
| 0x02       | CPPC\_PROBE\_REG                 | NORMAL\_REQUEST |
| 0x03       | CPPC\_READ\_REG                  | NORMAL\_REQUEST |
| 0x04       | CPPC\_WRITE\_REG                 | NORMAL\_REQUEST |
| 0x05       | CPPC\_GET\_FAST\_CHANNEL\_REGION | NORMAL\_REQUEST |
| 0x06       | CPPC\_GET\_FAST\_CHANNEL\_OFFSET | NORMAL\_REQUEST |
| 0x07       | CPPC\_GET\_HART\_LIST            | NORMAL\_REQUEST |

#### [](#cppc-fast-channel)CPPC Fast-channel

The CPPC service group defines the fast-channels to be used by the application processor to request performance changes and to obtain performance change feedback for an application processor from the platform microcontroller.

A fast-channel shared memory layout is specific to the CPPC service group. The data written in a fast-channel do not follow the conventional RPMI message format. The simple data format supported by the fast-channel allows faster processing of the performance change requests made through a fast-channel and faster read of the performance feedback values supported over the fast-channel.

The CPPC service group defines two types of fast-channel for each application processor. If fast-channels are supported then each application processor must be assigned both types fast-channel.

##### [](#performance-request-fast-channel)Performance Request Fast-channel

In this fast-channel the application processor will either write the desired performance level in case of normal mode or the minimum and maximum performance level in case of Autonomous (CPPC2) mode in the fast-channel. Otherwise the application processor can call the service`CPPC_WRITE_REG` for the `DesiredPerformanceRegister` or`MinimumPerformanceRegister` and `MaximumPerformanceRegister`.

The supported values in this fast-channel which depends on the CPPC mode, either normal or autonomous mode is discoverable through `CPPC_GET_FAST_CHANNEL_REGION`service.

The size of this fast-channel type is `8 bytes`.

__Table 67\. CPPC Performance Request Fast-channel Layout__
| CPPC Mode               | Layout                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Normal Mode             | Offset Value (32-bit) 0x0 Desired performance level. 0x4 _Reserved_ and must be 0.  |
| Autonomous (CPPC2) mode | Offset Value (32-bit) 0x0 Minimum performance level. 0x4 Maximum performance level. |

##### [](#performance-feedback-fast-channel)Performance Feedback Fast-channel

In this fast-channel the application processor will read the supported value for estimating the delivered performance as performance feedback for an application processor. The application processor current frequency (Hz) is used for performance feedback in this fast-channel. The platform microcontroller must write the frequency of an application processor in the fast-channel whenever it changes.

The size of this fast-channel type is `8 bytes`.

__Table 68\. CPPC Performance Feedback Fast-channel Layout__
| Offset | Value (32-bit)                      |
| ------ | ----------------------------------- |
| 0x0    | Current frequency low 32-bit (Hz).  |
| 0x4    | Current frequency high 32-bit (Hz). |

##### [](#cppc-fast-channel-shared-memory-region)CPPC Fast-channel Shared Memory Region

The size of the shared memory region containing all the fast-channels for all the managed application processors must be a `power-of-2`. The `base-address` and `size`(bytes) of this shared memory region can be discovered using the service `CPPC_GET_FAST_CHANNEL_REGION`. The `base-address` of the shared memory region must be aligned to `8 bytes` which is maximum size of a fast-channel in both the types.

The offsets of fast-channels of both types for an application processor are aligned to `8 bytes`. The offset of both fast-channel types in the shared memory region can be discovered through service `CPPC_GET_FAST_CHANNEL_OFFSET`. The offsets discovered can be added to the `base-address` of the shared memory region to form the address of Performance Request fast-channel and Performance Feedback fast-channel for an application processor.

##### [](#performance-request-fast-channel-doorbell)Performance Request Fast-channel Doorbell

A doorbell can also be supported for this fast-channel type which is shared between all the application processors. The doorbell, if supported must be a memory mapped register with write access. The doorbell details and attributes such as doorbell register address, doorbell write value can be discovered by the application processor through the`CPPC_GET_FAST_CHANNEL_REGION` service.

The doorbell register address is the physical address of the register. The doorbell write value is the value which must be written in the doorbell register to trigger the doorbell interrupt.

The width of the doorbell write value must be equal to the doorbell register width.

| |  The write value may also contains other set bits which must persist on every write to the doorbell register. |
| --------------------------------------------------------------------------------------------------------------- |

#### [](#cppc-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-cppc%5Fenable%5Fnotification-service%5Fid-0x01)Service: CPPC\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `CPPC`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#cppc-notifications).

__Table 69\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 70\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-cppc%5Fprobe%5Freg-service%5Fid-0x02)Service: CPPC\_PROBE\_REG (SERVICE\_ID: 0x02)

This service is used to probe a CPPC register implementation status for a application processor. If the CPPC register `reg_id` is implemented then the length in bits is returned in `REG_LENGTH` field. If the register is not supported or invalid then the `REG_LENGTH` will be `0`.

__Table 71\. Request Data__
| Word | Name     | Type   | Description       |
| ---- | -------- | ------ | ----------------- |
| 0    | REG\_ID  | uint32 | CPPC register ID. |
| 1    | HART\_ID | uint32 | Hart ID.          |

__Table 72\. Response Data__
| Word | Name        | Type   | Description                                                                                                                                                                                                                                                              |
| ---- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS      | int32  | Return error code. Error Code Description RPMI\_SUCCESS CPPC register probed successfully. RPMI\_ERR\_INVALID\_PARAM HART\_ID or REG\_ID is invalid. RPMI\_ERR\_NOT\_SUPPORTED REG\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | REG\_LENGTH | uint32 | Register length (bits).                                                                                                                                                                                                                                                  |

#### [](#service-cppc%5Fread%5Freg-service%5Fid-0x03)Service: CPPC\_READ\_REG (SERVICE\_ID: 0x03)

This service is used to read a CPPC register. If the fast-channels are supported, a read of the `DesiredPerformanceRegister` or`MinimumPerformanceRegister` and `MaximumPerformanceRegister` through this service will return the current desired performance level or minimum and maximum performance level limit depending on the CPPC mode from the fast-channel of a application processor.

__Table 73\. Request Data__
| Word | Name     | Type   | Description       |
| ---- | -------- | ------ | ----------------- |
| 0    | REG\_ID  | uint32 | CPPC register ID. |
| 1    | HART\_ID | uint32 | Hart ID.          |

__Table 74\. Response Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                                           |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS     | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM HART\_ID or REG\_ID is invalid. RPMI\_ERR\_NOT\_SUPPORTED REG\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | DATA\_LOW  | uint32 | Lower 32-bit of the data.                                                                                                                                                                                                                                             |
| 2    | DATA\_HIGH | uint32 | Upper 32-bit of data. This will be 0 if the register is of 32-bit length.                                                                                                                                                                                             |

#### [](#service-cppc%5Fwrite%5Freg-service%5Fid-0x04)Service: CPPC\_WRITE\_REG (SERVICE\_ID: 0x04)

This service is used to write a CPPC register.

If the fast-channels are supported the application processor must only write desired performance level in the fast-channel instead of writing into the`DesiredPerformanceRegister` through this service. Similarly, in case of the autonomous mode the application processor must write minimum and maximum limit levels into the fast-channel instead of calling this service for`MinimumPerformanceRegister` and `MaximumPerformanceRegister`. Otherwise the writes to these registers may be ignored.

__Table 75\. Request Data__
| Word | Name       | Type   | Description                                                                |
| ---- | ---------- | ------ | -------------------------------------------------------------------------- |
| 0    | REG\_ID    | uint32 | CPPC register ID.                                                          |
| 1    | HART\_ID   | uint32 | Hart ID.                                                                   |
| 2    | DATA\_LOW  | uint32 | Lower 32-bit of data.                                                      |
| 3    | DATA\_HIGH | uint32 | Upper 32-bit of data. This is ignored if the register is of 32-bit length. |

__Table 76\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                   |
| ---- | ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM HART\_ID or REG\_ID is invalid. RPMI\_ERR\_NOT\_SUPPORTED REG\_ID is not supported. RPMI\_ERR\_DENIED REG\_ID is read only. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-cppc%5Fget%5Ffast%5Fchannel%5Fregion-service%5Fid-0x05)Service: CPPC\_GET\_FAST\_CHANNEL\_REGION (SERVICE\_ID: 0x05)

This service is used to get the details of the shared memory region containing all the fast-channels, attributes of the fast-channel and the details of the doorbell if supported.

The doorbell details are unspecified and considered invalid if the Performance Request fast-channel doorbell (`FLAGS[0] = 0`) is not supported and must not be used.

__Table 77\. Request Data__
| NA |
| -- |

__Table 78\. Response Data__
| Word | Name               | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS             | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_NOT\_SUPPORTED Fast-channels not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                                                                                                                                                                                                                                                                    |
| 1    | FLAGS              | uint32 | Bits Description \[31:5\] _Reserved_ and must be 0. \[4:3\] CPPC mode. 0b00: Normal mode. Desired performance level for performance change. 0b01: Autonomous mode. Performance limit change. Platform can choose the level in the requested limit. 0b10 - 0b11: Reserved. \[2:1\] Performance Request fast-channel doorbell register width. 0b00: 8-bit. 0b01: 16-bit. 0b10: 32-bit. 0b11: Reserved. \[0\] Performance Request fast-channel doorbell support. 0b1: Supported. 0b0: Not supported. |
| 2    | REGION\_ADDR\_LOW  | uint32 | Lower 32-bit of the fast-channels shared memory region physical address.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3    | REGION\_ADDR\_HIGH | uint32 | Upper 32-bit of the fast-channels shared memory region physical address.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4    | REGION\_SIZE\_LOW  | uint32 | Lower 32-bit of the fast-channels shared memory region size.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 5    | REGION\_SIZE\_HIGH | uint32 | Upper 32-bit of the fast-channels shared memory region size.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6    | DB\_ADDR\_LOW      | uint32 | Lower 32-bit of doorbell register address for Performance Request fast-channel.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7    | DB\_ADDR\_HIGH     | uint32 | Upper 32-bit of doorbell register address for Performance Request fast-channel.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 8    | DB\_WRITE\_VALUE   | uint32 | 32-bit doorbell write value for Performance Request fast-channel.If the doorbell register width is less than 32-bit, the lower bits in this field equal to the doorbell register width must be used as write value.                                                                                                                                                                                                                                                                               |

#### [](#service-cppc%5Fget%5Ffast%5Fchannel%5Foffset-service%5Fid-0x06)Service: CPPC\_GET\_FAST\_CHANNEL\_OFFSET (SERVICE\_ID: 0x06)

This service is used to get the offsets of Performance Request fast-channel and Performance Feedback fast-channel for an application processor in the shared memory region containing all the fast-channels.

__Table 79\. Request Data__
| Word | Name     | Type   | Description |
| ---- | -------- | ------ | ----------- |
| 0    | HART\_ID | uint32 | Hart ID.    |

__Table 80\. Response Data__
| Word | Name                         | Type   | Description                                                                                                                                                                                                                                                   |
| ---- | ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS                       | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM HART\_ID is invalid. RPMI\_ERR\_NOT\_SUPPORTED Fast-channels not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | PERF\_REQUEST\_OFFSET\_LOW   | uint32 | Lower 32-bit of a Performance Request fast-channel offset.                                                                                                                                                                                                    |
| 2    | PERF\_REQUEST\_OFFSET\_HIGH  | uint32 | Upper 32-bit of a Performance Request fast-channel offset.                                                                                                                                                                                                    |
| 3    | PERF\_FEEDBACK\_OFFSET\_LOW  | uint32 | Lower 32-bit of a Performance Feedback fast-channel offset.                                                                                                                                                                                                   |
| 4    | PERF\_FEEDBACK\_OFFSET\_HIGH | uint32 | Upper 32-bit of a Performance Feedback fast-channel offset.                                                                                                                                                                                                   |

#### [](#service-cppc%5Fget%5Fhart%5Flist-service%5Fid-0x07)Service: CPPC\_GET\_HART\_LIST (SERVICE\_ID: 0x07)

This service retrieves the list of Hart IDs managed by this service group for performance control.

If the number of words required for all available Hart IDs exceeds the number of words that can be returned in one acknowledgement message then the platform microcontroller will set the `REMAINING` and `RETURNED` fields accordingly and only return the Hart IDs which can be accommodated. The application processor may need to call this service again with the appropriate `START_INDEX` until the`REMAINING` field returns `0`.

__Table 81\. Request Data__
| Word | Name         | Type   | Description                |
| ---- | ------------ | ------ | -------------------------- |
| 0    | START\_INDEX | uint32 | Starting index of Hart ID. |

__Table 82\. Response Data__
| Word | Name          | Type   | Description                                                                                                                                                                                                |
| ---- | ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS        | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM START\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | REMAINING     | uint32 | Remaining number of Hart IDs to be returned.                                                                                                                                                               |
| 2    | RETURNED      | uint32 | Number of Hart IDs returned in this request.                                                                                                                                                               |
| 3    | HART\_ID\[N\] | uint32 | Hart IDs.                                                                                                                                                                                                  |

### [](#service-group-voltage-servicegroup%5Fid-0x0007)Service Group - VOLTAGE (SERVICEGROUP\_ID: 0x0007)

This service group is used to control the voltage level of the voltage domains. A voltage domain is the logical grouping of one or more devices powered by a single controllable voltage source. A system may have multiple voltage domains and the services defined in this service group are used to manage and control the voltage levels of these voltage domains. Each voltage domain is identified by`DOMAIN_ID` which is a 32-bit integer starting from `0`.

The following table lists the services in the VOLTAGE service group:

__Table 83\. VOLTAGE Services__
| Service ID | Service Name                 | Request Type    |
| ---------- | ---------------------------- | --------------- |
| 0x01       | VOLT\_ENABLE\_NOTIFICATION   | NORMAL\_REQUEST |
| 0x02       | VOLT\_GET\_NUM\_DOMAINS      | NORMAL\_REQUEST |
| 0x03       | VOLT\_GET\_ATTRIBUTES        | NORMAL\_REQUEST |
| 0x04       | VOLT\_GET\_SUPPORTED\_LEVELS | NORMAL\_REQUEST |
| 0x05       | VOLT\_SET\_CONFIG            | NORMAL\_REQUEST |
| 0x06       | VOLT\_GET\_CONFIG            | NORMAL\_REQUEST |
| 0x07       | VOLT\_SET\_LEVEL             | NORMAL\_REQUEST |
| 0x08       | VOLT\_GET\_LEVEL             | NORMAL\_REQUEST |

#### [](#voltage-level-format-section)Voltage Level Format

There are two types of voltage level formats supported in the VOLTAGE service group. The voltage levels are represented as a group.

##### [](#discrete-format)Discrete Format

A set of discrete voltage levels arranged in a sequence, starting from the lowest value at the lowest index and increasing sequentially to higher levels. The following table shows the structure of the discrete format.

```c
[voltage0, voltage1, voltage2, ... , voltage(N-1)]

where:
voltage0 < voltage1 < voltage2 < ... < voltage(N-1)
```

| Word | Name    | Description                                |
| ---- | ------- | ------------------------------------------ |
| 0    | VOLTAGE | Discrete voltage level in microvolts (uV). |

##### [](#linear-range-format)Linear Range Format

A linear range of voltage levels with a constant step size. The following table shows the structure of the linear range voltage format.

```c
[voltage_min, voltage_max, voltage_step]
```

Multi-linear range format can be supported by having multiple `linear range` tuple arranged in an continuous array format.

```c
[voltage_min0, voltage_max0, voltage_step0],
[voltage_min1, voltage_max1, voltage_step1],
...
[voltage_min(N-1), voltage_max(N-1), voltage_step(N-1)],
```

The format must be packed sequentially such that `voltage_max0 < voltage_min1, voltage_max1 < voltage_min2` and so on.

Each linear range is considered as a single voltage level.

| Word | Name         | Description                                         |
| ---- | ------------ | --------------------------------------------------- |
| 0    | VOLTAGE\_MIN | Lower boundary of voltage level in microvolts (uV). |
| 1    | VOLTAGE\_MAX | Upper boundary of voltage level in microvolts (uV). |
| 2    | STEP         | Step size in microvolts (uV).                       |

#### [](#voltage-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-volt%5Fenable%5Fnotification-service%5Fid-0x01)Service: VOLT\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `VOLTAGE`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#voltage-notifications).

__Table 84\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 85\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-volt%5Fget%5Fnum%5Fdomains-service%5Fid-0x02)Service: VOLT\_GET\_NUM\_DOMAINS (SERVICE\_ID: 0x02)

This service is used to query the number of voltage domains available in the system.

__Table 86\. Request Data__
| NA |
| -- |

__Table 87\. Response Data__
| Word | Name         | Type   | Description                                                                                                                                             |
| ---- | ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS       | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | NUM\_DOMAINS | uint32 | Number of voltage domains.                                                                                                                              |

#### [](#service-volt%5Fget%5Fattributes-service%5Fid-0x03)Service: VOLT\_GET\_ATTRIBUTES (SERVICE\_ID: 0x03)

Each domain may support multiple voltage levels, which are permitted by the domain for operation. The number of levels indicates the total count of voltage levels supported within a voltage domain. Transition latency denotes the maximum time required for the voltage to stabilize upon a change in the regulator. The `FLAGS`field encodes the voltage format supported by the hardware, including discrete and linear range formats." The `NUM_LEVELS` field returns the number of discrete voltage in case discrete format and number of linear range tuple in linear range voltage format. Each domain can support only one voltage level format. Additional voltage formats can be accommodated in the future if required.

__Table 88\. Request Data__
| Word | Name       | Type   | Description        |
| ---- | ---------- | ------ | ------------------ |
| 0    | DOMAIN\_ID | uint32 | Voltage domain ID. |

__Table 89\. Response Data__
| Word | Name           | Type        | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | -------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                                                                                                                                                                                                   |
| 1    | FLAGS          | uint32      | Bits Description \[31:4\] _Reserved_ and must be 0. \[3:1\] Voltage format.Refer to [Voltage Level Format](#voltage-level-format-section) for more details. 0b000: Discrete format. 0b001: Linear range format. 0b010 - 0b111: Reserved. \[0\] Voltage domain control support. 0b0: Voltage domain can be enabled/disabled. 0b1: Voltage domain is always-on, voltage value can be changed in the supported voltage range. |
| 2    | NUM\_LEVELS    | uint32      | The number of voltage levels (number of arrays) supported by the domain. If the voltage level format is a linear range, then each linear range is considered a single voltage level.                                                                                                                                                                                                                                       |
| 3    | TRANS\_LATENCY | uint32      | Transition latency, in microsecond (us).                                                                                                                                                                                                                                                                                                                                                                                   |
| 4:7  | DOMAIN\_NAME   | uint8\[16\] | Voltage domain name, a NULL-terminated ASCII string up to 16-bytes.                                                                                                                                                                                                                                                                                                                                                        |

#### [](#service-volt%5Fget%5Fsupported%5Flevels-service%5Fid-0x04)Service: VOLT\_GET\_SUPPORTED\_LEVELS (SERVICE\_ID: 0x04)

Each domain may support multiple voltage levels which are allowed by the domain to operate. The number of voltage levels returned depends on the format of the voltage level.

The total number of words required to represent the voltage levels in one message cannot exceed the total words available in one message `DATA` field. If the number of levels exceeds this limit, the platform microcontroller will return the maximum number of levels that can be accommodated in one message and adjust the `REMAINING`field accordingly. When the `REMAINING` field is not zero, the application processor must make subsequent service calls with the appropriate `VOLTAGE_LEVEL_INDEX` set to retrieve the remaining voltage levels. It is possible that multiple service calls may be necessary to retrieve all the voltage levels.

__Table 90\. Request Data__
| Word | Name                  | Type   | Description                                                                                                            |
| ---- | --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| 0    | DOMAIN\_ID            | uint32 | Voltage domain ID.                                                                                                     |
| 1    | VOLTAGE\_LEVEL\_INDEX | uint32 | The index of discrete voltage if the format is discrete, or index of linear range tuple if the format is linear range. |

__Table 91\. Response Data__
| Word | Name               | Type       | Description                                                                                                                                                                                                                                                                                              |
| ---- | ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS             | int32      | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully and voltage levels returned. RPMI\_ERR\_INVALID\_PARAM Voltage DOMAIN\_ID is invalid. RPMI\_ERR\_INVALID\_PARAM VOLTAGE\_LEVEL\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS              | uint32     | _Reserved_ and must be 0.                                                                                                                                                                                                                                                                                |
| 2    | REMAINING          | uint32     | The remaining number of discrete voltage if the format is discrete type, or number of linear range tuple if the format is linear range.                                                                                                                                                                  |
| 3    | RETURNED           | uint32     | The number of discrete voltage levels returned if the format is discrete type, or the number of linear range tuple if the format is linear range.                                                                                                                                                        |
| 4    | VOLTAGE\_LEVEL\[\] | uint32\[\] | Voltage levels.The voltage format data structure and its packing is according to the supported format. Refer to [Voltage Level Format](#voltage-level-format-section) for more details.                                                                                                                  |

#### [](#service-volt%5Fset%5Fconfig-service%5Fid-0x05)Service: VOLT\_SET\_CONFIG (SERVICE\_ID: 0x05)

This service is used to configure a voltage domain.

__Table 92\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                           |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | DOMAIN\_ID | uint32 | Voltage domain ID.                                                                                                                                                    |
| 1    | CONFIG     | uint32 | Voltage domain config. Bits **Description** \[31:1\] _Reserved_ and must be 0. \[0\] Voltage supply control. 0b1: Enable voltage supply. 0b0: Disable voltage supply. |

__Table 93\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                |
| ---- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM Voltage DOMAIN\_ID or CONFIG is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-volt%5Fget%5Fconfig-service%5Fid-0x06)Service: VOLT\_GET\_CONFIG (SERVICE\_ID: 0x06)

This service is used to get the configuration of a voltage domain.

__Table 94\. Request Data__
| Word | Name       | Type   | Description        |
| ---- | ---------- | ------ | ------------------ |
| 0    | DOMAIN\_ID | uint32 | Voltage domain ID. |

__Table 95\. Response Data__
| Word | Name   | Type   | Description                                                                                                                                                                                                     |
| ---- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM Voltage DOMAIN\_ID not found. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CONFIG | uint32 | Voltage domain config. Bits Description \[31:1\] _Reserved_ and must be 0. \[0\] Voltage supply state. 0b1: Voltage supply is enabled. 0b0: Voltage supply is disabled.                                         |

#### [](#service-volt%5Fset%5Flevel-service%5Fid-0x07)Service: VOLT\_SET\_LEVEL (SERVICE\_ID: 0x07)

This service is used to set the voltage level in microvolts of a voltage domain.

__Table 96\. Request Data__
| Word | Name           | Type   | Description                   |
| ---- | -------------- | ------ | ----------------------------- |
| 0    | DOMAIN\_ID     | uint32 | Voltage domain ID.            |
| 1    | VOLTAGE\_LEVEL | int32  | Voltage level, in microvolts. |

__Table 97\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                        |
| ---- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM Voltage DOMAIN\_ID or VOLTAGE\_LEVEL is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-volt%5Fget%5Flevel-service%5Fid-0x08)Service: VOLT\_GET\_LEVEL (SERVICE\_ID: 0x08)

This service is used to get the current voltage level in microvolts of a voltage domain.

__Table 98\. Request Data__
| Word | Name       | Type   | Description        |
| ---- | ---------- | ------ | ------------------ |
| 0    | DOMAIN\_ID | uint32 | Voltage domain ID. |

__Table 99\. Response Data__
| Word | Name           | Type  | Description                                                                                                                                                                                                     |
| ---- | -------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM Voltage DOMAIN\_ID not found. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | VOLTAGE\_LEVEL | int32 | Voltage level, in microvolts.                                                                                                                                                                                   |

### [](#service-group-clock-servicegroup%5Fid-0x0008)Service Group - CLOCK (SERVICEGROUP\_ID: 0x0008)

This service group is used to manage system clocks. Services defined in this group are used to enable or disable clocks, set or get clock rates, etc.

Each clock in the system is identified by a clock ID, which is a 32-bit integer identifier assigned to each clock. The mapping of CLOCK\_ID to clock is known to both the application processor and the platform microcontroller. Clock IDs are sequential and start from `0`.

A device or a group of devices sharing the same clock source form a single clock domain identified by the CLOCK\_ID. Any change to the clock source affects the entire domain, which may include multiple devices.

The topology of the devices and the clock source depends on the system design and is implementation specific. The operating system can discover this topology through supported hardware description mechanisms.

The following table lists the services in the CLOCK service group:

__Table 100\. CLOCK Services__
| Service ID | Service Name               | Request Type    |
| ---------- | -------------------------- | --------------- |
| 0x01       | CLK\_ENABLE\_NOTIFICATION  | NORMAL\_REQUEST |
| 0x02       | CLK\_GET\_NUM\_CLOCKS      | NORMAL\_REQUEST |
| 0x03       | CLK\_GET\_ATTRIBUTES       | NORMAL\_REQUEST |
| 0x04       | CLK\_GET\_SUPPORTED\_RATES | NORMAL\_REQUEST |
| 0x05       | CLK\_SET\_CONFIG           | NORMAL\_REQUEST |
| 0x06       | CLK\_GET\_CONFIG           | NORMAL\_REQUEST |
| 0x07       | CLK\_SET\_RATE             | NORMAL\_REQUEST |
| 0x08       | CLK\_GET\_RATE             | NORMAL\_REQUEST |

#### [](#clock-rate-format-section)Clock Rate Format

Each clock rate is a array of two 32-bit values `(uint32, uint32)` represented as `(clock_rate_low, clock_rate_high)` and packed in the same order where`clock_rate_low` is at the lower index than the `clock_rate_high`.

##### [](#discrete-format-2)Discrete Format

A set of discrete clock rates arranged in a sequence, starting from the lowest value at the lowest index and increasing sequentially to higher clock rate. The following table shows the structure of the discrete clock rate format.

```c
[clock_rate0, clock_rate1, clock_rate2, ... , clock_rate(N-1)]

where:
clock_rate0 < clock_rate1 < clock_rate2 < ... < clock_rate(N-1)
```

__Table 101\. Discrete Clock Format Structure__
| Word | Name              | Description                    |
| ---- | ----------------- | ------------------------------ |
| 0    | CLOCK\_RATE\_LOW  | Lower 32-bit clock rate in Hz. |
| 1    | CLOCK\_RATE\_HIGH | Upper 32-bit clock rate in Hz. |

##### [](#clock-rate-format-linear)Linear Range Format

A linear range of clock rates represented by minimum and maximum clock rate and a constant step size. The following table shows the fixed structure of the linear range format for clock rates.

```c
[clock_rate_min, clock_rate_max, clock_step]
```

__Table 102\. Linear Range Format Structure__
| Word | Name                   | Description                                                  |
| ---- | ---------------------- | ------------------------------------------------------------ |
| 0    | CLOCK\_MIN\_RATE\_LOW  | Lower 32-bit of the lowest clock rate in Hz.                 |
| 1    | CLOCK\_MIN\_RATE\_HIGH | Upper 32-bit of the lowest clock rate in Hz.                 |
| 2    | CLOCK\_MAX\_RATE\_LOW  | Lower 32-bit of the highest clock rate in Hz.                |
| 3    | CLOCK\_MAX\_RATE\_HIGH | Upper 32-bit of the highest clock rate in Hz.                |
| 4    | CLOCK\_STEP\_LOW       | Lower 32-bit of the step between two successive rates in Hz. |
| 5    | CLOCK\_STEP\_HIGH      | Upper 32-bit of the step between two successive rates in Hz. |

A clock may also support clock rates which can be represented by multiple linear ranges. For example,

```c
[clock_rate_min0, clock_rate_max0, clock_rate_step0],
[clock_rate_min1, clock_rate_max1, clock_rate_step1],
 ...,
[clock_rate_min(N-1), clock_rate_max(N-1), clock_rate_step(N-1)]
```

The linear ranges must be packed sequentially such that`clock_rate_max0 < clock_rate_min1`, `clock_rate_max1 < clock_rate_min2` and so on.

#### [](#clock-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-clk%5Fenable%5Fnotification-service%5Fid-0x01)Service: CLK\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `CLOCK`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#clock-notifications).

__Table 103\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 104\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                       |
| ---- | -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes) |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                |

#### [](#service-clk%5Fget%5Fnum%5Fclocks-service%5Fid-0x02)Service: CLK\_GET\_NUM\_CLOCKS (SERVICE\_ID: 0x02)

This service is used to query the number of clocks available in the system. All supported clocks in the system are designated by an integer identifier called `CLOCK_ID`.

__Table 105\. Request Data__
| NA |
| -- |

__Table 106\. Response Data__
| Word | Name        | Type   | Description                                                                                                                                             |
| ---- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS      | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | NUM\_CLOCKS | uint32 | Number of clocks.                                                                                                                                       |

#### [](#service-clk%5Fget%5Fattributes-service%5Fid-0x03)Service: CLK\_GET\_ATTRIBUTES (SERVICE\_ID: 0x03)

This service provides detailed attributes of a clock, including its name, represented as a 16-byte array of ASCII strings. It also specifies the transition latency, which denotes the maximum time for the clock to stabilize after a configuration change. The `FLAGS` field encodes the clock formats supported by the clock. When the format is of the discrete type, the `NUM_RATES` field returns the number of discrete clock rates supported by the clock. In the case of linear range format the `NUM_RATES`will return the number of linear ranges supported.

__Table 107\. Request Data__
| Word | Name      | Type   | Description |
| ---- | --------- | ------ | ----------- |
| 0    | CLOCK\_ID | uint32 | Clock ID.   |

__Table 108\. Response Data__
| Word | Name                | Type        | Description                                                                                                                                                                                                                   |
| ---- | ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS              | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM CLOCK\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                       |
| 1    | FLAGS               | uint32      | Bits Description \[31:2\] _Reserved_ and must be 0. \[1:0\] Clock format. Refer to [Clock Rate Format](#clock-rate-format-section) for more details. 0b00: Discrete format. 0b01: Linear range format. 0b10 - 0b11: Reserved. |
| 2    | NUM\_RATES          | uint32      | The number of discrete clock rates if the format is of discrete type, or the number of linear ranges if the format is linear range.                                                                                           |
| 3    | TRANSITION\_LATENCY | uint32      | Transition latency, in microseconds (us).                                                                                                                                                                                     |
| 4:7  | CLOCK\_NAME         | uint8\[16\] | Clock name, a NULL-terminated ASCII string up to 16-bytes.                                                                                                                                                                    |

#### [](#service-clk%5Fget%5Fsupported%5Frates-service%5Fid-0x04)Service: CLK\_GET\_SUPPORTED\_RATES (SERVICE\_ID: 0x04)

This service is used to get the supported clock rates. The clock rate data returned by this service depends on the format supported by the clock.

If the format is discrete, the message can pass the `CLOCK_RATE_INDEX` which is the index to the first rate value to be described in the returned rate array. If all supported rate values are required then this index value can be `0`. Similarly, if the format is linear range, then the `CLOCK_RATE_INDEX` is the index of the first linear range to be described in the returned clock rate linear ranges. If all the supported linear ranges are needed then this index value can be `0`.

The total number of words required for the number of discrete clock rates or linear ranges according to the format in one message must not exceed the total words available in a message DATA field. If the format is linear range and a clock supports multiple linear ranges, then only complete linear ranges must be returned as per the data format of the linear range described in [Linear Range Format](#clock-rate-format-linear).

If the total number of words required to store all supported discrete clock rates or the linear ranges exceed the available words in message DATA field then `REMAINING`and `RETURNED` must be set accordingly. In such condition, if the format is discrete, the platform microcontroller will return the discrete clock rates which can be accommodated in one message and set the `RETURNED` field to number of discrete clock rates returned and `REMAINING` field is set to the remaining number of discrete clock rates. Similarly if the format is linear, the linear ranges which can be accommodated in one message are returned with `RETURNED` field set to the number of linear ranges returned and `REMAINING` field is set to the remaining number of linear ranges.

The application processor, when `REMAINING` field is not `0` must call this service again with appropriate `CLOCK_RATE_INDEX` set to get the remaining discrete clock rates or linear ranges.

__Table 109\. Request Data__
| Word | Name               | Type   | Description       |
| ---- | ------------------ | ------ | ----------------- |
| 0    | CLOCK\_ID          | uint32 | Clock ID.         |
| 1    | CLOCK\_RATE\_INDEX | uint32 | Clock rate index. |

__Table 110\. Response Data__
| Word | Name             | Type        | Description                                                                                                                                                                                                                   |
| ---- | ---------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS           | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM CLOCK\_ID or CLOCK\_RATE\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS            | uint32      | _Reserved_ and must be 0.                                                                                                                                                                                                     |
| 2    | REMAINING        | uint32      | The remaining number of discrete clock rates if the format is discrete type, or the remaining number of linear ranges if the format is linear range.                                                                          |
| 3    | RETURNED         | uint32      | The number of discrete clock rates returned if the format is discrete type, or the number of linear ranges returned if the format is linear range.                                                                            |
| 4    | CLOCK\_RATE\[ \] | uint32\[2\] | Clock rates.The clock rate data structure and its packing is according to the supported format. Refer to [Clock Rate Format](#clock-rate-format-section) for more details.                                                    |

#### [](#service-clk%5Fset%5Fconfig-service%5Fid-0x05)Service: CLK\_SET\_CONFIG (SERVICE\_ID: 0x05)

This service is used to configure a clock domain.

__Table 111\. Request Data__
| Word | Name      | Type   | Description                                                                                                                   |
| ---- | --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 0    | CLOCK\_ID | uint32 | Clock ID.                                                                                                                     |
| 1    | CONFIG    | uint32 | Clock config. Bits Description \[31:1\] _Reserved_ and must be 0. \[0\] Clock control. 0b0: Disable clock. 0b1: Enable clock. |

__Table 112\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                       |
| ---- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM CLOCK\_ID or CONFIG is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-clk%5Fget%5Fconfig-service%5Fid-0x06)Service: CLK\_GET\_CONFIG (SERVICE\_ID: 0x06)

This service is used to get the configuration of a clock domain.

__Table 113\. Request Data__
| Word | Name      | Type   | Description |
| ---- | --------- | ------ | ----------- |
| 0    | CLOCK\_ID | uint32 | Clock ID.   |

__Table 114\. Response Data__
| Word | Name   | Type   | Description                                                                                                                                                                                            |
| ---- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM CLOCK\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes) |
| 1    | CONFIG | uint32 | Clock config. Bits Description \[31:1\] _Reserved_ and must be 0. \[0\] Clock state. 0b0: Clock is disabled. 0b1: Clock is enabled.                                                                    |

#### [](#service-clk%5Fset%5Frate-service%5Fid-0x07)Service: CLK\_SET\_RATE (SERVICE\_ID: 0x07)

This service is used to set the clock rate of a specific clock.

__Table 115\. Request Data__
| Word | Name              | Type   | Description                                                                                                                                                                                                                                            |
| ---- | ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | CLOCK\_ID         | uint32 | Clock ID.                                                                                                                                                                                                                                              |
| 1    | FLAGS             | uint32 | Bits Description \[31:2\] _Reserved_ and must be 0. \[1:0\] Clock rate rounding mode. 0b00: Round down. 0b01: Round up. 0b10: Auto. 0b11: Reserved. In Auto mode the platform can autonomously chooses a supported rate closest to the requested rate. |
| 2    | CLOCK\_RATE\_LOW  | uint32 | Lower 32-bit of the clock rate in Hertz.                                                                                                                                                                                                               |
| 3    | CLOCK\_RATE\_HIGH | uint32 | Upper 32-bit of the clock rate in Hertz.                                                                                                                                                                                                               |

__Table 116\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                       |
| ---- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM CLOCK\_ID or clock rate is invalid or the flags passed are invalid or reserved. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-clk%5Fget%5Frate-service%5Fid-0x08)Service: CLK\_GET\_RATE (SERVICE\_ID: 0x08)

This service is used to get the current clock rate.

__Table 117\. Request Data__
| Word | Name      | Type   | Description |
| ---- | --------- | ------ | ----------- |
| 0    | CLOCK\_ID | uint32 | Clock ID.   |

__Table 118\. Request Data__
| Word | Name              | Type   | Description                                                                                                                                                                                             |
| ---- | ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS            | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM CLOCK\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CLOCK\_RATE\_LOW  | uint32 | Lower 32-bit of the clock rate in Hertz.                                                                                                                                                                |
| 2    | CLOCK\_RATE\_HIGH | uint32 | Upper 32-bit of the clock rate in Hertz.                                                                                                                                                                |

### [](#service-group-device%5Fpower-servicegroup%5Fid-0x0009)Service Group - DEVICE\_POWER (SERVICEGROUP\_ID: 0x0009)

This DEVICE\_POWER service group provides messages to manage the power states of a device power domain. This service group is used only for device power management since system and CPU power management is handled by already defined service groups such as SYSTEM\_RESET, SYSTEM\_SUSPEND and HART\_STATE\_MANAGEMENT.

A domain can consist of one device if its power states can be controlled independently or it may also have multiple devices if they all share the same power control lines and power states can only be changed collectively. Each domain must support ON and OFF states along with custom power states which are discoverable. Domains may also have power states which may preserve the context. The level of context preserved will depends on the level of power state.

Power states for domains will be discovered via supported hardware description mechanisms where the values for ON and OFF are already fixed and known. The power state encodes both the power state value and the context preserved or lost information corresponding to that state.

The DEVICE\_POWER services take a 32-bit integer identifier known as `DOMAIN_ID`to specify the device power domain. These `DOMAIN_ID` identifiers are sequential and start from `0`.

The following table lists the services in the DEVICE\_POWER service group:

__Table 119\. DEVICE\_POWER Services__
| Service ID | Service Name               | Request Type    |
| ---------- | -------------------------- | --------------- |
| 0x01       | DPWR\_ENABLE\_NOTIFICATION | NORMAL\_REQUEST |
| 0x02       | DPWR\_GET\_NUM\_DOMAINS    | NORMAL\_REQUEST |
| 0x03       | DPWR\_GET\_ATTRIBUTES      | NORMAL\_REQUEST |
| 0x04       | DPWR\_SET\_STATE           | NORMAL\_REQUEST |
| 0x05       | DPWR\_GET\_STATE           | NORMAL\_REQUEST |

#### [](#section-power-state)Power State Format

The power state is represented as a 32-bit value. The following table shows the encoding for the power state.

__Table 120\. Power State Encoding__
| Bit       | Name     | Description                                                                                                                                                                                  |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \[31:17\] | RESERVED | _Reserved_ and must be 0.                                                                                                                                                                    |
| \[16\]    | CONTEXT  | 0b1: Context is lost. 0b0: Context is preserved.                                                                                                                                             |
| \[15:0\]  | VALUE    | Value Description 0x0000 On. 0x0001 _Reserved_ and must be 0. 0x0002 _Reserved_ and must be 0. 0x0003 Off. 0x0004 - 0x0FFF _Reserved_ and must be 0. 0x1000 - 0xFFFF Vendor specific states. |

#### [](#device-power-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-dpwr%5Fenable%5Fnotification-service%5Fid-0x01)Service: DPWR\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `DEVICE_POWER`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#device-power-notifications).

__Table 121\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 122\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-dpwr%5Fget%5Fnum%5Fdomains-service%5Fid-0x02)Service: DPWR\_GET\_NUM\_DOMAINS (SERVICE\_ID: 0x02)

This service is used to query the number of device power domains available which can be controlled by the client. The number of domains returned may be less than the actual number of domains present on the platform.

__Table 123\. Request Data__
| NA |
| -- |

__Table 124\. Response Data__
| Word | Name         | Type   | Description                                                                                                                                             |
| ---- | ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS       | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | NUM\_DOMAINS | uint32 | Number of device power domains.                                                                                                                         |

#### [](#service-dpwr%5Fget%5Fattributes-service%5Fid-0x03)Service: DPWR\_GET\_ATTRIBUTES (SERVICE\_ID: 0x03)

This service is used to query the attributes of a device power domain.

__Table 125\. Request Data__
| Word | Name       | Type   | Description             |
| ---- | ---------- | ------ | ----------------------- |
| 0    | DOMAIN\_ID | uint32 | Device power domain ID. |

__Table 126\. Response Data__
| Word | Name                | Type        | Description                                                                                                                                                                                              |
| ---- | ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS              | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS               | uint32      | _Reserved_ and must be 0.                                                                                                                                                                                |
| 2    | TRANSITION\_LATENCY | uint32      | Worst case transition latency of domain from one power state to another, in microseconds (us).                                                                                                           |
| 3:6  | DOMAIN\_NAME        | uint8\[16\] | Device power domain name, a NULL-terminated ASCII string up to 16-bytes.                                                                                                                                 |

#### [](#service-dpwr%5Fset%5Fstate-service%5Fid-0x04)Service: DPWR\_SET\_STATE (SERVICE\_ID: 0x04)

This service is used to change the power state of a device power domain.

__Table 127\. Request Data__
| Word | Name         | Type   | Description                                                                                                                                                                                                                                                                                                                        |
| ---- | ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | DOMAIN\_ID   | uint32 | Device power domain ID.                                                                                                                                                                                                                                                                                                            |
| 1    | POWER\_STATE | uint32 | This field indicates the power state to which the power domain should transition. The specific power states and their meanings may vary depending on the implementation, but generally, they include values such as "ON", "OFF" and vendor specific power state. Refer [Power State Format](#section-power-state)for more details. |

__Table 128\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                                |
| ---- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID or POWER\_STATE is invalid. RPMI\_ERR\_DENIED Denied due to no permission. RPMI\_ERR\_HW\_FAULT Failed due to hardware error. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-dpwr%5Fget%5Fstate-service%5Fid-0x05)Service: DPWR\_GET\_STATE (SERVICE\_ID: 0x05)

This service is used to get the current power state of a device power domain.

__Table 129\. Request Data__
| Word | Name       | Type   | Description             |
| ---- | ---------- | ------ | ----------------------- |
| 0    | DOMAIN\_ID | uint32 | Device power domain ID. |

__Table 130\. Response Data__
| Word | Name         | Type   | Description                                                                                                                                                                                                                                          |
| ---- | ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS       | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                             |
| 1    | POWER\_STATE | uint32 | This field indicates the current power state of the specified domain. The power state can be one of several predefined values, such as ON, OFF, or vendor specific implementation. Refer [Power State Format](#section-power-state)for more details. |

### [](#service-group-performance-servicegroup%5Fid-0x000a)Service Group - PERFORMANCE (SERVICEGROUP\_ID: 0x000A)

This PERFORMANCE service group is used to manage the performance of a group of devices or application processors that operate in the same performance domain. Unlike traditional performance control mechanisms, where the OS is responsible for directly controlling voltages and clocks, this mechanism instead operates on an metric less integer performance scale. Each integer value on this scale represents a performance operating point. What this scale represents and the metric is entirely platform-dependent. Values on this scale are represented with `performance level index`, and the platform has complete control over mapping these performance operating points to performance states, which are eventually converted into hardware parameters such as voltage and frequency. The level index does not need to be contiguous or to be on a linear scale. For example, the mapping between levels index and frequencies can be as straightforward as using a multiplication factor of `1000` or ascending index number starting from `0`.

The CPPC service group is designed for performance control, but it is only intended for application processors. This service group is primarily meant for devices such as GPUs and accelerators, though it can also be used for application processors.

It is important to distinguish between performance domains and power domains. A performance domain refers to a set of devices that must always operate at the same performance level, whereas a power domain refers to a set of devices that can be turned on or off together for power management purposes.

The following table lists the services in the PERFORMANCE service group:

__Table 131\. PERFORMANCE Services__
| Service ID | Service Name                         | Request Type    |
| ---------- | ------------------------------------ | --------------- |
| 0x01       | PERF\_ENABLE\_NOTIFICATION           | NORMAL\_REQUEST |
| 0x02       | PERF\_GET\_NUM\_DOMAINS              | NORMAL\_REQUEST |
| 0x03       | PERF\_GET\_ATTRIBUTES                | NORMAL\_REQUEST |
| 0x04       | PERF\_GET\_SUPPORTED\_LEVELS         | NORMAL\_REQUEST |
| 0x05       | PERF\_GET\_LEVEL                     | NORMAL\_REQUEST |
| 0x06       | PERF\_SET\_LEVEL                     | NORMAL\_REQUEST |
| 0x07       | PERF\_GET\_LIMIT                     | NORMAL\_REQUEST |
| 0x08       | PERF\_SET\_LIMIT                     | NORMAL\_REQUEST |
| 0x09       | PERF\_GET\_FAST\_CHANNEL\_REGION     | NORMAL\_REQUEST |
| 0x0A       | PERF\_GET\_FAST\_CHANNEL\_ATTRIBUTES | NORMAL\_REQUEST |

#### [](#section-perf-level-attribute)Performance Level Attribute

The following table shows the structure of a single performance level and its' attribute.

__Table 132\. Performance Level Attributes Structure__
| Word | Name                | Description              |
| ---- | ------------------- | ------------------------ |
| 0    | INDEX               | Performance Level Index  |
| 1    | CLOCK\_FREQ         | Clock frequency (kHz).   |
| 2    | POWER\_COST         | Power cost (uW).         |
| 3    | TRANSITION\_LATENCY | Transition latency (us). |

#### [](#performance-fast-channel)Performance Fast-channel

This section provides an overview of the properties associated with the fast-channel for PERFORMANCE service group.

**Supported Services**

The fast-channel currently supports only the following PERFORMANCE services:

* PERF\_GET\_LEVEL
* PERF\_SET\_LEVEL
* PERF\_GET\_LIMIT
* PERF\_SET\_LIMIT

**Platform Dependency**

* Not all performance domains or performance services are required to support fast-channel functionality.
* Support for fast-channel depends on the platform implementation.

**Performance Fast-channel Shared Memory Region**

* In the memory region designated by the platform for fast-channels, it is essential that the Performance fast-channels are organized in a continuous memory block.
* The shared memory region designated for fast-channels across performance service group must be a `power-of-two` in size. The base address and size (in bytes) of this shared memory region can be obtained through the service`PERF_GET_FAST_CHANNEL_REGION`. The base address of the shared memory region must be aligned to 8 bytes.

**Discovering Fast-channel**

* Fast-channels support are discoverable through PERFORMANCE service calls.
* To determine if a platform supports fast-channel for a specific performance domain, use the `PERF_GET_ATTRIBUTES` service call.
* If fast-channel support is available, retrieve fast-channel attributes for specific PERFORMANCE service call using the `PERF_GET_FAST_CHANNEL_ATTRIBUTES`service call.
* The `PERF_GET_FAST_CHANNEL_REGION` provides physical memory for Performance Service Group. The offset of the physical address retrieve in`PERF_GET_FAST_CHANNEL_ATTRIBUTES` of the 'Performance Domain / Service ID' paired is based on the starting address in`PERF_GET_FAST_CHANNEL_REGION` service.

**Doorbell Support**

* The doorbell, if supported must be a memory mapped register with write access.
* The doorbell details such as doorbell register address and write value can be discovered by the application processor through the`PERF_GET_FAST_CHANNEL_ATTRIBUTES` service.
* The doorbell register address is the physical address of the register. The doorbell write value is the value which must be written in the doorbell register to trigger the doorbell interrupt. The width of the doorbell write value must be equal to the doorbell register width.  
NOTE: The write value may also contains other set bits which must persist on every write to the doorbell register.
* Doorbell support is not available for `PERF_GET_LEVEL` and `PERF_GET_LIMIT`service calls.
* When fast-channels are implemented for `PERF_GET_LEVEL` and `PERF_GET_LIMIT`service calls, the last known valid performance level or performance limits are always accessible via the fast-channel without requiring a doorbell trigger.
* For other PERFORMANCE service calls that support fast-channel, doorbell support is optional.

**Payload Requirements**

* The payload of a fast-channel should exclusively include message specific parameters and exclude the `DOMAIN_ID`. Since a fast-channel is specific to both `DOMAIN_ID` and `SERVICE_ID`, there is no need to include `DOMAIN_ID`or any other channel specific and message specific headers when using a fast-channel. For instance, the payload of the `PERF_SET_LIMIT` message should consist of a 32-bit `MAX_PERF_LEVEL` and a 32-bit `MIN_PERF_LEVEL`.

#### [](#performance-notifications)Notifications

When a client registers for performance change notifications, the platform will send notification to the client whenever there is a change in the performance level, performance limit or the performance power of a specific performance domain. This notification is typically sent by the platform microcontroller to inform clients in the system about changes in the performance domain.

__Table 133\. Performance Notification Events__
| Event ID | Name                | Event Data                                                                                                                                                                        | Description                             |
| -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 0x01     | PERF\_POWER\_CHANGE | Word Type Description 0 uint32 Performance domain ID for which the power has changed. 1 uint32 New power value (uW).                                                              | Performance power changed notification. |
| 0x02     | PERF\_LIMIT\_CHANGE | Word Type Description 0 uint32 Performance domain ID for which the performance limit has changed. 1 uint32 New maximum performance level. 2 uint32 New minimum performance level. | Performance limit changed notification. |
| 0x03     | PERF\_LEVEL\_CHANGE | Word Type Description 0 uint32 Performance domain ID for which the performance level has changed. 1 uint32 New performance level.                                                 | Performance level changed notification. |

#### [](#service-perf%5Fenable%5Fnotification-service%5Fid-0x01)Service: PERF\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `PERFORMANCE`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#performance-notifications).

__Table 134\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 135\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-perf%5Fget%5Fnum%5Fdomains-service%5Fid-0x02)Service: PERF\_GET\_NUM\_DOMAINS (SERVICE\_ID: 0x02)

This service returns the number of performance domains supported by the system. The number of performance domains may vary depending on the hardware platform and its implementation. In general, performance domains are used to group related hardware components, such as CPUs, GPUs, memory, and peripherals, into separate domains that can be independently controlled and managed. This allows for more fine-grained control over the performance of specific components, which can be important for optimizing system performance and power consumption.

__Table 136\. Request Data__
| NA |
| -- |

__Table 137\. Response Data__
| Word | Name         | Type   | Description                                                                                                                                             |
| ---- | ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS       | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | NUM\_DOMAINS | uint32 | Number of performance domains.                                                                                                                          |

#### [](#service-perf%5Fget%5Fattributes-service%5Fid-0x03)Service: PERF\_GET\_ATTRIBUTES (SERVICE\_ID: 0x03)

This service is used to retrieve the attributes of a specific performance domain. These attributes provide information about the performance capabilities and constraints of the domain, such as the performance limit and performance level.

__Table 138\. Request Data__
| Word | Name       | Type   | Description            |
| ---- | ---------- | ------ | ---------------------- |
| 0    | DOMAIN\_ID | uint32 | Performance domain ID. |

__Table 139\. Response Data__
| Word | Name                | Type        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS              | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1    | FLAGS               | uint32      | Bits Description \[31:3\] _Reserved_ and must be 0. \[2\] Performance limit change support. This attribute indicates whether the platform allows software to set the performance limit for a specific performance domain. 0b0: Performance limit change is not allowed. 0b1: Performance limit change is allowed. \[1\] Performance level change support. This attribute indicates whether the platform allows software to set the performance level for a specific performance domain. 0b0: Performance level change is not allowed. 0b1: Performance level change is allowed. \[0\] Fast-channel support. This attribute indicates whether the platform supports fast-channel for a specific performance domain. 0b0: Fast-channel is not supported. 0b1: Fast-channel is supported. |
| 2    | NUM\_LEVELS         | uint32      | The total number of supported performance levels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3    | TRANSITION\_LATENCY | uint32      | Minimum amount of time that needs to pass between two consecutive requests, in microseconds (us).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4:7  | DOMAIN\_NAME        | uint8\[16\] | Performance domain name, a NULL-terminated ASCII string up to 16-bytes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

#### [](#service-perf%5Fget%5Fsupported%5Flevels-service%5Fid-0x04)Service: PERF\_GET\_SUPPORTED\_LEVELS (SERVICE\_ID: 0x04)

This service provides a list of the available performance levels or also called operating performance points (OPPs) for a specific performance domain. These represent different performance levels that can be set for the components in the domain, and are defined by a combination of frequency, power cost and other parameters. By using this information, the OS can select the optimal performance level based on the system’s workload and power constraints using`performance level index` returned in this service.

```c
/* Pseudocode to retrieve the list of the supported performance levels. */

index = 0;
num = 0;
/* Allocate a buffer based on the value returned from the NUM_LEVELS */
total_num_levels = perf_domain_attributes.num_levels;

loop:
	list = get_domain_opp_list(index, domain_id);
	entry_num = 0;

	for (i = 0; i < list.returned; i++, num++) {
		opp[num].index = list.entry[entry_num++];
		opp[num].freq = list.entry[entry_num++];
		opp[num].power = list.entry[entry_num++];
		opp[num].transition_latency = list.entry[entry_num++];
	}

	/* Check if there are remaining OPP to be read */
	if (list.remaining) {
		index += list.returned;
		goto loop;
	}
```

The pseudocode above demonstrates the process for retrieving the level information for a specific performance domain. First, the number of performance levels is determined by checking the `NUM_LEVELS` parameter returned by the `PERF_GET_ATTRIBUTES` service.

The total number of performance levels included in one message must not exceed the available word count in the message’s `DATA` field. If the performance levels exceed this limit, the platform microcontroller will return the number of levels that can be accommodated in one message and set the `REMAINING` field accordingly. When the `REMAINING` field is not zero, the application processor must call this service again with the appropriate `PERF_LEVEL_INDEX` to retrieve the remaining levels. Multiple service calls may be required to obtain all the levels.

__Table 140\. Request Data__
| Word | Name               | Type   | Description                                                      |
| ---- | ------------------ | ------ | ---------------------------------------------------------------- |
| 0    | DOMAIN\_ID         | uint32 | Performance domain ID.                                           |
| 1    | PERF\_LEVEL\_INDEX | uint32 | Index of performance data array. The first index starts at zero. |

__Table 141\. Response Data__
| Word | Name      | Type        | Description                                                                                                                                                                                                                    |
| ---- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS    | int32       | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID or PERF\_LEVEL\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS     | uint32      | _Reserved_ and must be 0.                                                                                                                                                                                                      |
| 2    | REMAINING | uint32      | Remaining number of levels (number of arrays).                                                                                                                                                                                 |
| 3    | RETURNED  | uint32      | Number of levels returned (number of arrays).                                                                                                                                                                                  |
| 4    | LEVEL\[\] | uint32\[4\] | List of performance levels attributes.Refer to [\[section-perf-attribute\]](#section-perf-attribute) for the complete structure of performance level attributes.                                                               |

#### [](#service-perf%5Fget%5Flevel-service%5Fid-0x05)Service: PERF\_GET\_LEVEL (SERVICE\_ID: 0x05)

This service is used to obtain the current performance level index of a specific performance domain in the system.

__Table 142\. Request Data__
| Word | Name       | Type   | Description            |
| ---- | ---------- | ------ | ---------------------- |
| 0    | DOMAIN\_ID | uint32 | Performance domain ID. |

__Table 143\. Response Data__
| Word | Name   | Type   | Description                                                                                                                                                                                              |
| ---- | ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | LEVEL  | uint32 | Current performance level index of the domain.                                                                                                                                                           |

#### [](#service-perf%5Fset%5Flevel-service%5Fid-0x06)Service: PERF\_SET\_LEVEL (SERVICE\_ID: 0x06)

This service is used to set the current performance level index of a specific performance domain in the system.

__Table 144\. Request Data__
| Word | Name       | Type   | Description              |
| ---- | ---------- | ------ | ------------------------ |
| 0    | DOMAIN\_ID | uint32 | Performance domain ID.   |
| 1    | LEVEL      | uint32 | Performance level index. |

__Table 145\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                                   |
| ---- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID or LEVEL is invalid. RPMI\_ERR\_DENIED Denied due to no permission. RPMI\_ERR\_HW\_FAULT Operation failed due to hardware error. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-perf%5Fget%5Flimit-service%5Fid-0x07)Service: PERF\_GET\_LIMIT (SERVICE\_ID: 0x07)

This service is used to obtain the current performance limit of a specific performance domain in the system.

__Table 146\. Request Data__
| Word | Name       | Type   | Description            |
| ---- | ---------- | ------ | ---------------------- |
| 0    | DOMAIN\_ID | uint32 | Performance domain ID. |

__Table 147\. Response Data__
| Word | Name             | Type   | Description                                                                                                                                                                                              |
| ---- | ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS           | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | MAX\_PERF\_LEVEL | uint32 | Maximum allowed performance level index.                                                                                                                                                                 |
| 2    | MIN\_PERF\_LEVEL | uint32 | Minimum allowed performance level index.                                                                                                                                                                 |

#### [](#service-perf%5Fset%5Flimit-service%5Fid-0x08)Service: PERF\_SET\_LIMIT (SERVICE\_ID: 0x08)

This service is used to set the performance limit of a specific performance domain in the system. The platform must ensure that any subsequent calls to `PERF_SET_LEVEL` to adjust the performance level remain within the currently defined limits.

If the current performance level falls outside the newly defined minimum or maximum ranges, the platform will automatically adjust it to comply with the updated limits.

| |  Examples: If the current performance level is below the new minimum limit, the platform will set it to the new minimum limit. If the current performance level exceeds the new maximum limit, the platform will set it to the new maximum limit. No adjustment is required if the current performance level is within the new limits. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

If notifications are enabled, the platform will send an appropriate notification (e.g., `PERF_LEVEL_CHANGE`, `PERF_POWER_CHANGE`, etc.) to the application processor.

__Table 148\. Request Data__
| Word | Name             | Type   | Description                              |
| ---- | ---------------- | ------ | ---------------------------------------- |
| 0    | DOMAIN\_ID       | uint32 | Performance domain ID.                   |
| 1    | MAX\_PERF\_LEVEL | uint32 | Maximum allowed performance level index. |
| 2    | MIN\_PERF\_LEVEL | uint32 | Minimum allowed performance level index. |

__Table 149\. Response Data__
| Word | Name   | Type  | Description                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS | int32 | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID or performance level is invalid. RPMI\_ERR\_NOT\_SUPPORTED Performance limit change is not allowed. RPMI\_ERR\_DENIED Denied due to no permission. RPMI\_ERR\_HW\_FAULT Operation failed due to hardware error. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |

#### [](#service-perf%5Fget%5Ffast%5Fchannel%5Fregion-service%5Fid-0x09)Service: PERF\_GET\_FAST\_CHANNEL\_REGION (SERVICE\_ID: 0x09)

This service retrieves the physical address of the fast-channel region used in the performance service group. The fast-channel region is grouped in a continuous block of memory to ease the configuration of memory region protection.

__Table 150\. Request Data__
| NA |
| -- |

__Table 151\. Response Data__
| Word | Name                     | Type   | Description                                                                                                                                                                                                      |
| ---- | ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS                   | int32  | Return error code Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_NOT\_SUPPORTED Fast-channel is not implemented. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes) |
| 1    | REGION\_PHYS\_ADDR\_LOW  | uint32 | Lower 32-bit of the fast-channels shared memory region physical address.                                                                                                                                         |
| 2    | REGION\_PHYS\_ADDR\_HIGH | uint32 | Upper 32-bit of the fast-channels shared memory region physical address.                                                                                                                                         |
| 3    | REGION\_SIZE\_LOW        | uint32 | Lower 32-bit of the fast-channels shared memory region size.                                                                                                                                                     |
| 4    | REGION\_SIZE\_HIGH       | uint32 | Upper 32-bit of the fast-channels shared memory region size.                                                                                                                                                     |

#### [](#service-perf%5Fget%5Ffast%5Fchannel%5Fattributes-service%5Fid-0x0a)Service: PERF\_GET\_FAST\_CHANNEL\_ATTRIBUTES (SERVICE\_ID: 0x0A)

This service allows clients to query attributes of the fast-channel for a specific performance domain and performance service.

__Table 152\. Request Data__
| Word | Name        | Type   | Description                                                                        |
| ---- | ----------- | ------ | ---------------------------------------------------------------------------------- |
| 0    | DOMAIN\_ID  | uint32 | Performance domain ID.                                                             |
| 1    | SERVICE\_ID | uint32 | Performance Service ID. Refer service ID in [Table 131](#table%5Fperf%5Fservices). |

__Table 153\. Response Data__
| Word | Name                   | Type   | Description                                                                                                                                                                                                                                                                          |
| ---- | ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS                 | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM DOMAIN\_ID is invalid. RPMI\_ERR\_NOT\_SUPPORTED Fast-channel is not implemented. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes).                  |
| 1    | FLAGS                  | uint32 | Bits Description \[31:3\] _Reserved_ and must be 0. \[2:1\] Doorbell register width. This field is unused if doorbell is not supported. 0b00: 8-bit. 0b01: 16-bit. 0b10: 32-bit. 0b11: Reserved. \[0\] Doorbell support. 0b0: Doorbell is not supported. 0b1: Doorbell is supported. |
| 2    | FASTCHAN\_OFFSET\_LOW  | uint32 | Lower 32-bit offset of fast-channel physical address region.                                                                                                                                                                                                                         |
| 3    | FASTCHAN\_OFFSET\_HIGH | uint32 | Upper 32-bit offset of fast-channel physical address region.                                                                                                                                                                                                                         |
| 4    | FASTCHAN\_SIZE         | uint32 | The size of fast-channel physical address in bytes.                                                                                                                                                                                                                                  |
| 5    | DB\_ADDR\_LOW          | uint32 | Lower 32-bit of doorbell register address for Performance Request fast-channel. This field is unused if the doorbell is not supported.                                                                                                                                               |
| 6    | DB\_ADDR\_HIGH         | uint32 | Upper 32-bit of doorbell register address for Performance Request fast-channel. This field is unused if the doorbell is not supported.                                                                                                                                               |
| 7    | DB\_WRITE\_VALUE       | uint32 | 32-bit doorbell write value for Performance Request fast-channel.If the doorbell register width is less than 32-bit, the lower bits in this field equal to the doorbell register width must be used as write value.                                                                  |

### [](#service-group-management%5Fmode-servicegroup%5Fid-0x000b)Service Group - MANAGEMENT\_MODE (SERVICEGROUP\_ID: 0x000B)

This MANAGEMENT\_MODE service group provides RPMI client a mechanism to invoke the Management Mode (MM) in a secure execution environment. For general background on Management Mode, refer to the Platform Initialization (PI) specifications \[[4](bibliography.html#bib-pi)\], Volume 4: Management Mode Core Interface.

The Management Mode (MM) provides an environment for implementing OS agnostic MM services such as secure variable storage, and firmware updates in the platform firmware. The MANAGEMENT\_MODE service group defines RPMI services for invoking an MM service synchronously where the `MM_COMMUNICATE` RPMI service is used as a synchronous call from the non-secure world to the secure world and the data exchanged with the MM service is passed via special Management Mode (MM) shared memory.

The following table lists the services in the MANAGEMENT\_MODE service group:

__Table 154\. MANAGEMENT\_MODE Services__
| Service ID | Service Name             | Request Type    |
| ---------- | ------------------------ | --------------- |
| 0x01       | MM\_ENABLE\_NOTIFICATION | NORMAL\_REQUEST |
| 0x02       | MM\_GET\_ATTRIBUTES      | NORMAL\_REQUEST |
| 0x03       | MM\_COMMUNICATE          | NORMAL\_REQUEST |

#### [](#management-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-mm%5Fenable%5Fnotification-service%5Fid-0x01)Service: MM\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `MANAGEMENT_MODE`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#management-notifications).

__Table 155\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 156\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-mm%5Fget%5Fattributes-service%5Fid-0x02)Service: MM\_GET\_ATTRIBUTES (SERVICE\_ID: 0x02)

This RPMI service gets the attributes about Management Mode, including MM version, MM shared memory location, etc.

__Table 157\. Request Data__
| NA |
| -- |

__Table 158\. Response Data__
| Word | Name                  | Type   | Description                                                                                                                                             |
| ---- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS                | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | MM\_VERSION           | uint32 | Management Mode version. Bits Description \[31:16\] Major version. \[15:0\] Minor version.                                                              |
| 2    | MM\_SHMEM\_ADDR\_LOW  | uint32 | Lower 32-bit of the MM shared memory physical address.                                                                                                  |
| 3    | MM\_SHMEM\_ADDR\_HIGH | uint32 | Upper 32-bit of the MM shared memory physical address.                                                                                                  |
| 4    | MM\_SHMEM\_SIZE       | uint32 | The size of MM shared memory in bytes.                                                                                                                  |

#### [](#service-mm%5Fcommunicate-service%5Fid-0x03)Service: MM\_COMMUNICATE (SERVICE\_ID: 0x03)

The `MM_COMMUNICATE` service invokes an MM service implemented in the secure execution environment. The input data needed to identify and invoke the MM service is referred to as `MM_COMM_INPUT_DATA` whereas the output data returned by the MM service is referred to as `MM_COMM_OUTPUT_DATA`. The RPMI client in the non-secure execution environment provides the location of `MM_COMM_INPUT_DATA`and `MM_COMM_OUTPUT_DATA` in the MM shared memory as parameters of `MM_COMMUNICATE`service.

__Table 159\. Request Data__
| Word | Name                           | Type   | Description                                                                                         |
| ---- | ------------------------------ | ------ | --------------------------------------------------------------------------------------------------- |
| 0    | MM\_COMM\_INPUT\_DATA\_OFFSET  | uint32 | The offset in the MM shared memory where the input data is passed to the MM service.                |
| 1    | MM\_COMM\_INPUT\_DATA\_SIZE    | uint32 | The size of the input data in the MM shared memory.                                                 |
| 2    | MM\_COMM\_OUTPUT\_DATA\_OFFSET | uint32 | The offset in the MM shared memory where the output data will be written by the MM service.         |
| 3    | MM\_COMM\_OUTPUT\_DATA\_SIZE   | uint32 | The maximum size of the output data which can be written by the MM service in the MM shared memory. |

__Table 160\. Response Data__
| Word | Name                         | Type   | Description                                                                                                                                                                                                                                                                                      |
| ---- | ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | STATUS                       | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_ADDR Input data end (or Output data end) is outside MM shared memory. RPMI\_ERR\_DENIED Denied due to no permission. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | MM\_COMM\_RETURN\_DATA\_SIZE | uint32 | Actual size of the output data written by the MM service in the MM shared memory.                                                                                                                                                                                                                |

### [](#service-group-ras%5Fagent-servicegroup%5Fid-0x000c)Service Group - RAS\_AGENT (SERVICEGROUP\_ID: 0x000C)

The RAS\_AGENT service group provides services to enumerate various error sources in a system and to retrieve their descriptors.

Each error source in a system is assigned a unique 32-bit identification number, referred to as `RAS_ERR_SRC_ID`.

The following table lists the services in the RAS\_AGENT service group:

__Table 161\. RAS Agent Services__
| Service ID | Service Name                  | Request Type    |
| ---------- | ----------------------------- | --------------- |
| 0x01       | RAS\_ENABLE\_NOTIFICATION     | NORMAL\_REQUEST |
| 0x02       | RAS\_GET\_NUM\_ERR\_SRCS      | NORMAL\_REQUEST |
| 0x03       | RAS\_GET\_ERR\_SRCS\_ID\_LIST | NORMAL\_REQUEST |
| 0x04       | RAS\_GET\_ERR\_SRC\_DESC      | NORMAL\_REQUEST |

#### [](#error-source-descriptor-format)Error Source Descriptor Format

##### [](#acpi-systems)ACPI Systems

For systems that support ACPI/APEI, the format of the error source descriptor is as defined in ACPI specification v6.4 or above, (GHESv2) \[[3](bibliography.html#bib-acpi)\]. If the value of `RAS_GET_ERR_SRC_DESC.FLAGS[3:0]` is `0`, it indicates that the error source descriptor format is GHESv2.

The RAS agent populates the error source descriptor fields according to the error source specified by `RAS_ERR_SRC_ID`.

| |  The error source descriptor has an error\_status\_structure field which is a generic address structure (GAS) as defined in ACPI v6.4 (GHESv2) \[[3](bibliography.html#bib-acpi)\]. This field specifies the location of a register that contains the physical address of a block of memory that holds the error status data for the specified error source. This block of memory is referred to aserror\_status\_block. The allocation of error\_status\_block is platform dependent and is done by the RAS agent. The physical address oferror\_status\_block is stored in the error\_status\_structure field of the error source descriptor being returned. |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

##### [](#non-acpi-systems)Non-ACPI Systems

RAS is not standardized for non-ACPI systems. Such systems may define custom format for an error source descriptor. The type of custom error source descriptor format can be read from `RAS_GET_ERR_SRC_DESC.FLAGS[3:0]`.

#### [](#ras-notifications)Notifications

This service group does not support any events for notification.

#### [](#service-ras%5Fenable%5Fnotification-service%5Fid-0x01)Service: RAS\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `RAS_AGENT`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#ras-notifications).

__Table 162\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 163\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-ras%5Fget%5Fnum%5Ferr%5Fsrcs-service%5Fid-0x02)Service: RAS\_GET\_NUM\_ERR\_SRCS (SERVICE\_ID: 0x02)

This service queries number of error sources available in the system.

__Table 164\. Request Data__
| NA |
| -- |

__Table 165\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                   |
| ---- | -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully and number of error sources returned asNUM\_ERR\_SRCS. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | NUM\_ERR\_SRCS | uint32 | Number of error sources.                                                                                                                                                                                      |

#### [](#service-ras%5Fget%5Ferr%5Fsrcs%5Fid%5Flist-service%5Fid-0x03)Service: RAS\_GET\_ERR\_SRCS\_ID\_LIST (SERVICE\_ID: 0x03)

This service returns a list of `RAS_ERR_SRC_ID` for all error sources present in the system. The `RAS_ERR_SRC_ID` can be used to get the associated descriptor of the error source.

__Table 166\. Request Data__
| Word | Name         | Type   | Description                                                                                                                      |
| ---- | ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 0    | START\_INDEX | uint32 | Starting index of RAS\_ERR\_SRC\_ID list. 0 for the first call, subsequent calls will use the next index of the remaining items. |

__Table 167\. Response Data__
| Word | Name                   | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS                 | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully and list of error sources returned. RPMI\_ERR\_INVALID\_PARAM START\_INDEX is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS                  | uint32 | _Reserved_ and must be 0.                                                                                                                                                                                                                     |
| 2    | REMAINING              | uint32 | Remaining number of error source IDs.                                                                                                                                                                                                         |
| 3    | RETURNED               | uint32 | Number of error source IDs returned in this request.                                                                                                                                                                                          |
| 4    | RAS\_ERR\_SRC\_ID\[N\] | uint32 | An array of error source IDs where each entry in the array is a unique error source ID. N is equal to RETURNED number of error source IDs in this request.                                                                                    |

#### [](#service-ras%5Fget%5Ferr%5Fsrc%5Fdesc-service%5Fid-0x04)Service: RAS\_GET\_ERR\_SRC\_DESC (SERVICE\_ID: 0x04)

This service retrieves the error source descriptor of an error source specified by `RAS_ERR_SRC_ID`.

| Word | Name              | Type   | Description                                                                                                                 |
| ---- | ----------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| 0    | RAS\_ERR\_SRC\_ID | uint32 | Error source ID for which attributes are to be returned.                                                                    |
| 1    | BYTE\_OFFSET      | uint32 | Offset from which the descriptor is to be read. Offset 0 for the first call, subsequent byte offset of the remaining bytes. |

__Table 168\. Response Data__
| Word | Name                | Type   | Description                                                                                                                                                                                                                                                                           |
| ---- | ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS              | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully and partial/complete error source descriptor returned. RPMI\_ERR\_INVALID\_PARAM RAS\_ERR\_SRC\_ID or BYTE\_OFFSET is invalid. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | FLAGS               | uint32 | Bits Description \[31:4\] _Reserved_ and must be 0. \[3:0\] Format of the error source descriptor. 0b0000: GHESv2 format. 0b0001 - 0b1110: Reserved. 0b1111: Implementation specific.                                                                                                 |
| 2    | REMAINING           | uint32 | Remaining number of bytes to be read.                                                                                                                                                                                                                                                 |
| 3    | RETURNED            | uint32 | Number of bytes read in this request.                                                                                                                                                                                                                                                 |
| 4    | ERR\_SRC\_DESC\[N\] | uint8  | Full or partial descriptor N is equal to the RETURNED bytes in this request.                                                                                                                                                                                                          |

### [](#service-group-request%5Fforward-servicegroup%5Fid-0x000d)Service Group - REQUEST\_FORWARD (SERVICEGROUP\_ID: 0x000D)

The REQUEST\_FORWARD service group allows application processors to retrieve and process RPMI request messages which are forwarded by platform microcontroller from some other RPMI client. This service group also allows an SBI implementation to forward RPMI request messages from one system-level partition (or domain) to another using the SBI MPXY extension \[[1](bibliography.html#bib-sbi)\].

The platform microcontroller (or SBI implementation) should maintain a first-in first-out queue of forwarded RPMI request messages. The first (or oldest) forwarded RPMI request message in the queue is referred to as the current forwarded RPMI request message. The RPMI services defined by the REQUEST\_FORWARD service group allow application processors to retrieve and process one forwarded RPMI request message at a time.

The [Table 169](#table%5Freqfwd%5Fservices) below lists the services defined by the REQUEST\_FORWARD service group:

__Table 169\. Request Forward Services__
| Service ID | Service Name                       | Request Type    |
| ---------- | ---------------------------------- | --------------- |
| 0x01       | REQFWD\_ENABLE\_NOTIFICATION       | NORMAL\_REQUEST |
| 0x02       | REQFWD\_RETRIEVE\_CURRENT\_MESSAGE | NORMAL\_REQUEST |
| 0x03       | REQFWD\_COMPLETE\_CURRENT\_MESSAGE | NORMAL\_REQUEST |

#### [](#reqfwd-notifications)Notifications

The [Table 170](#table%5Freqfwd%5Fnotification%5Fevents) below lists the notification events defined by the REQUEST\_FORWARD service group.

__Table 170\. Request Forward Notification Events__
| Event ID | Name                 | Event Data                                                                                                                                                                                                                                                                              | Description                                                                                                                                                               |
| -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0x01     | REQFWD\_NEW\_MESSAGE | An array of N bytes representing the first N bytes of the current forwarded RPMI request message. The value N is specified by the EVENT\_DATALEN field of the RPMI notification event as shown in [\[table\_notification\_message\_format\]](#table%5Fnotification%5Fmessage%5Fformat). | This RPMI notification event represents the arrival of a new forwarded RPMI request message when there were no other pending forwarded RPMI request message in the queue. |

#### [](#service-reqfwd%5Fenable%5Fnotification-service%5Fid-0x01)Service: REQFWD\_ENABLE\_NOTIFICATION (SERVICE\_ID: 0x01)

This service allows the application processor to subscribe to `REQUEST_FORWARD`service group notifications. The platform may optionally support notifications for events that may occur. The platform microcontroller can send these notification messages to the application processor if they are implemented and the application processor has subscribed to them. The supported events are described in [Notifications](#reqfwd-notifications).

__Table 171\. Request Data__
| Word | Name       | Type   | Description                                                                                                                                                                                                                                   |
| ---- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | EVENT\_ID  | uint32 | The event to be subscribed for notification.                                                                                                                                                                                                  |
| 1    | REQ\_STATE | uint32 | Requested event notification state.Change or query the current state of EVENT\_ID notification. 0: Disable. 1: Enable. 2: Return current state. Any other values of REQ\_STATE field other than the defined ones are reserved for future use. |

__Table 172\. Response Data__
| Word | Name           | Type   | Description                                                                                                                                                                                                                                                                                        |
| ---- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS         | int32  | Return error code. Error Code Description RPMI\_SUCCESS Event is subscribed successfully. RPMI\_ERR\_INVALID\_PARAM EVENT\_ID or REQ\_STATE is invalid. RPMI\_ERR\_NOT\_SUPPORTED Notification for the EVENT\_ID is not supported. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | CURRENT\_STATE | uint32 | Current EVENT\_ID notification state. 0: Notification is disabled. 1: Notification is enabled. In case of REQ\_STATE = 0 or 1, the CURRENT\_STATE will return the requested state.In case of an error, the value of CURRENT\_STATE is unspecified.                                                 |

#### [](#service-reqfwd%5Fretrieve%5Fcurrent%5Fmessage-service%5Fid-0x02)Service: REQFWD\_RETRIEVE\_CURRENT\_MESSAGE (SERVICE\_ID: 0x02)

This service allows application processors to retrieve the current forwarded RPMI request message. The current message may be the oldest forwarded RPMI request message in the platform microcontroller (or SBI implementation) queue.

__Table 173\. Request Data__
| Word | Name         | Type   | Description                                                                                                                                                           |
| ---- | ------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | START\_INDEX | uint32 | Starting index of first byte of the current forwarded RPMI request message. Use0 for the first call, subsequent calls will use the next index of the remaining bytes. |

__Table 174\. Response Data__
| Word | Name                  | Type   | Description                                                                                                                                                                                                                                                                 |
| ---- | --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS                | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_INVALID\_PARAM START\_INDEX is invalid. RPMI\_ERR\_NO\_DATA No forwarded RPMI request message available. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | REMAINING             | uint32 | Remaining number of bytes in the current forwarded RPMI request message.                                                                                                                                                                                                    |
| 2    | RETURNED              | uint32 | Number of bytes N of the current forwarded RPMI request message returned in this request.                                                                                                                                                                                   |
| 3    | REQUEST\_MESSAGE\[N\] | uint8  | An array of N bytes representing a part of the current forwarded RPMI request message at byte offset specified by START\_INDEX.                                                                                                                                             |

#### [](#service-reqfwd%5Fcomplete%5Fcurrent%5Fmessage-service%5Fid-0x03)Service: REQFWD\_COMPLETE\_CURRENT\_MESSAGE (SERVICE\_ID: 0x03)

This service allows the application processors to inform the platform microcontroller (or SBI implementation) that:

* The processing of the current forwarded RPMI request message has completed and RPMI response message must be sent to the original source of RPMI request message.
* The current forwarded RPMI request message must now point to the next forwarded RPMI request message if available.

If the service is called without retrieving the message, an error is returned. The service also returns `NUM_MESSAGES`, which is the number of forwarded messages available for retrieval from the platform microcontroller, excluding the current forwarded message.

__Table 175\. Request Data__
| Word | Name                | Type  | Description                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | RESPONSE\_DATA\[N\] | uint8 | An array of bytes representing the RPMI message data to be send as response data for the current forwarded RPMI request message. The Nrepresents the total number of bytes in the response data which can be inferred by the platform microcontroller (or SBI implementation) from the overall size of the REQFWD\_COMPLETE\_CURRENT\_MESSAGE service message. |

__Table 176\. Response Data__
| Word | Name          | Type   | Description                                                                                                                                                                                                         |
| ---- | ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | STATUS        | int32  | Return error code. Error Code Description RPMI\_SUCCESS Service completed successfully. RPMI\_ERR\_NO\_DATA No forwarded request message retrieved. Other errors [\[table\_error\_codes\]](#table%5Ferror%5Fcodes). |
| 1    | NUM\_MESSAGES | uint32 | Number of forwarded messages available for retrieval, excluding the current forwarded message.                                                                                                                      |

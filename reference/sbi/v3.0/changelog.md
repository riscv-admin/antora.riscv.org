# Change Log

## [](#change-log)Change Log

### [](#version-3-0)Version 3.0

* Update the document state to Ratified

### [](#version-3-0-rc8)Version 3.0-rc8

* Clarifications around legacy extension and SSE events

### [](#version-3-0-rc7)Version 3.0-rc7

* Update the document state to Frozen.

### [](#version-3-0-rc6)Version 3.0-rc6

* Clarification for SSE errors.
* Formatting changes.
* Update the preamble.

### [](#version-3-0-rc5)Version 3.0-rc5

* Update doc-resourses
* Clarifications/minor semantic fixes in mpxy/sse.

### [](#version-3-0-rc4)Version 3.0-rc4

* Added landing pad and double trap related bits to the SSE extension.
* Several clarifications in SSE and MPXY extensions.
* Added a new function to retrieve the shared memory size in MPXY extension.

### [](#version-3-0-rc3)Version 3.0-rc3

* Added low priority RAS events in SSE.
* Miscallenous clarification around reserved bits, fwft, notification events.
* Added a dedicated error code for fwft set denial due to lock status.

### [](#version-3-0-rc1rc2)Version 3.0-rc1/rc2

* Added SBI PMU event info function and new raw event type
* Added SBI MPXY extension
* Added error code SBI\_ERR\_TIMEOUT
* Added error code SBI\_ERR\_IO
* Added sse mask/unmask function and pointer masking bit in fwft
* Clarify SBI IPI and RFENCE error codes
* Clarify the description of the `set_timer` function
* Added SBI DBTR extension
* Added SBI FWFT extension
* Added SBI SSE extension
* Added error code SBI\_ERR\_BAD\_RANGE
* Added error code SBI\_ERR\_INVALID\_STATE

### [](#version-2-0)Version 2.0

* Clarification around SBI PMU set memory function
* Base extension function name typo fix
* Upate the document state to Ratified

### [](#version-2-0-rc8)Version 2.0-rc8

* Clarfications STA extension and counter index in the pmu snapshot.

### [](#version-2-0-rc7)Version 2.0-rc7

* Few clarfications around system suspend and pmu snapshot.

### [](#version-2-0-rc6)Version 2.0-rc6

* Few clarifications around rfence extensions
* Marks public review period complete.

### [](#version-2-0-rc5)Version 2.0-rc5

* Update the document state to Frozen

### [](#version-2-0-rc4)Version 2.0-rc4

* Added flags parameter to sbi\_pmu\_snapshot\_set\_shmem()
* Return error code SBI\_ERR\_NO\_SHMEM in SBI PMU extension wherever applicable
* Made flags parameter of sbi\_steal\_time\_set\_shmem() as unsigned long
* Split the specification into multiple adoc files
* Add more clarification for firmware/vendor/experimental extension space.
* Fix ambiguous usage of normative statements.

### [](#version-2-0-rc3)Version 2.0-rc3

* CI support added
* Fix revmark in the makefile.
* Few minor cleanups.

### [](#version-2-0-rc2)Version 2.0-rc2

* Added clarification for SUSP, NACL & STA extensions.
* Standardization of hart usage.
* Added an error code in SBI DBCN extension.

### [](#version-2-0-rc1)Version 2.0-rc1

* Added common description for shared memory physical address range parameter
* Added SBI debug console extension
* Relaxed the counter width requirement on SBI PMU firmware counters
* Added sbi\_pmu\_counter\_fw\_read\_hi() in SBI PMU extension
* Reserved space for SBI implementation specific firmware events
* Added SBI system suspend extension
* Added SBI CPPC extension
* Clarified that an SBI extension can be partially implemented only if it defines a mechanism to discover implemented SBI functions
* Added error code SBI\_ERR\_NO\_SHMEM
* Added SBI nested acceleration extension
* Added common description for a virtual hart
* Added SBI steal-time accounting extension
* Added SBI PMU snapshot extension

### [](#version-1-0-0)Version 1.0.0

* Updated the version for ratification

### [](#version-1-0-rc3)Version 1.0-rc3

* Updated the calling convention
* Fixed a typo in PMU extension
* Added a abbreviation table

### [](#version-1-0-rc2)Version 1.0-rc2

* Update to RISC-V formatting
* Improved the introduction
* Removed all references to RV32

### [](#version-1-0-rc1)Version 1.0-rc1

* A typo fix

### [](#version-0-3-0)Version 0.3.0

* Few typo fixes
* Updated the LICENSE with detailed text instead of a hyperlink

### [](#version-0-3-rc1)Version 0.3-rc1

* Improved document styling and naming conventions
* Added SBI system reset extension
* Improved SBI introduction section
* Improved documentation of SBI hart state management extension
* Added suspend function to SBI hart state management extension
* Added performance monitoring unit extension
* Clarified that an SBI extension shall not be partially implemented

### [](#version-0-2)Version 0.2

* The entire v0.1 SBI has been moved to the legacy extension, which is now an optional extension. This is technically a backwards-incompatible change because the legacy extension is optional and v0.1 of the SBI doesn’t allow probing, but it’s as good as we can do.

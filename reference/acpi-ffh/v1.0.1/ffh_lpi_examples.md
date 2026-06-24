# _LPI Object Examples

## [](#%5Flpi-object-examples)\_LPI Object Examples

```C
Device (C000) {              // HART0
    Name (_HID, “ACPI0007”)
    Name (_LPI,
        Package () {
            0,               // Revision
            0,               // LevelID
            3,               // Count

            // LPI1
            Package () {
                1,           // Min Residency (us)
                1,           // Worst case wakeup latency (us)
                1,           // Flags
                0,           // Arch. Context Lost Flags
                100,         // Residency Counter Frequency
                0,           // Enabled Parent State
                ResourceTemplate () {
                             // Entry Method
                    Register(FFixedHW, 64, 0,
                             0x0000_0000_0000_0000,
                             QWord)
                },
                ResourceTemplate () {
                             // Residency Counter Register
                    Register(SystemMemory, 0, 0, 0, 0)  // NULL
                },
                ResourceTemplate () {
                             // Usage Counter Register
                    Register(SystemMemory, 0, 0, 0, 0)  // NULL
                },
                             // State Name
                “RISC-V WFI”
            },

            // LPI2
            Package () {
                10,          // Min Residency (us)
                10,          // Worst case wakeup latency (us)
                1,           // Flags
                0,           // Arch. Context Lost Flags
                100,         // Residency Counter Frequency
                1,           // Enabled Parent State
                ResourceTemplate () {
                             // Entry Method
                    Register(FFixedHW, 64, 0,
                             0x1000_0000_0000_0000,
                             QWord)
                },
                ResourceTemplate () {
                             // Residency Counter Register
                    Register(SystemMemory, 0, 0, 0, 0)  // NULL
                },
                ResourceTemplate () {
                             // Usage Counter Register
                    Register(SystemMemory, 0, 0, 0, 0)  // NULL
                },
                             // State Name
                “RISC-V RET_DEFAULT”
            },

            // LPI3
            Package () {
                3500,        // Min Residency (us)
                100,         // Worst case wakeup latency (us)
                1,           // Flags
                0,           // Arch. Context Lost Flags
                100,         // Residency Counter Frequency
                1,           // Enabled Parent State
                ResourceTemplate () {
                             // Entry Method
                    Register(FFixedHW, 64, 0,
                             0x1000_0000_8000_0000,
                             QWord)
                },
                ResourceTemplate () {
                             // Residency Counter Register
                    Register(SystemMemory, 0, 0, 0, 0)  // NULL
                },
                ResourceTemplate () {
                             // Usage Counter Register
                    Register(SystemMemory, 0, 0, 0, 0)  // NULL
                },
                             // State Name
                “RISC-V NONRET_DEFAULT”
            }
        }
    )
}
```

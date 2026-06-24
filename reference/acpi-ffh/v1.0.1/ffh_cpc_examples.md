# _CPC Object Examples

## [](#%5Fcpc-object-examples)\_CPC Object Examples

```C
Device (C000) {              // HART0
    Name (_HID, “ACPI0007”)
    Name (_CPC,
        Package () {
            23,              // NumEntries
            3,               // Revision
            120,             // Highest Performance
            100,             // Nominal Performance
            40,              // Lowest Nonlinear Performance
            20,              // Lowest Performance
            ResourceTemplate () {
                             // Guaranteed Performance Register
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // Desired Performance Register
                Register(FFixedHW, 64, 0,
                         0x1000_0000_0000_0005,
                         QWord)
            },
            ResourceTemplate () {
                             // Minimum Performance Register
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // Maximum Performance Register
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // Performance Reduction Tolerance Register
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // Time Window Register
                Register(FFixedHW, 64, 0,
                         0x1000_0000_0000_0009,
                         QWord)
            },
            ResourceTemplate () {
                             // Counter Wraparound Time
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // Reference Performance Counter Register
                Register(FFixedHW, 64, 0,
                         0x2000_0000_0000_0C01,
                         QWord)
            },
            ResourceTemplate () {
                             // Delivered Performance Counter Register
                Register(FFixedHW, 64, 0,
                         0x1000_0000_0000_000C,
                         QWord)
            },
            ResourceTemplate () {
                             // Performance Limited Register
                Register(FFixedHW, 64, 0,
                         0x1000_0000_0000_000D,
                         QWord)
            },
            ResourceTemplate () {
                             // CPPC EnableRegister
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // Autonomous Selection Enable
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // AutonomousActivityWindowRegister
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            ResourceTemplate () {
                             // EnergyPerformancePreferenceRegister
                Register(SystemMemory, 0, 0, 0, 0)  // NULL
            },
            1,               // Reference Performance
            20,              // Lowest Frequency
            100,             // Nominal Frequency
        }
    )
}
```

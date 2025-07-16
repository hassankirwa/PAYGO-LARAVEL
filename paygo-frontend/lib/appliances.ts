export type Appliance = {
  id: number
  unitId: string
  type: string // e.g., "Fridge", "Freezer"
  model: string // e.g., "KOYO BC-90DC"
  clientId: number // Link to client
  clientName: string // For easier display
  location: string
  status: "active" | "offline" | "maintenance"
  batteryVoltage: string
  temperature: string
  lastPing: string // Date/time of last data ping
}

export const appliances: Appliance[] = [
  {
    id: 1,
    unitId: "UNIT-001",
    type: "Fridge",
    model: "KOYO BC-90DC",
    clientId: 1,
    clientName: "John Doe",
    location: "Nairobi",
    status: "active",
    batteryVoltage: "12.8V",
    temperature: "3°C",
    lastPing: "2024-01-27 10:30 AM",
  },
  {
    id: 2,
    unitId: "UNIT-002",
    type: "Fridge",
    model: "KOYO BC-50DC",
    clientId: 2,
    clientName: "Jane Smith",
    location: "Mombasa",
    status: "offline",
    batteryVoltage: "11.0V",
    temperature: "10°C",
    lastPing: "2024-01-26 05:00 PM",
  },
  {
    id: 3,
    unitId: "UNIT-003",
    type: "Freezer",
    model: "KOYO BC-118DC",
    clientId: 3,
    clientName: "Mike Johnson",
    location: "Kisumu",
    status: "maintenance",
    batteryVoltage: "12.7V",
    temperature: "-18°C",
    lastPing: "2024-01-25 09:00 AM",
  },
  {
    id: 4,
    unitId: "UNIT-004",
    type: "Fridge",
    model: "KOYO LC-218DC",
    clientId: 4,
    clientName: "Sarah Wilson",
    location: "Nyeri",
    status: "active",
    batteryVoltage: "12.7V",
    temperature: "5°C",
    lastPing: "2024-01-27 11:00 AM",
  },
  {
    id: 5,
    unitId: "UNIT-005",
    type: "Freezer",
    model: "KOYO BC-268DC",
    clientId: 5,
    clientName: "David Lee",
    location: "Nairobi",
    status: "active",
    batteryVoltage: "12.6V",
    temperature: "-20°C",
    lastPing: "2024-01-27 09:45 AM",
  },
  {
    id: 6,
    unitId: "UNIT-006",
    type: "Freezer",
    model: "KOYO BC-308DC",
    clientId: 6,
    clientName: "Emily Chen",
    location: "Eldoret",
    status: "offline",
    batteryVoltage: "11.2V",
    temperature: "-5°C",
    lastPing: "2024-01-26 03:15 PM",
  },
  {
    id: 7,
    unitId: "UNIT-007",
    type: "Fridge",
    model: "KOYO BC-90DC",
    clientId: 1,
    clientName: "John Doe",
    location: "Nairobi",
    status: "active",
    batteryVoltage: "12.9V",
    temperature: "2°C",
    lastPing: "2024-01-27 10:40 AM",
  },
  {
    id: 8,
    unitId: "UNIT-008",
    type: "Freezer",
    model: "KOYO BC-358DC",
    clientId: 5,
    clientName: "David Lee",
    location: "Thika",
    status: "active",
    batteryVoltage: "12.5V",
    temperature: "-21°C",
    lastPing: "2024-01-27 10:00 AM",
  },
]

export function getApplianceById(id: number): Appliance | undefined {
  return appliances.find((appliance) => appliance.id === id)
}

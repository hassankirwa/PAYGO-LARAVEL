export type Client = {
  id: number
  name: string
  email: string
  phone: string
  applianceModel: string // Changed from 'appliance' to 'applianceModel' to link to Product
  status: "active" | "suspended"
  paymentStatus: "current" | "overdue"
  nextPayment: string
  totalPaid: number
  remaining: number
  requestDate: string // New field
  paymentPlan: "weekly" | "monthly" // Added
  weeklyInstallment?: number // Added
  monthlyInstallment?: number // Added
}

export const clients: Client[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "+254 700 123 456",
    applianceModel: "KOYO BC-90DC",
    status: "active",
    paymentStatus: "current",
    nextPayment: "2024-01-28",
    totalPaid: 645,
    remaining: 645,
    requestDate: "2023-12-20",
    paymentPlan: "weekly",
    weeklyInstallment: 25,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+254 701 234 567",
    applianceModel: "KOYO BC-50DC",
    status: "active",
    paymentStatus: "overdue",
    nextPayment: "2024-01-25",
    totalPaid: 320,
    remaining: 485,
    requestDate: "2023-11-15",
    paymentPlan: "monthly",
    monthlyInstallment: 100,
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+254 702 345 678",
    applianceModel: "KOYO BC-118DC",
    status: "suspended",
    paymentStatus: "overdue",
    nextPayment: "2024-01-20",
    totalPaid: 485,
    remaining: 485,
    requestDate: "2023-10-01",
    paymentPlan: "weekly",
    weeklyInstallment: 18,
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah@example.com",
    phone: "+254 703 456 789",
    applianceModel: "KOYO LC-218DC",
    status: "active",
    paymentStatus: "current",
    nextPayment: "2024-01-30",
    totalPaid: 1200,
    remaining: 360,
    requestDate: "2024-01-05",
    paymentPlan: "monthly",
    monthlyInstallment: 150,
  },
  {
    id: 5,
    name: "David Lee",
    email: "david@example.com",
    phone: "+254 704 567 890",
    applianceModel: "KOYO BC-268DC",
    status: "active",
    paymentStatus: "current",
    nextPayment: "2024-02-01",
    totalPaid: 800,
    remaining: 440,
    requestDate: "2023-09-22",
    paymentPlan: "weekly",
    weeklyInstallment: 24,
  },
  {
    id: 6,
    name: "Emily Chen",
    email: "emily@example.com",
    phone: "+254 705 678 901",
    applianceModel: "KOYO BC-308DC",
    status: "suspended",
    paymentStatus: "overdue",
    nextPayment: "2024-01-18",
    totalPaid: 1000,
    remaining: 545,
    requestDate: "2023-08-10",
    paymentPlan: "monthly",
    monthlyInstallment: 200,
  },
]

export function getClientById(id: number): Client | undefined {
  return clients.find((client) => client.id === id)
}

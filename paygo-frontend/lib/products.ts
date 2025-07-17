export type Product = {
  id: number
  name: string
  image: string
  descriptionText: string
  longDescription: string
  capacity?: string
  powerConsumption?: string
  color?: string
  defrostType?: string
  cashWarranty: string
  paygoWarranty: string
  priceUSD: number
  weeklyInstallment: number
  features: string[]
  images: string[]
  // New fields for dashboard display
  temperature?: string
  batteryVoltage?: string
  location?: string
}

export const products: Product[] = [
  {
    id: 1,
    name: "KOYO BC- 50DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "A compact and efficient single-door fridge with a dedicated freezer chamber, perfect for small spaces or as a secondary refrigeration unit. Designed for reliable performance with low power consumption.",
    longDescription:
      "The KOYO BC-50DC FRIDGE is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 50-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-50DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "50 litres",
    powerConsumption: "45W",
    color: "Grey",
    defrostType: "Manual",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 805,
    weeklyInstallment: 15,
    features: ["Single Door", "Freezer Chamber", "Compact Design", "Energy Efficient", "Solar Powered", "Dual Power"],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+50L+Fridge+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+50L+Fridge+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+50L+Fridge+3",
    ],
    temperature: "4°C",
    batteryVoltage: "12.5V",
    location: "Nairobi, Kenya",
  },
  {
    id: 2,
    name: "KOYO BC- 90DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "This 90-litre single-door fridge offers ample storage for essentials, featuring a convenient freezer compartment. It's an ideal choice for individuals or small families seeking a balance of capacity and efficiency.",
    longDescription:
      "The KOYO BC-90DC FRIDGE is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 90-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-90DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "90 litres",
    powerConsumption: "65W",
    color: "Grey",
    defrostType: "Manual",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1290,
    weeklyInstallment: 25,
    features: ["Single Door", "Freezer Chamber", "Medium Capacity", "Reliable Cooling", "Solar Powered", "Dual Power"],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+90L+Fridge+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+90L+Fridge+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+90L+Fridge+3",
    ],
    temperature: "3°C",
    batteryVoltage: "12.8V",
    location: "Mombasa, Kenya",
  },
  {
    id: 3,
    name: "KOYO BC- 118DC FRIDGE, SINGLE TOP DOOR WITH FREEZER CHAMBER",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "Experience superior cooling with the KOYO BC-118DC, a single-top-door fridge that includes a spacious freezer chamber. Its design maximizes storage while maintaining energy efficiency, suitable for various home settings.",
    longDescription:
      "The KOYO BC-118DC FRIDGE is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 118-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-118DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "118 litres",
    powerConsumption: "85W",
    color: "White",
    defrostType: "Manual",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 970,
    weeklyInstallment: 18,
    features: [
      "Single Top Door",
      "Freezer Chamber",
      "Optimized Storage",
      "White Finish",
      "Solar Powered",
      "Dual Power",
    ],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+118L+Fridge+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+118L+Fridge+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+118L+Fridge+3",
    ],
    temperature: "-18°C",
    batteryVoltage: "12.7V",
    location: "Kisumu, Kenya",
  },
  {
    id: 4,
    name: "KOYO BC- 268DC FREEZER DOUBLE DOOR",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "The KOYO BC-268DC is a robust double-door freezer, providing extensive storage for all your frozen goods. Its efficient design ensures consistent freezing, making it perfect for larger households or commercial use.",
    longDescription:
      "The KOYO BC-268DC FREEZER is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 268-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-268DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "268 litres",
    powerConsumption: "81W",
    color: "White",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1240,
    weeklyInstallment: 24,
    features: ["Double Door", "Large Capacity", "Deep Freezing", "White Finish", "Solar Powered", "Dual Power"],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+268L+Freezer+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+268L+Freezer+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+268L+Freezer+3",
    ],
    temperature: "-20°C",
    batteryVoltage: "12.6V",
    location: "Nakuru, Kenya",
  },
  {
    id: 5,
    name: "KOYO BC- 308DC FREEZER DOUBLE DOOR",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "With a generous 308-litre capacity, this double-door freezer is built to handle substantial freezing needs. It combines powerful performance with a user-friendly design, ensuring your food stays perfectly preserved.",
    longDescription:
      "The KOYO BC-308DC FREEZER is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 308-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-308DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "308 litres",
    powerConsumption: "95W",
    color: "White",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1545,
    weeklyInstallment: 30,
    features: [
      "Double Door",
      "Extra Large Capacity",
      "Efficient Freezing",
      "Reliable Performance",
      "Solar Powered",
      "Dual Power",
    ],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+308L+Freezer+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+308L+Freezer+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+308L+Freezer+3",
    ],
    temperature: "-22°C",
    batteryVoltage: "12.9V",
    location: "Eldoret, Kenya",
  },
  {
    id: 6,
    name: "KOYO BC- 358DC FREEZER DOUBLE DOOR",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "Maximize your frozen storage with the KOYO BC-358DC, a high-capacity double-door freezer. Engineered for durability and consistent temperature, it's an essential appliance for bulk storage.",
    longDescription:
      "The KOYO BC-358DC FREEZER is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 358-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-358DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "358 litres",
    powerConsumption: "100W",
    color: "White",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1580,
    weeklyInstallment: 30,
    features: [
      "Double Door",
      "Massive Storage",
      "Durable Build",
      "Consistent Temperature",
      "Solar Powered",
      "Dual Power",
    ],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+358L+Freezer+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+358L+Freezer+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+358L+Freezer+3",
    ],
    temperature: "-21°C",
    batteryVoltage: "12.4V",
    location: "Thika, Kenya",
  },
  {
    id: 7,
    name: "KOYO BC- 508DC FREEZER DOUBLE DOOR",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "The ultimate solution for extensive frozen storage, the KOYO BC-508DC is a colossal double-door freezer. It offers unparalleled space and freezing power, ideal for large families or commercial environments.",
    longDescription:
      "The KOYO BC-508DC FREEZER is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 508-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO BC-508DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "508 litres",
    powerConsumption: "115W",
    color: "White",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1780,
    weeklyInstallment: 34,
    features: [
      "Double Door",
      "Largest Capacity",
      "Industrial Grade",
      "Optimal Preservation",
      "Solar Powered",
      "Dual Power",
    ],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+508L+Freezer+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+508L+Freezer+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+508L+Freezer+3",
    ],
    temperature: "-25°C",
    batteryVoltage: "12.3V",
    location: "Malindi, Kenya",
  },
  {
    id: 8,
    name: "KOYO LC- 218DC FRIDGE, DOUBLE LAYER FLOATING GLASS WITH INNER LIGHTS AND FAN",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "Showcase your items with the KOYO LC-218DC, a stylish fridge featuring double-layer floating glass doors. Inner lights illuminate the contents, while a built-in fan ensures even cooling, perfect for beverages or display.",
    longDescription:
      "The KOYO LC-218DC FRIDGE is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 218-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO LC-218DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "218 litres",
    color: "White",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1560,
    weeklyInstallment: 30,
    features: [
      "Double Layer Floating Glass",
      "Inner Lights",
      "Fan Cooling",
      "Display Fridge",
      "Solar Powered",
      "Dual Power",
    ],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+218L+Glass+Fridge+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+218L+Glass+Fridge+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+218L+Glass+Fridge+3",
    ],
    temperature: "5°C",
    batteryVoltage: "12.7V",
    location: "Nyeri, Kenya",
  },
  {
    id: 9,
    name: "KOYO LC- 268DC FRIDGE, DOUBLE LAYER FLOATING GLASS WITH INNER LIGHTS AND FAN",
    image: "/placeholder.svg?height=400&width=600",
    descriptionText:
      "An elegant and functional fridge, the KOYO LC-268DC boasts double-layer floating glass doors, inner lighting, and a circulation fan. It's designed for both aesthetic appeal and efficient cooling, making it a standout appliance.",
    longDescription:
      "The KOYO LC-268DC FRIDGE is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 268-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night. For added flexibility, it can also be powered by electricity, making it suitable for use in areas with intermittent power supply. This dual capability ensures consistent performance and adaptability to varying energy conditions. Constructed with high-quality materials and advanced cooling technology, the KOYO LC-268DC is built to withstand harsh conditions and provide long-term reliability, ensuring perishable items remain fresh and safe.",
    capacity: "268 litres",
    color: "White",
    cashWarranty: "1 year",
    paygoWarranty: "2 years",
    priceUSD: 1585,
    weeklyInstallment: 30,
    features: [
      "Double Layer Floating Glass",
      "Inner Lights",
      "Fan Cooling",
      "Premium Design",
      "Solar Powered",
      "Dual Power",
    ],
    images: [
      "/placeholder.svg?height=600&width=800&text=KOYO+268L+Glass+Fridge+1",
      "/placeholder.svg?height=600&width=800&text=KOYO+268L+Glass+Fridge+2",
      "/placeholder.svg?height=600&width=800&text=KOYO+268L+Glass+Fridge+3",
    ],
    temperature: "6°C",
    batteryVoltage: "12.6V",
    location: "Meru, Kenya",
  },
]

export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id)
}

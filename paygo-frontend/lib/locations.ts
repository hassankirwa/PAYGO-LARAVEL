export type LocationData = {
  county: string
  activeUnits: number
  subscribers: number
  monthlyRevenue: number
  growth: string
}

export const locations: LocationData[] = [
  {
    county: "Nairobi",
    activeUnits: 85,
    subscribers: 142,
    monthlyRevenue: 680000,
    growth: "+12%",
  },
  {
    county: "Mombasa",
    activeUnits: 60,
    subscribers: 105,
    monthlyRevenue: 520000,
    growth: "+8%",
  },
  {
    county: "Kisumu",
    activeUnits: 45,
    subscribers: 78,
    monthlyRevenue: 350000,
    growth: "+10%",
  },
  {
    county: "Nakuru",
    activeUnits: 70,
    subscribers: 110,
    monthlyRevenue: 580000,
    growth: "+15%",
  },
  {
    county: "Eldoret",
    activeUnits: 55,
    subscribers: 90,
    monthlyRevenue: 450000,
    growth: "+7%",
  },
  {
    county: "Thika",
    activeUnits: 30,
    subscribers: 50,
    monthlyRevenue: 200000,
    growth: "+5%",
  },
  {
    county: "Meru",
    activeUnits: 25,
    subscribers: 40,
    monthlyRevenue: 180000,
    growth: "+9%",
  },
]

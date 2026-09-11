export interface EVCar {
  id: string
  name: string
  brand: string
  batteryKwh: number
  realWorldRangeKm: number
  efficiencyWhPerKm: number
  maxDcChargingKw: number
  chargingTimeMin: number
}

export const EV_DATABASE: EVCar[] = [
  { id: 'tiago-ev', name: 'Tata Tiago EV (24 kWh)', brand: 'Tata', batteryKwh: 24, realWorldRangeKm: 210, efficiencyWhPerKm: 114, maxDcChargingKw: 25, chargingTimeMin: 58 },
  { id: 'punch-ev', name: 'Tata Punch EV (35 kWh)', brand: 'Tata', batteryKwh: 35, realWorldRangeKm: 290, efficiencyWhPerKm: 120, maxDcChargingKw: 50, chargingTimeMin: 40 },
  { id: 'nexon-ev-45', name: 'Tata Nexon EV Long Range (45 kWh)', brand: 'Tata', batteryKwh: 45, realWorldRangeKm: 340, efficiencyWhPerKm: 132, maxDcChargingKw: 60, chargingTimeMin: 40 },
  { id: 'curvv-ev-55', name: 'Tata Curvv EV (55 kWh)', brand: 'Tata', batteryKwh: 55, realWorldRangeKm: 420, efficiencyWhPerKm: 130, maxDcChargingKw: 70, chargingTimeMin: 40 },
  { id: 'sierra-ev', name: 'Tata Sierra EV (75 kWh)', brand: 'Tata', batteryKwh: 75, realWorldRangeKm: 520, efficiencyWhPerKm: 144, maxDcChargingKw: 100, chargingTimeMin: 35 },
  { id: 'mg-comet', name: 'MG Comet EV (17.3 kWh)', brand: 'MG', batteryKwh: 17.3, realWorldRangeKm: 160, efficiencyWhPerKm: 108, maxDcChargingKw: 3.3, chargingTimeMin: 210 },
  { id: 'mg-windsor-ev', name: 'MG Windsor EV (38 kWh)', brand: 'MG', batteryKwh: 38, realWorldRangeKm: 270, efficiencyWhPerKm: 140, maxDcChargingKw: 45, chargingTimeMin: 50 },
  { id: 'mg-zs-ev', name: 'MG ZS EV (50.3 kWh)', brand: 'MG', batteryKwh: 50.3, realWorldRangeKm: 340, efficiencyWhPerKm: 148, maxDcChargingKw: 50, chargingTimeMin: 60 },
  { id: 'xuv400-ev', name: 'Mahindra XUV400 (39.4 kWh)', brand: 'Mahindra', batteryKwh: 39.4, realWorldRangeKm: 280, efficiencyWhPerKm: 140, maxDcChargingKw: 50, chargingTimeMin: 50 },
  { id: 'mahindra-be6', name: 'Mahindra BE 6 (79 kWh)', brand: 'Mahindra', batteryKwh: 79, realWorldRangeKm: 550, efficiencyWhPerKm: 143, maxDcChargingKw: 175, chargingTimeMin: 20 },
  { id: 'mahindra-xev9e', name: 'Mahindra XEV 9e (79 kWh)', brand: 'Mahindra', batteryKwh: 79, realWorldRangeKm: 530, efficiencyWhPerKm: 149, maxDcChargingKw: 175, chargingTimeMin: 20 },
  { id: 'maruti-evitara', name: 'Maruti Suzuki e Vitara (61 kWh)', brand: 'Maruti', batteryKwh: 61, realWorldRangeKm: 420, efficiencyWhPerKm: 145, maxDcChargingKw: 150, chargingTimeMin: 30 },
  { id: 'creta-ev', name: 'Hyundai Creta EV (51.4 kWh)', brand: 'Hyundai', batteryKwh: 51.4, realWorldRangeKm: 380, efficiencyWhPerKm: 135, maxDcChargingKw: 100, chargingTimeMin: 36 },
  { id: 'hyundai-ioniq5', name: 'Hyundai Ioniq 5 (72.6 kWh)', brand: 'Hyundai', batteryKwh: 72.6, realWorldRangeKm: 430, efficiencyWhPerKm: 168, maxDcChargingKw: 150, chargingTimeMin: 18 },
  { id: 'byd-atto3', name: 'BYD Atto 3 (60.48 kWh)', brand: 'BYD', batteryKwh: 60.48, realWorldRangeKm: 380, efficiencyWhPerKm: 159, maxDcChargingKw: 80, chargingTimeMin: 45 },
  { id: 'byd-seal', name: 'BYD Seal Premium (82.5 kWh)', brand: 'BYD', batteryKwh: 82.5, realWorldRangeKm: 520, efficiencyWhPerKm: 158, maxDcChargingKw: 150, chargingTimeMin: 37 },
  { id: 'kia-ev6', name: 'Kia EV6 GT-Line (84 kWh)', brand: 'Kia', batteryKwh: 84, realWorldRangeKm: 500, efficiencyWhPerKm: 168, maxDcChargingKw: 350, chargingTimeMin: 18 }
]

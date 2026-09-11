export interface Vehicle {
  id: string
  make: string
  model: string
  batteryCapacityKWh: number
  efficiencyKWhPer100Km: number
  maxChargingPowerKW: number
}

export interface RouteInput {
  distanceKm: number
  initialBatteryPercent: number
  vehicle: Vehicle
}

export interface RouteOutput {
  maxRangeKm: number
  totalEnergyNeededKWh: number
  needsCharging: boolean
  deficitKWh: number
  chargeDurationMins: number
}

export function calculateEVRoute(input: RouteInput): RouteOutput {
  const { distanceKm, initialBatteryPercent, vehicle } = input
  const availableEnergyKWh = (vehicle.batteryCapacityKWh * initialBatteryPercent) / 100
  const totalEnergyNeededKWh = (distanceKm * vehicle.efficiencyKWhPer100Km) / 100
  const maxRangeKm = (availableEnergyKWh / vehicle.efficiencyKWhPer100Km) * 100

  const deficitKWh = Math.max(0, totalEnergyNeededKWh - availableEnergyKWh)
  const needsCharging = deficitKWh > 0
  const chargeDurationMins = needsCharging
    ? Math.ceil((deficitKWh / vehicle.maxChargingPowerKW) * 60)
    : 0

  return {
    maxRangeKm: Math.round(maxRangeKm),
    totalEnergyNeededKWh: Math.round(totalEnergyNeededKWh * 10) / 10,
    needsCharging,
    deficitKWh: Math.round(deficitKWh * 10) / 10,
    chargeDurationMins,
  }
}

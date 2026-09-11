'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const EV_MODELS = [
  { name: 'Tata Nexon EV LR', battery: 45, range: 340, maxDc: 60 },
  { name: 'Tata Punch EV LR', battery: 35, range: 270, maxDc: 50 },
  { name: 'MG ZS EV', battery: 50.3, range: 350, maxDc: 75 },
  { name: 'Mahindra XUV400 EL Pro', battery: 39.4, range: 280, maxDc: 50 },
  { name: 'BYD Atto 3', battery: 60.48, range: 420, maxDc: 80 },
  { name: 'Hyundai IONIQ 5', battery: 72.6, range: 480, maxDc: 150 }
]

export default function Home() {
  const [startQuery, setStartQuery] = useState('')
  const [endQuery, setEndQuery] = useState('')
  const [startSuggestions, setStartSuggestions] = useState([])
  const [endSuggestions, setEndSuggestions] = useState([])
  
  const [startCoords, setStartCoords] = useState<any>(null)
  const [endCoords, setEndCoords] = useState<any>(null)
  const [startName, setStartName] = useState('')
  const [endName, setEndName] = useState('')

  const [chargers, setChargers] = useState([])
  const [routePolyline, setRoutePolyline] = useState<any[]>([])
  const [distance, setDistance] = useState<number | null>(null)
  
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [loadingAi, setLoadingAi] = useState(false)
  const [inputQuery, setInputQuery] = useState('')

  const [selectedEv, setSelectedEv] = useState(EV_MODELS[0])

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Auto scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loadingAi])

  // Instant location search - Departure
  const handleStartQueryChange = (val: string) => {
    setStartQuery(val)
    if (val.trim().length >= 2 && val !== startName) {
      fetch(`/api/geocode?q=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(data => setStartSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setStartSuggestions([]))
    } else {
      setStartSuggestions([])
    }
  }

  // Instant location search - Destination
  const handleEndQueryChange = (val: string) => {
    setEndQuery(val)
    if (val.trim().length >= 2 && val !== endName) {
      fetch(`/api/geocode?q=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(data => setEndSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setEndSuggestions([]))
    } else {
      setEndSuggestions([])
    }
  }

  const selectLocation = (item: any, isStart: boolean) => {
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
    const name = item.display_name.split(',')[0]
    
    if (isStart) {
      setStartCoords(coords)
      setStartName(name)
      setStartQuery(item.display_name)
      setStartSuggestions([])
    } else {
      setEndCoords(coords)
      setEndName(name)
      setEndQuery(item.display_name)
      setEndSuggestions([])
    }
  }

  // Fetch OSRM Polyline & Chargers
  useEffect(() => {
    if (startCoords && endCoords) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`)
        .then(r => r.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((pt: number[]) => [pt[1], pt[0]])
            setRoutePolyline(coords)
            setDistance(Math.round(data.routes[0].distance / 1000))
          }
        })
        .catch(() => setRoutePolyline([]))

      fetch(`/api/chargers?startLat=${startCoords.lat}&startLng=${startCoords.lng}&endLat=${endCoords.lat}&endLng=${endCoords.lng}`)
        .then(r => r.json())
        .then(data => setChargers(Array.isArray(data) ? data : []))
        .catch(() => setChargers([]))
    }
  }, [startCoords, endCoords])

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || inputQuery
    if (!messageContent.trim() || !distance || loadingAi) return

    const updatedHistory = [...chatMessages, { role: 'user' as const, content: messageContent }]
    setChatMessages(updatedHistory)
    setInputQuery('')
    setLoadingAi(true)

    try {
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startName,
          endName,
          carName: selectedEv.name,
          batteryKwh: selectedEv.battery,
          rangeKm: selectedEv.range,
          distanceKm: distance,
          stationsCount: chargers.length,
          messagesHistory: updatedHistory
        })
      })
      const data = await res.json()
      setChatMessages([...updatedHistory, { role: 'assistant', content: data.advice || 'No response generated.' }])
    } catch (e) {
      setChatMessages([...updatedHistory, { role: 'assistant', content: 'AI Engine Error occurred.' }])
    } finally {
      setLoadingAi(false)
    }
  }

  const startInitialAnalysis = () => {
    if (chatMessages.length === 0) {
      handleSendMessage("Analyze direct feasibility, charging stop planning, and energy efficiency tips.")
    }
  }

  return (
    <main className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* LEFT CONTROL PANEL */}
      <div className="w-[440px] h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-3 flex-shrink-0 overflow-hidden z-10 shadow-2xl">
        <h1 className="text-lg font-black tracking-wider text-emerald-400 flex items-center gap-2">
          ⚡ IGNITION EV ROUTE ENGINE
        </h1>

        {/* LOCATION INPUTS */}
        <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="relative">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Departure (Point A)</label>
            <input
              type="text"
              placeholder="Search departure city or address..."
              value={startQuery}
              onChange={(e) => handleStartQueryChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            {startSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-52 overflow-y-auto z-50">
                {startSuggestions.map((item: any, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(item, true)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 border-b border-slate-800/60 block leading-tight"
                  >
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Destination (Point B)</label>
            <input
              type="text"
              placeholder="Search destination city or address..."
              value={endQuery}
              onChange={(e) => handleEndQueryChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            {endSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-52 overflow-y-auto z-50">
                {endSuggestions.map((item: any, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(item, false)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 border-b border-slate-800/60 block leading-tight"
                  >
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {distance !== null && (
            <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Distance:</span>
              <span className="text-emerald-400 font-bold">{distance} km</span>
            </div>
          )}
        </div>

        {/* EV SPECS DROPDOWN */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Select EV Vehicle</label>
            <select
              value={selectedEv.name}
              onChange={(e) => {
                const car = EV_MODELS.find(m => m.name === e.target.value)
                if (car) setSelectedEv(car)
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
            >
              {EV_MODELS.map((car, idx) => (
                <option key={idx} value={car.name} className="bg-slate-900 text-slate-100">
                  {car.name} ({car.battery} kWh)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">Battery</span>
              <span className="font-bold text-slate-200">{selectedEv.battery} kWh</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">Est. Range</span>
              <span className="font-bold text-slate-200">{selectedEv.range} km</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">Max Charging</span>
              <span className="font-bold text-slate-200">{selectedEv.maxDc} kW</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">Route Chargers</span>
              <span className="font-bold text-emerald-400">{chargers.length} Found</span>
            </div>
          </div>
        </div>

        {/* AI PANEL WITH STREAMING & COUNTER QUESTIONS */}
        <div className="flex-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              🤖 GROQ AI ROUTE REASONING
            </span>
            {chatMessages.length === 0 && (
              <button
                onClick={startInitialAnalysis}
                disabled={loadingAi || !distance}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-lg transition"
              >
                Analyze Trip
              </button>
            )}
          </div>

          {/* CHAT STREAM */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs leading-relaxed text-slate-200">
            {chatMessages.length === 0 ? (
              <p className="text-slate-500 italic text-center mt-8">
                Select start & destination and click "Analyze Trip" to start AI reasoning.
              </p>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    msg.role === 'user'
                      ? 'bg-slate-800/80 border-slate-700 text-emerald-300 ml-4'
                      : 'bg-slate-900/90 border-slate-800/90 text-slate-200 mr-1 overflow-x-auto'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase mb-1 text-slate-400">
                    {msg.role === 'user' ? '👤 Your Question' : '⚡ AI Analysis'}
                  </p>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => <table className="w-full text-[11px] border-collapse border border-slate-700 my-2" {...props} />,
                      thead: ({node, ...props}) => <thead className="bg-slate-800 text-emerald-400" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-800" {...props} />,
                      tr: ({node, ...props}) => <tr className="hover:bg-slate-800/50" {...props} />,
                      th: ({node, ...props}) => <th className="border border-slate-700 px-2 py-1 text-left font-bold" {...props} />,
                      td: ({node, ...props}) => <td className="border border-slate-700 px-2 py-1 text-slate-300" {...props} />,
                      h3: ({node, ...props}) => <p className="font-bold text-emerald-400 text-xs mt-2 mb-1 uppercase tracking-wide" {...props} />,
                      strong: ({node, ...props}) => <span className="font-semibold text-emerald-300" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                      p: ({node, ...props}) => <p className="mb-1 text-slate-300 leading-normal" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ))
            )}

            {loadingAi && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 italic text-xs animate-pulse">
                Thinking and calculating optimal route strategies...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* QUESTION INPUT AT BOTTOM */}
          <div className="pt-2 mt-2 border-t border-slate-800/80 flex gap-2">
            <input
              type="text"
              placeholder={distance ? "Ask a counter-question..." : "Select route first..."}
              disabled={!distance || loadingAi}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!distance || loadingAi || !inputQuery.trim()}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* MAP VIEW */}
      <div className="flex-1 h-full p-3 bg-slate-950">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <Map startCoords={startCoords} endCoords={endCoords} routePolyline={routePolyline} chargers={chargers} />
        </div>
      </div>
    </main>
  )
}

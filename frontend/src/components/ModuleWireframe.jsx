import React from 'react'
import { Calendar, BellRing, Scan, LineChart, Shield, CheckCircle, Clock } from 'lucide-react'

export default function ModuleWireframe({ activeRole }) {
  const patientModules = [
    {
      title: "Today's Medication Schedule",
      subtitle: "Phase 4 Wireframe",
      icon: Calendar,
      color: "blue",
      items: [
        { name: "Metformin 500mg", time: "08:00 AM", status: "Taken", type: "Diabetes" },
        { name: "Lisinopril 10mg", time: "01:00 PM", status: "Upcoming", type: "Blood Pressure" },
        { name: "Atorvastatin 20mg", time: "09:00 PM", status: "Scheduled", type: "Cholesterol" },
      ],
    },
    {
      title: "Smart Refill Forecasting",
      subtitle: "Phase 6 Wireframe",
      icon: LineChart,
      color: "amber",
      items: [
        { name: "Metformin", stock: "14 tabs", daysLeft: "7 days", alert: "Order soon" },
        { name: "Lisinopril", stock: "40 tabs", daysLeft: "20 days", alert: "Stock safe" },
      ],
    },
    {
      title: "Prescription OCR Scanner",
      subtitle: "Phase 5 Wireframe",
      icon: Scan,
      color: "purple",
      desc: "Upload RX or medicine strip to automatically extract dosage, quantity, and daily frequency.",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight capitalize">
            {activeRole} Dashboard Wireframe
          </h1>
          <p className="text-xs text-slate-500">
            Phase 1 UI Planning: Layouts for Patient, Caregiver, and Admin interactions
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
          <span>Sprint 1 • Target 1 Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {patientModules.map((mod, idx) => {
          const Icon = mod.icon
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {mod.subtitle}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-slate-900 mb-1">{mod.title}</h3>

                {mod.desc && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {mod.desc}
                  </p>
                )}

                {mod.items && (
                  <div className="space-y-2 mt-3">
                    {mod.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{it.name}</p>
                          <p className="text-[10px] text-slate-400">{it.time || it.stock}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          it.status === 'Taken' ? 'bg-emerald-100 text-emerald-800' :
                          it.alert === 'Order soon' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200/70 text-slate-700'
                        }`}>
                          {it.status || it.alert}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Architecture Layer: REST API</span>
                <span className="text-blue-600 font-medium">Ready for Sprint 2</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

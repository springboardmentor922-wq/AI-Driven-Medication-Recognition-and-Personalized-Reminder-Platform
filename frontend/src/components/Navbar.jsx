import React from 'react'
import { Pill, Activity, ShieldCheck, UserCheck } from 'lucide-react'

export default function Navbar({ activeRole, setActiveRole }) {
  const roles = [
    { id: 'patient', label: 'Patient', icon: Activity },
    { id: 'caregiver', label: 'Caregiver', icon: UserCheck },
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
  ]

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl text-slate-900 tracking-tight">PillSync</span>
              <span className="text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Intelligent Medication Tracking & Adherence Platform</p>
          </div>
        </div>

        {/* Role Switcher Wireframe Preview */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          {roles.map((r) => {
            const Icon = r.icon
            const isSelected = activeRole === r.id
            return (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}

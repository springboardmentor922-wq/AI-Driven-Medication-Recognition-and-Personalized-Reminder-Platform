import React, { useState } from 'react'
import Navbar from './components/Navbar'
import HealthStatus from './components/HealthStatus'
import ModuleWireframe from './components/ModuleWireframe'

export default function App() {
  const [activeRole, setActiveRole] = useState('patient')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeRole={activeRole} setActiveRole={setActiveRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Phase 1 Target 1: Healthcheck & Connection banner */}
        <HealthStatus />

        {/* Wireframes: Module Architecture Preview */}
        <ModuleWireframe activeRole={activeRole} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          PillSync © 2026 • AI-Driven Medication Recognition & Personalized Reminder Platform • Sprint 1
        </div>
      </footer>
    </div>
  )
}

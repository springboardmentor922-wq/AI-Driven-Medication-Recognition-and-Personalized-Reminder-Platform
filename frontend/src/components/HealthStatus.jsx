import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Server, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function HealthStatus() {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/v1/health')
      setHealthData(response.data)
    } catch (err) {
      console.error('Failed to connect to backend:', err)
      setError(err.message || 'Cannot reach FastAPI backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">System Connection Status</h2>
            <p className="text-xs text-slate-500">Live heartbeat between React frontend and FastAPI backend</p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ping API</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Backend API Service */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-700">Backend API</span>
          </div>
          {loading ? (
            <span className="text-xs text-slate-400">Checking...</span>
          ) : error ? (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Offline</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Online (FastAPI)</span>
            </span>
          )}
        </div>

        {/* Database Connection */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-700">Database Engine</span>
          </div>
          {loading ? (
            <span className="text-xs text-slate-400">Checking...</span>
          ) : healthData?.database === 'connected' ? (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected ({healthData?.database_type})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Disconnected</span>
            </span>
          )}
        </div>

        {/* API Version */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-xs font-medium text-slate-700">OpenAPI Docs</span>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
          >
            /docs (Swagger UI) &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}

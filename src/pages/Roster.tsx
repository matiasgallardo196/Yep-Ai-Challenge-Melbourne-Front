import { useState, useEffect } from 'react';
import { Play, AlertCircle, CheckCircle, AlertTriangle, Clock, Users, DollarSign, Activity, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Store, RosterGenerationResult, Employee } from '../types';
import * as storeService from '../services/storeService';
import * as rosterService from '../services/rosterService';
import * as employeeService from '../services/employeeService';
import Button from '../components/Button';
import { cn } from '../utils/cn';

export default function Roster() {
  const [stores, setStores] = useState<Store[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [mode, setMode] = useState<'dynamic' | 'fallback'>('dynamic');
  
  // Week navigation state - Start with Dec 9, 2024 (Monday, first week in seeder)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const weekStart = new Date('2024-12-09');
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<RosterGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleViewMode, setScheduleViewMode] = useState<'simple' | 'timeline'>('simple');
  
  // Format date for API call (YYYY-MM-DD)
  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Get week range string for display
  const getWeekRange = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const startStr = weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };
  
  // Navigate weeks forward/backward
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storesData, employeesData] = await Promise.all([
          storeService.getStores(),
          employeeService.getEmployees()
        ]);
        setStores(storesData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setIsLoadingStores(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    
    const weekStartStr = formatDateForApi(currentWeekStart);

    try {
      setIsGenerating(true);
      setError(null);
      setResult(null);
      
      const data = await rosterService.generateRoster(selectedStoreId, weekStartStr, mode);
      setResult(data);
    } catch (err: any) {
      console.error('Failed to generate roster', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate roster');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!result?.roster?.roster?.length) return;
    
    const headers = ['Date', 'Employee ID', 'Employee Name', 'Start Time', 'End Time', 'Station', 'Status'];
    const rows = result.roster.roster.map(shift => [
      shift.start.split('T')[0],
      shift.employeeId,
      shift.employeeName || '',
      shift.start.split('T')[1]?.slice(0, 5) || '',
      shift.end.split('T')[1]?.slice(0, 5) || '',
      shift.station || shift.stationCode || '',
      shift.isWorking ? 'Working' : 'Off'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `roster_${formatDateForApi(currentWeekStart)}_${selectedStoreId.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Roster Generation (MAS)</h1>

      {/* Configuration Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration</h2>
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                required
                disabled={isLoadingStores}
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateWeek('prev')}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center font-medium">
                  {getWeekRange(currentWeekStart)}
                </div>
                <button
                  type="button"
                  onClick={() => navigateWeek('next')}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Week starting Monday {formatDateForApi(currentWeekStart)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Orchestration Mode</label>
            <div className="flex space-x-4">
              <label className={cn(
                "relative flex flex-col items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none flex-1",
                mode === 'dynamic' ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200"
              )}>
                <input
                  type="radio"
                  name="mode"
                  value="dynamic"
                  className="sr-only"
                  checked={mode === 'dynamic'}
                  onChange={() => setMode('dynamic')}
                />
                <span className="font-medium text-gray-900">Dynamic (LLM)</span>
                <span className="text-sm text-gray-500 mt-1">Multi-agent system adapts to constraints using AI.</span>
              </label>

              <label className={cn(
                "relative flex flex-col items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none flex-1",
                mode === 'fallback' ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200"
              )}>
                <input
                  type="radio"
                  name="mode"
                  value="fallback"
                  className="sr-only"
                  checked={mode === 'fallback'}
                  onChange={() => setMode('fallback')}
                />
                <span className="font-medium text-gray-900">Deterministic (Fallback)</span>
                <span className="text-sm text-gray-500 mt-1">Standard algorithmic approach for consistency.</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" isLoading={isGenerating} disabled={!selectedStoreId}>
              <Play className="w-4 h-4 mr-2" />
              Generate Roster
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error generating roster</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SUMMARY DASHBOARD - Status prominente con métricas */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className={cn(
            "rounded-xl p-6 shadow-lg",
            result.status === 'ok' ? "bg-gradient-to-r from-emerald-500 to-green-600" :
            result.status === 'partial' ? "bg-gradient-to-r from-amber-500 to-orange-600" :
            "bg-gradient-to-r from-red-500 to-rose-600"
          )}>
            {/* Status Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {result.status === 'ok' ? (
                  <div className="p-3 bg-white/20 rounded-full">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                ) : result.status === 'partial' ? (
                  <div className="p-3 bg-white/20 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                ) : (
                  <div className="p-3 bg-white/20 rounded-full">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {result.status === 'ok' ? 'Roster Generated Successfully' :
                     result.status === 'partial' ? 'Roster Generated with Issues' :
                     'Requires Human Review'}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    Week of {getWeekRange(currentWeekStart)}
                  </p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                disabled={!result.roster?.roster?.length}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Duration
                </div>
                <div className="text-3xl font-bold text-white">
                  {result.metrics?.totalDurationMs ? `${(result.metrics.totalDurationMs / 1000).toFixed(1)}s` : '-'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Shifts Created
                </div>
                <div className="text-3xl font-bold text-white">
                  {result.roster?.roster?.length || 0}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  Cost Savings
                </div>
                <div className="text-3xl font-bold text-white">
                  {result.metrics?.costSavingsPercent ? `${result.metrics.costSavingsPercent.toFixed(1)}%` : '-'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <Activity className="w-4 h-4" />
                  Gaps Resolved
                </div>
                <div className="text-3xl font-bold text-white">
                  {result.metrics?.coverageGapsResolved ?? '-'}
                </div>
              </div>
            </div>

            {/* Progress Phases */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>MAS Pipeline Progress</span>
                <span>{result.metrics?.lastSuccessfulPhase || 'N/A'}</span>
              </div>
              <div className="flex gap-1">
                {['roster_generation', 'initial_compliance', 'conflict_resolution', 'optimization', 'final_validation'].map((phase, idx) => {
                  const phases = ['roster_generation', 'initial_compliance', 'conflict_resolution', 'optimization', 'final_validation'];
                  const currentIndex = phases.indexOf(result.metrics?.lastSuccessfulPhase || '');
                  const completed = idx <= currentIndex;
                  return (
                    <div 
                      key={phase}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-colors",
                        completed ? "bg-white" : "bg-white/20"
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-white/50">
                <span>Roster</span>
                <span>Compliance</span>
                <span>Conflicts</span>
                <span>Optimize</span>
                <span>Validate</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* COMPLIANCE STATUS - Issues agrupados por severidad */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  🛡️ Compliance Status
                </h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  result.compliance?.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {result.compliance?.passed ? 'All Passed' : 'Issues Found'}
                </span>
              </div>
            </div>
            
            {/* Severity Counters */}
            {(() => {
              const issues = result.compliance?.issues || [];
              const critical = issues.filter(i => i.severity === 'CRITICAL');
              const major = issues.filter(i => i.severity === 'WARNING' || i.severity === 'MAJOR');
              const minor = issues.filter(i => i.severity === 'MINOR' || i.severity === 'INFO');
              
              // Helper to find employee name from employees list
              const getEmployeeName = (employeeId: string | undefined) => {
                if (!employeeId) return null;
                const employee = employees.find(e => e.id === employeeId);
                if (employee) {
                  return `${employee.firstName} ${employee.lastName}`;
                }
                // Fallback: try from roster
                const shift = result.roster?.roster?.find(s => s.employeeId === employeeId);
                return shift?.employeeName || 'Unknown Employee';
              };
              
              return (
                <>
                  {/* Summary Counters */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                    <div className={cn("p-5 text-center", critical.length > 0 ? "bg-red-50" : "")}>
                      <div className={cn("text-4xl font-bold", critical.length > 0 ? "text-red-600" : "text-gray-300")}>
                        {critical.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Critical</div>
                      <div className="text-xs text-gray-400 mt-0.5">Must fix</div>
                    </div>
                    <div className={cn("p-5 text-center", major.length > 0 ? "bg-orange-50" : "")}>
                      <div className={cn("text-4xl font-bold", major.length > 0 ? "text-orange-600" : "text-gray-300")}>
                        {major.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Major</div>
                      <div className="text-xs text-gray-400 mt-0.5">Should review</div>
                    </div>
                    <div className={cn("p-5 text-center", minor.length > 0 ? "bg-yellow-50" : "")}>
                      <div className={cn("text-4xl font-bold", minor.length > 0 ? "text-yellow-600" : "text-gray-300")}>
                        {minor.length}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Minor</div>
                      <div className="text-xs text-gray-400 mt-0.5">Low priority</div>
                    </div>
                  </div>

                  {/* Grouped Issues */}
                  {issues.length > 0 && (
                    <div className="border-t border-gray-100">
                      {/* Critical Issues */}
                      {critical.length > 0 && (
                        <details open className="border-b border-gray-100">
                          <summary className="px-5 py-3 cursor-pointer bg-red-50 hover:bg-red-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-red-500"></span>
                              <span className="font-semibold text-red-800">Critical Issues</span>
                            </div>
                            <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              {critical.length} issues
                            </span>
                          </summary>
                          <div className="p-4 space-y-2 bg-red-50/50">
                            {critical.map((issue, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-red-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-800">{issue.issue}</span>
                                    {issue.employeeId && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        👤 <span className="font-medium">{getEmployeeName(issue.employeeId)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Major Issues */}
                      {major.length > 0 && (
                        <details className="border-b border-gray-100">
                          <summary className="px-5 py-3 cursor-pointer bg-orange-50 hover:bg-orange-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                              <span className="font-semibold text-orange-800">Major Issues</span>
                            </div>
                            <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              {major.length} issues
                            </span>
                          </summary>
                          <div className="p-4 space-y-2 bg-orange-50/50">
                            {major.map((issue, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-orange-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-800">{issue.issue}</span>
                                    {issue.employeeId && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        👤 <span className="font-medium">{getEmployeeName(issue.employeeId)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Minor Issues */}
                      {minor.length > 0 && (
                        <details className="border-b border-gray-100">
                          <summary className="px-5 py-3 cursor-pointer bg-yellow-50 hover:bg-yellow-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                              <span className="font-semibold text-yellow-800">Minor Issues</span>
                            </div>
                            <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                              {minor.length} issues
                            </span>
                          </summary>
                          <div className="p-4 space-y-2 bg-yellow-50/50">
                            {minor.map((issue, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-yellow-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-800">{issue.issue}</span>
                                    {issue.employeeId && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        👤 <span className="font-medium">{getEmployeeName(issue.employeeId)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* WEEKLY SCHEDULE GRID - Columnas por estación, filas por hora */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                📅 Weekly Schedule
                <span className="text-sm font-normal text-gray-500">
                  ({result.roster?.roster?.length || 0} shifts)
                </span>
              </h3>
              
              {/* View toggle buttons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setScheduleViewMode('simple')}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    scheduleViewMode === 'simple'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  📋 Simple
                </button>
                <button
                  onClick={() => setScheduleViewMode('timeline')}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    scheduleViewMode === 'timeline'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  🕐 Timeline
                </button>
              </div>
            </div>
            
            {result.roster?.roster && result.roster.roster.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {(() => {
                  // Helper to get employee name
                  const getEmployeeName = (employeeId: string) => {
                    const employee = employees.find(e => e.id === employeeId);
                    if (employee) return `${employee.firstName} ${employee.lastName}`;
                    return 'Unknown';
                  };

                  // Group shifts by date
                  const groupedByDate: Record<string, typeof result.roster.roster> = {};
                  result.roster.roster.forEach(shift => {
                    const date = shift.start.split('T')[0];
                    if (!groupedByDate[date]) groupedByDate[date] = [];
                    groupedByDate[date].push(shift);
                  });
                  
                  const sortedDates = Object.keys(groupedByDate).sort();
                  
                  return sortedDates.map(date => {
                    const shifts = groupedByDate[date];
                    const dateObj = new Date(date + 'T00:00:00');
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    // Get unique stations for this day
                    const stations = [...new Set(shifts.map(s => s.station || s.stationCode || 'No Station'))].sort();
                    
                    // Group shifts by station
                    const shiftsByStation: Record<string, typeof shifts> = {};
                    stations.forEach(station => {
                      shiftsByStation[station] = shifts.filter(
                        s => (s.station || s.stationCode || 'No Station') === station
                      );
                    });
                    
                    // Find min and max hours for this day
                    let minHour = 23;
                    let maxHour = 0;
                    shifts.forEach(shift => {
                      const startHour = parseInt(shift.start.split('T')[1]?.slice(0, 2) || '0');
                      const endHour = parseInt(shift.end.split('T')[1]?.slice(0, 2) || '0');
                      minHour = Math.min(minHour, startHour);
                      maxHour = Math.max(maxHour, endHour);
                    });
                    
                    const totalHours = maxHour - minHour;
                    const hourHeight = 40; // pixels per hour
                    
                    return (
                      <details key={date} open={sortedDates.indexOf(date) === 0}>
                        <summary className="px-5 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex flex-col items-center justify-center">
                              <span className="text-xs text-indigo-600 font-medium">{dayName.slice(0, 3)}</span>
                              <span className="text-lg font-bold text-indigo-700">{dateObj.getDate()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{dayName}</span>
                              <span className="text-gray-500 text-sm ml-2">{dateStr}</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                            {shifts.length} shifts • {stations.length} stations
                          </span>
                        </summary>
                        {/* Conditional View: Simple or Timeline */}
                        {scheduleViewMode === 'simple' ? (
                          /* ═══ SIMPLE VIEW - Station columns with employee cards ═══ */
                          <div className="p-4">
                            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stations.length}, minmax(150px, 1fr))` }}>
                              {stations.map(station => {
                                const stationShifts = shiftsByStation[station] || [];
                                
                                return (
                                  <div key={station} className="bg-gray-50 rounded-lg overflow-hidden">
                                    {/* Station header */}
                                    <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                                      <div className="font-semibold text-sm text-gray-700">{station}</div>
                                      <div className="text-xs text-gray-500">{stationShifts.length} employees</div>
                                    </div>
                                    
                                    {/* Employee cards */}
                                    <div className="p-2 space-y-2">
                                      {stationShifts.map((shift, idx) => {
                                        // Find compliance issues
                                        const employeeIssues = result.compliance?.issues?.filter(
                                          issue => issue.employeeId === shift.employeeId
                                        ) || [];
                                        
                                        const hasCritical = employeeIssues.some(i => i.severity === 'CRITICAL');
                                        const hasMajor = employeeIssues.some(i => i.severity === 'MAJOR' || i.severity === 'WARNING');
                                        const hasMinor = employeeIssues.some(i => i.severity === 'MINOR' || i.severity === 'INFO');
                                        const hasIssue = hasCritical || hasMajor || hasMinor;
                                        
                                        let cardStyle = "bg-white border-l-4 border-indigo-400";
                                        if (hasCritical) cardStyle = "bg-red-50 border-l-4 border-red-500";
                                        else if (hasMajor) cardStyle = "bg-orange-50 border-l-4 border-orange-500";
                                        else if (hasMinor) cardStyle = "bg-yellow-50 border-l-4 border-yellow-500";
                                        
                                        const startTime = shift.start.split('T')[1]?.slice(0, 5) || '';
                                        const endTime = shift.end.split('T')[1]?.slice(0, 5) || '';
                                        
                                        // Build tooltip
                                        const tooltipText = [
                                          `👤 ${getEmployeeName(shift.employeeId)}`,
                                          `🕐 ${startTime} - ${endTime}`,
                                          `📍 ${station}`,
                                          hasIssue 
                                            ? `\n⚠️ ${employeeIssues.slice(0, 2).map(i => i.issue).join(', ')}`
                                            : ''
                                        ].filter(Boolean).join('\n');
                                        
                                        return (
                                          <div
                                            key={idx}
                                            title={tooltipText}
                                            className={cn(
                                              "rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative",
                                              cardStyle
                                            )}
                                          >
                                            {hasIssue && (
                                              <span className="absolute top-1 right-1 text-xs">
                                                {hasCritical ? '🔴' : hasMajor ? '🟠' : '🟡'}
                                              </span>
                                            )}
                                            <div className="font-medium text-sm text-gray-900 truncate pr-4">
                                              {getEmployeeName(shift.employeeId)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              {startTime} - {endTime}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      {stationShifts.length === 0 && (
                                        <div className="text-xs text-gray-400 text-center py-4">
                                          No employees assigned
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* ═══ TIMELINE VIEW - Hours grid with shift bands ═══ */
                          <div className="p-4 overflow-x-auto">
                            <div className="flex gap-0">
                              {/* Hour labels column */}
                              <div className="flex-shrink-0 w-16 border-r border-gray-200">
                                <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                  Hour
                                </div>
                                {Array.from({ length: totalHours + 1 }, (_, i) => minHour + i).map(hour => (
                                  <div 
                                    key={hour} 
                                    className="flex items-start justify-center text-xs font-mono text-gray-400 border-b border-gray-100"
                                    style={{ height: `${hourHeight}px` }}
                                  >
                                    {hour.toString().padStart(2, '0')}:00
                                  </div>
                                ))}
                              </div>
                              
                              {/* Station columns */}
                              {stations.map(station => {
                                const stationShifts = shiftsByStation[station] || [];
                                
                                return (
                                  <div key={station} className="flex-1 min-w-[160px] border-r border-gray-200">
                                    {/* Station header */}
                                    <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 px-2">
                                      {station}
                                      <span className="ml-1 text-gray-400">({stationShifts.length})</span>
                                    </div>
                                    
                                    {/* Timeline container */}
                                    <div 
                                      className="relative"
                                      style={{ height: `${(totalHours + 1) * hourHeight}px` }}
                                    >
                                      {/* Hour grid lines */}
                                      {Array.from({ length: totalHours + 1 }, (_, i) => (
                                        <div 
                                          key={i}
                                          className="absolute w-full border-b border-gray-100"
                                          style={{ top: `${i * hourHeight}px`, height: `${hourHeight}px` }}
                                        />
                                      ))}
                                      
                                      {/* Shift bands */}
                                      {stationShifts.map((shift, idx) => {
                                        const startHour = parseInt(shift.start.split('T')[1]?.slice(0, 2) || '0');
                                        const startMin = parseInt(shift.start.split('T')[1]?.slice(3, 5) || '0');
                                        const endHour = parseInt(shift.end.split('T')[1]?.slice(0, 2) || '0');
                                        const endMin = parseInt(shift.end.split('T')[1]?.slice(3, 5) || '0');
                                        
                                        const topOffset = ((startHour - minHour) + startMin / 60) * hourHeight;
                                        const duration = (endHour - startHour) + (endMin - startMin) / 60;
                                        const height = duration * hourHeight;
                                        
                                        // Calculate horizontal position for overlapping shifts
                                        const overlappingShifts = stationShifts.filter((s) => {
                                          const sStart = parseInt(s.start.split('T')[1]?.slice(0, 2) || '0');
                                          const sEnd = parseInt(s.end.split('T')[1]?.slice(0, 2) || '0');
                                          return (startHour < sEnd && endHour > sStart);
                                        });
                                        
                                        const totalOverlapping = overlappingShifts.length;
                                        const myIndex = overlappingShifts.findIndex(s => s.employeeId === shift.employeeId);
                                        
                                        const columnWidth = totalOverlapping > 1 ? `${100 / totalOverlapping}%` : '100%';
                                        const leftPosition = totalOverlapping > 1 ? `${(myIndex / totalOverlapping) * 100}%` : '0';
                                        
                                        // Find compliance issues
                                        const employeeIssues = result.compliance?.issues?.filter(
                                          issue => issue.employeeId === shift.employeeId
                                        ) || [];
                                        
                                        const hasCritical = employeeIssues.some(i => i.severity === 'CRITICAL');
                                        const hasMajor = employeeIssues.some(i => i.severity === 'MAJOR' || i.severity === 'WARNING');
                                        const hasMinor = employeeIssues.some(i => i.severity === 'MINOR' || i.severity === 'INFO');
                                        
                                        let cardStyle = "bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500";
                                        let hasIssue = false;
                                        
                                        if (hasCritical) {
                                          cardStyle = "bg-red-100 text-red-800 border-l-4 border-red-500";
                                          hasIssue = true;
                                        } else if (hasMajor) {
                                          cardStyle = "bg-orange-100 text-orange-800 border-l-4 border-orange-500";
                                          hasIssue = true;
                                        } else if (hasMinor) {
                                          cardStyle = "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500";
                                          hasIssue = true;
                                        }
                                        
                                        // Build tooltip text
                                        const tooltipText = [
                                          `👤 ${getEmployeeName(shift.employeeId)}`,
                                          `🕐 ${shift.start.split('T')[1]?.slice(0, 5)} - ${shift.end.split('T')[1]?.slice(0, 5)} (${Math.round(duration)}h)`,
                                          `📍 ${shift.station || shift.stationCode || 'No Station'}`,
                                          hasIssue 
                                            ? `\n⚠️ ${hasCritical ? 'CRITICAL' : hasMajor ? 'MAJOR' : 'MINOR'} ISSUES:\n${employeeIssues.slice(0, 3).map(i => `• ${i.issue}`).join('\n')}${employeeIssues.length > 3 ? `\n+${employeeIssues.length - 3} more...` : ''}`
                                            : '\n✅ No compliance issues'
                                        ].join('\n');
                                        
                                        return (
                                          <div
                                            key={idx}
                                            title={tooltipText}
                                            className={cn(
                                              "absolute rounded-r-lg p-1 cursor-pointer shadow-sm hover:shadow-lg hover:brightness-95 transition-all",
                                              cardStyle
                                            )}
                                            style={{
                                              top: `${topOffset}px`,
                                              height: `${Math.max(height, 28)}px`,
                                              left: leftPosition,
                                              width: `calc(${columnWidth} - 4px)`,
                                              zIndex: 10
                                            }}
                                          >
                                            {/* Issue indicator */}
                                            {hasIssue && (
                                              <span className="absolute top-0.5 right-0.5 text-[10px]">
                                                {hasCritical ? '🔴' : hasMajor ? '🟠' : '🟡'}
                                              </span>
                                            )}
                                            
                                            <div className="font-semibold text-xs truncate pr-3">
                                              {getEmployeeName(shift.employeeId)}
                                            </div>
                                            {height >= 32 && (
                                              <div className="text-[10px] opacity-80 mt-0.5 truncate">
                                                {shift.start.split('T')[1]?.slice(0, 5)} - {shift.end.split('T')[1]?.slice(0, 5)}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </details>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No shifts generated
              </div>
            )}
          </div>

          {/* Agent Trace (Collapsible) */}
          <details className="bg-white shadow-lg rounded-xl overflow-hidden">
            <summary className="p-5 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between">
              <span className="flex items-center gap-2">
                🤖 Agent Trace
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {result.agentTrace?.length || 0} messages
              </span>
            </summary>
            <div className="px-5 pb-5 max-h-64 overflow-y-auto border-t border-gray-100">
              <div className="space-y-1 pt-3">
                {result.agentTrace?.map((msg, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs py-1 border-l-2 border-indigo-200 pl-3 hover:bg-gray-50">
                    <span className="text-gray-400 font-mono min-w-[60px]">{msg.timestamp.split('T')[1]?.slice(0, 8)}</span>
                    <span className="font-medium text-indigo-600">{msg.from}</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-medium text-green-600">{msg.to}</span>
                    <span className="text-gray-600">{msg.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}


import { useState, useEffect } from 'react';
import { Users, Store as StoreIcon, ClipboardList, CheckCircle, XCircle, Cpu, Calendar } from 'lucide-react';
import * as employeeService from '../services/employeeService';
import * as storeService from '../services/storeService';
import * as shiftCodeService from '../services/shiftCodeService';
import * as schedulePeriodService from '../services/schedulePeriodService';
import * as masService from '../services/masService';
import type { MASHealthStatus } from '../services/masService';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { name: 'Total Employees', value: '...', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Stores', value: '...', icon: StoreIcon, color: 'bg-green-500' },
    { name: 'Shift Codes', value: '...', icon: ClipboardList, color: 'bg-purple-500' },
    { name: 'Schedule Periods', value: '...', icon: Calendar, color: 'bg-orange-500' },
  ]);
  
  const [masHealth, setMasHealth] = useState<MASHealthStatus | null>(null);
  const [masError, setMasError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employees, stores, shiftCodes, schedulePeriods] = await Promise.all([
          employeeService.getEmployees(),
          storeService.getStores(),
          shiftCodeService.getShiftCodes(),
          schedulePeriodService.getSchedulePeriods().catch(() => []),
        ]);

        const employeeCount = Array.isArray(employees) ? employees.length : 0;
        const storeCount = Array.isArray(stores) ? stores.length : 0;
        const shiftCodeCount = Array.isArray(shiftCodes) ? shiftCodes.length : 0;
        const periodCount = Array.isArray(schedulePeriods) ? schedulePeriods.length : 0;

        setStats([
          { name: 'Total Employees', value: employeeCount.toString(), icon: Users, color: 'bg-blue-500' },
          { name: 'Active Stores', value: storeCount.toString(), icon: StoreIcon, color: 'bg-green-500' },
          { name: 'Shift Codes', value: shiftCodeCount.toString(), icon: ClipboardList, color: 'bg-purple-500' },
          { name: 'Schedule Periods', value: periodCount.toString(), icon: Calendar, color: 'bg-orange-500' },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };

    const fetchMASHealth = async () => {
      try {
        const health = await masService.getMASHealth();
        setMasHealth(health);
        setMasError(null);
      } catch (error) {
        console.error('Failed to fetch MAS health', error);
        setMasError('Unable to connect to MAS');
      }
    };

    fetchData();
    fetchMASHealth();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
            <div className={`p-3 rounded-full ${stat.color} bg-opacity-10 mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MAS Health Status */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            Multi-Agent System Status
          </h2>
          {masHealth ? (
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Online
            </span>
          ) : masError ? (
            <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
              <XCircle className="w-4 h-4" /> Offline
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Checking...</span>
          )}
        </div>
        
        {masHealth && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Service</p>
              <p className="text-sm font-semibold text-gray-900">{masHealth.service}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Workers ({masHealth.workers.length})</p>
              <div className="flex flex-wrap gap-1">
                {masHealth.workers.map((worker) => (
                  <span key={worker} className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs">
                    {worker.replace('Worker', '')}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-medium mb-2">Modes</p>
              <div className="flex gap-2">
                {masHealth.modes.map((mode) => (
                  <span key={mode} className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs capitalize">
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {masError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700 text-sm">{masError}. Make sure the backend is running on the configured port.</p>
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow-sm text-white">
        <h2 className="text-lg font-semibold mb-2">Welcome to Mail-MAS</h2>
        <p className="text-indigo-100">
          Use the sidebar to navigate through the different modules. You can manage employees, stores, stations, shift codes, and generate rosters using the Multi-Agent System.
        </p>
        <div className="mt-4 flex gap-3">
          <a href="/employees" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            Manage Employees
          </a>
          <a href="/roster" className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors">
            Generate Roster
          </a>
        </div>
      </div>
    </div>
  );
}


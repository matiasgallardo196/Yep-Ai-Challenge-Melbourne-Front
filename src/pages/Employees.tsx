import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { type Employee, type CreateEmployeeDto, type EmployeeAvailability, EmploymentType, EmployeeRole, type Store, type Station } from '../types';
import * as employeeService from '../services/employeeService';
import * as availabilityService from '../services/availabilityService';
import * as storeService from '../services/storeService';
import * as stationService from '../services/stationService';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Tooltip from '../components/Tooltip';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allAvailabilities, setAllAvailabilities] = useState<EmployeeAvailability[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter States
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterStation, setFilterStation] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  
  // Availability Modal State
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedEmployeeForAvailability, setSelectedEmployeeForAvailability] = useState<Employee | null>(null);
  
  // Week navigation state - Start with Dec 9, 2024 (first week in seeder)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const weekStart = new Date('2024-12-09');
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  // Form State
  const [formData, setFormData] = useState<CreateEmployeeDto>({
    externalCode: 0,
    firstName: '',
    lastName: '',
    employmentType: EmploymentType.FULL_TIME,
    role: EmployeeRole.CREW,
    defaultStoreId: '',
    defaultStationId: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [employeesData, availabilitiesData, storesData, stationsData] = await Promise.all([
        employeeService.getEmployees(),
        availabilityService.getAvailabilities(),
        storeService.getStores(),
        stationService.getStations()
      ]);

      if (Array.isArray(employeesData)) setEmployees(employeesData);
      else console.error('API returned non-array employee data:', employeesData);

      if (Array.isArray(availabilitiesData)) setAllAvailabilities(availabilitiesData);
      else console.error('API returned non-array availability data:', availabilitiesData);

      if (Array.isArray(storesData)) {
         setStores(storesData);
         // Set default store for new employees if available
         if (storesData.length > 0 && !editingId) {
             setFormData(prev => ({ ...prev, defaultStoreId: storesData[0].id }));
         }
      }
      
      if (Array.isArray(stationsData)) setStations(stationsData);

    } catch (error) {
      console.error('Failed to fetch data', error);
      if (!employees.length) setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({
        externalCode: employee.externalCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employmentType: employee.employmentType,
        role: employee.role,
        defaultStoreId: employee.defaultStoreId,
        defaultStationId: employee.defaultStationId || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        externalCode: 0,
        firstName: '',
        lastName: '',
        employmentType: EmploymentType.FULL_TIME,
        role: EmployeeRole.CREW,
        defaultStoreId: stores.length > 0 ? stores[0].id : '',
        defaultStationId: '',
      });
    }
    setIsModalOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await employeeService.updateEmployee(editingId, formData);
      } else {
        await employeeService.createEmployee(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save employee', error);
      alert('Failed to save employee. Check console for details.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete employee', error);
      }
    }
  };

  const filteredEmployees = (employees || []).filter(emp => {
    // Text search
    const matchesSearch = 
      (emp.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.externalCode || '').toString().includes(searchTerm);
    
    // Store filter
    const matchesStore = !filterStore || emp.defaultStoreId === filterStore;
    
    // Station filter
    const matchesStation = !filterStation || emp.defaultStationId === filterStation;
    
    // Role filter
    const matchesRole = !filterRole || emp.role === filterRole;
    
    return matchesSearch && matchesStore && matchesStation && matchesRole;
  });



  // Helper functions for week navigation
  const getWeekDays = (weekStart: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getWeekRange = (weekStart: Date): string => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const startStr = weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const endStr = weekEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const getAvailabilityForDate = (employee: Employee, date: Date): EmployeeAvailability | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return allAvailabilities.find(
      a => a.employee?.id === employee.id && 
      a.date.split('T')[0] === dateStr
    );
  };

  const weekDays = getWeekDays(currentWeekStart);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
          >
            <option value="">All Stations</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {Object.values(EmployeeRole).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {(filterStore || filterStation || filterRole) && (
            <button
              onClick={() => { setFilterStore(''); setFilterStation(''); setFilterRole(''); }}
              className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold text-gray-700 min-w-[200px] text-center">
            {getWeekRange(currentWeekStart)}
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Excel-like Grid */}
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-0 bg-gray-100 z-10 min-w-[200px]">
                    Employee
                  </th>
                  {weekDays.map((day, index) => (
                    <th
                      key={index}
                      className="border border-gray-300 px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase min-w-[120px]"
                    >
                      <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xs font-normal text-gray-600">
                        {day.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </div>
                    </th>
                  ))}
                  <th className="border border-gray-300 px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredEmployees.map((employee) => {
                  const employeeWeekAvailabilities = weekDays.map(day => getAvailabilityForDate(employee, day));
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                        <Tooltip
                          content={
                            <div className="text-left">
                              <div><strong>Role:</strong> {employee.role || 'N/A'}</div>
                              <div><strong>Ext Code:</strong> {employee.externalCode}</div>
                            </div>
                          }
                        >
                          <span className="cursor-default">{employee.firstName} {employee.lastName}</span>
                        </Tooltip>
                        <div className="text-xs text-gray-500 mt-1">{employee.defaultStation?.name || 'No Station'}</div>
                      </td>
                      {weekDays.map((_, dayIndex) => {
                        const availability = employeeWeekAvailabilities[dayIndex];
                        return (
                          <td
                            key={dayIndex}
                            className="border border-gray-300 px-2 py-3 text-center text-xs"
                          >
                            {availability ? (
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="font-semibold text-gray-900">
                                  {availability.shiftCode?.code || 'N/A'}
                                </span>
                                {availability.store && (
                                  <span className="text-gray-600 text-[10px]">
                                    {availability.store.name}
                                  </span>
                                )}
                                {availability.station && (
                                  <span className="text-gray-500 text-[10px]">
                                    {availability.station.name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-2 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(employee)} 
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(employee.id)} 
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="External Code"
            type="number"
            value={formData.externalCode}
            onChange={(e) => setFormData({ ...formData, externalCode: parseInt(e.target.value) || 0 })}
            required
            min={1}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
            >
              {Object.values(EmploymentType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
            >
              {Object.values(EmployeeRole).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Store</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.defaultStoreId}
              onChange={(e) => setFormData({ ...formData, defaultStoreId: e.target.value })}
              required
            >
               <option value="" disabled>Select a store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Station (Skill)</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.defaultStationId || ''}
              onChange={(e) => setFormData({ ...formData, defaultStationId: e.target.value })}
            >
              <option value="">No Default Station</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name} ({station.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Availability Modal - Shows only selected employee */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title={`Availability: ${selectedEmployeeForAvailability?.firstName} ${selectedEmployeeForAvailability?.lastName}`}
      >
        <div className="mt-2">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-lg font-semibold text-gray-700">
              {getWeekRange(currentWeekStart)}
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Single Employee Availability Grid */}
          {selectedEmployeeForAvailability && (
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {weekDays.map((day, index) => (
                      <th
                        key={index}
                        className="border border-gray-300 px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase min-w-[100px]"
                      >
                        <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-xs font-normal text-gray-600">
                          {day.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    {weekDays.map((day, dayIndex) => {
                      const availability = getAvailabilityForDate(selectedEmployeeForAvailability, day);
                      return (
                        <td
                          key={dayIndex}
                          className="border border-gray-300 px-2 py-4 text-center"
                        >
                          {availability ? (
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className="font-bold text-lg text-indigo-600">
                                {availability.shiftCode?.code || 'N/A'}
                              </span>
                              <span className="text-xs text-gray-600">
                                {availability.shiftCode?.shiftName || ''}
                              </span>
                              {availability.store && (
                                <span className="text-xs text-gray-500">
                                  📍 {availability.store.name}
                                </span>
                              )}
                              {availability.station && (
                                <span className="text-xs text-gray-500">
                                  🔧 {availability.station.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not available</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Employee Info */}
          {selectedEmployeeForAvailability && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Role:</span> {selectedEmployeeForAvailability.role}</div>
                <div><span className="font-medium">Type:</span> {selectedEmployeeForAvailability.employmentType}</div>
                <div><span className="font-medium">Store:</span> {selectedEmployeeForAvailability.defaultStore?.name || 'N/A'}</div>
                <div><span className="font-medium">Station:</span> {selectedEmployeeForAvailability.defaultStation?.name || 'N/A'}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAvailabilityModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

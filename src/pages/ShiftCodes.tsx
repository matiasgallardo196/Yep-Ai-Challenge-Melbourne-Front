import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { type ShiftCode, type CreateShiftCodeDto } from '../types';
import * as shiftCodeService from '../services/shiftCodeService';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';

export default function ShiftCodes() {
  const [shiftCodes, setShiftCodes] = useState<ShiftCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateShiftCodeDto>({
    code: '',
    shiftName: '',
    startTime: '08:00:00',
    endTime: '16:00:00',
    hours: 8,
    description: '',
    isAvailable: true,
    isManagement: false,
  });

  const fetchShiftCodes = async () => {
    try {
      setIsLoading(true);
      const data = await shiftCodeService.getShiftCodes();
      if (Array.isArray(data)) {
        setShiftCodes(data);
      } else {
        console.error('API returned non-array data:', data);
        setShiftCodes([]);
      }
    } catch (error) {
      console.error('Failed to fetch shift codes', error);
      setShiftCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftCodes();
  }, []);

  const handleOpenModal = (shiftCode?: ShiftCode) => {
    if (shiftCode) {
      setEditingId(shiftCode.id);
      setFormData({
        code: shiftCode.code,
        shiftName: shiftCode.shiftName,
        startTime: shiftCode.startTime || '08:00:00',
        endTime: shiftCode.endTime || '16:00:00',
        hours: shiftCode.hours || 8,
        description: shiftCode.description || '',
        isAvailable: shiftCode.isAvailable,
        isManagement: shiftCode.isManagement,
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        shiftName: '',
        startTime: '08:00:00',
        endTime: '16:00:00',
        hours: 8,
        description: '',
        isAvailable: true,
        isManagement: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await shiftCodeService.updateShiftCode(editingId, formData);
      } else {
        await shiftCodeService.createShiftCode(formData);
      }
      setIsModalOpen(false);
      fetchShiftCodes();
    } catch (error) {
      console.error('Failed to save shift code', error);
      alert('Failed to save shift code');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shift code?')) {
      try {
        await shiftCodeService.deleteShiftCode(id);
        fetchShiftCodes();
      } catch (error) {
        console.error('Failed to delete shift code', error);
      }
    }
  };

  const filteredShiftCodes = (shiftCodes || []).filter(sc => 
    (sc.shiftName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sc.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shift Codes</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift Code
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search shift codes..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShiftCodes.map((sc) => (
                  <tr key={sc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{sc.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sc.shiftName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sc.hours}h ({sc.startTime}-{sc.endTime})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sc.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {sc.isAvailable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(sc)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sc.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Shift Code' : 'Add Shift Code'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Shift Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Shift Name"
            value={formData.shiftName}
            onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
             <Input
              label="Start Time"
              type="time"
              step="1"
              value={formData.startTime || ''}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
             <Input
              label="End Time"
              type="time"
              step="1"
              value={formData.endTime || ''}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          
          <Input
            label="Hours"
            type="number"
            step="0.5"
            value={formData.hours || 0}
            onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
          />

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-700">Available</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600"
                checked={formData.isManagement}
                onChange={(e) => setFormData({ ...formData, isManagement: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-700">Management</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Save Changes' : 'Create Shift Code'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

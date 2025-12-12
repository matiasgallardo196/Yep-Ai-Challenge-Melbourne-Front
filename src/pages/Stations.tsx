import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { type Station, type CreateStationDto } from '../types';
import * as stationService from '../services/stationService';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';

export default function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateStationDto>({
    code: '',
    name: '',
    description: '',
  });

  const fetchStations = async () => {
    try {
      setIsLoading(true);
      const data = await stationService.getStations();
      if (Array.isArray(data)) {
        setStations(data);
      } else {
        console.error('API returned non-array data:', data);
        setStations([]);
      }
    } catch (error) {
      console.error('Failed to fetch stations', error);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleOpenModal = (station?: Station) => {
    if (station) {
      setEditingId(station.id);
      setFormData({
        code: station.code,
        name: station.name,
        description: station.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await stationService.updateStation(editingId, formData);
      } else {
        await stationService.createStation(formData);
      }
      setIsModalOpen(false);
      fetchStations();
    } catch (error) {
      console.error('Failed to save station', error);
      alert('Failed to save station');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this station?')) {
      try {
        await stationService.deleteStation(id);
        fetchStations();
      } catch (error) {
        console.error('Failed to delete station', error);
      }
    }
  };

  const filteredStations = (stations || []).filter(station => 
    (station.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (station.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Station
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search stations..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStations.map((station) => (
                  <tr key={station.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{station.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(station)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(station.id)} className="text-red-600 hover:text-red-900">
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
        title={editingId ? 'Edit Station' : 'Add Station'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Station Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Station Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Save Changes' : 'Create Station'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { type Store, type CreateStoreDto, StoreLocationType } from '../types';
import * as storeService from '../services/storeService';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateStoreDto>({
    code: '',
    name: '',
    locationType: StoreLocationType.CBD_CORE,
    revenueLevel: '',
    storeType: '',
    openingTime: '06:00:00',
    closingTime: '22:00:00',
  });

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const data = await storeService.getStores();
      if (Array.isArray(data)) {
        setStores(data);
      } else {
        console.error('API returned non-array data:', data);
        setStores([]);
      }
    } catch (error) {
      console.error('Failed to fetch stores', error);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleOpenModal = (store?: Store) => {
    if (store) {
      setEditingId(store.id);
      setFormData({
        code: store.code,
        name: store.name,
        locationType: store.locationType,
        revenueLevel: store.revenueLevel || '',
        storeType: store.storeType || '',
        openingTime: store.openingTime || '06:00:00',
        closingTime: store.closingTime || '22:00:00',
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        locationType: StoreLocationType.CBD_CORE,
        revenueLevel: '',
        storeType: '',
        openingTime: '06:00:00',
        closingTime: '22:00:00',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await storeService.updateStore(editingId, formData);
      } else {
        await storeService.createStore(formData);
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (error) {
      console.error('Failed to save store', error);
      alert('Failed to save store');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this store?')) {
      try {
        await storeService.deleteStore(id);
        fetchStores();
      } catch (error) {
        console.error('Failed to delete store', error);
      }
    }
  };

  const filteredStores = (stores || []).filter(store => 
    (store.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search stores..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{store.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.locationType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{store.openingTime} - {store.closingTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(store)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(store.id)} className="text-red-600 hover:text-red-900">
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
        title={editingId ? 'Edit Store' : 'Add Store'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Store Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Store Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value as StoreLocationType })}
            >
              {Object.values(StoreLocationType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Time"
              type="time"
              step="1"
              value={formData.openingTime}
              onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
            />
            <Input
              label="Closing Time"
              type="time"
              step="1"
              value={formData.closingTime}
              onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Save Changes' : 'Create Store'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

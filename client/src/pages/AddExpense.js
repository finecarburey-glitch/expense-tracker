import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, X } from 'lucide-react';
import axios from 'axios';

const AddExpense = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    notes: ''
  });

  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/expenses/categories');
      setCategories(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, category: response.data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.date || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/expenses', formData);
      navigate('/');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await axios.post('/api/expenses/categories', { name: newCategory.trim() });
      setNewCategory('');
      setShowNewCategory(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Expense</h1>
        <p className="text-gray-600 mt-2">Record a new family expense</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Field */}
        <div>
          <label htmlFor="amount" className="block text-lg font-medium text-gray-700 mb-2">
            Amount (₹)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            className="input-field text-2xl font-semibold text-center"
            min="0"
            step="0.01"
            required
          />
          {formData.amount && (
            <p className="text-center text-gray-500 mt-2">
              {formatCurrency(parseFloat(formData.amount) || 0)}
            </p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label htmlFor="date" className="block text-lg font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="input-field text-lg"
            required
          />
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="flex space-x-2">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input-field flex-1"
              required
            >
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Category Input */}
        {showNewCategory && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="btn-primary px-4 py-3"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowNewCategory(false)}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Notes Field */}
        <div>
          <label htmlFor="notes" className="block text-lg font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Add any additional notes about this expense..."
            rows="3"
            className="input-field resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="loading-spinner w-5 h-5"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{loading ? 'Saving...' : 'Save Expense'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Quick Category Buttons */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Quick Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.slice(0, 8).map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: category.name }))}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                formData.category === category.name
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddExpense;

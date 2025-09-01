import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Save, 
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showReclassify, setShowReclassify] = useState(false);
  
  const [newCategory, setNewCategory] = useState('');
  const [reclassifyData, setReclassifyData] = useState({
    oldCategory: '',
    newCategory: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/expenses/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await axios.post('/api/expenses/categories', { name: newCategory.trim() });
      setNewCategory('');
      setShowAddForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  const handleEditCategory = async (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;

    try {
      // First reclassify all expenses to the new category name
      await axios.post('/api/expenses/reclassify', {
        oldCategory: oldName,
        newCategory: newName.trim()
      });
      
      // Then update the category name in the categories list
      // Note: This would require a backend endpoint to update category names
      // For now, we'll just reclassify the expenses
      setEditingCategory(null);
      fetchCategories();
      alert('Category updated successfully! All expenses have been reclassified.');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"? This will remove all expenses in this category.`)) {
      try {
        // Note: This would require a backend endpoint to delete categories
        // For now, we'll just show a message
        alert('Category deletion is not implemented yet. Please contact support.');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const handleReclassify = async () => {
    if (!reclassifyData.oldCategory || !reclassifyData.newCategory) {
      alert('Please select both old and new categories');
      return;
    }

    if (reclassifyData.oldCategory === reclassifyData.newCategory) {
      alert('Old and new categories must be different');
      return;
    }

    try {
      await axios.post('/api/expenses/reclassify', reclassifyData);
      setReclassifyData({ oldCategory: '', newCategory: '' });
      setShowReclassify(false);
      alert('Expenses reclassified successfully!');
    } catch (error) {
      console.error('Error reclassifying expenses:', error);
      alert('Failed to reclassify expenses. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage expense categories and reclassify expenses
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowReclassify(!showReclassify)}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Reclassify</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Add New Category</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="btn-primary px-6"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary px-6"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reclassify Form */}
      {showReclassify && (
        <div className="card bg-orange-50 border-orange-200">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Reclassify Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                From Category
              </label>
              <select
                value={reclassifyData.oldCategory}
                onChange={(e) => setReclassifyData(prev => ({ ...prev, oldCategory: e.target.value }))}
                className="input-field"
              >
                <option value="">Select old category</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                To Category
              </label>
              <select
                value={reclassifyData.newCategory}
                onChange={(e) => setReclassifyData(prev => ({ ...prev, newCategory: e.target.value }))}
                className="input-field"
              >
                <option value="">Select new category</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={handleReclassify}
                className="btn-primary px-6"
              >
                Reclassify
              </button>
              <button
                onClick={() => setShowReclassify(false)}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="mt-3 p-3 bg-orange-100 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">
                <strong>Warning:</strong> This action will move all expenses from the old category to the new category. 
                This cannot be undone easily.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Categories ({categories.length})
        </h3>
        
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No categories yet</p>
            <p className="text-sm text-gray-400">Add your first category to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.name} className="expense-item">
                {editingCategory?.name === category.name ? (
                  <CategoryEditForm
                    category={category}
                    onSave={handleEditCategory}
                    onCancel={() => setEditingCategory(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        {category.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingCategory(category)}
                        disabled={category.isDefault}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          category.isDefault
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title={category.isDefault ? 'Default categories cannot be edited' : 'Edit category'}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.name)}
                        disabled={category.isDefault}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          category.isDefault
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={category.isDefault ? 'Default categories cannot be deleted' : 'Delete category'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default Categories Info */}
      <div className="card bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About Default Categories</h3>
        <div className="space-y-2 text-gray-700">
          <p>• Default categories (Food, Fuel, Medicine, etc.) are pre-created and cannot be edited or deleted</p>
          <p>• You can add new custom categories as needed</p>
          <p>• Use the reclassify feature to move expenses between categories</p>
        </div>
      </div>
    </div>
  );
};

// Category Edit Form Component
const CategoryEditForm = ({ category, onSave, onCancel }) => {
  const [newName, setNewName] = useState(category.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(category.name, newName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="input-field"
        placeholder="Category name"
        required
      />
      
      <div className="flex space-x-2">
        <button
          type="submit"
          className="btn-primary px-4 py-2"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default Categories;

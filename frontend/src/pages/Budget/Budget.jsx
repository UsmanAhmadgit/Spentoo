import React, { useState, useEffect } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { budgetApi } from '../../api/budgetApi';
import { categoryApi } from '../../api/categoryApi';

const Budget = () => {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : false;
  });
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  };

  // State management
  const [budgets, setBudgets] = useState({
    categoryBudgets: [],
    subcategoryBudgets: []
  });
  
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // Flat list of all categories for subcategory selection
  const [subcategories, setSubcategories] = useState([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  
  const [formData, setFormData] = useState({
    budgetType: 'category',
    categoryId: '',
    subcategoryId: '',
    amount: '',
    startDate: '',
    endDate: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  // Fetch all budgets on page load
  const fetchBudgets = async () => {
    try {
      const response = await budgetApi.getAll();
      const budgetsList = Array.isArray(response) ? response : [];
      
      // Transform backend response to frontend format
      console.log('=== FETCHING BUDGETS ===');
      console.log('Raw budgets response:', budgetsList);
      
      const transformedBudgets = budgetsList.map(budget => {
        // Category is required for all budgets
        const categoryObj = budget.category;
        
        if (!categoryObj) {
          console.warn('Budget missing category:', budget);
          return null; // Skip budgets without category (shouldn't happen with new backend)
        }
        
        const categoryId = categoryObj.categoryId || categoryObj.id || null;
        const categoryName = categoryObj.categoryName || categoryObj.name || 'Unknown Category';
        const spentAmount = Number(budget.spentAmount || 0);
        const amount = Number(budget.amount || 0);
        const remainingAmount = Number(budget.remainingAmount || 0);
        const percentageUsed = amount > 0 ? (spentAmount / amount) * 100 : 0;
        
        // Determine if it's a subcategory (has parentCategoryId)
        // Check for parentCategoryId in multiple possible formats (camelCase, snake_case, etc.)
        // Also check for nested parentCategory object (if backend returns it)
        let parentCategoryId = null;
        if (categoryObj) {
          // First check direct parentCategoryId field
          parentCategoryId = categoryObj.parentCategoryId || categoryObj.parentCategoryID || categoryObj.parent_category_id || null;
          
          // If not found, check nested parentCategory object
          if (!parentCategoryId && categoryObj.parentCategory) {
            parentCategoryId = categoryObj.parentCategory.categoryId || categoryObj.parentCategory.id || null;
          }
        }
        
        // A category is a subcategory if it has a parentCategoryId set (not null, not undefined, and not 0)
        const isSubcategory = parentCategoryId !== null && parentCategoryId !== undefined && parentCategoryId !== 0;
        
        // Comprehensive debug logging for ALL budgets
        console.log(`Budget ID ${budget.budgetId || budget.id} - Category: "${categoryName}" (ID: ${categoryId})`, {
          categoryObj: categoryObj,
          parentCategoryId: parentCategoryId,
          isSubcategory: isSubcategory,
          'categoryObj.parentCategoryId': categoryObj.parentCategoryId,
          'categoryObj.parentCategory': categoryObj.parentCategory
        });
        
        // Find parent category name if it's a subcategory
        let parentCategoryName = null;
        if (isSubcategory && parentCategoryId) {
          const parentCat = allCategories.find(c => c.categoryId === parentCategoryId);
          parentCategoryName = parentCat ? parentCat.name : null;
          if (!parentCategoryName && categoryObj.parentCategory) {
            parentCategoryName = categoryObj.parentCategory.categoryName || categoryObj.parentCategory.name || null;
          }
        }
        
        return {
          budgetId: budget.budgetId || budget.id,
          categoryId: categoryId,
          categoryName: categoryName,
          parentCategoryId: parentCategoryId,
          parentCategoryName: parentCategoryName,
          isSubcategory: isSubcategory,
          amount: amount,
          totalSpent: spentAmount,
          remaining: remainingAmount,
          percentageUsed: percentageUsed,
          startDate: budget.startDate,
          endDate: budget.endDate,
          status: budget.status,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        };
      }).filter(b => b !== null); // Remove any null entries
      
      // Separate budgets into category and subcategory budgets
      const categoryBudgets = transformedBudgets.filter(b => !b.isSubcategory && b.categoryId);
      const subcategoryBudgets = transformedBudgets.filter(b => b.isSubcategory);
      
      console.log('=== BUDGET CLASSIFICATION ===');
      console.log('Total budgets:', transformedBudgets.length);
      console.log('Category budgets:', categoryBudgets.map(b => `${b.categoryName} (ID: ${b.categoryId}, isSub: ${b.isSubcategory})`));
      console.log('Subcategory budgets:', subcategoryBudgets.map(b => `${b.categoryName} (ID: ${b.categoryId}, parent: ${b.parentCategoryId}, isSub: ${b.isSubcategory})`));
      
      setBudgets({
        categoryBudgets: categoryBudgets,
        subcategoryBudgets: subcategoryBudgets
      });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setBudgets({ categoryBudgets: [], subcategoryBudgets: [] });
    }
  };

  // Helper function to show toast
  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      const categoriesData = Array.isArray(response) ? response : response.categories || [];
      
      // Filter only budgetable categories
      const budgetableCategories = categoriesData.filter(cat => 
        cat.isBudgetable !== false && cat.active !== false && cat.isActive !== false
      );
      
      // Store flat list of all categories for subcategory selection
      const flatCategories = budgetableCategories.map(cat => ({
        categoryId: cat.categoryId || cat.id,
        name: cat.categoryName || cat.name,
        parentCategoryId: cat.parentCategoryId || cat.parentId || null
      }));
      setAllCategories(flatCategories);
      
      // Transform categories to include subcategories structure (for category dropdown)
      const categoriesWithSubs = budgetableCategories.map(cat => ({
        categoryId: cat.categoryId || cat.id,
        name: cat.categoryName || cat.name,
        subcategories: budgetableCategories
          .filter(sub => (sub.parentCategoryId || sub.parentId) === (cat.categoryId || cat.id))
          .map(sub => ({
            subcategoryId: sub.categoryId || sub.id,
            name: sub.categoryName || sub.name
          }))
      }));
      
      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setAllCategories([]);
    }
  };

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);
  
  // Update parent category names in budgets when categories are loaded
  useEffect(() => {
    if (allCategories.length > 0) {
      setBudgets(prevBudgets => {
        const updateBudgetsWithParentNames = (budgetList) => {
          return budgetList.map(budget => {
            if (budget.isSubcategory && budget.parentCategoryId && !budget.parentCategoryName) {
              const parentCat = allCategories.find(c => c.categoryId === budget.parentCategoryId);
              if (parentCat) {
                return { ...budget, parentCategoryName: parentCat.name };
              }
            }
            return budget;
          });
        };
        
        return {
          categoryBudgets: prevBudgets.categoryBudgets,
          subcategoryBudgets: updateBudgetsWithParentNames(prevBudgets.subcategoryBudgets)
        };
      });
    }
  }, [allCategories]);

  // Handle category selection to load subcategories
  const handleCategoryChange = (categoryId) => {
    const newFormData = { ...formData, categoryId, subcategoryId: '' };
    setFormData(newFormData);
    
    if (newFormData.budgetType === 'subcategory' && categoryId) {
      // For subcategory budgets, show all categories except the selected parent category
      // (since any category can be a subcategory of another category)
      const availableSubcategories = allCategories
        .filter(cat => cat.categoryId !== parseInt(categoryId))
        .map(cat => ({
          subcategoryId: cat.categoryId,
          name: cat.name
        }));
      setSubcategories(availableSubcategories);
    } else {
      // For category budgets, show direct subcategories only (legacy behavior)
    const selectedCategory = categories.find(c => c.categoryId === parseInt(categoryId));
    setSubcategories(selectedCategory?.subcategories || []);
    }
  };

  // Open modal for creating budget
  const handleOpenModal = () => {
    setEditMode(false);
    setCurrentBudget(null);
    setFormData({
      budgetType: 'category',
      categoryId: '',
      subcategoryId: '',
      amount: '',
      startDate: '',
      endDate: ''
    });
    setErrors({});
    setSubcategories([]);
    setModalOpen(true);
  };

  // Open modal for editing budget
  const handleEditBudget = (budget) => {
    setEditMode(true);
    setCurrentBudget(budget);
    
    // Determine budget type based on whether it's a subcategory or category
    const budgetType = budget.isSubcategory ? 'subcategory' : 'category';
    
    // For subcategory budgets, we need to find the parent category
    const budgetCategory = allCategories.find(c => c.categoryId === budget.categoryId);
    const parentCategoryId = budgetCategory?.parentCategoryId || budget.parentCategoryId || null;
    
    setFormData({
      budgetType: budgetType,
      categoryId: budgetType === 'subcategory' ? (parentCategoryId || '') : (budget.categoryId || ''),
      subcategoryId: budgetType === 'subcategory' ? budget.categoryId : '',
      amount: budget.amount.toString(),
      startDate: budget.startDate ? new Date(budget.startDate).toISOString().substring(0, 10) : '',
      endDate: budget.endDate ? new Date(budget.endDate).toISOString().substring(0, 10) : ''
    });
    
    // Set subcategories based on budget type
    if (budgetType === 'subcategory') {
      if (parentCategoryId) {
        // Show all categories except the parent
        const availableSubcategories = allCategories
          .filter(cat => cat.categoryId !== parseInt(parentCategoryId))
          .map(cat => ({
            subcategoryId: cat.categoryId,
            name: cat.name
          }));
        setSubcategories(availableSubcategories);
      } else {
        // If no parent found, show all categories
        const availableSubcategories = allCategories.map(cat => ({
          subcategoryId: cat.categoryId,
          name: cat.name
        }));
        setSubcategories(availableSubcategories);
      }
    } else {
      // For category budgets, show direct subcategories (legacy behavior, but can also show all)
      const selectedCategory = categories.find(c => c.categoryId === budget.categoryId);
      // For subcategory budget creation, we want all categories available
      // So we'll show all categories except the selected one
      const availableSubcategories = allCategories
        .filter(cat => cat.categoryId !== parseInt(budget.categoryId))
        .map(cat => ({
          subcategoryId: cat.categoryId,
          name: cat.name
        }));
      setSubcategories(availableSubcategories);
    }
    
    setErrors({});
    setModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (formData.budgetType === 'category' && !formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    } else if (formData.budgetType === 'subcategory') {
      if (!formData.categoryId) {
        newErrors.categoryId = 'Please select a parent category';
      }
      if (!formData.subcategoryId) {
        newErrors.subcategoryId = 'Please select a subcategory';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // Determine categoryId based on budget type
      // For subcategory budgets, use subcategoryId as the categoryId
      // For category budgets, use categoryId directly
      const categoryIdToUse = formData.budgetType === 'subcategory' 
        ? parseInt(formData.subcategoryId) 
        : parseInt(formData.categoryId);
      
      // For subcategory budgets, ALWAYS ensure the category has the correct parentCategoryId
      if (formData.budgetType === 'subcategory') {
        const parentCategoryId = parseInt(formData.categoryId);
        const subcategoryId = parseInt(formData.subcategoryId);
        
        console.log('Creating subcategory budget - updating category:', {
          subcategoryId: subcategoryId,
          parentCategoryId: parentCategoryId,
          'Current category in allCategories': allCategories.find(c => c.categoryId === subcategoryId)
        });
        
        // Always update the category to set the parentCategoryId (even if it might already be set)
        // This ensures the database has the correct relationship
        try {
          await categoryApi.update(subcategoryId, {
            parentCategoryId: parentCategoryId
          });
          console.log('Category updated successfully with parentCategoryId:', parentCategoryId);
          // Refresh categories after update to ensure local state is updated
          await fetchCategories();
        } catch (error) {
          console.error('Error updating category parent:', error);
          console.error('Error details:', error.response?.data);
          // Continue anyway - the budget will still be created, but might show in wrong section
        }
      }
      
      const payload = {
        categoryId: categoryIdToUse,
        amount: parseFloat(formData.amount),
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      if (editMode) {
        // For edit mode, handle category budget type changes
        if (formData.budgetType === 'category') {
          // If changing from subcategory to category, remove parentCategoryId
          const categoryIdToUpdate = parseInt(formData.categoryId);
          const currentCat = allCategories.find(c => c.categoryId === categoryIdToUpdate);
          if (currentCat && currentCat.parentCategoryId) {
            try {
              await categoryApi.update(categoryIdToUpdate, {
                parentCategoryId: null
              });
              await fetchCategories();
            } catch (error) {
              console.error('Error removing category parent:', error);
            }
          }
        }
        // Note: subcategory update is handled in the code block above
        
        await budgetApi.update(currentBudget.budgetId, payload);
        showToast('Budget updated successfully!', 'success');
      } else {
        await budgetApi.create(payload);
        showToast('Budget added successfully!', 'success');
      }
      
      setModalOpen(false);
      // Refresh budgets immediately - backend should have committed changes
      await fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      let errorMessage = 'Error saving budget. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      showToast(errorMessage, 'error');
    }
  };

  // Delete budget
  const handleDeleteBudget = async (budgetId) => {
    try {
      await budgetApi.delete(budgetId);
      showToast('Budget deleted successfully!', 'success');
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      let errorMessage = 'Error deleting budget. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      showToast(errorMessage, 'error');
    }
  };

  // Calculate table progress
  const calculateTableProgress = (budgetArray) => {
    if (budgetArray.length === 0) return 0;
    const totalAmount = budgetArray.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetArray.reduce((sum, b) => sum + b.totalSpent, 0);
    return totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;
  };

  // Get progress color
  const getProgressColor = (percentage) => {
    if (percentage < 80) return '#22c55e';
    if (percentage <= 100) return '#eab308';
    return '#ef4444';
  };

  // Render budget row
  const renderBudgetRow = (budget) => {
    const budgetName = budget.categoryName || 'Unknown Category';
    const isSubcategory = budget.isSubcategory || false;
    const parentCategoryName = budget.parentCategoryName || null;

    return (
      <div key={budget.budgetId} className="bg-white rounded-xl shadow-sm p-4 mb-3 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Budget Name</p>
              <div>
                <p className="font-semibold text-gray-800">{budgetName}</p>
                {isSubcategory && parentCategoryName && (
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-purple-600 font-medium">Parent:</span> {parentCategoryName}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Amount</p>
              <p className="font-semibold text-gray-800">Rs {budget.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Spent</p>
              <p className="font-semibold text-gray-800">Rs {budget.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Remaining</p>
              <p className={`font-semibold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.abs(budget.remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Used</p>
              <p className="font-semibold" style={{ color: getProgressColor(budget.percentageUsed) }}>
                {budget.percentageUsed.toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditBudget(budget)}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteBudget(budget.budgetId)}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render budget table
  const renderBudgetTable = (title, budgetArray) => {
    const progress = calculateTableProgress(budgetArray);
    const progressColor = getProgressColor(progress);

    return (
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h2 className="text-xl font-semibold text-purple-600">{title}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{progress.toFixed(0)}%</span>
            <div className="w-48 sm:w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progressColor
                }}
              />
            </div>
          </div>
        </div>
        
        {budgetArray.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">No {title.toLowerCase()} yet</p>
          </div>
        ) : (
          <div>
            {budgetArray.map(budget => renderBudgetRow(budget))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "lg:pl-56" : "lg:pl-0"
        )}
      >
        <div className="p-4 sm:p-6 bg-white min-h-screen" style={{ fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif' }}>
          {/* Header */}
          <div className="mt-2 mb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] bg-clip-text text-transparent">Your Budgets</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your budgets by type and track spending progress</p>
      </div>

      {/* Add Budget Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleOpenModal}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:-translate-y-0.5 hover:bg-purple-700 transition-all duration-200"
        >
          Add Budget
        </button>
      </div>

      {/* Budget Tables */}
      {renderBudgetTable('Category Budgets', budgets.categoryBudgets)}
      {renderBudgetTable('Subcategory Budgets', budgets.subcategoryBudgets)}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">
              {editMode ? 'Edit Budget' : 'Create Budget'}
            </h2>

            {/* Budget Type Selector */}
            {!editMode && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Select the type of budget</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFormData({ ...formData, budgetType: 'category', subcategoryId: '' })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      formData.budgetType === 'category'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Category Budget
                  </button>
                  <button
                    onClick={() => {
                      const newBudgetType = 'subcategory';
                      setFormData({ ...formData, budgetType: newBudgetType, subcategoryId: '' });
                      // When switching to subcategory, if a category is selected, update subcategories list
                      if (formData.categoryId) {
                        const availableSubcategories = allCategories
                          .filter(cat => cat.categoryId !== parseInt(formData.categoryId))
                          .map(cat => ({
                            subcategoryId: cat.categoryId,
                            name: cat.name
                          }));
                        setSubcategories(availableSubcategories);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      formData.budgetType === 'subcategory'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Subcategory Budget
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Category Dropdown */}
              {(formData.budgetType === 'category' || formData.budgetType === 'subcategory') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.budgetType === 'subcategory' ? 'Parent Category' : 'Category'}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  >
                    <option value="">{formData.budgetType === 'subcategory' ? 'Select Parent Category' : 'Select Category'}</option>
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                </div>
              )}

              {/* Subcategory Dropdown */}
              {formData.budgetType === 'subcategory' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                  <select
                    value={formData.subcategoryId}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                    disabled={editMode || !formData.categoryId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map(sub => (
                      <option key={sub.subcategoryId} value={sub.subcategoryId}>{sub.name}</option>
                    ))}
                  </select>
                  {errors.subcategoryId && <p className="text-red-500 text-xs mt-1">{errors.subcategoryId}</p>}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter amount"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editMode ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
        
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform ${
              toastType === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
            style={{
              minWidth: '300px',
              maxWidth: '400px',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {toastType === 'success' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default Budget;
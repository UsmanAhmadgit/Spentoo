import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { categoryApi } from '../../api/categoryApi';

// Category Icons & Colors Mapping
const CATEGORY_ICONS = {
  Food: { icon: "🍔", color: "#FF7043" },
  Groceries: { icon: "🛒", color: "#66BB6A" },
  Transport: { icon: "🚗", color: "#42A5F5" },
  Fuel: { icon: "⛽", color: "#FFA726" },
  Salary: { icon: "💰", color: "#8E24AA" },
  Entertainment: { icon: "🎬", color: "#FFCA28" },
  Shopping: { icon: "🛍️", color: "#AB47BC" },
  Education: { icon: "📚", color: "#29B6F6" },
  Health: { icon: "💊", color: "#FF5252" },
  Utilities: { icon: "💡", color: "#4CAF50" },
  Rent: { icon: "🏠", color: "#795548" },
  Insurance: { icon: "🛡️", color: "#607D8B" },
  Savings: { icon: "🏦", color: "#009688" },
  Investment: { icon: "📈", color: "#3F51B5" },
  'Loan Payments': { icon: "💳", color: "#E91E63" },
  'Loan Repayments': { icon: "💵", color: "#4CAF50" },
  'Recurring Payments': { icon: "🔄", color: "#FF9800" },
  Online: { icon: "🌐", color: "#2196F3" },
  'Video Gaming': { icon: "🎮", color: "#9C27B0" },
  Gaming: { icon: "🎮", color: "#9C27B0" },
  Default: { icon: "📂", color: "#BDBDBD" }
};

const Categories = () => {
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

  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'Expense',
    icon: '',
    color: '',
    sortOrder: null
  });
  
  const [errors, setErrors] = useState({
    name: '',
    type: ''
  });

  const [nameFocused, setNameFocused] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });

  // Get icon and color for a category name (case-insensitive matching) - memoized
  const getCategoryStyle = useCallback((name) => {
    if (!name) return CATEGORY_ICONS.Default;
    
    // Try exact match first
    if (CATEGORY_ICONS[name]) {
      return CATEGORY_ICONS[name];
    }
    
    // Try case-insensitive match
    const normalizedName = name.trim();
    const matchingKey = Object.keys(CATEGORY_ICONS).find(
      key => key.toLowerCase() === normalizedName.toLowerCase()
    );
    
    if (matchingKey) {
      return CATEGORY_ICONS[matchingKey];
    }
    
    // Fallback to default
    return CATEGORY_ICONS.Default;
  }, []);
  
  // Helper function to show toast
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);
  
  // Helper function to show confirmation modal
  const showConfirm = useCallback((message, onConfirm) => {
    setConfirmModal({ open: true, message, onConfirm });
  }, []);
  
  // Close confirmation modal
  const closeConfirm = useCallback(() => {
    setConfirmModal({ open: false, message: '', onConfirm: null });
  }, []);

  // Fetch all categories - memoized
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryApi.getAll();
      const categoriesData = Array.isArray(response) ? response : response.categories || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      showToast('Error fetching categories. Please try again.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-update icon and color when name changes (only for new categories, not when editing)
  useEffect(() => {
    if (!currentCategory && formData.name && modalOpen) {
      const matchedStyle = getCategoryStyle(formData.name);
      // Auto-update to match the category name's predefined style
      setFormData(prev => ({
        ...prev,
        icon: matchedStyle.icon,
        color: matchedStyle.color
      }));
    }
  }, [formData.name, modalOpen, currentCategory]);

  // Toggle expand/collapse - memoized
  const toggleExpand = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Open modal for adding category - memoized
  const handleAddCategory = useCallback((parentId = null) => {
    setCurrentCategory(null);
    setParentCategoryId(parentId);
    const defaultStyle = CATEGORY_ICONS.Default;
    setFormData({ 
      name: '', 
      type: 'Expense',
      icon: defaultStyle.icon,
      color: defaultStyle.color,
      sortOrder: null
    });
    setErrors({ name: '', type: '' });
    setModalOpen(true);
  }, []);

  // Auto-update icon and color when name changes (if name matches a predefined category)
  useEffect(() => {
    if (!currentCategory && formData.name) {
      const matchedStyle = getCategoryStyle(formData.name);
      // Only auto-update if no custom icon/color was set
      if (!formData.icon || formData.icon === CATEGORY_ICONS.Default.icon) {
        setFormData(prev => ({
          ...prev,
          icon: matchedStyle.icon,
          color: matchedStyle.color
        }));
      }
    }
  }, [formData.name, currentCategory]);

  // Open modal for editing category - memoized
  const handleEditCategory = useCallback((category) => {
    setCurrentCategory(category);
    setParentCategoryId(category.parentCategoryId);
    const categoryName = category.categoryName || category.name;
    const mappedStyle = getCategoryStyle(categoryName);
    // Filter out "??" and invalid icons
    const validIcon = (category.icon && category.icon.trim() !== '' && category.icon.trim() !== '??') 
      ? category.icon.trim() 
      : mappedStyle.icon;
    const style = validIcon && category.color 
      ? { icon: validIcon, color: category.color }
      : mappedStyle;
    setFormData({ 
      name: categoryName, 
      type: category.type,
      icon: validIcon || style.icon,
      color: category.color || style.color,
      sortOrder: category.sortOrder || null
    });
    setErrors({ name: '', type: '' });
    setModalOpen(true);
  }, [getCategoryStyle]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    let newErrors = { name: '', type: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
      isValid = false;
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      try {
        // Determine icon and color if not set or invalid
        let icon = formData.icon;
        let color = formData.color;
        
        // Filter out "??" and empty icons - use mapped style if invalid
        const style = getCategoryStyle(formData.name);
        if (!icon || icon.trim() === '' || icon.trim() === '??') {
          icon = style.icon;
        } else {
          icon = icon.trim();
        }
        
        if (!color || color.trim() === '') {
          color = style.color;
        } else {
          color = color.trim();
        }
        
        // Prepare data for API - map name to categoryName and uppercase type
        const apiData = {
          categoryName: formData.name,
          type: formData.type.toUpperCase(),
          icon: icon,
          color: color
        };
        
        // Only include parentCategoryId if it's not null
        if (parentCategoryId) {
          apiData.parentCategoryId = parentCategoryId;
        }
        
        // Include sortOrder if set
        if (formData.sortOrder !== null && formData.sortOrder !== undefined && formData.sortOrder !== '') {
          apiData.sortOrder = parseInt(formData.sortOrder);
        }
        
        if (currentCategory) {
          // Update category
          await categoryApi.update(currentCategory.categoryId, apiData);
        } else {
          // Create category
          await categoryApi.create(apiData);
        }
        
        setModalOpen(false);
        fetchCategories();
        showToast(currentCategory ? 'Category updated successfully!' : 'Category added successfully!', 'success');
      } catch (error) {
        console.error('Error saving category:', error);
        // Better error message extraction
        let errorMessage = 'Error saving category. Please try again.';
        if (error.response?.data) {
          // Backend returns string for IllegalStateException
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error.response.data === 'object') {
            // Try to extract first error message from object
            const messages = Object.values(error.response.data).filter(msg => typeof msg === 'string');
            if (messages.length > 0) {
              errorMessage = messages[0];
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        showToast(errorMessage, 'error');
      }
    }
  };

  // Delete category - memoized
  const handleDelete = useCallback((categoryId) => {
    showConfirm(
      'Are you sure you want to delete this category?',
      async () => {
      try {
        await categoryApi.delete(categoryId);
        fetchCategories();
          showToast('Category deleted successfully!', 'success');
          closeConfirm();
      } catch (error) {
        console.error('Error deleting category:', error);
          let errorMessage = 'Error deleting category. Please try again.';
          if (error.response?.data) {
            if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
    }
          }
          showToast(errorMessage, 'error');
          closeConfirm();
        }
      }
    );
  }, [showConfirm, closeConfirm, fetchCategories, showToast]);

  // Restore category - memoized
  const handleRestore = useCallback(async (categoryId) => {
    try {
      await categoryApi.restore(categoryId);
      fetchCategories();
      showToast('Category restored successfully!', 'success');
    } catch (error) {
      console.error('Error restoring category:', error);
      let errorMessage = 'Error restoring category. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      showToast(errorMessage, 'error');
    }
  }, [fetchCategories, showToast]);

  // Export categories - memoized
  const handleExport = useCallback(async () => {
    try {
      const blob = await categoryApi.export();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'categories.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Categories exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting categories:', error);
      showToast('Error exporting categories. Please try again.', 'error');
    }
  }, [showToast]);

  // Render category item
  const renderCategory = (category, level = 0) => {
    const categoryName = category.categoryName || category.name;
    
    // Get mapped style as fallback
    const mappedStyle = getCategoryStyle(categoryName);
    
    // Check if category name matches a predefined category (not Default)
    const isPredefinedCategory = Object.keys(CATEGORY_ICONS).some(
      key => key !== 'Default' && key.toLowerCase() === categoryName.toLowerCase()
    );
    
    // For predefined categories, always use mapped icon to ensure correct icon
    // For custom categories, use database icon if valid, otherwise use mapped icon
    let finalIcon;
    if (isPredefinedCategory) {
      // Always use mapped icon for predefined categories (Insurance, Shopping, etc.)
      finalIcon = mappedStyle.icon;
    } else {
      // For custom categories, use database icon if valid, otherwise use mapped icon
      const dbIcon = category.icon && category.icon.trim() !== '' && category.icon.trim() !== '??' 
        ? category.icon.trim() 
        : null;
      finalIcon = dbIcon || mappedStyle.icon;
    }
    
    // Use database color if it exists and is valid, otherwise use mapped color
    const dbColor = category.color && category.color.trim() !== '' ? category.color.trim() : null;
    
    const style = {
      icon: finalIcon,
      color: dbColor || mappedStyle.color
    };
    
    
    const subcategories = categories.filter(c => c.parentCategoryId === category.categoryId);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories[category.categoryId];

    return (
      <div key={category.categoryId} style={styles.categoryWrapper}>
        <div 
          style={{
            ...styles.categoryItem,
            marginLeft: `${level * 30}px`,
            // Check both isActive and active (Java boolean might be serialized as 'active')
            opacity: (category.isActive !== false && category.active !== false) ? 1 : 0.5,
            textDecoration: (category.isActive !== false && category.active !== false) ? 'none' : 'line-through'
          }}
        >
          <div style={styles.categoryLeft}>
            {hasSubcategories && (
              <button
                onClick={() => toggleExpand(category.categoryId)}
                style={styles.expandButton}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span 
              style={{ 
                ...styles.categoryIcon, 
                backgroundColor: style.color || CATEGORY_ICONS.Default.color,
              }}
              title={`${categoryName} - ${style.icon || CATEGORY_ICONS.Default.icon}`}
              role="img"
              aria-label={`${categoryName} icon`}
            >
              {style.icon}
            </span>
            <div style={styles.categoryInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.categoryName}>{categoryName}</span>
                {category.sortOrder != null && (
                  <span style={styles.sortOrderBadge} title={`Sort Order: ${category.sortOrder}`}>
                    #{category.sortOrder}
                  </span>
                )}
              </div>
              <span 
                style={{
                  ...styles.categoryType,
                  color: category.type === 'INCOME' || category.type === 'Income' ? '#43A047' : '#E53935'
                }}
              >
                {category.type === 'INCOME' ? 'Income' : category.type === 'EXPENSE' ? 'Expense' : category.type}
              </span>
            </div>
          </div>

          <div style={styles.categoryActions}>
            {(category.isActive !== false && category.active !== false) ? (
              <>
                <button
                  onClick={() => handleEditCategory(category)}
                  style={{ ...styles.actionButton, ...styles.editButton }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.categoryId)}
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                >
                  Delete
                </button>
                <button
                  onClick={() => handleAddCategory(category.categoryId)}
                  style={{ ...styles.actionButton, ...styles.addSubButton }}
                >
                  Add Sub
                </button>
              </>
            ) : (
              <button
                onClick={() => handleRestore(category.categoryId)}
                style={{ ...styles.actionButton, ...styles.restoreButton }}
              >
                Restore
              </button>
            )}
          </div>
        </div>

        {hasSubcategories && isExpanded && (
          <div>
            {subcategories
              .sort((a, b) => {
                // Sort subcategories by sortOrder first (nulls/undefined treated as high numbers), then by name
                const aOrder = a.sortOrder != null ? a.sortOrder : 999999;
                const bOrder = b.sortOrder != null ? b.sortOrder : 999999;
                
                if (aOrder !== bOrder) {
                  return aOrder - bOrder;
                }
                
                // If same sort order, sort alphabetically by name
                const nameA = (a.categoryName || a.name || '').toLowerCase();
                const nameB = (b.categoryName || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
              })
              .map(sub => renderCategory(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get top-level categories and sort by sortOrder, then by name - memoized
  const topLevelCategories = useMemo(() => categories
    .filter(c => !c.parentCategoryId || c.parentCategoryId === null)
    .sort((a, b) => {
      // Sort by sortOrder first (nulls/undefined treated as high numbers), then by name
      const aOrder = a.sortOrder != null ? a.sortOrder : 999999;
      const bOrder = b.sortOrder != null ? b.sortOrder : 999999;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same sort order, sort alphabetically by name
      const nameA = (a.categoryName || a.name || '').toLowerCase();
      const nameB = (b.categoryName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }), [categories]);

  // Separate active and deleted categories - memoized
  const activeCategories = useMemo(() => 
    topLevelCategories.filter(c => c.isActive !== false && c.active !== false),
    [topLevelCategories]
  );

  const deletedCategories = useMemo(() => 
    topLevelCategories.filter(c => c.isActive === false || c.active === false),
    [topLevelCategories]
  );

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
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.titleContainer}>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] bg-clip-text text-transparent">Your Categories</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your expense and income categories</p>
            </div>
            <div style={styles.headerActions}>
          <button
            onClick={() => handleAddCategory()}
            style={styles.addButton}
          >
            Add Category
          </button>
          <button
            onClick={handleExport}
            style={styles.exportButton}
          >
            Export
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div style={styles.categoriesList}>
        {topLevelCategories.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No categories yet. Add your first category!</p>
          </div>
        ) : (
          <>
            {/* Active Categories */}
            {activeCategories.length > 0 && (
              <>
                {activeCategories.map(category => renderCategory(category))}
              </>
            )}
            
            {/* Deleted Categories Section */}
            {deletedCategories.length > 0 && (
              <>
                <div style={styles.deletedSectionHeader}>
                  <h2 style={styles.deletedHeading}>Deleted Categories</h2>
                  <p style={styles.deletedDescription}>Restore or permanently manage deleted categories</p>
                </div>
                {deletedCategories.map(category => renderCategory(category))}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {currentCategory ? 'Edit Category' : 'Add Category'}
            </h2>

            <div style={styles.formWrapper}>
              {/* Name Field */}
              <div style={styles.inputContainer}>
                <input
                  type="text"
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  style={styles.input}
                />
                <label
                  htmlFor="categoryName"
                  style={{
                    ...styles.label,
                    ...(nameFocused || formData.name ? styles.labelFloat : {})
                  }}
                >
                  Category Name
                </label>
                {errors.name && <span style={styles.error}>{errors.name}</span>}
              </div>

              {/* Type Dropdown */}
              <div style={styles.inputContainer}>
                <select
                  id="categoryType"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    ...styles.select,
                    color: formData.type === 'Income' ? '#43A047' : '#E53935'
                  }}
                >
                  <option value="Expense" style={{ color: '#E53935' }}>Expense</option>
                  <option value="Income" style={{ color: '#43A047' }}>Income</option>
                </select>
                <label htmlFor="categoryType" style={styles.selectLabel}>
                  Type
                </label>
                {errors.type && <span style={styles.error}>{errors.type}</span>}
              </div>

              {/* Icon & Color Selector */}
              <div style={styles.inputContainer}>
                <label htmlFor="categoryStyle" style={styles.selectLabel}>
                  Icon & Color
                </label>
                <select
                  id="categoryStyle"
                  value={(() => {
                    // Find the matching style key based on current icon and color
                    const currentIcon = formData.icon || getCategoryStyle(formData.name).icon;
                    const currentColor = formData.color || getCategoryStyle(formData.name).color;
                    const matchingKey = Object.keys(CATEGORY_ICONS).find(
                      key => CATEGORY_ICONS[key].icon === currentIcon && CATEGORY_ICONS[key].color === currentColor
                    );
                    return matchingKey || 'Default';
                  })()}
                  onChange={(e) => {
                    const selectedStyle = CATEGORY_ICONS[e.target.value] || CATEGORY_ICONS.Default;
                    setFormData({ 
                      ...formData, 
                      icon: selectedStyle.icon, 
                      color: selectedStyle.color 
                    });
                  }}
                  style={styles.select}
                >
                  {Object.keys(CATEGORY_ICONS).map((key) => {
                    const style = CATEGORY_ICONS[key];
                    return (
                      <option key={key} value={key} style={{ color: '#000' }}>
                        {style.icon} {key} ({style.color})
                      </option>
                    );
                  })}
                </select>
                {/* Preview of selected icon and color */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <span 
                    style={{
                      ...styles.categoryIcon,
                      backgroundColor: formData.color || getCategoryStyle(formData.name).color,
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {formData.icon || getCategoryStyle(formData.name).icon}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Preview</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Icon: {formData.icon || getCategoryStyle(formData.name).icon} | 
                      Color: {formData.color || getCategoryStyle(formData.name).color}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort Order Field */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '10px'
              }}>
                <label htmlFor="sortOrder" style={{
                  color: '#1976D2',
                  fontSize: '16px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  Sort Order:
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  value={formData.sortOrder || ''}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value ? parseInt(e.target.value) : null })}
                  style={{
                    flex: '1',
                    maxWidth: '120px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    color: '#000000',
                    border: '2px solid #1E88E5',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Order"
                />
                <span style={{
                  fontSize: '12px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  (lower numbers appear first)
                </span>
              </div>

              {/* Full Preview */}
              {formData.name && (
                <div style={styles.previewContainer}>
                  <span style={{ fontWeight: '600', marginRight: '10px' }}>Full Preview:</span>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}>
                  <span 
                    style={{
                      ...styles.categoryIcon,
                        backgroundColor: formData.color || getCategoryStyle(formData.name).color,
                        fontSize: '24px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                  >
                      {formData.icon || getCategoryStyle(formData.name).icon}
                  </span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                    {formData.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: formData.type === 'Income' ? '#43A047' : '#E53935',
                        fontWeight: '500'
                      }}>
                        {formData.type}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={styles.submitButton}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#43A047';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.color = '#43A047';
                  }}
                >
                  {currentCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 text-white px-4 py-2 rounded-lg shadow-xl transition-opacity duration-300 z-50"
          style={{
            backgroundColor: toastType === 'success' ? '#43A047' : '#E53935'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={closeConfirm}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#212121] mb-4">Confirm Action</h3>
            <p className="text-gray-700 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  }
                }}
                className="px-4 py-2 bg-[#E53935] text-white rounded-lg font-semibold hover:bg-[#C62828] transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    transition: 'all 0.3s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  titleContainer: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.875rem', // text-3xl equivalent (30px)
    fontWeight: '800', // font-extrabold equivalent
    background: 'linear-gradient(to right, #7E57C2, #8E24AA)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'left',
    marginBottom: '0',
  },
  titleDescription: {
    fontSize: '0.875rem', // text-sm equivalent (14px)
    color: '#6B7280', // text-gray-600 equivalent
    marginTop: '4px', // mt-1 equivalent
    textAlign: 'left',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#43A047',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#1E88E5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  categoriesList: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  emptyText: {
    fontSize: '18px',
    margin: '0'
  },
  categoryWrapper: {
    marginBottom: '5px'
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#FAFAFA',
    borderRadius: '8px',
    marginBottom: '8px',
    transition: 'all 0.3s ease',
    border: '1px solid #E0E0E0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  categoryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  expandButton: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
    padding: '5px',
    width: '20px',
    transition: 'transform 0.3s ease'
  },
  categoryIcon: {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    lineHeight: '1',
    flexShrink: 0,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease',
    cursor: 'default',
    fontWeight: 'normal',
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", "EmojiSymbols-Linux", "Twemoji Mozilla", "Noto Emoji", sans-serif',
    textAlign: 'center',
    userSelect: 'none'
  },
  categoryInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  categoryName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000'
  },
  sortOrderBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#E0E0E0',
    padding: '2px 6px',
    borderRadius: '10px',
    fontFamily: 'monospace'
  },
  categoryType: {
    fontSize: '12px',
    fontWeight: '500'
  },
  categoryActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  actionButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  editButton: {
    backgroundColor: '#1E88E5',
    color: '#ffffff'
  },
  deleteButton: {
    backgroundColor: '#E53935',
    color: '#ffffff'
  },
  addSubButton: {
    backgroundColor: '#43A047',
    color: '#ffffff'
  },
  restoreButton: {
    backgroundColor: '#FF9800',
    color: '#ffffff'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#FAFAFA',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #7E57C2, #8E24AA)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '25px',
    textAlign: 'center'
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '10px'
  },
  input: {
    width: '100%',
    padding: '12px 0 8px 0',
    fontSize: '16px',
    color: '#000000',
    border: 'none',
    borderBottom: '2px solid #1E88E5',
    backgroundColor: 'transparent',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  },
  label: {
    position: 'absolute',
    left: '0',
    top: '12px',
    color: '#1E88E5',
    fontSize: '16px',
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
    transformOrigin: 'left top'
  },
  labelFloat: {
    transform: 'translateY(-24px)',
    fontSize: '12px',
    color: '#1976D2'
  },
  select: {
    width: '100%',
    padding: '12px 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderBottom: '2px solid #1E88E5',
    backgroundColor: 'transparent',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  selectLabel: {
    display: 'block',
    color: '#1976D2',
    fontSize: '12px',
    marginBottom: '5px',
    fontWeight: '500'
  },
  error: {
    display: 'block',
    color: '#E53935',
    fontSize: '12px',
    marginTop: '6px'
  },
  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    fontSize: '14px'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#E0E0E0',
    color: '#000',
    border: 'none',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#43A047',
    border: '2px solid #43A047',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    fontFamily: 'inherit'
  },
  deletedSectionHeader: {
    marginTop: '40px',
    marginBottom: '20px',
    paddingTop: '30px',
    borderTop: '2px solid #E0E0E0'
  },
  deletedHeading: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#757575',
    marginBottom: '8px',
    textAlign: 'left'
  },
  deletedDescription: {
    fontSize: '0.875rem',
    color: '#9E9E9E',
    textAlign: 'left',
    marginBottom: '0'
  }
};

export default Categories;
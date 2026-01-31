// School Management Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSchools, createSchool, updateSchool, deleteSchool, getLandingPagePricingPlans } from '../../services/p2lAdminService';
import LICENSE_PLANS from '../../constants/licensePlans';
import './SchoolManagement.css';

function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'school',
    plan: '',
    contact: ''
  });

  useEffect(() => {
    fetchSchools();
    fetchPricingPlans();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await getSchools();
      setSchools(response.data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      alert('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await getLandingPagePricingPlans();
      if (response.success && response.plans && response.plans.length > 0) {
        setPricingPlans(response.plans);
        // Set default plan if not already set
        if (!formData.plan && response.plans.length > 0) {
          setFormData(prev => ({ ...prev, plan: response.plans[0].id }));
        }
      } else {
        // Use fallback plans
        setFallbackPlans();
      }
    } catch (error) {
      console.error('Failed to fetch pricing plans:', error);
      // Use fallback plans
      setFallbackPlans();
    } finally {
      setLoadingPlans(false);
    }
  };

  // Helper function to use fallback pricing plans
  const setFallbackPlans = () => {
    console.warn('No pricing plans found in landing page, using fallback constants');
    const fallbackPlans = Object.entries(LICENSE_PLANS).map(([key, value]) => ({
      id: key,
      name: value.name,
      teacher_limit: value.teacher_limit,
      student_limit: value.student_limit,
      price: value.price
    }));
    setPricingPlans(fallbackPlans);
    if (!formData.plan) {
      setFormData(prev => ({ ...prev, plan: 'starter' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get plan_info based on selected plan from landing page pricing
      const selectedPlan = pricingPlans.find(p => p.id === formData.plan);
      if (!selectedPlan) {
        console.error('Invalid plan selected:', formData.plan);
        alert('Please select a valid subscription plan');
        return;
      }

      // Prepare data with plan_info
      const schoolData = {
        ...formData,
        plan_info: {
          teacher_limit: selectedPlan.teacher_limit,
          student_limit: selectedPlan.student_limit,
          price: selectedPlan.price
        }
      };

      if (editingSchool) {
        await updateSchool(editingSchool._id, schoolData);
        alert('School updated successfully');
      } else {
        await createSchool(schoolData);
        alert('School created successfully');
      }
      setShowForm(false);
      setEditingSchool(null);
      setFormData({
        organization_name: '',
        organization_type: 'school',
        plan: pricingPlans.length > 0 ? pricingPlans[0].id : '',
        contact: ''
      });
      fetchSchools();
    } catch (error) {
      console.error('Failed to save school:', error);
      alert(error.message || 'Failed to save school');
    }
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      organization_name: school.organization_name,
      organization_type: school.organization_type,
      plan: school.plan,
      contact: school.contact || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school?')) {
      return;
    }
    try {
      await deleteSchool(id);
      alert('School deleted successfully');
      fetchSchools();
    } catch (error) {
      console.error('Failed to delete school:', error);
      alert(error.message || 'Failed to delete school');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSchool(null);
    setFormData({
      organization_name: '',
      organization_type: 'school',
      plan: pricingPlans.length > 0 ? pricingPlans[0].id : '',
      contact: ''
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="school-management">
      <header className="page-header">
        <div>
          <h1>School Management</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create School
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingSchool ? 'Edit School' : 'Create New School'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Organization Type</label>
                <select
                  name="organization_type"
                  value={formData.organization_type}
                  onChange={handleInputChange}
                >
                  <option value="school">School</option>
                  <option value="university">University</option>
                  <option value="training_center">Training Center</option>
                </select>
              </div>

              <div className="form-group">
                <label>License Plan *</label>
                {loadingPlans ? (
                  <div>Loading pricing plans...</div>
                ) : pricingPlans.length > 0 ? (
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    required
                  >
                    {pricingPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.teacher_limit} Teachers, {plan.student_limit} Students (${(plan.price || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
                    ⚠️ No pricing plans found. Please create a pricing block in the Landing Page Manager first.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Contact Info</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Email or phone"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={loadingPlans || pricingPlans.length === 0}>
                  {editingSchool ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schools-grid">
        {schools.length === 0 ? (
          <p className="no-data">No schools found. Create your first school!</p>
        ) : (
          schools.map((school) => (
            <div key={school._id} className="school-card">
              <h3>{school.organization_name}</h3>
              <div className="school-details">
                <p><strong>Type:</strong> {school.organization_type}</p>
                <p><strong>Plan:</strong> {school.plan.toUpperCase()}</p>
                <p><strong>Teachers:</strong> {school.current_teachers || 0} / {school.plan_info.teacher_limit}</p>
                <p><strong>Students:</strong> {school.current_students || 0} / {school.plan_info.student_limit}</p>
                <p><strong>Price:</strong> ${school.plan_info.price}</p>
                {school.contact && <p><strong>Contact:</strong> {school.contact}</p>}
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(school)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(school._id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SchoolManagement;

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FiSave, FiX, FiCalendar, FiBook, FiFlag, FiActivity } from 'react-icons/fi';

function AssignmentForm({ assignment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (assignment) {
      // Format date for input (YYYY-MM-DD)
      let formattedDate = '';
      if (assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        if (!isNaN(dueDate.getTime())) {
          formattedDate = dueDate.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        course: assignment.course || '',
        dueDate: formattedDate || '',
        priority: assignment.priority || 'medium',
        status: assignment.status || 'pending'
      });
    }
  }, [assignment]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.course.trim()) {
      newErrors.course = 'Course is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Ensure dueDate is properly formatted
      const submissionData = {
        ...formData,
        title: formData.title.trim(),
        course: formData.course.trim(),
        description: formData.description.trim()
      };
      
      onSubmit(submissionData);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="assignment-form">
      <h4 className="mb-4 text-primary">
        {assignment ? '✏️ Edit Assignment' : '➕ Add New Assignment'}
      </h4>
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={12} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">
                <FiBook className="me-2" />
                Assignment Title *
              </Form.Label>
              <Form.Control
                type="text"
                name="title"
                placeholder="e.g., Final Project, Chapter 5 Homework"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!errors.title}
                className={errors.title ? 'is-invalid' : ''}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Be specific about what needs to be done
              </Form.Text>
            </Form.Group>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">
                <FiBook className="me-2" />
                Course / Subject *
              </Form.Label>
              <Form.Control
                type="text"
                name="course"
                placeholder="e.g., Calculus 101, Computer Science"
                value={formData.course}
                onChange={handleChange}
                isInvalid={!!errors.course}
                className={errors.course ? 'is-invalid' : ''}
              />
              <Form.Control.Feedback type="invalid">
                {errors.course}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">
                <FiCalendar className="me-2" />
                Due Date *
              </Form.Label>
              <Form.Control
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={today}
                isInvalid={!!errors.dueDate}
                className={errors.dueDate ? 'is-invalid' : ''}
              />
              <Form.Control.Feedback type="invalid">
                {errors.dueDate}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">
                <FiFlag className="me-2" />
                Priority
              </Form.Label>
              <Form.Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {formData.priority === 'high' && 'Important! Needs immediate attention'}
                {formData.priority === 'medium' && 'Important but not urgent'}
                {formData.priority === 'low' && 'Can be done later'}
              </Form.Text>
            </Form.Group>
          </Col>

          <Col md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">
                <FiActivity className="me-2" />
                Status
              </Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🚧 In Progress</option>
                <option value="completed">✅ Completed</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Track your progress
              </Form.Text>
            </Form.Group>
          </Col>

          <Col md={12} className="mb-4">
            <Form.Group>
              <Form.Label className="fw-bold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                placeholder="Add details, instructions, or notes about this assignment..."
                value={formData.description}
                onChange={handleChange}
                style={{ resize: 'vertical' }}
              />
              <Form.Text className="text-muted">
                Optional: Add specific requirements or reminders
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {/* Form Actions */}
        <div className="d-flex justify-content-between align-items-center border-top pt-4">
          <div>
            <small className="text-muted">
              * Required fields
            </small>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={onCancel}
              className="d-flex align-items-center"
            >
              <FiX className="me-2" /> Cancel
            </Button>
            
            <Button 
              variant="primary" 
              type="submit"
              className="d-flex align-items-center"
            >
              <FiSave className="me-2" />
              {assignment ? 'Update Assignment' : 'Save Assignment'}
            </Button>
          </div>
        </div>

        {/* Quick Tips */}
        {!assignment && (
          <div className="mt-4 p-3 bg-light rounded">
            <h6 className="text-primary mb-2">💡 Quick Tips:</h6>
            <div className="row small text-muted">
              <div className="col-md-6">
                <ul className="mb-0">
                  <li>Set realistic due dates</li>
                  <li>Use High priority for urgent assignments</li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="mb-0">
                  <li>Update status as you progress</li>
                  <li>Add detailed descriptions for complex tasks</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
}

export default AssignmentForm;
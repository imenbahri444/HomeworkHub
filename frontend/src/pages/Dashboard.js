import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Button, Form, 
  Badge, Alert, Spinner 
} from 'react-bootstrap';
import { FiLogOut, FiPlus, FiEdit, FiTrash2, FiCheck, FiCalendar } from 'react-icons/fi';
import API from '../utils/api';
import AssignmentForm from '../components/AssignmentForm';

function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAssignments();
  }, [user, navigate]);

  // ====== FETCH ASSIGNMENTS ======
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      // ✅ Use API instance which handles token automatically
      const response = await API.get('/assignments'); 
      setAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch assignments:', err.response || err.message);
      setAssignments([]);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ====== LOGOUT ======
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // ====== ADD ASSIGNMENT ======
  const handleAddAssignment = async (assignmentData) => {
    try {
      const response = await API.post('/assignments', assignmentData);
      setAssignments([...assignments, response.data]);
      setShowForm(false);
      setError('Assignment added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('❌ Error adding assignment:', err.response || err.message);
      setError(err.response?.data?.message || 'Failed to add assignment');
    }
  };

  // ====== UPDATE ASSIGNMENT ======
  const handleUpdateAssignment = async (id, updatedData) => {
    try {
      const response = await API.put(`/assignments/${id}`, updatedData);
      setAssignments(assignments.map(a => a._id === id ? response.data : a));
      setEditingAssignment(null);
      setError('Assignment updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('❌ Update error:', err.response || err.message);
      setError(err.response?.data?.message || 'Failed to update assignment');
    }
  };

  // ====== DELETE ASSIGNMENT ======
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await API.delete(`/assignments/${id}`);
      setAssignments(assignments.filter(a => a._id !== id));
      alert('✅ Assignment deleted successfully!');
    } catch (err) {
      console.error('❌ Delete error:', err.response || err.message);
      alert(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  // ====== TOGGLE STATUS ======
  const handleToggleStatus = async (id) => {
    const assignment = assignments.find(a => a._id === id);
    if (!assignment) return;
    const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
    try {
      const response = await API.put(`/assignments/${id}`, { status: newStatus });
      setAssignments(assignments.map(a => a._id === id ? response.data : a));
    } catch (err) {
      console.error('❌ Toggle status error:', err.response || err.message);
      setError('Failed to update status');
    }
  };

  // ====== FILTERED ASSIGNMENTS ======
  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return assignment.status === 'pending';
    if (filter === 'completed') return assignment.status === 'completed';
    if (filter === 'high') return assignment.priority === 'high';
    if (filter === 'overdue') {
      const dueDate = new Date(assignment.dueDate);
      const today = new Date();
      return dueDate < today && assignment.status !== 'completed';
    }
    return true;
  });

  // ====== STATS ======
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    highPriority: assignments.filter(a => a.priority === 'high').length,
    overdue: assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const today = new Date();
      return dueDate < today && a.status !== 'completed';
    }).length,
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate, status) => {
    const due = new Date(dueDate);
    const today = new Date();
    return due < today && status !== 'completed';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your assignments...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-3 p-md-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* === HEADER === */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="text-primary mb-2">HomeworkHub</h1>
          <p className="text-muted mb-0">
            Welcome back, <strong>{user?.username}</strong>! 
            <span className="ms-2 text-muted">{user?.email}</span>
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="outline-danger" onClick={handleLogout}>
            <FiLogOut className="me-2" /> Logout
          </Button>
        </Col>
      </Row>

      {/* === ERROR ALERT === */}
      {error && (
        <Alert variant="warning" onClose={() => setError('')} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      {/* === STATS CARDS === */}
      <Row className="mb-4 g-3">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <h3 className="text-primary">{stats.total}</h3>
              <p className="text-muted mb-0">Total</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className={`border-0 shadow-sm h-100 ${stats.pending > 0 ? 'border-warning' : ''}`}>
            <Card.Body className="text-center">
              <h3 className={stats.pending > 0 ? 'text-warning' : 'text-secondary'}>{stats.pending}</h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              <h3 className="text-success">{stats.completed}</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className={`border-0 shadow-sm h-100 ${stats.overdue > 0 ? 'border-danger' : ''}`}>
            <Card.Body className="text-center">
              <h3 className={stats.overdue > 0 ? 'text-danger' : 'text-secondary'}>{stats.overdue}</h3>
              <p className="text-muted mb-0">Overdue</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* === CONTROLS === */}
      <Row className="mb-4 align-items-center">
        <Col md={8}>
          <Button variant="primary" onClick={() => setShowForm(true)} className="me-3 mb-2 mb-md-0">
            <FiPlus className="me-2" /> Add New Assignment
          </Button>
          
          <div className="d-inline-flex flex-wrap gap-2">
            <Button 
              variant={filter === 'all' ? 'primary' : 'outline-primary'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({stats.total})
            </Button>
            <Button 
              variant={filter === 'pending' ? 'warning' : 'outline-warning'} 
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending ({stats.pending})
            </Button>
            <Button 
              variant={filter === 'completed' ? 'success' : 'outline-success'} 
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed ({stats.completed})
            </Button>
            <Button 
              variant={filter === 'high' ? 'danger' : 'outline-danger'} 
              size="sm"
              onClick={() => setFilter('high')}
            >
              High Priority ({stats.highPriority})
            </Button>
            {stats.overdue > 0 && (
              <Button 
                variant={filter === 'overdue' ? 'danger' : 'outline-danger'} 
                size="sm"
                onClick={() => setFilter('overdue')}
              >
                ⚠️ Overdue ({stats.overdue})
              </Button>
            )}
          </div>
        </Col>
        <Col md={4} className="text-md-end mt-2 mt-md-0">
          <Form.Text className="text-muted">
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </Form.Text>
        </Col>
      </Row>

      {/* === ASSIGNMENT FORM === */}
      {(showForm || editingAssignment) && (
        <Card className="mb-4 shadow border-primary">
          <Card.Body>
            <AssignmentForm
              assignment={editingAssignment}
              onSubmit={editingAssignment ? 
                (data) => handleUpdateAssignment(editingAssignment._id, data) : 
                handleAddAssignment
              }
              onCancel={() => {
                setShowForm(false);
                setEditingAssignment(null);
              }}
            />
          </Card.Body>
        </Card>
      )}

      {/* === ASSIGNMENTS LIST === */}
      <Row>
        {filteredAssignments.length === 0 ? (
          <Col xs={12}>
            <Card className="text-center p-5 border-dashed bg-light">
              <Card.Body>
                <div className="mb-4">
                  <h1 className="text-muted display-1">📚</h1>
                  <h3 className="mt-3">
                    {assignments.length === 0 
                      ? "Welcome to Your HomeworkHub space"
                      : "No assignments found"
                    }
                  </h3>
                  <p className="text-muted">
                    {assignments.length === 0 
                      ? "You don't have any assignments yet. Add your first one to get started!"
                      : "No assignments match your current filter. Try changing the filter above."
                    }
                  </p>
                </div>
                
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => setShowForm(true)}
                  >
                    <FiPlus className="me-2" /> Add Your First Assignment
                  </Button>
                  
                  {assignments.length > 0 && filter !== 'all' && (
                    <Button 
                      variant="outline-secondary" 
                      size="lg"
                      onClick={() => setFilter('all')}
                    >
                      Show All Assignments
                    </Button>
                  )}
                </div>
                
                {assignments.length === 0 && (
                  <div className="mt-5 text-start" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h5>💡 Quick Tips:</h5>
                    <ul className="text-muted">
                      <li>Click "Add New Assignment" to create your first task</li>
                      <li>Set priorities (High, Medium, Low) to stay organized</li>
                      <li>Mark assignments as complete when done</li>
                      <li>Filter by status to focus on what's important</li>
                      <li>Set due dates to track deadlines</li>
                    </ul>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredAssignments.map(assignment => {
            const overdue = isOverdue(assignment.dueDate, assignment.status);
            
            return (
              <Col key={assignment._id} xs={12} md={6} lg={4} className="mb-3">
                <Card className={`h-100 shadow-sm hover-shadow transition-all ${assignment.status === 'completed' ? 'opacity-75' : ''} ${overdue ? 'border-danger' : ''}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="mb-0 flex-grow-1 me-2">
                        {assignment.title}
                      </Card.Title>
                      <Badge bg={
                        assignment.priority === 'high' ? 'danger' :
                        assignment.priority === 'medium' ? 'warning' : 'success'
                      } className="text-uppercase">
                        {assignment.priority}
                      </Badge>
                    </div>
                    
                    <Card.Subtitle className="mb-2 text-muted d-flex align-items-center">
                      <span className="me-2">📚</span>
                      {assignment.course}
                    </Card.Subtitle>
                    
                    {assignment.description && (
                      <Card.Text className="mb-3 text-muted">
                        {assignment.description}
                      </Card.Text>
                    )}
                    
                    <div className="d-flex align-items-center mb-3">
                      <FiCalendar className="me-2 text-muted" />
                      <span className={`${overdue ? 'text-danger fw-bold' : 'text-muted'}`}>
                        Due: {formatDate(assignment.dueDate)}
                        {overdue && ' ⚠️ Overdue'}
                      </span>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg={
                        assignment.status === 'completed' ? 'success' :
                        assignment.status === 'in-progress' ? 'info' : 'warning'
                      } className="text-uppercase">
                        {assignment.status}
                      </Badge>
                      
                      <div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          title="Edit"
                          onClick={() => setEditingAssignment(assignment)}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant={assignment.status === 'completed' ? 'outline-secondary' : 'outline-success'}
                          size="sm"
                          className="me-1"
                          title={assignment.status === 'completed' ? 'Mark as Pending' : 'Mark as Complete'}
                          onClick={() => handleToggleStatus(assignment._id)}
                        >
                          <FiCheck />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Delete"
                          onClick={() => handleDeleteAssignment(assignment._id)}
                        >
                          <FiTrash2 />
                        </Button>
                      </div>
                    </div>
                    
                    {assignment.createdAt && (
                      <small className="text-muted d-block mt-3">
                        Created: {formatDate(assignment.createdAt)}
                      </small>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
      
      {/* === FOOTER === */}
      {assignments.length > 0 && (
        <Row className="mt-4">
          <Col>
            <Card className="border-0 bg-transparent">
              <Card.Body className="text-center text-muted">
                <p className="mb-0">
                  📊 You have {stats.pending} pending and {stats.completed} completed assignments
                  {stats.overdue > 0 && <span className="text-danger"> ({stats.overdue} overdue!)</span>}
                </p>
                <small>Keep up the good work! 🎓</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Dashboard;

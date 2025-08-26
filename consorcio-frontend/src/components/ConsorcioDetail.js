import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Row, Col, ListGroup, Button, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';
import { FaArrowLeft, FaEdit, FaInfoCircle, FaSearch, FaPlus } from 'react-icons/fa'; // Asegúrate de que 'react-icons' esté instalado

function ConsorcioDetail({ API_BASE_URL, userRole }) {
    const { id } = useParams();
    const [consorcio, setConsorcio] = useState(null);
    const [inquilinos, setInquilinos] = useState([]);
    const [activos, setActivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda de inquilinos
    const navigate = useNavigate();
    const location = useLocation();

    const fetchConsorcioDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');

        if (!token) {
            setError('No estás autenticado. Por favor, inicia sesión.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const consorcioResponse = await axios.get(`${API_BASE_URL}/api/consorcios/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setConsorcio(consorcioResponse.data);

            const inquilinosResponse = await axios.get(`${API_BASE_URL}/api/inquilinos?consorcioId=${id}`, {
                headers: { 'x-auth-token': token }
            });
            setInquilinos(inquilinosResponse.data);

            const activosResponse = await axios.get(`${API_BASE_URL}/api/activos?consorcioId=${id}`, {
                headers: { 'x-auth-token': token }
            });
            setActivos(activosResponse.data);

        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión.');
                navigate('/login');
            } else if (err.response && err.response.status === 403) {
                setError('No tienes los permisos necesarios para ver este consorcio.');
            } else {
                setError(err.response?.data?.msg || 'Error al cargar los detalles del consorcio.');
            }
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, id, navigate]);

    useEffect(() => {
        // La clave de ubicación (location.key) cambia con cada navegación,
        // lo que fuerza la recarga de los datos cuando se vuelve a esta página,
        // asegurando que se muestre la información más reciente de la API.
        fetchConsorcioDetails();
    }, [fetchConsorcioDetails, location.key]);

    const handleDeleteClick = (item, type) => {
        // En un escenario sin botones de eliminación, esta función no sería llamada.
        // Se mantiene como un placeholder o si el Modal es usado de otra forma.
        // setItemToDelete(item);
        // setItemTypeToDelete(type);
        // setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        // De igual forma, esta función no se ejecutaría sin un botón de eliminación.
        // setShowDeleteModal(false);
        // setItemToDelete(null);
        // setItemTypeToDelete('');
    };

    const getMaintenanceStatus = (proximoMantenimientoDate) => {
        if (!proximoMantenimientoDate) {
            return { color: 'secondary', text: 'No programado' };
        }

        const today = new Date();
        const maintenanceDate = new Date(proximoMantenimientoDate);
        maintenanceDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);

        const diffTime = maintenanceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { color: 'danger', text: 'Vencido' };
        } else if (diffDays === 0) {
            return { color: 'danger', text: 'Vence hoy' };
        } else if (diffDays <= 15) {
            return { color: 'danger', text: `Vence en ${diffDays} días` };
        } else if (diffDays <= 30) {
            return { color: 'warning', text: `Vence en ${diffDays} días` };
        } else {
            return { color: 'success', text: 'OK' };
        }
    };

    const getAssetConditionTextColorClass = (activo) => {
        const estado = activo.estadoActual?.toLowerCase();
        if (estado === 'en funcionamiento' || estado === 'buen estado' || estado === 'operativo') {
            return 'text-success';
        } else if (estado === 'en reparación') {
            return 'text-warning';
        } else if (estado === 'fuera de servicio' || estado === 'requiere revisión' || estado === 'averiado') {
            return 'text-danger';
        }
        return 'text-dark';
    };

    const getAssetStatusBadgeColorClass = (activo) => {
        const estado = activo.estadoActual?.toLowerCase();
        if (estado === 'en funcionamiento' || estado === 'buen estado' || estado === 'operativo') {
            return 'success';
        } else if (estado === 'en reparación') {
            return 'warning';
        } else if (estado === 'fuera de servicio' || estado === 'requiere revisión' || estado === 'averiado') {
            return 'danger';
        }
        return 'secondary';
    };

    // Función para manejar el cambio en el campo de búsqueda de inquilinos
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filtrar inquilinos basados en el término de búsqueda
    const filteredInquilinos = inquilinos.filter(inquilino => {
        const term = searchTerm.toLowerCase();
        return (
            inquilino.nombre.toLowerCase().includes(term) ||
            inquilino.unidad.toLowerCase().includes(term)
        );
    });

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando detalles del consorcio...</span>
                </Spinner>
                <p className="mt-2">Cargando detalles del consorcio...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    {error} <Button variant="link" onClick={() => navigate('/consorcios')}>Volver a Consorcios</Button>
                </Alert>
            </Container>
        );
    }

    if (!consorcio) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">
                    Consorcio no encontrado. <Button variant="link" onClick={() => navigate('/consorcios')}>Volver a Consorcios</Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            <Button variant="secondary" onClick={() => navigate('/consorcios')} className="mb-4">
                <FaArrowLeft className="me-2" /> Volver a Consorcios
            </Button>

            <Row className="g-4">
                <Col md={8}>
                    <Card className="shadow-lg mb-4 border-0">
                        <Card.Header as="h2" className="text-center bg-light text-dark p-3">
                            Información del consorcio
                            {(userRole === 'admin' || userRole === 'employee') && (
                                <Link to={`/edit-consorcio/${consorcio._id}`} className="btn btn-outline-secondary btn-sm float-end" title="Editar Consorcio">
                                    <FaEdit /> Editar
                                </Link>
                            )}
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={12}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item><strong>Nombre:</strong> {consorcio.nombre}</ListGroup.Item>
                                        <ListGroup.Item><strong>Dirección:</strong> {consorcio.direccion}</ListGroup.Item>
                                        <ListGroup.Item><strong>Código Postal:</strong> {consorcio.codigoPostal}</ListGroup.Item>
                                        <ListGroup.Item><strong>Provincia:</strong> {consorcio.provincia}</ListGroup.Item>
                                        <ListGroup.Item><strong>Pisos:</strong> {consorcio.pisos}</ListGroup.Item>
                                        <ListGroup.Item><strong>Unidades:</strong> {consorcio.unidades}</ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>
                            <hr className="my-3" />
                            <h5 className="mb-3">Información del Portero:</h5>
                            <Card.Text>
                                <strong>Nombre:</strong> {consorcio.nombrePortero || 'N/A'}<br/>
                                <strong>Teléfono:</strong> {consorcio.telefonoPortero || 'N/A'}<br/>
                                <strong>Email:</strong> {consorcio.emailPortero || 'N/A'}<br/>
                            </Card.Text>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 mb-4 h-auto">
                        <Card.Header as="h3" className="bg-light text-dark d-flex justify-content-between align-items-center p-3">
                            Inquilinos
                            {(userRole === 'admin' || userRole === 'employee') && (
                                <Link to={`/add-inquilino/${consorcio._id}`} className="btn btn-primary btn-sm ms-auto" title="Agregar nuevo inquilino">
                                    <FaPlus className="me-2" /> Agregar Inquilino
                                </Link>
                            )}
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label htmlFor="searchInquilinos" className="visually-hidden">Buscar inquilinos</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text"><FaSearch /></span>
                                    <Form.Control
                                        type="text"
                                        placeholder="Buscar inquilino por nombre o unidad..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        id="searchInquilinos"
                                    />
                                </div>
                            </Form.Group>
                            <ListGroup variant="flush">
                                {filteredInquilinos.length === 0 ? (
                                    <ListGroup.Item className="text-muted text-center py-3">No hay inquilinos registrados para este consorcio que coincidan con la búsqueda.</ListGroup.Item>
                                ) : (
                                    filteredInquilinos.map(inquilino => (
                                        <ListGroup.Item key={inquilino._id} className="d-flex justify-content-between align-items-center py-2">
                                            <div>
                                                {inquilino.nombre} ({inquilino.unidad})
                                            </div>
                                            <Button as={Link} to={`/inquilinos/${inquilino._id}`} variant="outline-primary" size="sm" className="me-2" title="Ver detalles del inquilino">
                                                <FaInfoCircle />
                                            </Button>
                                        </ListGroup.Item>
                                    ))
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="shadow-sm border-0 mb-4 h-auto">
                        <Card.Header as="h3" className="bg-light text-dark d-flex justify-content-between align-items-center">
                            Activos
                        </Card.Header>
                        <ListGroup variant="flush">
                            {activos.length === 0 ? (
                                <ListGroup.Item className="text-muted text-center py-3">No hay activos registrados para este consorcio.</ListGroup.Item>
                            ) : (
                                activos.map(activo => {
                                    const maintenanceStatus = getMaintenanceStatus(activo.proximoMantenimiento);
                                    return (
                                        <ListGroup.Item key={activo._id} className="d-flex justify-content-between align-items-center py-2">
                                            <div className="d-flex align-items-center flex-wrap">
                                                <Link to={`/activos/${activo._id}`} className={`text-decoration-none fw-bold me-2 ${getAssetConditionTextColorClass(activo)}`}>
                                                    {activo.nombre} ({activo.tipo})
                                                </Link>
                                                {activo.estadoActual && (
                                                    <Badge bg={getAssetStatusBadgeColorClass(activo)} className="me-2">
                                                        {activo.estadoActual}
                                                    </Badge>
                                                )}
                                                {maintenanceStatus.text && (
                                                    <Badge bg={maintenanceStatus.color}>
                                                        {maintenanceStatus.text}
                                                    </Badge>
                                                )}
                                            </div>
                                        </ListGroup.Item>
                                    );
                                })
                            )}
                        </ListGroup>
                    </Card>

                    <Card className="shadow-sm border-0 h-auto">
                        <Card.Header as="h3" className="bg-light text-dark p-3">
                            Alertas de mantenimiento
                        </Card.Header>
                        <ListGroup variant="flush">
                            {activos.filter(activo => {
                                const status = getMaintenanceStatus(activo.proximoMantenimiento);
                                return status.color === 'danger' || status.color === 'warning';
                            }).length === 0 ? (
                                <ListGroup.Item className="text-muted text-center py-3">No hay alertas de mantenimiento pendientes.</ListGroup.Item>
                            ) : (
                                activos
                                    .filter(activo => {
                                        const status = getMaintenanceStatus(activo.proximoMantenimiento);
                                        return status.color === 'danger' || status.color === 'warning';
                                    })
                                    .map(activo => {
                                        const status = getMaintenanceStatus(activo.proximoMantenimiento);
                                        return (
                                            <ListGroup.Item key={activo._id} className="d-flex justify-content-between align-items-center py-2">
                                                <span>{activo.nombre}:</span>
                                                <Badge bg={status.color} className="ms-auto">
                                                    {status.text}
                                                </Badge>
                                            </ListGroup.Item>
                                        );
                                    })
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Estás seguro de que deseas eliminar este elemento? Esta acción es irreversible.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ConsorcioDetail;

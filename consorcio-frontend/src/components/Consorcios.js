import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Table, Alert, Button, Form, FormControl, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa'; 

// Este componente lista todos los consorcios, con funcionalidad de búsqueda y un modal de confirmación de eliminación.
function Consorcios() {
    const [consorcios, setConsorcios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Estado para controlar la visibilidad del modal de eliminación
    const [consorcioToDeleteId, setConsorcioToDeleteId] = useState(null); // ID del consorcio a eliminar

    // URL del backend
    const backendUrl = 'https://refactored-xylophone-jv659gpjqq62jqr5-5000.app.github.dev/api/consorcios'; 
    const token = localStorage.getItem('token');

    // Función para cargar los consorcios desde la API
    const fetchConsorcios = () => {
        axios.get(backendUrl, {
            headers: { 'x-auth-token': token }
        })
        .then(response => {
            if (Array.isArray(response.data)) {
                setConsorcios(response.data);
            } else {
                console.warn('La API de consorcios no devolvió un array:', response.data);
                setConsorcios([]);
            }
            setLoading(false);
        })
        .catch(error => {
            setError('Error al cargar los consorcios. Por favor, revisa la conexión del backend.');
            setLoading(false);
            console.error('Error fetching consorcios:', error);
        });
    };

    // Efecto para cargar los consorcios cuando el componente se monta
    useEffect(() => {
        fetchConsorcios();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    // Abre el modal de confirmación de eliminación
    const handleDelete = (id) => {
        setConsorcioToDeleteId(id);
        setShowDeleteModal(true);
    };

    // Cierra el modal de confirmación
    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setConsorcioToDeleteId(null);
    };

    // Confirma la eliminación después de que el usuario acepta en el modal
    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${backendUrl}/${consorcioToDeleteId}`, {
                headers: { 'x-auth-token': token }
            });
            // Si la eliminación es exitosa, se vuelve a cargar la lista completa
            fetchConsorcios();
            handleCloseDeleteModal(); // Cierra el modal
        } catch (err) {
            setError('Error al eliminar el consorcio. Inténtalo de nuevo.');
            console.error('Error deleting consorcio:', err.response ? err.response.data : err.message);
            handleCloseDeleteModal(); // Cierra el modal incluso si hay un error
        }
    };

    // Filtra los consorcios basándose en el término de búsqueda
    const filteredConsorcios = consorcios.filter(consorcio =>
        consorcio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consorcio.direccion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <h2>Cargando Consorcios...</h2>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Lista de Consorcios ({filteredConsorcios.length})</h2>
                <Link to="/add-consorcio">
                    <Button variant="primary">+ Agregar Consorcio</Button>
                </Link>
            </div>

            {/* Formulario de búsqueda */}
            <Form className="d-flex mb-4">
                <div className="input-group">
                    <FormControl
                        type="search"
                        placeholder="Buscar por nombre o dirección..."
                        className="me-2"
                        aria-label="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="input-group-text">
                        <FaSearch />
                    </span>
                </div>
            </Form>
            
            {filteredConsorcios.length > 0 ? (
                <Table striped bordered hover responsive className="mt-3">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Dirección</th>
                            <th>Acciones</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConsorcios.map(consorcio => (
                            <tr key={consorcio._id}>
                                <td>
                                    <Link to={`/consorcios/${consorcio._id}`}>
                                        {consorcio.nombre}
                                    </Link>
                                </td>
                                <td>{consorcio.direccion}</td>
                                <td>
                                    <Link to={`/edit-consorcio/${consorcio._id}`} className="btn btn-warning btn-sm me-2">
                                        <FaEdit /> Editar
                                    </Link>
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        onClick={() => handleDelete(consorcio._id)}
                                    >
                                        <FaTrash /> Eliminar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <Alert variant="info" className="mt-3">
                    No se encontraron consorcios que coincidan con la búsqueda.
                </Alert>
            )}
            
            {/* Modal de confirmación de eliminación */}
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Estás seguro de que quieres eliminar este consorcio? Esta acción no se puede deshacer y borrará toda la información asociada (inquilinos, activos, etc.).
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default Consorcios;
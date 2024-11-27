import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { Close, CheckCircle } from '@mui/icons-material';

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const AdminViewNguonbando = () => {
    const [layers, setLayers] = useState([]);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVariant, setSnackbarVariant] = useState('success');

    const [newLayer, setNewLayer] = useState({
        id: '',
        source_name: '',
        type: '',
        tiles: '',
        bounds: '',
        name: '',
    });

    useEffect(() => {
        // Fetch layer data on component mount
        axios.get('/vnrain/Admin/getsourceslayer')
            .then((response) => {
                setLayers(response.data);
            })
            .catch((error) => {
                console.error('Error fetching layer data:', error);
            });
    }, []);

    const handleAddLayer = () => {
        setNewLayer({
            id: '',
            source_name: '',
            type: '',
            tiles: '',
            bounds: '',
            name: '',
        });
        setSelectedLayer(null);
        setDialogVisible(true);
    };

    const handleEditLayer = (layer) => {
        setNewLayer(layer);
        setSelectedLayer(layer);
        setDialogVisible(true);
    };

    const handleDeleteLayer = async (id) => {
        try {
            const response = await axios.delete(`/vnrain/Admin/deletesourceslayer/${id}`);
            if (response.status === 200) {
                setSnackbarMessage('Layer deleted successfully!');
                setSnackbarVariant('success');
                setLayers(layers.filter(layer => layer.id !== id));
            }
        } catch (error) {
            setSnackbarMessage('Error deleting layer!');
            setSnackbarVariant('error');
            console.error('Error deleting layer:', error);
        } finally {
            setSnackbarOpen(true);
        }
    };

    const handleSaveLayer = async () => {
        try {
            const method = selectedLayer ? 'put' : 'post';
            const url = selectedLayer ? `/vnrain/Admin/updatesourceslayer/${newLayer.id}` : '/vnrain/Admin/createsourceslayer';
            const response = await axios[method](url, newLayer);

            if (response.status === 200 || response.status === 201) {
                setSnackbarMessage('Layer saved successfully!');
                setSnackbarVariant('success');
                setDialogVisible(false);

                // Refresh layer list
                if (selectedLayer) {
                    setLayers(layers.map(layer => layer.id === newLayer.id ? newLayer : layer));
                } else {
                    setLayers([...layers, response.data]);
                }
            }
        } catch (error) {
            setSnackbarMessage('Error saving layer!');
            setSnackbarVariant('error');
            console.error('Error saving layer:', error);
        } finally {
            setSnackbarOpen(true);
        }
    };

    const renderHeader = () => (
        <div className="table-header">
            <Button label="Add Layer" icon="pi pi-plus" onClick={handleAddLayer} />
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản lý nguồn layer</h2>

            <DataTable value={layers} header={renderHeader()} paginator rows={10}>
                <Column field="source_name" header="Tên nguồn" />
                <Column field="type" header="Loại" />
                <Column field="tiles" header="Tiles URL" />
                <Column field="bounds" header="Bounds" />
                <Column field="name" header="Tên hiển thị" />
                <Column
                    body={(rowData) => (
                        <>
                            <Button icon="pi pi-pencil" className="my-action-btn" onClick={() => handleEditLayer(rowData)} />
                            <Button icon="pi pi-trash" className="my-action-btn p-button-danger" onClick={() => handleDeleteLayer(rowData.id)} />
                        </>
                    )}
                    header="Thao tác"
                />
            </DataTable>

            <Dialog
                visible={isDialogVisible}
                style={{ width: '500px' }}
                header="Layer Details"
                modal
                onHide={() => setDialogVisible(false)}
            >
                <div className="p-grid">
                    <div className="p-col-12">
                        <label>Tên nguồn</label>
                        <InputText
                            placeholder="Source Name"
                            value={newLayer.source_name}
                            onChange={(e) => setNewLayer({ ...newLayer, source_name: e.target.value })}
                        />
                    </div>
                    <div className="p-col-12">
                        <label>Loại</label>
                        <InputText
                            placeholder="Type"
                            value={newLayer.type}
                            onChange={(e) => setNewLayer({ ...newLayer, type: e.target.value })}
                        />
                    </div>
                    <div className="p-col-12">
                        <label>Tiles</label>
                        <InputText
                            placeholder="Tiles URL"
                            value={newLayer.tiles}
                            onChange={(e) => setNewLayer({ ...newLayer, tiles: e.target.value })}
                        />
                    </div>
                    <div className="p-col-12">
                        <label>Bounds</label>
                        <InputText
                            placeholder="Bounds"
                            value={newLayer.bounds}
                            onChange={(e) => setNewLayer({ ...newLayer, bounds: e.target.value })}
                        />
                    </div>
                    <div className="p-col-12">
                        <label>Tên hiển thị</label>
                        <InputText
                            placeholder="Name"
                            value={newLayer.name}
                            onChange={(e) => setNewLayer({ ...newLayer, name: e.target.value })}
                        />
                    </div>
                </div>
                <Button label="Save" icon="pi pi-check" onClick={handleSaveLayer} />
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                <SnackbarContent
                    style={{ backgroundColor: snackbarVariant === 'success' ? 'green' : 'red' }}
                    message={snackbarMessage}
                    action={<Close onClick={() => setSnackbarOpen(false)} />}
                />
            </Snackbar>
        </div>
    );
};

export default AdminViewNguonbando;

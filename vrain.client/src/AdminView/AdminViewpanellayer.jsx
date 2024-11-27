/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Tree } from 'primereact/tree';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { CheckCircle } from '@mui/icons-material';
import Box from '@mui/material/Box';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import axios from 'axios';
const AdminViewpanellayer = () => {
    const [treeData, setTreeData] = useState([]); // Lưu dữ liệu cây
    const [selectedNodeKey, setSelectedNodeKey] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVariant, setSnackbarVariant] = useState('success');
    const [layerData, setLayerData] = useState({
        id: 0,
        name: '',
        create_by: localStorage.getItem('user_name'),
        parent_id: null,
        thutu: 0,
    });

    useEffect(() => {
        fetchTreeData();
    }, []);

    const fetchTreeData = async () => {
        try {
            const response = await axios.get('/vnrain/Admin/treepanellayer');
            setTreeData(response.data);
        } catch (error) {
            console.error('Error fetching tree data:', error);
        }
    };

    const handleSelectedItemsChange = (event) => {
        if (event != null) {
            setLayerData({
                id: event.node.key,
                name: event.node.label,
                create_by: localStorage.getItem('user_name'),
                parent_id: event.node.parentId,
                thutu: event.node.thutu,
            });
            setSelectedNodeKey(event.node.key);
        }
    };

    const showSnackbar = (message, variant) => {
        setSnackbarMessage(message);
        setSnackbarVariant(variant);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            await axios.post(`/vnrain/Admin/savepanellayer?id=${layerData.id}&name=${layerData.name}&parent_id=${layerData.parent_id ? layerData.parent_id : 0 }&thutu=${layerData.thutu}` ,null, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchTreeData();
            setLayerData({ id: 0, name: '', parent_id: null, thutu: 0 });
        } catch (error) {
            console.error('Error saving layer', error);
        }
    };

    const handleDelete = async () => {
        try {
            if (!layerData.id) {
                showSnackbar('Chọn 1 layer để xóa', 'error');
                return;
            }
            await axios.delete(`/vnrain/Admin/deletepanellayer/${layerData.id}`);
            showSnackbar('Layer deleted successfully!', 'success');
            fetchTreeData(); // Reload tree data
        } catch (error) {
            showSnackbar('Error deleting layer!', 'error');
            console.error('Error deleting layer:', error);
        }
    };

    return (
        <div style={{ padding: '0px 20px' }}>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <SnackbarContent
                    message={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            {snackbarVariant === 'success' ? <CheckCircle style={{ marginRight: '8px' }} /> : null}
                            {snackbarMessage}
                        </span>
                    }
                    style={{
                        backgroundColor: snackbarVariant === 'success' ? '#4caf50' : '#f44336',
                    }}
                />
            </Snackbar>

            <h4 style={{ textAlign: 'center' }}>Panel Layer Management</h4>
            <div className="admin-panel-layer-container">
                <div style={{ width: '48%' }}>
                    <p>Danh sách các Layer</p>
                    <Box sx={{ minWidth: 250 }}>
                        <Tree
                            value={treeData}
                            className="tree-view"
                            selectionMode="single"
                            selectionKeys={selectedNodeKey}
                            onSelect={handleSelectedItemsChange}
                            style={{ border: 'none' }}
                        />
                    </Box>
                </div>
                <div style={{ width: '48%' }}>
                    <Box className="form-layer">
                        <div className="add-new-layer">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <p>Chi tiết Layer:</p>
                                {layerData.id != 0 && (
                                    <Button onClick={() => setLayerData({ id: 0, name: '', parent_id: null, thutu: 0 })}> Thêm mới</Button>
                                )}
                            </div>
                            
                            <div className="input-field">
                                <label htmlFor="layer_name">Tên Layer</label>
                                <InputText
                                    id="layer_name"
                                    value={layerData.name}
                                    onChange={(e) => setLayerData({ ...layerData, name: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="parent_id">Parent ID</label>
                                <InputText
                                    id="parent_id"
                                    value={layerData.parent_id || ''}
                                    onChange={(e) => setLayerData({ ...layerData, parent_id: e.target.value })}
                                />
                            </div>
                            <div className="input-field">
                                <label htmlFor="thutu">Thứ tự</label>
                                <InputText
                                    id="thutu"
                                    value={layerData.thutu}
                                    onChange={(e) => setLayerData({ ...layerData, thutu: +e.target.value })}
                                />
                            </div>
                        </div>
                    </Box>
                    <div className="form-buttons">
                        <Button label={layerData.id ? 'Lưu' : 'Thêm mới'} onClick={handleSubmit} />
                        {layerData.id != 0 && (
                            <Button
                                label="Xóa"
                                className="p-button-danger"
                                onClick={handleDelete}
                                style={{ marginLeft: '10px' }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AdminViewpanellayer;

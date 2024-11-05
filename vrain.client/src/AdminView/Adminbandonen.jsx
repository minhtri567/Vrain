/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import { Tree } from 'primereact/tree';
import { TreeSelect } from 'primereact/treeselect';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { Close, CheckCircle } from '@mui/icons-material';

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const Adminbandonen = () => {
    const [layer, setLayer] = useState([]);
    const [selectedNodeKey, setSelectedNodeKey] = useState('');
    const [TreeselectedNodeKey, setTreeSelectedNodeKey] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVariant, setSnackbarVariant] = useState('success');
    const apilayer = '/vnrain/Admin/GetMapLayers';
    const addlayer = '/vnrain/Admin/CreateMapLayer';
    const deletelayer = '/vnrain/Admin/DeleteMapLayer';
    const updatelayer = '/vnrain/Admin/UpdateMapLayer/';
    const fetchLayer = async () => {
        try {
            const response = await axios.get(apilayer);
            setLayer(response.data);
        } catch (error) {
            console.error('Error fetching menu', error);
        }
    };
    useEffect(() => {
        fetchLayer();
    }, []);
    const [idlayer, setidlayer] = React.useState('');          
    const [namelayer, setnamelayer] = React.useState('');          
    const [typelayer, settypelayer] = React.useState('');  
    const [sourcelayer, setsourcelayer] = React.useState('');                  
    const [sourcelayername, setsourcelayername] = React.useState('');               
    const [isVisible, setIsVisible] = React.useState(true);     
    const [minZoom, setMinZoom] = React.useState(0);         
    const [maxZoom, setMaxZoom] = React.useState(18);         

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const [sysbtnadd, setSysbtnadd] = React.useState(false);
    const handleSelectedItemsChange = (event) => {
        if (event == null) {
            //
        } else {
            setSysbtnadd(false);
        }
    };
    const handleSaveLayer = async (itemId) => {
        const layerData = {
            name: namelayer,
            type: typelayer,
            source: sourcelayer,
            sourceName: sourcelayername,
            isVisible: isVisible,
            minZoom: minZoom,
            maxZoom: maxZoom,
        };

        try {
            // Kiểm tra nếu có itemId -> cập nhật lớp bản đồ, ngược lại -> thêm mới
            const response = itemId
                ? await fetch( updatelayer +`${itemId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(layerData),
                })
                : await fetch(addlayer , {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(layerData),
                });

            // Reset form và lấy lại dữ liệu sau khi thêm hoặc sửa thành công
            resetLayerForm();
            await fetchLayer();

            setSnackbarMessage(itemId ? "Đã cập nhật lớp bản đồ thành công!" : "Đã thêm mới lớp bản đồ thành công!");
            setSnackbarVariant('success');
            setSnackbarOpen(true);
        } catch (error) {
            setSnackbarMessage('lỗi lưu dữ liệu');
            setSnackbarVariant('error');
            setSnackbarOpen(true);
        }
    };
    const handleaddLayer = () => {

        setSysbtnadd(!sysbtnadd);
    };
    const handleDeleteLayer = async (itemId) => {
        
    }
    const resetLayerForm = () => {
        setnamelayer("");
        settypelayer("");
        setsourcelayer("");
        setsourcelayername("");
        setIsVisible(true);
        setMinZoom(0);
        setMaxZoom(18);
    };
    return (
        <div style={{ padding: '0px 20px' }}>
            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
            >
                <SnackbarContent
                    style={{ backgroundColor: snackbarVariant === 'success' ? '#4caf50' : '#f44336' }}
                    message={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            {snackbarVariant === 'success' ? <CheckCircle /> : null}
                            <span style={{ marginLeft: '10px' }}>{snackbarMessage}</span>
                        </span>
                    }
                />
            </Snackbar>
            <h4 style={{ textAlign: 'center' }}>Quản lý menu</h4>
            <div className='ad-viewcontentmenu'>
                <div style={{ width: '48%' }}>
                    <p>Danh sách menu</p>
                    <Box sx={{ minWidth: 250 }}>
                        <Tree value={layer}
                            className='tree-view-ad'
                            selectionMode="single"
                            style={{ border: 'none' }}
                            selectionKeys={selectedNodeKey}
                            onSelect={handleSelectedItemsChange} />
                    </Box>
                </div>
                <div style={{ width: '48%' }}>
                    <Box className="form-menu">
                        <div className="add_new_menu">
                            <p>Chi tiết menu : </p>
                            <button onClick={handleaddLayer}>  {sysbtnadd ? "Hủy" : "Thêm 1 layer mới"} </button>
                        </div>
                        <div className="sys_input">
                            <label htmlFor="sys_namemenu">Tên menu</label>
                            <InputText id="sys_namemenu" value={namelayer ? namelayer : ""} onChange={(e) => setnamelayer(e.target.value)} />
                        </div>
                        <div className="sys_input">
                            <label htmlFor="layer-cha">Menu cha</label>
                            <TreeSelect value={TreeselectedNodeKey ? TreeselectedNodeKey : ''}
                                id="layer-cha"
                                onChange={(e) => { setTreeSelectedNodeKey(e.value) }}
                                options={layer}
                                className=""
                                placeholder="">
                            </TreeSelect>
                        </div>
                        <div className="sys_input">
                            <label htmlFor="name_layer">Tên lớp</label>
                            <InputText id="name_layer" value={namelayer ? namelayer : ""} onChange={(e) => setnamelayer(e.target.value)} />
                        </div>

                        <div className="sys_input">
                            <label htmlFor="type_layer">Loại lớp</label>
                            <InputText id="type_layer" value={typelayer ? typelayer : ""} onChange={(e) => settypelayer(e.target.value)} />
                        </div>

                        <div className="sys_input">
                            <label htmlFor="source_layer">Nguồn lớp</label>
                            <InputText id="source_layer" value={sourcelayer ? sourcelayer : ""} onChange={(e) => setsourcelayer(e.target.value)} />
                        </div>

                        <div className="sys_input">
                            <label htmlFor="source_layer_name">Tên nguồn lớp</label>
                            <InputText id="source_layer_name" value={sourcelayername ? sourcelayername : ""} onChange={(e) => setsourcelayername(e.target.value)} />
                        </div>

                        <div className="sys_input">
                            <label htmlFor="is_visible">Hiển thị</label>
                            <InputSwitch id="is_visible" checked={isVisible} onChange={(e) => setIsVisible(e.value)} />
                        </div>

                        <div className="sys_input">
                            <label htmlFor="min_zoom">Zoom tối thiểu</label>
                            <InputNumber id="min_zoom" value={minZoom} onValueChange={(e) => setMinZoom(e.value)} />
                        </div>

                        <div className="sys_input">
                            <label htmlFor="max_zoom">Zoom tối đa</label>
                            <InputNumber id="max_zoom" value={maxZoom} onValueChange={(e) => setMaxZoom(e.value)} />
                        </div>
                        {sysbtnadd && (
                            <button onClick={() => handleSaveLayer(idlayer ? idlayer : null)}>
                                {idlayer ? "Lưu" : "Thêm mới"}
                            </button>
                        )}
                        {!sysbtnadd && (
                            <button onClick={() => handleDeleteLayer(idlayer)} style={{ marginRight: '10px', backgroundColor: '#ff00008a' }}> Xóa layer </button>
                        )}

                    </Box>
                </div>
            </div>
        </div>
    );
};

export default Adminbandonen;
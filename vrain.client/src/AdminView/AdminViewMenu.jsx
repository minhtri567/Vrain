/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import { Tree } from 'primereact/tree';
import { TreeSelect } from 'primereact/treeselect';
import { InputText } from 'primereact/inputtext';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { Close, CheckCircle } from '@mui/icons-material';

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
const AdminViewMenu = () => {
    const [menu, setMenu] = useState([]);
    const [selectedNodeKey, setSelectedNodeKey] = useState('');
    const [TreeselectedNodeKey, setTreeSelectedNodeKey] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVariant, setSnackbarVariant] = useState('success');
    const apimenu = '/vnrain/Admin/menu';
    const addmenu = '/vnrain/Admin/savemenu?';
    const deletemenu = '/vnrain/Admin/deletemenu/';
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const response = await axios.get(apimenu);
                setMenu(response.data);
            } catch (error) {
                console.error('Error fetching menu', error);
            }
        };
        fetchMenu();
    }, []);
    const findParentNode = (nodes, sourceLayer) => {
        for (let node of nodes) {
            if (node.key === sourceLayer) {
                return node;
            }
            if (node.children) {
                const found = findParentNode(node.children, sourceLayer);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };
    const [sysname, setSysname] = React.useState('');
    const [systhutu, setSysthutu] = React.useState('');
    const [sysview, setSysview] = React.useState('');
    const [sysid, setSysid] = React.useState(null);
    const [sysbtnadd, setSysbtnadd] = React.useState(false);
    const handleSelectedItemsChange = (event) => {
        if (event == null) {
            //
        } else {
            setSysbtnadd(false);
            setSysid(event.node.key);
            setSysview(event.node.url);
            setSysthutu(event.node.thutu);
            setSysname(event.node.label);
            const selectedNode = event.node;
            const parentNode = findParentNode(menu, selectedNode.sourceLayer);
            setTreeSelectedNodeKey(parentNode ? parentNode.key : '');
        }
    };
    
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleSavemenu = async (itemId) => {
        if (sysname == "") {
            setSnackbarMessage('Không để trống tên menu');
            setSnackbarVariant('error');
            setSnackbarOpen(true);
            return;
        }
        if (systhutu == "") {
            setSnackbarMessage('Không để trống thứ tự menu');
            setSnackbarVariant('error');
            setSnackbarOpen(true);
            return;
        }
        try {
            const token = localStorage.getItem('jwtToken');
            const response = await axios.post(`${addmenu}sysid=${itemId}&systenmenu=${sysname}&sysmenucha=${TreeselectedNodeKey ? TreeselectedNodeKey : null}&systhutu=${systhutu}&sysview=${sysview ? sysview : null}`, null, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setSnackbarMessage('Data added successfully');
                setSnackbarVariant('success');
                setSnackbarOpen(true);
            }
        } catch (error) {
            
            if (error.response.status == 403) {
                setSnackbarMessage('Thiếu quyền để thực hiện !');
                setSnackbarVariant('error');
                setSnackbarOpen(true);
            } else {
                setSnackbarMessage('Failed to add data');
                setSnackbarVariant('error');
                setSnackbarOpen(true);
            }
        }
    };
    const handleaddmenu = () => {
        setSysbtnadd(true);
        setSysid(0);
        setSysview(null);
        setSysthutu(null);
        setSysname(null);
        setTreeSelectedNodeKey(1);
    };
    const handleDeletemenu = async (itemId) => {
        if (sysname == "") {
            setSnackbarMessage('Chọn 1 menu để xóa');
            setSnackbarVariant('error');
            setSnackbarOpen(true);
            return;
        }
        try {
            const response = await axios.post(`${deletemenu}${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });
            if (response.status === 200) {
                setSnackbarMessage('Delete menu successfully');
                setSnackbarVariant('success');
                setSnackbarOpen(true);
            }
        } catch (error) {
            if (error.response.status == 403) {
                setSnackbarMessage('Bạn không có quyền thực hiện điều này !');
                setSnackbarVariant('error');
                setSnackbarOpen(true);
            } else {
                setSnackbarMessage('Failed to delete data');
                setSnackbarVariant('error');
                setSnackbarOpen(true);
            }
        }
    }

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
                <div style={{ width :'48%' }}>
                    <p>Danh sách menu</p>
                    <Box sx={{ minWidth: 250 }}>
                        <Tree value={menu}
                            className='tree-view-ad'
                            selectionMode="single"
                            style={{ border : 'none' }}
                            selectionKeys={selectedNodeKey}
                            onSelect={handleSelectedItemsChange} />
                            
                    </Box>
                </div>
                <div style={{ width: '48%' }}>
                    <Box className="form-menu">
                        <div className="add_new_menu">
                            <p>Chi tiết menu : </p>
                            <button onClick={handleaddmenu}>Thêm 1 menu mới</button>
                        </div>
                        <div className="sys_input">
                            <label htmlFor="sys_namemenu">Tên menu</label>
                            <InputText id="sys_namemenu" value={sysname ? sysname : ""} onChange={(e) => setSysname(e.target.value)} />
                        </div>
                        <div className="sys_input">
                            <label htmlFor="menu-cha">Menu cha</label>
                            <TreeSelect value={TreeselectedNodeKey ? TreeselectedNodeKey : ''}
                                id="menu-cha"
                                onChange={(e) => { setTreeSelectedNodeKey(e.value)}}
                                options={menu}
                                className=""
                                placeholder="">
                            </TreeSelect>
                        </div>
                        <div className="sys_input">
                            <label htmlFor="sys_thutu">Thứ tự</label>
                            <InputText id="sys_thutu" value={systhutu ? systhutu : ""} onChange={(e) => setSysthutu(e.target.value)} />

                        </div>
                        <div className="sys_input">
                            <label htmlFor="sys_view">View component</label>
                            <InputText id="sys_view" value={sysview ? sysview : ""} onChange={(e) => setSysview(e.target.value)} />
                        </div>
                        <button onClick={() => handleSavemenu(sysid)}> {sysbtnadd ? "Thêm mới" : "Lưu"}</button>
                        {!sysbtnadd && (
                            <button onClick={() => handleDeletemenu(sysid)} style={{ marginRight: '10px', backgroundColor: '#ff00008a' }}> Xóa menu </button>
                        )}
                       
                    </Box>
                </div>
            </div>
        </div>
    );
};

export default AdminViewMenu;
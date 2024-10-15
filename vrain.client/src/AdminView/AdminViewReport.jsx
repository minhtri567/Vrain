
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import axios from 'axios';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Navigate } from 'react-router-dom';
const AdminViewReport = () => {
    const allreport = '/vnrain/Admin/reportstations';
    const getallstations = '/vnrain/Admin/infostations';
    const apideleterp = '/vnrain/Admin/deletelistrp';
    var apidownloadfile = "/vnrain/WeatherStations/download/";
    const [datareport, setDataReport] = useState([]);
    const [stations, setStations] = useState([]);
    useEffect(() => {

        const jwt = localStorage.getItem('jwtToken');
        const fetchInitialReport = async () => {
            try {
                const response = await axios.get(allreport, {
                    headers: {
                        'Authorization': `Bearer ${jwt}`
                    }
                });
                setDataReport(response.data);
            } catch (error) {
                if (error.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user_name');
                    localStorage.removeItem('email');
                    localStorage.removeItem('permission_stations');
                    localStorage.removeItem('role');
                    localStorage.removeItem('jwtToken');
                    <Navigate to="/" replace />;
                }
                console.error('Error fetching data reports', error);
            }
        };

        fetchInitialReport();

    }, []);
    useEffect(() => {
        const fetchstaions = async () => {
            try {
                const response = await fetch(getallstations);
                const data = await response.json();
                setStations(data);
            } catch (error) {
                console.error('Error fetching data stations', error);
            }
        };

        fetchstaions();
    }, []);

    const searchBodyTemplate = (rowData) => {
        return <Button icon="pi pi-search" onClick={() => viewListtramdo(rowData) } />;
    };
    const downloadfilerp = (rowData) => {
        return <Button icon="pi pi-download" onClick={() => downloadfile(rowData)} />;
    };
    const [Liststationsrp, setListstationsrp] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(null);
    const toast = useRef(null);
    const viewListtramdo = (listid) => {
        const selectedStations = stations.filter(station => listid.id_station_list.includes(station.station_id));
        setListstationsrp(selectedStations);
        setDialogVisible(true);
    }
    const downloadfile = async (listid) => {
        try {
            const response = await fetch(apidownloadfile + listid.name_file, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to download file');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', listid.name_file);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error deleting reports', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
        }
        
    }
    const dialogFooterTemplate = () => {
        return <Button label="Ok" icon="pi pi-check" onClick={() => setDialogVisible(false)} />;
    };

    const deleterpstations = async() => {
        const ids = selectedProducts.map(product => product.id);
        try {
            const response = await axios.delete(apideleterp , {
                data: ids,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });

            if (response.status === 200) {
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
            } else {
                console.warn('Error deleting reports', response);
                toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
            }
        } catch (error) {
            if (error.response.status == 403) {
                toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
            } else {
                console.error('Error deleting reports', error);
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
            }
        }
    }

    const renderHeader = () => {
        return (
            <div className="nagative-adreport">
                <h4 style={{ magrin : '0'} }>Tất cả báo cáo trạm đo mưa </h4>
                <div className="add-delete-btn">
                    <Button label="Xóa báo cáo" icon="pi pi-trash" severity="danger" onClick={deleterpstations} disabled={!selectedProducts || !selectedProducts.length} />
                </div>
            </div>

        );
    };

    const header = renderHeader();

    

    return (
        <div>
            <Toast ref={toast} />
            <DataTable
                value={datareport}
                scrollable
                header={header}
                scrollHeight="calc(100vh - 191px)"
                selection={selectedProducts} onSelectionChange={(e) => setSelectedProducts(e.value)}
                className="admin-db-report"
            >
                <Column selectionMode="multiple" frozen exportable={false}></Column>
                <Column field="tinh" header="Tỉnh" style={{ minWidth: '100px' }} className="font-bold"></Column>
                <Column field="name_file" header="Tên file" style={{ minWidth: '300px' }}></Column>
                <Column field="file_ref" header="Đường dẫn" style={{ minWidth: '300px' }}></Column>
                <Column field="request_time" header="Thời gian tạo báo cáo" style={{ minWidth: '200px' }}></Column>
                <Column field="ngaybatdau" header="Thời gian bắt đầu" style={{ minWidth: '200px' }}></Column>
                <Column field="ngayketthuc" header="Thời gian kết thúc" style={{ minWidth: '200px' }}></Column>
                <Column field="tansuat" header="Tần suất" style={{ minWidth: '100px' }}></Column>
                <Column header="Danh sách trạm báo cáo" body={searchBodyTemplate} style={{ minWidth: '200px', textAlign: 'center' }} ></Column>
                <Column header="Tải file" body={downloadfilerp} style={{ minWidth: '100px', textAlign: 'center' }} ></Column>
            </DataTable>

            <Dialog header="Danh sách trạm báo cáo" visible={dialogVisible} style={{ width: '75vw' }} maximizable
                modal contentStyle={{ height: '300px' }} onHide={() => setDialogVisible(false)} footer={dialogFooterTemplate}>
                <DataTable value={Liststationsrp} scrollable scrollHeight="flex" tableStyle={{ minWidth: '50rem' }}>
                    <Column field="station_name"  header="Tên trạm" style={{ minWidth: '150px' }} frozen className="font-bold"></Column>
                    <Column field="station_id" header="Mã trạm" style={{ minWidth: '100px' }}></Column>
                    <Column field="luuvuc" header="Lưu vực" style={{ minWidth: '100px' }}></Column>
                    <Column field="tinh" header="Tỉnh" style={{ minWidth: '100px' }} ></Column>
                    <Column field="quanhuyen" header="Quận huyện" style={{ minWidth: '100px' }} ></Column>
                    <Column field="phuongxa" header="Phường/Xã" style={{ minWidth: '100px' }} ></Column>
                </DataTable>
            </Dialog>
        </div>

    );
};

export default AdminViewReport;
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import axios from 'axios';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

import { InputText } from "primereact/inputtext";
import { Dropdown } from 'primereact/dropdown';

import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const AdminViewDanhmuc = () => {
    const apigetdanhmuc = '/api/Admin/alldanhmuc';
    const apisavedanhmuc = '/api/Admin/savedanhmuc';
    const apixoadanhmuc = '/api/Admin/deletedanhmuc?ids=';
    const apisualoaidanhmuc = '/api/Admin/saveloaidanhmuc';
    const apixoaloaidanhmuc = '/api/Admin/deleteloaidanhmuc?ids=';

    const [datadanhmuc, setdatadanhmuc] = useState(null);
    const fetchdata = async () => {
        try {
            const response = await fetch(apigetdanhmuc);
            const data = await response.json();
            setdatadanhmuc(data);
        } catch (error) {
            console.error('Error fetching data stations', error);
        }
    };

    useEffect(() => {
        fetchdata();
    }, []);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [danhmuccon, setdanhmuccon] = useState(undefined);

    useEffect(() => {
        if (selectedProduct != null) {
            setdanhmuccon(selectedProduct.danhMucConList);
        }
    }, [selectedProduct]);


    
    const [iddm, setiddm] = useState();
    const [tendm, settendm] = useState();
    const [madm , setmadm] = useState();
    const [dmcha, setdmcha] = useState();
    const toast = useRef(null);

    const [visible, setVisible] = useState(false);
    const [isloaidanhmuc, setisloaidanhmuc] = useState(false);

    const [issualoaidanhmuc, setissualoaidanhmuc] = useState(false);
    const [issuadanhmuc, setissuadanhmuc] = useState(false);


    useEffect(() => {
    }, []);

    const accept = async () => {
        if (dmcha != null) {
            let data = {
                dm_id: iddm,
                dm_ten: tendm,
                dm_ma: madm,
                dm_ldm_id: dmcha.ldm_id,
            }

            try { 
                const response = await axios.post(apisavedanhmuc, data, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                    }
                })
                if (response.status == 200) {
                    toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
                    fetchdata();
                }
                else if (response.status == 404) {
                    toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
                }
            } catch (error) {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
                }
            }
        } else {
            let data = {
                ldm_id: iddm,
                ldm_ten: tendm,
                ldm_ma: madm,
            }

            try {
                const response = await axios.post(apisualoaidanhmuc, data, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                    }
                })
                if (response.status == 200) {
                    toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
                    fetchdata();
                }
                else if (response.status == 404) {
                    toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
                }
            } catch (error) {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
                }
            }
        }
        
        setdmcha("");
        setmadm("");
        settendm("");
    }

    const acceptxoa = async () => {
        if (dmcha != null) {
            try {
                const response = await axios.delete(apixoadanhmuc + iddm, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                    }
                })
                if (response.status == 200) {
                    toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
                    fetchdata();
                }
                else if (response.status == 404) {
                    toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
                }
            } catch (error) {
                
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
                }
            }
        } else {
            try {
                const response = await axios.delete(apixoaloaidanhmuc + iddm, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                    }
                })
                if (response.status == 200) {
                    fetchdata();
                    toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
                }
                else if (response.status == 404) {
                    toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
                }
            } catch (error) {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
                }
                
            }
        }
        setdmcha(null);
        setmadm("");
        settendm("");
    }

    const reject = () => {
        setdmcha(null);
        setmadm("");
        settendm("");
        toast.current.show({ severity: 'warn', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
    }

    const Suadulieudm = (rowData) => {
        setiddm(rowData.dm_id)
        settendm(rowData.dm_ten);
        setmadm(rowData.dm_ma);
        const filtered = datadanhmuc.filter(item => item.ldm_id === rowData.dm_ldm_id);
        setdmcha(filtered[0])
        setissuadanhmuc(true);
    };
    const Xoadulieudm = (rowData) => {
        setiddm(rowData.iddm);
        confirmDialog({
            message: 'Bạn chắc chắn muốn xóa ' + rowData.dm_ten + ' ?',
            header: 'Xác nhận xóa',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: acceptxoa,
            reject
        });
    };

    const Themdulieudm = () => {
        setiddm(0);
        setVisible(false)
        confirmDialog({
            message: 'Bạn chắc chắn muốn thêm ' + tendm + ' ?',
            header: 'Xác nhận thêm',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept,
            reject
        });
    };

    const Themdulieuldm = () => {
        setiddm(0);
        setVisible(false);
        setisloaidanhmuc(false);
        confirmDialog({
            message: 'Bạn chắc chắn muốn thêm ldm ' + tendm + ' ?',
            header: 'Xác nhận thêm',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept,
            reject
        });
    };

    const Suadulieuldm = (rowData) => {
        setiddm(rowData.ldm_id)
        settendm(rowData.ldm_ten);
        setmadm(rowData.ldm_ma);
        setdmcha(null)
        setissualoaidanhmuc(true);
    };
    const Xoadulieuldm = (rowData) => {
        setdmcha(null);
        setiddm(rowData.iddm);
        confirmDialog({
            message: 'Bạn chắc chắn muốn xóa ' + rowData.ldm_ten +' ?',
            header: 'Xác nhận xóa',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: acceptxoa,
            reject
        });
    };

    const ChangedataBodydm = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" onClick={() => Suadulieudm(rowData)} />
                <Button icon="pi pi-trash" severity="danger" onClick={() => Xoadulieudm(rowData)} />
            </div>
        );
    };

    const ChangedataBodyldm = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" onClick={() => Suadulieuldm(rowData)} />
                <Button icon="pi pi-trash" severity="danger" onClick={() => Xoadulieuldm(rowData)} />
            </div>
        );
    };

    const dialogadddm = () => {
        setdmcha(datadanhmuc[0]);
        setmadm("");
        settendm("");
        setVisible(true)
    }
    const dialogaddldm = () => {
        setdmcha(null);
        setmadm("");
        settendm("");
        setisloaidanhmuc(true)
    }

    const xacnhansualdm = () => {
        confirmDialog({
            message: 'Bạn chắc chắn muốn sửa ldm ' + tendm + ' ?',
            header: 'Xác nhận thêm',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept,
            reject
        });
        setissualoaidanhmuc(false);
    }
    const xacnhansuadm = () => {
        confirmDialog({
            message: 'Bạn chắc chắn muốn sửa dm ' + tendm + ' ?',
            header: 'Xác nhận thêm',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept,
            reject
        });
        setissuadanhmuc(false);
    }
    const renderHeaderldm = () => {
        return (
            <div className="nagative-addanhmuc">
                <div className="add-new-dm" style={{ textAlign: 'end' }}>
                    <Button label="Thêm mới loại danh mục" icon="pi pi-plus" size="small" onClick={dialogaddldm} />
                </div>
            </div>

        );
    };



    const renderHeaderdm = () => {
        return (
            <div className="nagative-addanhmuc">
                <div className="add-new-dm" style={{ textAlign: 'end' }}>
                    <Button label="Thêm mới danh mục" icon="pi pi-plus" size="small" onClick={dialogadddm} />
                </div>
            </div>

        );
    };

    


    const footerContent = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setisloaidanhmuc(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={Themdulieuldm} autoFocus />
        </div>
    );


    const footerContentldm = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setVisible(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={Themdulieudm} autoFocus />
        </div>
    );


    const footersuadmContent = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setissuadanhmuc(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={xacnhansuadm} autoFocus />
        </div>
    );


    const footersualdmContentldm = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setissualoaidanhmuc(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={xacnhansualdm} autoFocus />
        </div>
    );

    const headerldm = renderHeaderldm();
    const headerdm = renderHeaderdm();


    const numberBodyTemplate = (rowData, { rowIndex }) => {
        return rowIndex + 1; // Số thứ tự bắt đầu từ 1
    };
    const numberBodyTemplate2 = (rowData, { rowIndex }) => {
        return rowIndex + 1; // Số thứ tự bắt đầu từ 1
    };

    return (
        <div className="view-ad-danhmuc">
            <Toast ref={toast} />
            <ConfirmDialog />
            <h4 style={{ textAlign: 'center' }}> Quản lý danh mục </h4>

            <div className="container-table">
                <div className="table-1">
                    <DataTable value={datadanhmuc} stripedRows selectionMode="single" selection={selectedProduct} onSelectionChange={(e) => setSelectedProduct(e.value)} header={headerldm} >
                        <Column body={numberBodyTemplate} header="STT"></Column>
                        <Column field="ldm_ten" header="Tên loại danh mục"></Column>
                        <Column field="ldm_ma" header="Mã loại danh mục"></Column>
                        <Column header="Thao tác" body={ChangedataBodyldm}></Column>
                    </DataTable>
                </div>
                <div className="table-2">
                    <DataTable value={danhmuccon} stripedRows header={headerdm} emptyMessage="Không có dữ liệu" >
                        <Column body={numberBodyTemplate2} header="STT"></Column>
                        <Column field="dm_ten" header="Tên danh mục"></Column>
                        <Column field="dm_ma" header="Mã danh mục"></Column>
                        <Column header="Thao tác" body={ChangedataBodydm}></Column>
                    </DataTable>
                </div>
            </div>

            <Dialog className="dialog-ad-danhmuc" header="Thêm danh mục" visible={visible} style={{ minWidth: '450px' }} onHide={() => { if (!visible) return; setVisible(false); }} footer={footerContentldm}>
                <div>
                    <label htmlFor="tendm">Tên danh mục</label>
                    <InputText id="tendm" value={tendm} onChange={(e) => settendm(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="madm">Mã danh mục</label>
                    <InputText id="madm" value={madm} onChange={(e) => setmadm(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="select-ldm">Danh mục cha</label>
                    <Dropdown id="select-ldm" value={dmcha} onChange={(e) => setdmcha(e.value)} options={datadanhmuc} optionLabel="ldm_ten" placeholder="Chọn danh mục cha" style={{ width: '100%' }} filter />

                </div>
            </Dialog>

            <Dialog className="dialog-ad-danhmuc" header="Thêm loại danh mục" visible={isloaidanhmuc} style={{ minWidth : '450px'}} onHide={() => { if (!isloaidanhmuc) return; setisloaidanhmuc(false); }} footer={footerContent}>
                <div>
                    <label htmlFor="tendm">Tên danh mục</label>
                    <InputText id="tendm" value={tendm} onChange={(e) => settendm(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="madm">Mã danh mục</label>
                    <InputText id="madm" value={madm} onChange={(e) => setmadm(e.target.value)} />
                </div>
            </Dialog>

            <Dialog className="dialog-ad-danhmuc" header="Sửa loại danh mục" visible={issualoaidanhmuc} style={{ minWidth: '450px' }} onHide={() => { if (!issualoaidanhmuc) return; setissualoaidanhmuc(false); }} footer={footersualdmContentldm}>
                <div>
                    <label htmlFor="tendm">Tên danh mục</label>
                    <InputText id="tendm" value={tendm} onChange={(e) => settendm(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="madm">Mã danh mục</label>
                    <InputText id="madm" value={madm ? madm : ""} onChange={(e) => setmadm(e.target.value)} />
                </div>
            </Dialog>

            <Dialog className="dialog-ad-danhmuc" header="Sửa danh mục" visible={issuadanhmuc} style={{ minWidth: '450px' }} onHide={() => { if (!issuadanhmuc) return; setissuadanhmuc(false); }} footer={footersuadmContent}>
                <div>
                    <label htmlFor="tendm">Tên danh mục</label>
                    <InputText id="tendm" value={tendm} onChange={(e) => settendm(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="madm">Mã danh mục</label>
                    <InputText id="madm" value={madm ? madm : ""} onChange={(e) => setmadm(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="select-ldm">Danh mục cha</label>
                    <Dropdown id="select-ldm" value={dmcha ? dmcha : ""} onChange={(e) => setdmcha(e.value)} options={datadanhmuc} optionLabel="ldm_ten" placeholder="Chọn danh mục cha" style={{ width: '100%' }} filter />

                </div>
            </Dialog>

        </div>
    );
};

export default AdminViewDanhmuc;
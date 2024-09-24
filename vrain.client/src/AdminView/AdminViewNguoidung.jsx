/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputText } from "primereact/inputtext";
import { Dropdown } from 'primereact/dropdown';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { ToggleButton } from 'primereact/togglebutton';
import { Password } from 'primereact/password';
import axios from 'axios';
const AdminViewNguoidung = () => {
    const apigetnguoidung = '/api/Account/allaccount';
    const apigetcoquan = '/api/Admin/allcoquan';
    const apigetdanhmuc = '/api/Admin/alldanhmuccon';
    const apigetrole = '/api/Admin/allrole';
    const apixoanguoidung = '/api/Account/deletenguoidung?ids=';
    const apisavenguoidung = '/api/Account/register';

    const [datanguoidung, setdatanguoidung] = useState();
    const [datanguoidungsp, setdatanguoidungsp] = useState();
    const [datacoquan, setdatacoquan] = useState();
    const [datadanhmuc, setdatadanhmuc] = useState(null);
    const [datarole, setdatarole] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedcq, setSelectedcq] = useState(null);
    const [selecteddanhmuc, setselecteddanhmuc] = useState(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [ischangend, setischangend] = useState(false);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const toast = useRef(null);

    const [memId, setMemId] = useState("");
    const [memUsername, setMemUsername] = useState("");
    const [memPassword, setMemPassword] = useState("");
    const [memPasswordr, setMemPasswordr] = useState("");
    const [memHoten, setMemHoten] = useState("");
    const [memCqId, setMemCqId] = useState();
    const [memOpCq, setMemOpCq] = useState('');
    const [memEmail, setMemEmail] = useState('');
    const [memMobile, setMemMobile] = useState('');
    const [memActive, setMemActive] = useState(true);
    const [textdialognd, settextdialognd] = useState('');
    const [isdialogadd, setisdialogadd] = useState(false);


    useEffect(() => {
        fetchdatand();
        fetchdatacq();
        fetchdatadm();
        fetchdatarl();
    }, []);
    const fetchdatarl = async () => {
        try {
            const response = await axios.get(apigetrole);
            setdatarole(response.data);
        } catch (error) {
            console.error('Error fetching data role', error);
        }
    };
    const fetchdatand = async () => {
        try {
            const response = await axios.get(apigetnguoidung);
            setdatanguoidung(response.data);
            setdatanguoidungsp(response.data);
        } catch (error) {
            console.error('Error fetching data nguoidung', error);
        }
    };
    const fetchdatacq = async () => {
        const response = await axios.get(apigetcoquan);
        setdatacoquan(response.data);
    }
    const fetchdatadm = async () => {
        try {
            const response = await axios.get(apigetdanhmuc);
            setdatadanhmuc(response.data);
        } catch (error) {
            console.error('Error fetching data danhmuc', error);
        }
    };
    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    


    const Suadulieund = (rowData) => {
        const cqvalue = datacoquan.find(s => s.cq_id = rowData.mem_cq_id);
        settextdialognd('Sửa tài khoản')
        setMemId(rowData.mem_id);
        setMemUsername(rowData.mem_username);
        setMemHoten(rowData.mem_hoten);
        setMemEmail(rowData.mem_email);
        setMemOpCq(cqvalue);
        setMemCqId(cqvalue.cq_id);
        setMemMobile(rowData.mem_mobile);
        setMemActive(rowData.mem_active);
        setisdialogadd(false);
        setischangend(true)
    };
    const Themdulieund = () => {
        setisdialogadd(true);
        settextdialognd('Thêm mới tài khoản');
        setMemId('00000000-0000-0000-0000-000000000000');
        setMemUsername("");
        setMemPassword("");
        setMemPasswordr("");
        setMemHoten("");
        setMemEmail("");
        setMemCqId("");
        setMemMobile("");
        setMemActive(true);
        setischangend(true)
    };
    const Savedulieund = () => {
        if (memOpCq == "") {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Không để trống đơn vị !', life: 3000 });
            return;
        }
        if (memUsername == "") {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Không để trống tên đăng nhập !', life: 3000 });
            return;
        }
        if (memPassword == "") {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Không để trống mật khẩu !', life: 3000 });
            return;
        }
        if (memPassword != memPasswordr) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Mật khẩu không trùng !', life: 3000 });
            return;
        }
        setisdialogadd(false);
        let data = {
            "mem_id": memId,
            "mem_username": memUsername,
            "mem_password": memPassword,
            "mem_hoten": memHoten,
            "mem_cq_id": memOpCq.cq_id,
            "mem_email": memEmail,
            "mem_mobile": memMobile,
            "mem_active": memActive,
            "mem_stt": null,
            "mem_role": null,
            "mem_numofdaydisplay": null,
            "mem_hourdisplay": null,
            "scada_role": null,
            "mem_minutedisplay": null
        }
        axios.post(apisavenguoidung, data, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            })
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.data.message, life: 3000 });
                fetchdatand();
                setischangend(false);
            })
            .catch(error => {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    console.error('There was an error saving the account!', error);
                }
            });
    };
    const acceptxoa = (rowData) => {
        axios.delete(apixoanguoidung + rowData.mem_id, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            })
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.data, life: 3000 });
                fetchdatand();
            })
            .catch(error => {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    console.error('Lỗi xóa dữ liệu  : ', error);
                }
            });
    }

    const reject = () => {

    }

    const Xoadulieund = (rowData) => {
        confirmDialog({
            message: 'Bạn chắc chắn muốn xóa?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: () => acceptxoa(rowData),
            reject
        });
    };
    
    useEffect(() => {
        if (selectedProduct != null && datadanhmuc != null) {
            const cqvalue = datacoquan.find(s => s.cq_id === selectedProduct.mem_cq_id);
            const cq_role = datarole.filter(s => s.role_cq_id === cqvalue.cq_id);
            const dmData = cq_role.map(s => ({
                dm_ma: s.role_ma,
                dm_ten: s.role_ten
            }));
            setselecteddanhmuc(dmData);
        }
        else {
            setselecteddanhmuc(null);
        }
    }, [selectedProduct]);

    const ChangedataBodynd = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" onClick={() => Suadulieund(rowData)} />
                <Button icon="pi pi-trash" severity="danger" onClick={() => Xoadulieund(rowData)} />
            </div>
        );
    };

    const renderHeadernd = () => {
        return (
            <div className="nagative-nguoidung">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Tìm theo tên" className="p-inputtext-sm" />
                </IconField>
                <div className="add-new-cq" style={{ textAlign: 'end' }}>
                    <Button label="Thêm mới" icon="pi pi-plus" size="small" onClick={Themdulieund} />
                </div>
            </div>

        );
    };
    const renderHeaderdm = () => {
        return (
            <div className="nagative-savequyen">
                <span>Phân quyền sử dụng</span>
                
            </div>

        );
    };

    const headernd = renderHeadernd();
    const headerldm = renderHeaderdm();



    const ChangedataBodycq = (rowData) => {
        let coquan = null;
        if (datacoquan != null ) {
            coquan = datacoquan.find(s => s.cq_id == rowData.mem_cq_id);
        }
        return (
            <span>{coquan ? coquan.cq_ten : "N/A"}</span>
        );
    };

    const footerContentsnd = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setischangend(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={Savedulieund} autoFocus />
        </div>
    );
    const renderHeadercq = () => {
        return (
            <div className="nagative-addcoquan">
                <span>Danh sách cơ quan</span>
                <Button icon="pi pi-filter-slash" rounded text onClick={() => setSelectedcq(null)}></Button>
            </div>
        );
    };
    const headerlcq = renderHeadercq();

    useEffect(() => {
        if (selectedcq && selectedcq.cq_id != null) {
            setdatanguoidung(datanguoidungsp.filter(s => s.mem_cq_id === selectedcq.cq_id));
        } else {
            setdatanguoidung(datanguoidungsp);
        }
    }, [selectedcq, datanguoidungsp]);
    return (
        <div className="view-ad-nguoidung">
            <h4 style={{ textAlign: 'center' }}> Thông tin người dùng </h4>
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="content-view">
                <div className='container-coquan'>
                    <DataTable value={datacoquan} stripedRows selectionMode="single" selection={selectedcq} onSelectionChange={(e) => setSelectedcq(e.value)} header={headerlcq} emptyMessage="Không có dữ liệu" >
                        <Column field="cq_ten" header="Tên cơ quan"></Column>
                    </DataTable>
                </div>
                <div className="container-table">
                    <div className="table-1">
                        <DataTable value={datanguoidung} stripedRows selectionMode="single" selection={selectedProduct} onSelectionChange={(e) => setSelectedProduct(e.value)} header={headernd} filters={filters} globalFilterFields={['mem_username', 'mem_hoten']} emptyMessage="Không có dữ liệu" >
                            <Column field="mem_hoten" header="Họ và tên"></Column>
                            <Column field="mem_username" header="Tên đăng nhập"></Column>
                            <Column body={ChangedataBodycq} header="Đơn vị"></Column>
                            <Column header="Thao tác" body={ChangedataBodynd}></Column>
                        </DataTable>
                    </div>
                </div>
                <div className="content-phanquyen" >
                    <div className="table-2">
                        <DataTable value={datadanhmuc} selectionMode={'checkbox'} selection={selecteddanhmuc} onSelectionChange={(e) => setselecteddanhmuc(e.value)} dataKey="dm_ma" header={headerldm}>
                            <Column bodyClassName='disabled-checkbox' selectionMode="multiple" headerStyle={{ width: '3rem' }} headerClassName='disabled-checkbox'></Column>
                            <Column field="dm_ten" header="Tên danh mục"></Column>
                            <Column field="dm_ma" header="Mã danh mục"></Column>
                        </DataTable>
                    </div>
                </div>
            </div>

            <Dialog className="dialog-ad-danhmuc" header={textdialognd} visible={ischangend} style={{ minWidth: '650px' }} onHide={() => { if (!ischangend) return; setischangend(false); }} footer={footerContentsnd} >
                <div>
                    <label htmlFor="memHoten">Họ tên</label>
                    <InputText id="memHoten" value={memHoten} onChange={(e) => setMemHoten(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="memCqId">Đơn vị</label>
                    <Dropdown id="memCqId" value={memOpCq} onChange={(e) => setMemOpCq(e.target.value)} options={datacoquan} optionLabel="cq_ten" style={{ width : '100%' }} />
                </div>
                <div>
                    <label htmlFor="memUsername">Tên đăng nhập</label>
                    <InputText id="memUsername" value={memUsername} onChange={(e) => setMemUsername(e.target.value)} />
                </div>
                
                {isdialogadd && (
                    <div>
                        <div>
                            <label htmlFor="memPassword">Mật khẩu</label>
                            <Password type="text" id="memPassword" value={memPassword} onChange={(e) => setMemPassword(e.target.value)} feedback={false} tabIndex={1} toggleMask style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label htmlFor="memPasswordr">Nhập lại mật khẩu</label>
                            <Password id="memPasswordr" value={memPasswordr} onChange={(e) => setMemPasswordr(e.target.value)} feedback={false} tabIndex={1} toggleMask style={{ width: '100%' }} />
                        </div>
                    </div>
                )}
                <div>
                    <label htmlFor="memEmail">Email</label>
                    <InputText id="memEmail" value={memEmail} onChange={(e) => setMemEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="memMobile">Số điện thoại</label>
                    <InputText id="memMobile" value={memMobile} onChange={(e) => setMemMobile(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0px 0px 0px' }}>
                    <label htmlFor="memActive" style={{ marginRight : '10px' }}>Trạng thái</label>
                    <ToggleButton onLabel="Đang kích hoạt" offLabel="Không kích hoạt" onIcon="pi pi-check" offIcon="pi pi-times" id="memActive" checked={memActive} onChange={(e) => setMemActive(e.value)} />
                </div>
            </Dialog>
        </div>
    );
};

export default AdminViewNguoidung;
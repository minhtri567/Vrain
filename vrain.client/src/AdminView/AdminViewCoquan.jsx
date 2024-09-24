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
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import jsonData from '../Data/select-vn.json';
import axios from 'axios';
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from 'primereact/multiselect';
const AdminViewCoquan = () => {

    const apigetcoquan = 'https://localhost:7299/api/Admin/allcoquan';
    const apisavecoquan = 'https://localhost:7299/api/Admin/savecoquan';
    const apisaverole = 'https://localhost:7299/api/Admin/saverole';
    const apigetdanhmuc = 'https://localhost:7299/api/Admin/alldanhmuccon';
    const apigetrole = 'https://localhost:7299/api/Admin/allrole';
    const apixoacoquan = 'https://localhost:7299/api/Admin/deletecoquan?id=';
    const toast = useRef(null);
    const [datacoquan, setdatacoquan] = useState();
    const [datadanhmuc, setdatadanhmuc] = useState(null);
    const [datarole, setdatarole] = useState(null);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selecteddanhmuc, setselecteddanhmuc] = useState(null);
    const [isaddcowuan, setisaddcowuan] = useState(false);
    const [ischangecoquan, setischangecoquan] = useState(false);

    const [filtersProvince, setProvinceFilterValue] = useState('');
    const [filtersDistrict, setDistrictFilterValue] = useState(null);
    const [filtersCommune, setCommuneFilterValue] = useState(null);
    const [selectedCities, setSelectedCities] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [oppv, setoppv] = useState(null);

    const [provinces, setProvinces] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [communeOptions, setCommuneOptions] = useState([]);
    
    const [cqTen, setCqTen] = useState('');
    const [cqDiaChi, setCqDiaChi] = useState('');
    const [cqNguoiDaiDien, setCqNguoiDaiDien] = useState('');
    const [cqDienThoai, setCqDienThoai] = useState('');
    const [cqEmail, setCqEmail] = useState('');
    const [cqId, setCqId] = useState(0);
    const [cqGhiChu, setCqGhiChu] = useState('');

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

    const fetchdatarl = async () => {
        try {
            const response = await axios.get(apigetrole);
            setdatarole(response.data);
        } catch (error) {
            console.error('Error fetching data role', error);
        }
    };

    useEffect(() => {
        fetchdatadm();
        fetchdatarl();
        fetchdatacq();
    }, []);
    useEffect(() => {
        const provinceOptions = jsonData[0].result.map(tinh => tinh.ten_tinh);
        setProvinces(provinceOptions);
    }, []);
    useEffect(() => {
        const provinceOp = jsonData[0].result.map(tinh => ({ 
            pid: tinh.id_tinh, 
            name: tinh.ten_tinh 
        }));
        setoppv(provinceOp)
    }, []);
    const [spcommuneOptions, setspCommuneOptions] = useState([]);
    useEffect(() => {
        setDistrictFilterValue(undefined);
        setCommuneFilterValue(undefined);
        if (filtersProvince) {
            const province = jsonData[0].result.find(p => p.ten_tinh === filtersProvince);
            setspCommuneOptions(province.huyens);
            if (province) {
                const districtOptions = province.huyens.map(huyen =>  huyen.ten_huyen);
                setDistrictOptions(districtOptions);
                setCommuneFilterValue(null);
                setCommuneOptions([]); // Clear communes if province is changed
            }
        } else {
            setDistrictOptions([]);
        }
    }, [filtersProvince]);
    useEffect(() => {
        setCommuneFilterValue(undefined);
        if (filtersDistrict && spcommuneOptions) {
            const temp = spcommuneOptions.find(p => p.ten_huyen === filtersDistrict);
            if(temp != null){
                const communes = temp.xas.map(xa => xa.ten_xa );
                setCommuneOptions(communes);
            }
        } else {
            setCommuneOptions([]);
        }
    }, [filtersDistrict]);


    useEffect(() => {
        if (selectedProduct != null) {
            const cq_role = datarole.filter(s => s.role_cq_id === selectedProduct.cq_id);

            const dmData = cq_role.map(s => ({
                dm_ma: s.role_ma,
                dm_ten: s.role_ten
            }));

            setselecteddanhmuc(dmData);
        } else {
            setselecteddanhmuc(null)
        }

    }, [selectedProduct]);

    // thêm mới cơ quan
    const dialogaddcq = () => {
        setDistrictOptions(null);
        setCommuneOptions(null);
        setProvinceFilterValue(null);
        setCqTen("");
        setCqDiaChi("");
        setCqNguoiDaiDien("");
        setCqDienThoai("");
        setCqEmail("");
        setCqId(0);
        setCqGhiChu("");
        setisaddcowuan(true);
    }

    const accept = () => {
        const user_name = localStorage.getItem('user_name');
        const newRoles = selecteddanhmuc.map(dm => ({
            role_cq_id: selectedProduct.cq_id,
            role_ma: dm.dm_ma,
            role_ten: dm.dm_ten,
            role_nguoitao: user_name,
            role_type: 1
        }));

        axios.post(apisaverole, newRoles, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            })
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.data, life: 3000 });
                fetchdatadm();
                fetchdatarl();
                fetchdatacq();
            })
            .catch(error => {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    console.error('There was an error saving the roles!', error);
                }
            });
    }

    const acceptxoa = () => {
        axios.delete(apixoacoquan + cqId, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            })
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.data, life: 3000 });
                fetchdatadm();
                fetchdatarl();
                fetchdatacq();
            })
            .catch(error => {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    console.error('There was an error saving the roles!', error);
                }
            });
    }

    const reject = () => {
        setischangecoquan(false);
    }

    const dialogadddm = () => {
        confirmDialog({
            message: 'Bạn chắc chắn muốn lưu?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept,
            reject
        });
    }

    const renderHeadercq = () => {
        return (
            <div className="nagative-addcoquan">
                <span>Danh sách cơ quan</span>
                <div className="add-new-cq" style={{ textAlign: 'end' }}>
                    <Button label="Thêm mới" icon="pi pi-plus" size="small" onClick={dialogaddcq} />
                </div>
            </div>
        );
    };
    const renderHeaderdm = () => {
        return (
            <div className="nagative-savequyen">
                <span>Phân quyền sử dụng</span>
                <div className="save-quyen" style={{ textAlign: 'end' }}>
                    <Button label="Lưu quyền" icon="pi pi-save" size="small" onClick={dialogadddm} />
                </div>
            </div>

        );
    };
    const headerlcq = renderHeadercq();
    const headerldm = renderHeaderdm();

    //sửa dữ liệu cơ quan
    const Suadulieucq = (rowData) => {
        setCqId(rowData.cq_id);
        setCqTen(rowData.cq_ten);
        setCqDiaChi(rowData.cq_diachi);
        setProvinceFilterValue(rowData.cq_tinhid);
        setDistrictFilterValue(rowData.cq_huyenid);
        setCommuneFilterValue(rowData.cq_xaid);
        setCqNguoiDaiDien(rowData.cq_nguoidaidien);
        setCqDienThoai(rowData.cq_dienthoai);
        setCqEmail(rowData.cq_email);
        setCqGhiChu(rowData.cq_ghichu);
        setSelectedCities(rowData.cq_role_tinhid);
        setischangecoquan(true);
    };
    const Xoadulieucq = (rowData) => {
        setCqId(rowData.cq_id);
        confirmDialog({
            message: 'Bạn chắc chắn muốn xóa?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: acceptxoa,
            reject
        });
    };
    const Savedulieucq = () => {

        if (!cqTen) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Tên cơ quan không được để trống !', life: 3000 });
            return;
        }
        if (!/^\d+$/.test(cqDienThoai)) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Số điện thoại không hợp lệ !', life: 3000 });
            return;
        }

        confirmDialog({
            message: 'Bạn chắc chắn muốn lưu?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            accept: acceptcq,
            reject
        });
    };
    const acceptcq = () => {
        let data = {
            "cq_id": cqId,
            "cq_ten": cqTen,
            "cq_mota": "",
            "cq_diachi": cqDiaChi,
            "cq_nguoidaidien": cqNguoiDaiDien,
            "cq_dienthoai": cqDienThoai,
            "cq_email": cqEmail,
            "cq_ghichu": cqGhiChu,
            "cq_active": true,
            "cq_loai": "",
            "cq_tinhid": filtersProvince ? filtersProvince : "",
            "cq_huyenid": filtersDistrict ? filtersDistrict : "",
            "cq_xaid": filtersCommune ? filtersCommune : "",
            "cq_role_tinhid" : selectedCities ? selectedCities : ""

        }
        axios.post(apisavecoquan, data, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            })
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.data, life: 3000 });
                fetchdatadm();
                fetchdatarl();
                fetchdatacq();
                setisaddcowuan(false);
                setischangecoquan(false)
            })
            .catch(error => {
                if (error.response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    console.error('Có lỗi khi lưu dữ liệu!', error);
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Lưu không thành công !', life: 3000 });
                }
            });
            
    }

    const ChangedataBodyldm = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" onClick={() => Suadulieucq(rowData)} />
                <Button icon="pi pi-trash" severity="danger" onClick={() => Xoadulieucq(rowData)} />
            </div>
        );
    };

    const footerContent = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setisaddcowuan(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={Savedulieucq} autoFocus />
        </div>
    );

    const footerContentscq = (
        <div>
            <Button label="Hủy" icon="pi pi-times" onClick={() => setischangecoquan(false)} className="p-button-text" />
            <Button label="Lưu" icon="pi pi-check" onClick={Savedulieucq} autoFocus />
        </div>
    );

    return (
        <div className="view-ad-coquan">
            <Toast ref={toast} />
            <ConfirmDialog />
            <h4 style={{ textAlign: 'center' }}>Quản lý đơn vị sử dụng</h4>
            <div className="content-view">
                <div className="container-table">
                    <div className="table-1">
                        <DataTable value={datacoquan} stripedRows selectionMode="single" selection={selectedProduct} onSelectionChange={(e) => setSelectedProduct(e.value)} header={headerlcq} emptyMessage="Không có dữ liệu" >
                            <Column field="cq_ten" header="Tên cơ quan"></Column>
                            <Column field="cq_diachi" header="Địa chỉ"></Column>
                            <Column field="cq_dienthoai" header="Số điện thoại"></Column>
                            <Column field="cq_email" header="Email"></Column>
                            <Column header="Thao tác" body={ChangedataBodyldm}></Column>
                        </DataTable>
                    </div>
                </div>
                <div className="content-phanquyen" >
                    <div className="table-2">
                        <DataTable value={datadanhmuc} selectionMode={'checkbox'} selection={selecteddanhmuc} onSelectionChange={(e) => setselecteddanhmuc(e.value)} dataKey="dm_ma" header={headerldm}>
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                            <Column field="dm_ten" header="Tên danh mục"></Column>
                            <Column field="dm_ma" header="Mã danh mục"></Column>
                        </DataTable>
                    </div>
                </div>
            </div>
            
            <Dialog className="dialog-ad-danhmuc" header="Thêm cơ quan" visible={isaddcowuan} style={{ minWidth: '650px' }} onHide={() => { if (!isaddcowuan) return; setisaddcowuan(false); }} footer={footerContent} >
                <div>
                    <label htmlFor="tencq">Tên cơ quan</label>
                    <InputText id="tencq" value={cqTen} onChange={(e) => setCqTen(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="diachicq">Địa chỉ</label>
                    <InputText id="diachicq" value={cqDiaChi} onChange={(e) => setCqDiaChi(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="sl_tinh">Tỉnh: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_tinh"
                        value={filtersProvince}
                        onChange={(e) => setProvinceFilterValue(e.value)}
                        options={provinces}
                        optionLabel="name"
                        placeholder="Chọn tỉnh"
                        filter
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="sl_huyen">Huyện: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_huyen"
                        value={filtersDistrict}
                        onChange={(e) => setDistrictFilterValue(e.value)}
                        options={districtOptions}
                        optionLabel="name"
                        placeholder="Chọn huyện"
                        filter
                        disabled={!filtersProvince}
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="sl_xa">Xã: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_xa"
                        value={filtersCommune}
                        onChange={(e) => setCommuneFilterValue(e.value)}
                        options={communeOptions}
                        optionLabel="name"
                        placeholder="Chọn xã"
                        filter
                        disabled={!filtersDistrict}
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="nddcq">Người đại diện</label>
                    <InputText id="nddcq" value={cqNguoiDaiDien} onChange={(e) => setCqNguoiDaiDien(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="sdtcq">Số điện thoại</label>
                    <InputText id="sdtcq" value={cqDienThoai} onChange={(e) => setCqDienThoai(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="emailcq">Thư điện tử</label>
                    <InputText id="emailcq" value={cqEmail} onChange={(e) => setCqEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="ghichucq">Ghi chú</label>
                    <InputTextarea id="ghichucq" value={cqGhiChu} autoResize onChange={(e) => setCqGhiChu(e.target.value)} rows={5} style={{ width: '100%' }}  />
                </div>
            </Dialog>

            <Dialog className="dialog-ad-danhmuc" header="Sửa cơ quan" visible={ischangecoquan} style={{ minWidth: '650px' }} onHide={() => { if (!ischangecoquan) return; setischangecoquan(false); }} footer={footerContentscq} >
                <div>
                    <label htmlFor="tencq">Tên cơ quan</label>
                    <InputText id="tencq" value={cqTen} onChange={(e) => setCqTen(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="diachicq">Địa chỉ</label>
                    <InputText id="diachicq" value={cqDiaChi} onChange={(e) => setCqDiaChi(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="sl_tinh">Tỉnh: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_tinh"
                        value={filtersProvince}
                        onChange={(e) => setProvinceFilterValue(e.value)}
                        options={provinces}
                        optionLabel="name"
                        placeholder="Chọn tỉnh"
                        filter
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="sl_huyen">Huyện: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_huyen"
                        value={filtersDistrict}
                        onChange={(e) => setDistrictFilterValue(e.value)}
                        options={districtOptions}
                        optionLabel="name"
                        placeholder="Chọn huyện"
                        filter
                        disabled={!filtersProvince}
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="sl_xa">Xã: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_xa"
                        value={filtersCommune}
                        onChange={(e) => setCommuneFilterValue(e.value)}
                        options={communeOptions}
                        optionLabel="name"
                        placeholder="Chọn xã"
                        filter
                        disabled={!filtersDistrict}
                        style={{ width: '100%' }}
                    />
                </div>
                <div>
                    <label htmlFor="nddcq">Người đại diện</label>
                    <InputText id="nddcq" value={cqNguoiDaiDien} onChange={(e) => setCqNguoiDaiDien(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="sdtcq">Số điện thoại</label>
                    <InputText id="sdtcq" value={cqDienThoai} onChange={(e) => setCqDienThoai(e.target.value)} />
                </div>
                <div>
                    <label>Phân quyền theo tỉnh : </label>
                    <br></br>
                    <MultiSelect value={selectedCities} 
                    onChange={(e) => {
                        setSelectedCities(e.value);
                        setSelectAll(e.value.length === oppv.length);
                    }} 
                    selectAll={selectAll}
                    onSelectAll={(e) => {
                        setSelectedCities(e.checked ? [] : oppv.map((item) => item.pid));
                        setSelectAll(!e.checked);
                    }}
                    options={oppv} 
                    optionLabel="name"
                    optionValue="pid"
                    filter 
                    placeholder="Chọn tỉnh" 
                    maxSelectedLabels={3}
                    style={{width : '100%'}}
                     />
                </div>
                <div>
                    <label htmlFor="emailcq">Thư điện tử</label>
                    <InputText id="emailcq" value={cqEmail} onChange={(e) => setCqEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="ghichucq">Ghi chú</label>
                    <InputTextarea id="ghichucq" autoResize value={cqGhiChu} onChange={(e) => setCqGhiChu(e.target.value)} rows={5} style={{ width : '100%' }} />
                </div>
            </Dialog>

        </div>
    );
};

export default AdminViewCoquan;
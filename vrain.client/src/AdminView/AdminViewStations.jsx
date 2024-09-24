
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import jsonData from '../Data/select-vn.json'; 
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import axios from 'axios';

const AdminViewStations = () => {
    const getallstations = '/api/Admin/infostations';
    const savestations = '/api/Admin/savestations';
    const deletestations = '/api/Admin/deletestations';
    const apithongso ='/api/Admin/thongsoquantrac?key_station='
    const apidanhmucqt ='/api/Admin/danhmucqt'
    const apisavetsdlqt ='/api/Admin/savetsdlqt'
    const apideletetsdlqt ='/api/Admin/deletetsdlqt'
    const [stations, setStations] = useState([]);
    const [thongsoqt, setthongsoqt] = useState([]);
    const [vwstations, setvwStations] = useState([]);
    const [datadmqt, setdatadmqt] = useState([]);
    const [addnametsqt, setaddnametsqt] = useState('');
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [ThemmoiDialog, setThemmoiDialog] = useState(false);
    const navigate = useNavigate();
    const [keystationsselected, setkeystationsselected] = useState('');
    
    const [filtersProvince, setProvinceFilterValue] = useState('');
    const [filtersDistrict, setDistrictFilterValue] = useState(null);
    const [filtersCommune, setCommuneFilterValue] = useState(null);

    const [provinces, setProvinces] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [communeOptions, setCommuneOptions] = useState([]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });
    useEffect(() => {
        const fetchstaions = async () => {
            try {
                const response = await fetch(getallstations);
                const data = await response.json()
                const storedPids = JSON.parse(localStorage.getItem('lpid')) || [];

                if (storedPids.length > 0) {
                    const filteredData =  data.filter( station => storedPids.includes(station.order_province) )
                    setvwStations(filteredData);
                    setStations(filteredData);
                }else{
                    setvwStations(data);
                    setStations(data);
                }
                
            } catch (error) {
                console.error('Error fetching data stations', error);
            }
        };

        fetchstaions();
    }, []);
    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;
        
        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    
    useEffect(() => {
        const provinceOptions = jsonData[0].result.map(tinh => ({
            name: tinh.ten_tinh,
            idprovince: tinh.id_tinh
        }));
        setProvinces(provinceOptions);
    }, [filtersProvince, stations ]);
    const [spcommuneOptions, setspCommuneOptions] = useState([]);
    useEffect(() => {
        setDistrictFilterValue(undefined);
        setCommuneFilterValue(undefined);
        if (filtersProvince) {
            const province = jsonData[0].result.find(p => p.id_tinh === filtersProvince.idprovince);
            setspCommuneOptions(province.huyens);
            if (province) {
                const districtOptions = province.huyens.map(huyen => ({
                    name: huyen.ten_huyen
                }));

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
        if (filtersDistrict && spcommuneOptions ) {
            const temp = spcommuneOptions.find(p => p.ten_huyen === filtersDistrict.name);
            const communes = temp.xas.map(xa => ({
                name: xa.ten_xa
            }));
            setCommuneOptions(communes);
        } else {
            setCommuneOptions([]);
        }
    }, [filtersDistrict]);

    useEffect(() => {
        let filteredData = stations;

        if (filtersProvince) {
            const provinceName = filtersProvince.name;
            filteredData = filteredData.filter(station => station.tinh == provinceName);
        }
        if (filtersDistrict) {
            const districtName = filtersDistrict.name;
            filteredData = filteredData.filter(station => station.quanhuyen === districtName);

        }
        if (filtersCommune) {
            const communeName = filtersCommune.name;
            filteredData = filteredData.filter(station => station.phuongxa === communeName);
        }
        setvwStations(filteredData);
    }, [filtersProvince, filtersDistrict, filtersCommune]);

    const Handlecleanfilter = () => {
        setDistrictFilterValue("");
        setCommuneFilterValue("");
        setProvinceFilterValue("");
    }
    let emptyStation = {
        key: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        station_id: "",
        station_name: "",
        order_province: 0,
        luuvuc: "",
        tinh: "",
        phuongxa: "",
        quanhuyen: "",
        lat: 0,
        lon: 0,
        description: "",
        infor_data: ""
    }

    const [selectedProducts, setSelectedProducts] = useState(null);

    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [productDialog, setProductDialog] = useState(false);

    const openNew = () => {
        setaddguidstation('00000000-0000-0000-0000-000000000000')
        setaddNamestation('');
        setaddidstation('');
        setaddluuvucstation('');
        setaddtinhstation('');
        setaddhuyenstation('');
        setaddxastation('');
        setaddlatstation('');
        setaddlonstation('');
        setadddescstation('');
        setProductDialog(true);
    };
    const confirmDeleteSelected = () => {
        setDeleteProductDialog(true);
    };
    
    const getdatadanhmucqt = async() => {
        try {
            const response = await fetch(apidanhmucqt);
            const data = await response.json();
            setdatadmqt(data)
        } catch (error) {
            console.error('Error fetching data stations', error);
        }
    };
    useEffect(() => {
        getdatadanhmucqt();
    },[])
    const renderHeader = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="filter-pdc">
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
                    />
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
                    />
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
                    />
                    <i className="pi pi-filter-slash" title="Clear filter" onClick={Handlecleanfilter}></i>

                    <div className="add-delete-btn">
                        <Button label="Thêm trạm" icon="pi pi-plus" severity="success" onClick={openNew} />
                        <Button label="Xóa trạm" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedProducts || !selectedProducts.length} />
                    </div>
                </div>
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText className="p-inputtext-sm" value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
                </IconField>
            </div>
        );
    };
    const header = renderHeader();

    const toast = useRef(null);

    const saveProduct = async () => {
        let data = {
            key: addguidstation ? addguidstation : "00000000-0000-0000-0000-000000000000",
            station_id: addidstation,
            station_name: addNamestation,
            order_province: addtinhstation.idprovince,
            luuvuc: addluuvucstation,
            tinh: addtinhstation.name,
            phuongxa: addhuyenstation.name,
            quanhuyen: addxastation.name,
            lat: addlatstation,
            lon: addlonstation,
            description: adddescstation,
            infor_data: ""
        }
        try {
            const response = await axios.post(savestations, data, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });

            if (response.status == 200) {
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
            }
            else if (response.status == 404) {
                toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
        }
        
    }
    
    const savedlqt = async () => {
        let data = {
            "tskt_id": 0,
            "tskt_ten": addnametsqt,
            "tskt_stt": 0,
            "tskt_deletedstatus": 0,
            "tskt_maloaithongso": dlqtselected.dm_ma,
            "tskt_nguong_min": 0,
            "tskt_nguong_max": 0,
            "works_id": keystationsselected ,
            "tskt_nhaplieuthucong": true,
            "tskt_key": "00000000-0000-0000-0000-000000000000",
            "nguon_dulieu": "",
        }
        try {
            const response = await axios.post(apisavetsdlqt, data, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });

            if (response.status == 200) {
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
                setThemmoiDialog(false);
                const response = await fetch(apithongso + keystationsselected);
                const data = await response.json()
                setthongsoqt(data);
            }
            else if (response.status == 404) {
                toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
            }
            
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
        }
        
    }
    const hideDialog = () => {
        setProductDialog(false);
    };
    const hideDeleteProductDialog = () => {
        setDeleteProductDialog(false);
    };

    const deleteProduct = async () => {

        try {
            const response = await axios.delete(deletestations, {
                data: selectedProducts,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });

            if (response.status == 200) {
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: response.data, life: 3000 });
                setThemmoiDialog(false);
            }
            else if (response.status == 404) {
                toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: response.data, life: 3000 });
            }
            else {
                
                if (response.status == 403) {
                    toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện !", life: 3000 });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
                }
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lưu dữ liệu thất bại', life: 3000 });
        }
        hideDeleteProductDialog();

    }

    const productDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveProduct} />
        </React.Fragment>
    );
    const dlqtDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={() => setThemmoiDialog(false)} />
            <Button label="Lưu" icon="pi pi-check" onClick={savedlqt} />
        </React.Fragment>
    );

    const deleteProductDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteProductDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteProduct} />
        </React.Fragment>
    );

    const [addguidstation, setaddguidstation] = useState('');
    const [addNamestation, setaddNamestation] = useState('');
    const [addidstation, setaddidstation] = useState('');
    const [addluuvucstation, setaddluuvucstation] = useState('');
    const [addtinhstation, setaddtinhstation] = useState(null);
    const [dlqtselected, setdlqtselected] = useState(null);
    const [addhuyenstation, setaddhuyenstation] = useState(null);
    const [addxastation, setaddxastation] = useState(null);
    const [addlatstation, setaddlatstation] = useState(null);
    const [addlonstation, setaddlonstation] = useState(null);
    const [adddescstation, setadddescstation] = useState('');

    const [addoptinhstation, setaddoptinhstation] = useState([]);
    const [addophuyenstation, setaddophuyenstation] = useState([]);
    const [addopxastation, setaddopxastation] = useState([]);

    useEffect(() => {
        const provinceOptions = jsonData[0].result.map(tinh => ({
            name: tinh.ten_tinh,
            idprovince: tinh.id_tinh
        }));
        setaddoptinhstation(provinceOptions);
    }, [stations]);
    const [spaddopxastation, setspaddopxastation] = useState([]);
    useEffect(() => {
        if (addtinhstation) {
            const province = jsonData[0].result.find(p => p.id_tinh === addtinhstation.idprovince);
            setspCommuneOptions(province.huyens);
            if (province) {
                const districtOptions = province.huyens.map(huyen => ({
                    name: huyen.ten_huyen
                }));

                setaddophuyenstation(districtOptions);
                setspaddopxastation(districtOptions)

                setaddopxastation([]); // Clear communes if province is changed
            }
        } else {
            setDistrictOptions([]);
        }
    }, [addtinhstation]);

    useEffect(() => {
        setCommuneFilterValue(undefined);
        if (addhuyenstation && spaddopxastation) {
            const temp = spcommuneOptions.find(p => p.ten_huyen === addhuyenstation.name);
            const communes = temp.xas.map(xa => ({
                name: xa.ten_xa
            }));
            setaddopxastation(communes);
        } else {
            setaddopxastation([]);
        }
    }, [addhuyenstation]);

    const editstations = (rowData) => {
        setaddguidstation(rowData.key);
        setaddNamestation(rowData.station_name)
        setaddidstation(rowData.station_id)
        setaddluuvucstation(rowData.luuvuc)
        setaddtinhstation({
            name: rowData.tinh,
            idprovince: rowData.order_province
        });
        const province = jsonData[0].result.find(p => p.id_tinh === rowData.order_province);
        setspCommuneOptions(province.huyens);

        setaddhuyenstation({
                name: rowData.quanhuyen
        });
        setaddxastation({
            name: rowData.phuongxa
        });

        setaddlatstation(rowData.lat)
        setaddlonstation(rowData.lon)
        setadddescstation(rowData.description ? rowData.description : "")

        setProductDialog(true);
    }
    const viewapistations = async (rowData) => {
        try {
            const response = await fetch(apithongso + rowData.key);
            const data = await response.json()
            setthongsoqt(data);
        } catch (error) {
            console.error('Error fetching data stations', error);
        }
        setVisibleqt(true)
        setkeystationsselected(rowData.key);
    }
    const ChangedataBodynd = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" onClick={() => editstations(rowData) } />
                <Button icon="pi pi-key" onClick={() => viewapistations(rowData)} />
            </div>
        );
    };

    const Themmoidlqt = () => {
        setThemmoiDialog(true)
    };
    
    const Headerkeythongso = () => {
        return (
            <div className="nagative-thongso">
                <button onClick={Themmoidlqt}>Thêm mới</button>
                <button onClick={Xoadlqt} disabled={!selectedthongso || !selectedthongso.length}>Xóa</button>
            </div>
        );
    };


    const [visibleqt, setVisibleqt] = useState(false);
    const [selectedthongso, setSelectedthongso] = useState(null);


    const Xoadlqt = async () => {
        // Khởi tạo mảng dữ liệu ID
        var datas = [];
    
        // Duyệt qua từng phần tử được chọn và đẩy vào mảng datas
        selectedthongso.forEach(element => {
            datas.push(element.tskt_id);
        });
    
        try {

            const response = await fetch(apideletetsdlqt, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                },
                body: JSON.stringify(datas) 
            });
    
            const responseData = await response.json(); // Chuyển phản hồi thành JSON
    

            if (response.status === 200) {
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: responseData, life: 3000 });
            } 
            else if (response.status === 404) {
                toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: responseData, life: 3000 });
            } 
            else if (response.status === 403) {
                toast.current.show({ severity: 'error', summary: 'Thiếu quyền', detail: "Bạn không có quyền thực hiện!", life: 3000 });
            } 
            else {
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi không xác định', life: 3000 });
            }
            setVisibleqt(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Xóa dữ liệu thất bại', life: 3000 });
        }
    };
    

    const handleSwaggerviewClick = () => {
        navigate(`/swagger/insertdata`);
    };
    const keyTemplate = (rowData) => {
        const representative = rowData.tskt_key;

        return (
            <a onClick={handleSwaggerviewClick}>{representative}</a>
        );
    };
    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />
            <Dialog visible={productDialog} style={{ width: '40rem' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} header="Thông tin trạm" modal className="p-fluid" footer={productDialogFooter} onHide={hideDialog}>
                <div className="field">
                    <label htmlFor="namestation" className="font-bold">
                        Tên trạm đo mưa
                    </label>
                    <InputText id="namestation" value={addNamestation} onChange={(e) => setaddNamestation(e.target.value)} autoFocus />
                </div>
                <div className="field">
                    <label htmlFor="idstation" className="font-bold">
                        Mã trạm đo mưa
                    </label>
                    <InputText id="idstation" value={addidstation} onChange={(e) => setaddidstation(e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="luuvucstation" className="font-bold">
                        Lưu vực
                    </label>
                    <InputText id="luuvucstation" value={addluuvucstation} onChange={(e) => setaddluuvucstation(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="sl_tinhadd">Tỉnh: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_tinhadd"
                        value={addtinhstation}
                        onChange={(e) => setaddtinhstation(e.value)}
                        options={addoptinhstation}
                        optionLabel="name"
                        placeholder="Chọn tỉnh"
                        filter
                    />
                    <label htmlFor="sl_huyenadd">Huyện: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_huyenadd"
                        value={addhuyenstation}
                        onChange={(e) => setaddhuyenstation(e.value)}
                        options={addophuyenstation}
                        optionLabel="name"
                        placeholder="Chọn huyện"
                        filter
                        disabled={!addtinhstation}
                    />
                    <label htmlFor="sl_xaadd">Xã: </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_xaadd"
                        value={addxastation}
                        onChange={(e) => setaddxastation(e.value)}
                        options={addopxastation}
                        optionLabel="name"
                        placeholder="Chọn xã"
                        filter
                        disabled={!addhuyenstation}
                    />
                </div>
                <div className="formgrid grid">
                    <div className="field col">
                        <label htmlFor="lonstation" className="font-bold">
                            Kinh độ (lon)
                        </label>
                        <InputNumber id="lonstation" value={addlonstation} onChange={(e) => setaddlonstation(e.value)} minFractionDigits={2} maxFractionDigits={7} />
                    </div>
                    <div className="field col">
                        <label htmlFor="latstation" className="font-bold">
                            Vĩ độ (lat)
                        </label>
                        <InputNumber id="latstation" value={addlatstation} onChange={(e) => setaddlatstation(e.value)} minFractionDigits={2} maxFractionDigits={7} />
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="description" className="font-bold">
                        Description
                    </label>
                    <InputTextarea id="description" value={adddescstation} onChange={(e) => setadddescstation(e.target.value)} rows={3} cols={20} />
                </div>
            </Dialog>

            <Dialog visible={deleteProductDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteProductDialogFooter} onHide={hideDeleteProductDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', marginRight: '10px' }} />
                        <span>
                             Bạn có chắc chắn xóa các trạm đã chọn
                        </span>
                </div>
            </Dialog>

            <Dialog 
                visible={ThemmoiDialog} 
                style={{ width: '32rem' }} 
                breakpoints={{ '960px': '75vw', '641px': '90vw' }} 
                header="Thêm mới dữ liệu quan trắc" 
                modal 
                footer={dlqtDialogFooter}
                onHide={() => setThemmoiDialog(false)}
            >
                <div style={{marginBottom : '10px'}}>
                    <label htmlFor="nametsqt">
                        Tên thông số quan trắc : 
                    </label>
                    <InputText id="nametsqt" value={addnametsqt} onChange={(e) => setaddnametsqt(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="sl_tinhadd">Loại dữ liệu quan trắc : </label>
                    <Dropdown
                        className="p-inputtext-sm"
                        id="sl_tinhadd"
                        value={dlqtselected}
                        onChange={(e) => setdlqtselected(e.value)}
                        options={datadmqt}
                        optionLabel="dm_ten"
                        placeholder="Chọn dữ liệu"
                        filter
                    />
                </div>

            </Dialog>
            <Dialog header="Thiết lập dữ liệu quan trắc" visible={visibleqt} className="dialog-thongso" onHide={() => { if (!visibleqt) return; setVisibleqt(false); }}>
                <DataTable value={thongsoqt} scrollable className="table-thongso" header={Headerkeythongso} selectionMode={'checkbox'} selection={selectedthongso} onSelectionChange={(e) => setSelectedthongso(e.value)}>
                    <Column selectionMode="multiple" frozen exportable={false}></Column>
                    <Column field="tskt_maloaithongso" header="Loại thông số"></Column>
                    <Column field="tskt_ten" header="Tên thông số"></Column>
                    <Column field="tskt_maloaithongso" header="Mã ánh xạ"></Column>
                    <Column field="tskt_id" header="ID hệ thống"></Column>
                    <Column field="tskt_key" header="Key nhập liệu" body={keyTemplate} ></Column>
                </DataTable>
            </Dialog>

            <div className={'datatable_admin'} >
                <DataTable value={vwstations} scrollable paginator rows={30} scrollHeight="calc(100vh - 240px)"
                    selection={selectedProducts} onSelectionChange={(e) => setSelectedProducts(e.value)}
                    filters={filters} globalFilterFields={['station_name', 'station_id', 'luuvuc']} header={header} emptyMessage="Không có trạm đo mưa nào bạn cần tìm" >
                    <Column selectionMode="multiple" frozen exportable={false}></Column>
                    <Column field="station_name" header="Tên trạm" style={{ minWidth: '200px' }} frozen className="font-bold"></Column>
                    <Column field="station_id" header="Mã trạm" style={{ minWidth: '100px' }}></Column>
                    <Column field="luuvuc" header="Lưu vực" style={{ minWidth: '200px' }}></Column>
                    <Column field="tinh" header="Tỉnh" style={{ minWidth: '200px' }} ></Column>
                    <Column field="quanhuyen" header="Quận huyện" style={{ minWidth: '200px' }} ></Column>
                    <Column field="phuongxa" header="Phường/Xã" style={{ minWidth: '200px' }} ></Column>
                    <Column field="lat" header="Lat" style={{ minWidth: '200px' }}></Column>
                    <Column field="lon" header="Lon" style={{ minWidth: '200px' }}></Column>
                    <Column field="description" header="Thông tin trạm" style={{ minWidth: '200px' }}></Column>
                    <Column frozen headerStyle={{ width: '10%', minWidth: '8rem' }} alignFrozen="right" bodyStyle={{ textAlign: 'center' }} className="column-fiter-pen" header="Thao tác" body={ChangedataBodynd}
                    ></Column>
                </DataTable>
            </div>
        </div>
    );
};

export default AdminViewStations;
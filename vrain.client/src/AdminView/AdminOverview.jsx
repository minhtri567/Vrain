/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
const AdminOverview = () => {
    const apistation = 'https://localhost:7299/api/Admin/infostationstoday';
    const apistationrp = 'https://localhost:7299/api/Admin/reportstationstoday';
    const apiallstation = 'https://localhost:7299/api/Admin/infostations';
    const [datastations, setdatastations] = useState([]);
    const [datastationsrp, setdatastationsrp] = useState([]);
    const [dataallstations, setdataallstations] = useState([]);
    const [datastationsview, setdatastationsview] = useState([]);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(apistation);
                const data = await response.json();
                setdatastations(data);
            } catch (error) {
                console.error('Error fetching data', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(apiallstation);
                const data = await response.json();
                setdataallstations(data);
            } catch (error) {
                console.error('Error fetching data', error);
            }
        };
        fetchData();
    }, []);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(apistationrp);
                const data = await response.json();
                setdatastationsrp(data);
            } catch (error) {
                console.error('Error fetching data', error);
            }
        };
        fetchData();
    }, []);

    const [rainheavier, setrainheavier] = useState([]);
    const [rainheavy, setrainheavy] = useState([]);
    const [rainmedium, setrainmedium] = useState([]);
    const [rainsmall, setrainsmall] = useState([]);
    const [norain, setnorain] = useState([]);

    const loadrainstation = async (op) => {
        
        if(op == 0){
            setdatastationsview();
        }
        else if(op == 1){
            setdatastationsview(rainheavier);
        }
        else if(op == 2){
            setdatastationsview(rainheavy);
        }
        else if(op == 3){
            setdatastationsview(rainmedium);
        }
        else{
            //
        }
        setVisible(true);
    };
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 575.98); // Giả sử màn hình mobile là <= 575.98px

    // Kiểm tra kích thước màn hình khi người dùng thay đổi kích thước cửa sổ
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 575.98);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup event listener khi component bị hủy
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    useEffect(() => {
        const noRain = [];
        const smallRain = [];
        const mediumRain = [];
        const heavyRain = [];
        const heavierRain = [];

        datastations.forEach(s => {
            if (s.total_rain === 0) {
                noRain.push(s);
            } else if (s.total_rain > 0 && s.total_rain <= 16) {
                smallRain.push(s);
            } else if (s.total_rain > 16 && s.total_rain <= 50) {
                mediumRain.push(s);
            } else if (s.total_rain > 50 && s.total_rain <= 99) {
                heavyRain.push(s);
            } else if (s.total_rain > 99) {
                heavierRain.push(s);
            }
        });

        // Cập nhật trạng thái
        setnorain(noRain);
        setrainsmall(smallRain);
        setrainmedium(mediumRain);
        setrainheavy(heavyRain);
        setrainheavier(heavierRain);
    }, [datastations]);

    const footer1 = (
        <>
            <Button label="Xem" icon="pi pi-search" onClick={ () => loadrainstation(0)}/>
        </>
    );
    const footer2 = (
        <>
            <Button label="Xem" icon="pi pi-search" onClick={() => loadrainstation(1)}/>
        </>
    );
    const footer3 = (
        <>
            <Button label="Xem" icon="pi pi-search" onClick={() => loadrainstation(2)}/>
        </>
    );
    const footer4 = (
        <>
            <Button label="Xem" icon="pi pi-search" onClick={() => loadrainstation(3)}/>
        </>
    );
    const header = (
        <div>
            <span className="">Báo cáo đo mưa hôm nay</span>
        </div>
    );
    return (
        <div>
            <div className="adminoverview-container">
                <div className="av-container-1">
                    <Card title="Trạm đo mưa hôm nay" subTitle="Trạm đo mưa có dữ liệu gửi về hôm nay" className="">
                        <p>{datastations.length} / {dataallstations.length}</p>
                    </Card>
                    <Card title="Các trạm mưa rất to" subTitle="Có lượng mưa trên 99mm" footer={footer2} className="">
                        <p>{rainheavier.length} / {datastations.length}</p>
                    </Card>
                    <Card title="Các trạm mưa to" subTitle="Có lượng mưa trên 50mm nhỏ hơn 99mm" footer={footer3} className="">
                        <p>{rainheavy.length} / {datastations.length}</p>
                    </Card>
                    <Card title="Các trạm mưa vừa" subTitle="Có lượng mưa trên 16mm nhỏ hơn 50mm" footer={footer4} className="">
                        <p>{rainheavy.length} / {datastations.length}</p>
                    </Card>
                </div>
                <div className="av-container-2">
                    <DataTable value={datastationsrp} tableStyle={{ minWidth: '50rem' }} header={header} emptyMessage="Không có dữ liệu">
                        <Column field="tinh" header="Tỉnh" style={{ minWidth: '100px' }} className="font-bold"></Column>
                        <Column field="name_file" header="Tên file" style={{ minWidth: '300px' }}></Column>
                        <Column field="file_ref" header="Đường dẫn" style={{ minWidth: '300px' }}></Column>
                        <Column field="request_time" header="Thời gian tạo báo cáo" style={{ minWidth: '200px' }}></Column>
                        <Column field="ngaybatdau" header="Thời gian bắt đầu" style={{ minWidth: '200px' }}></Column>
                        <Column field="ngayketthuc" header="Thời gian kết thúc" style={{ minWidth: '200px' }}></Column>
                        <Column field="tansuat" header="Tần suất" style={{ minWidth: '100px' }}></Column>
                    </DataTable>
                </div>

                <Dialog header="Trạm đo mưa" visible={visible} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} onHide={() => {if (!visible) return; setVisible(false); }}>
                    <DataTable value={datastationsview} virtualScrollerOptions={{ itemSize: 30 }} tableStyle={{ minWidth: '50rem' }}>
                        <Column field="station_name" header="Tên trạm" style={{ minWidth: '200px' }} frozen className="font-bold"></Column>
                        <Column field="tinh" header="Tỉnh" style={{ minWidth: '200px' }} ></Column>
                        <Column field="quanhuyen" header="Quận huyện" style={{ minWidth: '200px' }} ></Column>
                        <Column field="phuongxa" header="Phường/Xã" style={{ minWidth: '200px' }} ></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminOverview;
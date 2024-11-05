
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';

import Chartmucnuoc from './Chartmucnuoc';
import Login from './Login';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import $ from 'jquery';
import { getNameProvince } from './NameProvine';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Autocomplete, TextField } from '@mui/material';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const MNDetailview = () => {
    const pathname = window.location.pathname;
    const name_luuvuc = pathname.substring(pathname.lastIndexOf('/') + 1);
    dayjs.locale('vi');
    const today = dayjs();
    const sevenDaysAgo = today.subtract(7, 'day');
    const yesterday = dayjs().subtract(1, 'day');
    const navigate = useNavigate();
    const [showChart, setShowChart] = useState(true);
    const [fdata, setfdata] = useState(false);
    const [selectedOption, setSelectedOption] = useState("3");
    const [visibleRight, setVisibleRight] = useState(false);
    const tableRef = useRef(null);
    var apimucnuoc = "/vnrain/Mucnuoc/Mucnuocnow?luuvuc=" + getNameProvince(name_luuvuc) + "";
    var curentapiluuvuc = "/vnrain/Mucnuoc?luuvuc=" + getNameProvince(name_luuvuc) + "";
    const stationsRef = useRef([]);
    var now = new Date();
    var currentDateTime = now.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
    });

    const currentHour = now.getHours() > 19 ? 20 : new Date().getHours();
    const [selectedtime, setselectedtime] = useState('0');
    const [selectedStation, setSelectedStation] = useState("");
    const [datafecthchart, setdatafecthchart] = useState([]);
    const headers = [];

    for (let hour = 0; hour <= currentHour; hour++) {
        headers.push(
            <th key={hour} scope="col">{hour}:00 <br></br>{currentDateTime}</th>
        );
    }

    var previousDay = new Date(now);
    previousDay.setDate(now.getDate() - 1);
    var previousday = previousDay.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
    });

    useEffect(() => {
        const fetchDataProvine = async () => {
            try {
                const response = await fetch(curentapiluuvuc);

                const data = await response.json();
                stationsRef.current = data;
                setSelectedStation(data[0].station_id);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchDataProvine();
    }, [name_luuvuc]);

    function convertDateFormat(dateString) {
        // Tách ngày, tháng, năm từ chuỗi
        var parts = dateString.split('/');
        if (parts.length === 3) {
            // Lấy các phần tử
            var day = parts[0];
            var month = parts[1];
            var year = parts[2];

            // Xây dựng lại chuỗi theo định dạng MM/dd/yyyy
            var formattedDate = month + '/' + day + '/' + year;
            return formattedDate;
        }
        return null; // Trả về null nếu không phù hợp định dạng
    }
    useEffect(() => {
        const fetchDataProvine = async () => {
            try {
                if (selectedOption == 0) {
                    const today = new Date();
                    const response = await fetch(apimucnuoc + "&startDate=" + today.toLocaleDateString('en-US') + "&endDate=" + today.toLocaleDateString('en-US') + "&mathongso=DOMUCNUOC");
                    const data = await response.json();
                    setdatafecthchart(data);
                }
                if (selectedOption == 1) {
                    const response = await fetch(apimucnuoc + "&startDate=" + convertDateFormat($("#my-datepicker-1 input").val()) + "&endDate=" + convertDateFormat($("#my-datepicker-1 input").val()) + "&DOMUCNUOC=DUMUCNUOC");
                    const data = await response.json();
                    setdatafecthchart(data);

                }
                if (selectedOption == 2) {
                    var parts = $("#my-datepicker-2 input").val().split('/');
                    var month = parts[0];
                    var year = parts[1];
                    const startDate = new Date(year, month - 1, 1);
                    const endDate = new Date(year, month, 0);
                    const formattedStartDate = startDate.toLocaleDateString('en-US');
                    const formattedEndDate = endDate.toLocaleDateString('en-US');
                    const response = await fetch(apimucnuoc + "&startDate=" + formattedStartDate + "&endDate=" + formattedEndDate + "&mathongso=DOMUCNUOC");
                    const data = await response.json();
                    setdatafecthchart(data);

                }
                if (selectedOption == 3) {
                    const response = await fetch(apimucnuoc + "&startDate=" + convertDateFormat($(".my-datepicker-3-st input").val()) + "&endDate=" + convertDateFormat($(".my-datepicker-3-ed input").val()) + "&mathongso=DOMUCNUOC");
                    const data = await response.json();
                    setdatafecthchart(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchDataProvine();
    }, [name_luuvuc, fdata]);

    const [dataChart, setDataChart] = useState([]);

    useEffect(() => {
        setselectedtime(selectedOption);
    }, [fdata]);


    useEffect(() => {
        if (datafecthchart.length > 0 && selectedStation != 'all') {
            const processData = async () => {
                let mbaodong1;
                let mbaodong2;
                let mbaodong3;
                let mlulichsu;
                let maxTotal = -Infinity;

                datafecthchart.forEach(dayData => {
                    const stationData = dayData.stations.find(station => station.station_id === selectedStation);
                    if (stationData && stationData.total > maxTotal) {
                        maxTotal = stationData.total;
                        mbaodong1 = stationData.baodong1;
                        mbaodong2 = stationData.baodong2;
                        mbaodong3 = stationData.baodong3;
                        mlulichsu = stationData.lulichsu;
                    }
                });
                const dataChart = [];
                datafecthchart.forEach(dayData => {
                    const timepoint = dayData.timePoint;
                    const stationData = dayData.stations.find(station => station.station_id === selectedStation);
                    if (stationData) {
                        const chartEntry = {
                            timepoint,
                            [`${stationData.station_name}`]: stationData.total,
                            'Báo động 1': stationData.baodong1,
                        };
                        if (maxTotal >= mbaodong1) {
                            chartEntry['Báo động 2'] = mbaodong2;
                        }
                        if (maxTotal >= mbaodong2) {
                            chartEntry['Báo động 3'] = mbaodong3;
                        }
                        if (maxTotal >= mbaodong3) {
                            chartEntry['Lũ lịch sử'] = mlulichsu;
                        }

                        dataChart.push(chartEntry);
                    }
                });
                setDataChart(dataChart);
            };

            processData();
        }

    }, [datafecthchart, selectedStation]);

    const handleItemClick = () => {
        navigate(`/`);
    };
    const handleOverviewClick = () => {
        navigate(`/mucnuoc/overview/${name_luuvuc}`);
    };

    const handleChangeStation = (event) => {
        setSelectedStation(event.target.value)
    };
    const handleDetailviewClick = () => {
        navigate(`/mucnuoc/report/${name_luuvuc}`);
    };

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    };

    const handleToggleChart = () => {
        setShowChart(!showChart); // Đảo ngược giá trị của showChart khi click vào nút
    };
    const handlerefecthdata = () => {
        setfdata(!fdata); // chạy nút xem
    };


    const [datatable, setdatatable] = useState([]);
    const [columns, setcolumns] = useState([]);
    useEffect(() => {
        if (selectedStation != 'all') {
            const stationMap = {};

            datafecthchart.forEach(dayData => {
                const timePoint = dayData.timePoint;
                dayData.stations.forEach(station => {
                    if (station.station_id === selectedStation) {
                        if (!stationMap[station.station_id]) {
                            stationMap[station.station_id] = {
                                station_name: station.station_name,
                                province: station.tinh,
                                quanhuyen: station.quanhuyen,
                                xaphuong: station.phuongxa,
                                ...datafecthchart.reduce((acc, d) => {
                                    acc[d.timePoint] = '0.00 cm'; // Khởi tạo tất cả timePoints với '0.00'
                                    return acc;
                                }, {})
                            };
                        }
                        const rainfall = parseFloat(station.total.toFixed(2));
                        stationMap[station.station_id][timePoint] = `${rainfall.toFixed(2)} cm`;
                        stationMap[station.station_id].totalRainfall += rainfall;
                    }
                });
            });


            const formattedData = Object.values(stationMap).map(station => ({
                ...station
            }));

            // Define columns
            const columnDefs = [
                { field: 'station_name', header: 'Tên Trạm', frozen: true },
                { field: 'province', header: 'Tỉnh' },
                { field: 'quanhuyen', header: 'Quận/Huyện' },
                { field: 'xaphuong', header: 'Xã/Phường' },
                ...datafecthchart.map(dayData => ({
                    field: dayData.timePoint,
                    header: dayData.timePoint
                }))
            ];
            setdatatable(formattedData);
            setcolumns(columnDefs);
        } else {
            const stationMap = {};

            datafecthchart.forEach(dayData => {
                const timePoint = dayData.timePoint;
                dayData.stations.forEach(station => {
                    if (!stationMap[station.station_id]) {
                        stationMap[station.station_id] = {
                            station_name: station.station_name,
                            province: station.tinh,
                            quanhuyen: station.quanhuyen,
                            xaphuong: station.phuongxa,
                            ...datafecthchart.reduce((acc, d) => {
                                acc[d.timePoint] = '0.00 cm'; // Khởi tạo tất cả timePoints với '0.00'
                                return acc;
                            }, {})
                        };
                    }
                    const rainfall = parseFloat(station.total.toFixed(2));
                    stationMap[station.station_id][timePoint] = `${rainfall.toFixed(2)} cm`;
                    stationMap[station.station_id].totalRainfall += rainfall;
                });
            });


            const formattedData = Object.values(stationMap).map(station => ({
                ...station,
                totalRainfall: `${station.totalRainfall.toFixed(2)} cm` // Đảm bảo tổng lượng mưa có 2 chữ số sau dấu thập phân
            }));

            // Define columns
            const columnDefs = [
                { field: 'station_name', header: 'Tên Trạm', frozen: true },
                { field: 'province', header: 'Tỉnh' },
                { field: 'quanhuyen', header: 'Quận/Huyện' },
                { field: 'xaphuong', header: 'Xã/Phường' },
                ...datafecthchart.map(dayData => ({
                    field: dayData.timePoint,
                    header: dayData.timePoint
                }))
            ];

            setdatatable(formattedData);
            setcolumns(columnDefs);
            setShowChart(false);
        }


    }, [datafecthchart, selectedStation]); //

    const exportTableToExcel = async () => {
        let nameexcel;

        if (selectedStation == 'all') {
            nameexcel = 'Trạm đo mưa tỉnh ' + getNameProvince(name_luuvuc);
        } else {
            if (selectedtime == 0) {
                nameexcel = currentDateTime + document.querySelector("#sl_stations-select").innerText;
            } else if (selectedtime == 1) {
                nameexcel = previousday + document.querySelector("#sl_stations-select").innerText;
            } else if (selectedtime == 2) {
                nameexcel = document.querySelector("#my-datepicker-2 input").value + document.querySelector("#sl_stations-select").innerText;
            } else if (selectedtime == 3) {
                nameexcel = "Báo cáo đo mưa trạm " + document.querySelector("#sl_stations-select").innerText + " từ " + document.querySelector(".my-datepicker-3-st input").value + " đến  " + document.querySelector(".my-datepicker-3-ed input").value;
            }
        }


        import('xlsx').then((xlsx) => {
            const worksheet = xlsx.utils.json_to_sheet(datatable);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });
            saveAsExcelFile(excelBuffer, nameexcel);
        });

    };

    const saveAsExcelFile = (buffer, fileName) => {
        import('file-saver').then((module) => {
            if (module && module.default) {
                let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                let EXCEL_EXTENSION = '.xlsx';
                const data = new Blob([buffer], {
                    type: EXCEL_TYPE
                });

                module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
            }
        });
    };

    const customHeader = (
        <div>
            <Login ishome={false} />
        </div>
    );

    const allOption = { station_id: 'all', station_name: 'Xem tất cả' };
    const optionsWithAll = [allOption, ...stationsRef.current];

    return (
        <div style={showChart ? { backgroundColor: '#fafafa' } : { backgroundColor: '#fafafa', height: '100vh' }}>
            <div className="r-overview">
                <div className="vnrain-toolbar">
                    <div className="header-title">
                        <div className="name-view">
                            <img src="/src/assets/react.svg" onClick={handleItemClick} style={{ cursor: 'pointer' }}></img>
                            <span className="header-name">{getNameProvince(name_luuvuc)}</span>
                        </div>
                        <div className="button-view">
                            <button className="view-tongquan" onClick={handleOverviewClick} >Tổng quan</button>
                            <button className="view-chitiet active" >Chi tiết</button>
                            <button className="view-baocao" onClick={handleDetailviewClick}>Báo cáo</button>
                        </div>
                    </div>
                    <div className="vw-login-container">
                        <Login ishome={false} />
                        <button onClick={() => handleItemClick()} className="view-fullprovine">Toàn quốc</button>
                    </div>
                    <div className="side-bar-menu">
                        <Button icon="pi pi-bars" onClick={() => setVisibleRight(true)} />
                    </div>
                    <Sidebar className="vnrain-toolbar-sidebar" header={customHeader} visible={visibleRight} position="right" onHide={() => setVisibleRight(false)}>
                        <ul className="button-view-sidebar">
                            <li>
                                <a className="view-tongquan active" onClick={handleOverviewClick}>Tổng quan</a>
                            </li>
                            <li>
                                <a className="view-chitiet">Chi tiết</a>
                            </li>
                            <li>
                                <a className="view-baocao" onClick={handleDetailviewClick}>Báo cáo</a>
                            </li>
                        </ul>
                    </Sidebar>
                </div>
            </div>
            <div className="nagative-viewdetail" >
                <div className="container-select">
                    <FormControl sx={{ m: 1, minWidth: 200 }} size="small"  >
                        <Autocomplete
                            id="autocomplete-stations"
                            size="small"
                            options={optionsWithAll}
                            getOptionLabel={(station) => station?.station_name || ''}
                            value={selectedStation ? optionsWithAll.find(s => s.station_id === selectedStation) : null}
                            onChange={(event, newValue) => {
                                if (newValue.station_id === 'all') {
                                    handleChangeStation({ target: { value: 'all' } });
                                } else {
                                    handleChangeStation({ target: { value: newValue.station_id } });
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Trạm hiển thị"
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                            isOptionEqualToValue={(option, value) => option.station_id === value.station_id}
                        />
                    </FormControl>
                </div>
                <div className="container-select">
                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small"  >
                        <InputLabel id="sl_time">Thời gian</InputLabel>
                        <Select
                            labelId="sl_time"
                            id="sl_time-select"
                            value={selectedOption}
                            onChange={handleOptionChange}
                            label="Thời gian"
                        >
                            <MenuItem value="0">Ngày hôm nay</MenuItem>
                            <MenuItem value="1">Ngày khác</MenuItem>
                            <MenuItem value="2">Tháng</MenuItem>
                            <MenuItem value="3">Khoảng thời gian</MenuItem>
                        </Select>
                    </FormControl>
                </div>
                <div className="my-datepicker" id="my-datepicker-1" style={{ display: selectedOption === "1" ? 'block' : 'none' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DemoContainer components={['DatePicker']}>
                            <DatePicker
                                label="Chọn ngày"
                                slotProps={{ textField: { size: 'small' } }}
                                maxDate={yesterday}
                                format="DD/MM/YYYY"
                                defaultValue={yesterday}
                            />
                        </DemoContainer>
                    </LocalizationProvider>
                </div>
                <div className="my-datepicker" id="my-datepicker-2" style={{ display: selectedOption === "2" ? 'block' : 'none' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DemoContainer components={['DatePicker']}>
                            <DatePicker
                                label="Chọn tháng"
                                views={['month', 'year']}
                                slotProps={{ textField: { size: 'small' } }}
                                maxDate={today}
                                defaultValue={today}
                                format="MM/YYYY"
                            />
                        </DemoContainer>
                    </LocalizationProvider>
                </div>
                <div className="my-datepicker" id="my-datepicker-3" style={{ display: selectedOption === "3" ? 'block' : 'none' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DemoContainer components={['DatePicker']}>
                            <DatePicker
                                className="my-datepicker-3-st"
                                label="Ngày bắt đầu"
                                slotProps={{ textField: { size: 'small' } }}
                                maxDate={today}
                                defaultValue={sevenDaysAgo}
                                format="DD/MM/YYYY"
                            />
                            <DatePicker
                                className="my-datepicker-3-ed"
                                label="Ngày kết thúc"
                                slotProps={{ textField: { size: 'small' } }}
                                maxDate={today}
                                defaultValue={today}
                                format="DD/MM/YYYY"
                            />
                        </DemoContainer>
                    </LocalizationProvider>
                </div>
                <button id="view-station" onClick={handlerefecthdata}>Xem</button>
                <button id="view-chart" onClick={handleToggleChart} >{showChart ? 'Ẩn biểu đồ' : 'Xem biểu đồ'}</button>
                <button id="dl-excel" onClick={exportTableToExcel}>Tải file Excel</button>
            </div>
            <div className="vdetail-chart">
                {showChart && (
                    <Chartmucnuoc dataChart={dataChart} chartHeight="500px" />
                )}
            </div>
            <div style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                <DataTable value={datatable} ref={tableRef} scrollable scrollHeight="400px" frozenWidth="200px">
                    {columns.map((col) => (
                        <Column key={col.field} field={col.field} header={col.header} frozen={col.frozen} />
                    ))}
                </DataTable>
            </div>

        </div>
    );
}
export default MNDetailview;
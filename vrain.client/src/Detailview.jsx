/* eslint-disable no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import BarChartComponent from './BarChartComponent';
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

const Detailview = () => {
    const pathname = window.location.pathname;
    const name_province = pathname.substring(pathname.lastIndexOf('/') + 1);
    dayjs.locale('vi');
    const today = dayjs();
    const sevenDaysAgo = today.subtract(7, 'day');
    const yesterday = dayjs().subtract(1, 'day');
    const navigate = useNavigate();
    const [showChart, setShowChart] = useState(true);
    const [fdata, setfdata] = useState(false);
    const [selectedOption, setSelectedOption] = useState("3");
    const [selectmodeview, setselectmodeview] = useState(2);
    const [visibleRight, setVisibleRight] = useState(false);
    const tableRef = useRef(null);
    var curentapitinh = "/vnrain/WeatherStations/raintoday?provincename=" + encodeURIComponent(name_province) + "";
    var getapistations = "/vnrain/WeatherStations/station_provine?provincename=" + encodeURIComponent(name_province) + "&mathongso=RAIN";
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
        const fetchDatastations = async () => {
            try {
                //
                const response = await fetch(getapistations)
                const data = await response.json();
                stationsRef.current = data;
                setSelectedStation(stationsRef.current[0].station_id);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchDatastations();
    }, [name_province]);
    useEffect(() => {
        const fetchDataProvine = async () => {
            try {
                if (selectedOption == 0) {
                    const today = new Date();
                    const response = await fetch(curentapitinh + "&startDate=" + today.toLocaleDateString('en-US') + "&endDate=" + today.toLocaleDateString('en-US') + "&modeview=" + $(".my-mode-view input").val() + "&mathongso=RAIN");
                    const data = await response.json();
                    setdatafecthchart(data);
                }
                if (selectedOption == 1) {
                    const response = await fetch(curentapitinh + "&startDate=" + convertDateFormat($("#my-datepicker-1 input").val()) + "&endDate=" + convertDateFormat($("#my-datepicker-1 input").val()) + "&modeview=" + $(".my-mode-view input").val() + "&mathongso=RAIN");
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
                    const response = await fetch(curentapitinh + "&startDate=" + formattedStartDate + "&endDate=" + formattedEndDate + "&modeview=" + $(".my-mode-view input").val() + "&mathongso=RAIN");
                    const data = await response.json();
                    setdatafecthchart(data);

                }
                if (selectedOption == 3) {
                    const response = await fetch(curentapitinh + "&startDate=" + convertDateFormat($(".my-datepicker-3-st input").val()) + "&endDate=" + convertDateFormat($(".my-datepicker-3-ed input").val()) + "&modeview=" + $(".my-mode-view input").val() + "&mathongso=RAIN");
                    const data = await response.json();
                    setdatafecthchart(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchDataProvine();
    }, [name_province, fdata]);

    const [dataChart, setDataChart] = useState([]);

    useEffect(() => {
        setselectedtime(selectedOption);
    }, [fdata]);

    const extractData = (data, cumulativeTotal) => {
        
        if(selectmodeview == 1){
            const { day, hour, mm } = data;
            if (day.length === hour.length && hour.length === mm.length) {
                const currentDateTime = new Date(); // Lấy thời gian hiện tại

                const result = day.map((date, index) => {
                    const dateObj = new Date(date);
                    const formattedDate = dateObj.toLocaleDateString('en-GB').slice(0, 5);
                    const formattedTime = `${hour[index].toString().padStart(2, '0')}:00`;

                    // Tạo đối tượng thời gian của phần tử hiện tại
                    const elementDateTime = new Date(dateObj.setHours(hour[index], 0, 0, 0));

                    // Bỏ qua phần tử nếu giờ nhỏ hơn hiện tại
                    if (elementDateTime < currentDateTime) {
                        return null; // Bỏ qua
                    }

                    // Cộng tích lũy mưa và tạo đối tượng trả về
                    cumulativeTotal += parseFloat(mm[index]);
                    return {
                        timepoint: `${formattedDate} ${formattedTime}`,
                        'Dự báo mưa': mm[index],
                        'Mưa tích lũy dự báo': cumulativeTotal
                    };
                }).filter(item => item !== null); // Lọc bỏ các phần tử null

                return result;
            } else {
                console.error('Dữ liệu không đồng nhất về độ dài các mảng.');
            }
        }
        else if(selectmodeview == 2){
            const { day, mm } = data;
            const rainByDay = {};

            day.forEach((date, index) => {
                const formattedDate = new Date(date).toLocaleDateString('en-GB').slice(0, 5);
                if (!rainByDay[formattedDate]) {
                    rainByDay[formattedDate] = 0;
                }
                rainByDay[formattedDate] += mm[index];
            });
            const filteredRainByDay = Object.keys(rainByDay).slice(2);

            const result = filteredRainByDay.map(date => {
                cumulativeTotal += rainByDay[date];

                return {
                    timepoint: date,
                    'Dự báo mưa': rainByDay[date].toFixed(2),
                    'Mưa tích lũy dự báo': cumulativeTotal.toFixed(2)
                };
            });

            return result;
        }else{
            return [];
        }
        
    };

    useEffect(() => {
        if (datafecthchart.length > 0 && selectedStation != 'all') {
            const processData = async () => {
                const dataChartthis = [];
                let cumulativeTotal = 0;

                // Process datafecthchart
                datafecthchart.forEach(dayData => {
                    const timepoint = dayData.timePoint;
                    const stationData = dayData.stations.find(station => station.station_id === selectedStation);
                    if (stationData) {
                        const dailyTotal = parseFloat(stationData.total).toFixed(2);
                        cumulativeTotal += parseFloat(dailyTotal);
    
                        dataChartthis.push({
                            timepoint,
                            [`${stationData.station_name}`]: dailyTotal,
                            [`Mưa tích lũy ${stationData.station_name}`]: cumulativeTotal.toFixed(2)
                        });
                    }
                });

                const id_station_sl = stationsRef.current.find(s => s.station_id === selectedStation);
                if (id_station_sl) {
                    try {
                        const response = await fetch(`https://node.windy.com/forecast/v2.7/ecmwf/${id_station_sl.lat}/${id_station_sl.lon}`);
                    
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                    
                        const data = await response.json();
                        dataChartthis.push(...extractData(data.data, cumulativeTotal));
                    } catch (error) {
                        console.error('Error fetching data:', error);
                    }
                }

                setDataChart(dataChartthis);
            };
        
            processData();
        }
        
    }, [datafecthchart, selectedStation]);

    const handleItemClick = () => {
        navigate(`/`);
    };
    const handleOverviewClick = () => {
        navigate(`/overview/${name_province}`);
    };

    const handleChangeStation = (event) => {
        setSelectedStation(event.target.value)
    };
    const handleDetailviewClick = () => {
        navigate(`/report/${name_province}`);
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
                                totalRainfall: 0,
                                ...datafecthchart.reduce((acc, d) => {
                                    acc[d.timePoint] = '0.00 mm'; // Khởi tạo tất cả timePoints với '0.00'
                                    return acc;
                                }, {})
                            };
                        }
                        const rainfall = parseFloat(station.total.toFixed(2));
                        stationMap[station.station_id][timePoint] = `${rainfall.toFixed(2)} mm`;
                        stationMap[station.station_id].totalRainfall += rainfall;
                    }
                });
            });


            const formattedData = Object.values(stationMap).map(station => ({
                ...station,
                totalRainfall: `${station.totalRainfall.toFixed(2)} mm` // Đảm bảo tổng lượng mưa có 2 chữ số sau dấu thập phân
            }));

            // Define columns
            const columnDefs = [
                { field: 'station_name', header: 'Tên Trạm', frozen: true },
                { field: 'province', header: 'Tỉnh' },
                { field: 'quanhuyen', header: 'Quận/Huyện' },
                { field: 'xaphuong', header: 'Xã/Phường' },
                { field: 'totalRainfall', header: 'Tổng mưa' },
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
                                totalRainfall: 0,
                                ...datafecthchart.reduce((acc, d) => {
                                    acc[d.timePoint] = '0.00 mm'; // Khởi tạo tất cả timePoints với '0.00'
                                    return acc;
                                }, {})
                            };
                        }
                        const rainfall = parseFloat(station.total.toFixed(2));
                        stationMap[station.station_id][timePoint] = `${rainfall.toFixed(2)} mm`;
                        stationMap[station.station_id].totalRainfall += rainfall;
                });
            });


            const formattedData = Object.values(stationMap).map(station => ({
                ...station,
                totalRainfall: `${station.totalRainfall.toFixed(2)} mm` // Đảm bảo tổng lượng mưa có 2 chữ số sau dấu thập phân
            }));

            // Define columns
            const columnDefs = [
                { field: 'station_name', header: 'Tên Trạm', frozen: true },
                { field: 'province', header: 'Tỉnh' },
                { field: 'quanhuyen', header: 'Quận/Huyện' },
                { field: 'xaphuong', header: 'Xã/Phường' },
                { field: 'totalRainfall', header: 'Tổng mưa' },
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
        if (selectedtime == 0) {
            nameexcel = currentDateTime + document.querySelector("#sl_stations-select").innerText;
        } else if (selectedtime == 1) {
            nameexcel = previousday + document.querySelector("#sl_stations-select").innerText;
        } else if (selectedtime == 2) {
            nameexcel = document.querySelector("#my-datepicker-2 input").value + document.querySelector("#sl_stations-select").innerText;
        } else if (selectedtime == 3) {
            nameexcel = "Báo cáo đo mưa trạm " + document.querySelector("#sl_stations-select").innerText + " từ " + document.querySelector(".my-datepicker-3-st input").value + " đến  " + document.querySelector(".my-datepicker-3-ed input").value;

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

    const handleChangemode = (event) => {
        setselectmodeview(event.target.value);
    };
    const customHeader = (
        <div>
            <Login ishome={false} />
        </div>
    );

    const allOption = { station_id: 'all', station_name: 'Xem tất cả' };
    const optionsWithAll = [allOption, ...stationsRef.current];

    return (
        <div style={showChart ? { backgroundColor: '#fafafa' } : { backgroundColor: '#fafafa', height : '100vh' }}>
             <div className="r-overview">
                <div className="vnrain-toolbar">
                    <div className="header-title">
                        <div className="name-view">
                            <img src="../src/assets/react.svg" onClick={handleItemClick} style={{ cursor: 'pointer' }}></img>
                            <span className="header-name">{getNameProvince(name_province)}</span>
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
                <div className="container-select my-mode-view">
                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small"  >
                        <InputLabel id="sl_mode_views">Chế độ xem</InputLabel>
                        <Select
                            labelId="sl_mode_views"
                            id="sl_stations-select"
                            value={selectmodeview}
                            label="Chế độ xem"
                            onChange={handleChangemode}
                        >
                            <MenuItem value={1}>Giờ</MenuItem>
                            <MenuItem value={2}>Ngày</MenuItem>
                            <MenuItem value={3}>Tháng</MenuItem>

                        </Select>
                    </FormControl>
                </div>
                <button id="view-station" onClick={handlerefecthdata}>Xem</button>
                <button id="view-chart" onClick={handleToggleChart} >{showChart ? 'Ẩn biểu đồ' : 'Xem biểu đồ'}</button>
                <button id="dl-excel" onClick={exportTableToExcel}>Tải file Excel</button>
            </div>
             <div className="vdetail-chart">
                {showChart && (
                    <BarChartComponent dataChart={dataChart} chartHeight="500px" opview={selectmodeview} />
                    )}
            </div>
            <div style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                <DataTable value={datatable} ref={tableRef} scrollable scrollHeight="400px" frozenWidth="200px">
                   {columns.map((col, i) => (
                        <Column key={col.field} field={col.field} header={col.header} frozen={col.frozen} />
                    ))}
                </DataTable> 
            </div>
            
        </div>
    );
}
export default Detailview;
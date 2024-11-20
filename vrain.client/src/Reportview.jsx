/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getNameProvince } from './NameProvine';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import StickyHeaderTable from './StickyHeaderTable';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { Close, CheckCircle } from '@mui/icons-material';
import Login from './Login';
import { Sidebar } from 'primereact/sidebar';
import $ from 'jquery';
import { Button } from 'primereact/button';
const ReportComponent = () => {
    const pathname = window.location.pathname;
    const name_province = pathname.substring(pathname.lastIndexOf('/') + 1);
    dayjs.locale('vi');
    const today = dayjs();
    const yesterday = dayjs().subtract(1, 'day');
    const navigate = useNavigate();
    var curentapitinh = "/vnrain/WeatherStations/station_provine?provincename=" + encodeURIComponent(name_province) + "&mathongso=RAIN";
    var apireport = "/vnrain/WeatherStations/report";
    var getapireport = "/vnrain/WeatherStations/report_data?provincename=" + encodeURIComponent(name_province) + "";
    var apidownloadfile = "/vnrain/WeatherStations/download/";
    const stationsRef = useRef([]);
    const ListrpRef = useRef([]);
    const [stationName, setstationName] = useState([]);
    const [selectedOption, setSelectedOption] = useState("0");
    const [tinhid, setTinhid] = useState('');
    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const [selectedDates, setSelectedDates] = useState(new Date());
    const [selectedDatee, setSelectedDatee] = useState(new Date());
    const [selectedDatem, setSelectedDatem] = useState(new Date());
    const [rows, setrow] = useState([]);
    const [columns, setcolumns] = useState([]);
    const [stationidlist, setstationidlist] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVariant, setSnackbarVariant] = useState('success');
    const [visibleRight, setVisibleRight] = useState(false);
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 350,
            },
        },
        autoFocus: false
    };
    const handleItemClick = () => {
        navigate(`/`);
    };
    var now = new Date();
    var currentDTime = now.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const handleDatesChange = (date) => {
        var aaa = dayjs(date).format('YYYY-MM-DD')
        setSelectedDates(aaa);
    };
    const handleDateeChange = (date) => {
        var aaa = dayjs(date).format('YYYY-MM-DD');
        setSelectedDatee(aaa);
    };
    const handleDateeChangm = (date) => {
        var aaa = dayjs(date).format('YYYY-MM-DD')
        setSelectedDatem(aaa);
    };
    const [Timestart, setTimestart] = useState(new Date());
    const [Timeend, setTimeend] = useState(new Date());
    
    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
        
    };
    
    const handleOverviewClick = () => {
        navigate(`/overview/${name_province}`);
    };
    const handleDetailviewClick = () => {
        navigate(`/detail/${name_province}`);
    };
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    useEffect(() => {
        if (selectedOption == 0) {
            const now = new Date();

            // Lấy ngày ISO (YYYY-MM-DD)
            const dateISO = now.toLocaleDateString("fr-CA");

            // Lấy thời gian (HH:mm) và ghép lại với ngày
            const timeISO = now.toTimeString().slice(0, 5); // HH:mm
            const datetimeISO = `${dateISO}T${timeISO}`;

            // Cập nhật giá trị
            setTimestart(new Date().toLocaleDateString("fr-CA")); // Chỉ ngày
            setTimeend(datetimeISO);
        }
        if (selectedOption == 1) {
            setTimestart(selectedDatem);
            setTimeend(selectedDatem);
        }
        if (selectedOption == 3) {
            setTimestart(selectedDates);
            setTimeend(selectedDatee);
        }

    }, [selectedDatee, selectedDates, selectedDatem, open, selectedOption, currentDTime]);

    useEffect(() => {
        const fetchDataProvine = async () => {
            const response = await fetch(curentapitinh);
            const data = await response.json();
            stationsRef.current = data;
            setTinhid(data[0].order_province);
        };
        fetchDataProvine();
    }, [name_province]);
    const fetchDatareport = async () => {
        const response = await fetch(getapireport + "&mathongso=RAIN");
        const data = await response.json();
        ListrpRef.current = data;

        let i = 0;
        const rows = ListrpRef.current.map(abc => {
            return {
                id: i++,
                timerp: abc.request_time,
                timesrp: abc.ngaybatdau,
                timeerp: abc.ngayketthuc,
                tansuat: abc.tansuat + " giờ",
                email: abc.email,
                trangthai: abc.trangthai == 0 ? <span style={{ padding: '10px' }}>Đang xử lý</span> : <span className="download_file" onClick={() => handleDownload(abc.name_file)} >Tải báo cáo</span>
            };
        });

        const columns = [
            { id: 'timerp', label: 'Yêu cầu lúc', minWidth: 100 },
            { id: 'timesrp', label: 'Ngày bắt đầu', minWidth: 50 },
            { id: 'timeerp', label: 'Ngày kết thúc', minWidth: 100 },
            { id: 'tansuat', label: 'Tần suất', minWidth: 100 },
            { id: 'email', label: 'Email', minWidth: 100 },
            { id: 'trangthai', label: 'Trạng thái', minWidth: 100},
        ];

        setrow(rows);
        setcolumns(columns);
    };

    useEffect(() => {
        fetchDatareport();
    }, []); 

    const handleRefresh = () => {
        fetchDatareport(); 
    };

    const handleChange = (event) => {
        const value = event.target.value;
        if (value.includes('00000')) {
            if (stationName.includes('00000')) {
                if (!value.includes('00000')) {
                    setstationName([]);
                    setstationidlist([]);
                } else {
                    setstationName(value.filter(item => item !== '00000'));
                    setstationidlist(value);
                }
            } else {
                const allStationNames = stationsRef.current.map(station => station.station_id);
                setstationName([...allStationNames, '00000']);
                setstationidlist(['00000']);
            }
        }
        else {
            if (!value.includes('00000') && stationName.length - 1 == stationsRef.current.length) {
                setstationName([]);
                setstationidlist([]);
            } else {
                setstationName(value);
                setstationidlist(value);

            }
        }
    }; 

    const [timerp, setTimerp] = useState('1');

    const handleChangetimerp = (event) => {
        setTimerp(event.target.value);
    };
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const handleSubmit = async () => {
        const data = {
            order_provine: tinhid,
            tinh: getNameProvince(name_province),
            name_file: "",
            file_ref : "",
            request_time: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            ngaybatdau: Timestart ,
            ngayketthuc: Timeend ,
            tansuat: $("#tansuattime input").val(),
            email: $("#email-getreport").val(),
            trangthai: 0 ,
            id_station_list: stationidlist,
        };
        
        try {
            const response = await axios.post(apireport, data);
            if (response.status === 200) {
                setSnackbarMessage('Data added successfully');
                setSnackbarVariant('success');
                setSnackbarOpen(true);
                setOpen(false);
                handleRefresh();
            }
        } catch (error) {
            setSnackbarMessage('Failed to add data');
            setSnackbarVariant('error');
            setSnackbarOpen(true);
        }
    };
    const handleDownload = async (fileName) => {
        try {
            const response = await fetch(apidownloadfile + fileName, {
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
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error downloading file:', error);
            // Xử lý lỗi tải xuống ở đây
        }
    }
    const customHeader = (
        <div>
            <Login ishome={false} />
        </div>
    );
    return (
        <div>
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
            <div className="r-overview">
                <div className="vnrain-toolbar">
                    <div className="header-title">
                        <div className="name-view">
                            <img src="../src/assets/react.svg" onClick={handleItemClick} style={{ cursor: 'pointer' }}></img>
                            <span className="header-name">{getNameProvince(name_province)}</span>
                        </div>
                        <div className="button-view">
                            <button className="view-tongquan" onClick={handleOverviewClick} >Tổng quan</button>
                            <button className="view-chitiet" onClick={handleDetailviewClick} >Chi tiết</button>
                            <button className="view-baocao active" >Báo cáo</button>
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
            <div className="nagative_report">
                <button id="refesh" onClick={handleRefresh}>Cập nhật</button>
                <button id="addreport" onClick={handleClickOpen}>Tạo báo cáo</button>
                <Dialog
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    className="dialog-report"
                >
                    <DialogTitle id="alert-dialog-title">
                        {"Tạo báo cáo"}
                    </DialogTitle>
                    <DialogContent>
                        <Box
                            component="form"
                            sx={{
                                '& .MuiTextField-root': { margin: '8px 0px' , width:'100%' },
                            }}
                            noValidate
                            autoComplete="off"
                            className="form-box-report"
                        >
                            <div style={{ minWidth: '450px' }}>
                                <TextField
                                type="email"
                                label="Email nhận báo cáo"
                                id="email-getreport"
                                size="small"
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <FormControl sx={{ margin: '8px 0px', width: '67%' }} size="small">
                                        <InputLabel id="demo-multiple-checkbox-label">Trạm hiển thị</InputLabel>
                                    <Select
                                        labelId="demo-multiple-checkbox-label"
                                        id="demo-multiple-checkbox"
                                        multiple
                                        value={stationName}
                                        onChange={handleChange}
                                        input={<OutlinedInput label="Tag" />}
                                        renderValue={(selected) => {
                                                if (selected.includes('Tất cả các trạm')) {
                                                return 'Tất cả các trạm';
                                                } else if (selected.length > 1) {
                                                return `Đã chọn ${selected.length} trạm`;
                                                } else {
                                                    const selectedStation = stationsRef.current.find(station => station.station_id === selected[0]);
                                                    return selectedStation ? selectedStation.station_name : '';
                                                }
                                        }}
                                        MenuProps={MenuProps}
                                        >
                                            <MenuItem value="00000">
                                                <Checkbox checked={stationName.includes('00000')} id="allstations"/>
                                                <ListItemText primary="Tất cả các trạm" htmlFor="allstations" />
                                            </MenuItem>
                                            {stationsRef.current.map((aaa) => (
                                                <MenuItem key={aaa.station_id} value={aaa.station_id} >
                                                    <Checkbox checked={stationName.includes(aaa.station_id)} name={aaa.station_name} />
                                                    <ListItemText primary={aaa.station_name} />
                                                </MenuItem>
                                            ))}
                                    </Select>
                                    </FormControl>
                                    <FormControl sx={{ margin: '8px 0px', width: '30%' }} size="small" id="tansuattime" >
                                        <InputLabel id="type-time-report">Tần suất</InputLabel>
                                        <Select
                                            labelId="type-time-report"
                                            className="tansuatrp"
                                            value={timerp}
                                            onChange={handleChangetimerp}
                                            >
                                                <MenuItem value={1}> 1 giờ</MenuItem>
                                                <MenuItem value={3}> 3 giờ</MenuItem>
                                                <MenuItem value={6}> 6 giờ</MenuItem>
                                                <MenuItem value={12}> 12 giờ</MenuItem>
                                                <MenuItem value={24}> 1 ngày</MenuItem>
                                        </Select>
                                    </FormControl>
                                    
                                </div>
                                <div>
                                    <div className="container-select">
                                        <FormControl sx={{ margin: '8px 0px', minWidth: 120 }} size="small"  >
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
                                                {/* <MenuItem value="2">Tháng</MenuItem> */}
                                                <MenuItem value="3">Khoảng thời gian</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <div className="my-datepicker" id="my-datepicker-1" style={{ display: selectedOption === "1" ? 'block' : 'none' }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="Chọn ngày"
                                                    slotProps={{ textField: { size: 'small' } }}
                                                    maxDate={yesterday}
                                                    format="DD/MM/YYYY"
                                                    onChange={handleDateeChangm}
                                                />
                                        </LocalizationProvider>
                                    </div>
                                    <div className="my-datepicker" id="my-datepicker-2" style={{ display: selectedOption === "2" ? 'block' : 'none' }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="Chọn tháng"
                                                    views={['month', 'year']}
                                                    slotProps={{ textField: { size: 'small' } }}
                                                    maxDate={today}
                                                    format="MM/YYYY"
                                                />
                                        </LocalizationProvider>
                                    </div>
                                    <div className="my-datepicker bonus-set-report" id="my-datepicker-3" style={{ display: selectedOption === "3" ? 'flex' : 'none', maxWidth: '450px', justifyContent: 'space-between' }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs} >
                                            <DateTimePicker
                                                    className="my-datepicker-3-strp"
                                                    label="Ngày bắt đầu"
                                                    slotProps={{ textField: { size: 'small' } }}
                                                    maxDate={today}
                                                    format="DD/MM/YYYY HH:mm"
                                                    viewRenderers={{
                                                        hours: null,
                                                        minutes: null,
                                                        seconds: null,
                                                    }}
                                                    onChange={handleDatesChange}
                                                />
                                            <DateTimePicker
                                                    className="my-datepicker-3-edrp"
                                                    label="Ngày kết thúc"
                                                    slotProps={{ textField: { size: 'small' } }}
                                                    viewRenderers={{
                                                        hours: null,
                                                        minutes: null,
                                                        seconds: null,
                                                    }}
                                                    maxDate={today}
                                                    format="DD/MM/YYYY HH:mm"
                                                    onChange={handleDateeChange}
                                                />
                                        </LocalizationProvider>
                                        </div>
                                </div>
                            </div>
                        </Box>
                    </DialogContent>
                    <DialogActions className="dialog-button">
                        <button onClick={handleClose}>Hủy</button>
                        <button autoFocus id="sendreport" onClick={handleSubmit}>
                            Tạo báo cáo
                        </button>
                    </DialogActions>
                </Dialog>
            </div>

            <div className="table-report">
                <StickyHeaderTable rows={rows} columns={columns} />
            </div>
        </div>
    );
}
export default ReportComponent;
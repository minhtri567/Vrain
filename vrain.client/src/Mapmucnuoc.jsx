/* eslint-disable react/no-unknown-property */
/* eslint-disable react/jsx-no-duplicate-props */

import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Login from './Login';
import $ from 'jquery';
import Chartmucnuoc from './Chartmucnuoc';
import Panellayer from './Panellayer';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete, TextField } from '@mui/material';
// Đặt API key của bạn vào đây
mapboxgl.accessToken = 'pk.eyJ1IjoiYWNjdXdlYXRoZXItaW5jIiwiYSI6ImNqeGtxeDc4ZDAyY2czcnA0Ym9ubzh0MTAifQ.HjSuXwG2bI05yFYmc0c9lw';

const Mapmucnuoc = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const navigate = useNavigate();
    const stationsRef = useRef([]);
    const [showChart, setShowChart] = useState(false);
    const [selectedStation, setSelectedStation] = useState('');
    const [dataChart, setDataChart] = useState([]);
    const [fdata, setfdata] = useState();
    const [tinhdata, settinhfdata] = useState();
    const today = dayjs();
    const sevenDaysAgo = today.subtract(7, 'day');
    const [loading, setLoading] = useState(true);
    var hoverTimeout;
    var allapistations = '/vnrain/Mucnuoc';
    var apiraintime = "/vnrain/WeatherStations/raintoday?provincename=";
    var now = new Date();
    now.setMinutes(0);
    var currentDateTime = now.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',  
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
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
    const handlerefecthdata = () => {
        prepareChartData(fdata.sid, tinhdata ).then(response => {
            setDataChart(response.dataChart);
        });
    };

    const prepareChartData = async (stationid, tinhtation) => {
        setLoading(true);
        const response = await fetch(apiraintime + encodeURIComponent(tinhtation) + "&startDate=" + convertDateFormat($(".my-datepicker-3-st input").val()) + "&endDate=" + convertDateFormat($(".my-datepicker-3-ed input").val()) + "&modeview=1&mathongso=DOMUCNUOC");
        const data24h = await response.json();

        let mbaodong1;
        let mbaodong2;
        let mbaodong3;
        let mlulichsu;
        let maxTotal = -Infinity;

        data24h.forEach(dayData => {
            const stationData = dayData.stations.find(station => station.station_id === stationid);
            if (stationData && stationData.total > maxTotal) {
                maxTotal = stationData.total;
                mbaodong1 = stationData.baodong1;
                mbaodong2 = stationData.baodong2;
                mbaodong3 = stationData.baodong3;
                mlulichsu = stationData.lulichsu;
            }
        });
        const dataChart = [];
        data24h.forEach(dayData => {
            const timepoint = dayData.timePoint;
            const stationData = dayData.stations.find(station => station.station_id === stationid);
            if (stationData) {
                const chartEntry = {
                    timepoint,
                    [`${stationData.station_name}`]: stationData.total,
                    'Báo động 1': stationData.baodong1,
                };
                if (maxTotal >= mbaodong1 ) {
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

        const result = { dataChart };

        setLoading(false);
        return result;
    };


    useEffect(() => {
        const fetchfullData = async () => {

            try {
                const response = await fetch(allapistations);

                const data = await response.json();
                stationsRef.current = data;
                initializeMap();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchfullData();

    }, [allapistations]);

    const initializeMap = () => {
        if (!map.current && stationsRef.current.length > 0) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [106.660172, 14.962622],
                zoom: 4.5
            });

            map.current.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true,
                    showUserHeading: true,
                    fitBoundsOptions: {
                        maxZoom: 10
                    }
                }),
                'bottom-right'
            );

            map.current.on('style.load', () => {
                map.current.setLayoutProperty('country-label', 'visibility', 'none');
                // Ẩn tên tỉnh/thành phố
                map.current.setLayoutProperty('state-label', 'visibility', 'none');
                // Ẩn tên thành phố
                map.current.setLayoutProperty('settlement-label', 'visibility', 'none');
                // Ẩn tên biển
                map.current.setLayoutProperty('water-line-label', 'visibility', 'none');
                // Ẩn biên giới quốc gia
                map.current.setLayoutProperty('admin-0-boundary', 'visibility', 'none');
                // Ẩn biên giới tỉnh/thành phố
                map.current.setLayoutProperty('admin-1-boundary', 'visibility', 'none');
            });
            map.current.on('load', () => {
                // Thêm layer cho các điểm trạm
                map.current.loadImage(
                    '../public/non-warning.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('non-warning', image);
                    }
                );
                map.current.loadImage(
                    '../public/warning-1.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-1', image);
                    }
                );
                map.current.loadImage(
                    '../public/warning-2.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-2', image);
                    }
                );
                map.current.loadImage(
                    '../public/warning-3.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-3', image);
                    }
                );

                map.current.addSource('stations', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: stationsRef.current.map(station => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.lon, station.lat]
                            },
                            properties: {
                                sid: station.station_id,
                                name: station.station_name,
                                ngaydo: station.data_time,
                                mucnuoc: station.value,
                                tinh: station.tinh,
                                baodong1: station.baodong1,
                                baodong2: station.baodong2,
                                baodong3: station.baodong3,
                            }
                        }))
                    }
                });

                map.current.addLayer({
                    'id': 'bien-dong-label',
                    'type': 'symbol',
                    'source': {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': [
                                {
                                    'type': 'Feature',
                                    'geometry': {
                                        'type': 'Point',
                                        'coordinates': [114.0, 16.0]
                                    },
                                    'properties': {
                                        'name': 'Biển Đông'
                                    }
                                }
                            ]
                        }
                    },
                    'layout': {
                        'text-field': ['get', 'name'],
                        'text-font': ["Open Sans Italic", "Arial Unicode MS Regular"],
                        'text-size': 24,
                        'text-anchor': 'center',
                        'text-offset': [0, 0]
                    },
                    'paint': {
                        'text-color': '#f6fbf6',
                        'text-opacity': 0.5
                    },
                    'maxzoom': 7,
                });


                map.current.addLayer({
                    id: 'non-warning-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['<=', ['get', 'mucnuoc'], ['get', 'baodong1']]  
                    ],
                    layout: {
                        'icon-image': 'non-warning',
                        'icon-allow-overlap': true
                    }
                });

                map.current.addLayer({
                    id: 'warning-1-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['>', ['get', 'mucnuoc'], ['get', 'baodong1']], 
                        ['<=', ['get', 'mucnuoc'], ['get', 'baodong2']] 
                    ],
                    layout: {
                        'icon-image': 'warning-1',
                        'icon-allow-overlap': true
                    }
                });

                map.current.addLayer({
                    id: 'warning-2-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['>', ['get', 'mucnuoc'], ['get', 'baodong2']], 
                        ['<=', ['get', 'mucnuoc'], ['get', 'baodong3']] 
                    ],
                    layout: {
                        'icon-image': 'warning-2',
                        'icon-allow-overlap': true
                    }
                });

                map.current.addLayer({
                    id: 'warning-3-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['>', ['get', 'mucnuoc'], ['get', 'baodong3']], 
                    layout: {
                        'icon-image': 'warning-3',
                        'icon-allow-overlap': true
                    }
                });

                const popup = new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: true
                });

                // hover vào layer
                map.current.on('mouseenter', 'non-warning-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table smallrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td>" + parseFloat(infor.mucnuoc).toFixed(2) + " cm</td></tr>" +
                                "<tr><td>Vào lúc :  " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'non-warning-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });


                map.current.on('mouseenter', 'warning-1-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table mediumrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.mucnuoc).toFixed(2) + " cm</td></tr>" +
                                "<tr><td>Tại thời điểm " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'warning-1-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });

                map.current.on('mouseenter', 'warning-2-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table heavyrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.mucnuoc).toFixed(2) + " cm</td></tr>" +
                                "<tr><td>Tại thời điểm " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'warning-2-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });


                map.current.on('mouseenter', 'warning-3-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table heavierrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.mucnuoc).toFixed(2) + " cm</td></tr>" +
                                "<tr><td>Tại thời điểm " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'warning-3-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });


                map.current.on('click', 'non-warning-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh, e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid: infor.sid,
                        lat: e.lngLat.lat,
                        lon: e.lngLat.lng
                    });

                });
                map.current.on('click', 'warning-1-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh, e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid: infor.sid,
                        lat: e.lngLat.lat,
                        lon: e.lngLat.lng
                    });

                });
                map.current.on('click', 'warning-2-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh, e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid: infor.sid,
                        lat: e.lngLat.lat,
                        lon: e.lngLat.lng
                    });

                });
                map.current.on('click', 'warning-3-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh, e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid: infor.sid,
                        lat: e.lngLat.lat,
                        lon: e.lngLat.lng
                    });

                });
            });
        }
    };

    const viewllstation = (lat, lon) => {
        if (map.current) {
            map.current.flyTo({
                center: [lon, lat],
                zoom: 12,
                essential: true
            });
        }
    };

    const [searchVisible, setSearchVisible] = useState(false);
    const searchInputRef = useRef(null);


    const handleOutsideClick = (e) => {
        if (searchVisible && !document.getElementById('formse').contains(e.target)) {
            setSearchVisible(false);
        }
    };
    const handleChangeStation = (event) => {
        setSelectedStation(event.target.value)
    };

    useEffect(() => {
        if (stationsRef.current.find(station => station.station_id === selectedStation) != undefined) {
            const temp = stationsRef.current.find(station => station.station_id === selectedStation)
            prepareChartData(temp.station_id, tinhdata).then(response => {
                setDataChart(response.dataChart);
            });
            viewllstation(temp.lat, temp.lon);
        }
    }, [selectedStation]);

    // Listen for clicks outside the search input to close it
    React.useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [searchVisible]);
    useEffect(() => {
        if (searchVisible) {
            searchInputRef.current.focus();
        }
    }, [searchVisible]);

    return (
        <div>
            <Panellayer />
            <div className="popup-chart-container" style={showChart ? { display: 'grid' } : { display: 'none' }}>
                <div className="popup-chart-overlay" onClick={() => setShowChart(false)} ></div>
                <div className="css-times" onClick={() => setShowChart(false)} > &times; </div>
                <div className="popup-chart-content">
                    <div className="popup-container-native" >
                        <div className="container-select">
                            <Autocomplete
                                sx={{ m: 1, minWidth: 200 }}
                                size="small"
                                id="autocomplete-stations"
                                options={stationsRef.current.filter(station => station.tinh === tinhdata)}
                                getOptionLabel={(option) => option.station_name || "Không tìm thấy tên trạm"}
                                value={selectedStation ? stationsRef.current.find(s => s.station_id === selectedStation) : null}
                                onChange={(event, newValue) => {
                                    if (newValue) {
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
                                getOptionSelected={(option, value) => option.station_id === value.station_id}
                            />
                        </div>
                        <div className="my-datepicker" id="my-datepicker-3" >
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
                        <div style={{ marginLeft: 'auto', fontSize: '18px' }}>Tỉnh : {tinhdata}</div>
                    </div>

                    {!loading && (
                        <Chartmucnuoc dataChart={dataChart} chartHeight="85%" />
                    )}

                </div>
            </div>
            <div className="login-container">
                <Login ishome={true} />
            </div>
            <div className="liststation click-view-provine">
                <h2>Danh sách các khu vực lưu vực toàn nước</h2>
                <div className="seach-provine">
                    <div className="search-header">
                        <h3 style={{ display: searchVisible ? 'none' : 'block' }}>Mực nước các trạm đo hiện tại </h3>
                    </div>
                </div>
                <div className="listraininfo">
                    <ul>
                    </ul>
                </div>
            </div>
            <div ref={mapContainer} style={{ width: '100%', top: '0', bottom: '0', position: 'absolute' }} />
        </div>
    );
};

export default Mapmucnuoc;

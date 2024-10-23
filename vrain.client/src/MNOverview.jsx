/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getNameProvince } from './NameProvine';
import Chartmucnuoc from './Chartmucnuoc';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete, TextField } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import Login from './Login';
import $ from 'jquery';



mapboxgl.accessToken = 'pk.eyJ1IjoiYWNjdXdlYXRoZXItaW5jIiwiYSI6ImNqeGtxeDc4ZDAyY2czcnA0Ym9ubzh0MTAifQ.HjSuXwG2bI05yFYmc0c9lw';


const MNOverview = () => {
    const pathname = window.location.pathname;
    const name_luuvuc = pathname.substring(pathname.lastIndexOf('/') + 1);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const navigate = useNavigate();
    const [visibleRight, setVisibleRight] = useState(false);
    const stationsRef = useRef([]);
    const [stations, setStations] = useState([]);
    const [filteredStations, setFilteredStations] = useState([]);
    const [showChart, setShowChart] = useState(false);
    const [dataChart, setDataChart] = useState([]);
    const [fdata, setfdata] = useState({});
    const [loading, setLoading] = useState(true);
    const today = dayjs();
    const [selectedStation, setSelectedStation] = useState('');
    const [selectmodeview, setselectmodeview] = useState(2);
    const sevenDaysAgo = today.subtract(7, 'day');
    var curentapiluuvuc = "/vnrain/Mucnuoc?luuvuc=" + getNameProvince(name_luuvuc) + "";
    var apimucnuocnow = "/vnrain/Mucnuoc/Mucnuocnow?luuvuc=" + getNameProvince(name_luuvuc) + "";
    var hoverTimeout;
    var now = new Date();
    var currentDateTime = now.toLocaleString('vi-VN', {
        hour: 'numeric',
        minute: 'numeric',
        day: '2-digit',
        month: '2-digit'
    });

    useEffect(() => {
        const fetchDataProvine = async () => {
            try {
                const response = await fetch(curentapiluuvuc);

                const data = await response.json();
                setStations(data);
                setFilteredStations(data);
                stationsRef.current = data;
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

    const prepareChartData = async (stationid) => {
        setLoading(true);
        const response = await fetch(apimucnuocnow + "&startDate=" + convertDateFormat($(".my-datepicker-3-st input").val()) + "&endDate=" + convertDateFormat($(".my-datepicker-3-ed input").val() + "&mathongso=DOMUCNUOC"));
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

        const result = { dataChart };

        setLoading(false);
        return result;
    }

    useEffect(() => {
        if (stationsRef.current.find(station => station.station_id === selectedStation) != undefined) {
            const temp = stationsRef.current.find(station => station.station_id === selectedStation)
            prepareChartData(temp.station_id).then(response => {
                setDataChart(response.dataChart);
            });
            viewllstation(temp.lat, temp.lon);
        }
    }, [selectedStation]);

    useEffect(() => {
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [106.660172, 14.962622],
            zoom: 4.5
        });

        class FitBoundsControl {
            onAdd(map) {
                this._map = map;
                this._container = document.createElement('div');
                this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
                this._button = document.createElement('button');
                this._button.className = 'mapboxgl-ctrl-icon';
                this._button.type = 'button';
                this._button.title = '';
                this._button.innerHTML = '<span class="fa-solid fa-location-arrow" style="font-size: 21px;align-items: center;display: grid;"></span>';
                this._button.onclick = () => this.fitBounds();
                this._container.appendChild(this._button);
                return this._container;
            }

            onRemove() {
                this._container.parentNode.removeChild(this._container);
                this._map = undefined;
            }

            fitBounds() {
                const bounds = new mapboxgl.LngLatBounds();
                stations.forEach(station => {
                    bounds.extend([station.lon, station.lat]);
                });
                this._map.fitBounds(bounds, { padding: 40 });
            }
        }
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.current.addControl(new FitBoundsControl(), 'top-right');
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

        if (stationsRef.current.length > 0) {
            map.current.on('load', () => {
                // Thêm layer cho các điểm trạm
                map.current.loadImage(
                    "/public/tramthuyvan.png",
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('non-warning', image);
                    }
                );
                map.current.loadImage(
                    "/public/1co.png",
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-1', image);
                    }
                );
                map.current.loadImage(
                    "/public/2co.png",
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-2', image);
                    }
                );
                map.current.loadImage(
                    "/public/3co.png",
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

                map.current.addSource('province', {
                    type: 'vector',
                    tiles: [
                        "https://geoserver.thuyloivietnam.vn/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=cwrs_sllq:bgmap_province&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}"
                    ],
                    bounds: [102.11428312324676, 8.485818270342207, 109.50789401865103, 23.46320380510631]
                });
                map.current.addSource('district', {
                    type: 'vector',
                    tiles: [
                        "https://geoserver.thuyloivietnam.vn/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=cwrs_sllq:bgmap_district&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}"
                    ],
                    bounds: [102.07066991620277, 4.8898854254303625, 117.04637621992522, 23.480095522560013]
                });
                map.current.addSource('commune', {
                    type: 'vector',
                    tiles: [
                        "https://geoserver.thuyloivietnam.vn/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=cwrs_sllq:bgmap_commune&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}"
                    ],
                    bounds: [102.10728524718348, 8.302989562662342, 109.50569314620493, 23.464551101920666]
                });

                map.current.addLayer({
                    'id': 'province-layer',
                    'type': 'line',
                    'source': 'province',
                    'source-layer': 'bgmap_province',
                    'paint': {
                        'line-color': '#ff6b6a',
                        'line-width': 1
                    },
                    'filter': ['==', ['get', 'ten_tinh'], getNameProvince(name_luuvuc)],
                    'maxzoom': 7
                });

                map.current.addLayer({
                    'id': 'district-layer',
                    'type': 'line',
                    'source': 'district',
                    'source-layer': 'bgmap_district',
                    'paint': {
                        'line-color': '#929292',
                        'line-width': 1
                    },
                    'minzoom': 7,
                    'maxzoom': 10
                });
                map.current.addLayer({
                    'id': 'commune-layer',
                    'type': 'line',
                    'source': 'commune',
                    'source-layer': 'bgmap_commune',
                    'paint': {
                        'line-color': '#929292',
                        'line-width': 1
                    },
                    'minzoom': 10
                });

                map.current.addLayer({
                    'id': 'province-label-layer',
                    'type': 'symbol',
                    'source': 'province',
                    'source-layer': 'bgmap_province',
                    'maxzoom': 7,
                    'minzoom': 5,
                    'layout': {
                        'text-field': ['get', 'ten_tinh'],
                        'text-size': 12,
                        'text-anchor': 'center',
                        'text-offset': [0, 0.5],
                        'text-allow-overlap': true
                    },
                    'paint': {
                        'text-color': '#000000',
                        'text-halo-color': '#FFFFFF',
                        'text-halo-width': 1
                    }
                });
                map.current.addLayer({
                    'id': 'district-label-layer',
                    'type': 'symbol',
                    'source': 'district',
                    'source-layer': 'bgmap_district',
                    'minzoom': 7,
                    'maxzoom': 10,
                    'layout': {
                        'text-field': ['get', 'ten_huyen'],
                        'text-size': 12,
                        'text-anchor': 'center',
                        'text-offset': [0, 0.5],
                    },
                    'paint': {
                        'text-color': '#000000',
                        'text-halo-color': '#FFFFFF',
                        'text-halo-width': 1
                    }
                });
                map.current.addLayer({
                    'id': 'commune-label-layer',
                    'type': 'symbol',
                    'source': 'commune',
                    'source-layer': 'bgmap_commune',
                    'minzoom': 12,
                    'layout': {
                        'text-field': ['get', 'ten_xa'],
                        'text-size': 12,
                        'text-anchor': 'center',
                        'text-offset': [0, 0.5],
                    },
                    'paint': {
                        'text-color': '#000000',
                        'text-halo-color': '#FFFFFF',
                        'text-halo-width': 1
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
                    id: 'text-warning-layer',
                    type: 'symbol',
                    source: 'stations',
                    layout: {
                        'text-field': ['concat', ['get', 'mucnuoc'], ' cm'],
                        'text-size': 12,
                        'text-anchor': 'bottom',
                        'icon-allow-overlap': true
                    },
                    minzoom: 10,
                    maxzoom: 15,
                });

                map.current.addLayer({
                    id: 'station-mc-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['!=', ['get', 'mucnuoc'], null],  
                    ],
                    layout: {
                        'icon-image': [
                            'case',
                            ['==', ['get', 'baodong1'], null], 'non-warning', 
                            ['==', ['get', 'baodong2'], null], 'non-warning',  
                            ['==', ['get', 'baodong3'], null], 'non-warning',  
                            ['>', ['get', 'mucnuoc'], ['get', 'baodong3']], 'warning-3',  
                            ['>', ['get', 'mucnuoc'], ['get', 'baodong2']], 'warning-2',  
                            ['>', ['get', 'mucnuoc'], ['get', 'baodong1']], 'warning-1',  
                            'non-warning'  
                        ],
                        'icon-size': [
                            'case',
                            ['==', ['get', 'baodong1'], null], 0.4,  
                            ['==', ['get', 'baodong2'], null], 0.4,  
                            ['==', ['get', 'baodong3'], null], 0.4,  
                            ['>', ['get', 'mucnuoc'], ['get', 'baodong3']], 1.0,  
                            ['>', ['get', 'mucnuoc'], ['get', 'baodong2']], 0.8, 
                            ['>', ['get', 'mucnuoc'], ['get', 'baodong1']], 0.6,  
                            0.4  
                        ],
                        'icon-allow-overlap': true
                    }
                });

                const popup = new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: true
                });

                // hover vào layer
                map.current.on('mouseenter', 'station-mc-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table non-warning'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td>" + parseFloat(infor.mucnuoc).toFixed(2) + " cm</td></tr>" +
                                "<tr><td>Vào lúc :  " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'station-mc-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });


                map.current.on('click', 'station-mc-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh, e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    setfdata({
                        sid: infor.sid,
                        lat: e.lngLat.lat,
                        lon: e.lngLat.lng
                    });

                });
                
                const bounds = new mapboxgl.LngLatBounds();
                stations.forEach(station => {
                    bounds.extend([station.lon, station.lat]);
                });
                map.current.fitBounds(bounds, {
                    padding: 40,
                });
            });
        }

    }, [stationsRef.current]);



    const [searchVisible, setSearchVisible] = useState(false);
    const searchInputRef = useRef(null);

    const toggleSearchInput = () => {
        setSearchVisible(!searchVisible);
        document.getElementById('formse').focus();
    };

    const handleOutsideClick = (e) => {
        if (searchVisible && !document.getElementById('formse').contains(e.target)) {
            setSearchVisible(false);
        }
    };


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
    const handleItemClick = () => {
        navigate(`/mucnuoc`);
    };
    const handleVdetail = () => {

    }
    const handleRdetail = () => {

    }
    const viewllstation = (lat, lon) => {
        if (map.current) {
            map.current.flyTo({
                center: [lon, lat],
                zoom: 12,
                essential: true
            });
        }
    };

    const handlerefecthdata = () => {
        prepareChartData(fdata.sid, fdata.lat, fdata.lon).then(response => {
            setDataChart(response.dataChart);
        });
    };
    const handleChangeStation = (event) => {
        setSelectedStation(event.target.value)
    };

    const customHeader = (
        <div>
            <Login ishome={false} />
        </div>
    );
    useEffect(() => {

    }, [selectmodeview]);

    const handleChangemode = (event) => {
        setselectmodeview(event.target.value);
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

    const highlightBlinking = (map, lng, lat) => {
        const createCustomMarker = () => {
            const markerElement = document.createElement('div');
            markerElement.style.backgroundSize = 'cover';
            markerElement.style.width = '30px';
            markerElement.style.height = '30px';
            markerElement.style.borderRadius = '50%';
            markerElement.style.opacity = '0.2'; // Độ mờ khởi tạo là 20%
            markerElement.style.transition = 'opacity 1s ease'; // Thêm transition cho hiệu ứng mờ
            return markerElement;
        };

        const markerElement = createCustomMarker();

        const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([lng, lat])
            .addTo(map);

        const interval = setInterval(() => {
            markerElement.style.backgroundColor = '#FF0000'; // Đặt màu đỏ
        }, 200);

        setTimeout(() => {
            clearInterval(interval);
            markerElement.style.opacity = '0';
            setTimeout(() => {
                marker.remove();
            }, 1000);
        }, 2000);
    };

    const handleStationClick = (lat, lon) => {
        if (isMobile) {
            $('.containt-view-mapbox').css('display', 'block');
            $('.liststation').css('display', 'none');
            map.current.resize();
            viewllstation(lat, lon);
        } else {
            // Xử lý cho desktop
            viewllstation(lat, lon);
            highlightBlinking(map.current, lon, lat);
        }
    };
    const handleDoubleClick = (lat, lon, station_id) => {
        setSelectedStation(station_id);
        viewllstation(lat, lon);
        setShowChart(true);
        prepareChartData(station_id, lat, lon).then(response => {
            setDataChart(response.dataChart);
        });
        setfdata({
            sid: station_id,
            lat: lat,
            lon: lon
        });
    };
    const exitviewmap = () => {
        $('.containt-view-mapbox').css('display', 'none');
        $('.liststation').css('display', 'block');
    };
    return (
        <div className="r-overview" style={{ height: '100vh' }}>

            <div className="popup-chart-container" style={showChart ? { display: 'grid' } : { display: 'none' }}>
                <div className="popup-chart-overlay" onClick={() => setShowChart(false)} ></div>
                <div className="css-times" onClick={() => setShowChart(false)} > &times; </div>
                <div className="popup-chart-content">
                    <div className="popup-container-native" >
                        <div className="container-select">
                            <FormControl sx={{ m: 1, minWidth: 200 }} size="small"  >
                                <Autocomplete
                                    id="autocomplete-stations"
                                    size="small"
                                    options={stationsRef.current}
                                    getOptionLabel={(station) => station.station_name}
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
                                    isOptionEqualToValue={(option, value) => option.station_id === value.station_id}
                                />
                            </FormControl>
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
                        <div className="container-select my-mode-view" >
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
                    </div>

                    {!loading && (
                        <Chartmucnuoc dataChart={dataChart} chartHeight={isMobile ? '65%' : '85%'} />
                    )}

                </div>
            </div>
            <div className="vnrain-toolbar">
                <div className="header-title">
                    <div className="name-view">
                        <img src="/src/assets/react.svg" onClick={() => handleItemClick()} style={{ cursor: 'pointer' }}></img>
                        <span className="header-name">{getNameProvince(name_luuvuc)}</span>
                    </div>
                    <div className="button-view">
                        <button className="view-tongquan active">Tổng quan</button>
                        <button className="view-chitiet" onClick={handleVdetail}>Chi tiết</button>
                        <button className="view-baocao" onClick={handleRdetail}>Báo cáo</button>
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
                            <a className="view-tongquan active">Tổng quan</a>
                        </li>
                        <li>
                            <a className="view-chitiet" onClick={handleVdetail}>Chi tiết</a>
                        </li>
                        <li>
                            <a className="view-baocao" onClick={handleRdetail}>Báo cáo</a>
                        </li>
                    </ul>
                </Sidebar>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }} >
                <div className="liststation">
                    <div className="seach-provine">
                        <div className="search-header">
                            <h3 style={{ display: searchVisible ? 'none' : 'block' }}>Mực nước tại các trạm đo</h3>
                            <input className={`form-control ${searchVisible ? 'active' : ''}`} type="search" id="formse" autoFocus autoComplete="off" placeholder="Tìm kiếm tỉnh ..."
                                onChange={(e) => {
                                    const searchValue = e.target.value.toLowerCase();
                                    const filtered = stations.filter(station =>
                                        station.station_name.toLowerCase().includes(searchValue)
                                    );
                                    setFilteredStations(filtered);
                                }}
                                style={{ display: searchVisible ? 'block' : 'none' }}
                                ref={searchInputRef}
                            />
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true" onClick={toggleSearchInput} style={{ display: searchVisible ? 'none' : 'block' }}></i>
                            </div>
                        </div>
                    </div>
                    <div className="listraininfo">
                        <ul>
                            {filteredStations.map((station, index) => (
                                <li key={index} onClick={() => handleStationClick(station.lat, station.lon)} onDoubleClick={() => handleDoubleClick(station.lat, station.lon, station.station_id)} >
                                    <div className="list-line-1"><p className="station-tinh">{station.station_name}</p></div>
                                    <div className="list-line-2"><p className="station-name">Tại : {station.phuongxa} - {station.quanhuyen}</p></div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="containt-view-mapbox" >
                    <div className='containt-view-exit'>
                        <i className="fa-solid fa-xmark" onClick={exitviewmap}></i>
                    </div>
                    <div className="view-mapbox">
                        <div className="view-mapbox-contents">
                            <div className="mb-view-mode" >
                                <div ref={mapContainer} className="map-container" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MNOverview;

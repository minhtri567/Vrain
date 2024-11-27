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
import slug from 'slug';
import { useReactToPrint } from 'react-to-print';
import { Tree } from 'primereact/tree';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete, TextField } from '@mui/material';

import MapLayerPanel from './MapLayerPanel';

// Đặt API key của bạn vào đây
mapboxgl.accessToken = 'pk.eyJ1IjoiYWNjdXdlYXRoZXItaW5jIiwiYSI6ImNqeGtxeDc4ZDAyY2czcnA0Ym9ubzh0MTAifQ.HjSuXwG2bI05yFYmc0c9lw';

const Mapmucnuoc = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const navigate = useNavigate();
    const [luuvucList, setLuuvucList] = useState([]);
    const [tinhList, setTinhList] = useState([]);
    const [selectedValue, setSelectedValue] = useState('1');
    const [stationsRef, setstationsRef] = useState([]);
    const [showChart, setShowChart] = useState(false);
    const [selectedStation, setSelectedStation] = useState('');
    const [dataChart, setDataChart] = useState([]);
    const [fdata, setfdata] = useState();
    const [tinhdata, settinhfdata] = useState();
    const today = dayjs();
    const sevenDaysAgo = today.subtract(7, 'day');
    const [loading, setLoading] = useState(true);
    const [filteredLuuvucList, setfilteredLuuvucList] = useState('');
    const [selecteduiStation, setSelecteduiStation] = useState('');
    const [datachangselected, setdatachangselected] = useState([]);
    var hoverTimeout;
    var allapistations = '/vnrain/Mucnuoc';
    var allapiluuvuc = '/vnrain/Mucnuoc/luuvuc';
    var allapitinh = '/vnrain/Mucnuoc/tinh';
    var apiraintime = "/vnrain/WeatherStations/raintoday?provincename=";
    const apilayer = '/vnrain/Admin/GetMapLayers';

    const [layers, setLayers] = useState([]);
    const handlePrint = useReactToPrint({
        contentRef: mapContainer,
    });
    class CustomControl {
        onAdd(map) {
            this.map = map;
            this.container = document.createElement("div");
            this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

            const button = document.createElement("button");
            button.className = "mapboxgl-ctrl-icon";
            button.textContent = "🖨️";
            button.title = "Print Map";
            button.onclick = handlePrint;

            this.container.appendChild(button);
            return this.container;
        }

        onRemove() {
            this.container.parentNode.removeChild(this.container);
            this.map = undefined;
        }
    }
    useEffect(() => {
        const fetchLayers = async () => {
            const response = await fetch(apilayer);
            const data = await response.json();
            setLayers(data);
        };

        fetchLayers();
    }, []);
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

        setdatachangselected(data24h);

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
                    [`${stationData.station_name}`]: stationData.total.toLocaleString('vi-VN')
                };

                // Thêm các cấp báo động nếu không null và tổng đạt mức tương ứng
                if (mbaodong1 !== null && maxTotal >= mbaodong1) {
                    chartEntry['Báo động 1'] = mbaodong1.toLocaleString('vi-VN');
                }
                if (mbaodong2 !== null && maxTotal >= mbaodong2) {
                    chartEntry['Báo động 2'] = mbaodong2.toLocaleString('vi-VN');
                }
                if (mbaodong3 !== null && maxTotal >= mbaodong3) {
                    chartEntry['Báo động 3'] = mbaodong3.toLocaleString('vi-VN');
                }
                if (mlulichsu !== null && maxTotal >= mbaodong3) {
                    chartEntry['Lũ lịch sử'] = mlulichsu.toLocaleString('vi-VN');
                }

                dataChart.push(chartEntry);
            }
        });

        const result = { dataChart };

        setLoading(false);
        return result;
    };


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

    useEffect(() => {
        const fetchfullData = async () => {

            try {
                const response = await fetch(allapiluuvuc);

                const data = await response.json();
                setLuuvucList(data);
                
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchfullData();

    }, [allapiluuvuc]);


    useEffect(() => {
        const fetchfullData = async () => {

            try {
                const response = await fetch(allapitinh);

                const data = await response.json();
                setTinhList(data);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchfullData();

    }, [allapitinh]);



    useEffect(() => {
        const fetchfullData = async () => {

            try {
                const response = await fetch(allapistations);

                const data = await response.json();
                setstationsRef(data);
                
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchfullData();

    }, [allapistations]);

    useEffect(() => {
        if (stationsRef.length > 0 && layers.length > 0) {
            initializeMap();
        }
    }, [stationsRef, layers]);

    const addLayersToMap = (dataLayers) => {
        map.current.on('load', () => {
            dataLayers.forEach(source => {
                // Thêm nguồn (source) vào bản đồ
                map.current.addSource(source.sourceName, {
                    type: 'vector',
                    tiles: JSON.parse(source.tiles),
                    bounds: JSON.parse(source.bounds)
                });

                source.layers.forEach(layer => {
                    map.current.addLayer({
                        'id': layer.key,
                        'type': layer.layerType,
                        'source': source.sourceName,
                        'source-layer': layer.sourceLayer,
                        'paint': JSON.parse(layer.paint), 
                        'layout': JSON.parse(layer.layout),
                        'minzoom': layer.minZoom !== null ? layer.minZoom : 0,
                        'maxzoom': layer.maxZoom !== null ? layer.maxZoom : 18 
                    });
                });
            });
        });
    };
    const initializeMap = () => {
        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [106.660172, 14.962622],
                zoom: 4.5,
                preserveDrawingBuffer: true
            });
            addLayersToMap(layers);
            map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
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
                'top-right'
            );
            map.current.addControl(new CustomControl(), "top-right");
            
            map.current.addControl(new mapboxgl.ScaleControl({
                maxWidth: 80, // Chiều rộng tối đa
                unit: 'metric' // Đơn vị: metric hoặc imperial
            }), 'top-right');


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
            });
        }
        if (stationsRef.length > 0) {
            map.current.on('load', () => {
                // Thêm layer cho các điểm trạm
                map.current.loadImage(
                    '../public/tramthuyvan.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('non-warning', image);
                    }
                );
                map.current.loadImage(
                    '../public/1co.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-1', image);
                    }
                );
                map.current.loadImage(
                    '../public/2co.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-2', image);
                    }
                );
                map.current.loadImage(
                    '../public/3co.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('warning-3', image);
                    }
                );
                
                map.current.addSource('stations', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: stationsRef.map(station => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.lon, station.lat]
                            },
                            properties: {
                                sid: station.station_id,
                                name: station.station_name,
                                ngaydo: station.s_data_thoigian,
                                mucnuoc: station.data_giatri_sothuc,
                                tinh: station.tinh,
                                baodong1: station.baodong1,
                                baodong2: station.baodong2,
                                baodong3: station.baodong3,
                            }
                        }))
                    }
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
                            ['>=', ['get', 'mucnuoc'], ['get', 'baodong3']], 'warning-3',
                            ['>=', ['get', 'mucnuoc'], ['get', 'baodong2']], 'warning-2',
                            ['>=', ['get', 'mucnuoc'], ['get', 'baodong1']], 'warning-1',
                            'non-warning'
                        ],
                        'icon-size': [
                            'case',
                            ['==', ['get', 'baodong1'], null], 0.4,
                            ['==', ['get', 'baodong2'], null], 0.4,
                            ['==', ['get', 'baodong3'], null], 0.4,
                            ['>=', ['get', 'mucnuoc'], ['get', 'baodong3']], 0.8,
                            ['>=', ['get', 'mucnuoc'], ['get', 'baodong2']], 0.8,
                            ['>=', ['get', 'mucnuoc'], ['get', 'baodong1']], 0.6,
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
                                "<tr><td>" + (Math.round(infor.mucnuoc * 100) / 100).toLocaleString('vi-VN') + " cm</td></tr>" +
                                "<tr><td>Vào lúc :  " + infor.ngaydo + "</td></tr>" +
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
                    setSelecteduiStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);

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
        setSelecteduiStation(event.target.value);
        let mbaodong1;
        let mbaodong2;
        let mbaodong3;
        let mlulichsu;
        let maxTotal = -Infinity;

        datachangselected.forEach(dayData => {
            const stationData = dayData.stations.find(station => station.station_id === event.target.value);
            if (stationData && stationData.total > maxTotal) {
                maxTotal = stationData.total;
                mbaodong1 = stationData.baodong1;
                mbaodong2 = stationData.baodong2;
                mbaodong3 = stationData.baodong3;
                mlulichsu = stationData.lulichsu;
            }
        });
        const dataChart = [];
        datachangselected.forEach(dayData => {
            const timepoint = dayData.timePoint;
            const stationData = dayData.stations.find(station => station.station_id === event.target.value);
            if (stationData) {
                const chartEntry = {
                    timepoint,
                    [`${stationData.station_name}`]: stationData.total.toLocaleString('vi-VN')
                };

                // Thêm các cấp báo động nếu không null và tổng đạt mức tương ứng
                if (mbaodong1 !== null && maxTotal >= mbaodong1) {
                    chartEntry['Báo động 1'] = mbaodong1.toLocaleString('vi-VN');
                }
                if (mbaodong2 !== null && maxTotal >= mbaodong2) {
                    chartEntry['Báo động 2'] = mbaodong2.toLocaleString('vi-VN');
                }
                if (mbaodong3 !== null && maxTotal >= mbaodong3) {
                    chartEntry['Báo động 3'] = mbaodong3.toLocaleString('vi-VN');
                }
                if (mlulichsu !== null && maxTotal >= mbaodong3) {
                    chartEntry['Lũ lịch sử'] = mlulichsu.toLocaleString('vi-VN');
                }

                dataChart.push(chartEntry);
            }
        });
        setDataChart(dataChart);

        setLoading(false);
    };

    useEffect(() => {
        if (stationsRef.find(station => station.station_id === selectedStation) != undefined) {
            const temp = stationsRef.find(station => station.station_id === selectedStation)
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

    const onSelect = (event) => {
       
        if (event.node.children == undefined) {
            const targetStation = stationsRef.find(station => station.station_id === event.node.station_id);
            if (targetStation) {
                viewllstation(targetStation.lat, targetStation.lon)
                highlightBlinking(map.current, targetStation.lon, targetStation.lat);
                if (window.innerWidth <= 575.98) {
                    setSelectedStation(targetStation.station_id);
                    setSelecteduiStation(targetStation.station_id);

                    setShowChart(true);

                    settinhfdata(targetStation.tinh);

                    setfdata({
                        sid: targetStation.station_id,
                        lat: targetStation.lat,
                        lon: targetStation.lng
                    });
                }
            }

        } else {
            const encodedProvinceName = slug(event.node.label, { lower: true });
            navigate(`/mucnuoc/overview/${encodedProvinceName}`);
        }
    };

    useEffect(() => {
        if ((selectedValue === '1' && luuvucList.length > 0 && stationsRef.length > 0) ||
            (selectedValue === '2' && tinhList.length > 0 && stationsRef.length > 0)) {

            const mergedData = selectedValue === '1'
                ? luuvucList.map((luuvucItem, index) => ({
                    key: `${index}`,
                    label: luuvucItem.luuvuc,
                    children: stationsRef
                        .filter(station => station.luuvuc === luuvucItem.luuvuc)
                        .map((station, childIndex) => ({
                            key: `${index}-${childIndex}`,
                            label: station.station_name,
                            ...station
                        }))
                }))
                : tinhList.map((tinhItem, index) => ({
                    key: `${index}`,
                    label: tinhItem.ten_tinh,
                    children: stationsRef
                        .filter(station => station.tinh === tinhItem.ten_tinh)
                        .map((station, childIndex) => ({
                            key: `${index}-${childIndex}`,
                            label: station.station_name,
                            ...station
                        }))
                }));

            setfilteredLuuvucList(mergedData);
        }
    }, [luuvucList, tinhList, stationsRef, selectedValue]);

    const nodeTemplate = (node) => {
        if (!node.children) {
            return (
                <div className="node-con">
                    <div className = "first-col">
                         <div className = "icon-canhbao">
                                {(() => {
                                    if (node.data_giatri_sothuc < node.baodong1) {
                                        return;
                                    } else if (node.baodong1 == null ) {
                                        return;
                                    } else if (node.data_giatri_sothuc >= node.baodong1 && node.data_giatri_sothuc < node.baodong2) {
                                        return <img src="../public/1co.png" alt="Báo động 1" />;
                                    } else if (node.data_giatri_sothuc >= node.baodong2 && node.data_giatri_sothuc < node.baodong3) {
                                        return <img src="../public/2co.png" alt="Báo động 2" />;
                                    } else {
                                        return <img src="../public/3co.png" alt="Báo động 3" />;
                                    }
                                })()}
                            </div>
                            <div>
                                {node.label}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'grey', marginLeft: '10px' }}>
                            <div>
                                {node.data_giatri_sothuc.toLocaleString('vi-VN') + ' cm'} ( {' '} {node.s_data_thoigian} {' '})
                            </div>
                            </div>
                        </div>
                </div>
            );
        }
        return <span>{node.label}</span>; // Node cha
    };

    

    const handleChange = (event) => {
        setSelectedValue(event.target.value);
    };

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
                                options={stationsRef.filter(station => station.tinh === tinhdata)}
                                getOptionLabel={(option) => option.station_name || "Không tìm thấy tên trạm"}
                                value={selecteduiStation ? stationsRef.find(s => s.station_id === selecteduiStation) : null}
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
                        <div className="mn-tinh" style={{ marginLeft: 'auto', fontSize: '18px' }}>Tỉnh : {tinhdata}</div>
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
                <div className="liststation-header">
                    <h2>Danh sách trạm đo mực nước theo </h2>
                    <div className="liststation-mode-view">
                        <select value={selectedValue} onChange={handleChange}>
                            <option value='1'>lưu vực</option>
                            <option value='2'>tỉnh</option>
                        </select>
                    </div>
                </div>
                <div className="listraininfo mucnuoc">
                    <Tree value={filteredLuuvucList} filter filterMode="lenient" filterPlaceholder="Tìm kiếm trạm đo ..." onNodeClick={onSelect} nodeTemplate={nodeTemplate} />
                </div>
            </div>
            <MapLayerPanel layers={layers} mapRef={map} />
            <div ref={mapContainer} style={{ width: '100%', top: '0', bottom: '0', position: 'absolute' }} />
        </div>
    );
};

export default Mapmucnuoc;

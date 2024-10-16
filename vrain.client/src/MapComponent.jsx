/* eslint-disable react/no-unknown-property */
/* eslint-disable react/jsx-no-duplicate-props */

import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import slug from 'slug';
import Login from './Login';
import $ from 'jquery';
import BarChartComponent from './BarChartComponent';
import Panellayer from './Panellayer';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { Autocomplete, TextField } from '@mui/material';
import Select from '@mui/material/Select';
// Đặt API key của bạn vào đây
mapboxgl.accessToken = 'pk.eyJ1IjoiYWNjdXdlYXRoZXItaW5jIiwiYSI6ImNqeGtxeDc4ZDAyY2czcnA0Ym9ubzh0MTAifQ.HjSuXwG2bI05yFYmc0c9lw';

function Typerain(raintotal) {
    if (raintotal == 0) {
        return "<img src='../public/vrain_marker_empty.png' /><p class='text-norain'>Không mưa</p>";
    }
    if (raintotal > 0 && raintotal <= 16) {
        return "<img src='../public/vrain_marker_small.png' /><p class='text-small'>Mưa nhỏ </p>";
    }      
    if (raintotal > 16 && raintotal <= 50) {
        return "<img src='../public/vrain_marker_medium.png' /><p class='text-medium'>Mưa vừa</p>";
    }         
    if (raintotal > 50 && raintotal <= 99) {
        return "<img src='../public/vrain_marker_heavy.png' /><p class='text-heavy'>Mưa to</p>";
    }       
    if (raintotal > 99) {
        return "<img src='../public/vrain_marker_heavier.png' /><p class='text-heavier'>Mưa rất to</p>";
    }       
}
function Gettextrain(raintotal) {
    if (raintotal == 0) {
        return "<p class='text-norain'>" + parseFloat(raintotal).toFixed(1) +"mm</p>";
    }
    if (raintotal > 0 && raintotal <= 16) {
        return "<p class='text-small'>" + parseFloat(raintotal).toFixed(1) +"mm</p>";
    }
    if (raintotal > 16 && raintotal <= 50) {
        return "<p class='text-medium'>" + parseFloat(raintotal).toFixed(1) +"mm</p>";
    }
    if (raintotal > 50 && raintotal <= 99) {
        return "<p class='text-heavy'>" + parseFloat(raintotal).toFixed(1) +"mm</p>";
    }
    if (raintotal > 99) {
        return "<p class='text-heavier'>" + parseFloat(raintotal).toFixed(1) +"mm</p>";
    }
}
const MapComponent = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const navigate = useNavigate();
    const stationsRef = useRef([]);
    const [stations, setStations] = useState([]);
    const [filteredStations, setFilteredStations] = useState([]);
    const [showChart, setShowChart] = useState(false);
    const [selectedStation, setSelectedStation] = useState('');
    const [dataChart, setDataChart] = useState([]);
    const [fdata, setfdata] = useState();
    const [tinhdata, settinhfdata] = useState();
    const [selectmodeview, setselectmodeview] = useState(2);
    const today = dayjs();
    const sevenDaysAgo = today.subtract(7, 'day');
    const [loading, setLoading] = useState(true);
    var hoverTimeout;
    const dataserver = '/vnrain/WeatherStations';
    var allapistations = '/vnrain/WeatherStations/all';
    var apiraintime = "/vnrain/WeatherStations/raintoday?provincename=";
    var now = new Date();
    
    var currentDateTime = now.toLocaleString('vi-VN', {
        hour: 'numeric',
        minute: 'numeric',
        day: '2-digit',
        month: '2-digit'
    });
    var currentfullDateTime = now.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year : 'numeric'
    });
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
    const handlerefecthdata = () => {
        prepareChartData(fdata.sid , tinhdata , fdata.lat , fdata.lon).then(response => {
            setDataChart(response.dataChart);
        });
    };

    const prepareChartData = async (stationid, tinhtation, lat, lon) => {
        setLoading(true);
        const response = await fetch(apiraintime + encodeURIComponent(tinhtation) + "&startDate=" + convertDateFormat($(".my-datepicker-3-st input").val()) + "&endDate=" + convertDateFormat($(".my-datepicker-3-ed input").val()) + "&modeview=" + $(".my-mode-view input").val() +"&mathongso=RAIN");
        const data24h = await response.json();

        const responsefc = await fetch('https://node.windy.com/forecast/v2.7/ecmwf/'+lat+'/'+lon);
        const datafc = await responsefc.json();
        let result;

        const dataChart = [];

        let cumulativeTotal = 0;

        data24h.forEach(dayData => {
            const timepoint = dayData.timePoint;
            const stationData = dayData.stations.find(station => station.station_id === stationid); // Assuming only one station per timepoint

            if (stationData) {
                const dailyTotal = parseFloat(stationData.total).toFixed(2); // Format to two decimal places
                cumulativeTotal += parseFloat(dailyTotal);

                dataChart.push({
                    timepoint,
                    [`${stationData.station_name}`]: dailyTotal,
                    [`Mưa tích lũy ${stationData.station_name}`]: cumulativeTotal.toFixed(2) // Format cumulative total to two decimal places
                });
            }
        });
        dataChart.push(...extractData(datafc.data, cumulativeTotal))
        result = { dataChart };

        setLoading(false);
        return result;
    }

    useEffect(() => {
        const fetchData = async () => {

            try {
                const response = await fetch(dataserver);
                const data = await response.json();
                const storedPids = JSON.parse(localStorage.getItem('lpid')) || [];
                if (storedPids.length > 0) {
                    const filteredData = data.filter(station => storedPids.includes(station.pid));
                    setStations(filteredData); 
                    setFilteredStations(filteredData); 
                } else {
                    setStations(data);
                    setFilteredStations(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        
    }, [currentfullDateTime]);
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

    }, [currentfullDateTime]);
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
                    '../public/marker_small.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('small-marker', image);
                    }
                );
                map.current.loadImage(
                    '../public/marker_medium.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('medium-marker', image);
                    }
                );
                map.current.loadImage(
                    '../public/marker_heavy.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('heavy-marker', image);
                    }
                );
                map.current.loadImage(
                    '../public/marker_heavier.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('heavier-marker', image);
                    }
                );
                map.current.loadImage(
                    '../public/marker_empty.png',
                    (error, image) => {
                        if (error) throw error;
                        map.current.addImage('empty-marker', image);
                    }
                );

                const storedPids = JSON.parse(localStorage.getItem('lpid')) || [];

                // Lọc các trạm để chỉ lấy những trạm có pid trong mảng storedPids
                let filteredStations = stationsRef.current.filter(station => 
                    storedPids.includes(station.pid)
                );

                filteredStations = filteredStations.length > 0 ? filteredStations : stationsRef.current;
                
                map.current.addSource('stations', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: filteredStations.map(station => ({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.lon, station.lat]
                            },
                            properties: {
                                sid: station.station_id,
                                name: station.station_name,
                                ngaydo: station.daterain,
                                tongluongmua: station.total,
                                tinh: station.tinh,
                                pid : station.pid
                            }
                        }))
                    }
                });

                map.current.addSource('province', {
                    type: 'vector',
                    tiles: [
                        "http://localhost:8080/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=bgmapvn:bgmap_province&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}"
                    ],
                });
                map.current.addSource('district', {
                    type: 'vector',
                    tiles: [
                        "http://localhost:8080/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=bgmapvn:bgmap_district&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}"
                    ],
                });
                map.current.addSource('commune', {
                    type: 'vector',
                    tiles: [
                        "http://localhost:8080/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=bgmapvn:bgmap_commune&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}"
                    ],
                });
                
                map.current.addLayer({
                    'id': 'province-layer',
                    'type': 'line',
                    'source': 'province',
                    'source-layer': 'bgmap_province',
                    'paint': {
                        'line-color': '#929292',
                        'line-width': 1
                    },
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
                    'minzoom' : 5,
                    'layout': {
                        'text-field': ['get', 'ten_tinh'], 
                        'text-size': 12, 
                        'text-anchor': 'center', 
                        'text-offset': [0, 0.5] ,
                        'icon-allow-overlap': true
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
                        'text-offset': [0, 0.5] ,
                        'icon-allow-overlap': true
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
                    'minzoom': 14,
                    'layout': {
                        'text-field': ['get', 'ten_xa'], 
                        'text-size': 12, 
                        'text-anchor': 'center', 
                        'text-offset': [0, 0.5] ,
                        'icon-allow-overlap': true
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
                        'text-opacity' : 0.5
                    },
                    'maxzoom': 7,
                });            
    

                map.current.addLayer({
                    id: 'norain-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['==', ['get', 'tongluongmua'], 0],  // Lượng mưa = 0
                    ],
                    layout: {
                        'icon-image': 'empty-marker',
                        'icon-allow-overlap': true
                    }
                });
                map.current.addLayer({
                    id: 'smallrain-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['>', ['get', 'tongluongmua'], 0],  // Lượng mưa > 0
                        ['<=', ['get', 'tongluongmua'], 16] // Lượng mưa <= 16
                    ],
                    layout: {
                        'icon-image': 'small-marker', 
                        'icon-allow-overlap': true

                    }
                });
                map.current.addLayer({
                    id: 'mediumrain-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['>', ['get', 'tongluongmua'], 16],
                        ['<=', ['get', 'tongluongmua'], 50]
                    ],
                    layout: {
                        'icon-image': 'medium-marker',
                        'icon-allow-overlap': true
                    }
                });
                map.current.addLayer({
                    id: 'heavyrain-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['all',
                        ['>', ['get', 'tongluongmua'], 50],
                        ['<=', ['get', 'tongluongmua'], 99]
                    ],
                    layout: {
                        'icon-image': 'heavy-marker',
                        'icon-allow-overlap': true
                        
                    }
                });
                map.current.addLayer({
                    id: 'heavierrain-layer',
                    type: 'symbol',
                    source: 'stations',
                    filter: ['>', ['get', 'tongluongmua'], 99],
                    layout: {
                        'icon-image': 'heavier-marker',
                        'icon-allow-overlap': true
                        
                    }
                });

                const popup = new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: true
                });

                // hover vào layer
                map.current.on('mouseenter', 'norain-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table norain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + infor.tongluongmua + " mm </td></tr>" +
                                "<tr><td>Từ: 20:00 " + previousday + " - đến " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'norain-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });

                map.current.on('mouseenter', 'smallrain-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table smallrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.tongluongmua).toFixed(2) + " mm</td></tr>" +
                                "<tr><td>Từ: 20:00 " + previousday + " - đến " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'smallrain-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });


                map.current.on('mouseenter', 'mediumrain-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table mediumrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.tongluongmua).toFixed(2) + " mm</td></tr>" +
                                "<tr><td>Từ: 20:00 " + previousday + " - đến " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'mediumrain-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });

                map.current.on('mouseenter', 'heavyrain-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table heavyrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.tongluongmua).toFixed(2) + " mm</td></tr>" +
                                "<tr><td>Từ: 20:00 " + previousday + " - đến " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'heavyrain-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });


                map.current.on('mouseenter', 'heavierrain-layer', function (e) {
                    map.current.getCanvas().style.cursor = 'pointer';
                    hoverTimeout = setTimeout(function () {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        var infor = e.features[0].properties;
                        popup.setLngLat(coordinates)
                            .setHTML(
                                "<table class='popup-table heavierrain'>" +
                                "<tr><th colspan='2'>Trạm đo : <strong>" + infor.name + "</strong></th></tr>" +
                                "<tr><td><i class='fa-solid fa-circle'></i>" + parseFloat(infor.tongluongmua).toFixed(2) + " mm</td></tr>" +
                                "<tr><td>Từ: 20:00 " + previousday + " đến " + currentDateTime + "</td></tr>" +
                                "</table>"
                            )
                            .addTo(map.current);
                    }, 800);
                });
                map.current.on('mouseleave', 'heavierrain-layer', function () {
                    map.current.getCanvas().style.cursor = '';
                    clearTimeout(hoverTimeout);
                });

                map.current.on('click', 'norain-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);
                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh,e.lngLat.lat, e.lngLat.lng ).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid : infor.sid ,
                        lat : e.lngLat.lat, 
                        lon : e.lngLat.lng 
                    });

                });
                map.current.on('click', 'smallrain-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);

                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid : infor.sid ,
                        lat : e.lngLat.lat, 
                        lon : e.lngLat.lng 
                    });

                });
                map.current.on('click', 'mediumrain-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);
                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid : infor.sid ,
                        lat : e.lngLat.lat, 
                        lon : e.lngLat.lng 
                    });
                });
                map.current.on('click', 'heavyrain-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);
                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid : infor.sid ,
                        lat : e.lngLat.lat, 
                        lon : e.lngLat.lng 
                    });

                });
                map.current.on('click', 'heavierrain-layer', (e) => {
                    var infor = e.features[0].properties;
                    setSelectedStation(infor.sid);
                    viewllstation(e.lngLat.lat, e.lngLat.lng);
                    setShowChart(true);
                    prepareChartData(infor.sid, infor.tinh,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    settinhfdata(infor.tinh);
                    setfdata({
                        sid : infor.sid ,
                        lat : e.lngLat.lat, 
                        lon : e.lngLat.lng 
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

    const toggleSearchInput = () => {
        setSearchVisible(!searchVisible);
        document.getElementById('formse').focus();
    };

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
            prepareChartData(temp.station_id, tinhdata, temp.lat, temp.lon).then(response => {
                setDataChart(response.dataChart);
            });
            viewllstation(temp.lat, temp.lon);
        }
    }, [ selectedStation]);

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
    const handleItemClick = (nameprovine) => {
        const encodedProvinceName = slug(nameprovine , { lower: true });
        navigate(`/overview/${encodedProvinceName}`);
    };

    const handleChangemode = (event) => {
        setselectmodeview(event.target.value);
    };

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
        }
        else{
            return [];
        }
        
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
                        <div style={{ marginLeft: 'auto', fontSize:'18px' }}>Tỉnh : {tinhdata}</div>
                    </div>

                    {!loading && (
                        <BarChartComponent dataChart={dataChart} chartHeight="85%" opview={selectmodeview} />
                    )}

                </div>
            </div>
            <div className="login-container">
                <Login ishome={true} />
            </div>
            <div className="liststation click-view-provine">
                <h2>Danh sách các trạm theo tỉnh</h2>
                <div className="seach-provine">
                    <div className="search-header">
                        <h3 style={{ display: searchVisible ? 'none' : 'block' }}>Lưu lượng mưa từ 20:00 {previousday} đến {currentDateTime}</h3>
                        <input className={`form-control ${searchVisible ? 'active' : ''}`} type="search" id="formse" autoFocus autoComplete="off" placeholder="Tìm kiếm tỉnh ..."
                        onChange={(e) => {
                        const searchValue = e.target.value.toLowerCase();
                        const filtered = stations.filter(station =>
                            station.tinh.toLowerCase().includes(searchValue)
                        );
                        setFilteredStations(filtered);
                            }}
                        style={{ display: searchVisible ? 'block' : 'none' }}
                        ref={searchInputRef}
                        />
                        <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true" onClick={toggleSearchInput} style={{ display: searchVisible ? 'none' : 'block' }}></i>
                    </div>
                </div>
                <div className="listraininfo">
                    <ul>
                        {filteredStations.map((station, index) => (
                            <li key={index} value={station.order_province} onClick={() => handleItemClick(station.tinh)}>
                            <div className="list-line-1"><p className="station-tinh">{station.tinh}</p><div className="station-rain" dangerouslySetInnerHTML={{ __html: Gettextrain(station.total) }}></div></div>
                            <div className="list-line-2"><p className="station-name">Tại : {station.station_name}</p><div className="type-rain" dangerouslySetInnerHTML={{ __html: Typerain(station.total) }}></div></div>
                        </li>
                    ))}
                    </ul>
                </div>
            </div>
            <div ref={mapContainer} style={{ width: '100%', top: '0', bottom: '0', position: 'absolute' }} />
        </div>
    );
};

export default MapComponent;

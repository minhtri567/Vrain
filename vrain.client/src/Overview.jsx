/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useRef, useEffect, useMemo , useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getNameProvince } from './NameProvine';
import BarChartComponent from './BarChartComponent';
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
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import Login from './Login';
import $ from 'jquery';

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
        return "<p class='text-norain'>" + parseFloat(raintotal).toFixed(1) + "mm</p>";
    }
    if (raintotal > 0 && raintotal <= 16) {
        return "<p class='text-small'>" + parseFloat(raintotal).toFixed(1) + "mm</p>";
    }
    if (raintotal > 16 && raintotal <= 50) {
        return "<p class='text-medium'>" + parseFloat(raintotal).toFixed(1) + "mm</p>";
    }
    if (raintotal > 50 && raintotal <= 99) {
        return "<p class='text-heavy'>" + parseFloat(raintotal).toFixed(1) + "mm</p>";
    }
    if (raintotal > 99) {
        return "<p class='text-heavier'>" + parseFloat(raintotal).toFixed(1) + "mm</p>";
    }
}

const Overview = () => {
    const pathname = window.location.pathname;
    const name_province = pathname.substring(pathname.lastIndexOf('/') + 1);
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
    const [tinhid, settinhid] = useState();
    const today = dayjs();
    const [selectedStation, setSelectedStation] = useState('');
    const [selectmodeview, setselectmodeview] = useState(2);
    const sevenDaysAgo = today.subtract(7, 'day');
    var curentapitinh = "/api/WeatherStations?provincename=" + encodeURIComponent(name_province) + "";
    var apiraintime = "/api/WeatherStations/raintoday?provincename=" + encodeURIComponent(name_province) + "";
    var hoverTimeout;

    const [selectedStationId, setSelectedStationId] = useState(null);
    var now = new Date();
    var currentDateTime = now.toLocaleString('vi-VN', {
        hour: 'numeric',
        minute: 'numeric',
        day: '2-digit',
        month: '2-digit'
    });
    var previousDay = new Date(now);
    previousDay.setDate(now.getDate() - 1);
    var previousday = previousDay.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
    });

    useEffect(() => {
        const fetchDataProvine = async () => {
            try {
                const response = await fetch(curentapitinh);

                const data = await response.json();
                setStations(data);
                setFilteredStations(data);
                stationsRef.current = data;
                settinhid(data[0].tinh_id)
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchDataProvine();
    }, [name_province]);

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
    const [datafecthchart, setdatafecthchart] = useState([]);
    const extractData = (data) => {
        
        if(selectmodeview == 1){
            const { day, hour, mm } = data;
            if (day.length === hour.length && hour.length === mm.length) {
                const result = day.map((date, index) => {
                    const formattedDate = new Date(date).toLocaleDateString('en-GB').slice(0, 5);
                    const formattedTime = `${hour[index].toString().padStart(2, '0')}:00`; 
        
                    return {
                        timepoint: `${formattedDate} ${formattedTime}`,
                        'Dự báo mưa': mm[index]
                    };
                });
                return result.slice(2);
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
    
            const result = Object.keys(rainByDay).map(date => ({
                timepoint: date,
                'Dự báo mưa': rainByDay[date].toFixed(2) 
            }));
    
            return result.slice(2);
        }
        else{
            return [];
        }
        
    };
    const prepareChartData = async (stationid , lat , lon) => {
        setLoading(true);
        const response = await fetch(apiraintime + "&startDate=" + convertDateFormat($(".my-datepicker-3-st input").val()) + "&endDate=" + convertDateFormat($(".my-datepicker-3-ed input").val()) + "&modeview=" + $(".my-mode-view input").val());
        const data24h = await response.json();
        setdatafecthchart(data24h)

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
        dataChart.push(...extractData(datafc.data))
        result = { dataChart };

        setLoading(false);
        return result;
    }

    useEffect(() => {
            const dataChart = [];

            let cumulativeTotal = 0;

            datafecthchart.forEach(dayData => {
                const timepoint = dayData.timePoint;
                const stationData = dayData.stations.find(station => station.station_id === selectedStationId);
                
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

            setDataChart(dataChart);
    }, [selectedStationId]);

    useEffect(() => {
        if (stationsRef.current.length > 0) {
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
                                name: station.station_name,
                                ngaydo: station.daterain,
                                tongluongmua: station.total,
                                sid: station.station_id,
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
                        'line-color': '#ff6b6a',
                        'line-width': 1
                    },
                    'filter': ['==', ['get', 'ten_tinh'], getNameProvince(name_province)],
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
                    'filter': ['==', ['get', 'tinh_id'], tinhid],
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
                    'filter': ['==', ['get', 'tinh_id'], tinhid],
                    'minzoom': 10
                });

                map.current.addLayer({
                    'id': 'province-label-layer',
                    'type': 'symbol',
                    'source': 'province',
                    'source-layer': 'bgmap_province', 
                    'filter': ['==', ['get', 'ten_tinh'], getNameProvince(name_province)],
                    'maxzoom': 7,
                    'minzoom' : 5,
                    'layout': {
                        'text-field': ['get', 'ten_tinh'], 
                        'text-size': 12, 
                        'text-anchor': 'center', 
                        'text-offset': [0, 0.5] ,
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
                    'filter': ['==', ['get', 'tinh_id'], tinhid],
                    'minzoom': 7,
                    'maxzoom': 10,
                    'layout': {
                        'text-field': ['get', 'ten_huyen'], 
                        'text-size': 12, 
                        'text-anchor': 'center', 
                        'text-offset': [0, 0.5] ,
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
                    'filter': ['==', ['get', 'tinh_id'], tinhid],
                    'minzoom': 12,
                    'layout': {
                        'text-field': ['get', 'ten_xa'], 
                        'text-size': 12, 
                        'text-anchor': 'center', 
                        'text-offset': [0, 0.5] ,
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
                        'icon-image':'heavier-marker', 
                        'icon-allow-overlap': true,
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
                    prepareChartData(infor.sid,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
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
                    prepareChartData(infor.sid,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
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
                    prepareChartData(infor.sid,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
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
                    prepareChartData(infor.sid,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
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
                    prepareChartData(infor.sid,e.lngLat.lat, e.lngLat.lng).then(response => {
                        setDataChart(response.dataChart);
                    });
                    setfdata({
                        sid : infor.sid ,
                        lat : e.lngLat.lat, 
                        lon : e.lngLat.lng 
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
    const [uniqueStationIds, setUniqueStationIds] = useState(new Set());

    useEffect(() => {
        // Lọc danh sách các station_id duy nhất từ stationsRef.current
        const uniqueIds = new Set();
        stationsRef.current.filter(station => {
            if (!uniqueIds.has(station.station_id)) {
                uniqueIds.add(station.station_id);
                return true;
            }
            return false;
        });

        setUniqueStationIds(uniqueIds);
    }, [stationsRef.current]);
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
        navigate(`/`);
    };
    const handleVdetail = () => {
        navigate(`/detail/${name_province}`);
    }
    const handleRdetail = () => {
        navigate(`/report/${name_province}`);
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
        prepareChartData(fdata.sid , fdata.lat , fdata.lon).then(response => {
            setDataChart(response.dataChart);
        });
    };
    const handleChangeStation = (event) => {
        setSelectedStationId(event.target.value === 'all' ? null : event.target.value);
        setSelectedStation(event.target.value)
    };
    useEffect(() => {
        if (stationsRef.current.find(station => station.station_id === selectedStationId) != undefined) {
            const temp = stationsRef.current.find(station => station.station_id === selectedStationId)
            prepareChartData(temp.station_id)
            viewllstation(temp.lat, temp.lon);
        }
    }, [selectedStationId]);

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

    const handleStationClick = (lat, lon, stationId) => {
        if (isMobile) {
            $('.containt-view-mapbox').css('display', 'block');
            $('.liststation').css('display', 'none');
            map.current.resize();
            viewllstation(lat, lon);
        } else {
            // Xử lý cho desktop
            viewllstation(lat, lon);
            highlightBlinking(map.current, lon , lat);
        }
    };
    const exitviewmap= () => {
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
                            <FormControl sx={{ m: 1, minWidth: 120 }} size="small"  >
                                <InputLabel id="sl_stations">Trạm hiển thị</InputLabel>
                                <Select
                                    labelId="sl_stations"
                                    id="sl_stations-select"
                                    value={selectedStation}
                                    label="Trạm hiển thị"
                                    onChange={handleChangeStation}
                                >
                                    {uniqueStationIds.size > 0 && (
                                        Array.from(uniqueStationIds).map(stationId => (
                                            <MenuItem value={stationId} key={stationId} name={stationId}>
                                                {/* Tìm tên của station dựa vào station_id */}
                                                {stationsRef.current.find(station => station.station_id === stationId)?.station_name}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
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
                        <BarChartComponent dataChart={dataChart} chartHeight={isMobile ? '65%' : '85%'} opview={selectmodeview}/>
                    )}
                    
                </div>
            </div>
            <div className="vnrain-toolbar">
                <div className="header-title">
                    <div className="name-view">
                        <img src="../src/assets/react.svg" onClick={() => handleItemClick()} style={{ cursor: 'pointer' }}></img>
                        <span className="header-name">{getNameProvince(name_province)}</span>
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
                            <h3 style={{ display: searchVisible ? 'none' : 'block' }}>Lưu lượng tại các trạm đo từ 20:00 {previousday} đến {currentDateTime}</h3>
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
                                <li key={index} onClick={() => handleStationClick(station.lat, station.lon, station.station_id)} >
                                    <div className="list-line-1"><p className="station-tinh">{station.station_name}</p><div className="station-rain" dangerouslySetInnerHTML={{ __html: Gettextrain(station.total) }}></div></div>
                                    <div className="list-line-2"><p className="station-name">Tại : {station.phuongxa} - {station.quanhuyen}</p><div className="type-rain" dangerouslySetInnerHTML={{ __html: Typerain(station.total) }}></div></div>
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

export default Overview;

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';

const MapLayerPanel = ({ layers, mapRef }) => {
    const [visible, setVisible] = useState(false);
    const [sourceVisibility, setSourceVisibility] = useState({});

    useEffect(() => {
        if (layers && layers.length > 0) {
            // Khởi tạo trạng thái hiển thị cho các sources nếu chưa có
            const initialVisibility = {};
            layers.forEach(layer => {
                initialVisibility[layer.sourceName] = true; // Mặc định là hiển thị
            });
            setSourceVisibility(initialVisibility);
        }
    }, [layers]);

    const toggleLayer = (sourceName) => {
        const isVisible = !sourceVisibility[sourceName];
        setSourceVisibility(prevState => ({
            ...prevState,
            [sourceName]: isVisible,
        }));

        const sourceData = layers.find(source => source.sourceName === sourceName);
        if (isVisible) {
            // Thêm source và layer nếu hiển thị
            addSourceAndLayers(sourceName, {
                type: 'vector',
                tiles: JSON.parse(sourceData.tiles),
                bounds: JSON.parse(sourceData.bounds),
            }, sourceData.children);
        } else {
            // Xóa source và layer nếu không hiển thị
            removeSourceAndLayers(sourceName);
        }
    };

    const removeSourceAndLayers = (sourceName) => {
        
        if (mapRef.current && mapRef.current.getSource(sourceName)) {
            // Lấy tất cả các layer liên kết với source
            const mapLayers = mapRef.current.getStyle().layers;
            mapLayers.forEach((layer) => {
                if (layer.source == sourceName) {
                    mapRef.current.removeLayer(layer.id); // Xóa layer
                }
            });
            mapRef.current.removeSource(sourceName); // Xóa source
        }
    };

    const addSourceAndLayers = (sourceName, sourceData, layers) => {
        if (mapRef.current && !mapRef.current.getSource(sourceName)) {
            mapRef.current.addSource(sourceName, sourceData);

            layers.forEach((layer) => {
                mapRef.current.addLayer({
                    'id': layer.key,
                    'type': layer.layerType,
                    'source': sourceName,
                    'source-layer': layer.sourceLayer,
                    'paint': JSON.parse(layer.paint),
                    'layout': JSON.parse(layer.layout),
                    'minzoom': layer.minZoom !== null ? layer.minZoom : 0,
                    'maxzoom': layer.maxZoom !== null ? layer.maxZoom : 18,
                });
            });
        }
    };

    const customHeader = (
        <div className="flex align-items-center gap-2">
            <span style={{ fontSize : '26px' }}>Lớp bản đồ</span>
        </div>
    );

    return (
        <div className="map-layer-panel">
            <Sidebar visible={visible} position="right" onHide={() => setVisible(false)} header={customHeader}>
                <ul className="lbandonen">
                    {layers.map(layer => (
                        <li key={layer.sourceName} className="form-check">
                            <label>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={sourceVisibility[layer.sourceName] || false}
                                    onChange={() => toggleLayer(layer.sourceName)}
                                />
                                <span>{layer.label}</span> 
                            </label>
                        </li>
                    ))}
                </ul>
            </Sidebar>
            <Button onClick={() => setVisible(true)} > <i className="fa-solid fa-layer-group"></i></Button>
        </div>
    );
};

export default MapLayerPanel;

// src/components/SwaggerUIComponent.js
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import axios from 'axios';

const SwaggerUIComponent = () => {
    const [swaggerSpec, setSwaggerSpec] = useState(null);

    useEffect(() => {
        const fetchSwaggerSpec = async () => {
            try {
                const response = await axios.get('/swagger/v1/swagger.json');
                const data = response.data;
                // Lọc Swagger JSON để chỉ giữ API cần thiết
                const filteredSpec = {
                    ...data,
                    components: {
                        ...data.components,
                        schemas: {
                            dataweathersinsert: data.components.schemas.dataweathersinsert
                        }
                    },
                    paths: {
                        '/vnrain/Admin/insertdatamonitoring': data.paths['/vnrain/Admin/insertdatamonitoring']
                    },
                };
                setSwaggerSpec(filteredSpec);
            } catch (error) {
                console.error('Error fetching Swagger spec:', error);
            }
        };
        fetchSwaggerSpec();
    },[]);

    return (
        <div style={{ height: '100vh' }}>
            {swaggerSpec ? (
                <SwaggerUI spec={swaggerSpec} />
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default SwaggerUIComponent;

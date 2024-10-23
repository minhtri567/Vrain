/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapComponent from './MapComponent';
import MapMucnuoc from './Mapmucnuoc';
import MNOverview from './MNOverview';
import MNDetailview from './MNDetailview';
import Overview from './Overview';
import Detailview from './Detailview';
import Reportview from './Reportview';
import Admin from './Admin';
import ProtectedRoute from './ProtectedRoute';
import SwaggerUIComponent from './AdminView/SwaggerUIComponent'

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MapComponent />} />
                <Route path="/overview/:name_province" element={<Overview />} />
                <Route path="/detail/:name_province" element={<Detailview />} />
                <Route path="/report/:name_province" element={<Reportview />} />
                <Route path="/mucnuoc" element={<MapMucnuoc />} />
                <Route path="/mucnuoc/overview/:name_luuvuc" element={<MNOverview />} />
                <Route path="/mucnuoc/detail/:name_luuvuc" element={<MNDetailview />} />
                <Route
                    path="/quantri/index"
                    element={
                        <ProtectedRoute >
                            <Admin />
                        </ProtectedRoute>
                    }
                />
                <Route 
                    path="/swagger/insertdata" 
                    element={
                        <ProtectedRoute >
                            <SwaggerUIComponent />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
};

export default App;
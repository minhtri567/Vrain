/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
const ProtectedRoute = ({ children }) => {
    const [isLogin, setIsLogin] = useState(null);
    useEffect(() => {
        const userName = localStorage.getItem('user_name');
        if (userName && userName !== "") {
            setIsLogin(true);
        } else {
            setIsLogin(false);
        }
    }, []);

    if (isLogin != null && isLogin == false) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;

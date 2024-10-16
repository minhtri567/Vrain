/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
const Pannellayer = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const Linkrain = () => {
        navigate(`/`);
    };

    const Linkwater = () => {
        navigate(`/mucnuoc`);
    };

    const isRainPage = location.pathname === '/';
    const isWaterPage = location.pathname === '/mucnuoc';

    return (
        <div className="open-layer">
            <div className="container-link-layer">
                <button title="Xem lớp đồ mưa" className={isRainPage ? 'active' : ''} onClick={Linkrain}><i className="fa-solid fa-cloud-rain"></i></button>
                <button title="Xem lớp đồ mực nước" className={isWaterPage ? 'active' : ''} onClick={Linkwater}><i className="fa-solid fa-water"></i></button>
            </div>
        </div>
    )
};

export default Pannellayer;

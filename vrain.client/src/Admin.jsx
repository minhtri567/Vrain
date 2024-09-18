/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import Login from './Login';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import './StyleAdmin.css'

import axios from 'axios';
import AdminViewMenu from './AdminView/AdminViewMenu';
import AdminOverview from './AdminView/AdminOverview';
import AdminViewStations from './AdminView/AdminViewStations';
import AdminViewReport from './AdminView/AdminViewReport';
import AdminViewDanhmuc from './AdminView/AdminViewDanhmuc';
import AdminViewCoquan from './AdminView/AdminViewCoquan';
import AdminViewNguoidung from './AdminView/AdminViewNguoidung';

const Admin = () => {
    const navigate = useNavigate();
    const [visibleRight, setVisibleRight] = useState(false);
    const [menu, setMenu] = useState([]);
    const [expandedItems, setExpandedItems] = useState({});
    const [currentView, setCurrentView] = useState('AdminOverview');
    const menuRef = useRef(null); // Ref for the menu container
    const apimenu = 'https://localhost:7299/api/Admin/menu';
    
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

    const customHeader = (
        <div>
            <Login ishome={false} />
        </div>
    );

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const response = await axios.get(apimenu);
                setMenu(response.data[0].children);
            } catch (error) {
                console.error('Error fetching menu', error);
            }
        };

        fetchMenu();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                // Collapse all items if the click is outside the menu
                setExpandedItems({});
            }
        };

        // Add event listener on component mount
        document.addEventListener('mousedown', handleClickOutside);

        // Remove event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleExpand = (id) => {
        setExpandedItems((prevState) => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };

    const viewComponents = {
        AdminViewMenu: AdminViewMenu,
        AdminOverview: AdminOverview,
        AdminViewStations: AdminViewStations,
        AdminViewReport: AdminViewReport,
        AdminViewDanhmuc: AdminViewDanhmuc,
        AdminViewCoquan: AdminViewCoquan,
        AdminViewNguoidung: AdminViewNguoidung,
        // Add more mappings here as needed
    };

    const renderView = (view) => {
        const ViewComponent = viewComponents[view] || AdminOverview;
        return <ViewComponent />;
    };

    const handleMenuItemClick = (url) => {
        setExpandedItems({});
        setCurrentView(url);
        if(isMobile == true ){
            setVisibleRight(false);
        }
    };

    const renderMenu = (items) => (
        <ul>
            {items.map(item => (
                <li key={item.key} className={currentView === item.url ? 'active' : ''}>
                    <div onClick={() => toggleExpand(item.key)} className="menu-item">
                        <a href="#"
                            onClick={(e) => { e.preventDefault(); item.url ? handleMenuItemClick(item.url) : "" }}>
                            {item.label}
                        </a>
                    </div>
                    {item.children && item.children.length > 0 && (
                        <ul className={expandedItems[item.key] ? 'expanded' : 'collapsed'}>
                            {renderMenu(item.children)}
                        </ul>
                    )}
                </li>
            ))}
        </ul>

    );

    return (
        <div className="admin-page" >
            <div className="vnrain-toolbar">
                <div className="header-title">
                    <div className="name-view">
                        <img src="../src/assets/react.svg" onClick={() => navigate(`/`)} style={{ cursor: 'pointer' }}></img>
                        <span> Vnrain</span>
                    </div>
                </div>
                <div>
                    <Login ishome={false} />
                </div>
                <div className="side-bar-menu">
                    <Button icon="pi pi-bars" onClick={() => setVisibleRight(true)} />
                </div>
                <Sidebar className="vnrain-toolbar-sidebar" header={customHeader} visible={visibleRight} position="right" onHide={() => setVisibleRight(false)}>
                    {isMobile && (
                        <div className='admin-page'>
                            <nav className="menu-hierarchy" ref={menuRef}>
                                {renderMenu(menu)}
                            </nav>
                        </div>
                    )}
                </Sidebar>
            </div>
            <div>
                {!isMobile && (
                <nav className="menu-hierarchy" ref={menuRef}>
                    {renderMenu(menu)}
                </nav>
                )}
                <div className="view-container">
                    {renderView(currentView)}
                </div>
            </div>
        </div>
    );
};

export default Admin;
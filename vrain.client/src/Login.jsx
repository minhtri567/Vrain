/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { Close, CheckCircle } from '@mui/icons-material';

import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { jwtDecode } from 'jwt-decode';
import $ from 'jquery';

const Login = (ishome) => {
    var apilogin = "https://localhost:7299/api/Account/login";
    var apichangepw = "https://localhost:7299/api/Account/changepassword";
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [newpassword, setnewPassword] = useState('');
    const [open, setOpen] = React.useState(false);
    const [opencp, setOpencp] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const [showPasswordold, setShowPasswordold] = React.useState(false);
    const handleClickShowPasswordold = () => setShowPasswordold((show) => !show);
    const [showPasswordnew, setShowPasswordnew] = React.useState(false);
    const handleClickShowPasswordnew = () => setShowPasswordnew((show) => !show);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVariant, setSnackbarVariant] = useState('success');
    const [isuser, setIsuser] = useState(false);
    const [userif, setUserif] = useState(false);
    const [viewlogin, setViewlogin] = useState(0);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    const handleMouseDownPasswordold = (event) => {
        event.preventDefault();
    };
    const handleMouseDownPasswordnew = (event) => {
        event.preventDefault();
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleClosecp = () => {
        setOpencp(false);
    };
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const handleLogin = async () => {
        const data = {
            mem_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            mem_username: username,
            mem_password: password,
            mem_hoten: "",
            mem_cq_id: 0,
            mem_email: "",
            mem_mobile: "",
            mem_active: true,
            mem_stt: 0,
            mem_role: "",
            mem_numofdaydisplay: 0,
            mem_hourdisplay: "",
            scada_role: "",
            mem_minutedisplay: ""
        };
            axios.post(apilogin, data)
            .then(response => {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user_name', response.data.token.mem_hoten);
            localStorage.setItem('email', response.data.token.email);
            localStorage.setItem('permission_stations', response.data.token.mem_cq_id);
            localStorage.setItem('role', response.data.token.mem_role);
            localStorage.setItem('jwtToken', response.data.role);
            isAuthenticated();
            setAnchorEl(null);
            setSnackbarMessage('Đăng nhập thành công');
            setSnackbarVariant('success');
            setSnackbarOpen(true);
            setOpen(false);
            setIsuser(true);
            })
            .catch(error => {
            setSnackbarMessage('Tài khoản không chính xác');
            setSnackbarVariant('error');
            setSnackbarOpen(true);
            });
    };
    useEffect(() => {
        isAuthenticated();
    }, [ishome]);

    const handlechangepasswword = async () => {
        const data = {
            user_login: username,
            current_password: password,
            new_password: newpassword,
        };
        
        try {
            const response = await axios.post(apichangepw, data);
            if (response.status === 200) {
                setSnackbarMessage('Thay đổi mật khẩu thành công');
                setSnackbarVariant('success');
            }
        } catch (error) {
            // Check if the error response is available
            if (error.response && error.response.data) {
                setSnackbarMessage(error.response.data);
            } else {
                setSnackbarMessage('An unexpected error occurred');
            }
            setSnackbarVariant('error');
            setSnackbarOpen(true);
        }
        
    };

    const isAuthenticated = () => {
        const token = localStorage.getItem('token');
        const user_name = localStorage.getItem('user_name');
        const email = localStorage.getItem('email');
        const permission_stations = localStorage.getItem('permission_stations');
        const role = localStorage.getItem('role');
        const jwttoken = localStorage.getItem('jwtToken');
        if (token != null) {
            // Giải mã token để lấy thông tin
            const decodedToken = jwtDecode(jwttoken);

            // Lấy thời gian hiện tại và thời gian hết hạn của token
            const currentTime = Date.now() / 1000; // Đổi sang giây
            const tokenExpiryTime = decodedToken.exp;

            // Kiểm tra xem token có hết hạn chưa
            if (tokenExpiryTime < currentTime) {
                localStorage.removeItem('token');
                localStorage.removeItem('user_name');
                localStorage.removeItem('email');
                localStorage.removeItem('permission_stations');
                localStorage.removeItem('role');
                localStorage.removeItem('jwtToken');
                setIsuser(false);
                return false;
            }

            setUserif({ user_name, email, permission_stations, role });
            setIsuser(true);
            return true;
        } else {
            setIsuser(false);
            return false;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('email');
        localStorage.removeItem('permission_stations');
        localStorage.removeItem('role');
        localStorage.removeItem('jwtToken');
        setIsuser(false);
        setUserif(null);
        setViewlogin(0);
        navigate(`/`);
    };
    useEffect(() => {
        if (ishome.ishome == true) {
            if (isuser == true) {
                setViewlogin(2);
            } else {
                setViewlogin(0);
            }
        } else {
            if (isuser == true) {
                setViewlogin(1);
            } else {
                setViewlogin(0);
            }
        }
    }, [isuser, userif, ishome.ishome]);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const handleClickpop = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClosepop = () => {
        setAnchorEl(null);
    };
    const handleQTClick = () => {
        navigate(`/quantri/index`);
    };
    const openpop = Boolean(anchorEl);
    const idpop = open ? 'simple-popover' : undefined;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin(); 
        }
    };

    return (
        <div className="view-login">
            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
            >
                <SnackbarContent
                    style={{ backgroundColor: snackbarVariant === 'success' ? '#4caf50' : '#f44336', zIndex: 99999 }}
                    message={
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            {snackbarVariant === 'success' ? <CheckCircle /> : null}
                            <span style={{ marginLeft: '10px' }}>{snackbarMessage}</span>
                        </span>
                    }
                />
            </Snackbar>
            {viewlogin == 2 && (
                <div className="view-dangxuat">
                    <Button variant="outlined" onClick={handleLogout}>
                        đăng xuất
                    </Button>
                    <i className="fa-solid fa-gear" title="Trang quản trị" onClick={handleQTClick}></i>
                </div>
            )}
            {viewlogin == 1 && (
                <div className="user-native">
                    <button onClick={handleClickpop} style={{ display: 'flex', alignItems: 'center', paddingRight : '13px' }}>
                        <ExpandMoreIcon />
                        {userif.user_name}
                    </button>
                    <Popover
                        id={idpop}
                        open={openpop}
                        anchorEl={anchorEl}
                        onClose={handleClosepop}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <Typography className="button-nagative-user" sx={{ p: 2 }} onClick={() => { setOpencp(true), setAnchorEl(null); }}>Đổi mật khẩu</Typography>
                        <Typography className="button-nagative-user" sx={{ p: 2 }} onClick={handleQTClick}> Trang quản trị </Typography>
                        <Typography className="button-nagative-user" sx={{ p: 2 }} onClick={handleLogout}>Đăng xuất</Typography>
                    </Popover>
                </div>
            )}
            {viewlogin == 0 && (
                <Button variant="outlined" onClick={handleClickOpen}>
                    Đăng nhập
                </Button>
            )}
            
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Login"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ padding : '10px 0px 0px 0px'}}>
                    <TextField
                        label="Tên đăng nhập"
                        id="outlined-size-small"
                        defaultValue=""
                        size="small"
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%'}}
                    />
                    <FormControl variant="outlined" onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', margin:'10px 0px 0px 0px ' }}>
                        <InputLabel htmlFor="outlined-adornment-password" size="small">Password</InputLabel>
                        <OutlinedInput
                            size="small"
                            id="outlined-adornment-password"
                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="Password"
                            onKeyDown={(e) => handleKeyDown(e)}
                        />
                    </FormControl>
                </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Hủy</Button>
                    <Button onClick={handleLogin} autoFocus>
                        Đăng nhập
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={opencp}
                onClose={handleClosecp}
            >
                <DialogTitle id="">
                    {"Thay đổi mật khẩu"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ padding: '10px 0px 0px 0px' }}>
                        <TextField
                            label="Tên đăng nhập"
                            id="uselogin-tf"
                            defaultValue={localStorage.getItem('user_name')}
                            size="small"
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%' }}
                            disabled
                        />
                        <FormControl variant="outlined" onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', margin: '10px 0px 0px 0px ' }}>
                            <InputLabel htmlFor="old-password" size="small">Mật khẩu cũ</InputLabel>
                            <OutlinedInput
                                size="small"
                                id="old-password"
                                type={showPasswordold ? 'text' : 'password'}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPasswordold}
                                            onMouseDown={handleMouseDownPasswordold}
                                            edge="end"
                                        >
                                            {showPasswordold ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="Mật khẩu cũ"
                            />
                        </FormControl>
                        <FormControl variant="outlined" onChange={(e) => setnewPassword(e.target.value)} style={{ width: '100%', margin: '10px 0px 0px 0px ' }}>
                            <InputLabel htmlFor="new-password" size="small">Mật khẩu mới</InputLabel>
                            <OutlinedInput
                                size="small"
                                id="new-password"
                                type={showPasswordnew ? 'text' : 'password'}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPasswordnew}
                                            onMouseDown={handleMouseDownPasswordnew}
                                            edge="end"
                                        >
                                            {showPasswordnew ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="Mật khẩu mới"
                            />
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpencp(false) }>Hủy</Button>
                    <Button onClick={handlechangepasswword} autoFocus>
                        Thay đổi
                    </Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default Login;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vrain.Server.Models;
using DocumentFormat.OpenXml.Spreadsheet;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using System.Xml.Linq;
using DocumentFormat.OpenXml;
using OfficeOpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Vml.Spreadsheet;

namespace Vrain.Server.Controllers
{
    [Route("vnrain/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly WeatherDbContext _context;

        public AdminController(WeatherDbContext context)
        {
            _context = context;
        }

        [HttpGet("menu")]
        public async Task<IActionResult> GetMenu()
        {
            var functions = await _context.sys_function
                .OrderBy(s => s.fn_level)
                .ToListAsync();

            var menuItems = functions.OrderBy(f => f.fn_thutu).Select(f => new MenuItem
            {
                key = f.fn_id,
                ParentId = f.fn_pid,
                label = f.fn_ten,
                Level = f.fn_level,
                Thutu = f.fn_thutu,
                Url = f.fn_url
            }).ToList();

            var menu = BuildMenu(menuItems, null);
            return Ok(menu);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("savemenu")]
        public async Task<IActionResult> SaveMenu( int sysid ,  string systenmenu , int? sysmenucha , int systhutu , string? sysview)
        {
            try
            {
                if (sysid == 0)
                {
                    var mncha = await _context.sys_function.SingleOrDefaultAsync(s => s.fn_id == sysmenucha);
                   
                    var trungthutu = await _context.sys_function.Where(s => s.fn_pid == sysmenucha && s.fn_thutu >= systhutu).ToListAsync();

                    foreach( var a in trungthutu)
                    {
                        a.fn_thutu += 1;
                        _context.sys_function.Update(a);
                        await _context.SaveChangesAsync();
                    }

                    var function = new sys_function
                    {
                        fn_pid = sysmenucha,
                        fn_thutu = systhutu,
                        fn_ten = systenmenu,
                        fn_url = sysview ,
                        fn_level = mncha.fn_level + 1,
                        fn_type = 1 ,
                        fn_active = 1 ,
                        fn_uuid = Guid.NewGuid(),
                    };
                    
                    _context.sys_function.Add(function);
                    await _context.SaveChangesAsync();
                    
                    return Ok(function);
                }
                else
                {
                    var function = await _context.sys_function.SingleOrDefaultAsync(s => s.fn_id == sysid);


                    if (function == null)
                    {
                        return NotFound("Function not found");
                    }

                    function.fn_pid = sysmenucha;
                    function.fn_thutu = systhutu;
                    function.fn_ten = systenmenu;
                    function.fn_url = sysview;
                    
                    _context.sys_function.Update(function);
                    await _context.SaveChangesAsync();
                    
                    return Ok(function);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deletemenu/{id}")]
        public async Task<IActionResult> DeleteMenu(int id)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Find the function to delete
                    var function = await _context.sys_function.SingleOrDefaultAsync(s => s.fn_id == id);

                    var trungthutu = await _context.sys_function.Where(s => s.fn_pid == function.fn_pid && s.fn_thutu >= function.fn_thutu).ToListAsync();
                    foreach (var item in trungthutu)
                    {
                        item.fn_thutu -= 1;
                        _context.sys_function.Update(item);
                    }

                    var menucon = await _context.sys_function.Where(s => s.fn_pid == id).ToListAsync();
                    foreach (var item in menucon)
                    {
                        _context.sys_function.Remove(item);
                    }


                    if (function == null)
                    {
                        return NotFound("Function not found");
                    }

                    // Remove the function
                    _context.sys_function.Remove(function);

                    // Save changes
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok($"Function with ID {id} deleted successfully");
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, $"Internal server error: {ex.Message}");
                }
            }
        }
        private List<MenuItem> BuildMenu(List<MenuItem> menuItems, int? parentId)
        {
            return menuItems
                .Where(mi => mi.ParentId == parentId)
                .Select(mi => new MenuItem
                {
                    key = mi.key,
                    ParentId = mi.ParentId,
                    label = mi.label,
                    Level = mi.Level,
                    Thutu = mi.Thutu,
                    Url = mi.Url,
                    Children = BuildMenu(menuItems, mi.key)
                })
                .ToList();
        }

        [HttpGet("infostations")]
        public async Task<ActionResult<IEnumerable<monitoring_stations>>> GetallStations([FromQuery] List<int> pid)
        {
            if(pid != null && pid.Any())
            {
                var stations = await _context.monitoring_stations.Where(s => pid.Contains(s.order_province)).ToListAsync();

                return Ok(stations);
            }
            else
            {
                var stations = await (
                    from station in _context.monitoring_stations
                    join thongso in _context.iw_thongsoquantrac
                        on station.key equals thongso.works_id
                    select new
                    {
                        station.key,
                        station.station_id,
                        station.station_name,
                        station.tinh,
                        station.quanhuyen,
                        station.phuongxa,
                        station.order_province,
                        station.infor_data,
                        station.lat,
                        station.lon,
                        thongso.tskt_maloaithongso,
                    }
                ).ToListAsync();

                return Ok(stations);
            }
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("savestations")]
        public async Task<IActionResult> SaveChangesStations([FromBody] monitoring_stations model)
        {
            if (model == null)
            {
                return BadRequest("Invalid data.");
            }

            if (model.key != Guid.Empty)
            {
                // Save changes (update existing record)
                var existingStation = await _context.monitoring_stations.FindAsync(model.key , model.station_id);
                if (existingStation != null)
                {
                    existingStation.station_id = model.station_id;
                    existingStation.station_name = model.station_name;
                    existingStation.tinh = model.tinh;
                    existingStation.phuongxa = model.phuongxa;
                    existingStation.quanhuyen = model.quanhuyen;
                    existingStation.order_province = model.order_province;
                    existingStation.lat = model.lat;
                    existingStation.lon = model.lon;
                    existingStation.description = model.description;
                    existingStation.infor_data = model.infor_data;
                    existingStation.luuvuc = model.luuvuc;

                    _context.monitoring_stations.Update(existingStation);
                    await _context.SaveChangesAsync();
                    return Ok("Cập nhật dữ liệu trạm thành công !");
                }
                else
                {
                    return NotFound("Không tìm thấy bản ghi trùng khớp");
                }
            }
            else
            {
                // Add new record
                var newStation = new monitoring_stations
                {
                    key = Guid.NewGuid(),
                    station_id = model.station_id,
                    station_name = model.station_name,
                    tinh = model.tinh,
                    phuongxa = model.phuongxa,
                    quanhuyen = model.quanhuyen,
                    order_province = model.order_province,
                    lat = model.lat,
                    lon = model.lon,
                    description = model.description,
                    infor_data = model.infor_data,
                    luuvuc = model.luuvuc
                };

                await _context.monitoring_stations.AddAsync(newStation);
                await _context.SaveChangesAsync();
                return Ok("Thêm dữ liệu thành công");
            }
        }

        [HttpDelete("deletestations")]
        public async Task<IActionResult> DeleteStations([FromBody] List<monitoring_stations> models)
        {
            if (models == null || !models.Any())
            {
                return BadRequest("Dữ liệu trạm đo không hợp lệ.");
            }

            bool iscussces = true;

            foreach (var model in models)
            {
                var existingStation = await _context.monitoring_stations.FindAsync(model.key, model.station_id);
                if (existingStation != null)
                {
                    _context.monitoring_stations.Remove(existingStation);
                }
                else
                {
                    iscussces = false;
                }
            }

            await _context.SaveChangesAsync();

            if (iscussces)
            {
                return Ok("Xóa thành công trạm đo !");
            }
            else
            {
                return NotFound("Có vấn đề phát sinh trong quá trình xóa");
            }

        }


        [Authorize(Policy = "ROLE_BAOCAOTHONGKE")]
        [HttpGet("reportstations")]
        public async Task<ActionResult<IEnumerable<weather_stations_report>>> Getallreportstations()
        {
            var stationsrp = await _context.weather_stations_report
                .Select(s =>
                    new {
                        id = s.id,
                        tinh = s.tinh,
                        name_file = s.name_file,
                        file_ref = s.file_ref,
                        request_time =  s.request_time.ToString("HH:mm dd/MM/yyyy"),
                        ngaybatdau = s.ngaybatdau.ToString("HH:mm dd/MM/yyyy"),
                        ngayketthuc = s.ngayketthuc.ToString("HH:mm dd/MM/yyyy"),
                        tansuat = s.tansuat + " giờ",
                        email = s.email,
                        trangthai = s.trangthai,
                        id_station_list =   s.id_station_list

                    })
                .ToListAsync();

            return Ok(stationsrp);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deletelistrp")]
        public async Task<IActionResult> DeleteListRp([FromBody] List<int> ids)
        {
            if (ids == null || ids.Count == 0)
            {
                return BadRequest("No IDs provided");
            }

            var reportsToDelete = await _context.weather_stations_report.Where(r => ids.Contains(r.id)).ToListAsync();

            if (reportsToDelete == null || reportsToDelete.Count == 0)
            {
                return NotFound("No matching reports found");
            }

            _context.weather_stations_report.RemoveRange(reportsToDelete);
            await _context.SaveChangesAsync();

            return Ok("Reports deleted successfully");
        }

        [HttpGet("alldanhmuc")]
        public async Task<ActionResult<IEnumerable<DanhMucConDto>>> GetallDanhmuc()
        {
            var sql = @"
                SELECT a.ldm_id,
                       a.ldm_ten,
                       a.ldm_ma,
                       (
                           SELECT json_agg(
                                      json_build_object(
                                          'dm_id', b_sub.dm_id,
                                          'dm_ldm_id', b_sub.dm_ldm_id,
                                          'dm_ten', b_sub.dm_ten,
                                          'dm_ma', b_sub.dm_ma
                                      )
                                  )
                           FROM sys_danhmuc AS b_sub
                           WHERE b_sub.dm_ldm_id = a.ldm_id
                       ) AS ldm_mota
                FROM sys_danhmuc_phanloai AS a
                ORDER BY a.ldm_id ASC;";

            var alldanhmuc = await _context.sys_danhmuc_phanloai.FromSqlRaw(sql).ToListAsync();

            foreach (var item in alldanhmuc)
            {
                if (!string.IsNullOrEmpty(item.ldm_mota))
                {
                    item.DanhMucConList = JsonConvert.DeserializeObject<List<DanhMucCon>>(item.ldm_mota);
                }
            }

            return Ok(alldanhmuc);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("savedanhmuc")]
        public async Task<IActionResult> SaveChangesDanhmuc([FromBody] DanhMucCon model)
        {
            if (model == null)
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                if (model.dm_id == 0)
                {
                    var danhmuc = new DanhMucCon
                    {
                        dm_ten = model.dm_ten,
                        dm_ldm_id = model.dm_ldm_id,
                        dm_ma = model.dm_ma,
                    };
                    _context.sys_danhmuc.Add(danhmuc);
                }
                else
                {
                    var selectdanhmuc = await _context.sys_danhmuc.FindAsync(model.dm_id);
                    if (selectdanhmuc == null)
                    {
                        return NotFound($"Danh muc with ID {model.dm_id} not found.");
                    }

                    selectdanhmuc.dm_ten = model.dm_ten;
                    selectdanhmuc.dm_ldm_id = model.dm_ldm_id;
                    selectdanhmuc.dm_ma = model.dm_ma;

                    _context.sys_danhmuc.Update(selectdanhmuc);
                }

                await _context.SaveChangesAsync();
                return Ok("Lưu dữ liệu thành công");
            }
            catch (Exception ex)
            {
                // Log the exception here (optional)
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deletedanhmuc")]
        public async Task<IActionResult> Deletedanhmuc(int ids)
        {
            var reportsToDelete = await _context.sys_danhmuc.Where(r => r.dm_id == ids).ToListAsync();

            if (reportsToDelete == null || reportsToDelete.Count == 0)
            {
                return NotFound("No matching reports found");
            }

            _context.sys_danhmuc.RemoveRange(reportsToDelete);
            await _context.SaveChangesAsync();

            return Ok("Xóa danh mục thành công");
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("saveloaidanhmuc")]
        public async Task<IActionResult> SaveChangesloaiDanhmuc([FromBody] DanhMucConDto model)
        {
            if (model == null)
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                if (model.ldm_id == 0)
                {
                    var danhmuc = new DanhMucConDto
                    {
                        ldm_ten = model.ldm_ten,
                        ldm_ma = model.ldm_ma,
                    };
                    _context.sys_danhmuc_phanloai.Add(danhmuc);
                }
                else
                {
                    var selectdanhmuc = await _context.sys_danhmuc_phanloai.FindAsync(model.ldm_id);
                    if (selectdanhmuc == null)
                    {
                        return NotFound($"Danh muc with ID {model.ldm_id} not found.");
                    }

                    selectdanhmuc.ldm_ten = model.ldm_ten;
                    selectdanhmuc.ldm_ma = model.ldm_ma;

                    _context.sys_danhmuc_phanloai.Update(selectdanhmuc);
                }

                await _context.SaveChangesAsync();
                return Ok("Lưu dữ liệu thành công");
            }
            catch (Exception ex)
            {
                // Log the exception here (optional)
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deleteloaidanhmuc")]
        public async Task<IActionResult> Deleteloaidanhmuc(int ids)
        {
            var reportsToDelete = await _context.sys_danhmuc_phanloai.Where(r => r.ldm_id == ids).ToListAsync();

            if (reportsToDelete == null || reportsToDelete.Count == 0)
            {
                return NotFound("No matching reports found");
            }

            _context.sys_danhmuc_phanloai.RemoveRange(reportsToDelete);
            await _context.SaveChangesAsync();

            return Ok("Xóa loại danh mục thành công");
        }


        [HttpGet("allcoquan")]
        public async Task<ActionResult<IEnumerable<sys_coquan>>> GetallCoquan()
        {

            var allcoquan = await _context.sys_coquan.OrderBy( s => s.cq_id ).ToListAsync();

            return Ok(allcoquan);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deletecoquan")]
        public async Task<IActionResult> DeleteCoquan(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Id không hợp lệ.");
            }

            var existingcoquan = await _context.sys_coquan.FindAsync(id);
            if (existingcoquan == null)
            {
                return NotFound("Không tìm thấy dữ liệu cần xóa.");
            }

            _context.sys_coquan.Remove(existingcoquan);
            await _context.SaveChangesAsync();
            return Ok("Xóa dữ liệu thành công");

        }

        [HttpGet("alldanhmuccon")]
        public async Task<ActionResult<IEnumerable<DanhMucCon>>> Getalldanhmuccon()
        {
            var ldm = await _context.sys_danhmuc_phanloai.Where(s => s.ldm_ma == "NHOMNGUOIDUNG").FirstOrDefaultAsync();
            if (ldm == null)
            {
                return Ok();
            }
            else
            {
                var alldanhmuc = await _context.sys_danhmuc.Where(s => s.dm_ldm_id == ldm.ldm_id).OrderBy(s => s.dm_id).ToListAsync();
                return Ok(alldanhmuc);
            }
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("savecoquan")]
        public async Task<IActionResult> SaveCoQuan([FromBody] sys_coquan model)
        {
            if (model == null)
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                if (model.cq_id == 0)
                {
                    var newCoQuan = new sys_coquan
                    {
                        cq_ten = model.cq_ten,
                        cq_mota = model.cq_mota,
                        cq_diachi = model.cq_diachi,
                        cq_nguoidaidien = model.cq_nguoidaidien,
                        cq_dienthoai = model.cq_dienthoai,
                        cq_email = model.cq_email,
                        cq_ghichu = model.cq_ghichu,
                        cq_active = model.cq_active,
                        cq_loai = model.cq_loai,
                        cq_tinhid = model.cq_tinhid,
                        cq_huyenid = model.cq_huyenid,
                        cq_xaid = model.cq_xaid,
                        cq_role_tinhid = model.cq_role_tinhid,
                        cq_pid = model.cq_pid

                    };
                    _context.sys_coquan.Add(newCoQuan);
                }
                else
                {
                    // Cập nhật
                    var existingCoQuan = await _context.sys_coquan.FindAsync(model.cq_id);
                    if (existingCoQuan == null)
                    {
                        return NotFound($"CoQuan with ID {model.cq_id} not found.");
                    }

                    existingCoQuan.cq_ten = model.cq_ten;
                    existingCoQuan.cq_mota = model.cq_mota;
                    existingCoQuan.cq_diachi = model.cq_diachi;
                    existingCoQuan.cq_nguoidaidien = model.cq_nguoidaidien;
                    existingCoQuan.cq_dienthoai = model.cq_dienthoai;
                    existingCoQuan.cq_email = model.cq_email;
                    existingCoQuan.cq_ghichu = model.cq_ghichu;
                    existingCoQuan.cq_active = model.cq_active;
                    existingCoQuan.cq_loai = model.cq_loai;
                    existingCoQuan.cq_tinhid = model.cq_tinhid;
                    existingCoQuan.cq_huyenid = model.cq_huyenid;
                    existingCoQuan.cq_xaid = model.cq_xaid;
                    existingCoQuan.cq_role_tinhid = model.cq_role_tinhid;
                    existingCoQuan.cq_pid = model.cq_pid;

                    _context.sys_coquan.Update(existingCoQuan);
                }

                await _context.SaveChangesAsync();
                return Ok("Lưu dữ liệu thành công");
            }
            catch (Exception ex)
            {
                // Log the exception here (optional)
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }


        [HttpGet("allrole")]
        public async Task<ActionResult<IEnumerable<sys_role>>> Getallrole()
        {

            var allrole = await _context.sys_role.OrderBy(s => s.role_id).ToListAsync();

            return Ok(allrole);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("saverole")]
        public async Task<IActionResult> SaveRole([FromBody] List<sys_role> model)
        {
            if (model == null || !model.Any())
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                foreach (var role in model)
                {
                    var existingRoles = await _context.sys_role
                        .Where(s => s.role_cq_id == role.role_cq_id)
                        .ToListAsync();

                    if (existingRoles.Any())
                    {
                        _context.sys_role.RemoveRange(existingRoles);
                    }
                }

                var newRoles = model.Select(role => new sys_role
                {
                    role_cq_id = role.role_cq_id,
                    role_ma = role.role_ma,
                    role_nguoitao = role.role_nguoitao,
                    role_ten = role.role_ten,
                    role_type = 1,
                }).ToList();

                await _context.sys_role.AddRangeAsync(newRoles);
                await _context.SaveChangesAsync();

                return Ok("Lưu dữ liệu thành công");
            }
            catch (Exception ex)
            {
                // Log the exception here (optional)
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpGet("infostationstoday")]
        public async Task<ActionResult<IEnumerable<monitoring_stations>>> GetallStationstoday([FromQuery] List<int> lpid)
        {
            var query = from rainData in _context.monitoring_data_today
                        join station in _context.monitoring_stations
                        on rainData.station_id equals station.station_id
                        join tskt in _context.iw_thongsoquantrac
                        on station.key equals tskt.works_id
                        select new
                        {
                            station_id = station.station_id,
                            station_name = station.station_name,
                            total = rainData.data_giatri_sothuc,
                            daterain = rainData.data_thoigian,
                            tinh = station.tinh,
                            lat = station.lat,
                            lon = station.lon,
                            quanhuyen = station.quanhuyen,
                            phuongxa = station.phuongxa,
                            pid = station.order_province
                        };
            if(lpid != null && lpid.Any())
            {
                var weatherData = await query
                .GroupBy(a => new { a.station_id, a.station_name, a.tinh, a.lat, a.lon, a.quanhuyen, a.phuongxa, a.pid })
                .Select(g => new
                {
                    station_id = g.Key.station_id,
                    station_name = g.Key.station_name,
                    total_rain = g.Sum(x => x.total), // Tính tổng lượng mưa
                    tinh = g.Key.tinh,
                    lat = g.Key.lat,
                    lon = g.Key.lon,
                    quanhuyen = g.Key.quanhuyen,
                    phuongxa = g.Key.phuongxa,
                    pid = g.Key.pid
                })
                .Where(s => lpid.Contains(s.pid))
                .ToListAsync();


                return Ok(weatherData);
            }
            else
            {
                var weatherData = await query
                .GroupBy(a => new { a.station_id, a.station_name, a.tinh, a.lat, a.lon, a.quanhuyen, a.phuongxa, a.pid })
                .Select(g => new
                {
                    station_id = g.Key.station_id,
                    station_name = g.Key.station_name,
                    total_rain = g.Sum(x => x.total), // Tính tổng lượng mưa
                    tinh = g.Key.tinh,
                    lat = g.Key.lat,
                    lon = g.Key.lon,
                    quanhuyen = g.Key.quanhuyen,
                    phuongxa = g.Key.phuongxa,
                    pid = g.Key.pid
                })
                .ToListAsync();

                return Ok(weatherData);
            }
            
        }
        [HttpGet("reportstationstoday")]
        public async Task<ActionResult<IEnumerable<weather_stations_report>>> Getreportstationstoday()
        {
            DateTime today = DateTime.Today;
            var stationsrp = await _context.weather_stations_report
                .Where( s => s.request_time.Date == today)
                .Select(s =>
                    new {
                        id = s.id,
                        tinh = s.tinh,
                        name_file = s.name_file,
                        file_ref = s.file_ref,
                        request_time = s.request_time.ToString("HH:mm dd/MM/yyyy"),
                        ngaybatdau = s.ngaybatdau.ToString("HH:mm dd/MM/yyyy"),
                        ngayketthuc = s.ngayketthuc.ToString("HH:mm dd/MM/yyyy"),
                        tansuat = s.tansuat + " giờ",
                        email = s.email,
                        trangthai = s.trangthai,
                        id_station_list = s.id_station_list

                    })
                .ToListAsync();

            return Ok(stationsrp);
        }

        [HttpGet("thongsoquantrac")]
        public async Task<ActionResult<IEnumerable<iw_thongsoquantrac>>> Getthongsoquantrac(Guid key_station)
        {

            var data = await _context.iw_thongsoquantrac
                .Where(s => s.works_id == key_station)
                .ToListAsync();

            return Ok(data);
        }
        [HttpGet("danhmucqt")]
        public async Task<ActionResult<IEnumerable<DanhMucConDto>>> GetDanhmucqt()
        {
            var sql = @"
                SELECT a.dm_id,
	                   a.dm_ten,
	                   a.dm_ma,
	                   a.dm_ldm_id
                FROM sys_danhmuc AS a
                WHERE a.dm_ldm_id = (SELECT ldm_id 
                                     FROM sys_danhmuc_phanloai 
                                     WHERE ldm_ma = 'LOAITHONGSO')
                ORDER BY a.dm_id ASC;
                ";

            var danhmucqt = await _context.sys_danhmuc.FromSqlRaw(sql).ToListAsync();

            return Ok(danhmucqt);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("savetsdlqt")]
        public async Task<IActionResult> SaveThongsoquantrac([FromBody] iw_thongsoquantrac model)
        {
            if (model == null )
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                var data = new iw_thongsoquantrac
                {
                    tskt_ten = model.tskt_ten,
                    tskt_deletedstatus = 0,
                    tskt_maloaithongso = model.tskt_maloaithongso,
                    works_id = model.works_id,
                    tskt_key = Guid.NewGuid(),
                };
                
                await _context.iw_thongsoquantrac.AddAsync(data);
                await _context.SaveChangesAsync();

                return Ok("Lưu dữ liệu thành công");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deletetsdlqt")]
        public async Task<IActionResult> Deletetsdlqt([FromBody] List<int> ids)
        {
            if (ids == null || ids.Count == 0)
            {
                return BadRequest("No IDs provided");
            }

            try
            {
                var ThongsoToDelete = await _context.iw_thongsoquantrac
                                                .Where(r => ids.Contains(r.tskt_id))
                                                .ToListAsync();

                if (ThongsoToDelete == null || ThongsoToDelete.Count == 0)
                {
                    return NotFound("Không tìm thấy dữ liệu");
                }

                _context.iw_thongsoquantrac.RemoveRange(ThongsoToDelete);
                await _context.SaveChangesAsync();

                return Ok("Deleted successfully");
            }
            catch (Exception ex)
            {
                // Ghi log lỗi nếu cần
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("insertdatamonitoring")]
        public async Task<IActionResult> InsertDataMonitoring([FromBody] dataweathersinsert model)
        {
            if (model == null)
            {
                return BadRequest("Invalid data.");
            }

            try
            {
                // Tìm thông tin tskt và station dựa trên key
                var thongso = await _context.iw_thongsoquantrac
                    .Where(s => s.tskt_key == model.key)
                    .FirstOrDefaultAsync();
                var ssid = await _context.monitoring_stations
                    .Where(s => s.key == thongso.works_id)
                    .FirstOrDefaultAsync();

                if (thongso == null)
                {
                    return NotFound("Thông số không tồn tại.");
                }

                var newData = new monitoring_data_today
                {
                    tskt_id = thongso.tskt_id,
                    station_id = ssid.station_id,
                    data_thoigian = model.data_thoigian,
                    data_thoigiancapnhat = model.data_thoigiancapnhat,
                    data_giatri_sothuc = model.data_giatri_sothuc,
                    data_giatri_chuoi = model.data_giatri_chuoi,
                    data_maloaithongso = thongso.tskt_maloaithongso
                };

                await _context.monitoring_data_today.AddAsync(newData);
                await _context.SaveChangesAsync();

                return Ok("Lưu dữ liệu thành công");
            }
            catch (Exception ex)
            {
                // Log the exception here (optional)
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }
        [HttpGet("get-xml-data")]
        public async Task<IActionResult> GetXmlData()
        {
            string currentDate = DateTime.UtcNow.ToString("yyyyddMMTHH00Z");

            // Tạo URL với ngày hiện tại
            string url = $"http://apittdl.vndss.com//api/viewdata/1/wl/datetime/{currentDate}";

            using (HttpClient client = new HttpClient())
            {
                try
                {
                    // Gọi API và lấy kết quả trả về
                    HttpResponseMessage response = await client.GetAsync(url);
                    response.EnsureSuccessStatusCode();

                    // Đọc nội dung XML dưới dạng string
                    string xmlContent = await response.Content.ReadAsStringAsync();

                    XDocument doc = XDocument.Parse(xmlContent);

                    // Chuyển XDocument sang JSON
                    string jsonContent = JsonConvert.SerializeXNode(doc);

                    // Trả về JSON
                    return Ok(jsonContent);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, "Có lỗi xảy ra khi xử lý yêu cầu " + ex.Message);
                }
            }
        }


        [HttpGet("GetMapLayers")]
        public async Task<IActionResult> GetMapLayers()
        {
            var datalayer = await _context.map_sources_layer
            .Select(source => new
            {
                key = source.id,
                label = source.name,
                SourceId = source.id,
                SourceName = source.source_name,
                Tiles = source.tiles,
                Bounds = source.bounds,
                children = _context.map_layers.Where( l => l.source_id == source.id ).Select(layer => new 
                {
                    key = layer.id,
                    label = layer.name,
                    LayerType = layer.type,
                    SourceLayer = layer.source,
                    Paint = layer.paint,
                    Layout = layer.layout,
                    MinZoom = layer.min_zoom,
                    MaxZoom = layer.max_zoom,
                    Visibility = layer.visibility,
                    parentId = source.id,
                }).ToList()
            })
            .ToListAsync();

            return Ok(datalayer);
        }

        // POST: api/MapLayers
        [HttpPost("CreateMapLayer")]
        public async Task<IActionResult> CreateMapLayer([FromBody] map_layers mapLayer)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            mapLayer.id = Guid.NewGuid();
            mapLayer.created_at = DateTime.UtcNow;
            mapLayer.updated_at = DateTime.UtcNow;

            _context.map_layers.Add(mapLayer);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMapLayers), mapLayer);
        }

        // PUT: api/MapLayers/{id}
        [HttpPut("UpdateMapLayer/{id}")]
        public async Task<IActionResult> UpdateMapLayer(Guid id, [FromBody] map_layers mapLayer)
        {
            if (id != mapLayer.id) return BadRequest("ID không khớp.");
            var existingLayer = await _context.map_layers.FindAsync(id);
            if (existingLayer == null) return NotFound();

            existingLayer.name = mapLayer.name;
            existingLayer.layout = mapLayer.layout;
            existingLayer.paint = mapLayer.paint;
            existingLayer.type = mapLayer.type;
            existingLayer.visibility = mapLayer.visibility;
            existingLayer.source = mapLayer.source;
            existingLayer.source_layer = mapLayer.source_layer;
            existingLayer.min_zoom = mapLayer.min_zoom;
            existingLayer.max_zoom = mapLayer.max_zoom;
            existingLayer.updated_at = DateTime.UtcNow;
            existingLayer.source_id = mapLayer.source_id;

            try
            {
                // Lưu thay đổi vào cơ sở dữ liệu
                await _context.SaveChangesAsync();
                return Ok("Cập nhật dữ liệu thành công");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error updating map layer: {ex.Message}");
                return StatusCode(500, "Lỗi trong quá trình lưu dữ liệu. Vui lòng thử lại sau.");
            }
        }

        [HttpDelete("DeleteMapLayer/{id}")]
        public async Task<IActionResult> DeleteMapLayer(Guid id)
        {
            var mapLayer = await _context.map_layers.FindAsync(id);
            if (mapLayer == null) return NotFound();

            _context.map_layers.Remove(mapLayer);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class MenuItem
        {
            public int key { get; set; }
            public int? ParentId { get; set; }
            public string label { get; set; }
            public int? Level { get; set; }
            public int? Thutu { get; set; }
            public string Url { get; set; }
            public List<MenuItem> Children { get; set; } = new List<MenuItem>();
        }

        public class dataweathersinsert
        {
            public Guid key { get; set; }
            public DateTime data_thoigian { get; set; }
            public DateTime? data_thoigiancapnhat { get; set; }
            public float? data_giatri_sothuc { get; set; }
            public string? data_giatri_chuoi { get; set; }
        }

    }
}

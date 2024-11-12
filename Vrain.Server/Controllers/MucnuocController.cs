using Hangfire;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Text;
using Vrain.Server.Models;
using Vrain.Server.Data;
using System.Configuration;
using DocumentFormat.OpenXml.Bibliography;
using Elfie.Serialization;

namespace Vrain.Server.Controllers
{
    [Route("vnrain/[controller]")]
    [ApiController]
    public class MucnuocController : ControllerBase
    {
        private readonly WeatherDbContext _context;
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IConfiguration _configuration;
        public MucnuocController (WeatherDbContext context , IWebHostEnvironment hostingEnvironment, IConfiguration configuration)
        {
            _context = context;
            _hostingEnvironment = hostingEnvironment;
            _configuration = configuration;
        }

        public static string Slug(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // Loại bỏ dấu tiếng Việt
            input = RemoveDiacritics(input);

            // Chuyển chuỗi thành chữ thường
            input = input.ToLowerInvariant();

            // Thay thế khoảng trắng và các ký tự đặc biệt bằng dấu gạch ngang
            input = Regex.Replace(input, @"\s+", "-"); // Thay khoảng trắng thành dấu gạch ngang
            input = Regex.Replace(input, @"[^a-z0-9\s-]", ""); // Loại bỏ các ký tự đặc biệt
            input = Regex.Replace(input, @"-+", "-"); // Xóa các dấu gạch ngang lặp

            return input.Trim('-'); // Loại bỏ dấu gạch ngang ở đầu và cuối chuỗi
        }

        // Hàm loại bỏ dấu tiếng Việt
        public static string RemoveDiacritics(string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();
            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }
            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<weather_stations>>> Mucnuochientai(String? luuvuc)
        {
            if(luuvuc == null)
            {
                var timenow = DateTime.Now.Date;

                var query = await (
                    from tt in _context.monitoring_data
                    where tt.data_thoigian >= timenow
                    join b in _context.iw_thongsoquantrac on tt.tskt_id equals b.tskt_id
                    join c in _context.monitoring_stations on b.works_id equals c.key
                    where b.tskt_maloaithongso == "DOMUCNUOC"
                    join groupedtt in (
                        from innerData in _context.monitoring_data
                        where innerData.data_thoigian >= timenow
                        group innerData by innerData.station_id into stationGroup
                        select new
                        {

                            station_id = stationGroup.Key,
                            MaxDateTime = stationGroup.Max(x => x.data_thoigian)
                        }
                    ) on new { tt.station_id, tt.data_thoigian } equals new { groupedtt.station_id, data_thoigian = groupedtt.MaxDateTime }
                    select new
                    {
                        tt.station_id,
                        data_thoigian = tt.data_thoigian.ToString("dd-MM-yyyy HH:mm:ss"),
                        s_data_thoigian = tt.data_thoigian.ToString("dd-MM HH:mm"),
                        tt.data_giatri_sothuc,
                        b.tskt_maloaithongso,
                        c.station_name,
                        c.tinh,
                        c.luuvuc,
                        c.lat,
                        c.lon,
                        c.quanhuyen,
                        c.phuongxa,
                        c.baodong1,
                        c.baodong2,
                        c.baodong3,
                        c.lulichsu
                    }
                ).ToListAsync();

                return Ok(query);

            }
            else 
            {
                var timenow = DateTime.Now.Date;

                var query = await (
                    from tt in _context.monitoring_data
                    where tt.data_thoigian >= timenow
                    join b in _context.iw_thongsoquantrac on tt.tskt_id equals b.tskt_id
                    join c in _context.monitoring_stations on b.works_id equals c.key
                    where b.tskt_maloaithongso == "DOMUCNUOC" && (c.luuvuc == luuvuc || c.tinh == luuvuc)
                    join groupedtt in (
                        from innerData in _context.monitoring_data
                        where innerData.data_thoigian >= timenow
                        group innerData by innerData.station_id into stationGroup
                        select new
                        {
                            station_id = stationGroup.Key,
                            MaxDateTime = stationGroup.Max(x => x.data_thoigian)
                        }
                    ) on new { tt.station_id, tt.data_thoigian } equals new { groupedtt.station_id, data_thoigian = groupedtt.MaxDateTime }
                    join previousData in _context.monitoring_data on new { tt.station_id, tt.data_thoigian } equals new { station_id = previousData.station_id, data_thoigian = previousData.data_thoigian.AddHours(-1) }
                        into previousDataGroup
                    from previousData in previousDataGroup.DefaultIfEmpty() 
                    select new
                    {
                        tt.station_id,
                        data_thoigian = tt.data_thoigian.ToString("dd-MM-yyyy HH:mm:ss"),
                        value = tt.data_giatri_sothuc,
                        s_data_thoigian = tt.data_thoigian.ToString("dd-MM HH:mm"),
                        value_pre = previousData != null ? previousData.data_giatri_sothuc : (float?)null, 
                        b.tskt_maloaithongso,
                        c.station_name,
                        c.tinh,
                        c.luuvuc,
                        c.lat,
                        c.lon,
                        c.quanhuyen,
                        c.phuongxa,
                        c.baodong1,
                        c.baodong2,
                        c.baodong3,
                        c.lulichsu
                    }
                ).ToListAsync();

                return Ok(query);

            }

        }

        [HttpGet("luuvuc")]
        public async Task<ActionResult<IEnumerable<monitoring_stations>>> luuvuc()
        {
            var distinctLuuvuc = await (
                from station in _context.monitoring_stations
                join thongso in _context.iw_thongsoquantrac on station.key equals thongso.works_id
                where thongso.tskt_maloaithongso == "DOMUCNUOC"
                select new
                {
                    station.luuvuc
                }
               ).Distinct().ToListAsync();

            return Ok(distinctLuuvuc);
        }

        [HttpGet("tinh")]
        public async Task<ActionResult<IEnumerable<object>>> tinh()
        {
            var result = await _context.bgmap_province.Select(province => new
            {
                province.gid,
                province.ten_tinh,
                huyens = _context.bgmap_district
                    .Where(district => district.tinh_id == province.gid)
                    .Select(district => new
                    {
                        district.gid,
                        district.ten_huyen,
                        xas = _context.bgmap_commune
                            .Where(commune => commune.huyen_id == district.gid)
                            .Select(commune => new
                            {
                                commune.gid,
                                commune.ten_xa
                            }).ToList()
                    }).ToList()
            }).ToListAsync();

            return Ok(result);
        }


        [HttpGet("Mucnuocnow")]
        public async Task<ActionResult<IEnumerable<weather_stations>>> Getmucnuocnow(String? luuvuc, DateTime? startDate, DateTime? endDate , string mathongso)
        {
                string sqlQuery = @"
                SELECT * FROM monitoring_data
                WHERE data_thoigian <= '" + endDate.Value.ToString("yyyy-MM-dd 23:59:59") + @"' AND data_thoigian >= '" + startDate.Value.ToString("yyyy-MM-dd 00:00:00") + @"'";

                // Fetch monitoring data
                var datamonitoring = await _context.monitoring_data
                    .FromSqlRaw(sqlQuery)
                    .ToListAsync();

                var datastations = await _context.monitoring_stations
                    .Where(s => s.luuvuc == luuvuc || s.tinh == luuvuc)
                    .ToListAsync();

                var stationKeys = datastations.Select(s => s.key).ToList();

                var datathongso = await _context.iw_thongsoquantrac
                    .Where(ts => stationKeys.Contains(ts.works_id) && ts.tskt_maloaithongso == mathongso)
                    .ToListAsync();


                // Get valid station IDs based on the province
                var validStationIds = new HashSet<int>(datathongso.Select(s => s.tskt_id));

                // Filter and group the monitoring data by date and hour
                var filteredData = datamonitoring
                    .Where(d => validStationIds.Contains(d.tskt_id))
                    .GroupBy(d => new { d.data_thoigian.Date, d.data_thoigian.Hour, d.data_thoigian.Minute }) 
                    .Select(g => new
                    {
                        timePoint = g.Key.Date.ToString("dd/MM") + " " + g.Key.Hour.ToString("D2") + ":" + g.Key.Minute.ToString("D2"), // Format as dd/MM HH:mm
                        stations = g.GroupBy(d => d.station_id)
                            .Select(stationGroup => new
                            {
                                station_id = stationGroup.Key,
                                station_name = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.station_name,
                                total = stationGroup.Sum(d => d.data_giatri_sothuc), // Aggregate the rainfall for the same station in the same hour
                                quanhuyen = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.quanhuyen,
                                phuongxa = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.phuongxa,
                                tinh = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.tinh,
                                baodong1 = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.baodong1,
                                baodong2 = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.baodong2,
                                baodong3 = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.baodong3,
                                lulichsu = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.lulichsu,
                            })
                            .ToList()
                    })
                    .OrderBy(s => s.timePoint)
                    .ToList();

            // Return the result
            return Ok(filteredData);
            
        }

        [HttpGet("report_data")]
        public async Task<ActionResult<IEnumerable<weather_stations_report>>> Getreport(String? luuvuc, string mathongso)
        {
            var station_report = await _context.weather_stations_report
            .Where(a => a.luu_vuc == luuvuc && a.loai_tram == mathongso)
            .Select(a => new
            {
                a.name_file,
                a.file_ref,
                request_time = a.request_time.ToString("dd/MM/yyyy HH:mm"),
                ngaybatdau = a.ngaybatdau.ToString("dd/MM/yyyy"),
                ngayketthuc = a.ngayketthuc.ToString("dd/MM/yyyy"),
                a.tansuat,
                a.email,
                a.trangthai,
                a.tinh
            })
            .ToListAsync();

            return Ok(station_report);

        }

        [HttpPost("processWaterLevelReport")]
        public IActionResult ProcessWaterLevelReport([FromBody] weather_stations_report data)
        {
            try
            {
                // Kiểm tra dữ liệu đầu vào
                if (data == null || data.id_station_list == null)
                {
                    return BadRequest("Invalid data.");
                }
                _context.weather_stations_report.Add(data);
                _context.SaveChanges();

                var dataHelper = new DataHelper(_context, _hostingEnvironment, _configuration);

                dataHelper.ProcessWaterDataReport(data);

                return Ok(new { Message = "Water level report processed successfully", FileRef = data.file_ref });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}

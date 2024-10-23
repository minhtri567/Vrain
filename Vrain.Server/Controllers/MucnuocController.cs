using Hangfire;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Text;
using Vrain.Server.Models;
using Vrain.Server.Data;

namespace Vrain.Server.Controllers
{
    [Route("vnrain/[controller]")]
    [ApiController]
    public class MucnuocController : ControllerBase
    {
        private readonly WeatherDbContext _context;

        public MucnuocController (WeatherDbContext context )
        {
            _context = context;
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
        public async Task<ActionResult<IEnumerable<weather_stations_today>>> Mucnuochientai(String? luuvuc)
        {
            if(luuvuc == null)
            {
                var timenow = DateTime.Now;
                timenow = new DateTime(timenow.Year, timenow.Month, timenow.Day, timenow.Hour, 0, 0);

                var query = await (from rainData in _context.monitoring_data_today
                                   where rainData.data_thoigian == timenow
                                   join tskt in _context.iw_thongsoquantrac
                                   on rainData.tskt_id equals tskt.tskt_id
                                   where tskt.tskt_maloaithongso == "DOMUCNUOC"
                                   join station in _context.monitoring_stations
                                   on rainData.station_id equals station.station_id
                                   select new
                                   {
                                       station_id = station.station_id,
                                       station_name = station.station_name,
                                       value = rainData.data_giatri_sothuc,
                                       data_time = rainData.data_thoigian,
                                       tinh = station.tinh,
                                       luu_vuc = station.luuvuc,
                                       lat = station.lat,
                                       lon = station.lon,
                                       quanhuyen = station.quanhuyen,
                                       phuongxa = station.phuongxa,
                                       baodong1 = station.baodong1,
                                       baodong2 = station.baodong2,
                                       baodong3 = station.baodong3,
                                       lulichsu = station.lulichsu
                                   }).ToListAsync();

                return Ok(query);
            }
            else
            {
                var timenow = DateTime.Now;
                timenow = new DateTime(timenow.Year, timenow.Month, timenow.Day, timenow.Hour, 0, 0);

                var query = await (from rainData in _context.monitoring_data_today
                                   where rainData.data_thoigian == timenow
                                   join tskt in _context.iw_thongsoquantrac
                                   on rainData.tskt_id equals tskt.tskt_id
                                   where tskt.tskt_maloaithongso == "DOMUCNUOC"
                                   join station in _context.monitoring_stations 
                                   on rainData.station_id equals station.station_id
                                   where station.luuvuc == luuvuc
                                   select new
                                   {
                                       station_id = station.station_id,
                                       station_name = station.station_name,
                                       value = rainData.data_giatri_sothuc,
                                       data_time = rainData.data_thoigian,
                                       tinh = station.tinh,
                                       tinh_id = station.order_province,
                                       luu_vuc = station.luuvuc,
                                       lat = station.lat,
                                       lon = station.lon,
                                       quanhuyen = station.quanhuyen,
                                       phuongxa = station.phuongxa,
                                       baodong1 = station.baodong1,
                                       baodong2 = station.baodong2,
                                       baodong3 = station.baodong3,
                                       lulichsu = station.lulichsu,
                                   })
                                   .ToListAsync();

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

        [HttpGet("Mucnuocnow")]
        public async Task<ActionResult<IEnumerable<weather_stations>>> Getmucnuocnow(String? luuvuc, DateTime? startDate, DateTime? endDate , string mathongso)
        {
                string sqlQuery = @"
                SELECT * FROM monitoring_data
                WHERE data_thoigian <= '" + endDate.Value.ToString("yyyy-MM-dd 23:59:59") + @"' AND data_thoigian >= '" + startDate.Value.ToString("yyyy-MM-dd 00:00:00") + @"'
                UNION
                SELECT * FROM monitoring_data_today
                WHERE data_thoigian <= '" + endDate.Value.ToString("yyyy-MM-dd 23:59:59") + @"' AND data_thoigian >= '" + startDate.Value.ToString("yyyy-MM-dd 00:00:00") + @"'";

                // Fetch monitoring data
                var datamonitoring = await _context.monitoring_data
                    .FromSqlRaw(sqlQuery)
                    .ToListAsync();

                var datastations = await _context.monitoring_stations
                    .Where(s => s.luuvuc == luuvuc)
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

    }
}

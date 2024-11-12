using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Vrain.Server.Models;
using Vrain.Server.Data;
using Microsoft.Data.SqlClient;
using System.Dynamic;
using Dapper;
using Npgsql;
using System.Data;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using static Npgsql.PostgresTypes.PostgresCompositeType;
using System.Globalization;
using Hangfire;
using Microsoft.CodeAnalysis.CSharp;
using static Dapper.SqlMapper;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Configuration;
using System.Configuration;

[Route("vnrain/[controller]")]
[ApiController]
public class WeatherStationsController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly WeatherDbContext _context;
    private readonly IWebHostEnvironment _hostingEnvironment;
    private readonly IConfiguration _configuration;
    public WeatherStationsController(WeatherDbContext context , IWebHostEnvironment hostingEnvironment , IBackgroundJobClient backgroundJobClient , IConfiguration configuration)
    {
        _context = context;
        _hostingEnvironment = hostingEnvironment;
        _backgroundJobClient = backgroundJobClient;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<weather_stations_today>>> GetWeatherStations( String? provincename )
    {
        var cutoffTime = DateTime.Now.Date.AddDays(-1).AddHours(20);
        string Nameprovince =  NameProvinceHelper.GetNameProvince(provincename);
        if (!String.IsNullOrEmpty(provincename))
        {
            var query = from rainData in _context.monitoring_data
                        where rainData.data_maloaithongso == "RAIN" && rainData.data_thoigian >= cutoffTime
                        join tskt in _context.iw_thongsoquantrac
                        on rainData.tskt_id equals tskt.tskt_id
                        join station in _context.monitoring_stations
                        on rainData.station_id equals station.station_id
                        select new
                        {
                            station_id = station.station_id,
                            station_name = station.station_name,
                            total = rainData.data_giatri_sothuc,
                            daterain = rainData.data_thoigian,
                            tinh = station.tinh,
                            tinh_id = station.order_province,
                            lat = station.lat,
                            lon = station.lon,
                            quanhuyen = station.quanhuyen,
                            phuongxa = station.phuongxa,
                        };

            var weatherData = await query.ToListAsync();

            // Group by province and calculate total for each group
            var groupedData = weatherData
                .GroupBy(a => new { a.tinh, a.station_id })
                .Select(g => new
                {
                    Total = g.Sum(x => x.total),
                    lat = g.First().lat,
                    lon = g.First().lon,
                    tinh = g.First().tinh,
                    tinh_id = g.First().tinh_id,
                    station_name = g.First().station_name,
                    station_id = g.First().station_id,
                    quanhuyen = g.First().quanhuyen,
                    phuongxa = g.First().phuongxa,
                })
                .Where(a => a.tinh == Nameprovince)
                .OrderByDescending(g => g.Total)
                .ToList();

            return Ok(groupedData);
        }
        else
        {
            var query = from rainData in _context.monitoring_data
                        where rainData.data_maloaithongso == "RAIN" && rainData.data_thoigian >= cutoffTime
                        join tskt in _context.iw_thongsoquantrac
                        on rainData.tskt_id equals tskt.tskt_id
                        join station in _context.monitoring_stations
                        on rainData.station_id equals station.station_id
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

            var weatherData = await query.ToListAsync();

            // Group by province and calculate total for each group
            var groupedData = weatherData
            .GroupBy(a => a.tinh)
            .Select(g => new
            {
                Total = g.GroupBy(x => x.station_id)
                         .Select(stationGroup => new
                         {
                             StationId = stationGroup.Key,
                             TotalRain = stationGroup.Sum(x => x.total),
                             Data = stationGroup.First() // Get the first item to retrieve station details
                         })
                         .OrderByDescending(s => s.TotalRain)
                         .FirstOrDefault(),
                g.First().tinh,
                g.First().lat,
                g.First().lon,
                g.First().quanhuyen,
                g.First().phuongxa,
                g.First().pid,
            })
            .Where(x => x.Total != null) // Ensure that there is at least one station per province
            .Select(t => new
            {
                Total = t.Total.TotalRain,
                lat = t.Total.Data.lat,
                lon = t.Total.Data.lon,
                tinh = t.tinh,
                quanhuyen = t.quanhuyen,
                phuongxa = t.phuongxa,
                station_name = t.Total.Data.station_name,
                pid = t.pid
            })
            .OrderByDescending(g => g.Total)
            .ToList();

            return Ok(groupedData);
        }
    }
    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<weather_stations_today>>> GetfullStations()
    {
        var cutoffTime = DateTime.Now.Date.AddDays(-1).AddHours(20);
        var query = from rainData in _context.monitoring_data
                    where rainData.data_maloaithongso == "RAIN" && rainData.data_thoigian >= cutoffTime
                    join tskt in _context.iw_thongsoquantrac
                    on rainData.tskt_id equals tskt.tskt_id
                    join station in _context.monitoring_stations
                    on rainData.station_id equals station.station_id
                    select new
                    {
                        station_id = station.station_id,
                        station_name = station.station_name,
                        total = rainData.data_giatri_sothuc,
                        daterain = rainData.data_thoigian,
                        pid = station.order_province,
                        tinh = station.tinh,
                        lat = station.lat,
                        lon = station.lon,
                    };

        var weatherData = await query.ToListAsync();

        // Group by province and calculate total for each group
        var groupedData = weatherData
            .GroupBy(a => new { a.tinh, a.station_id })
            .Select(g => new
            {
                Total = g.Sum(x => x.total),
                lat = g.First().lat,
                lon = g.First().lon,
                tinh = g.First().tinh,
                station_name = g.First().station_name,
                station_id = g.First().station_id,
                pid = g.First().pid,
            })
            .OrderByDescending(g => g.Total)
            .ToList();

        return Ok(groupedData);
    }

    [HttpGet("station_provine")]
    public async Task<ActionResult<IEnumerable<weather_stations_today>>> GetStations(String? provincename , string mathongso)
    {
        string Nameprovince = NameProvinceHelper.GetNameProvince(provincename);

        string sql = @$"SELECT a.* FROM monitoring_stations as a inner join iw_thongsoquantrac as b 
                on a.key = b.works_id
                WHERE tinh = '{Nameprovince}' AND b.tskt_maloaithongso = '{mathongso}'";

        var station_provine = await _context.monitoring_stations.FromSqlRaw(sql)
            .ToListAsync();

        return Ok(station_provine);

    }

    [HttpGet("raintoday")]
    public async Task<ActionResult<IEnumerable<weather_stations_today>>> GetfullrainpvStations(String? provincename, DateTime? startDate, DateTime? endDate , int modeview , string mathongso )
    {
        string Nameprovince = NameProvinceHelper.GetNameProvince(provincename);
        if (modeview == 1)
        {
            string sqlQuery = @"
                SELECT * FROM monitoring_data
                WHERE data_thoigian <= '" + endDate.Value.ToString("yyyy-MM-dd 23:59:59") + @"' AND data_thoigian >= '" + startDate.Value.ToString("yyyy-MM-dd 00:00:00") + @"'";

            // Fetch monitoring data
            var datamonitoring = await _context.monitoring_data
                .FromSqlRaw(sqlQuery)
                .ToListAsync();

            // Fetch station data for the specified province
            var datastations = await _context.monitoring_stations
                .Where(s => s.tinh == Nameprovince)
                .ToListAsync();

            var stationKeys = datastations.Select(s => s.key).ToList();

            // Lấy dữ liệu từ bảng iw_thongsoquantrac mà key có trong danh sách stationKeys
            var datathongso = await _context.iw_thongsoquantrac
                .Where(ts => stationKeys.Contains(ts.works_id) && ts.tskt_maloaithongso == mathongso )
                .ToListAsync();


            // Get valid station IDs based on the province
            var validStationIds = new HashSet<int>(datathongso.Select(s => s.tskt_id));

            // Filter and group the monitoring data by date and hour
            var filteredData = datamonitoring
                .Where(d => validStationIds.Contains(d.tskt_id))
                .GroupBy(d => new { d.data_thoigian.Date, d.data_thoigian.Hour, d.data_thoigian.Minute }) // Group by Date, Hour, and Minute
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
        else if(modeview == 2)
        {
            string sqlQuery = @"
            SELECT * FROM monitoring_data
            WHERE data_thoigian <= '" + endDate.Value.ToString("yyyy-MM-dd 23:59:59") + @"' AND data_thoigian >= '" + startDate.Value.ToString("yyyy-MM-dd 00:00:00") + @"'";


            var datamonitoring = await _context.monitoring_data
                .FromSqlRaw(sqlQuery)
                .ToListAsync();

            // Fetch station data for the specified province
            var datastations = await _context.monitoring_stations
                .Where(s => s.tinh == Nameprovince)
                .ToListAsync();

            var stationKeys = datastations.Select(s => s.key).ToList();

            // Lấy dữ liệu từ bảng iw_thongsoquantrac mà key có trong danh sách stationKeys
            var datathongso = await _context.iw_thongsoquantrac
                .Where(ts => stationKeys.Contains(ts.works_id) && ts.tskt_maloaithongso == mathongso )
                .ToListAsync();


            // Get valid station IDs based on the province
            var validStationIds = new HashSet<int>(datathongso.Select(s => s.tskt_id));

            // Filter monitoring data to only include valid stations
            var filteredData = datamonitoring
                .Where(d => validStationIds.Contains(d.tskt_id))
                .GroupBy(d => d.data_thoigian.Date)
                .Select(g => new
                {
                    timePoint = g.Key.ToString("dd/MM"),
                    stations = g.GroupBy(d => d.station_id)
                        .Select(stationGroup => new
                        {
                            station_id = stationGroup.Key,
                            station_name = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.station_name,
                            total = stationGroup.Sum(d => d.data_giatri_sothuc), // Aggregate the rainfall for the same station on the same day
                            quanhuyen = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.quanhuyen,
                            phuongxa = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.phuongxa,
                            tinh = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.tinh,
                        })
                })
                .OrderBy(s => s.timePoint)
                .ToList();

            // Return the result
            return Ok(filteredData);
        }
        else
        {
            string sqlQuery = @"
                SELECT * FROM monitoring_data
                WHERE data_thoigian <= '" + endDate.Value.ToString("yyyy-MM-dd 23:59:59") + @"' AND data_thoigian >= '" + startDate.Value.ToString("yyyy-MM-dd 00:00:00") + @"'";

            // Fetch monitoring data
            var datamonitoring = await _context.monitoring_data
                .FromSqlRaw(sqlQuery)
                .ToListAsync();

            // Fetch station data for the specified province
            var datastations = await _context.monitoring_stations
                .Where(s => s.tinh == Nameprovince)
                .ToListAsync();

            var stationKeys = datastations.Select(s => s.key).ToList();

            // Lấy dữ liệu từ bảng iw_thongsoquantrac mà key có trong danh sách stationKeys
            var datathongso = await _context.iw_thongsoquantrac
                .Where(ts => stationKeys.Contains(ts.works_id) && ts.tskt_maloaithongso == mathongso )
                .ToListAsync();


            // Get valid station IDs based on the province
            var validStationIds = new HashSet<int>(datathongso.Select(s => s.tskt_id));

            // Filter and group the monitoring data by month and year
            var filteredData = datamonitoring
                .Where(d => validStationIds.Contains(d.tskt_id))
                .GroupBy(d => new { d.data_thoigian.Year, d.data_thoigian.Month }) // Group by Year and Month
                .Select(g => new
                {
                    timePoint = $"{g.Key.Month.ToString("D2")}/{g.Key.Year}", // Format as MM/yyyy
                    stations = g.GroupBy(d => d.station_id)
                        .Select(stationGroup => new
                        {
                            station_id = stationGroup.Key,
                            station_name = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.station_name,
                            total = stationGroup.Sum(d => d.data_giatri_sothuc), // Aggregate the rainfall for the same station in the same month
                            quanhuyen = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.quanhuyen,
                            phuongxa = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.phuongxa,
                            tinh = datastations.FirstOrDefault(s => s.station_id == stationGroup.Key)?.tinh,
                        })
                        .ToList()
                })
                .OrderBy(s => s.timePoint)
                .ToList();

            // Return the result
            return Ok(filteredData);

        }
    }

    [HttpPost("report")]
    public IActionResult AddWeatherDataReport([FromBody] weather_stations_report data)
    {
        if (data == null)
        {
            return BadRequest();
        }

        _context.weather_stations_report.Add(data);
        _context.SaveChanges();

        var dataHelper = new DataHelper( _context , _hostingEnvironment , _configuration);
        if (data != null)
        {
            _backgroundJobClient.Enqueue(() => dataHelper.ProcessWeatherDataReport(data));
        }
        return Ok(new { message = "Data added successfully" });
    }
    

    [HttpGet("report_data")]
    public async Task<ActionResult<IEnumerable<weather_stations_report>>> Getreport(String? provincename , string mathongso)
    {
        string Nameprovince = NameProvinceHelper.GetNameProvince(provincename);
        var station_report = await _context.weather_stations_report
        .Where(a => a.tinh == Nameprovince && a.loai_tram == mathongso )
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

    [HttpGet("download/{fileName}")]
    public IActionResult DownloadFile(string fileName)
    {
        // Đường dẫn tuyệt đối đến thư mục chứa file trong wwwroot (hoặc nơi lưu trữ file của bạn)
        var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "File", fileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound();
        }

        // Đọc file và trả về FileStreamResult
        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        var fileStream = new MemoryStream(fileBytes);

        // Xác định kiểu MIME của file để trình duyệt biết cách xử lý nó
        var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; // Loại MIME cho file .xlsx

        // Trả về file dưới dạng FileStreamResult
        return File(fileStream, contentType, fileName);
    }

    public class DayData
    {
        public string ngay { get; set; }
        public double tongmuangay { get; set; }
        public Dictionary<string, double> gio { get; set; }
    }

    public class MonthData
    {
        public int thang { get; set; }
        public double tongmuathang { get; set; }
        public List<DayData> ngay { get; set; }
    }

    public class WeatherDataResult
    {
        public string stationName { get; set; }
        public string stationId { get; set; }
        public string tinh { get; set; }
        public double total { get; set; }
        public string quanhuyen { get; set; }
        public string phuongxa { get; set; }
        public List<MonthData> thang { get; set; }
    }

}

using Quartz;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Logging;
using Vrain.Server.Models;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using Polly;
using Polly.Retry;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Xml.Linq;
public class FetchWeatherDataJob : IJob
{
    private readonly WeatherDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<FetchWeatherDataJob> _logger;
    DateTime currentTime = DateTime.Now;
    public FetchWeatherDataJob(WeatherDbContext context, HttpClient httpClient, ILogger<FetchWeatherDataJob> logger)
    {
        _context = context;
        _httpClient = httpClient;
        _logger = logger;
    }
    public async Task Execute(IJobExecutionContext context)
    {
        var retryPolicy = Policy
            .Handle<Exception>()
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                (exception, timeSpan, retryCount, context) =>
                {
                    _logger.LogWarning($"Retry {retryCount} encountered an error: {exception.Message}. Waiting {timeSpan} before next retry.");
                });

        await retryPolicy.ExecuteAsync(async () =>
        {
            await FetchWeatherData();
        });
    }
    public async Task FetchWeatherData()
    {
        
        _logger.LogInformation("Executing FetchWeatherDataJob...");
        try
        {
            var response = await _httpClient.PostAsJsonAsync("http://vndms.dmc.gov.vn/DataQuanTracMua/DataMuaTheoGio", new
            {
                start = 1,
                length = 5000,
                search_key = "",
                province_id = "0",
                luuvuc_id = "",
                fromDate = DateTime.Now.ToString("dd/MM/yyyy"),
                toDate = DateTime.Now.ToString("dd/MM/yyyy"),
                from_number = (int?)null,
                to_number = (int?)null,
                orderby = "1",
                fromObs = 1,
                toObs = 19,
                source = 0
            });

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonData = JObject.Parse(content);
                var datalistrain = jsonData["data"]
                .ToObject<List<weather_stations_today>>()
                .Where(data => data.daterain.Date == DateTime.Now.Date && data.lat != 0 && data.lon != 0)
                .ToList();

                var firstRecord = _context.monitoring_data_today.OrderBy( s=> s.data_thoigian).FirstOrDefault();

                if (firstRecord != null && firstRecord.data_thoigian.Date == DateTime.Now.Date.AddDays(-1))
                {
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM monitoring_data_today;");
                    await _context.Database.ExecuteSqlRawAsync("ALTER SEQUENCE monitoring_data_today_data_id_seq RESTART WITH 1;");
                }
                else
                {
                    await _context.Database.ExecuteSqlRawAsync("delete from monitoring_data_today\r\nwhere data_thoigian < ((current_date - 1) + time '20:00:00')");
                    await _context.Database.ExecuteSqlRawAsync(@"
                        INSERT INTO monitoring_data(tskt_id, data_thoigian, data_thoigiancapnhat, data_giatri_sothuc, createby, station_id , data_maloaithongso)
                        SELECT
                            tskt_id,
                            data_thoigian,
                            data_thoigiancapnhat,
                            data_giatri_sothuc,
                            createby,
                            station_id,
                            data_maloaithongso
                        FROM
                            monitoring_data_today
                            where data_thoigian <= (current_date + time '19:59:00') ;
                    ");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM monitoring_data_today;");
                    await _context.Database.ExecuteSqlRawAsync("ALTER SEQUENCE monitoring_data_today_data_id_seq RESTART WITH 1;");
                }

                var stationData = (from tskt in _context.iw_thongsoquantrac.Where(s=>s.tskt_maloaithongso == "RAIN")
                                    join station in _context.monitoring_stations
                                    on tskt.works_id equals station.key
                                    select new
                                    {
                                        TsktId = tskt.tskt_id,
                                        StationId = station.station_id,
                                        StationKey = station.key,
                                    }).ToList(); 

                // Ghép nối với dữ liệu từ API
                var result = from station in stationData
                                join data in datalistrain
                                on station.StationId equals data.station_id
                                select new
                                {
                                    station.TsktId,
                                    station.StationId,
                                    data.daterain,
                                    data.source_name,
                                    data.h0,
                                    data.h1,
                                    data.h2,
                                    data.h3,
                                    data.h4,
                                    data.h5,
                                    data.h6,
                                    data.h7,
                                    data.h8,
                                    data.h9,
                                    data.h10,
                                    data.h11,
                                    data.h12,
                                    data.h13,
                                    data.h14,
                                    data.h15,
                                    data.h16,
                                    data.h17,
                                    data.h18,
                                    data.h19,
                                    data.h20,
                                    data.h21,
                                    data.h22,
                                    data.h23
                                };

                foreach (var station in result)
                {
                    for (int hour = 0; hour <= 23 ; hour++)
                    {
                        var timestamp = hour < 20
                            ? station.daterain.AddHours(hour)
                            : station.daterain.AddDays(-1).AddHours(hour);

                        if (timestamp > DateTime.Now || (hour >= 20 && hour <= 23 && timestamp.Date == DateTime.Now.Date))
                        {
                            continue; 
                        }

                        var dataValue = hour switch
                        {
                            0 => station.h0,
                            1 => station.h1,
                            2 => station.h2,
                            3 => station.h3,
                            4 => station.h4,
                            5 => station.h5,
                            6 => station.h6,
                            7 => station.h7,
                            8 => station.h8,
                            9 => station.h9,
                            10 => station.h10,
                            11 => station.h11,
                            12 => station.h12,
                            13 => station.h13,
                            14 => station.h14,
                            15 => station.h15,
                            16 => station.h16,
                            17 => station.h17,
                            18 => station.h18,
                            19 => station.h19,
                            20 => station.h20,
                            21 => station.h21,
                            22 => station.h22,
                            23 => station.h23,
                            _ => 0.0 // Giá trị mặc định nếu không khớp
                        };

                        var monitoringData = new monitoring_data_today
                        {
                            tskt_id = station.TsktId,
                            data_thoigian = timestamp,
                            data_giatri_sothuc = (float?)dataValue,
                            createby = station.source_name,
                            station_id = station.StationId,
                            data_maloaithongso = "RAIN",
                        };

                        _context.monitoring_data_today.Add(monitoringData);
                    }
                }

                await _context.SaveChangesAsync();
            }
            else
            {
                _logger.LogError($"Failed to fetch weather data. Status code: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"An error occurred while fetching weather data: {ex.Message}");
        }

        try
        {
            var currentDate = DateTime.Now;
            var fromDate = currentDate;
            var toDate = currentDate;
            if (currentDate.TimeOfDay > new TimeSpan(20, 0, 0))
            {
                toDate = currentDate.AddDays(1);
                var response = await _httpClient.PostAsJsonAsync("http://vndms.dmc.gov.vn/DataQuanTracMua/DataMuaTheoGio", new
                {
                    start = 1,
                    length = 5000,
                    search_key = "",
                    province_id = "0",
                    luuvuc_id = "",
                    fromDate = fromDate.ToString("dd/MM/yyyy"),  
                    toDate = toDate.ToString("dd/MM/yyyy"),
                    from_number = (int?)null,
                    to_number = (int?)null,
                    orderby = "1",
                    fromObs = 1,
                    toObs = 19,
                    source = 0
                });
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var jsonData = JObject.Parse(content);
                    var datalistrain = jsonData["data"]
                    .ToObject<List<weather_stations_today>>()
                    .Where(data => data.daterain.Date == DateTime.Now.Date && data.lat != 0 && data.lon != 0)
                    .ToList();
                    var stationData = (from tskt in _context.iw_thongsoquantrac.Where(s => s.tskt_maloaithongso == "RAIN")
                                       join station in _context.monitoring_stations
                                       on tskt.works_id equals station.key
                                       select new
                                       {
                                           TsktId = tskt.tskt_id,
                                           StationId = station.station_id,
                                           StationKey = station.key,
                                       }).ToList();

                    // Ghép nối với dữ liệu từ API
                    var result = from station in stationData
                                 join data in datalistrain
                                 on station.StationId equals data.station_id
                                 select new
                                 {
                                     station.TsktId,
                                     station.StationId,
                                     data.daterain,
                                     data.source_name,
                                     data.h20,
                                     data.h21,
                                     data.h22,
                                     data.h23
                                 };

                    foreach (var station in result)
                    {
                        for (int hour = 20; hour <= 23; hour++)
                        {
                            var timestamp = station.daterain.AddHours(hour);

                            var dataValue = hour switch
                            {
                                20 => station.h20,
                                21 => station.h21,
                                22 => station.h22,
                                23 => station.h23,
                                _ => 0.0
                            };

                            var monitoringData = new monitoring_data_today
                            {
                                tskt_id = station.TsktId,
                                data_thoigian = timestamp,
                                data_giatri_sothuc = (float?)dataValue,
                                createby = station.source_name,
                                station_id = station.StationId,
                                data_maloaithongso = "RAIN",
                            };

                            _context.monitoring_data_today.Add(monitoringData);
                        }
                    }

                    await _context.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {

        }
        
        try
        {
            DateTime currentDate = DateTime.Now;
            List<MonitoringDataMC> monitoringDataList = new List<MonitoringDataMC>(); // Danh sách chứa toàn bộ dữ liệu

            for (int hour = 0; hour <= currentDate.Hour; hour++)
            {
                string currentTime = new DateTime(currentDate.Year, currentDate.Month, currentDate.Day, hour, 0, 0).ToString("yyyyMMddTHH00Z");
                string apiUrl = $"http://apittdl.vndss.com/api/viewdata/1/wl/datetime/{currentTime}";

                using (HttpClient client = new HttpClient())
                {
                    var response = await client.GetStringAsync(apiUrl);
                    var rawJsonString = response.Trim();

                    string trimmedJsonString = rawJsonString.Substring(1, rawJsonString.Length - 2);
                    string jsonString = trimmedJsonString.Replace("\\\"", "\"");

                    List<MonitoringDataMC> hourlyData = JsonConvert.DeserializeObject<List<MonitoringDataMC>>(jsonString);

                    monitoringDataList.AddRange(hourlyData);
                }
            }
            var joinedData = (from jsonData in monitoringDataList
                              where jsonData.Value > -9999
                              join station in _context.monitoring_stations
                              on jsonData.StationNo equals station.station_id
                              join tskt in _context.iw_thongsoquantrac
                              on station.key equals tskt.works_id
                              select new
                              {
                                  tskt_id = tskt.tskt_id,
                                  station_id = station.station_id,
                                  data_thoigian = jsonData.DtDate,
                                  data_giatri_sothuc = jsonData.Value
                              }).ToList();

            foreach (var data in joinedData)
            {

                var monitoringData = new monitoring_data_today
                {
                    tskt_id = data.tskt_id,
                    data_thoigian = data.data_thoigian,
                    data_giatri_sothuc = (float?)data.data_giatri_sothuc,
                    createby = "apittdl.vndss.com",
                    station_id = data.station_id,
                    data_maloaithongso = "DOMUCNUOC",
                };

                _context.monitoring_data_today.Add(monitoringData);
                
            }

            await _context.SaveChangesAsync();

        }
        catch (Exception)
        {}
    }
    public class MonitoringDataMC
    {
        public string? StationNo { get; set; }
        public string? StationNameVn { get; set; }
        public string? RegName { get; set; }
        public string? ProjectName { get; set; }
        public string? Address { get; set; }
        public double Lat { get; set; }
        public double Lon { get; set; }
        public DateTime DtDate { get; set; }
        public double? Value { get; set; }
        public int? Flag { get; set; }
    }
}

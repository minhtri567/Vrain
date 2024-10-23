using Quartz;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using static FetchWeatherDataJob;
using Vrain.Server.Models;
using Microsoft.EntityFrameworkCore;

public class AutoGetDataMucNuoc : IJob
{
    private readonly WeatherDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<AutoGetDataMucNuoc> _logger;

    public AutoGetDataMucNuoc(WeatherDbContext context, HttpClient httpClient, ILogger<AutoGetDataMucNuoc> logger)
    {
        _context = context;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        try
        {
            DateTime currentDate = DateTime.Now;
            List<MonitoringDataMC> monitoringDataList = new List<MonitoringDataMC>(); 

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

            var firstRecord = joinedData.OrderBy(s => s.data_thoigian).FirstOrDefault();

            if (firstRecord != null && firstRecord.data_thoigian.Date == DateTime.Now.Date)
            {
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM monitoring_data_today WHERE data_maloaithongso = 'DOMUCNUOC' ;");
            }
            else
            {
                await _context.Database.ExecuteSqlRawAsync("delete from monitoring_data_today\r\nwhere data_thoigian < ( current_date  + time '00:00:01') AND data_maloaithongso = 'DOMUCNUOC' ;");
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
                            where data_thoigian <= (current_date + time '00:00:01') AND data_maloaithongso = 'DOMUCNUOC';
                    ");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM monitoring_data_today data_maloaithongso = 'DOMUCNUOC';");
            }

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
        { }
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
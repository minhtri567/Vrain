using System.Data;
using Vrain.Server.Models;
using Vrain.Server.Data;
using System.Linq;
using ClosedXML.Excel;
using Hangfire;
using Npgsql;
using Dapper;
using System.Web;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.EntityFrameworkCore;
using System.Configuration;
using Microsoft.Extensions.Configuration;
using System.Globalization;
namespace Vrain.Server.Data
{
    
    public class DataHelper
    {
        private readonly WeatherDbContext _context;
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IConfiguration _configuration;
        public DataHelper(WeatherDbContext context, IWebHostEnvironment hostingEnvironment , IConfiguration configuration)
        {
            _context = context;
            _hostingEnvironment = hostingEnvironment;
            _configuration = configuration;
        }
        public DataTable ConvertToDataTable(IEnumerable<dynamic> weatherData , DateTime startDate, DateTime endDate)
        {

            var dataTable = new DataTable();

            // Lưu trữ ngày duy nhất
            var uniqueDates = weatherData
                .Select(row => row.data_thoigian.Date) // Lấy ngày từ thời gian
                .Distinct()
                .OrderBy(date => date) // Sắp xếp theo ngày
                .ToList();

            // Lưu trữ giờ duy nhất
            var uniqueHours = weatherData
                .Select(row => row.data_thoigian.Hour) // Lấy giờ từ thời gian
                .Distinct()
                .OrderBy(hour => hour) // Sắp xếp theo giờ
                .ToList();

            // Thêm cột cho mã trạm, tên trạm và các cột giờ theo từng ngày
            dataTable.Columns.Add("Mã trạm");
            dataTable.Columns.Add("Tên trạm");

            foreach (var date in uniqueDates)
            {
                foreach (var hour in uniqueHours)
                {
                    // Tạo tên cột cho từng giờ trong ngày
                    dataTable.Columns.Add($"{date:dd/MM/yyyy} - {hour:D2}:00"); // Định dạng giờ là "HH:00"
                }
            }

            // Nhóm dữ liệu theo mã trạm và tên trạm
            var groupedData = weatherData
                .GroupBy(row => new { row.station_id, row.station_name })
                .ToList();

            // Thêm dữ liệu vào DataTable
            foreach (var group in groupedData)
            {
                var newRow = dataTable.NewRow();
                newRow["Mã trạm"] = group.Key.station_id;
                newRow["Tên trạm"] = group.Key.station_name;

                // Lặp qua từng bản ghi trong nhóm
                foreach (var record in group)
                {
                    // Lấy ngày và giờ
                    var dateKey = record.data_thoigian.Date.ToString("dd/MM/yyyy");
                    var hourKey = record.data_thoigian.Hour.ToString("D2"); // Định dạng giờ

                    // Tạo tên cột tương ứng
                    string columnKey = $"{dateKey} - {hourKey}:00";

                    // Gán giá trị đo vào cột ngày và giờ tương ứng
                    newRow[columnKey] = record.data_giatri_sothuc;
                }

                dataTable.Rows.Add(newRow);
            }

            return dataTable;
        }

        public void GenerateExcelFile(DataTable dataTable, string filePath)
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("WeatherData");

                // Load data into worksheet
                worksheet.Cell(1, 1).InsertTable(dataTable);

                // Save workbook
                workbook.SaveAs(filePath);
            }
        }
        [AutomaticRetry(Attempts = 0)]
        public void ProcessWeatherDataReport(weather_stations_report data)
        {
            var startDate = new DateTime(data.ngaybatdau.Year, data.ngaybatdau.Month, data.ngaybatdau.Day, 0, 0, 0);
            var endDate = new DateTime(data.ngayketthuc.Year, data.ngayketthuc.Month, data.ngayketthuc.Day, 23, 59, 59);
            var provincename = data.tinh;
            var lstations = string.Join(",", data.id_station_list.Select(id => $"'{id}'"));
            int ts = int.Parse(data.tansuat);
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            string sql;
            sql = @"
                SELECT 
                    ms.station_id,
                    ms.station_name,
                    ms.tinh,
                    ms.quanhuyen,
                    ms.phuongxa,
                    md.data_giatri_sothuc,
                    md.data_thoigian
                FROM 
                    (
                        SELECT 
                            station_id, 
                            data_giatri_sothuc, 
                            data_thoigian 
                        FROM 
                            monitoring_data_today 
                        WHERE 
                            data_thoigian BETWEEN @startDate AND @endDate
                            AND station_id IN (" + lstations + @")
                            AND data_maloaithongso = 'RAIN'
                        UNION ALL
                        SELECT 
                            station_id, 
                            data_giatri_sothuc, 
                            data_thoigian 
                        FROM 
                            monitoring_data 
                        WHERE 
                            data_thoigian BETWEEN @startDate AND @endDate
                            AND station_id IN (" + lstations + @")
                            AND data_maloaithongso = 'RAIN'
                    ) md
                JOIN 
                    monitoring_stations ms 
                ON 
                    ms.station_id = md.station_id
                WHERE 
                    EXTRACT(HOUR FROM md.data_thoigian) % @ts = 0
                ORDER BY 
                    md.data_thoigian;";


            try
            {
                if(lstations != null) { 
                    using (var connection = new NpgsqlConnection(connectionString))
                    {

                        var weatherData = connection.Query(sql, new { startDate , endDate , ts });

                        var dataTable = ConvertToDataTable(weatherData , startDate, endDate );

                        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                        var random = new Random();
                        string randomString = new string(Enumerable.Repeat(chars, 6)
                            .Select(s => s[random.Next(s.Length)]).ToArray());

                        string namefile = "Báo cáo mưa tỉnh " + data.tinh + " từ ngày " + data.ngaybatdau.ToString("dd-MM-yyyy") + " đến ngày " + data.ngayketthuc.ToString("dd-MM-yyyy") + " " + randomString +".xlsx";
                        var filePath = Path.Combine(_hostingEnvironment.WebRootPath, "File", namefile);

                        GenerateExcelFile(dataTable, filePath);
                        
                        data.file_ref = "/File/"+ namefile;
                        data.name_file = namefile;
                        data.trangthai = 1;
                        _context.Update(data);
                        _context.SaveChanges();

                    }
                }
                else
                {
                    return;
                }

            }
            catch (Exception ex)
            {
                throw;
            }

        }
    }

}

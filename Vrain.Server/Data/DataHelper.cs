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
namespace Vrain.Server.Data
{
    public class DataHelper
    {
        private readonly WeatherDbContext _context;
        private readonly IWebHostEnvironment _hostingEnvironment;
        public DataHelper(WeatherDbContext context, IWebHostEnvironment hostingEnvironment)
        {
            _context = context;
            _hostingEnvironment = hostingEnvironment;
        }
        public DataTable ConvertToDataTable(IEnumerable<dynamic> weatherData)
        {
            var dataTable = new DataTable();
            dataTable.Columns.Add("Mã trạm");
            dataTable.Columns.Add("Tên trạm");
            dataTable.Columns.Add("Tỉnh");
            dataTable.Columns.Add("Huyện");
            dataTable.Columns.Add("Xã");
            dataTable.Columns.Add("Giá trị đo");
            dataTable.Columns.Add("Thời gian đo");

            foreach (var row in weatherData)
            {
                var newRow = dataTable.NewRow();
                newRow["Mã trạm"] = row.station_id;
                newRow["Tên trạm"] = row.station_name;
                newRow["Tỉnh"] = row.tinh;
                newRow["Huyện"] = row.quanhuyen;
                newRow["Xã"] = row.phuongxa;
                newRow["Giá trị đo"] = row.data_giatri_sothuc;
                newRow["Thời gian đo"] = row.data_thoigian.ToString("dd/MM/yyyy HH:mm:ss");

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
            var connectionString = "Host=localhost;Database=weather_data;Username=postgres;Password=12345678";
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

                        var dataTable = ConvertToDataTable(weatherData);

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

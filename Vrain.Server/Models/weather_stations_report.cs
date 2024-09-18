namespace Vrain.Server.Models
{
    public class weather_stations_report
    {
        public int id { get; set; }
        public int order_provine { get; set; }
        public string? tinh { get; set; }
        public string? name_file { get; set; }
        public string? file_ref { get; set; }
        public DateTime request_time { get; set; }
        public DateTime ngaybatdau { get; set; }
        public DateTime ngayketthuc { get; set; }
        public string? tansuat { get; set; }
        public string? email { get; set; }
        public int trangthai { get; set; }
        public string[]? id_station_list { get; set; }
    }
}

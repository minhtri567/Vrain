namespace Vrain.Server.Models
{
    public class monitoring_data
    {
        public int data_id { get; set; }
        public int tskt_id { get; set; }
        public DateTime data_thoigian { get; set; }
        public DateTime? data_thoigiancapnhat { get; set; }
        public float? data_giatri_sothuc { get; set; }
        public string? data_giatri_chuoi { get; set; }
        public string? createby { get; set; }
        public string? data_tonghop { get; set; }
        public string? station_id { get; set; }
        public string? data_maloaithongso { get; set; }

    }
    public class MonitoringDataDto
    {
        public string station_id { get; set; }
        public string? data_thoigian { get; set; }
        public string? data_thoigian_pre { get; set; }
        public float? value { get; set; }
        public float? value_pre { get; set; }
        public string? station_name { get; set; }
        public string? tinh { get; set; }
        public string? luuvuc { get; set; }
        public double lat { get; set; }
        public double lon { get; set; }
        public string? quanhuyen { get; set; }
        public string? phuongxa { get; set; }
        public double? baodong1 { get; set; }
        public double? baodong2 { get; set; }
        public double? baodong3 { get; set; }
        public double? lulichsu { get; set; }
    }
}

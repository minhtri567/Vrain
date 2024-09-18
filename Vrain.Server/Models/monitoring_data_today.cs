namespace Vrain.Server.Models
{
    public class monitoring_data_today
    {
        public int data_id { get; set; } 
        public long tskt_id { get; set; } 
        public DateTime data_thoigian { get; set; } 
        public DateTime? data_thoigiancapnhat { get; set; } 
        public float? data_giatri_sothuc { get; set; } 
        public string? data_giatri_chuoi { get; set; } 
        public string? createby { get; set; } 
        public string? data_tonghop { get; set; } 
        public string? station_id { get; set; }
        public string? data_maloaithongso { get; set; }
    }
}

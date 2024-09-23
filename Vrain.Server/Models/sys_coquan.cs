using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Vrain.Server.Models
{
    public class sys_coquan
    {
        [Key]
        public int cq_id { get; set; }
        public string? cq_ten { get; set; }
        public string? cq_mota { get; set; }
        public string? cq_diachi { get; set; }
        public string? cq_nguoidaidien { get; set; }
        public string? cq_dienthoai { get; set; }
        public string? cq_email { get; set; }
        public string? cq_ghichu { get; set; }
        public bool? cq_active { get; set; } = true;
        public string? cq_loai { get; set; }
        public string? cq_tinhid { get; set; }
        public string? cq_huyenid { get; set; }
        public string? cq_xaid { get; set; }
        public int[]? cq_role_tinhid { get; set; }
    }
}

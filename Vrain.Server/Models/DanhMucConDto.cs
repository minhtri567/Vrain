using System.ComponentModel.DataAnnotations.Schema;

namespace Vrain.Server.Models
{
    public class DanhMucConDto
    {
        public int ldm_id { get; set; }
        public string? ldm_ten { get; set; }
        public string? ldm_ma { get; set; }
        public string? ldm_mota { get; set; }

        [NotMapped]
        public List<DanhMucCon>? DanhMucConList { get; set; }
    }
}

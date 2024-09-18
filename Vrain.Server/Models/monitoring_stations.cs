using Newtonsoft.Json.Linq;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vrain.Server.Models
{
    public class monitoring_stations
    {
        public Guid key { get; set; }
        public string? station_id { get; set; }
        public string? station_name { get; set; }
        public int order_province { get; set; }
        public string? luuvuc { get; set; }
        public string? tinh { get; set; }
        public string? phuongxa { get; set; }
        public string? quanhuyen { get; set; }
        public double? lat { get; set; }
        public double? lon { get; set; }
        public string? description { get; set; }

        [Column(TypeName = "jsonb")]
        public string? infor_data { get; set; }
    }
}

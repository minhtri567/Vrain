using System.ComponentModel.DataAnnotations.Schema;

namespace Vrain.Server.Models
{
    public class map_layers
    {
        public Guid id { get; set; }
        public string? name { get; set; }
        public string? type { get; set; }
        public bool visibility { get; set; } = true;
        public string? source { get; set; }
        public string? source_layer { get; set; }
        [Column(TypeName = "json")]
        public string? layout { get; set; }
        [Column(TypeName = "json")]
        public string? paint { get; set; }
        [Column(TypeName = "json")]
        public string? filter { get; set; }
        public int? min_zoom { get; set; } = 0;
        public int? max_zoom { get; set; } = 22;
        public int? source_id { get; set; }
        public DateTime created_at { get; set; } = DateTime.UtcNow;
        public DateTime updated_at { get; set; } = DateTime.UtcNow;
    }
}

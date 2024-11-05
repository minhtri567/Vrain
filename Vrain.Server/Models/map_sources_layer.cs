namespace Vrain.Server.Models
{
    public class map_sources_layer
    {
        public int id { get; set; }
        public string source_name { get; set; }
        public string type { get; set; }
        public string tiles { get; set; }
        public string bounds { get; set; }
        public string name { get; set; }
        public DateTime created_at { get; set; } = DateTime.UtcNow;
        public DateTime updated_at { get; set; } = DateTime.UtcNow;
    }
}

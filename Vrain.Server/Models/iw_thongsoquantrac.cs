namespace Vrain.Server.Models
{
    public class iw_thongsoquantrac
    {
        public int tskt_id { get; set; }
        public string? tskt_ten { get; set; }
        public int? tskt_stt { get; set; }
        public int? tskt_deletedstatus { get; set; }
        public string? tskt_maloaithongso { get; set; }
        public float? tskt_nguong_min { get; set; }
        public float? tskt_nguong_max { get; set; }
        public Guid works_id { get; set; }
        public bool? tskt_nhaplieuthucong { get; set; }
        public Guid tskt_key { get; set; }
        public string? nguon_dulieu { get; set; }

    }
}

using Npgsql.Internal.TypeHandlers;

namespace Vrain.Server.Models
{
    public class sys_member
    {
        public Guid mem_id { get; set; }
        public string? mem_username { get; set; }
        public string? mem_password { get; set; }
        public string? mem_hoten { get; set; }
        public int? mem_cq_id { get; set; }
        public string? mem_email { get; set; }
        public string? mem_mobile { get; set; }
        public bool mem_active { get; set; }
        public int? mem_stt { get; set; }
        public string? mem_role { get; set; }
        public int? mem_numofdaydisplay { get; set; }
        public string? mem_hourdisplay { get; set; }
        public string? scada_role { get; set; }
        public string? mem_minutedisplay { get; set; }

    }
}

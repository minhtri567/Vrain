using Hangfire;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Vrain.Server.Models;

namespace Vrain.Server.Controllers
{
    [Route("vnrain/[controller]")]
    [ApiController]
    public class MucnuocController : ControllerBase
    {
        private readonly WeatherDbContext _context;

        public MucnuocController (WeatherDbContext context )
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<weather_stations_today>>> Mucnuochientai()
        {
            var timenow = DateTime.Now;
            timenow = new DateTime(timenow.Year, timenow.Month, timenow.Day, timenow.Hour, 0, 0);

            var query = from rainData in _context.monitoring_data_today
                        where rainData.data_thoigian == timenow
                        join tskt in _context.iw_thongsoquantrac
                        on rainData.tskt_id equals tskt.tskt_id
                        where tskt.tskt_maloaithongso == "DOMUCNUOC"
                        join station in _context.monitoring_stations
                        on rainData.station_id equals station.station_id
                        select new
                        {
                            station_id = station.station_id,
                            station_name = station.station_name,
                            value = rainData.data_giatri_sothuc,
                            data_time = rainData.data_thoigian,
                            tinh = station.tinh,
                            luu_vuc = station.luuvuc,
                            lat = station.lat,
                            lon = station.lon,
                            quanhuyen = station.quanhuyen,
                            phuongxa = station.phuongxa,
                            baodong1 = station.baodong1,
                            baodong2 = station.baodong2,
                            baodong3 = station.baodong3,
                            lulichsu = station.lulichsu
                        };

            return Ok(query);
        }
    }
}

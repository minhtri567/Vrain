using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using Vrain.Server.Data;
using Vrain.Server.Models;
using static System.Collections.Specialized.BitVector32;

public class WeatherDbContext : DbContext
{
    public WeatherDbContext(DbContextOptions<WeatherDbContext> options) : base(options)
    {
    }

    public DbSet<weather_stations_today> weather_stations_today { get; set; }
    public DbSet<weather_stations_report> weather_stations_report { get; set;}
    public DbSet<weather_stations> weather_stations { get; set; }
    public DbSet<sys_member> sys_member { get; set; }
    public DbSet<sys_function> sys_function { get; set; }
    public DbSet<monitoring_stations> monitoring_stations { get; set; }
    public DbSet<iw_thongsoquantrac> iw_thongsoquantrac { get; set; }
    public DbSet<DanhMucConDto> sys_danhmuc_phanloai { get; set; }
    public DbSet<DanhMucCon> sys_danhmuc { get; set; }
    public DbSet<sys_coquan> sys_coquan { get; set; }
    public DbSet<sys_role> sys_role { get; set; }
    public DbSet<monitoring_data_today> monitoring_data_today { get; set; }
    public DbSet<monitoring_data> monitoring_data { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<weather_stations_today>().HasKey(w => new { w.id });
        modelBuilder.Entity<weather_stations_report>().HasKey(w => new { w.id });
        modelBuilder.Entity<weather_stations>().HasKey(w => new { w.id });
        modelBuilder.Entity<sys_member>(entity =>
        {
            entity.HasKey(e => e.mem_id);
            entity.Property(e => e.mem_id)
                .HasColumnType("uuid")
                .IsRequired();
        });
        modelBuilder.Entity<sys_function>(entity =>
        {
            entity.HasKey(e => e.fn_id);
            entity.Property(e => e.fn_uuid)
                .HasColumnType("uuid")
                .IsRequired();
        });
        modelBuilder.Entity<monitoring_stations>().HasKey(w => new { w.key , w.station_id });

        modelBuilder.Entity<DanhMucConDto>().HasKey(w => new { w.ldm_id });
        modelBuilder.Entity<DanhMucCon>().HasKey(w => new { w.dm_id });
        modelBuilder.Entity<sys_coquan>().HasKey(w => new { w.cq_id });
        modelBuilder.Entity<sys_role>().HasKey(w => new { w.role_id });
        modelBuilder.Entity<monitoring_data_today>().HasKey(w => new { w.data_id });
        modelBuilder.Entity<monitoring_data>().HasKey(w => new { w.data_id });
        modelBuilder.Entity<iw_thongsoquantrac>().HasKey(w => new { w.tskt_id });
    }


}

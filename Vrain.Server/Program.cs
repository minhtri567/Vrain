
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Client;
using Quartz;
using System;
using System.Net.Http;
using Vrain.Server.Data;
using Vrain.Server.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Swagger;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IPasswordHasher<sys_member>, PasswordHasher<sys_member>>();

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "My API",
        Version = "v1"
    });
});



builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddQuartz(q =>
{
    q.UseMicrosoftDependencyInjectionJobFactory();

    // Create a trigger for the job
    var jobKey = new JobKey("FetchWeatherDataJob");
    q.AddJob<FetchWeatherDataJob>(opts => opts.WithIdentity(jobKey));

    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("FetchWeatherDataJob-trigger")
        //.WithCronSchedule("0 * * ? * *")); // Run every minute
        //.WithCronSchedule("0 */2 * * * ?")); // Run every 2 minutes
        .WithCronSchedule("0 0 * * * ?")); // Run every hour
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);
builder.Services.AddHttpClient<FetchWeatherDataJob>();
builder.Services.AddScoped<FetchWeatherDataJob>();
builder.Services.AddTransient<DataHelper>();
builder.Services.AddDbContext<WeatherDbContext>(options => {
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking) ;
    });
builder.Services.AddHttpClient();

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseDefaultTypeSerializer()
    .UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 5; // Điều chỉnh số lượng workers xuống còn 5
    options.Queues = new[] { "default" }; // Lắng nghe thêm hàng đợi 'critical'
    options.ShutdownTimeout = TimeSpan.FromSeconds(10); // Thay đổi thời gian chờ tắt server
    options.SchedulePollingInterval = TimeSpan.FromMinutes(3); // Thay đổi khoảng thời gian polling
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var key = Encoding.ASCII.GetBytes("this_is_a_very_secure_key_that_is_at_least_32_characters_long");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        RoleClaimType = ClaimTypes.Role // Đảm bảo claim role chính xác
    };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ROLE_QUANTRI", policy => policy.RequireRole("ROLE_QUANTRI"));
    options.AddPolicy("ROLE_QLDULIEU", policy => policy.RequireRole("ROLE_QLDULIEU"));
    options.AddPolicy("ROLE_LAPKEHOACH", policy => policy.RequireRole("ROLE_LAPKEHOACH"));
    options.AddPolicy("ROLE_VANHANHHETHONG", policy => policy.RequireRole("ROLE_VANHANHHETHONG"));
    options.AddPolicy("ROLE_BAOCAOTHONGKE", policy => policy.RequireRole("ROLE_BAOCAOTHONGKE"));
});
var app = builder.Build();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseDeveloperExceptionPage();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1"); 
    });
}

app.UseCors("AllowSpecificOrigin");

app.MapGet("/swagger/insertdata", async (HttpContext context, ISwaggerProvider swaggerProvider) =>
{
    // Lấy tài liệu Swagger gốc
    var swaggerDoc = swaggerProvider.GetSwagger("v1");

    // Tạo một đối tượng OpenApiPaths để chỉ chứa các path cụ thể
    var filteredPaths = new OpenApiPaths();
    foreach (var path in swaggerDoc.Paths)
    {
        if (path.Key.Contains("InsertDataMonitoring"))
        {
            filteredPaths.Add(path.Key, path.Value);
        }
    }

    // Tạo tài liệu Swagger mới
    var customSwaggerDoc = new OpenApiDocument
    {
        Info = swaggerDoc.Info,
        Paths = filteredPaths,
        Components = new OpenApiComponents
        {
            Schemas = new Dictionary<string, OpenApiSchema>
            {
                { "dataweathersinsert", swaggerDoc.Components.Schemas["dataweathersinsert"] }
            }
        }
    };

    // Trả về tài liệu Swagger tùy chỉnh dưới dạng JSON
    context.Response.ContentType = "application/json";
    await context.Response.WriteAsJsonAsync(customSwaggerDoc);
});

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

//app.UseHangfireServer();

app.Run();

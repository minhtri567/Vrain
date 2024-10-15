using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Vrain.Server.Data;
using Vrain.Server.Models;

namespace Vrain.Server.Controllers
{
    [Route("vnrain/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly WeatherDbContext _context;
        private readonly IPasswordHasher<sys_member> _passwordHasher;

        public AccountController(WeatherDbContext context, IPasswordHasher<sys_member> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [HttpGet("allaccount")]
        public async Task<ActionResult<IEnumerable<sys_coquan>>> Getallaccount()
        {

            var allaccount = await _context.sys_member
            .Select(s => new {
                s.mem_id,
                s.mem_username, 
                s.mem_hoten,
                s.mem_cq_id,
                s.mem_mobile,
                s.mem_active,
                s.mem_stt,
                s.mem_role,
                s.mem_numofdaydisplay,
                s.mem_hourdisplay,
                s.scada_role,
                s.mem_minutedisplay,
                s.mem_email 
            })
            .OrderBy(s => s.mem_id)
            .ToListAsync();

            return Ok(allaccount);
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] sys_member model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (model.mem_id == Guid.Empty)
            {
                // Kiểm tra xem user_login đã tồn tại hay chưa
                if (await _context.sys_member.AnyAsync(a => a.mem_username == model.mem_username))
                {
                    return BadRequest("User already exists.");
                }

                var newmember =  new sys_member{
                    mem_username = model.mem_username,
                    mem_password = _passwordHasher.HashPassword(model, model.mem_password),
                    mem_hoten = model.mem_hoten,
                    mem_cq_id = model.mem_cq_id,
                    mem_email = model.mem_email,
                    mem_mobile = model.mem_mobile,
                    mem_active = model.mem_active,
                    mem_stt = model.mem_stt,
                    mem_role = model.mem_role,
                    scada_role = model.scada_role

                };

                // Thêm tài khoản mới vào cơ sở dữ liệu
                _context.sys_member.Add(newmember);
            }
            else
            {
                // Tìm kiếm thành viên hiện có
                var existingMember = await _context.sys_member.FindAsync(model.mem_id);
                if (existingMember == null)
                {
                    return NotFound("Member not found.");
                }

                // Cập nhật thông tin thành viên
                existingMember.mem_username = model.mem_username;
                existingMember.mem_hoten = model.mem_hoten;
                existingMember.mem_cq_id = model.mem_cq_id;
                existingMember.mem_email = model.mem_email;
                existingMember.mem_mobile = model.mem_mobile;
                existingMember.mem_active = model.mem_active;
                existingMember.mem_stt = model.mem_stt;
                existingMember.mem_role = model.mem_role;
                existingMember.scada_role = model.scada_role;

                _context.sys_member.Update(existingMember);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = model.mem_id == Guid.Empty ? "User registered successfully." : "User updated successfully." });
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] sys_member model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Tìm user từ bảng sys_member
            var account = await _context.sys_member.SingleOrDefaultAsync(a => a.mem_username == model.mem_username);

            if (account == null)
            {
                return Unauthorized("Không tìm thấy tài khoản");
            }

            // Kiểm tra mật khẩu
            var result = _passwordHasher.VerifyHashedPassword(account, account.mem_password, model.mem_password);
            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized("Mật khẩu không đúng");
            }

            var memberRoleData = await _context.sys_role.Where(s => s.role_cq_id == account.mem_cq_id).ToListAsync();
            var memberRoletinhid = await _context.sys_coquan
                .Where(s => s.cq_id == account.mem_cq_id)
                .Select(s => s.cq_role_tinhid)
                .FirstOrDefaultAsync();

            // Tạo JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("this_is_a_very_secure_key_that_is_at_least_32_characters_long");
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, account.mem_username)
            };

            // Add each role as a separate claim
            claims.AddRange(memberRoleData.Select(r => new Claim(ClaimTypes.Role, r.role_ma)));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(24),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // Trả về token hoặc thông tin người dùng (ở đây tôi chỉ trả về thông tin người dùng)
            return Ok(new { 
                Token = account,
                Role = tokenString,
                Lidtinh = memberRoletinhid
            });
        }
        [HttpPost("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Tìm user từ bảng account_ws
            var account = await _context.sys_member.SingleOrDefaultAsync(a => a.mem_username == model.user_login);

            if (account == null)
            {
                return NotFound("User not found");
            }

            // Xác minh mật khẩu hiện tại
            var result = _passwordHasher.VerifyHashedPassword(account, account.mem_password, model.current_password);
            if (result == PasswordVerificationResult.Failed)
            {
                return BadRequest("Current password is incorrect");
            }

            // Hash mật khẩu mới và lưu vào cơ sở dữ liệu
            account.mem_password = _passwordHasher.HashPassword(account, model.new_password);
            _context.sys_member.Update(account);
            await _context.SaveChangesAsync();

            return Ok("Password changed successfully");
        }

        [Authorize(Policy = "ROLE_QLDULIEU")]
        [HttpDelete("deletenguoidung")]
        public async Task<IActionResult> Deleteaccount(Guid ids)
        {
            var reportsToDelete = await _context.sys_member.Where(r => r.mem_id == ids).ToListAsync();

            if (reportsToDelete == null || reportsToDelete.Count == 0)
            {
                return NotFound("No matching reports found");
            }

            _context.sys_member.RemoveRange(reportsToDelete);
            await _context.SaveChangesAsync();

            return Ok("Xóa tài khoản thành công !");
        }
    }

    public class ChangePasswordModel
    {
        public string user_login { get; set; }
        public string current_password { get; set; }
        public string new_password { get; set; }
    }
}

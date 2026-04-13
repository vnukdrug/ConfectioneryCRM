using Confectionery.App.DTOs;
using Confectionery.Data;
using Confectionery.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[Authorize]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Filial)
                .FirstOrDefaultAsync(u => u.Login == dto.Login);

            if (user == null)
            {
                return Unauthorized(new { message = "Неверный логин или пароль" });
            }

            bool isPasswordValid = false;
            bool needsRehash = false;

            if (user.PasswordHash.StartsWith("$2a$") || user.PasswordHash.StartsWith("$2b$") || user.PasswordHash.StartsWith("$2y$"))
            {
                isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            }
            else
            {
                isPasswordValid = (user.PasswordHash == dto.Password);

                if (isPasswordValid)
                {
                    needsRehash = true;
                }
            }

            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Неверный логин или пароль" });
            }

            if (needsRehash)
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Пароль пользователя {user.Login} был перехэширован");
            }

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Login = user.Login,
                Role = user.Role,
                FilialId = user.FilialId,
                Token = token
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при входе: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка сервера" });
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        try
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Login == dto.Login);

            if (existingUser != null)
            {
                return Conflict(new { message = "Пользователь с таким логином уже существует" });
            }

            var user = new User
            {
                FullName = dto.FullName,
                Login = dto.Login,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                FilialId = dto.FilialId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Login = user.Login,
                Role = user.Role,
                FilialId = user.FilialId,
                Token = token
            });
        }
        catch (Exception ex)
        {


            Console.WriteLine($"Ошибка при регистрации: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка сервера" });
        }
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Login),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("FullName", user.FullName)
        };

        if (user.FilialId.HasValue)
        {
            claims.Add(new Claim("FilialId", user.FilialId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "super-secret-key-for-development-1234567890"));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "ConfectioneryApp",
            audience: _configuration["Jwt:Audience"] ?? "ConfectioneryClient",
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
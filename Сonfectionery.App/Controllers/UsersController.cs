using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Confectionery.Data;
using Confectionery.Data.Models;
using Confectionery.App.DTOs;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetUsers()
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.Filial)
                .Select(u => new EmployeeDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Login = u.Login,
                    Role = u.Role,
                    Filial = u.Filial != null ? u.Filial.Name : "Все филиалы",
                    FilialId = u.FilialId
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке пользователей: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке пользователей" });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EmployeeDto>> GetUser(int id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Filial)
                .Where(u => u.Id == id)
                .Select(u => new EmployeeDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Login = u.Login,
                    Role = u.Role,
                    Filial = u.Filial != null ? u.Filial.Name : "Все филиалы",
                    FilialId = u.FilialId
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "Пользователь не найден" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке пользователя: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке пользователя" });
        }
    }
    [HttpGet("filial/{filialId}")]
    [Authorize(Roles = "Admin,Director")]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetUsersByFilial(int filialId)
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.Filial)
                .Where(u => u.FilialId == filialId)
                .Select(u => new EmployeeDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Login = u.Login,
                    Role = u.Role,
                    Filial = u.Filial != null ? u.Filial.Name : "Все филиалы",
                    FilialId = u.FilialId
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке пользователей по филиалу: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке пользователей" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<User>> CreateUser(CreateEmployeeDto dto)
    {
        try
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Login == dto.Login);

            if (existingUser != null)
                return Conflict(new { message = "Пользователь с таким логином уже существует" });

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

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при создании пользователя: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при создании пользователя" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(int id, CreateEmployeeDto dto)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Пользователь не найден" });
            var duplicate = await _context.Users
                .FirstOrDefaultAsync(u => u.Login == dto.Login && u.Id != id);

            if (duplicate != null)
                return Conflict(new { message = "Пользователь с таким логином уже существует" });

            user.FullName = dto.FullName;
            user.Login = dto.Login;
            user.Role = dto.Role;
            user.FilialId = dto.FilialId;

            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при обновлении пользователя: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при обновлении пользователя" });
        }
    }

    [HttpPut("{id}/filial")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserFilial(int id, [FromBody] UpdateUserFilialDto dto)
    {
        try
        {
            Console.WriteLine($"Обновление филиала пользователя {id} на {dto.FilialId}");

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Пользователь не найден" });

            if (dto.FilialId.HasValue)
            {
                var filial = await _context.Filials.FindAsync(dto.FilialId.Value);
                if (filial == null)
                    return BadRequest(new { message = "Филиал не найден" });
            }

            user.FilialId = dto.FilialId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Филиал обновлен",
                userId = user.Id,
                filialId = user.FilialId
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при обновлении филиала: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при обновлении филиала" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.StockMovements)
                .Include(u => u.Sales)
                .Include(u => u.ProductionPlans)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Пользователь не найден" });

            if (user.StockMovements != null && user.StockMovements.Any())
                return BadRequest(new { message = "Нельзя удалить пользователя, у которого есть движения товаров" });

            if (user.Sales != null && user.Sales.Any())
                return BadRequest(new { message = "Нельзя удалить пользователя, у которого есть продажи" });

            if (user.ProductionPlans != null && user.ProductionPlans.Any())
                return BadRequest(new { message = "Нельзя удалить пользователя, у которого есть планы производства" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Пользователь успешно удален" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при удалении пользователя: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при удалении пользователя" });
        }
    }

    [HttpGet("current")]
    public async Task<ActionResult<EmployeeDto>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized(new { message = "Пользователь не авторизован" });

            var user = await _context.Users
                .Include(u => u.Filial)
                .Where(u => u.Id == userId)
                .Select(u => new EmployeeDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Login = u.Login,
                    Role = u.Role,
                    Filial = u.Filial != null ? u.Filial.Name : "Все филиалы",
                    FilialId = u.FilialId
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "Пользователь не найден" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Ошибка при загрузке текущего пользователя: {ex.Message}");
            return StatusCode(500, new { message = "Ошибка при загрузке пользователя" });
        }
    }
}
using Confectionery.App.DTOs;
using Confectionery.Data;
using Confectionery.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Confectionery.App.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmployeesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
    {
        var employees = await _context.Users
            .Include(u => u.Filial)
            .Select(u => new EmployeeDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Login = u.Login,
                Role = u.Role,
                Filial = u.Filial != null ? u.Filial.Name : "Все филиалы"
            })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDto>> GetEmployee(int id)
    {
        var employee = await _context.Users
            .Include(u => u.Filial)
            .Where(u => u.Id == id)
            .Select(u => new EmployeeDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Login = u.Login,
                Role = u.Role,
                Filial = u.Filial != null ? u.Filial.Name : "Все филиалы"
            })
            .FirstOrDefaultAsync();

        if (employee == null)
            return NotFound();

        return Ok(employee);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee(CreateEmployeeDto dto)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Login == dto.Login);

        if (existingUser != null)
        {
            return Conflict(new { message = "Пользователь с таким логином уже существует" });
        }

        var employee = new User
        {
            FullName = dto.FullName,
            Login = dto.Login,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            FilialId = dto.FilialId
        };

        _context.Users.Add(employee);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, employee);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(int id, CreateEmployeeDto dto)
    {
        var employee = await _context.Users.FindAsync(id);
        if (employee == null)
            return NotFound();

        employee.FullName = dto.FullName;
        employee.Login = dto.Login;
        employee.Role = dto.Role;
        employee.FilialId = dto.FilialId;

        if (!string.IsNullOrEmpty(dto.Password))
        {
            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var employee = await _context.Users.FindAsync(id);
        if (employee == null)
            return NotFound();

        _context.Users.Remove(employee);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}